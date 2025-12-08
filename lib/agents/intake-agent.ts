/**
 * Intake Agent
 * 
 * Responsibilities:
 * - Asks structured clinical questions
 * - Collects required fields (chief complaint, HPI, past history, medications, safety, etc.)
 * - Administers PHQ-9 screening
 * - Tracks completion percentage (must reach ≥75% before handoff)
 * - Keeps questions concise and clinical, avoiding long empathic reflections
 */

import { openai, AgentType } from '../openai';
import { IntakeData } from '../store';

const REQUIRED_FIELDS = [
  'chiefComplaint',
  'historyOfPresentIllness',
  'pastPsychiatricHistory',
  'medications',
  'safetyConcerns',
  'substanceUse',
  'functionalImpact',
] as const;

export interface IntakeAgentResponse {
  message: string;
  intakeData: Partial<IntakeData>;
  shouldContinue: boolean;
  completionPercentage: number;
  needsPHQ9: boolean; // Flag to indicate PHQ-9 still needed
  patientReady: boolean; // Flag to indicate if patient confirmed readiness
}

/**
 * Calculate completion percentage based on filled fields
 * CRITICAL: PHQ-9 (all 9 items) is REQUIRED before proceeding to summary
 */
export function calculateCompletion(data: Partial<IntakeData>): number {
  let filled = 0;
  const total = REQUIRED_FIELDS.length + 1; // +1 for PHQ-9 (required)
  
  REQUIRED_FIELDS.forEach(field => {
    if (data[field] && String(data[field]).trim().length > 0) {
      filled++;
    }
  });
  
  // PHQ-9 is REQUIRED - check if all 9 questions are answered
  const phq9Complete = data.phq9Responses && data.phq9Responses.length === 9;
  if (phq9Complete) {
    filled++;
  }
  
  return Math.round((filled / total) * 100);
}

/**
 * Check if intake is ready for summary agent
 * Requirements: 
 * - All 9 PHQ-9 items must be completed
 * - Patient must confirm readiness
 * - At least 75% of other fields completed
 */
export function isReadyForSummary(data: Partial<IntakeData>): boolean {
  const phq9Complete = !!(data.phq9Responses && data.phq9Responses.length === 9);
  const patientReady = data.patientReadyForSummary === true;
  const completionGood = calculateCompletion(data) >= 75;
  
  // All three conditions must be met
  return phq9Complete && patientReady && completionGood;
}

/**
 * Calculate PHQ-9 score from responses
 * PHQ-9 is a 9-item depression screening tool (0-3 points per item, max 27)
 */
export function calculatePHQ9Score(responses: number[]): number {
  if (!responses || responses.length !== 9) return 0;
  return responses.reduce((sum, score) => sum + score, 0);
}

/**
 * Generate PHQ-9 questions prompt
 */
export function getPHQ9Prompt(): string {
  return `Over the last 2 weeks, how often have you been bothered by the following problems?

1. Little interest or pleasure in doing things
2. Feeling down, depressed, or hopeless
3. Trouble falling asleep or sleeping too much
4. Feeling tired or having little energy
5. Poor appetite or overeating
6. Feeling bad about yourself - or that you are a failure or have let yourself or family down
7. Trouble concentrating on things, such as reading the newspaper or watching television
8. Moving or speaking so slowly that other people could have noticed. Or the opposite - being so fidgety or restless that you have been moving around a lot more than usual
9. Thoughts that you would be better off dead, or of hurting yourself in some way

For each item, please respond with:
- 0 for "Not at all"
- 1 for "Several days"
- 2 for "More than half the days"
- 3 for "Nearly every day"

Please provide your responses as a comma-separated list (e.g., "0,1,2,0,1,1,0,0,0")`;
}

/**
 * Parse PHQ-9 responses from user input
 */
export function parsePHQ9Responses(input: string): number[] | null {
  // Try to extract numbers from the input
  const numbers = input.match(/\d/g);
  if (numbers && numbers.length === 9) {
    return numbers.map(n => parseInt(n)).filter(n => n >= 0 && n <= 3);
  }
  
  // Try comma-separated format
  const commaSeparated = input.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n >= 0 && n <= 3);
  if (commaSeparated.length === 9) {
    return commaSeparated;
  }
  
  return null;
}

/**
 * Generate intake agent response using LLM
 */
