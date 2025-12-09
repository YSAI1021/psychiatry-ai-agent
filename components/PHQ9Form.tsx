'use client';

import { useState, useEffect } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAssessment } from '@/contexts/AssessmentContext';
import { getPHQ9Severity } from '@/lib/agents/summary-agent';

/**
 * PHQ-9 Form Component
 * 
 * Renders the Patient Health Questionnaire-9 (PHQ-9) depression screening tool.
 * Tracks responses and calculates total score with severity interpretation.
 */

const PHQ9_QUESTIONS = [
  'Little interest or pleasure in doing things',
  'Feeling down, depressed, or hopeless',
  'Trouble falling or staying asleep, or sleeping too much',
  'Feeling tired or having little energy',
  'Poor appetite or overeating',
  'Feeling bad about yourself — or that you are a failure or have let yourself or your family down',
  'Trouble concentrating on things, such as reading the newspaper or watching television',
  'Moving or speaking so slowly that other people could have noticed. Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual',
  'Thoughts that you would be better off dead, or of hurting yourself',
];

const PHQ9_OPTIONS = [
  { value: '0', label: 'Not at all' },
  { value: '1', label: 'Several days' },
  { value: '2', label: 'More than half the days' },
  { value: '3', label: 'Nearly every day' },
];

interface PHQ9FormProps {
  onComplete: () => void;
}

export function PHQ9Form({ onComplete }: PHQ9FormProps) {
  const { state, setPHQ9Responses, setPHQ9Score, setPHQ9Completed } = useAssessment();
  const [responses, setResponses] = useState<Record<number, string>>({});

  // Initialize responses from context
  useEffect(() => {
    const initialResponses: Record<number, string> = {};
    state.phq9Responses.forEach((r, idx) => {
      if (r.value >= 0) {
        initialResponses[idx] = r.value.toString();
      }
    });
    setResponses(initialResponses);
  }, []);

  const handleResponseChange = (questionIndex: number, value: string) => {
    const newResponses = { ...responses, [questionIndex]: value };
    setResponses(newResponses);

    // Update context
    const updatedResponses = state.phq9Responses.map((r, idx) => ({
      ...r,
      value: idx === questionIndex ? parseInt(value) : r.value,
    }));
    setPHQ9Responses(updatedResponses);

    // Calculate and update score
    const score = updatedResponses.reduce(
      (sum, r) => sum + (r.value >= 0 ? r.value : 0),
      0
    );
    setPHQ9Score(score);
  };

  const handleSubmit = () => {
    // Validate all questions answered
    const allAnswered = PHQ9_QUESTIONS.every((_, idx) => responses[idx] !== undefined);
    if (!allAnswered) {
      alert('Please answer all questions before submitting.');
      return;
    }

    setPHQ9Completed(true);
    onComplete();
  };

  const currentScore = Object.values(responses).reduce(
    (sum, val) => sum + (val !== undefined ? parseInt(val) : 0),
    0
  );
  const severity = getPHQ9Severity(currentScore);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">PHQ-9 Depression Screening</h2>
        <p className="text-muted-foreground">
          Over the last 2 weeks, how often have you been bothered by any of the following problems?
        </p>
      </div>

      <div className="space-y-8">
        {PHQ9_QUESTIONS.map((question, index) => (
          <div key={index} className="space-y-4">
            <Label className="text-base font-medium">
              {index + 1}. {question}
            </Label>
            <RadioGroup
              value={responses[index] || ''}
              onValueChange={(value) => handleResponseChange(index, value)}
              className="flex flex-col sm:flex-row gap-4"
            >
              {PHQ9_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`q${index}-${option.value}`} />
                  <Label
                    htmlFor={`q${index}-${option.value}`}
                    className="font-normal cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        ))}
      </div>

      <div className="border-t pt-4 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold">Total Score:</span>
          <span className="text-2xl font-bold">{currentScore} / 27</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Severity:</span>
          <span className="font-medium">{severity}</span>
        </div>
      </div>

      <Button onClick={handleSubmit} className="w-full" size="lg">
        Submit PHQ-9
      </Button>
    </div>
  );
}
