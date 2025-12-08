/**
 * PHQ-9 (Patient Health Questionnaire-9) Data Structure and Scoring
 * Standard depression screening tool with 9 questions
 */

export interface PHQ9Question {
  id: number;
  text: string;
  score: number; // 0-3 based on frequency
}

export interface PHQ9Assessment {
  questions: PHQ9Question[];
  totalScore: number;
  severity: 'minimal' | 'mild' | 'moderate' | 'moderately-severe' | 'severe';
  completed: boolean;
}

/**
 * PHQ-9 Questions from the standard screening tool
 */
export const PHQ9_QUESTIONS: Omit<PHQ9Question, 'score'>[] = [
  {
    id: 1,
    text: "Little interest or pleasure in doing things",
  },
  {
    id: 2,
    text: "Feeling down, depressed, or hopeless",
  },
  {
    id: 3,
    text: "Trouble falling asleep or sleeping too much",
  },
  {
    id: 4,
    text: "Feeling tired or having little energy",
  },
  {
    id: 5,
    text: "Poor appetite or overeating",
  },
  {
    id: 6,
    text: "Feeling bad about yourself - or that you are a failure or have let yourself or family down",
  },
  {
    id: 7,
    text: "Trouble concentrating on things, such as reading the newspaper or watching television",
  },
  {
    id: 8,
    text: "Moving or speaking so slowly that other people could have noticed. Or the opposite - being so fidgety or restless that you have been moving around a lot more than usual",
  },
  {
    id: 9,
    text: "Thoughts that you would be better off dead, or of hurting yourself in some way",
  },
];

/**
 * PHQ-9 Scoring Options
 */
export const PHQ9_SCORING_OPTIONS = [
  { label: "Not at all", value: 0 },
  { label: "Several Days", value: 1 },
  { label: "More than half the days", value: 2 },
  { label: "Nearly every day", value: 3 },
];

/**
 * Calculate PHQ-9 severity based on total score
 * @param totalScore - Sum of all question scores (0-27)
 * @returns Severity level
 */
export function calculatePHQ9Severity(totalScore: number): PHQ9Assessment['severity'] {
  if (totalScore <= 4) return 'minimal';
  if (totalScore <= 9) return 'mild';
  if (totalScore <= 14) return 'moderate';
  if (totalScore <= 19) return 'moderately-severe';
  return 'severe';
}

/**
 * Initialize empty PHQ-9 assessment
 */
export function createEmptyPHQ9(): PHQ9Assessment {
  return {
    questions: PHQ9_QUESTIONS.map(q => ({ ...q, score: 0 })),
    totalScore: 0,
    severity: 'minimal',
    completed: false,
  };
}

/**
 * Calculate total PHQ-9 score from questions
 */
export function calculatePHQ9Score(questions: PHQ9Question[]): number {
  return questions.reduce((sum, q) => sum + q.score, 0);
}

