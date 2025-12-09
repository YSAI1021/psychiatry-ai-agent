'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

/**
 * Important Banner Component
 * 
 * Displays the important notice at the top of the application.
 * Warns users that this is not a diagnostic or emergency service.
 */
export function ImportantBanner() {
  return (
    <Alert className="mb-4 border-border bg-muted/50">
      <Info className="h-4 w-4" />
      <AlertTitle className="font-semibold">Important:</AlertTitle>
      <AlertDescription>
        This is not a diagnostic or emergency service. If you are in crisis, please contact{' '}
        <a
          href="tel:988"
          className="font-semibold text-primary underline hover:text-primary/80"
        >
          988
        </a>{' '}
        (Suicide & Crisis Lifeline) or go to your nearest emergency room immediately.
      </AlertDescription>
    </Alert>
  );
}

