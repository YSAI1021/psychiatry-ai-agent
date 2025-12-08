'use client';

import { Alert } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export function SecurityDisclaimer() {
  return (
    <Alert className="mb-2 border-border/50 bg-muted/30 py-3 px-4 rounded-lg flex items-start gap-3">
      <Info className="h-5 w-5 mt-1 text-muted-foreground shrink-0" />
      <div className="text-sm text-muted-foreground">
        <strong className="font-semibold text-foreground">Important:</strong>{' '}
        This AI assistant does not provide diagnoses or emergency services. If you are experiencing a
        mental health emergency, please contact your local emergency services or the{' '}
        <a
          href="tel:988"
          className="underline text-foreground hover:no-underline"
        >
          National Suicide Prevention Lifeline at 988
        </a>.
      </div>
    </Alert>
  );
}