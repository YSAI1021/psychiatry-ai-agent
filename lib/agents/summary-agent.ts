/**
 * Summary Agent
 * 
 * Responsibilities:
 * - Generates natural-language clinical summary from intake data
 * - Uses psychiatric interview format (see attached table)
 * - Format: "A [age]-year-old [gender] presenting with..."
 * - Includes symptoms with severity and duration
 * - Mentions prior diagnoses, medications, therapy
 * - Includes functional and safety impact
 * - Confirms summary with patient before proceeding
 * - NO JSON display - text blocks only
 */

import { openai } from '../openai';
import { IntakeData, ClinicalSummary } from '../store';

export interface SummaryAgentResponse {
  summary: ClinicalSummary;
  message: string;
}

/**
 * Get PHQ-9 severity interpretation from score
 * Mapping:
 * 0-4: Minimal
 * 5-9: Mild
 * 10-14: Moderate
 * 15-19: Moderately Severe
 * 20-27: Severe
 */
function getPHQ9Severity(score: number): string {
  if (score >= 0 && score <= 4) return 'Minimal';
  if (score >= 5 && score <= 9) return 'Mild';
  if (score >= 10 && score <= 14) return 'Moderate';
  if (score >= 15 && score <= 19) return 'Moderately Severe';
  if (score >= 20 && score <= 27) return 'Severe';
  return 'Unknown';
}

/**
 * Generate clinical summary using psychiatric interview format
 * 
 * Format based on Table 19.2 Psychiatric Interview:
 * 1. Greeting
 * 2. Identifying information
 * 3. Chief complaint
 * 4. History of present illness
 * 5. Past psychiatric history
 * 6. Personal history
 * 7. Family history
 * 8. Medical history
 * 9. Substance use history
 * 10. Mental status examination
 */
export async function generateClinicalSummary(
  intakeData: IntakeData,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<SummaryAgentResponse> {
  if (!openai) {
    throw new Error('OpenAI client not configured');
  }

  const phq9Score = intakeData.phq9Score || 0;
  const phq9Severity = getPHQ9Severity(phq9Score);

  const systemPrompt = `You are a professional psychiatric summary agent. Generate a concise but complete clinical summary in natural sentence format.

AGENT LANGUAGE STYLE:
- Use a simple, human, conversational tone without being clinical or overly formal
- Avoid repeating user responses verbatim
- Avoid over-apologizing or long technical explanations
- Focus on helpful transitions and warm clarity

REQUIRED STRUCTURE (based on DSM-5 psychiatric interview format):
1. Identifying information: "A [age]-year-old [gender] presenting with [chief complaint]..."
2. Chief complaint: Primary reason for seeking care (1-2 sentences)
3. History of present illness: Current symptoms WITH duration and severity for each symptom
   - For each symptom mentioned, include: symptom name, how long it's been present, and severity level
   - Example: "Patient reports low mood for 3 months, poor concentration for 2 months (moderate severity)..."
4. Past psychiatric history: Prior diagnoses, treatments, medications, hospitalizations (1-2 sentences if applicable)
5. Personal & family history: Brief relevant background, family psychiatric/medical history (if available)
6. Medical/substance use history: Relevant medical conditions, alcohol, drugs, tobacco use (if mentioned)
7. Mental status observations: Observable or inferred mental status (brief, professional)
8. Symptoms with duration and severity: List all symptoms with specific durations and severity levels
9. PHQ-9 Screening:
   - Total Score: ${phq9Score} / 27
   - Severity: ${phq9Severity} Depression
   - Include this as a separate section in the clinical summary with the exact format:
     "PHQ-9 Screening: Total Score: ${phq9Score} / 27. Severity: ${phq9Severity} Depression."
   - This section should appear in the summary text for provider reference
10. Safety concerns: Suicidal ideation, self-harm, harm to others (if any, be specific)
11. Functional impact: How symptoms affect daily life, work, relationships (1-2 sentences)
12. Preferences: Any treatment preferences, therapy type preferences mentioned

WRITING REQUIREMENTS:
- Write in natural, flowing sentences (not bullet points)
- Be concise: Aim for 8-12 sentences total
- Use professional clinical language appropriate for psychiatrist review
- NO JSON formatting - plain text only
- Third person narrative style
- If information is not available, omit that section (don't say "not provided")`;

  const dataContext = `
Intake Data:
- Chief Complaint: ${intakeData.chiefComplaint || 'Not provided'}
- History of Present Illness: ${intakeData.historyOfPresentIllness || 'Not provided'}
- Past Psychiatric History: ${intakeData.pastPsychiatricHistory || 'Not provided'}
- Medications: ${intakeData.medications || 'Not provided'} (Duration: ${intakeData.medicationDuration || 'Not specified'})
- Safety Concerns: ${intakeData.safetyConcerns || 'None reported'}
- Substance Use: ${intakeData.substanceUse || 'None reported'}
- Functional Impact: ${intakeData.functionalImpact || 'Not provided'}
- PHQ-9 Score: ${intakeData.phq9Score || 'Not completed'}
- Patient Age: ${intakeData.patientAge || 'Not provided'}
- Patient Gender: ${intakeData.patientGender || 'Not provided'}
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: dataContext + '\n\nPlease generate the clinical summary.' },
      ],
      temperature: 0.5, // Lower temperature for more consistent, clinical output
      max_tokens: 600, // Reduced for more concise summaries
    });

    const summaryText = response.choices[0]?.message?.content || 'Unable to generate summary.';

    const summary: ClinicalSummary = {
      text: summaryText,
      phq9Score: intakeData.phq9Score || 0,
      patientAge: intakeData.patientAge,
      patientGender: intakeData.patientGender,
      confirmed: false,
    };

    return {
      summary,
      message: `I've generated your clinical summary. Please review it and let me know if you'd like any changes. Once confirmed, we can proceed to finding a psychiatrist.`,
    };
  } catch (error) {
    console.error('Error generating clinical summary:', error);
    throw error;
  }
}

