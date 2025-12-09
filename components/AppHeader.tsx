'use client';

/**
 * AppHeader Component
 * 
 * Persistent header with app title displayed at the top left.
 * Matches the minimalist, monotone design of the application.
 */

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 sm:px-6 lg:px-8">
        <h1 className="text-base sm:text-lg font-medium text-foreground">
          Psychiatry Intake Assistant
        </h1>
      </div>
    </header>
  );
}

