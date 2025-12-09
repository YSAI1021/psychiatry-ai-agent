'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImportantBanner } from '@/components/ImportantBanner';
import { SummaryForm } from '@/components/SummaryForm';
import { useAssessment } from '@/contexts/AssessmentContext';
import { ClinicalSummary, createEmptySummary } from '@/lib/agents/summary-agent';

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
    // For now, we'll just show a confirmation
    alert('Assessment submitted successfully! (Note: This is a demo - no data was actually stored)');
    
    // Optionally reset and redirect
    // router.push('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <ImportantBanner />
        </div>

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
  );
}

