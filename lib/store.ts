/**
 * Global state management using Zustand
 * Manages chat state, summary data, recommendations, and test mode
 */

import { create } from 'zustand';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ClinicalSummary {
  chiefComplaint: string;
  symptoms: string[];
  symptomDuration: string;
  severity: 'mild' | 'moderate' | 'severe';
  priorDiagnoses: string[];
  currentMedications: string[];
  medicationHistory: string;
  safetyConcerns: {
    suicidalIdeation: boolean;
    selfHarm: boolean;
    hallucinations: boolean;
    delusions: boolean;
    aggression: boolean;
    notes: string;
  };
  functionalImpact: {
    work: string;
    relationships: string;
    dailyActivities: string;
  };
  preferences: {
    therapistGender?: string;
    treatmentApproach?: string[];
    availability?: string;
    otherNotes: string;
  };
  triageLevel: 'normal' | 'urgent' | 'emergency';
}

export interface Psychiatrist {
  id: string;
  name: string;
  specialty: string[];
  bio: string;
  experience: number;
  rating: number;
  availability: string[];
  tags: string[];
}

interface AppState {
  // Chat state
  messages: ChatMessage[];
  isChatActive: boolean;
  isProcessing: boolean;
  
  // Summary state
  summary: ClinicalSummary | null;
  summaryEdited: boolean;
  
  // Recommendations state
  recommendations: Psychiatrist[];
  
  // Test mode
  testMode: boolean;
  
  // Actions
  addMessage: (message: Omit<ChatMessage, 'timestamp'>) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setIsChatActive: (active: boolean) => void;
  setIsProcessing: (processing: boolean) => void;
  setSummary: (summary: ClinicalSummary) => void;
  updateSummary: (updates: Partial<ClinicalSummary>) => void;
  setRecommendations: (recommendations: Psychiatrist[]) => void;
  setTestMode: (enabled: boolean) => void;
  reset: () => void;
}

const defaultSummary: ClinicalSummary = {
  chiefComplaint: '',
  symptoms: [],
  symptomDuration: '',
  severity: 'mild',
  priorDiagnoses: [],
  currentMedications: [],
  medicationHistory: '',
  safetyConcerns: {
    suicidalIdeation: false,
    selfHarm: false,
    hallucinations: false,
    delusions: false,
    aggression: false,
    notes: '',
  },
  functionalImpact: {
    work: '',
    relationships: '',
    dailyActivities: '',
  },
  preferences: {
    otherNotes: '',
  },
  triageLevel: 'normal',
};

const defaultState = {
  messages: [],
  isChatActive: false,
  isProcessing: false,
  summary: null,
  summaryEdited: false,
  recommendations: [],
  testMode: false,
};

export const useAppStore = create<AppState>((set) => ({
  ...defaultState,
  
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, { ...message, timestamp: new Date() }],
    })),
  
  setMessages: (messages) => set({ messages }),
  
  setIsChatActive: (active) => set({ isChatActive: active }),
  
  setIsProcessing: (processing) => set({ isProcessing: processing }),
  
  setSummary: (summary) => set({ summary, summaryEdited: false }),
  
  updateSummary: (updates) =>
    set((state) => ({
      summary: state.summary
        ? { ...state.summary, ...updates }
        : { ...defaultSummary, ...updates },
      summaryEdited: true,
    })),
  
  setRecommendations: (recommendations) => set({ recommendations }),
  
  setTestMode: (enabled) => set({ testMode: enabled }),
  
  reset: () => set(defaultState),
}));

