'use client';

import { useState, useRef, useEffect } from 'react';
import { Message, AgentType, ConversationState, PHQ9Response, Psychiatrist, BookingEmail } from '@/types';
import { detectTopics } from '@/utils/topicDetection';
import PHQ9Questionnaire from './PHQ9Questionnaire';
import SummaryForm from './SummaryForm';
import PsychiatristCard from './PsychiatristCard';
import { PatientInfo } from '@/types';

interface ChatInterfaceProps {
  onStateChange: (state: ConversationState) => void;
}

export default function ChatInterface({ onStateChange }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm here to help you with your psychiatric intake assessment. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<AgentType>('intake');
  const [topicsDiscussed, setTopicsDiscussed] = useState<Set<string>>(new Set());
  const [intakeComplete, setIntakeComplete] = useState(false);
  const [showPHQ9, setShowPHQ9] = useState(false);
  const [phq9Score, setPhq9Score] = useState<number | undefined>();
  const [summaryGenerated, setSummaryGenerated] = useState(false);
  const [clinicalSummary, setClinicalSummary] = useState<string>('');
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [waitingForNegativeResponse, setWaitingForNegativeResponse] = useState(false);
  const [showPHQ9Message, setShowPHQ9Message] = useState(false);
  const [showSummaryForm, setShowSummaryForm] = useState(false);
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({});
  const [selectedPsychiatrist, setSelectedPsychiatrist] = useState<Psychiatrist | null>(null);
  const [psychiatrists, setPsychiatrists] = useState<Psychiatrist[]>([]);
  const [viewingBio, setViewingBio] = useState<Psychiatrist | null>(null);
  const [bookingEmail, setBookingEmail] = useState<BookingEmail | null>(null);
  const [showEmailEditor, setShowEmailEditor] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const streamResponse = async (url: string, body: any): Promise<string> => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error('Failed to get response');
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    if (!reader) {
      throw new Error('No response body');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      fullText += chunk;
      
      // Update the last message with streaming content
      setMessages(prev => {
        const newMessages = [...prev];
        if (newMessages[newMessages.length - 1]?.role === 'assistant') {
          newMessages[newMessages.length - 1] = {
            ...newMessages[newMessages.length - 1],
            content: fullText,
          };
        } else {
          newMessages.push({ role: 'assistant', content: fullText });
        }
        return newMessages;
      });
    }

    return fullText;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      if (currentAgent === 'intake') {
        const state: ConversationState = {
          messages,
          currentAgent: 'intake',
          topicsDiscussed,
          intakeComplete,
          summaryGenerated,
          phq9Completed: showPHQ9,
          phq9Score,
        };

        const response = await streamResponse('/api/intake', {
          message: userMessage,
          state,
        });

        // Update topics discussed from the response
        const detectedTopics = detectTopics(userMessage);
        setTopicsDiscussed(prev => {
          const newSet = new Set(prev);
          detectedTopics.forEach(topic => newSet.add(topic));
          return newSet;
        });

        // Check if agent asked "Is there anything else you'd like to share first?"
        if (response.toLowerCase().includes('anything else') && !intakeComplete && !waitingForNegativeResponse) {
          setWaitingForNegativeResponse(true);
        }

        // Check if user gave negative response (no, that's all, etc.)
        if (waitingForNegativeResponse) {
          const lowerMessage = userMessage.toLowerCase();
          const negativeResponses = ['no', "that's all", "that's it", 'nothing else', 'no thanks', "i'm done", "i'm finished"];
          const isNegative = negativeResponses.some(neg => lowerMessage.includes(neg));
          
          if (isNegative) {
            setWaitingForNegativeResponse(false);
            setIntakeComplete(true);
            setShowPHQ9Message(true);
            // Wait a moment before showing PHQ-9
            setTimeout(() => {
              setShowPHQ9Message(false);
              setShowPHQ9(true);
            }, 2000);
          }
        }
      } else if (currentAgent === 'recommendation') {
        const fullResponse = await streamResponse('/api/recommendation', {
          userResponse: userMessage,
          clinicalSummary,
          preferences: {},
        });
        
        // Try to parse psychiatrist data from response (look for JSON at the end)
        try {
          // Find the last JSON object in the response
          const jsonMatches = fullResponse.match(/\{[^{}]*"psychiatrists"[^{}]*\[[^\]]*\][^{}]*\}/g);
          if (jsonMatches && jsonMatches.length > 0) {
            const lastMatch = jsonMatches[jsonMatches.length - 1];
            const parsed = JSON.parse(lastMatch);
            if (parsed.psychiatrists && Array.isArray(parsed.psychiatrists) && parsed.psychiatrists.length > 0) {
              setPsychiatrists(parsed.psychiatrists);
              // Add message asking if they want to learn more
              setTimeout(() => {
                setMessages(prev => [
                  ...prev,
                  { role: 'assistant', content: 'Would you like to learn more about a specific psychiatrist?' },
                ]);
              }, 500);
            }
          }
        } catch (e) {
          // Not JSON, continue
          console.log('Could not parse psychiatrist data:', e);
        }
      } else if (currentAgent === 'summary') {
        // Handle summary form responses
        const lowerMessage = userMessage.toLowerCase();
        if (lowerMessage.includes('yes') || lowerMessage.includes('sure') || lowerMessage.includes('ok')) {
          handleSummaryRequest(true);
        } else {
          handleSummaryRequest(false);
        }
      } else if (currentAgent === 'booking') {
        const response = await streamResponse('/api/booking', {
          userResponse: userMessage,
          clinicalSummary,
          patientInfo,
          selectedPsychiatrist,
        });
        
        // Try to parse email from response
        try {
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.to && parsed.subject && parsed.body) {
              setBookingEmail(parsed);
              setShowEmailEditor(true);
            }
          }
        } catch (e) {
          // Not JSON, continue
        }
      }
      
      // Handle recommendation follow-up questions
      if (currentAgent === 'recommendation' && psychiatrists.length > 0) {
        const lowerMessage = userMessage.toLowerCase();
        if (lowerMessage.includes('yes') && lowerMessage.includes('learn more')) {
          // User wants to see bio - this will be handled by viewingBio state
        } else if (lowerMessage.includes('select') || lowerMessage.includes('choose')) {
          // User selected a psychiatrist
          const selected = psychiatrists.find(p => 
            lowerMessage.includes(p.name.toLowerCase().split(' ')[1]?.toLowerCase() || '')
          );
          if (selected) {
            setSelectedPsychiatrist(selected);
            setCurrentAgent('booking');
            setMessages(prev => [
              ...prev,
              { role: 'assistant', content: 'Would you like help reaching out to them to book an appointment?' },
            ]);
          }
        }
      }
      
      // Handle summary form submission follow-up
      if (showSummaryForm === false && summaryGenerated && patientInfo.name) {
        const lowerMessage = userMessage.toLowerCase();
        if (lowerMessage.includes('yes') && lowerMessage.includes('recommendation')) {
          setCurrentAgent('recommendation');
          const recommendationResponse = await streamResponse('/api/recommendation', {
            userResponse: 'start',
            clinicalSummary,
            preferences: {},
          });
        }
      }
      
      // Check if user wants to review summary after PHQ-9
      if (phq9Score && !summaryGenerated && !showSummaryForm) {
        const lowerMessage = userMessage.toLowerCase();
        if (lowerMessage.includes('yes') || lowerMessage.includes('sure') || lowerMessage.includes('ok')) {
          handleSummaryRequest(true);
        } else if (lowerMessage.includes('no') || lowerMessage.includes('skip')) {
          handleSummaryRequest(false);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'I apologize, but I encountered an error. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePHQ9Complete = async (score: number, responses: PHQ9Response[]) => {
    setPhq9Score(score);
    setShowPHQ9(false);
    
    // Ask if they want to review clinical summary
    setMessages(prev => [
      ...prev,
      { role: 'assistant', content: 'Would you like to review a clinical summary based on your responses?' },
    ]);
  };

  const handleSummaryRequest = async (wantsSummary: boolean) => {
    if (!wantsSummary) {
      // Skip to recommendations
      setCurrentAgent('recommendation');
      const recommendationResponse = await streamResponse('/api/recommendation', {
        userResponse: 'start',
        clinicalSummary: '',
        preferences: {},
      });
      return;
    }

    // Generate summary
    setIsLoading(true);
    try {
      const summary = await streamResponse('/api/summary', {
        conversationHistory: messages,
        phq9Score: phq9Score,
      });
      setClinicalSummary(summary);
      setSummaryGenerated(true);
      setShowSummaryForm(true);
    } catch (error) {
      console.error('Error generating summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <div className="message-content">{msg.content}</div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="message assistant">
            <div className="message-content">
              <span className="typing-indicator">●</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {showPHQ9Message && (
        <div className="phq9-message">
          <div className="message assistant">
            <div className="message-content">
              Please complete the PHQ-9 questionnaire to help us understand your situation more accurately.
            </div>
          </div>
        </div>
      )}

      {showPHQ9 && !phq9Score && (
        <div className="phq9-wrapper">
          <PHQ9Questionnaire onComplete={handlePHQ9Complete} />
        </div>
      )}

      {showSummaryForm && (
        <div className="summary-form-wrapper">
          <SummaryForm
            clinicalSummary={clinicalSummary}
            onSubmit={(info: PatientInfo) => {
              setPatientInfo(info);
              setShowSummaryForm(false);
              setMessages(prev => [
                ...prev,
                { role: 'assistant', content: 'Would you like to see psychiatrist recommendations based on this information?' },
              ]);
            }}
          />
        </div>
      )}

      {psychiatrists.length > 0 && !selectedPsychiatrist && (
        <div className="psychiatrists-wrapper">
          <h3 className="psychiatrists-title">Available Psychiatrists</h3>
          {psychiatrists.map((psych) => (
            <PsychiatristCard
              key={psych.id}
              psychiatrist={psych}
              onSelect={(p) => {
                setSelectedPsychiatrist(p);
                setCurrentAgent('booking');
                setMessages(prev => [
                  ...prev,
                  { role: 'assistant', content: `You've selected ${p.name}. Would you like help reaching out to them to book an appointment?` },
                ]);
              }}
              onViewBio={(p) => setViewingBio(p)}
            />
          ))}
          {!viewingBio && (
            <div className="message assistant">
              <div className="message-content">
                Would you like to learn more about a specific psychiatrist?
              </div>
            </div>
          )}
          {viewingBio && (
            <div className="bio-modal">
              <div className="bio-content">
                <h3>{viewingBio.name}, {viewingBio.credential}</h3>
                <p className="bio-text">{viewingBio.bio}</p>
                <button onClick={() => setViewingBio(null)} className="btn-close">
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showEmailEditor && bookingEmail && (
        <div className="email-editor-wrapper">
          <h3>Review and Edit Email</h3>
          <div className="email-editor">
            <div className="email-field">
              <label>To:</label>
              <input
                type="email"
                value={bookingEmail.to}
                onChange={(e) => setBookingEmail({ ...bookingEmail, to: e.target.value })}
                className="email-input"
              />
            </div>
            <div className="email-field">
              <label>Subject:</label>
              <input
                type="text"
                value={bookingEmail.subject}
                onChange={(e) => setBookingEmail({ ...bookingEmail, subject: e.target.value })}
                className="email-input"
              />
            </div>
            <div className="email-field">
              <label>Body:</label>
              <textarea
                value={bookingEmail.body}
                onChange={(e) => setBookingEmail({ ...bookingEmail, body: e.target.value })}
                className="email-textarea"
                rows={15}
              />
            </div>
            <div className="email-actions">
              <button
                onClick={() => {
                  window.location.href = `mailto:${bookingEmail.to}?subject=${encodeURIComponent(bookingEmail.subject)}&body=${encodeURIComponent(bookingEmail.body)}`;
                }}
                className="btn-send"
              >
                Send Email
              </button>
              <button
                onClick={() => {
                  setShowEmailEditor(false);
                  setBookingEmail(null);
                }}
                className="btn-cancel"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {!showPHQ9 && !showSummaryForm && !showEmailEditor && (
        <div className="chat-input-container">
          <div className="chat-input-wrapper">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="chat-input"
              rows={1}
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="chat-send-btn"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .chat-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          max-width: 800px;
          margin: 0 auto;
          background: #f7f7f8;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .message {
          display: flex;
          margin-bottom: 0.5rem;
        }

        .message.user {
          justify-content: flex-end;
        }

        .message.assistant {
          justify-content: flex-start;
        }

        .message-content {
          max-width: 70%;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          word-wrap: break-word;
          line-height: 1.6;
        }

        .message.user .message-content {
          background-color: #19c37d;
          color: white;
        }

        .message.assistant .message-content {
          background-color: #ffffff;
          color: #374151;
          border: 1px solid #e5e7eb;
        }

        .typing-indicator {
          display: inline-block;
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }

        .phq9-message {
          padding: 1rem 1.5rem;
        }

        .phq9-wrapper {
          padding: 1rem;
          max-height: 60vh;
          overflow-y: auto;
        }

        .summary-form-wrapper {
          padding: 1rem;
          max-height: 80vh;
          overflow-y: auto;
        }

        .psychiatrists-wrapper {
          padding: 1rem 1.5rem;
        }

        .psychiatrists-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 1rem;
        }

        .bio-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .bio-content {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          max-width: 600px;
          max-height: 80vh;
          overflow-y: auto;
        }

        .bio-content h3 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 1rem;
        }

        .bio-text {
          color: #374151;
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }

        .btn-close {
          padding: 0.75rem 1.5rem;
          background-color: #f3f4f6;
          color: #374151;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-close:hover {
          background-color: #e5e7eb;
        }

        .email-editor-wrapper {
          padding: 1.5rem;
          background: white;
          border-top: 1px solid #e5e7eb;
        }

        .email-editor-wrapper h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 1rem;
        }

        .email-editor {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .email-field {
          display: flex;
          flex-direction: column;
        }

        .email-field label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .email-input {
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 1rem;
        }

        .email-textarea {
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 1rem;
          font-family: inherit;
          resize: vertical;
        }

        .email-actions {
          display: flex;
          gap: 0.75rem;
        }

        .btn-send,
        .btn-cancel {
          flex: 1;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-send {
          background-color: #19c37d;
          color: white;
        }

        .btn-send:hover {
          background-color: #16a269;
        }

        .btn-cancel {
          background-color: #f3f4f6;
          color: #374151;
        }

        .btn-cancel:hover {
          background-color: #e5e7eb;
        }

        .chat-input-container {
          padding: 1rem 1.5rem;
          background: #f7f7f8;
          border-top: 1px solid #e5e7eb;
        }

        .chat-input-wrapper {
          display: flex;
          align-items: flex-end;
          gap: 0.75rem;
          background: #ffffff;
          border-radius: 1.5rem;
          padding: 0.75rem 1rem;
          border: 1px solid #d1d5db;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: box-shadow 0.2s;
        }

        .chat-input-wrapper:focus-within {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          border-color: #9ca3af;
        }

        .chat-input {
          flex: 1;
          border: none;
          background: transparent;
          resize: none;
          font-size: 1rem;
          font-family: inherit;
          outline: none;
          min-height: 24px;
          max-height: 200px;
          line-height: 1.5;
          color: #374151;
        }

        .chat-input::placeholder {
          color: #9ca3af;
        }

        .chat-send-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 0.375rem;
          border: none;
          background-color: #19c37d;
          color: white;
          cursor: pointer;
          transition: background-color 0.2s, transform 0.1s;
          flex-shrink: 0;
        }

        .chat-send-btn:hover:not(:disabled) {
          background-color: #16a269;
          transform: scale(1.05);
        }

        .chat-send-btn:active:not(:disabled) {
          transform: scale(0.95);
        }

        .chat-send-btn:disabled {
          background-color: #d1d5db;
          cursor: not-allowed;
          transform: none;
        }

        @media (max-width: 768px) {
          .message-content {
            max-width: 85%;
          }
        }
      `}</style>
    </div>
  );
}
