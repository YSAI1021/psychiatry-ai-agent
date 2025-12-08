export type AgentType = 'intake' | 'summary' | 'recommendation' | 'booking';

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
  patientInfo?: PatientInfo;
  waitingForNegativeResponse?: boolean;
  showSummaryForm?: boolean;
  selectedPsychiatrist?: Psychiatrist;
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

export interface Psychiatrist {
  id: string;
  name: string;
  credential: string; // MD, DO, etc.
  subspecialty: string;
  inNetwork: boolean;
  acceptingNewPatients: boolean;
  availability: string;
  bio?: string;
  languages?: string[];
  yearsOfExperience?: number;
  additionalCredentials?: string[];
  location?: string;
  gender?: string;
}

export interface BookingEmail {
  to: string;
  subject: string;
  body: string;
}
