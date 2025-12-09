'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

/**
 * Important Banner Component
 * 
 * Displays the important notice at the top of the application.
 * Warns users that this is not a diagnostic or emergency service.
 * Always fully visible, positioned below app title, with responsive text wrapping.
 */
export function ImportantBanner() {
  return (
    <Alert className="w-full border-border bg-muted/50">
      <Info className="h-4 w-4" />
      <div className="flex-1 min-w-0">
        <AlertTitle className="font-semibold mb-1">Important:</AlertTitle>
        <AlertDescription className="text-sm leading-relaxed break-words">
          This is not a diagnostic or emergency service. If you are in crisis, please contact{' '}
          <a
            href="tel:988"
            className="font-semibold text-primary underline hover:text-primary/80 whitespace-nowrap"
          >
            988
          </a>{' '}
          (Suicide & Crisis Lifeline) or go to your nearest emergency room immediately.
        </AlertDescription>
      </div>
    </Alert>
  );
}

