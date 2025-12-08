/**
 * OpenAI API integration for chat intake and summary generation
 * Handles conversational intake and structured summary extraction
 */

import OpenAI from 'openai';
import { ClinicalSummary } from './store';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

/**
 * System prompt for psychiatric intake conversation
 * This can be edited to refine the intake process
 */
export const INTAKE_SYSTEM_PROMPT = `You are a compassionate, professional psychiatric intake assistant. Your role is to guide patients through a comprehensive intake assessment in a warm, non-judgmental manner.

Your objectives:
1. Build rapport and make the patient feel comfortable
2. Gather comprehensive clinical information including:
   - Chief complaint and presenting concerns
   - Symptom duration, frequency, and intensity
   - Prior psychiatric diagnoses and treatments
   - Current medications (prescription, OTC, supplements)
   - Safety concerns (suicidal ideation, self-harm, hallucinations, delusions, aggression)
   - Functional impact on work, relationships, daily activities
   - Treatment preferences and accessibility needs

3. Ask questions naturally in conversation flow - don't rapid-fire questions
4. Be sensitive to trauma and mental health stigma
5. If safety concerns arise, acknowledge them with empathy and note them for clinician review
6. Keep responses concise but warm (2-3 sentences typically)

Do NOT:
- Provide diagnoses or treatment recommendations
- Minimize safety concerns
- Make promises about treatment outcomes

Start by introducing yourself and asking how you can help today.`;

/**
 * Generate chat completion for intake conversation
 * @param messages - Conversation history
 * @returns Assistant response
 */
export async function generateChatResponse(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[]
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: INTAKE_SYSTEM_PROMPT },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0]?.message?.content || 'I apologize, I encountered an error. Could you please rephrase that?';
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to generate response. Please check your API key and try again.');
  }
}

/**
 * Extract structured clinical summary from conversation
 * @param messages - Full conversation history
 * @returns Structured ClinicalSummary object
 */
export async function extractClinicalSummary(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[]
): Promise<ClinicalSummary> {
  const extractionPrompt = `Based on the following psychiatric intake conversation, extract and structure the clinical information into a JSON object following this exact schema:

{
  "chiefComplaint": "Main presenting concern in patient's words",
  "symptoms": ["array", "of", "specific", "symptoms"],
  "symptomDuration": "Duration (e.g., '3 months', '2 years')",
  "severity": "mild" | "moderate" | "severe",
  "priorDiagnoses": ["array", "of", "prior", "diagnoses"],
  "currentMedications": ["array", "of", "current", "medications"],
  "medicationHistory": "Brief history of medication trials",
  "safetyConcerns": {
    "suicidalIdeation": boolean,
    "selfHarm": boolean,
    "hallucinations": boolean,
    "delusions": boolean,
    "aggression": boolean,
    "notes": "Additional safety notes"
  },
  "functionalImpact": {
    "work": "Impact on work/school",
    "relationships": "Impact on relationships",
    "dailyActivities": "Impact on daily activities"
  },
  "preferences": {
    "therapistGender": "optional preference",
    "treatmentApproach": ["array", "of", "preferences"],
    "availability": "Preferred appointment times",
    "otherNotes": "Other preferences or notes"
  },
  "triageLevel": "normal" | "urgent" | "emergency"
}

Conversation:
${messages.map(m => `${m.role}: ${m.content}`).join('\n\n')}

Return ONLY valid JSON, no additional text. Use empty strings/arrays for missing information.`;

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a clinical documentation assistant. Extract structured data from conversations and return only valid JSON.',
        },
        { role: 'user', content: extractionPrompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const summaryText = response.choices[0]?.message?.content || '{}';
    const summary = JSON.parse(summaryText) as ClinicalSummary;

    // Validate and set defaults
    return {
      chiefComplaint: summary.chiefComplaint || '',
      symptoms: Array.isArray(summary.symptoms) ? summary.symptoms : [],
      symptomDuration: summary.symptomDuration || '',
      severity: ['mild', 'moderate', 'severe'].includes(summary.severity)
        ? summary.severity
        : 'mild',
      priorDiagnoses: Array.isArray(summary.priorDiagnoses) ? summary.priorDiagnoses : [],
      currentMedications: Array.isArray(summary.currentMedications) ? summary.currentMedications : [],
      medicationHistory: summary.medicationHistory || '',
      safetyConcerns: {
        suicidalIdeation: summary.safetyConcerns?.suicidalIdeation || false,
        selfHarm: summary.safetyConcerns?.selfHarm || false,
        hallucinations: summary.safetyConcerns?.hallucinations || false,
        delusions: summary.safetyConcerns?.delusions || false,
        aggression: summary.safetyConcerns?.aggression || false,
        notes: summary.safetyConcerns?.notes || '',
      },
      functionalImpact: {
        work: summary.functionalImpact?.work || '',
        relationships: summary.functionalImpact?.relationships || '',
        dailyActivities: summary.functionalImpact?.dailyActivities || '',
      },
      preferences: {
        therapistGender: summary.preferences?.therapistGender,
        treatmentApproach: Array.isArray(summary.preferences?.treatmentApproach)
          ? summary.preferences.treatmentApproach
          : [],
        availability: summary.preferences?.availability,
        otherNotes: summary.preferences?.otherNotes || '',
      },
      triageLevel: ['normal', 'urgent', 'emergency'].includes(summary.triageLevel)
        ? summary.triageLevel
        : 'normal',
    };
  } catch (error) {
    console.error('Summary extraction error:', error);
    throw new Error('Failed to extract clinical summary. Please try again.');
  }
}

