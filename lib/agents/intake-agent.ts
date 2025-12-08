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
  // PHQ-9 is handled separately via form, so we only need intake completion and patient readiness
  const patientReady = data.patientReadyForSummary === true;
  const completionGood = calculateCompletion(data) >= 75;

  // Patient must be ready and have adequate intake data
  return patientReady && completionGood;
}

export function isReadyForPHQ9Form(data: Partial<IntakeData>): boolean {
  // Ready for PHQ-9 form when intake is complete and patient has been informed
  const patientReady = data.patientReadyForSummary === true;
  const completionGood = calculateCompletion(data) >= 75;
  return patientReady && completionGood;
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
  // PHQ-9 will be collected via separate form, not in chat
  const patientReady = currentData.patientReadyForSummary === true;
  const allFieldsComplete = completion >= 75;

  // Build system prompt with improved instructions
  let systemPrompt = `You are a friendly, conversational psychiatric intake agent. Your role is to:
- Ask natural, human questions about the patient's mental health
- Keep responses brief and conversational (1-2 sentences max)
- Guide the conversation to gather: chief complaint, history of present illness, past psychiatric history, medications, safety concerns, substance use, and functional impact
- Ask about symptoms naturally: sleep, appetite, energy, concentration, mood, and any thoughts of self-harm
- Use everyday language, not medical terms

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

1. DO NOT ask structured PHQ-9 questions or mention "PHQ-9", "screening", or "questionnaire" to the patient
2. Ask about symptoms naturally in conversation:
   - Sleep patterns (trouble sleeping, sleeping too much, duration)
   - Appetite changes (eating more or less, duration)
   - Energy levels (feeling tired, low energy, duration)
   - Concentration (trouble focusing, making decisions, duration)
   - Mood (feeling down, hopeless, anxious, duration)
   - Interest in activities (loss of interest or pleasure, duration)
   - Self-perception (feeling bad about yourself, duration)
   - Physical symptoms (moving slowly or restlessness, duration)
   - Safety (thoughts of self-harm or suicide)
3. TIME FRAME AWARENESS: When learning about a symptom, ask how long it's been present.
   - Ask: "How long have you been experiencing [symptom]?" or "When did [symptom] start?"
   - BUT only if duration hasn't already been mentioned in the conversation
4. If patient gives unclear answers or says "I don't know", DO NOT repeat the same question.
   Instead, clarify or rephrase to help them understand.
5. Current completion: ${completion}% - you need at least 75% to be ready for the screening form

${allFieldsComplete && !patientReady ? '6. PATIENT READINESS CHECKPOINT: Once you have gathered adequate information, ask: "Is there anything else you\'d like to share before I summarize everything?" Then say: "Thanks for sharing all of that. Before we move on, I\'d like you to fill out a short 9-question form. This helps your provider understand your symptoms a bit better."' : ''}
${allFieldsComplete && patientReady ? '7. READY: Patient has been informed about the screening form. They should proceed to fill out the form.' : ''}`;

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
 * Build a human-readable fact memory string from current intake data
 * This helps the agent know what's already been covered
 */
function buildFactMemory(currentData: Partial<IntakeData>): string[] {
  const facts: string[] = [];
  
  if (currentData.chiefComplaint) {
    facts.push(`- Chief complaint: ${currentData.chiefComplaint}`);
  }
  
  if (currentData.historyOfPresentIllness) {
    facts.push(`- History of present illness: ${currentData.historyOfPresentIllness.substring(0, 100)}...`);
  }
  
  if (currentData.pastPsychiatricHistory) {
    facts.push(`- Past psychiatric history: ${currentData.pastPsychiatricHistory.substring(0, 100)}...`);
  }
  
  if (currentData.medications) {
    facts.push(`- Current medications: ${currentData.medications}`);
    if (currentData.medicationDuration) {
      facts.push(`  - Duration: ${currentData.medicationDuration}`);
    }
  }
  
  if (currentData.safetyConcerns) {
    facts.push(`- Safety concerns: ${currentData.safetyConcerns}`);
  }
  
  if (currentData.substanceUse) {
    facts.push(`- Substance use: ${currentData.substanceUse}`);
  }
  
  if (currentData.functionalImpact) {
    facts.push(`- Functional impact: ${currentData.functionalImpact}`);
  }
  
  if (currentData.patientAge) {
    facts.push(`- Age: ${currentData.patientAge}`);
  }
  
  if (currentData.patientGender) {
    facts.push(`- Gender: ${currentData.patientGender}`);
  }
  
  if (currentData.symptomDuration && Object.keys(currentData.symptomDuration).length > 0) {
    const durations = Object.entries(currentData.symptomDuration)
      .map(([symptom, duration]) => `${symptom}: ${duration}`)
      .join(', ');
    facts.push(`- Symptom durations: ${durations}`);
  }
  
  if (currentData.symptomSeverity && Object.keys(currentData.symptomSeverity).length > 0) {
    const severities = Object.entries(currentData.symptomSeverity)
      .map(([symptom, severity]) => `${symptom}: ${severity}`)
      .join(', ');
    facts.push(`- Symptom severities: ${severities}`);
  }
  
  return facts;
}

/**
 * Extract structured intake data from conversation using LLM
 * Uses GPT to extract structured data points from conversation history
 * This function builds up a fact memory that prevents asking redundant questions
 */
async function extractIntakeData(
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  lastAssistantMessage: string,
  currentData: Partial<IntakeData>
): Promise<Partial<IntakeData>> {
  if (!openai) {
    return {};
  }

  // Build current knowledge context
  const currentKnowledge = buildFactMemory(currentData);
  const knowledgeContext = currentKnowledge.length > 0 
    ? `Current knowledge: ${currentKnowledge.join('; ')}` 
    : 'No prior information collected yet.';

  const extractionPrompt = `You are a clinical data extraction assistant. Extract NEW information from the conversation that hasn't been mentioned before.

${knowledgeContext}

Extract any NEW clinical information mentioned in the most recent messages and return it as JSON. Look for:
- chiefComplaint: main reason for seeking care (if not already known)
- historyOfPresentIllness: details about current symptoms, onset, progression
- pastPsychiatricHistory: prior diagnoses, treatments, medications, hospitalizations, therapy
- medications: current psychiatric medications (name and dosage if mentioned)
- medicationDuration: how long taking current medications
- safetyConcerns: suicidal ideation, self-harm thoughts, harm to others, hallucinations
- substanceUse: alcohol use (frequency/amount), drug use (type/frequency), tobacco use
- functionalImpact: how symptoms affect work, relationships, daily activities, sleep patterns
- patientAge: age if mentioned (number only)
- patientGender: gender if mentioned (male/female/non-binary/prefer-not-to-say)
- symptomDuration: object with symptom names as keys and duration strings as values
  Examples: {"depression": "3 months", "anxiety": "6 weeks", "insomnia": "2 weeks", "low mood": "since last year"}
  Extract any time-related phrases: "for 3 months", "about 6 weeks", "since January", "started last year"
- symptomSeverity: object with symptom names as keys and severity strings as values
  Examples: {"depression": "moderate", "anxiety": "mild", "insomnia": "severe"}
  Look for words like: mild, moderate, severe, intense, mild-moderate, severe

IMPORTANT EXTRACTION RULES:
1. Only extract NEW information - do not repeat what's already in current knowledge
2. If a symptom is mentioned with duration, extract both: symptomDuration AND symptomSeverity if severity is mentioned
3. Extract duration information whenever mentioned (e.g., "I've been depressed for 3 months" → symptomDuration: {"depression": "3 months"})
4. Look for multiple facts in single messages - extract everything mentioned
5. If patient mentions multiple symptoms, extract all of them

Return only a JSON object with NEW fields found, no other text. If nothing new was mentioned, return empty object {}.

Conversation (most recent messages):
${history.slice(-10).map(m => `${m.role}: ${m.content}`).join('\n')}
Assistant: ${lastAssistantMessage}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a clinical data extraction assistant. Extract NEW clinical information from conversations and return only valid JSON. Do not include information already known. Be thorough but precise.',
        },
        {
          role: 'user',
          content: extractionPrompt,
        },
      ],
      temperature: 0.2, // Lower temperature for more consistent extraction
      max_tokens: 1000,
      response_format: { type: 'json_object' }, // Force JSON output
    });

    const content = response.choices[0]?.message?.content || '{}';
    
    // Handle cases where response might have markdown code blocks
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/```\n?/g, '').trim();
    }
    
    const extracted = JSON.parse(jsonContent);
    
    // Merge symptom duration and severity objects if they exist
    // This allows accumulating symptoms across multiple messages
    if (extracted.symptomDuration || currentData.symptomDuration) {
      extracted.symptomDuration = {
        ...(currentData.symptomDuration || {}),
        ...(extracted.symptomDuration || {}),
      };
    }
    
    if (extracted.symptomSeverity || currentData.symptomSeverity) {
      extracted.symptomSeverity = {
        ...(currentData.symptomSeverity || {}),
        ...(extracted.symptomSeverity || {}),
      };
    }
    
    // Log extraction for debugging
    if (Object.keys(extracted).length > 0) {
      console.log('[Intake Agent] Extracted new facts:', Object.keys(extracted));
    }
    
    return extracted as Partial<IntakeData>;
  } catch (error) {
    console.error('[Intake Agent] Error extracting intake data:', error);
    return {};
  }
}

