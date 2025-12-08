/**
 * Zustand store for conversation state and agent coordination
 * Manages multi-agent flow, conversation history, and clinical data
 */

import { create } from 'zustand';
import { AgentType } from './openai';
import { Psychiatrist } from './supabase';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agent?: AgentType;
}

export interface IntakeData {
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
  pastPsychiatricHistory?: string;
  medications?: string;
  medicationDuration?: string;
  safetyConcerns?: string;
  substanceUse?: string;
  functionalImpact?: string;
  phq9Responses?: number[]; // Array of 9 responses (0-3 each)
  phq9Score?: number;
  patientAge?: number;
  patientGender?: string;
  completionPercentage: number;
  patientReadyForSummary?: boolean; // Patient has confirmed they're done sharing
}

export interface RecommendationPreferences {
  preferredLocation?: string;
  insuranceCarrier?: string;
  insurancePlan?: string;
  inNetworkOnly?: boolean;
  acceptsNewPatientsOnly?: boolean;
  acceptsCashPay?: boolean;
  // Track which preference questions have been asked
  currentQuestionIndex?: number; // 0=location, 1=insurance, 2=plan, 3=payment, 4=new patients
}

export interface ClinicalSummary {
  text: string;
  phq9Score: number;
  patientAge?: number;
  patientGender?: string;
  confirmed: boolean;
}

interface AppState {
  // Conversation state
  messages: Message[];
  isLoading: boolean;
  
  // Agent state
  currentAgent: AgentType;
  agentFlow: AgentType[];
  
  // Data state
  intakeData: IntakeData;
  clinicalSummary: ClinicalSummary | null;
  recommendationPreferences: RecommendationPreferences;
  selectedPsychiatrist: Psychiatrist | null;
  emailDraft: string | null;
  
  // Actions
  addMessage: (message: Omit<Message, 'id'>) => void;
  setLoading: (loading: boolean) => void;
  setCurrentAgent: (agent: AgentType) => void;
  updateIntakeData: (data: Partial<IntakeData>) => void;
  setClinicalSummary: (summary: ClinicalSummary) => void;
  updateRecommendationPreferences: (prefs: Partial<RecommendationPreferences>) => void;
  setSelectedPsychiatrist: (psychiatrist: Psychiatrist | null) => void;
  setEmailDraft: (draft: string | null) => void;
  reset: () => void;
}

const initialState = {
  messages: [] as Message[],
  isLoading: false,
  currentAgent: AgentType.INTAKE,
  agentFlow: [AgentType.INTAKE, AgentType.SUMMARY, AgentType.RECOMMENDATION, AgentType.BOOKING],
  intakeData: {
    completionPercentage: 0,
  } as IntakeData,
  clinicalSummary: null,
  recommendationPreferences: {},
  selectedPsychiatrist: null,
  emailDraft: null,
};

export const useAppStore = create<AppState>((set) => ({
  ...initialState,
  
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, { ...message, id: Date.now().toString() }],
  })),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setCurrentAgent: (agent) => set({ currentAgent: agent }),
  
  updateIntakeData: (data) => set((state) => ({
    intakeData: { ...state.intakeData, ...data },
  })),
  
  setClinicalSummary: (summary) => set({ clinicalSummary: summary }),
  
  updateRecommendationPreferences: (prefs) => set((state) => ({
    recommendationPreferences: { ...state.recommendationPreferences, ...prefs },
  })),
  
  setSelectedPsychiatrist: (psychiatrist) => set({ selectedPsychiatrist: psychiatrist }),
  
  setEmailDraft: (draft) => set({ emailDraft: draft }),
  
  reset: () => set(initialState),
}));

