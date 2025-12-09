'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInterfaceProps {
  onTransitionToPHQ9: () => void;
  onTransitionToSummary: () => void;
  onMessagesUpdate: (messages: Array<{ role: 'user' | 'assistant'; content: string }>) => void;
  waitingForSummaryConfirmation?: boolean;
  onSummaryRequest?: (wantsSummary: boolean) => void;
}

export default function ChatInterface({ 
  onTransitionToPHQ9, 
  onTransitionToSummary,
  onMessagesUpdate,
  waitingForSummaryConfirmation = false,
  onSummaryRequest
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm here to help you with your psychiatric intake assessment. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [waitingForNegativeResponse, setWaitingForNegativeResponse] = useState(false);
  const [memory, setMemory] = useState<any>(null);
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

  useEffect(() => {
    // Update parent component with messages
    onMessagesUpdate(messages.map(m => ({ role: m.role, content: m.content })));
  }, [messages, onMessagesUpdate]);

  useEffect(() => {
    // If waiting for summary confirmation, ask the question
    if (waitingForSummaryConfirmation && !messages.some(m => m.content.includes('review a clinical summary'))) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Would you like to review a clinical summary of what you shared?' },
      ]);
    }
  }, [waitingForSummaryConfirmation, messages]);

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
      const response = await streamResponse('/api/intake', {
        message: userMessage,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        memory: memory,
      });

      // Check if agent asked "Is there anything else you'd like to share before I summarize everything?"
      if (response.toLowerCase().includes('anything else') && 
          response.toLowerCase().includes('before i summarize') && 
          !waitingForNegativeResponse) {
        setWaitingForNegativeResponse(true);
      }

      // Check if user gave negative response
      if (waitingForNegativeResponse) {
        const lowerMessage = userMessage.toLowerCase();
        const negativeResponses = ['no', "that's all", "that's it", 'nothing else', 'no thanks', "i'm done", "i'm finished", "that's everything"];
        const isNegative = negativeResponses.some(neg => lowerMessage.includes(neg));
        
        if (isNegative) {
          setWaitingForNegativeResponse(false);
          // Transition to PHQ-9
          setTimeout(() => {
            onTransitionToPHQ9();
          }, 500);
        }
      }

      // Handle summary confirmation
      if (waitingForSummaryConfirmation && onSummaryRequest) {
        const lowerMessage = userMessage.toLowerCase();
        const positiveResponses = ['yes', 'sure', 'ok', 'okay', 'yeah', 'yep', 'please'];
        const negativeResponses = ['no', 'skip', "don't", 'not'];
        
        if (positiveResponses.some(pos => lowerMessage.includes(pos))) {
          onSummaryRequest(true);
        } else if (negativeResponses.some(neg => lowerMessage.includes(neg))) {
          onSummaryRequest(false);
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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                msg.role === 'user'
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-100 text-gray-900 border border-gray-200'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 border border-gray-200 rounded-lg px-4 py-2">
              <span className="text-sm animate-pulse">●</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 px-6 py-4">
        <div className="flex items-end gap-2 bg-white rounded-lg border border-gray-300 p-2 focus-within:ring-2 focus-within:ring-gray-500">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 resize-none border-none outline-none text-sm text-gray-900 placeholder-gray-400 max-h-[200px]"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-gray-700 text-white rounded-lg p-2 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
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
    </div>
  );
}
