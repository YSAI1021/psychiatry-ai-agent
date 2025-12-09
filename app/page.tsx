'use client';

import { useState, useEffect, useRef } from 'react';
import { ImportantBanner } from '@/components/ImportantBanner';
import { ChatBox } from '@/components/ChatBox';
import { ChatMessage } from '@/components/ChatMessage';
import { PHQ9Form } from '@/components/PHQ9Form';
import { useAssessment } from '@/contexts/AssessmentContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

/**
 * Main Intake Page
 * 
 * Handles the intake conversation flow with the intake agent.
 * Manages transitions between chat, PHQ-9 form, and summary generation.
 */

export default function Home() {
  const { state, addMessage, setCurrentStep, setClinicalSummary } = useAssessment();
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.conversationHistory, streamingContent]);

  // Initialize with greeting if conversation is empty
  useEffect(() => {
    if (state.conversationHistory.length === 0 && state.currentStep === 'intake') {
      handleInitialGreeting();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInitialGreeting = async () => {
    const greeting = "Hello! I'm here to help you with your psychiatric intake assessment. I'll ask you some questions about your mental health history, symptoms, and current concerns. This information will help us understand your situation better.\n\nLet's begin. Can you tell me what brings you in today? What's your main concern or reason for seeking psychiatric care?";
    addMessage('assistant', greeting);
  };

  const handleSendMessage = async (userMessage: string) => {
    addMessage('user', userMessage);

    // Check if user wants to proceed to PHQ-9
    const lowerMessage = userMessage.toLowerCase();
    if (lowerMessage.includes('phq-9') || lowerMessage.includes('phq9') || 
        lowerMessage.includes('questionnaire') || lowerMessage.includes('complete')) {
      setCurrentStep('phq9');
      return;
    }

    setIsStreaming(true);
    setStreamingContent('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            ...state.conversationHistory.map(msg => ({
              role: msg.role,
              content: msg.content,
            })),
            { role: 'user' as const, content: userMessage },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let fullContent = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          fullContent += chunk;
          setStreamingContent(fullContent);
        }

        addMessage('assistant', fullContent);
        setStreamingContent('');

        // Check if assistant is asking to proceed to PHQ-9
        if (fullContent.toLowerCase().includes('phq-9') || 
            fullContent.toLowerCase().includes('questionnaire')) {
          // Small delay before transitioning
          setTimeout(() => {
            setCurrentStep('phq9');
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage('assistant', 'I apologize, but I encountered an error. Please try again.');
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
    }
  };

  const handlePHQ9Complete = async () => {
    // Ask if user wants to review summary
    const wantsSummary = window.confirm(
      'Would you like to review a clinical summary based on what you\'ve shared?'
    );

    if (wantsSummary) {
      setCurrentStep('summary');
      await generateSummary();
    } else {
      // Stay on PHQ-9 or allow them to go back
      setCurrentStep('intake');
    }
  };

  const generateSummary = async () => {
    try {
      const response = await fetch('/api/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationHistory: state.conversationHistory,
          phq9Score: state.phq9Score,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const summaryData = await response.json();
      
      // Set the summary in context - the summary page will use it
      setClinicalSummary(summaryData);
      router.push('/summary');
    } catch (error) {
      console.error('Error generating summary:', error);
      alert('Failed to generate summary. Please try again.');
    }
  };

  const handleContinueToSummary = () => {
    router.push('/summary');
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Spacer for fixed header */}
      <div className="h-14 shrink-0" />
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Important Banner - Always visible below header */}
        <div className="w-full px-4 py-3 sm:px-6 border-b border-border bg-background shrink-0">
          <ImportantBanner />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {state.currentStep === 'intake' && (
            <div className="max-w-3xl mx-auto space-y-4">
              {state.conversationHistory.map((msg, idx) => (
                <ChatMessage
                  key={idx}
                  role={msg.role}
                  content={msg.content}
                />
              ))}
              {isStreaming && streamingContent && (
                <ChatMessage
                  role="assistant"
                  content={streamingContent}
                  isStreaming={true}
                />
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {state.currentStep === 'phq9' && (
            <div className="max-w-3xl mx-auto">
              <PHQ9Form onComplete={handlePHQ9Complete} />
            </div>
          )}
        </div>

        {/* Chat Input (only show during intake) */}
        {state.currentStep === 'intake' && (
          <ChatBox
            onMessageSent={handleSendMessage}
            disabled={isStreaming}
          />
        )}

        {/* Navigation buttons for PHQ-9 */}
        {state.currentStep === 'phq9' && state.phq9Completed && (
          <div className="p-4 border-t border-border">
            <div className="max-w-3xl mx-auto">
              <Button onClick={handleContinueToSummary} className="w-full" size="lg">
                Continue to Summary
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
