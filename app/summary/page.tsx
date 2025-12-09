'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImportantBanner } from '@/components/ImportantBanner';
import { SummaryForm } from '@/components/SummaryForm';
import { useAssessment } from '@/contexts/AssessmentContext';
import { ClinicalSummary, createEmptySummary } from '@/lib/agents/summary-agent';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

/**
 * Summary Page
 * 
 * Displays the clinical summary with editable form fields.
 * Allows patients to review and edit before final submission.
 */

export default function SummaryPage() {
  const { state, setClinicalSummary } = useAssessment();
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showThankYouModal, setShowThankYouModal] = useState(false);

  useEffect(() => {
    // Generate summary if not already generated
    if (!state.summaryGenerated && state.conversationHistory.length > 0) {
      generateSummary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateSummary = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationHistory: state.conversationHistory,
          phq9Score: state.phq9Score,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const summaryData = await response.json();
      
      // Merge with empty summary to ensure all fields exist
      const fullSummary: ClinicalSummary = {
        ...createEmptySummary(),
        ...summaryData,
        phq9Score: state.phq9Score,
      };

      setClinicalSummary(fullSummary);
    } catch (error) {
      console.error('Error generating summary:', error);
      alert('Failed to generate summary. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = () => {
    // In a real application, this would send data to a backend
    // Show thank you modal
    setShowThankYouModal(true);
  };

  const handleCloseModal = () => {
    setShowThankYouModal(false);
  };

  return (
    <>
      {/* Spacer for fixed header */}
      <div className="h-14 shrink-0" />
      <div className="min-h-screen bg-background">
        {/* Important Banner - Always visible below header */}
        <div className="w-full px-4 py-3 sm:px-6 border-b border-border bg-background shrink-0">
          <div className="max-w-7xl mx-auto">
            <ImportantBanner />
          </div>
        </div>
        <div className="container mx-auto py-8 px-4">

          {isGenerating ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground">Generating clinical summary...</p>
              </div>
            </div>
          ) : (
            <SummaryForm onSubmit={handleSubmit} />
          )}
        </div>
      </div>

      {/* Thank You Modal */}
      <Dialog open={showThankYouModal} onOpenChange={setShowThankYouModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Thank You</DialogTitle>
            <DialogDescription className="pt-2">
              Thank you for submitting. Our psychiatry team will follow up with you soon.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleCloseModal}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

