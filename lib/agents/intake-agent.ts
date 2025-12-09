/**
 * Intake Agent
 * 
 * Handles structured psychiatric intake assessment through conversational Q&A.
 * Asks one question at a time, tracks discussed topics, and avoids repetition.
 */

export interface IntakeAgentState {
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  discussedTopics: Set<string>;
  currentPhase: 'greeting' | 'reason_for_visit' | 'identifying_info' | 'chief_complaint' | 
                'history_present_illness' | 'past_psychiatric' | 'family_history' | 
                'medical_history' | 'substance_use' | 'mental_status' | 'functioning' | 
                'wrap_up' | 'complete';
}

/**
 * Initial system prompt for the Intake Agent
 */
export const INTAKE_AGENT_SYSTEM_PROMPT = `You are a professional psychiatric intake assessment assistant. Your role is to conduct a structured, empathetic intake interview with patients seeking psychiatric care.

Guidelines:
1. Ask ONE question at a time - never ask multiple questions in a single response
2. Use a friendly, professional, and empathetic tone
3. Do NOT summarize or reflect back what the user has said - just acknowledge briefly and move to the next question
4. Do NOT repeat questions about topics already discussed
5. If a user's response is vague, ask clarifying follow-up questions
6. Track the following topics systematically:
   - Reason for visit / chief concern
   - Identifying information (age, occupation, etc.)
   - Chief complaint
   - History of present illness
   - Past psychiatric history
   - Family psychiatric history
   - Medical history
   - Substance use history
   - Mental status observations
   - Social and occupational functioning
   - Current behaviors and symptoms

7. Before ending the intake, ask: "Is there anything else you'd like to share before I summarize everything?"
8. After they respond, say: "Thank you for sharing. Please complete the PHQ-9 questionnaire to help us understand your situation more accurately."

Begin with this greeting:
"Hello! I'm here to help you with your psychiatric intake assessment. I'll ask you some questions about your mental health history, symptoms, and current concerns. This information will help us understand your situation better.

Let's begin. Can you tell me what brings you in today? What's your main concern or reason for seeking psychiatric care?"`;

/**
 * Creates the initial state for the intake agent
 */
export function createIntakeAgentState(): IntakeAgentState {
  return {
    conversationHistory: [],
    discussedTopics: new Set(),
    currentPhase: 'greeting',
  };
}

/**
 * Updates the intake agent state with a new message
 */
export function updateIntakeAgentState(
  state: IntakeAgentState,
  role: 'user' | 'assistant',
  content: string
): IntakeAgentState {
  return {
    ...state,
    conversationHistory: [...state.conversationHistory, { role, content }],
  };
}

/**
 * Checks if the intake agent has completed the assessment
 */
export function isIntakeComplete(state: IntakeAgentState): boolean {
  return state.currentPhase === 'complete';
}
