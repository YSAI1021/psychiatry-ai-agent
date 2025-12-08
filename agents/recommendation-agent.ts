import OpenAI from 'openai';
import { Message, UserPreferences, Psychiatrist } from '@/types';

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

    // Extract location
    if (!this.preferences.location) {
      if (lowerResponse.includes('no preference') || lowerResponse.includes("don't care")) {
        this.preferences.location = 'no preference';
      } else {
        // Try to extract location keywords
        const locationKeywords = ['new york', 'nyc', 'los angeles', 'chicago', 'houston', 'phoenix', 'philadelphia', 'san antonio', 'san diego', 'dallas'];
        for (const keyword of locationKeywords) {
          if (lowerResponse.includes(keyword)) {
            this.preferences.location = keyword;
            break;
          }
        }
        if (!this.preferences.location && lowerResponse.length > 3) {
          // Use the response as location if it seems like a location
          this.preferences.location = userResponse;
        }
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
      return "What is your preferred psychiatrist location? (e.g., specific area, city, or 'no preference')";
    }
    if (!this.preferences.preferredGender) {
      return "What is your preferred gender for your psychiatrist? (e.g., male, female, non-binary, or no preference)";
    }

    return "Thank you! I have all the information I need.";
  }

  private async generateRecommendations(clinicalSummary: string): Promise<{ response: string; psychiatrists: Psychiatrist[] }> {
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
            content: `You are a recommendation agent that matches patients with psychiatrists. Generate 2-3 psychiatrist recommendations in JSON format.

Return ONLY valid JSON in this exact format:
{
  "response": "A brief text message introducing the recommendations",
  "psychiatrists": [
    {
      "id": "unique-id-1",
      "name": "Dr. First Last",
      "credential": "MD",
      "subspecialty": "e.g., Depression & Anxiety, ADHD, Bipolar Disorder",
      "inNetwork": true/false,
      "acceptingNewPatients": true/false,
      "availability": "e.g., Mon-Fri 9am-5pm",
      "bio": "Brief professional bio (2-3 sentences)"
    }
  ]
}`,
          },
          {
            role: 'user',
            content: `Clinical Summary:\n${clinicalSummary}\n\nPatient Preferences:\n${preferencesText}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);
      
      return {
        response: parsed.response || 'Here are some psychiatrists that match your needs:',
        psychiatrists: parsed.psychiatrists || [],
      };
    } catch (error) {
      console.error('Error generating recommendations:', error);
      // Return fallback data
      return {
        response: 'Here are some psychiatrists that match your needs:',
        psychiatrists: [
          {
            id: '1',
            name: 'Dr. Sarah Johnson',
            credential: 'MD',
            subspecialty: 'Depression & Anxiety',
            inNetwork: true,
            acceptingNewPatients: true,
            availability: 'Mon-Fri 9am-5pm',
            bio: 'Board-certified psychiatrist with 10+ years of experience specializing in mood disorders.',
          },
          {
            id: '2',
            name: 'Dr. Michael Chen',
            credential: 'DO',
            subspecialty: 'ADHD & Trauma',
            inNetwork: false,
            acceptingNewPatients: true,
            availability: 'Tue-Thu 10am-6pm',
            bio: 'Experienced psychiatrist focusing on ADHD and trauma-informed care.',
          },
        ],
      };
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