export async function generateIntakeResponse(
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  currentData: Partial<IntakeData>
): Promise<IntakeAgentResponse> {
  if (!openai) {
    throw new Error('OpenAI client not configured');
  }

  const completion = calculateCompletion(currentData);
  const needsPHQ9 = !currentData.phq9Responses || currentData.phq9Responses.length !== 9;
  const patientReady = currentData.patientReadyForSummary === true;
  const allFieldsComplete = completion >= 75 && !needsPHQ9;

  // Build system prompt with improved instructions
  let systemPrompt = `You are a professional psychiatric intake agent. Your role is to:
- Ask concise, focused clinical questions
- Collect structured information about the patient's mental health history
- Keep responses brief and professional (2-3 sentences max)
- Guide the conversation to gather: chief complaint, history of present illness, past psychiatric history, medications, safety concerns, substance use, and functional impact

CRITICAL REQUIREMENTS:
1. PHQ-9 SCREENING: You MUST collect all 9 PHQ-9 items before proceeding. ${needsPHQ9 ? 'PHQ-9 is NOT yet complete - prioritize this.' : 'PHQ-9 is complete.'}
2. If patient gives unclear answers or says "I don't know" or "not sure", DO NOT repeat the same question.
   Instead, clarify or rephrase to help them understand.
   Example: "When I ask about 'feeling tired,' I mean physical or mental fatigue. Could you describe what you've experienced?"
3. Current completion: ${completion}% - you need at least 75% to be ready for summary
${allFieldsComplete && !patientReady ? '4. PATIENT READINESS: All required information is collected. Now ask: "Is there anything else you\'d like to share before I summarize what you\'ve told me?" Only proceed after patient confirms they are done.' : ''}
${allFieldsComplete && patientReady ? '5. READY: Patient has confirmed readiness. You may now indicate readiness to proceed to clinical summary.' : ''}

PHQ-9 Questions (collect all 9, 0-3 scale each):
1. Little interest or pleasure in doing things
2. Feeling down, depressed, or hopeless
3. Trouble falling asleep or sleeping too much
4. Feeling tired or having little energy
5. Poor appetite or overeating
6. Feeling bad about yourself - or that you are a failure or have let yourself or family down
7. Trouble concentrating on things, such as reading the newspaper or watching television
8. Moving or speaking so slowly that other people could have noticed. Or the opposite - being so fidgety or restless that you have been moving around a lot more than usual
9. Thoughts that you would be better off dead, or of hurting yourself in some way`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...conversationHistory,
  ];

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 300,
    });

    const assistantMessage = response.choices[0]?.message?.content || 'I apologize, I encountered an error. Please try again.';

    // Try to extract structured data from the conversation using LLM
    const extractedData = await extractIntakeData(conversationHistory, assistantMessage);

    // Check if patient confirmed readiness (look for confirmation in user's last message or assistant's response)
    const lastUserMessage = conversationHistory.filter(m => m.role === 'user').pop()?.content.toLowerCase() || '';
    const confirmedReady = lastUserMessage.includes('yes') || 
                          lastUserMessage.includes('nothing else') || 
                          lastUserMessage.includes('done') ||
                          lastUserMessage.includes('ready') ||
                          lastUserMessage.includes('proceed') ||
                          assistantMessage.toLowerCase().includes('summarize what you\'ve told me');

    const updatedData = { 
      ...currentData, 
      ...extractedData,
      patientReadyForSummary: confirmedReady || currentData.patientReadyForSummary,
    };
    const newCompletion = calculateCompletion(updatedData);
    const newNeedsPHQ9 = !updatedData.phq9Responses || updatedData.phq9Responses.length !== 9;
    const newPatientReady = updatedData.patientReadyForSummary === true;

    // Use improved readiness check function
    const shouldProceed = isReadyForSummary(updatedData);

    return {
      message: assistantMessage,
      intakeData: updatedData,
      shouldContinue: shouldProceed,
      completionPercentage: newCompletion,
      needsPHQ9: newNeedsPHQ9,
      patientReady: newPatientReady,
    };
  } catch (error) {
    console.error('Error generating intake response:', error);
    throw error;
  }
}

/**
 * Extract structured intake data from conversation using LLM
 * Uses GPT to extract structured data points from conversation history
 */
async function extractIntakeData(
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  lastAssistantMessage: string
): Promise<Partial<IntakeData>> {
  if (!openai) {
    return {};
  }

  const extractionPrompt = `Based on the following conversation, extract any clinical information mentioned and return it as JSON. Look for:
- chiefComplaint: main reason for seeking care
- historyOfPresentIllness: details about current symptoms and their duration
- pastPsychiatricHistory: prior diagnoses, treatments, hospitalizations
- medications: current psychiatric medications
- medicationDuration: how long taking current medications
- safetyConcerns: suicidal ideation, self-harm, harm to others
- substanceUse: alcohol, drugs, tobacco use
- functionalImpact: how symptoms affect daily life
- patientAge: age if mentioned (number only)
- patientGender: gender if mentioned (male/female/non-binary/prefer-not-to-say)
- phq9Responses: array of 9 numbers (0-3 each) if PHQ-9 responses are provided in the conversation

Return only a JSON object with the fields found, no other text. If a field wasn't mentioned, omit it.

Conversation:
${history.map(m => `${m.role}: ${m.content}`).join('\n')}
Assistant: ${lastAssistantMessage}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a data extraction assistant. Extract clinical information from conversations and return only valid JSON.',
        },
        {
          role: 'user',
          content: extractionPrompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const extracted = JSON.parse(response.choices[0]?.message?.content || '{}');
    return extracted as Partial<IntakeData>;
  } catch (error) {
    console.error('Error extracting intake data:', error);
    return {};
  }
}

