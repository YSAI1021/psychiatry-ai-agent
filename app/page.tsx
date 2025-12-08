'use client';

import { useEffect, useState, useRef } from 'react';
import { useAppStore } from '@/lib/store';
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
import { generateIntakeResponse, parsePHQ9Responses, calculatePHQ9Score } from '@/lib/agents/intake-agent';
import { generateClinicalSummary } from '@/lib/agents/summary-agent';
import { generateRecommendationResponse, filterPsychiatrists } from '@/lib/agents/recommendation-agent';
import { generateBookingEmail, saveBooking, updateBookingStatus, sendEmail } from '@/lib/agents/booking-agent';
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
      
      addMessage({
        role: 'assistant',
        content: "Great! Now let's find you a psychiatrist. To help me make the best recommendation, I'll need to know a few things:\n\n1. What's your preferred location (city, state, or region)?\n2. Do you have insurance? If so, which carrier and plan?\n3. Do you prefer in-network providers, or are you open to cash pay?\n4. Do you want to see only psychiatrists who are accepting new patients?",
        agent: AgentType.RECOMMENDATION,
      });
    }
  }, [clinicalSummary?.confirmed, currentAgent]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    addMessage({ role: 'user', content: userMessage });

    setLoading(true);

    try {
      await processMessage(userMessage);
    } catch (error) {
      console.error('Error processing message:', error);
      addMessage({
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again or refresh the page.',
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

    // Generate intake response
    const response = await generateIntakeResponse(conversationHistory, intakeData);

    // Update intake data
    if (Object.keys(response.intakeData).length > 0) {
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
    if (response.shouldContinue && response.completionPercentage >= 75) {
      // Transition to summary agent
      setTimeout(async () => {
        await transitionToSummary();
      }, 1000);
    }
  };

  const transitionToSummary = async () => {
    setCurrentAgent(AgentType.SUMMARY);
    
    const summaryResponse = await generateClinicalSummary(
      intakeData,
      messages.map(m => ({ role: m.role, content: m.content }))
    );

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
        
        addMessage({
          role: 'assistant',
          content: "Great! Now let's find you a psychiatrist. To help me make the best recommendation, I'll need to know a few things:\n\n1. What's your preferred location (city, state, or region)?\n2. Do you have insurance? If so, which carrier and plan?\n3. Do you prefer in-network providers, or are you open to cash pay?\n4. Do you want to see only psychiatrists who are accepting new patients?",
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
    // Extract preferences from message
    const response = await generateRecommendationResponse(
      conversationHistory,
      recommendationPreferences
    );

    // Update preferences
    if (Object.keys(response.preferences).length > 0) {
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
    } else if (response.message.includes('found')) {
      // Try to filter with current preferences
      const filtered = await filterPsychiatrists(recommendationPreferences);
      if (filtered.length > 0) {
        setPsychiatrists(filtered);
        setRecommendationsReady(true);
      }
    }
  };

  const handleBookingAgent = async (userMessage: string) => {
    if (!selectedPsychiatrist || !clinicalSummary) return;

    // Check if user wants to proceed with booking
    if (userMessage.toLowerCase().includes('confirm') || 
        userMessage.toLowerCase().includes('send') ||
        userMessage.toLowerCase().includes('yes')) {
      
      // Generate email
      const bookingResponse = await generateBookingEmail(
        selectedPsychiatrist,
        clinicalSummary
      );

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

    // Generate email draft
    if (clinicalSummary) {
      const bookingResponse = await generateBookingEmail(
        psychiatrist,
        clinicalSummary
      );

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

      // Mock send email
      const emailSent = await sendEmail(
        selectedPsychiatrist.email || '',
        'New Patient Referral',
        emailToSend
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
        <h1 className="text-lg font-semibold">Psychiatry Intake Assistant</h1>
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
      <div className="px-4 pt-4">
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
                    Psychiatry Intake Assistant
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
