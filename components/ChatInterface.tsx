'use client';

import { useState, useRef, useEffect } from 'react';
import { Message, AgentType, ConversationState, PatientInfo } from '@/types';
import { detectTopics } from '@/utils/topicDetection';
import SummaryForm from './SummaryForm';

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
  const [summaryGenerated, setSummaryGenerated] = useState(false);
  const [clinicalSummary, setClinicalSummary] = useState<string>('');
  const [waitingForNegativeResponse, setWaitingForNegativeResponse] = useState(false);
  const [waitingForSummaryConfirmation, setWaitingForSummaryConfirmation] = useState(false);
  const [showSummaryForm, setShowSummaryForm] = useState(false);
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({});
  const [formSubmitted, setFormSubmitted] = useState(false);
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
          phq9Completed: false,
        };

        const response = await streamResponse('/api/intake', {
          message: userMessage,
          state,
        });

        // Update topics discussed
        const detectedTopics = detectTopics(userMessage);
        setTopicsDiscussed(prev => {
          const newSet = new Set(prev);
          detectedTopics.forEach(topic => newSet.add(topic));
          return newSet;
        });

        // Check if agent asked "Is there anything else you'd like to share before I summarize everything?"
        if (response.toLowerCase().includes('anything else') && 
            response.toLowerCase().includes('before i summarize') && 
            !waitingForNegativeResponse) {
          setWaitingForNegativeResponse(true);
        }

        // Check if user gave negative response to "anything else" question
        if (waitingForNegativeResponse) {
          const lowerMessage = userMessage.toLowerCase();
          const negativeResponses = ['no', "that's all", "that's it", 'nothing else', 'no thanks', "i'm done", "i'm finished", "that's everything"];
          const isNegative = negativeResponses.some(neg => lowerMessage.includes(neg));
          
          if (isNegative) {
            setWaitingForNegativeResponse(false);
            setIntakeComplete(true);
            // Ask about reviewing summary
            setTimeout(() => {
              setMessages(prev => [
                ...prev,
                { role: 'assistant', content: 'Would you like to review a clinical summary of what you shared?' },
              ]);
              setWaitingForSummaryConfirmation(true);
            }, 500);
            setIsLoading(false);
            return; // Don't process further
          }
        }

        // Check if agent asked "Would you like to review a clinical summary?"
        if (response.toLowerCase().includes('review a clinical summary') || 
            response.toLowerCase().includes('clinical summary of what you shared')) {
          setWaitingForSummaryConfirmation(true);
        }

        // Handle summary confirmation response
        if (waitingForSummaryConfirmation) {
          const lowerMessage = userMessage.toLowerCase();
          const positiveResponses = ['yes', 'sure', 'ok', 'okay', 'yeah', 'yep', 'please'];
          const isPositive = positiveResponses.some(pos => lowerMessage.includes(pos));
          
          if (isPositive) {
            setWaitingForSummaryConfirmation(false);
            // Generate summary
            setIsLoading(true);
            try {
              const summary = await streamResponse('/api/summary', {
                conversationHistory: messages,
                phq9Score: undefined,
              });
              setClinicalSummary(summary);
              setSummaryGenerated(true);
              setCurrentAgent('summary');
              setShowSummaryForm(true);
            } catch (error) {
              console.error('Error generating summary:', error);
              setMessages(prev => [
                ...prev,
                { role: 'assistant', content: 'I apologize, but I encountered an error generating the summary. Please try again.' },
              ]);
            } finally {
              setIsLoading(false);
            }
          } else if (lowerMessage.includes('no') || lowerMessage.includes('skip')) {
            setWaitingForSummaryConfirmation(false);
            setMessages(prev => [
              ...prev,
              { role: 'assistant', content: 'Thank you for sharing your information. Take care!' },
            ]);
          }
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

  const handleSummarySubmit = (info: PatientInfo) => {
    setPatientInfo(info);
    setShowSummaryForm(false);
    setFormSubmitted(true);
    setMessages(prev => [
      ...prev,
      { role: 'assistant', content: 'Thank you for completing the intake assessment. Your information has been submitted successfully.' },
    ]);
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
            {msg.role === 'assistant' && (
              <div className="avatar">AI</div>
            )}
            <div className="message-content">{msg.content}</div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="message assistant">
            <div className="avatar">AI</div>
            <div className="message-content">
              <span className="typing-indicator">●</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {showSummaryForm && !formSubmitted && (
        <div className="summary-form-wrapper">
          <SummaryForm
            clinicalSummary={clinicalSummary}
            onSubmit={handleSummarySubmit}
          />
        </div>
      )}

      {!showSummaryForm && (
        <div className="chat-input-container">
          <div className="chat-input-wrapper">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share what brings you here today..."
              className="chat-input"
              rows={1}
              disabled={isLoading || formSubmitted}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading || formSubmitted}
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
          background: #ffffff;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          background: #ffffff;
        }

        .message {
          display: flex;
          margin-bottom: 0.5rem;
          align-items: flex-start;
          gap: 0.75rem;
        }

        .message.user {
          justify-content: flex-end;
        }

        .message.assistant {
          justify-content: flex-start;
        }

        .avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: #e5e7eb;
          color: #6b7280;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 600;
          flex-shrink: 0;
        }

        .message-content {
          max-width: 70%;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          word-wrap: break-word;
          line-height: 1.6;
        }

        .message.user .message-content {
          background-color: #4b5563;
          color: #ffffff;
        }

        .message.assistant .message-content {
          background-color: #f3f4f6;
          color: #1f2937;
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

        .summary-form-wrapper {
          padding: 1rem;
          max-height: 80vh;
          overflow-y: auto;
        }

        .chat-input-container {
          padding: 1rem 1.5rem;
          background: #ffffff;
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
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          transition: box-shadow 0.2s, border-color 0.2s;
        }

        .chat-input-wrapper:focus-within {
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
          border-radius: 50%;
          border: none;
          background-color: #6b7280;
          color: white;
          cursor: pointer;
          transition: background-color 0.2s, transform 0.1s;
          flex-shrink: 0;
        }

        .chat-send-btn:hover:not(:disabled) {
          background-color: #4b5563;
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
