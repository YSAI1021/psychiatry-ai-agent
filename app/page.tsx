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
        <h1 className="logo">PsyConnect Agents</h1>
      </header>

      <div className="important-notice">
        <span className="notice-text">
          This AI assistant does not provide diagnoses or emergency services. If you are experiencing a mental health emergency, please contact your local emergency services or the National Suicide Prevention Lifeline at 988.
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
          background: #ffffff;
        }

        .header {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          background: #ffffff;
        }

        .logo {
          font-size: 1.5rem;
          font-weight: 600;
          color: #111827;
        }

        .important-notice {
          padding: 0.75rem 1.5rem;
          background: #ffffff;
          border-bottom: 1px solid #e5e7eb;
          font-size: 0.875rem;
          color: #6b7280;
          line-height: 1.5;
        }

        .notice-text {
          line-height: 1.5;
        }

        .chat-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #ffffff;
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
