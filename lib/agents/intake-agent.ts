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
 * Parse a single PHQ-9 response from natural language input
 * Handles flexible input like "I'd say 2", "more than half the days", "probably a 2", etc.
 * Returns 0-3 if valid, null if unsure
 */
export function parsePHQ9Response(input: string): number | null {
  if (!input || typeof input !== 'string') return null;
  
  const lowerInput = input.toLowerCase().trim();
  
  // Direct number matches (0-3)
  const numberMatch = lowerInput.match(/\b([0-3])\b/);
  if (numberMatch) {
    const num = parseInt(numberMatch[1]);
    if (num >= 0 && num <= 3) return num;
  }
  
  // Score 0 patterns: "not at all", "never", "none", "0"
  if (lowerInput.match(/\b(not at all|never|none|no|zero|0)\b/)) {
    return 0;
  }
  
  // Score 1 patterns: "several days", "some days", "a few", "1"
  if (lowerInput.match(/\b(several days|some days|a few|occasionally|sometimes|once or twice|1)\b/)) {
    return 1;
  }
  
  // Score 2 patterns: "more than half", "more than half the days", "often", "most days", "2"
  if (lowerInput.match(/\b(more than half|more than half the days|often|most days|frequently|regularly|2|probably a 2|i'd say 2|probably 2)\b/)) {
    return 2;
  }
  
  // Score 3 patterns: "nearly every day", "every day", "almost always", "all the time", "3"
  if (lowerInput.match(/\b(nearly every day|every day|almost every day|almost always|all the time|always|constantly|3|probably a 3|i'd say 3|probably 3)\b/)) {
    return 3;
  }
  
  // If we can't parse it, return null (unclear)
  return null;
}

/**
 * Parse multiple PHQ-9 responses from user input (for batch responses)
 * Supports comma-separated lists or extracting 9 numbers
 */
export function parsePHQ9Responses(input: string): number[] | null {
  if (!input) return null;
  
  // Try comma-separated format first
  const commaSeparated = input.split(',').map(s => parsePHQ9Response(s.trim())).filter(n => n !== null) as number[];
  if (commaSeparated.length === 9) {
    return commaSeparated;
  }
  
  // Try extracting 9 consecutive digits
  const numbers = input.match(/\d/g);
  if (numbers && numbers.length === 9) {
    const parsed = numbers.map(n => parseInt(n)).filter(n => n >= 0 && n <= 3);
    if (parsed.length === 9) {
      return parsed;
    }
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

  // Determine which depression symptom question to ask (if needed)
  const currentResponses = currentData.phq9Responses || [];
  const questionsToAsk = [
    "Over the last two weeks, how often have you had little interest or pleasure in doing things?",
    "Over the last two weeks, how often have you felt down, depressed, or hopeless?",
    "Over the last two weeks, how often have you had trouble falling asleep or staying asleep, or sleeping too much?",
    "Over the last two weeks, how often have you felt tired or had little energy?",
    "Over the last two weeks, how often have you had poor appetite or overeating?",
    "Over the last two weeks, how often have you felt bad about yourself - or that you are a failure or have let yourself or your family down?",
    "Over the last two weeks, how often have you had trouble concentrating on things, such as reading the newspaper or watching television?",
    "Over the last two weeks, how often have you been moving or speaking so slowly that other people could have noticed? Or the opposite - being so fidgety or restless that you have been moving around a lot more than usual?",
    "Over the last two weeks, how often have you had thoughts that you would be better off dead, or of hurting yourself?",
  ];
  const nextQuestionIndex = currentResponses.length;
  const hasAllQuestions = nextQuestionIndex >= 9;

  // Build system prompt with improved instructions
  let systemPrompt = `You are a friendly, conversational psychiatric intake agent. Your role is to:
- Ask natural, human questions about the patient's mental health
- Keep responses brief and conversational (1-2 sentences max)
- Guide the conversation to gather: chief complaint, history of present illness, past psychiatric history, medications, safety concerns, substance use, and functional impact

AGENT LANGUAGE STYLE - CRITICAL:
- Use a simple, human, conversational tone - NOT clinical or overly formal
- NEVER repeat the patient's answer back to them verbatim
- After receiving an answer, use brief acknowledgments like:
  * "Thanks for sharing that."
  * "Got it — now, let's talk about..."
  * "Thanks. Next..."
- Only repeat information if clarification is needed (e.g., "Just to confirm — would you say 2 or 3?")
- Avoid:
  * Echoing exact phrases from patient responses
  * Over-apologizing
  * Explaining medical tools or technical terms
  * Long technical explanations
- Focus on helpful transitions, warm clarity, and smooth flow

CRITICAL REQUIREMENTS FOR DEPRESSION SYMPTOMS:
${needsPHQ9 ? `
1. DEPRESSION SYMPTOMS: You MUST ask about all 9 depression symptom questions before proceeding. You have collected ${currentResponses.length} of 9 so far.
   - NEVER mention "PHQ-9", "screening", "questionnaire", or any technical terms to the patient
   - Ask ONE question at a time in a natural, conversational way
   - Accept natural language answers (e.g., "I'd say 2", "more than half the days", "probably a 2", "nearly every day")
   - After getting a valid answer, IMMEDIATELY move to the next question
   - DO NOT repeat or echo the patient's answer back to them
   - Use brief acknowledgments: "Thanks" or "Got it" then immediately ask the next question
   - If the answer is unclear or vague, ask for clarification ONCE: "Just to confirm — would you say 2 or 3?" or "Would you say: not at all, several days, more than half the days, or nearly every day?"
   - DO NOT repeat the same question more than once unless the user explicitly asks you to
   - Example good flow:
     Agent: "Over the last two weeks, how often have you had little interest or pleasure in doing things?"
     Patient: "I'd say more than half the days."
     Agent: "Thanks. Over the last two weeks, how often have you felt down, depressed, or hopeless?" (NOT: "I'd say more than half the days.")

   ${nextQuestionIndex < 9 ? `NEXT QUESTION TO ASK: "${questionsToAsk[nextQuestionIndex]}"` : 'All 9 questions have been asked.'}
` : 'All depression symptom questions have been completed.'}

2. GENERAL CLARIFICATION: If patient gives unclear answers or says "I don't know" or "not sure", DO NOT repeat the same question.
   Instead, clarify or rephrase to help them understand.
   Example: "When I ask about 'feeling tired,' I mean physical or mental fatigue. Could you describe what you've experienced?"

3. Current completion: ${completion}% - you need at least 75% to be ready for summary
${allFieldsComplete && !patientReady ? '4. PATIENT READINESS: All required information is collected. Now ask: "Is there anything else you\'d like to share before I summarize what you\'ve told me?" Only proceed after patient confirms they are done.' : ''}
${allFieldsComplete && patientReady ? '5. READY: Patient has confirmed readiness. You may now indicate readiness to proceed to clinical summary.' : ''}`;

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
    const extractedData = await extractIntakeData(conversationHistory, assistantMessage, currentData);

    // Also try to parse PHQ-9 response from the user's last message (individual response parsing)
    const lastUserMessage = conversationHistory.filter(m => m.role === 'user').pop()?.content || '';
    const singlePHQ9Response = parsePHQ9Response(lastUserMessage);
    
    // Merge PHQ-9 responses: use extracted data if available, otherwise try to append single response
    let mergedPHQ9Responses = currentData.phq9Responses || [];
    if (extractedData.phq9Responses && Array.isArray(extractedData.phq9Responses)) {
      // Use extracted responses if available (handles batch or complete arrays)
      mergedPHQ9Responses = extractedData.phq9Responses;
    } else if (singlePHQ9Response !== null) {
      // Append single response if it's new (not already in array)
      if (!mergedPHQ9Responses.includes(singlePHQ9Response) || mergedPHQ9Responses.length < 9) {
        // Add to array, but don't exceed 9
        if (mergedPHQ9Responses.length < 9) {
          mergedPHQ9Responses = [...mergedPHQ9Responses, singlePHQ9Response];
        }
      }
    }
    
    // Ensure we don't exceed 9 responses
    if (mergedPHQ9Responses.length > 9) {
      mergedPHQ9Responses = mergedPHQ9Responses.slice(0, 9);
    }
    
    // Calculate PHQ-9 score if we have responses
    const phq9Score = mergedPHQ9Responses.length > 0 ? calculatePHQ9Score(mergedPHQ9Responses) : (currentData.phq9Score || 0);

    // Check if patient confirmed readiness (look for confirmation in user's last message or assistant's response)
    const lastUserMessageLower = lastUserMessage.toLowerCase();
    const confirmedReady = lastUserMessageLower.includes('yes') || 
                          lastUserMessageLower.includes('nothing else') || 
                          lastUserMessageLower.includes('done') ||
                          lastUserMessageLower.includes('ready') ||
                          lastUserMessageLower.includes('proceed') ||
                          assistantMessage.toLowerCase().includes('summarize what you\'ve told me');

    const updatedData = { 
      ...currentData, 
      ...extractedData,
      phq9Responses: mergedPHQ9Responses.length > 0 ? mergedPHQ9Responses : currentData.phq9Responses,
      phq9Score: phq9Score,
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
  lastAssistantMessage: string,
  currentData: Partial<IntakeData>
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
- phq9Responses: array of numbers (0-3 each) representing answers to depression symptom questions
  IMPORTANT: Parse natural language answers into scores:
    - "not at all", "never", "none", "no" → 0
    - "several days", "some days", "a few", "occasionally" → 1
    - "more than half the days", "more than half", "often", "most days", "I'd say 2", "probably a 2", "probably 2" → 2
    - "nearly every day", "every day", "always", "all the time" → 3
  Current known responses: ${JSON.stringify(currentData.phq9Responses || [])}
  Look for NEW answers in the most recent user messages. If you find a new answer to a depression symptom question:
    - Append it to the existing array (maintain order, don't duplicate)
    - Ensure array length does not exceed 9
    - If array becomes exactly 9, all questions are answered

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

