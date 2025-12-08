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
}

/**
 * Calculate completion percentage based on filled fields
 */
export function calculateCompletion(data: Partial<IntakeData>): number {
  let filled = 0;
  const total = REQUIRED_FIELDS.length + 1; // +1 for PHQ-9
  
  REQUIRED_FIELDS.forEach(field => {
    if (data[field] && String(data[field]).trim().length > 0) {
      filled++;
    }
  });
  
  // Check if PHQ-9 is complete (all 9 questions answered)
  if (data.phq9Responses && data.phq9Responses.length === 9) {
    filled++;
  }
  
  return Math.round((filled / total) * 100);
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

  const systemPrompt = `You are a professional psychiatric intake agent. Your role is to:
- Ask concise, focused clinical questions
- Collect structured information about the patient's mental health history
- Avoid long empathic reflections - keep responses brief and professional
- Guide the conversation to gather: chief complaint, history of present illness, past psychiatric history, medications, safety concerns, substance use, and functional impact
${needsPHQ9 ? '- If PHQ-9 has not been completed, prioritize administering it (9 questions, 0-3 scale each)' : ''}
- Current completion: ${completion}% - you need at least 75% to hand off to the summary agent
- Once you have 75%+ completion, indicate readiness to proceed to clinical summary`;

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

    const updatedData = { ...currentData, ...extractedData };
    const newCompletion = calculateCompletion(updatedData);

    return {
      message: assistantMessage,
      intakeData: extractedData,
      shouldContinue: newCompletion >= 75,
      completionPercentage: newCompletion,
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
- patientAge: age if mentioned
- patientGender: gender if mentioned

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

