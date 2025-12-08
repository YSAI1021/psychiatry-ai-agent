export type AgentType = 'intake' | 'summary' | 'recommendation';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface ConversationState {
  messages: Message[];
  currentAgent: AgentType;
  topicsDiscussed: Set<string>;
  intakeComplete: boolean;
  summaryGenerated: boolean;
  phq9Completed: boolean;
  phq9Score?: number;
  userPreferences?: UserPreferences;
  clinicalSummary?: string;
}

export interface UserPreferences {
  preferredGender?: string;
  preferredLanguage?: string;
  therapyStyle?: string;
  insurance?: string;
  location?: string;
  availability?: string;
}

export interface PHQ9Response {
  question: number;
  score: number;
}

export interface PHQ9Result {
  responses: PHQ9Response[];
  totalScore: number;
}
