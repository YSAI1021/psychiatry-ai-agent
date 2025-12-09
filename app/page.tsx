'use client';

import { useState } from 'react';
import ChatLayout from '@/components/ChatLayout';
import ChatInterface from '@/components/ChatInterface';
import PHQ9Form from '@/components/PHQ9Form';
import SummaryForm from '@/components/SummaryForm';
import { ClinicalSummary } from '@/agents/summary-agent';

type ViewState = 'chat' | 'phq9' | 'summary' | 'complete';

export default function Home() {
  const [viewState, setViewState] = useState<ViewState>('chat');
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [phq9Score, setPhq9Score] = useState<number | undefined>();
  const [clinicalSummary, setClinicalSummary] = useState<ClinicalSummary | null>(null);
  const [waitingForSummaryConfirmation, setWaitingForSummaryConfirmation] = useState(false);

  const handlePHQ9Complete = async (score: number) => {
    setPhq9Score(score);
    setViewState('chat');
    // The chat will ask about reviewing summary
    setWaitingForSummaryConfirmation(true);
  };

  const handleSummaryRequest = async (wantsSummary: boolean) => {
    setWaitingForSummaryConfirmation(false);
    
    if (!wantsSummary) {
      setViewState('complete');
      return;
    }
    
    // Generate summary
    try {
      const response = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationHistory,
          phq9Score: phq9Score,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const summary = await response.json();
      setClinicalSummary(summary);
      setViewState('summary');
    } catch (error) {
      console.error('Error generating summary:', error);
      alert('Failed to generate summary. Please try again.');
    }
  };

  const handleSummarySubmit = () => {
    setViewState('complete');
  };

  const renderSidebar = () => {
    if (viewState === 'phq9') {
      return <PHQ9Form onComplete={handlePHQ9Complete} />;
    }
    if (viewState === 'summary' && clinicalSummary) {
      return <SummaryForm summary={clinicalSummary} onSubmit={handleSummarySubmit} />;
    }
    return null;
  };

  return (
    <ChatLayout sidebar={renderSidebar()}>
      {viewState === 'complete' ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-lg text-gray-700">
              Thanks so much for sharing this information. Our psychiatry team will review everything and get back to you shortly.
            </p>
          </div>
        </div>
      ) : (
        <ChatInterface
          onTransitionToPHQ9={() => {
            setViewState('phq9');
            // Add message about PHQ-9
          }}
          onTransitionToSummary={() => setViewState('summary')}
          onMessagesUpdate={(msgs) => setConversationHistory(msgs)}
          waitingForSummaryConfirmation={waitingForSummaryConfirmation}
          onSummaryRequest={handleSummaryRequest}
        />
      )}
    </ChatLayout>
  );
}
