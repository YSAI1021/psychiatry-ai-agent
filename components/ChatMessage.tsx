'use client';

import { useAssessment } from '@/contexts/AssessmentContext';
import { useEffect, useRef } from 'react';

/**
 * ChatMessage Component
 * 
 * Displays individual chat messages with proper styling for user and assistant.
 * Handles streaming text display for assistant messages.
 */

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export function ChatMessage({ role, content, isStreaming = false }: ChatMessageProps) {
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messageRef.current && isStreaming) {
      messageRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [content, isStreaming]);

  if (role === 'user') {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[80%] rounded-lg bg-primary text-primary-foreground px-4 py-2">
          <p className="text-sm whitespace-pre-wrap">{content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-4" ref={messageRef}>
      <div className="max-w-[80%] rounded-lg bg-muted px-4 py-2">
        <p className="text-sm whitespace-pre-wrap">
          {content}
          {isStreaming && <span className="animate-pulse">▋</span>}
        </p>
      </div>
    </div>
  );
}

