/**
 * Global state management using Zustand
 * Manages multi-agent chat flow, structured summary, and session state
 */

import { create } from 'zustand';
import { PHQ9Assessment } from './phq9';

export type AgentRole = 'intake' | 'summary' | 'recommendation' | 'booking';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  agent?: AgentRole; // Which agent sent this message
  metadata?: {
    phq9QuestionId?: number;
    structuredData?: any;
  };
}

/**
 * Structured clinical summary based on DSM/psychiatric interview format
 */
export interface ClinicalSummary {
  // Identifying Information
  identifyingInfo: {
    age?: string;
    gender?: string;
    preferredPronouns?: string;
  };
  
  // Chief Complaint
  chiefComplaint: string;
  
  // History of Present Illness
  historyOfPresentIllness: {
    onset: string;
    duration: string;
    course: string;
    triggers: string;
    previousEpisodes: string;
  };
  
  // Past Psychiatric History
  pastPsychiatricHistory: {
    diagnoses: string[];
    treatments: string[];
    hospitalizations: string[];
    therapyHistory: string;
  };
  
  // Medication History
  medicationHistory: {
    currentMedications: Array<{
      name: string;
      dosage: string;
      duration: string;
    }>;
    pastMedications: string[];
    medicationTrials: string;
  };
  
  // Medical History
  medicalHistory: {
    conditions: string[];
    surgeries: string[];
    allergies: string[];
  };
  
  // Substance Use History
  substanceUseHistory: {
    alcohol: string;
    tobacco: string;
    illicit: string;
    caffeine: string;
  };
  
  // Family History
  familyHistory: {
    psychiatricConditions: string[];
    medicalConditions: string[];
    suicideAttempts: string;
  };
  
  // Symptoms
  symptoms: Array<{
    symptom: string;
    severity: 'mild' | 'moderate' | 'severe';
    duration: string;
    frequency: string;
  }>;
  
  // Functional Impact
  functionalImpact: {
    work: string;
    relationships: string;
    dailyActivities: string;
    social: string;
  };
  
  // Safety Concerns
  safetyConcerns: {
    suicidalIdeation: boolean;
    suicidalPlan: boolean;
    suicidalIntent: boolean;
    selfHarm: boolean;
    homicidalIdeation: boolean;
    hallucinations: boolean;
    delusions: boolean;
    riskLevel: 'low' | 'moderate' | 'high' | 'emergency';
    notes: string;
  };
  
  // Preferences
  preferences: {
    therapistGender?: string;
    treatmentApproach?: string[];
    insurance?: string;
    location?: string;
    availability?: string;
    otherNotes: string;
  };
  
  // PHQ-9 Assessment
  phq9: PHQ9Assessment | null;
}

export interface Psychiatrist {
  id: string;
  name: string;
  specialty: string[];
  location: string;
  insurance: {
    carriers: string[];
    networkStatus: 'in-network' | 'out-of-network' | 'both';
  };
  bio: string;
  experience: number;
  rating: number;
  availability: string[];
  tags: string[];
}

interface AppState {
  // Chat state
  messages: ChatMessage[];
  isProcessing: boolean;
  currentAgent: AgentRole;
  
  // Session state
  sessionId: string | null;
  intakeComplete: boolean;
  summaryComplete: boolean;
  recommendationsComplete: boolean;
  bookingComplete: boolean;
  
  // Structured data
  summary: ClinicalSummary | null;
  recommendations: Psychiatrist[];
  selectedPsychiatrist: Psychiatrist | null;
  
  // Actions
  addMessage: (message: Omit<ChatMessage, 'metadata'> & { metadata?: ChatMessage['metadata'] }) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setIsProcessing: (processing: boolean) => void;
  setCurrentAgent: (agent: AgentRole) => void;
  setSessionId: (id: string) => void;
  setIntakeComplete: (complete: boolean) => void;
  setSummaryComplete: (complete: boolean) => void;
  setRecommendationsComplete: (complete: boolean) => void;
  setBookingComplete: (complete: boolean) => void;
  setSummary: (summary: ClinicalSummary) => void;
  setRecommendations: (recommendations: Psychiatrist[]) => void;
  setSelectedPsychiatrist: (psych: Psychiatrist | null) => void;
  reset: () => void;
}

const defaultState = {
  messages: [],
  isProcessing: false,
  currentAgent: 'intake' as AgentRole,
  sessionId: null,
  intakeComplete: false,
  summaryComplete: false,
  recommendationsComplete: false,
  bookingComplete: false,
  summary: null,
  recommendations: [],
  selectedPsychiatrist: null,
};

export const useAppStore = create<AppState>((set) => ({
  ...defaultState,
  
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, { ...message, metadata: message.metadata || {} }],
    })),
  
  setMessages: (messages) => set({ messages }),
  
  setIsProcessing: (processing) => set({ isProcessing: processing }),
  
  setCurrentAgent: (agent) => set({ currentAgent: agent }),
  
  setSessionId: (id) => set({ sessionId: id }),
  
  setIntakeComplete: (complete) => set({ intakeComplete: complete }),
  
  setSummaryComplete: (complete) => set({ summaryComplete: complete }),
  
  setRecommendationsComplete: (complete) => set({ recommendationsComplete: complete }),
  
  setBookingComplete: (complete) => set({ bookingComplete: complete }),
  
  setSummary: (summary) => set({ summary }),
  
  setRecommendations: (recommendations) => set({ recommendations }),
  
  setSelectedPsychiatrist: (psych) => set({ selectedPsychiatrist: psych }),
  
  reset: () => set(defaultState),
}));

