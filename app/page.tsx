'use client';

import { useState } from 'react';
import ChatInterface from '@/components/ChatInterface';
import { ConversationState } from '@/types';

export default function Home() {
  const [conversationState, setConversationState] = useState<ConversationState>({
    messages: [],
    currentAgent: 'intake',
    topicsDiscussed: new Set(),
    intakeComplete: false,
    summaryGenerated: false,
    phq9Completed: false,
  });

  return (
    <main className="main-container">
      <header className="header">
        <h1 className="logo">PsyConnect Agent</h1>
      </header>

      <div className="important-notice">
        <span className="notice-icon">ℹ️</span>
        <span className="notice-text">
          This is not a diagnostic or emergency service. If you are in crisis, please contact 988 (Suicide & Crisis Lifeline) or go to your nearest emergency room immediately.
        </span>
      </div>

      <div className="chat-wrapper">
        <ChatInterface onStateChange={setConversationState} />
      </div>

      <style jsx>{`
        .main-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          max-width: 1200px;
          margin: 0 auto;
          background: #f7f7f8;
        }

        .header {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          background: #ffffff;
        }

        .logo {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
        }

        .important-notice {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: #fef3c7;
          border-bottom: 1px solid #fbbf24;
          border-left: 4px solid #f59e0b;
          font-size: 0.9rem;
          color: #92400e;
        }

        .notice-icon {
          font-size: 1.1rem;
          flex-shrink: 0;
        }

        .notice-text {
          line-height: 1.5;
        }

        .chat-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #f7f7f8;
        }

        @media (max-width: 768px) {
          .header {
            padding: 0.75rem 1rem;
          }

          .logo {
            font-size: 1.25rem;
          }

          .important-notice {
            padding: 0.625rem 1rem;
            font-size: 0.85rem;
            flex-wrap: wrap;
          }
        }
      `}</style>
    </main>
  );
}
