"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PHQ9_SCORING_OPTIONS } from "@/lib/phq9";

interface PHQ9QuestionProps {
  questionId: number;
  questionText: string;
  currentScore: number;
  onSelect: (score: number) => void;
}

/**
 * PHQ-9 Question Component
 * Displays a single PHQ-9 question with scoring options
 */
export function PHQ9Question({ questionId, questionText, currentScore, onSelect }: PHQ9QuestionProps) {
  return (
    <Card className="p-4 mb-4">
      <p className="mb-3 font-medium">
        {questionId}. Over the last 2 weeks, how often have you been bothered by: {questionText}?
      </p>
      <div className="flex flex-wrap gap-2">
        {PHQ9_SCORING_OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant={currentScore === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => onSelect(option.value)}
          >
            {option.label} ({option.value})
          </Button>
        ))}
      </div>
    </Card>
  );
}

