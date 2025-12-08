'use client';

import { useEffect, useState, useRef } from 'react';
import { useAppStore, IntakeData, ClinicalSummary, RecommendationPreferences } from '@/lib/store';
import { AgentType } from '@/lib/openai';
import { ChatContainer } from '@/components/chat/chat-container';
import { ChatInput } from '@/components/chat/chat-input';
import { SecurityDisclaimer } from '@/components/security-disclaimer';
import { ClinicalSummaryView } from '@/components/clinical-summary-view';
import { PsychiatristCard } from '@/components/psychiatrist-card';
import { EmailPreview } from '@/components/email-preview';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { parsePHQ9Responses, parsePHQ9Response, calculatePHQ9Score } from '@/lib/agents/intake-agent';
import { filterPsychiatrists } from '@/lib/agents/recommendation-agent';
import { saveBooking, updateBookingStatus, sendEmail } from '@/lib/agents/booking-agent';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const {
    messages,
    isLoading,
    currentAgent,
    intakeData,
    clinicalSummary,
    recommendationPreferences,
    selectedPsychiatrist,
    emailDraft,
    addMessage,
    setLoading,
    setCurrentAgent,
    updateIntakeData,
    setClinicalSummary,
    updateRecommendationPreferences,
    setSelectedPsychiatrist,
    setEmailDraft,
  } = useAppStore();

  const [inputValue, setInputValue] = useState('');
  const [psychiatrists, setPsychiatrists] = useState<any[]>([]);
  const [recommendationsReady, setRecommendationsReady] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0 && currentAgent === AgentType.INTAKE) {
      const welcomeMessage = {
        role: 'assistant' as const,
        content: "Hello! I'm here to help you with your psychiatric intake assessment. I'll ask you some questions about your mental health history, symptoms, and current concerns. This information will help match you with an appropriate psychiatrist.\n\nLet's begin. Can you tell me what brings you in today? What's your main concern or reason for seeking psychiatric care?",
        agent: AgentType.INTAKE,
      };
      addMessage(welcomeMessage);
    }
  }, []);

  // Auto-transition when summary is confirmed
  useEffect(() => {
    if (clinicalSummary?.confirmed && currentAgent === AgentType.SUMMARY) {
      // Save summary to Supabase
      (async () => {
        try {
          await supabase.from('clinical_summaries').insert({
            summary_text: clinicalSummary.text,
            phq9_score: clinicalSummary.phq9Score,
            patient_age: clinicalSummary.patientAge,
            patient_gender: clinicalSummary.patientGender,
          });
        } catch (error) {
          console.error('Error saving summary:', error);
        }
      })();

      // Transition to recommendation agent
      setCurrentAgent(AgentType.RECOMMENDATION);
      
      // Start recommendation agent - it will ask questions sequentially
      addMessage({
        role: 'assistant',
        content: "Great! Now let's find you a psychiatrist. I'll ask you a few questions about your preferences.",
        agent: AgentType.RECOMMENDATION,
      });
    }
  }, [clinicalSummary?.confirmed, currentAgent]);

  /**
   * Helper function to call the chat API route with retry logic
   * This ensures OpenAI calls happen server-side where the API key is available
   * Implements retry logic for network failures and API errors
   */
  const callChatAPI = async (
    payload: {
      agentType: AgentType;
      userMessage: string;
      conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
      intakeData?: Partial<IntakeData>;
      clinicalSummary?: ClinicalSummary;
      recommendationPreferences?: Partial<RecommendationPreferences>;
      selectedPsychiatrist?: any;
    },
    retries = 2
  ) => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          // Don't retry on client errors (4xx), only on server errors (5xx)
          if (response.status >= 400 && response.status < 500) {
            console.error('[Client] Client error (no retry):', {
              status: response.status,
              data,
            });
            throw new Error(data.error || 'API request failed');
          }

          // Retry on server errors
          if (attempt < retries) {
            console.warn(`[Client] Server error, retrying (${attempt + 1}/${retries})...`, {
              status: response.status,
            });
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
            continue;
          }

          console.error('[Client] API error after retries:', {
            status: response.status,
            data,
          });
          throw new Error(data.error || 'API request failed');
        }

        return data.data;
      } catch (error: any) {
        // Network errors - retry
        if (attempt < retries && (error.name === 'TypeError' || error.message.includes('fetch'))) {
          console.warn(`[Client] Network error, retrying (${attempt + 1}/${retries})...`, error.message);
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
          continue;
        }

        // Final attempt failed or non-retryable error
        console.error('[Client] Error calling chat API:', {
          message: error.message,
          stack: error.stack,
          attempt,
        });
        throw error;
      }
    }
    
    throw new Error('Failed after all retry attempts');
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    addMessage({ role: 'user', content: userMessage });

    setLoading(true);

    try {
      await processMessage(userMessage);
    } catch (error: any) {
      console.error('[Client] Error processing message:', {
        message: error.message,
        stack: error.stack,
      });
      
      // User-friendly error messages
      let errorMessage = 'I apologize, but I encountered an error. Please try again.';
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = 'Connection error. Please check your internet connection and try again.';
      } else if (error.message?.includes('API key') || error.message?.includes('OpenAI')) {
        errorMessage = 'Service temporarily unavailable. Please try again in a moment.';
      }
      
      addMessage({
        role: 'assistant',
        content: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const processMessage = async (userMessage: string) => {
    const conversationHistory = messages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    switch (currentAgent) {
      case AgentType.INTAKE:
        await handleIntakeAgent(userMessage, conversationHistory);
        break;
      case AgentType.SUMMARY:
        await handleSummaryAgent(userMessage);
        break;
      case AgentType.RECOMMENDATION:
        await handleRecommendationAgent(userMessage, conversationHistory);
        break;
      case AgentType.BOOKING:
        await handleBookingAgent(userMessage);
        break;
    }
  };

  const handleIntakeAgent = async (
    userMessage: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  ) => {
    // Check if this might be PHQ-9 responses
    const phq9Responses = parsePHQ9Responses(userMessage);
    if (phq9Responses) {
      const phq9Score = calculatePHQ9Score(phq9Responses);
      updateIntakeData({
        phq9Responses,
        phq9Score,
      });
    }

    // Generate intake response via API (server-side)
    const response = await callChatAPI({
      agentType: AgentType.INTAKE,
      userMessage,
      conversationHistory,
      intakeData,
    });

    // Update intake data
    if (Object.keys(response.intakeData || {}).length > 0) {
      updateIntakeData({
        ...response.intakeData,
        completionPercentage: response.completionPercentage,
      });
    }

    // Add assistant message
    addMessage({
      role: 'assistant',
      content: response.message,
      agent: AgentType.INTAKE,
    });

    // Check if ready to proceed to summary
    // Must have: all PHQ-9 items, patient confirmed readiness, and 75%+ completion
    if (response.shouldContinue) {
      // Transition to summary agent
      setTimeout(async () => {
        await transitionToSummary();
      }, 1000);
    }
  };

  const transitionToSummary = async () => {
    setCurrentAgent(AgentType.SUMMARY);
    
    // Generate clinical summary via API (server-side)
    const summaryResponse = await callChatAPI({
      agentType: AgentType.SUMMARY,
      userMessage: 'Generate summary',
      conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
      intakeData,
    });

    setClinicalSummary(summaryResponse.summary);
    
    addMessage({
      role: 'assistant',
      content: summaryResponse.message,
      agent: AgentType.SUMMARY,
    });
  };

  const handleSummaryAgent = async (userMessage: string) => {
    // Check if user wants to proceed
    if (userMessage.toLowerCase().includes('confirm') || 
        userMessage.toLowerCase().includes('yes') ||
        userMessage.toLowerCase().includes('continue') ||
        userMessage.toLowerCase().includes('proceed')) {
      
      if (clinicalSummary) {
        // Save summary to Supabase
        try {
          await supabase.from('clinical_summaries').insert({
            summary_text: clinicalSummary.text,
            phq9_score: clinicalSummary.phq9Score,
            patient_age: clinicalSummary.patientAge,
            patient_gender: clinicalSummary.patientGender,
          });
        } catch (error) {
          console.error('Error saving summary:', error);
        }

        // Update summary as confirmed
        setClinicalSummary({ ...clinicalSummary, confirmed: true });

        // Transition to recommendation agent
        setCurrentAgent(AgentType.RECOMMENDATION);
        
        // Start recommendation agent - it will ask questions sequentially
        addMessage({
          role: 'assistant',
          content: "Great! Now let's find you a psychiatrist. I'll ask you a few questions about your preferences.",
          agent: AgentType.RECOMMENDATION,
        });
      }
    } else {
      // User might be asking for changes - let them edit via the UI
      addMessage({
        role: 'assistant',
        content: 'Please use the form below to make any edits to your clinical summary. Once you\'re satisfied, click "Confirm and Continue" to proceed.',
        agent: AgentType.SUMMARY,
      });
    }
  };

  const handleRecommendationAgent = async (
    userMessage: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  ) => {
    // Generate recommendation response via API (server-side)
    const response = await callChatAPI({
      agentType: AgentType.RECOMMENDATION,
      userMessage,
      conversationHistory,
      recommendationPreferences,
    });

    // Update preferences
    if (Object.keys(response.preferences || {}).length > 0) {
      updateRecommendationPreferences(response.preferences);
    }

    addMessage({
      role: 'assistant',
      content: response.message,
      agent: AgentType.RECOMMENDATION,
    });

    // If we have psychiatrists, display them
    if (response.psychiatrists && response.psychiatrists.length > 0) {
      setPsychiatrists(response.psychiatrists);
      setRecommendationsReady(true);
    } else if (response.message?.includes('found')) {
      // Try to filter with current preferences (client-side filtering from Supabase)
      try {
        const filtered = await filterPsychiatrists(response.preferences || recommendationPreferences);
        if (filtered.length > 0) {
          setPsychiatrists(filtered);
          setRecommendationsReady(true);
        }
      } catch (error) {
        console.error('[Client] Error filtering psychiatrists:', error);
      }
    }
  };

  const handleBookingAgent = async (userMessage: string) => {
    if (!selectedPsychiatrist || !clinicalSummary) return;

    // Check if user wants to proceed with booking
    if (userMessage.toLowerCase().includes('confirm') || 
        userMessage.toLowerCase().includes('send') ||
        userMessage.toLowerCase().includes('yes')) {
      
      // Generate email via API (server-side)
      const bookingResponse = await callChatAPI({
        agentType: AgentType.BOOKING,
        userMessage,
        conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
        selectedPsychiatrist,
        clinicalSummary,
      });

      setEmailDraft(bookingResponse.emailDraft);
      
      addMessage({
        role: 'assistant',
        content: bookingResponse.message,
        agent: AgentType.BOOKING,
      });
    } else {
      addMessage({
        role: 'assistant',
        content: 'Please select a psychiatrist from the recommendations above, or let me know if you\'d like to adjust your preferences.',
        agent: AgentType.BOOKING,
      });
    }
  };

  const handlePsychiatristSelect = async (psychiatrist: any) => {
    setSelectedPsychiatrist(psychiatrist);
    setCurrentAgent(AgentType.BOOKING);

    // Generate email draft via API (server-side)
    if (clinicalSummary) {
      const bookingResponse = await callChatAPI({
        agentType: AgentType.BOOKING,
        userMessage: 'Generate booking email',
        conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
        selectedPsychiatrist: psychiatrist,
        clinicalSummary,
      });

      setEmailDraft(bookingResponse.emailDraft);

      addMessage({
        role: 'assistant',
        content: `You've selected ${psychiatrist.name}. ${bookingResponse.message}`,
        agent: AgentType.BOOKING,
      });
    }
  };

  const handleEmailSend = async () => {
    const emailToSend = emailDraft || '';
    if (!emailToSend || !selectedPsychiatrist) return;

    try {
      // Save booking to database
      const booking = await saveBooking(
        selectedPsychiatrist.id,
        selectedPsychiatrist.name,
        emailToSend
      );

      // Send email with clinical summary attachment
      const emailSent = await sendEmail(
        selectedPsychiatrist.email || '',
        'New Patient Referral',
        emailToSend,
        clinicalSummary?.text, // Attach clinical summary as text file
        `clinical-summary-${new Date().toISOString().split('T')[0]}.txt`
      );

      if (emailSent) {
        // Update booking status
        if (booking.id) {
          await updateBookingStatus(booking.id, 'sent');
        }

        addMessage({
          role: 'assistant',
          content: `Great! Your referral email has been sent to ${selectedPsychiatrist.name}. They should be in touch with you soon to schedule an appointment. Thank you for using our service!`,
          agent: AgentType.BOOKING,
        });

        setEmailDraft(null);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      addMessage({
        role: 'assistant',
        content: 'I apologize, but there was an error sending the email. Please try again.',
        agent: AgentType.BOOKING,
      });
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <h1 className="text-lg font-semibold">PsyConnect Agents</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </header>

      {/* Security Disclaimer */}
      <div className="px-4 pt-2 pb-1">
        <SecurityDisclaimer />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="mx-auto flex h-full max-w-4xl flex-col">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="max-w-2xl text-center">
                  <h2 className="mb-4 text-2xl font-semibold">
                    PsyConnect Agents
                  </h2>
                  <p className="text-muted-foreground">
                    I'm here to help with your psychiatric intake. Let's start by
                    gathering some information about your mental health history.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex w-full items-start gap-4 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                        AI
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                        {message.content}
                      </p>
                      {message.agent && message.role === 'assistant' && (
                        <div className="mt-2 text-xs opacity-70">
                          {message.agent === AgentType.INTAKE && 'Intake Agent'}
                          {message.agent === AgentType.SUMMARY && 'Summary Agent'}
                          {message.agent === AgentType.RECOMMENDATION && 'Recommendation Agent'}
                          {message.agent === AgentType.BOOKING && 'Booking Agent'}
                        </div>
                      )}
                    </div>
                    {message.role === 'user' && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
                        You
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                      AI
                    </div>
                    <div className="bg-muted text-muted-foreground rounded-2xl px-4 py-3">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-current" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Clinical Summary View - shown when summary agent is active and not confirmed */}
            {currentAgent === AgentType.SUMMARY && clinicalSummary && !clinicalSummary.confirmed && (
              <div className="mb-4">
                <ClinicalSummaryView />
              </div>
            )}

            {/* Psychiatrist Recommendations */}
            {currentAgent === AgentType.RECOMMENDATION && recommendationsReady && psychiatrists.length > 0 && (
              <div className="mb-4 space-y-4">
                <h3 className="text-lg font-semibold">Recommended Psychiatrists</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {psychiatrists.map((psychiatrist) => (
                    <PsychiatristCard
                      key={psychiatrist.id}
                      psychiatrist={psychiatrist}
                      onSelect={handlePsychiatristSelect}
                      selected={selectedPsychiatrist?.id === psychiatrist.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Email Preview */}
            {currentAgent === AgentType.BOOKING && emailDraft && selectedPsychiatrist && (
              <EmailPreview
                emailDraft={emailDraft}
                psychiatristName={selectedPsychiatrist.name}
                onEdit={(editedEmail) => {
                  setEmailDraft(editedEmail);
                }}
                onSend={async (emailContent) => {
                  setEmailDraft(emailContent);
                  await handleEmailSend();
                }}
                onCancel={() => setEmailDraft(null)}
              />
            )}
          </div>

          {/* Chat Input */}
          <div className="border-t border-border">
            <ChatInput
              value={inputValue}
              onChange={setInputValue}
              onSend={handleSend}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
