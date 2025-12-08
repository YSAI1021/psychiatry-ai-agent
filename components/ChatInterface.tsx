'use client';

import { useState, useRef, useEffect } from 'react';
import { Message, AgentType, ConversationState, PHQ9Response } from '@/types';
import { detectTopics } from '@/utils/topicDetection';
import PHQ9Questionnaire from './PHQ9Questionnaire';

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

        // Check if we should transition to PHQ-9
        if (response.toLowerCase().includes('anything else') && !intakeComplete) {
          setIntakeComplete(true);
          // Wait a moment before showing PHQ-9
          setTimeout(() => setShowPHQ9(true), 500);
        }
      } else if (currentAgent === 'recommendation') {
        await streamResponse('/api/recommendation', {
          userResponse: userMessage,
          clinicalSummary,
          preferences: {},
        });
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
    
    // Generate summary
    setIsLoading(true);
    try {
      const summary = await streamResponse('/api/summary', {
        conversationHistory: messages,
        phq9Score: score,
      });
      setClinicalSummary(summary);
      setSummaryGenerated(true);
      setCurrentAgent('recommendation');
      
      // Add summary message
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `Here's your clinical summary:\n\n${summary}` },
      ]);

      // Start recommendation flow
      const recommendationResponse = await streamResponse('/api/recommendation', {
        userResponse: 'start',
        clinicalSummary: summary,
        preferences: {},
      });
      
      setShowRecommendations(true);
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

      {showPHQ9 && !phq9Score && (
        <div className="phq9-wrapper">
          <PHQ9Questionnaire onComplete={handlePHQ9Complete} />
        </div>
      )}

      {!showPHQ9 && (
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
          border-radius: 1rem;
          word-wrap: break-word;
        }

        .message.user .message-content {
          background-color: #007bff;
          color: white;
        }

        .message.assistant .message-content {
          background-color: #f1f3f5;
          color: #333;
        }

        .typing-indicator {
          display: inline-block;
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }

        .phq9-wrapper {
          padding: 1rem;
          max-height: 60vh;
          overflow-y: auto;
        }

        .chat-input-container {
          padding: 1rem;
          border-top: 1px solid #e5e5e5;
          background: white;
        }

        .chat-input-wrapper {
          display: flex;
          align-items: flex-end;
          gap: 0.5rem;
          background: #f8f9fa;
          border-radius: 1.5rem;
          padding: 0.5rem 0.75rem;
          border: 1px solid #e5e5e5;
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
        }

        .chat-send-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background-color: #007bff;
          color: white;
          cursor: pointer;
          transition: background-color 0.2s;
          flex-shrink: 0;
        }

        .chat-send-btn:hover:not(:disabled) {
          background-color: #0056b3;
        }

        .chat-send-btn:disabled {
          background-color: #ccc;
          cursor: not-allowed;
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
