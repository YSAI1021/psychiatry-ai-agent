'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/lib/store';
import { calculatePHQ9Score } from '@/lib/agents/intake-agent';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

const PHQ9_QUESTIONS = [
  'Over the last 2 weeks, how often have you had little interest or pleasure in doing things?',
  'Over the last 2 weeks, how often have you felt down, depressed, or hopeless?',
  'Over the last 2 weeks, how often have you had trouble falling asleep or staying asleep, or sleeping too much?',
  'Over the last 2 weeks, how often have you felt tired or had little energy?',
  'Over the last 2 weeks, how often have you had poor appetite or overeating?',
  'Over the last 2 weeks, how often have you felt bad about yourself — or that you are a failure or have let yourself or your family down?',
  'Over the last 2 weeks, how often have you had trouble concentrating on things, such as reading the newspaper or watching television?',
  'Over the last 2 weeks, how often have you been moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual?',
  'Over the last 2 weeks, how often have you had thoughts that you would be better off dead, or of hurting yourself?',
];

const PHQ9_OPTIONS = [
  { value: '0', label: 'Not at all' },
  { value: '1', label: 'Several days' },
  { value: '2', label: 'More than half the days' },
  { value: '3', label: 'Nearly every day' },
];

interface PHQ9FormProps {
  onComplete: (responses: number[], score: number) => void;
}

export function PHQ9Form({ onComplete }: PHQ9FormProps) {
  const [responses, setResponses] = React.useState<(number | null)[]>(Array(9).fill(null));
  const [errors, setErrors] = React.useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleResponseChange = (questionIndex: number, value: string) => {
    const newResponses = [...responses];
    newResponses[questionIndex] = parseInt(value, 10);
    setResponses(newResponses);
    
    // Clear error for this question
    if (errors.includes(`question-${questionIndex}`)) {
      setErrors(errors.filter(e => e !== `question-${questionIndex}`));
    }
  };

  const handleSubmit = () => {
    // Validate all questions are answered
    const missingQuestions: number[] = [];
    responses.forEach((response, index) => {
      if (response === null) {
        missingQuestions.push(index + 1);
      }
    });

    if (missingQuestions.length > 0) {
      setErrors(missingQuestions.map(q => `question-${q - 1}`));
      return;
    }

    setIsSubmitting(true);
    
    // Calculate score
    const score = calculatePHQ9Score(responses as number[]);
    
    // Save to store
    const { updateIntakeData, setCurrentAgent } = useAppStore.getState();
    updateIntakeData({
      phq9Responses: responses as number[],
      phq9Score: score,
    });

    // Trigger completion callback
    onComplete(responses as number[], score);

    // Move to Summary Agent
    setTimeout(() => {
      setCurrentAgent('summary' as any);
      setIsSubmitting(false);
    }, 500);
  };

  const score = responses.every(r => r !== null) 
    ? calculatePHQ9Score(responses as number[]) 
    : null;

  const getSeverity = (score: number): string => {
    // PHQ-9 severity interpretation
    if (score >= 0 && score <= 4) return 'Minimal';
    if (score >= 5 && score <= 9) return 'Mild';
    if (score >= 10 && score <= 14) return 'Moderate';
    if (score >= 15 && score <= 19) return 'Moderately Severe';
    if (score >= 20 && score <= 27) return 'Severe';
    return 'Unknown';
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Step 2 of 3: Screening Questions</CardTitle>
            <CardDescription>
              Please answer all 9 questions. Your responses help your provider better understand your symptoms.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {PHQ9_QUESTIONS.map((question, index) => (
          <div key={index} className="space-y-3">
            <Label className="text-sm font-medium">
              {index + 1}. {question}
            </Label>
            <RadioGroup
              value={responses[index]?.toString() || ''}
              onValueChange={(value) => handleResponseChange(index, value)}
              className="flex flex-col gap-2"
            >
              {PHQ9_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`q${index}-${option.value}`} />
                  <Label
                    htmlFor={`q${index}-${option.value}`}
                    className="cursor-pointer font-normal"
                  >
                    {option.value}. {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {errors.includes(`question-${index}`) && (
              <p className="text-xs text-destructive">Please select an answer for this question.</p>
            )}
          </div>
        ))}

        {score !== null && (
          <Alert className="border-primary/20 bg-primary/5">
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription>
              <div className="mt-1">
                <p className="font-medium">Total Score: {score} / 27</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Severity: {getSeverity(score)} Depression
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || responses.some(r => r === null)}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? 'Processing...' : 'Submit & Continue to Summary'}
        </Button>
      </CardContent>
    </Card>
  );
}

