export type AgentType = 'intake' | 'summary';

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
  clinicalSummary?: string;
  patientInfo?: PatientInfo;
  waitingForNegativeResponse?: boolean;
  waitingForSummaryConfirmation?: boolean;
  showSummaryForm?: boolean;
}

export interface PHQ9Response {
  question: number;
  score: number;
}

export interface PHQ9Result {
  responses: PHQ9Response[];
  totalScore: number;
}

export interface PatientInfo {
  name?: string;
  dob?: string;
  gender?: string;
  pronouns?: string;
  raceEthnicity?: string;
  address?: string;
  phone?: string;
  email?: string;
  emergencyContact?: string;
}

