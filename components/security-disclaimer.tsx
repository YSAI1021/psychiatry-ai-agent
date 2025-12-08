'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export function SecurityDisclaimer() {
  return (
    <Alert className="mb-4 border-destructive/50 bg-destructive/10">
      <AlertTriangle className="h-4 w-4 text-destructive" />
      <AlertTitle className="text-destructive">Important Notice</AlertTitle>
      <AlertDescription className="text-destructive/90">
        This is not a diagnostic or emergency service. If you are in crisis, please contact{' '}
        <a
          href="tel:988"
          className="font-semibold underline hover:no-underline"
        >
          988
        </a>{' '}
        (Suicide & Crisis Lifeline) or go to your nearest emergency room immediately.
      </AlertDescription>
    </Alert>
  );
}

