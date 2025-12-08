'use client';

import * as React from 'react';
import { useAppStore } from '@/lib/store';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import { useEffect, useRef } from 'react';

export function ChatContainer() {
  const messages = useAppStore((state) => state.messages);
  const isLoading = useAppStore((state) => state.isLoading);
  const [inputValue, setInputValue] = React.useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    // This will be handled by the parent component
    // Just reset input for now
    setInputValue('');
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center px-4">
            <div className="max-w-2xl text-center">
              <h1 className="mb-4 text-2xl font-semibold">
                Psychiatry Intake Assistant
              </h1>
              <p className="text-muted-foreground">
                I'm here to help with your psychiatric intake. Let's start by
                gathering some information about your mental health history.
              </p>
            </div>
          </div>
        ) : (
          <div className="pb-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex items-start gap-4 px-4 py-4">
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
      </div>
      <ChatInput
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSend}
        disabled={isLoading}
      />
    </div>
  );
}

