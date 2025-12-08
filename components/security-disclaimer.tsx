'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export function SecurityDisclaimer() {
  return (
    <Alert className="mb-2 border-border/50 bg-muted/30 py-1.5">
      <Info className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
      <AlertDescription className="text-xs text-muted-foreground/80 leading-tight">
        This is not a diagnostic or emergency service. If you are in crisis, please contact{' '}
        <a
          href="tel:988"
          className="font-medium underline hover:no-underline text-foreground/90"
        >
          988
        </a>{' '}
        (Suicide & Crisis Lifeline).
      </AlertDescription>
    </Alert>
  );
}

