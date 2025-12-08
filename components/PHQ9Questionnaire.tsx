'use client';

import { useState } from 'react';
import { PHQ9Response } from '@/types';

const PHQ9_QUESTIONS = [
  'Little interest or pleasure in doing things',
  'Feeling down, depressed, or hopeless',
  'Trouble falling asleep or sleeping too much',
  'Feeling tired or having little energy',
  'Poor appetite or overeating',
  'Feeling bad about yourself - or that you are a failure or have let yourself or family down',
  'Trouble concentrating on things, such as reading the newspaper or watching television',
  'Moving or speaking so slowly that other people could have noticed. Or the opposite-being so fidgety or restless that you have been moving around a lot more than usual',
  'Thoughts that you would be better off dead, or of hurting yourself in some way',
];

const PHQ9_OPTIONS = [
  { label: 'Not at all', value: 0 },
  { label: 'Several Days', value: 1 },
  { label: 'More than half the days', value: 2 },
  { label: 'Nearly every day', value: 3 },
];

interface PHQ9QuestionnaireProps {
  onComplete: (score: number, responses: PHQ9Response[]) => void;
}

export default function PHQ9Questionnaire({ onComplete }: PHQ9QuestionnaireProps) {
  const [responses, setResponses] = useState<Record<number, number>>({});

  const handleSelect = (questionIndex: number, score: number) => {
    setResponses(prev => ({ ...prev, [questionIndex]: score }));
  };

  const calculateTotal = () => {
    return Object.values(responses).reduce((sum, score) => sum + score, 0);
  };

  const handleSubmit = () => {
    const totalScore = calculateTotal();
    const responseArray: PHQ9Response[] = Object.entries(responses).map(([question, score]) => ({
      question: parseInt(question) + 1,
      score,
    }));
    onComplete(totalScore, responseArray);
  };

  const allAnswered = Object.keys(responses).length === PHQ9_QUESTIONS.length;

  return (
    <div className="phq9-container">
      <div className="phq9-header">
        <h2>Over the last 2 weeks, how often have you been bothered by the following problems?</h2>
      </div>
      
      <div className="phq9-table">
        <div className="phq9-table-header">
          <div className="phq9-question-col">Problem</div>
          <div className="phq9-option-col">Not at all (0)</div>
          <div className="phq9-option-col">Several Days (1)</div>
          <div className="phq9-option-col">More than half the days (2)</div>
          <div className="phq9-option-col">Nearly every day (3)</div>
        </div>

        {PHQ9_QUESTIONS.map((question, index) => (
          <div key={index} className="phq9-question-row">
            <div className="phq9-question-col">
              {index + 1}. {question}
            </div>
            {PHQ9_OPTIONS.map(option => (
              <div key={option.value} className="phq9-option-col">
                <input
                  type="radio"
                  name={`question-${index}`}
                  value={option.value}
                  checked={responses[index] === option.value}
                  onChange={() => handleSelect(index, option.value)}
                  className="phq9-radio"
                />
              </div>
            ))}
          </div>
        ))}

        <div className="phq9-total-row">
          <div className="phq9-question-col">
            <strong>TOTAL SCORE (add the marked numbers):</strong>
          </div>
          <div className="phq9-total-score">
            <strong>{calculateTotal()}</strong>
          </div>
          <div className="phq9-empty-col"></div>
          <div className="phq9-empty-col"></div>
          <div className="phq9-empty-col"></div>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!allAnswered}
        className="phq9-submit-btn"
      >
        Submit PHQ-9
      </button>

      <style jsx>{`
        .phq9-container {
          max-width: 1000px;
          margin: 2rem auto;
          padding: 1.5rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .phq9-header {
          margin-bottom: 1.5rem;
        }

        .phq9-header h2 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #333;
        }

        .phq9-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 1.5rem;
        }

        .phq9-table-header,
        .phq9-question-row,
        .phq9-total-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
          gap: 0.5rem;
          padding: 0.75rem;
          border-bottom: 1px solid #e5e5e5;
        }

        .phq9-table-header {
          background-color: #f8f9fa;
          font-weight: 600;
          border-bottom: 2px solid #ddd;
        }

        .phq9-total-row {
          background-color: #fffacd;
          font-weight: 600;
          border-top: 2px solid #ddd;
        }

        .phq9-question-col {
          padding: 0.5rem;
          font-size: 0.9rem;
        }

        .phq9-option-col {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem;
        }

        .phq9-radio {
          cursor: pointer;
          width: 18px;
          height: 18px;
        }

        .phq9-total-score {
          text-align: center;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .phq9-empty-col {
          padding: 0.5rem;
        }

        .phq9-submit-btn {
          width: 100%;
          padding: 0.75rem 1.5rem;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .phq9-submit-btn:hover:not(:disabled) {
          background-color: #0056b3;
        }

        .phq9-submit-btn:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .phq9-table-header,
          .phq9-question-row,
          .phq9-total-row {
            grid-template-columns: 1fr;
            gap: 0.25rem;
          }

          .phq9-table-header {
            display: none;
          }

          .phq9-question-col::before {
            content: attr(data-label);
            font-weight: 600;
            display: block;
            margin-bottom: 0.25rem;
          }
        }
      `}</style>
    </div>
  );
}
