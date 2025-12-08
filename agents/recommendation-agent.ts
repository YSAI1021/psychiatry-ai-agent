import OpenAI from 'openai';
import { Message, UserPreferences } from '@/types';

export class RecommendationAgent {
  private openai: OpenAI;
  private preferences: Partial<UserPreferences> = {};
  private conversationHistory: Message[] = [];

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async processPreferenceQuestion(
    userResponse: string,
    clinicalSummary: string
  ): Promise<{ response: string; isComplete: boolean; recommendations?: string }> {
    // Handle initial start
    if (userResponse.toLowerCase() === 'start' || userResponse.toLowerCase().trim() === '') {
      const firstQuestion = this.getNextPreferenceQuestion();
      this.conversationHistory.push({ role: 'assistant', content: firstQuestion });
      return {
        response: firstQuestion,
        isComplete: false,
      };
    }

    this.conversationHistory.push({ role: 'user', content: userResponse });

    // Extract preference from user response
    this.extractPreference(userResponse);

    // Check if all preferences are collected
    const allPreferencesCollected = this.allPreferencesCollected();

    if (allPreferencesCollected) {
      // Generate recommendations
      const recommendations = await this.generateRecommendations(clinicalSummary);
      this.conversationHistory.push({ role: 'assistant', content: recommendations });
      return {
        response: recommendations,
        isComplete: true,
        recommendations,
      };
    } else {
      // Ask next preference question
      const nextQuestion = this.getNextPreferenceQuestion();
      this.conversationHistory.push({ role: 'assistant', content: nextQuestion });
      return {
        response: nextQuestion,
        isComplete: false,
      };
    }
  }

  private extractPreference(userResponse: string): void {
    const lowerResponse = userResponse.toLowerCase();

    // Extract gender preference
    if (!this.preferences.preferredGender) {
      if (lowerResponse.includes('male') || lowerResponse.includes('man')) {
        this.preferences.preferredGender = 'male';
      } else if (lowerResponse.includes('female') || lowerResponse.includes('woman')) {
        this.preferences.preferredGender = 'female';
      } else if (lowerResponse.includes('non-binary') || lowerResponse.includes('nonbinary')) {
        this.preferences.preferredGender = 'non-binary';
      } else if (lowerResponse.includes('no preference') || lowerResponse.includes("don't care")) {
        this.preferences.preferredGender = 'no preference';
      }
    }

    // Extract language preference
    if (!this.preferences.preferredLanguage) {
      const languages = ['english', 'spanish', 'mandarin', 'french', 'german', 'other'];
      for (const lang of languages) {
        if (lowerResponse.includes(lang)) {
          this.preferences.preferredLanguage = lang;
          break;
        }
      }
    }

    // Extract therapy style
    if (!this.preferences.therapyStyle) {
      if (lowerResponse.includes('cbt') || lowerResponse.includes('cognitive')) {
        this.preferences.therapyStyle = 'CBT';
      } else if (lowerResponse.includes('psychodynamic')) {
        this.preferences.therapyStyle = 'psychodynamic';
      } else if (lowerResponse.includes('dbt')) {
        this.preferences.therapyStyle = 'DBT';
      } else if (lowerResponse.includes('medication') || lowerResponse.includes('medication management')) {
        this.preferences.therapyStyle = 'medication management';
      }
    }

    // Extract insurance
    if (!this.preferences.insurance && (lowerResponse.includes('insurance') || lowerResponse.includes('covered'))) {
      // Try to extract insurance name
      const insuranceKeywords = ['blue cross', 'aetna', 'cigna', 'unitedhealth', 'medicaid', 'medicare'];
      for (const keyword of insuranceKeywords) {
        if (lowerResponse.includes(keyword)) {
          this.preferences.insurance = keyword;
          break;
        }
      }
    }
  }

  private allPreferencesCollected(): boolean {
    return !!(
      this.preferences.preferredGender &&
      this.preferences.preferredLanguage &&
      this.preferences.therapyStyle
    );
  }

  private getNextPreferenceQuestion(): string {
    if (!this.preferences.preferredGender) {
      return "What is your preferred gender for your psychiatrist? (e.g., male, female, non-binary, or no preference)";
    }
    if (!this.preferences.preferredLanguage) {
      return "What is your preferred language for sessions? (e.g., English, Spanish, Mandarin, etc.)";
    }
    if (!this.preferences.therapyStyle) {
      return "What therapy style or approach are you interested in? (e.g., CBT, DBT, psychodynamic, medication management, etc.)";
    }
    if (!this.preferences.insurance) {
      return "Do you have insurance, and if so, which provider? (You can also say 'no insurance' or 'self-pay')";
    }
    if (!this.preferences.location) {
      return "Do you have a location preference? (e.g., specific area, city, or 'no preference')";
    }

    return "Thank you! I have all the information I need.";
  }

  private async generateRecommendations(clinicalSummary: string): Promise<string> {
    const preferencesText = Object.entries(this.preferences)
      .filter(([_, value]) => value)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a recommendation agent that matches patients with psychiatrists based on clinical needs and preferences.

Generate a helpful recommendation that:
1. Matches the patient's clinical needs from the summary
2. Respects their preferences
3. Provides 2-3 psychiatrist recommendations (you can create realistic examples)
4. Explains why each psychiatrist is a good match
5. Includes relevant details like specialization, approach, and availability

Be warm, professional, and helpful.`,
          },
          {
            role: 'user',
            content: `Clinical Summary:\n${clinicalSummary}\n\nPatient Preferences:\n${preferencesText}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
      });

      return completion.choices[0]?.message?.content || 'Unable to generate recommendations.';
    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw new Error('Failed to generate recommendations. Please try again.');
    }
  }

  getPreferences(): Partial<UserPreferences> {
    return { ...this.preferences };
  }

  reset() {
    this.preferences = {};
    this.conversationHistory = [];
  }
}
