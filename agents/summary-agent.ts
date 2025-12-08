import OpenAI from 'openai';
import { Message } from '@/types';

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

export class SummaryAgent {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async generateSummary(conversationHistory: Message[], phq9Score?: number): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(phq9Score);
    const userMessages = conversationHistory.filter(msg => msg.role === 'user');
    const conversationText = userMessages.map(msg => msg.content).join('\n\n');

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Based on the following conversation, generate a clinical summary:\n\n${conversationText}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      });

      return completion.choices[0]?.message?.content || 'Unable to generate summary.';
    } catch (error) {
      console.error('Error generating summary:', error);
      throw new Error('Failed to generate clinical summary. Please try again.');
    }
  }

  private buildSystemPrompt(phq9Score?: number): string {
    return `You are a clinical summary agent. Generate a concise, structured clinical summary for human clinicians based on patient intake responses.

REQUIREMENTS:
1. Ensure coverage of all psychiatric interview sections:
${PSYCHIATRIC_INTERVIEW_SECTIONS.map(s => `   - ${s}`).join('\n')}

2. Use professional, clinical language
3. Be factual and structured
4. Avoid redundancy
5. Include relevant details from the conversation
6. Organize information logically by section
7. ${phq9Score !== undefined ? `Include PHQ-9 score: ${phq9Score}/27` : 'PHQ-9 score not available'}

FORMAT:
- Use clear section headers
- Use bullet points for clarity
- Be concise but comprehensive
- Focus on clinically relevant information

Do not include patient quotes or conversational elements. Present information in a clinical, objective manner.`;
  }
}
