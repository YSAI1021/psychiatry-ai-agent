'use client';

import { useState } from 'react';

const PHQ9_QUESTIONS = [
  'Little interest or pleasure in doing things',
  'Feeling down, depressed, or hopeless',
  'Trouble falling asleep or sleeping too much',
  'Feeling tired or having little energy',
  'Poor appetite or overeating',
  'Feeling bad about yourself - or that you are a failure or have let yourself or family down',
  'Trouble concentrating on things, such as reading the newspaper or watching television',
  'Moving or speaking so slowly that other people could have noticed. Or the opposite - being so fidgety or restless that you have been moving around a lot more than usual',
  'Thoughts that you would be better off dead, or of hurting yourself in some way',
];

const PHQ9_OPTIONS = [
  { label: 'Not at all', value: 0 },
  { label: 'Several Days', value: 1 },
  { label: 'More than half the days', value: 2 },
  { label: 'Nearly every day', value: 3 },
];

interface PHQ9FormProps {
  onComplete: (score: number) => void;
}

export default function PHQ9Form({ onComplete }: PHQ9FormProps) {
  const [responses, setResponses] = useState<Record<number, number>>({});

  const handleSelect = (questionIndex: number, score: number) => {
    setResponses(prev => ({ ...prev, [questionIndex]: score }));
  };

  const calculateTotal = (): number => {
    return Object.values(responses).reduce((sum, score) => sum + score, 0);
  };

  const handleSubmit = () => {
    const totalScore = calculateTotal();
    onComplete(totalScore);
  };

  const allAnswered = Object.keys(responses).length === PHQ9_QUESTIONS.length;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-4">
          Please complete this short questionnaire to help us understand your situation more accurately.
        </p>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Over the last 2 weeks, how often have you been bothered by the following problems?
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-yellow-50">
              <th className="border border-gray-300 p-2 text-left text-sm font-semibold text-gray-700">
                Problem
              </th>
              <th className="border border-gray-300 p-2 text-center text-xs font-semibold text-gray-700">
                Not at all (0)
              </th>
              <th className="border border-gray-300 p-2 text-center text-xs font-semibold text-gray-700">
                Several Days (1)
              </th>
              <th className="border border-gray-300 p-2 text-center text-xs font-semibold text-gray-700">
                More than half the days (2)
              </th>
              <th className="border border-gray-300 p-2 text-center text-xs font-semibold text-gray-700">
                Nearly every day (3)
              </th>
            </tr>
          </thead>
          <tbody>
            {PHQ9_QUESTIONS.map((question, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="border border-gray-300 p-2 text-sm text-gray-700">
                  {index + 1}. {question}
                </td>
                {PHQ9_OPTIONS.map(option => (
                  <td key={option.value} className="border border-gray-300 p-2 text-center">
                    <input
                      type="radio"
                      name={`question-${index}`}
                      value={option.value}
                      checked={responses[index] === option.value}
                      onChange={() => handleSelect(index, option.value)}
                      className="cursor-pointer"
                    />
                  </td>
                ))}
              </tr>
            ))}
            <tr className="bg-yellow-50 font-semibold">
              <td className="border border-gray-300 p-2 text-sm text-gray-900">
                TOTAL SCORE (add the marked numbers):
              </td>
              <td colSpan={4} className="border border-gray-300 p-2 text-center text-lg text-gray-900">
                {calculateTotal()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!allAnswered}
        className="mt-6 w-full bg-gray-700 text-white py-2 px-4 rounded-lg font-semibold hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        Submit PHQ-9
      </button>
    </div>
  );
}