/**
 * Detect safety risks in conversation
 * Uses both keyword matching and LLM classification
 * @param messages - Conversation history
 * @returns Safety risk assessment
 */
export async function detectSafetyRisks(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[]
): Promise<{
  riskLevel: 'low' | 'moderate' | 'high' | 'emergency';
  flags: string[];
  details: string;
}> {
  const conversationText = messages
    .filter(m => m.role === 'user')
    .map(m => m.content)
    .join('\n')
    .toLowerCase();

  // Keyword-based detection
  const emergencyKeywords = ['kill myself', 'end my life', 'suicide', 'suicidal', 'harm myself'];
  const highRiskKeywords = ['hurt myself', 'self harm', 'cutting', 'overdose', 'plan'];
  const moderateRiskKeywords = ['hopeless', 'no point', 'wish I was dead', 'better off dead'];

  let keywordFlags: string[] = [];
  let keywordLevel: 'low' | 'moderate' | 'high' | 'emergency' = 'low';

  if (emergencyKeywords.some(keyword => conversationText.includes(keyword))) {
    keywordLevel = 'emergency';
    keywordFlags.push('Emergency-level safety concerns detected');
  } else if (highRiskKeywords.some(keyword => conversationText.includes(keyword))) {
    keywordLevel = 'high';
    keywordFlags.push('High-risk safety concerns detected');
  } else if (moderateRiskKeywords.some(keyword => conversationText.includes(keyword))) {
    keywordLevel = 'moderate';
    keywordFlags.push('Moderate safety concerns detected');
  }

  // LLM-based risk assessment
  try {
    const riskPrompt = `Assess the safety risk level in this psychiatric intake conversation. Consider:
- Suicidal ideation, intent, or plans
- Self-harm behaviors or thoughts
- Harm to others
- Psychotic symptoms with risk
- Substance use with risk behaviors

Return JSON:
{
  "riskLevel": "low" | "moderate" | "high" | "emergency",
  "flags": ["array", "of", "specific", "concerns"],
  "details": "brief explanation"
}

Conversation:
${messages.map(m => `${m.role}: ${m.content}`).join('\n\n')}`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a psychiatric safety assessment assistant. Return only valid JSON.',
        },
        { role: 'user', content: riskPrompt },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    const assessment = JSON.parse(response.choices[0]?.message?.content || '{}');

    // Use higher of keyword or LLM assessment
    const levels = ['low', 'moderate', 'high', 'emergency'];
    const keywordIndex = levels.indexOf(keywordLevel);
    const llmIndex = levels.indexOf(assessment.riskLevel || 'low');
    const finalLevel = levels[Math.max(keywordIndex, llmIndex)] as typeof keywordLevel;

    return {
      riskLevel: finalLevel,
      flags: [...keywordFlags, ...(assessment.flags || [])],
      details: assessment.details || '',
    };
  } catch (error) {
    console.error('Safety risk detection error:', error);
    // Fall back to keyword detection
    return {
      riskLevel: keywordLevel,
      flags: keywordFlags.length > 0 ? keywordFlags : ['No immediate safety concerns detected'],
      details: keywordFlags.join('; ') || 'Standard intake assessment',
    };
  }
}

