import OpenAI from 'openai';
import { detectTopics, addTopicsToMemory, getUncoveredTopics, TopicMemory } from '@/lib/memory';

const PSYCHIATRIC_INTERVIEW_SECTIONS = [
  'Reason for visit',
  'Identifying information',
  'Chief complaint',
  'History of present illness',
  'Past psychiatric history',
  'Family history',
  'Medical history',
  'Substance use',
  'Mental status',
  'Social/work functioning',
];

export class IntakeAgent {
  private openai: OpenAI;
  private memory: TopicMemory;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
    this.memory = {
      coveredTopics: new Set(),
      lastQuestion: null,
      conversationHistory: [],
    };
  }

  /**
   * Process user message and generate response
   */
  async processMessage(
    userMessage: string,
    existingMemory?: TopicMemory
  ): Promise<{ response: string; shouldTransition: boolean; memory: TopicMemory }> {
    // Restore memory if provided
    if (existingMemory) {
      this.memory = existingMemory;
    }

    // Detect topics from user message
    const detectedTopics = detectTopics(userMessage);
    addTopicsToMemory(detectedTopics, this.memory);

    // Add to conversation history
    this.memory.conversationHistory.push({ role: 'user', content: userMessage });

    // Build system prompt with guardrails
    const systemPrompt = this.buildSystemPrompt();

    // Get response from LLM
    const response = await this.getLLMResponse(systemPrompt, this.memory.conversationHistory);

    // Add assistant response to history
    this.memory.conversationHistory.push({ role: 'assistant', content: response });
    this.memory.lastQuestion = response;

    // Check if should transition to PHQ-9
    const shouldTransition = this.shouldTransition(response);

    return {
      response,
      shouldTransition,
      memory: this.memory,
    };
  }

  /**
   * Build system prompt with strong guardrails
   */
  buildSystemPrompt(): string {
    const uncoveredTopics = getUncoveredTopics(this.memory);
    const coveredTopicsList = Array.from(this.memory.coveredTopics).join(', ');

    return `You are a warm, empathetic intake agent conducting a psychiatric intake assessment. Your role is to gather clinical information through friendly, conversational questions.

CRITICAL RULES - STRICTLY ENFORCE:
1. DO NOT summarize, reflect, echo, or paraphrase what the patient says. Never say things like:
   - "I see you mentioned..."
   - "You said earlier..."
   - "I understand you're feeling..."
   - "So you're saying..."
   - "You mentioned that..."
   - "Based on what you've told me..."

2. DO NOT repeat questions if the answer was already given. Check conversation history carefully.

3. Ask ONE question at a time. Never ask multiple questions in a single message.

4. If user input is ambiguous or vague, ask clarifying follow-ups, not repeats.

5. Do NOT use clinical jargon unless the patient uses it first.

6. Do NOT mention "PHQ-9" or any questionnaire names to the patient.

7. Track what has been discussed to avoid repetition.

TOPICS ALREADY COVERED: ${coveredTopicsList || 'None yet'}

REMAINING TOPICS TO COVER:
${uncoveredTopics.length > 0 ? uncoveredTopics.join(', ') : 'All topics covered'}

INTERVIEW SECTIONS TO COVER:
${PSYCHIATRIC_INTERVIEW_SECTIONS.join('\n')}

CONVERSATION STYLE:
- Be warm, empathetic, and professional
- Ask natural, open-ended questions
- Show genuine interest
- Avoid being robotic or clinical
- If the patient seems distressed, acknowledge it briefly but continue gathering information

When you have gathered sufficient information across all sections, ask: "Is there anything else you'd like to share before I summarize everything?"

Remember: Do NOT summarize or reflect back what the patient said. Just ask the next appropriate question.`;
  }

  /**
   * Get LLM response
   */
  private async getLLMResponse(
    systemPrompt: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<string> {
    try {
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        })) as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      ];

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages,
        temperature: 0.7,
        max_tokens: 300,
      });

      return completion.choices[0]?.message?.content || 'I understand. Can you tell me more?';
    } catch (error) {
      console.error('Error calling OpenAI:', error);
      throw new Error('Failed to generate response. Please try again.');
    }
  }

  /**
   * Check if should transition to PHQ-9
   */
  private shouldTransition(response: string): boolean {
    const lowerResponse = response.toLowerCase();
    return (
      lowerResponse.includes('anything else') &&
      lowerResponse.includes('before i summarize')
    );
  }

  /**
   * Get current memory state
   */
  getMemory(): TopicMemory {
    return { ...this.memory };
  }

  /**
   * Reset memory
   */
  reset(): void {
    this.memory = {
      coveredTopics: new Set(),
      lastQuestion: null,
      conversationHistory: [],
    };
  }
}
