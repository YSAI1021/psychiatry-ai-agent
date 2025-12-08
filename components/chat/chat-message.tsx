'use client';

import { Message } from '@/lib/store';
import { cn } from '@/lib/utils';
import { AgentType } from '@/lib/openai';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex w-full items-start gap-4 px-4 py-4',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
          AI
        </div>
      )}
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-3',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        )}
      >
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
          {message.content}
        </p>
        {message.agent && !isUser && (
          <div className="mt-2 text-xs opacity-70">
            {getAgentLabel(message.agent)}
          </div>
        )}
      </div>
      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
          You
        </div>
      )}
    </div>
  );
}

function getAgentLabel(agent: AgentType): string {
  switch (agent) {
    case AgentType.INTAKE:
      return 'Intake Agent';
    case AgentType.SUMMARY:
      return 'Summary Agent';
    case AgentType.RECOMMENDATION:
      return 'Recommendation Agent';
    case AgentType.BOOKING:
      return 'Booking Agent';
    default:
      return '';
  }
}

