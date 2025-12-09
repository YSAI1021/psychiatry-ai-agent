import OpenAI from 'openai';

export interface ClinicalSummary {
  reasonForVisit: string;
  psychiatricHistory: string;
  symptoms: string;
  substanceUse: string;
  functioning: string;
  phq9Score?: number;
}

export class SummaryAgent {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Generate clinical summary from conversation history
   */
  async generateSummary(
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
    phq9Score?: number
  ): Promise<ClinicalSummary> {
    const userMessages = conversationHistory
      .filter(msg => msg.role === 'user')
      .map(msg => msg.content)
      .join('\n\n');

    const systemPrompt = this.buildSystemPrompt(phq9Score);

    try {
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Based on the following conversation, generate a structured clinical summary:\n\n${userMessages}` },
      ];

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages,
        temperature: 0.3,
        max_tokens: 1500,
      });

      const summaryText = completion.choices[0]?.message?.content || '';

      // Parse the summary into structured format
      return this.parseSummary(summaryText, phq9Score);
    } catch (error) {
      console.error('Error generating summary:', error);
      throw new Error('Failed to generate clinical summary. Please try again.');
    }
  }

  /**
   * Build system prompt for summary generation
   */
  private buildSystemPrompt(phq9Score?: number): string {
    return `You are a clinical summary agent. Generate a concise, structured clinical summary for human clinicians based on patient intake responses.

REQUIREMENTS:
1. Ensure coverage of all psychiatric interview sections:
   - Reason for visit
   - Psychiatric history
   - Symptoms
   - Substance use
   - Functioning (social/work)
   ${phq9Score !== undefined ? `- PHQ-9 Score: ${phq9Score}/27` : ''}

2. Use professional, clinical language
3. Be factual and structured
4. Avoid redundancy
5. Include relevant details from the conversation
6. Organize information logically by section

FORMAT:
Return the summary in this exact format (use these exact section headers):
Reason for visit: [content]
Psychiatric history: [content]
Symptoms: [content]
Substance use: [content]
Functioning: [content]

Do not include patient quotes or conversational elements. Present information in a clinical, objective manner.`;
  }

  /**
   * Parse summary text into structured format
   */
  private parseSummary(summaryText: string, phq9Score?: number): ClinicalSummary {
    const summary: ClinicalSummary = {
      reasonForVisit: '',
      psychiatricHistory: '',
      symptoms: '',
      substanceUse: '',
      functioning: '',
      phq9Score,
    };

    // Extract each section
    const sections = summaryText.split(/\n(?=\w+.*:)/);
    
    sections.forEach(section => {
      if (section.toLowerCase().includes('reason for visit')) {
        summary.reasonForVisit = section.replace(/^.*?:/i, '').trim();
      } else if (section.toLowerCase().includes('psychiatric history')) {
        summary.psychiatricHistory = section.replace(/^.*?:/i, '').trim();
      } else if (section.toLowerCase().includes('symptom')) {
        summary.symptoms = section.replace(/^.*?:/i, '').trim();
      } else if (section.toLowerCase().includes('substance use')) {
        summary.substanceUse = section.replace(/^.*?:/i, '').trim();
      } else if (section.toLowerCase().includes('functioning')) {
        summary.functioning = section.replace(/^.*?:/i, '').trim();
      }
    });

    // Fallback: if parsing failed, use the full text
    if (!summary.reasonForVisit && !summary.psychiatricHistory) {
      summary.reasonForVisit = summaryText;
    }

    return summary;
  }
}
