import OpenAI from 'openai';
import { detectTopics, TOPIC_KEYWORDS } from '@/utils/topicDetection';
import { Message, ConversationState } from '@/types';

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
  'Functioning (social/work)',
];

export class IntakeAgent {
  private openai: OpenAI;
  private topicsDiscussed: Set<string> = new Set();
  private conversationHistory: Message[] = [];

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async processMessage(
    userMessage: string,
    state: ConversationState
  ): Promise<{ response: string; topics: string[]; shouldTransition: boolean }> {
    // Detect topics from user message
    const detectedTopics = detectTopics(userMessage);
    detectedTopics.forEach(topic => this.topicsDiscussed.add(topic));

    // Add user message to history
    this.conversationHistory.push({ role: 'user', content: userMessage });

    // Build system prompt
    const systemPrompt = this.buildSystemPrompt(state);

    // Get response from OpenAI
    const response = await this.getLLMResponse(systemPrompt, this.conversationHistory);

    // Add assistant response to history
    this.conversationHistory.push({ role: 'assistant', content: response });

    // Check if we should transition to summary
    const shouldTransition = this.shouldTransitionToSummary(response, state);

    return {
      response,
      topics: Array.from(this.topicsDiscussed),
      shouldTransition,
    };
  }

  private buildSystemPrompt(state: ConversationState): string {
    const discussedTopicsList = Array.from(this.topicsDiscussed).join(', ');
    const remainingSections = PSYCHIATRIC_INTERVIEW_SECTIONS.filter(section => {
      const sectionKey = section.toLowerCase().replace(/[^a-z]/g, '');
      return !this.topicsDiscussed.has(sectionKey);
    });

    return `You are a warm, empathetic intake agent conducting a psychiatric intake assessment. Your role is to gather clinical information through friendly, conversational questions.

CRITICAL RULES:
1. DO NOT summarize, reflect, or repeat what the patient says. Never say things like "I see you mentioned..." or "You said earlier..."
2. DO NOT repeat questions if the answer was already given. Check the conversation history carefully.
3. Ask ONE question at a time in a warm, conversational tone.
4. If user input is ambiguous or vague, ask clarifying follow-ups, not repeats.
5. Do NOT use clinical jargon unless the patient uses it first.
6. Do NOT mention "PHQ-9" to the patient. This will be handled separately.

TOPICS ALREADY DISCUSSED: ${discussedTopicsList || 'None yet'}

REMAINING SECTIONS TO COVER:
${remainingSections.length > 0 ? remainingSections.join('\n') : 'All sections covered'}

INTERVIEW SECTIONS TO COVER:
${PSYCHIATRIC_INTERVIEW_SECTIONS.join('\n')}

CONVERSATION STYLE:
- Be warm, empathetic, and professional
- Ask natural, open-ended questions
- Show genuine interest
- Avoid being robotic or clinical
- If the patient seems distressed, acknowledge it briefly but continue gathering information

When you have gathered sufficient information across all sections, ask: "Is there anything else you'd like to share before I summarize everything?"

After the patient responds to that question, ask: "Would you like to review a clinical summary of what you shared?"

Remember: Do not summarize or reflect back what the patient said. Just ask the next appropriate question.`;
  }

  private async getLLMResponse(systemPrompt: string, messages: Message[]): Promise<string> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map(msg => ({ role: msg.role, content: msg.content })),
        ],
        temperature: 0.7,
        max_tokens: 300,
      });

      return completion.choices[0]?.message?.content || 'I understand. Can you tell me more?';
    } catch (error) {
      console.error('Error calling OpenAI:', error);
      throw new Error('Failed to generate response. Please try again.');
    }
  }

  private shouldTransitionToSummary(response: string, state: ConversationState): boolean {
    const lowerResponse = response.toLowerCase();
    return (
      lowerResponse.includes('anything else') ||
      lowerResponse.includes('summarize') ||
      (this.topicsDiscussed.size >= 8 && !state.intakeComplete)
    );
  }

  getTopicsDiscussed(): Set<string> {
    return new Set(this.topicsDiscussed);
  }

  reset() {
    this.topicsDiscussed.clear();
    this.conversationHistory = [];
  }
}
