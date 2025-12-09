'use client';

import { ReactNode } from 'react';

interface ChatLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
}

export default function ChatLayout({ children, sidebar }: ChatLayoutProps) {
  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">Psychiatry Intake Assistant</h1>
      </header>

      {/* Important Notice Banner */}
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
        <div className="flex items-start gap-2">
          <span className="text-gray-600">ℹ️</span>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Important:</span> This is not a diagnostic or emergency service. If you are in crisis, please contact 988 (Suicide & Crisis Lifeline) or go to your nearest emergency room immediately.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {children}
        </div>

        {/* Sidebar for Forms */}
        {sidebar && (
          <div className="w-96 border-l border-gray-200 overflow-y-auto bg-gray-50 p-4">
            {sidebar}
          </div>
        )}
      </div>
    </div>
  );
}

