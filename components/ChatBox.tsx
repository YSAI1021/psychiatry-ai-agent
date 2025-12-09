'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAssessment } from '@/contexts/AssessmentContext';
import { Send } from 'lucide-react';

/**
 * ChatBox Component
 * 
 * Provides a ChatGPT-like chat interface with streaming responses.
 * Auto-resizes textarea and handles message sending.
 */

interface ChatBoxProps {
  onMessageSent?: (message: string) => void;
  disabled?: boolean;
}

export function ChatBox({ onMessageSent, disabled = false }: ChatBoxProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;

    const userMessage = input.trim();
    setInput('');
    
    // Call the parent's message handler
    if (onMessageSent) {
      onMessageSent(userMessage);
    }

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex items-end gap-2 p-4 border-t border-border bg-background">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={disabled}
            className="min-h-[44px] max-h-[200px] resize-none pr-12"
            rows={1}
          />
        </div>
        <Button
          type="submit"
          disabled={!input.trim() || disabled}
          size="icon"
          className="h-11 w-11 shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}

