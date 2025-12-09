import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { SUMMARY_AGENT_SYSTEM_PROMPT, getPHQ9Severity } from '@/lib/agents/summary-agent';

/**
 * Summary API Route
 * 
 * Generates a clinical summary from the intake conversation and PHQ-9 data.
 * Uses GPT-4 to create a structured, factual clinical summary.
 */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { conversationHistory, phq9Score } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build prompt for summary generation
    const conversationText = conversationHistory
      .map((msg: { role: string; content: string }) => `${msg.role}: ${msg.content}`)
      .join('\n\n');

    const phq9Severity = getPHQ9Severity(phq9Score);

    const summaryPrompt = `Based on the following intake conversation and PHQ-9 assessment, generate a structured clinical summary.

PHQ-9 Score: ${phq9Score} / 27
PHQ-9 Severity: ${phq9Severity}

Conversation:
${conversationText}

Please generate a comprehensive clinical summary with the following structure:
- Chief Complaint
- History of Present Illness
- Past Psychiatric History
- Family History
- Medical History
- Substance Use
- Mental Status
- Social/Occupational Functioning
- PHQ-9 Assessment Results

Format the response as a JSON object with these fields:
{
  "chiefComplaint": "...",
  "historyOfPresentIllness": "...",
  "pastPsychiatricHistory": "...",
  "familyHistory": "...",
  "medicalHistory": "...",
  "substanceUse": "...",
  "mentalStatus": "...",
  "functioning": "...",
  "phq9Severity": "${phq9Severity}",
  "additionalNotes": "..."
}

Return only valid JSON, no additional text.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: SUMMARY_AGENT_SYSTEM_PROMPT },
        { role: 'user', content: summaryPrompt },
      ],
      temperature: 0.5,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    
    // Try to parse JSON, fallback to structured text parsing if needed
    let summaryData;
    try {
      summaryData = JSON.parse(responseText);
    } catch (parseError) {
      // If JSON parsing fails, extract structured data from text
      summaryData = {
        chiefComplaint: extractSection(responseText, 'Chief Complaint'),
        historyOfPresentIllness: extractSection(responseText, 'History of Present Illness'),
        pastPsychiatricHistory: extractSection(responseText, 'Past Psychiatric History'),
        familyHistory: extractSection(responseText, 'Family History'),
        medicalHistory: extractSection(responseText, 'Medical History'),
        substanceUse: extractSection(responseText, 'Substance Use'),
        mentalStatus: extractSection(responseText, 'Mental Status'),
        functioning: extractSection(responseText, 'Social/Occupational Functioning'),
        phq9Severity: phq9Severity,
        additionalNotes: extractSection(responseText, 'Additional Notes') || '',
      };
    }

    // Add PHQ-9 score
    summaryData.phq9Score = phq9Score;

    return new Response(JSON.stringify(summaryData), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Summary API error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to generate summary' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Helper function to extract section content from text
 */
function extractSection(text: string, sectionName: string): string {
  const regex = new RegExp(`${sectionName}[:\\-]?\\s*([^\\n]+(?:\\n(?!\\w+[:\\-])[^\\n]+)*)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}
