import OpenAI from 'openai';
import { Message, UserPreferences, Psychiatrist } from '@/types';
import { filterPsychiatrists } from '@/utils/psychiatristDatabase';

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
  ): Promise<{ response: string; isComplete: boolean; recommendations?: string; psychiatrists?: Psychiatrist[] }> {
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
      // Generate recommendations with psychiatrist data
      const result = await this.generateRecommendations(clinicalSummary);
      this.conversationHistory.push({ role: 'assistant', content: result.response });
      return {
        response: result.response,
        isComplete: true,
        recommendations: result.response,
        psychiatrists: result.psychiatrists,
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

    // Extract location preference (asked first)
    if (!this.preferences.location) {
      if (lowerResponse.includes('no preference') || lowerResponse.includes("don't care") || lowerResponse.includes("doesn't matter")) {
        this.preferences.location = 'no preference';
      } else {
        // Try to extract location keywords (cities, states, zip codes)
        const locationKeywords = [
          'new york', 'nyc', 'new york city',
          'los angeles', 'la', 'california', 'ca',
          'chicago', 'illinois', 'il',
          'houston', 'texas', 'tx',
          'phoenix', 'arizona', 'az',
          'philadelphia', 'pennsylvania', 'pa',
          'san antonio', 'san diego', 'dallas',
          'miami', 'florida', 'fl',
          'seattle', 'washington', 'wa',
          'boston', 'massachusetts', 'ma',
          'san francisco', 'sf',
        ];
        for (const keyword of locationKeywords) {
          if (lowerResponse.includes(keyword)) {
            this.preferences.location = keyword;
            break;
          }
        }
        // Check for zip code pattern
        const zipMatch = lowerResponse.match(/\b\d{5}\b/);
        if (zipMatch) {
          this.preferences.location = zipMatch[0];
        }
        // If no keyword match and response is substantial, use it as location
        if (!this.preferences.location && lowerResponse.length > 2 && !lowerResponse.includes('prefer')) {
          this.preferences.location = userResponse.trim();
        }
      }
    }

    // Extract gender preference (asked second)
    if (!this.preferences.preferredGender) {
      if (lowerResponse.includes('male') || lowerResponse.includes('man')) {
        this.preferences.preferredGender = 'male';
      } else if (lowerResponse.includes('female') || lowerResponse.includes('woman')) {
        this.preferences.preferredGender = 'female';
      } else if (lowerResponse.includes('non-binary') || lowerResponse.includes('nonbinary')) {
        this.preferences.preferredGender = 'non-binary';
      } else if (lowerResponse.includes('no preference') || lowerResponse.includes("don't care") || lowerResponse.includes("doesn't matter")) {
        this.preferences.preferredGender = 'no preference';
      }
    }
  }

  private allPreferencesCollected(): boolean {
    return !!(
      this.preferences.location &&
      this.preferences.preferredGender
    );
  }

  private getNextPreferenceQuestion(): string {
    if (!this.preferences.location) {
      return "What is your preferred location for your psychiatrist? You can provide a city, state, zip code, or say 'no preference'.";
    }
    if (!this.preferences.preferredGender) {
      return "Do you have a preferred gender for your psychiatrist? (e.g., male, female, non-binary, or no preference)";
    }

    return "Thank you! I have all the information I need.";
  }

  private async generateRecommendations(clinicalSummary: string): Promise<{ response: string; psychiatrists: Psychiatrist[] }> {
    // Query psychiatrist database based on preferences
    const matchingPsychiatrists = filterPsychiatrists({
      location: this.preferences.location,
      preferredGender: this.preferences.preferredGender,
    });

    if (matchingPsychiatrists.length === 0) {
      return {
        response: "I couldn't find any psychiatrists matching your preferences. Would you like to try different search criteria?",
        psychiatrists: [],
      };
    }

    // Generate a simple introduction message (no treatment advice)
    const locationText = this.preferences.location && this.preferences.location !== 'no preference' 
      ? ` in ${this.preferences.location}` 
      : '';
    
    const genderText = this.preferences.preferredGender && this.preferences.preferredGender !== 'no preference'
      ? ` (${this.preferences.preferredGender})`
      : '';

    const response = `I found ${matchingPsychiatrists.length} psychiatrist${matchingPsychiatrists.length > 1 ? 's' : ''}${locationText}${genderText} that match your preferences. Here are the available options:`;

    return {
      response,
      psychiatrists: matchingPsychiatrists,
    };
  }

  getPreferences(): Partial<UserPreferences> {
    return { ...this.preferences };
  }

  reset() {
    this.preferences = {};
    this.conversationHistory = [];
  }
}
