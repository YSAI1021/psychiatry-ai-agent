'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ClinicalSummary } from '@/lib/agents/summary-agent';

/**
 * Assessment Context
 * 
 * Manages global state for the psychiatric intake assessment session.
 * Tracks conversation history, PHQ-9 responses, and clinical summary data.
 */

export interface PHQ9Response {
  question: string;
  value: number; // 0-3
}

export interface AssessmentState {
  // Conversation data
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  
  // PHQ-9 data
  phq9Responses: PHQ9Response[];
  phq9Score: number;
  phq9Completed: boolean;
  
  // Clinical summary
  clinicalSummary: ClinicalSummary | null;
  summaryGenerated: boolean;
  
  // Flow control
  currentStep: 'intake' | 'phq9' | 'summary' | 'complete';
}

interface AssessmentContextType {
  state: AssessmentState;
  addMessage: (role: 'user' | 'assistant', content: string) => void;
  setPHQ9Responses: (responses: PHQ9Response[]) => void;
  setPHQ9Score: (score: number) => void;
  setPHQ9Completed: (completed: boolean) => void;
  setClinicalSummary: (summary: ClinicalSummary) => void;
  setCurrentStep: (step: AssessmentState['currentStep']) => void;
  resetAssessment: () => void;
}

const AssessmentContext = createContext<AssessmentContextType | undefined>(undefined);

const initialPHQ9Questions = [
  'Little interest or pleasure in doing things',
  'Feeling down, depressed, or hopeless',
  'Trouble falling or staying asleep, or sleeping too much',
  'Feeling tired or having little energy',
  'Poor appetite or overeating',
  'Feeling bad about yourself — or that you are a failure or have let yourself or your family down',
  'Trouble concentrating on things, such as reading the newspaper or watching television',
  'Moving or speaking so slowly that other people could have noticed. Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual',
  'Thoughts that you would be better off dead, or of hurting yourself',
];

const initialState: AssessmentState = {
  conversationHistory: [],
  phq9Responses: initialPHQ9Questions.map(q => ({ question: q, value: -1 })),
  phq9Score: 0,
  phq9Completed: false,
  clinicalSummary: null,
  summaryGenerated: false,
  currentStep: 'intake',
};

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AssessmentState>(initialState);

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    setState(prev => ({
      ...prev,
      conversationHistory: [...prev.conversationHistory, { role, content }],
    }));
  };

  const setPHQ9Responses = (responses: PHQ9Response[]) => {
    const score = responses.reduce((sum, r) => sum + (r.value >= 0 ? r.value : 0), 0);
    setState(prev => ({
      ...prev,
      phq9Responses: responses,
      phq9Score: score,
    }));
  };

  const setPHQ9Score = (score: number) => {
    setState(prev => ({ ...prev, phq9Score: score }));
  };

  const setPHQ9Completed = (completed: boolean) => {
    setState(prev => ({ ...prev, phq9Completed: completed }));
  };

  const setClinicalSummary = (summary: ClinicalSummary) => {
    setState(prev => ({
      ...prev,
      clinicalSummary: summary,
      summaryGenerated: true,
    }));
  };

  const setCurrentStep = (step: AssessmentState['currentStep']) => {
    setState(prev => ({ ...prev, currentStep: step }));
  };

  const resetAssessment = () => {
    setState(initialState);
  };

  return (
    <AssessmentContext.Provider
      value={{
        state,
        addMessage,
        setPHQ9Responses,
        setPHQ9Score,
        setPHQ9Completed,
        setClinicalSummary,
        setCurrentStep,
        resetAssessment,
      }}
    >
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessment() {
  const context = useContext(AssessmentContext);
  if (context === undefined) {
    throw new Error('useAssessment must be used within an AssessmentProvider');
  }
  return context;
}

