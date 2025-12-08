/**
 * Psychiatrist matching algorithm
 * Uses embedding similarity and specialty tags to match patients with psychiatrists
 */

import { ClinicalSummary, Psychiatrist } from './store';

/**
 * Mock psychiatrist database
 * In production, this would come from Supabase or external API
 */
export const MOCK_PSYCHIATRISTS: Psychiatrist[] = [
  {
    id: '1',
    name: 'Dr. Sarah Chen',
    specialty: ['Depression', 'Anxiety', 'PTSD'],
    bio: 'Board-certified psychiatrist with 15 years of experience specializing in mood disorders and trauma-informed care.',
    experience: 15,
    rating: 4.8,
    availability: ['Monday-Friday, 9am-5pm'],
    tags: ['depression', 'anxiety', 'ptsd', 'trauma', 'cbt', 'medication-management'],
  },
  {
    id: '2',
    name: 'Dr. Michael Rodriguez',
    specialty: ['Bipolar Disorder', 'Schizophrenia', 'Psychosis'],
    bio: 'Specializes in severe mental illness and first-episode psychosis. Strong focus on medication management and family support.',
    experience: 12,
    rating: 4.9,
    availability: ['Monday-Friday, 8am-6pm'],
    tags: ['bipolar', 'schizophrenia', 'psychosis', 'severe-mental-illness', 'medication-management'],
  },
  {
    id: '3',
    name: 'Dr. Emily Watson',
    specialty: ['ADHD', 'Autism Spectrum', 'Child Psychiatry'],
    bio: 'Child and adolescent psychiatrist with expertise in neurodevelopmental disorders. Family-centered approach.',
    experience: 10,
    rating: 4.7,
    availability: ['Tuesday-Saturday, 10am-6pm'],
    tags: ['adhd', 'autism', 'child-psychiatry', 'adolescent', 'neurodevelopmental', 'family-therapy'],
  },
  {
    id: '4',
    name: 'Dr. James Park',
    specialty: ['Addiction', 'Substance Use', 'Dual Diagnosis'],
    bio: 'Addiction psychiatry specialist with expertise in dual diagnosis and medication-assisted treatment.',
    experience: 18,
    rating: 4.6,
    availability: ['Monday-Friday, 7am-4pm'],
    tags: ['addiction', 'substance-use', 'dual-diagnosis', 'mat', 'recovery'],
  },
  {
    id: '5',
    name: 'Dr. Lisa Thompson',
    specialty: ['Eating Disorders', 'OCD', 'Anxiety'],
    bio: 'Specializes in eating disorders, OCD, and anxiety disorders using evidence-based treatments including ERP and CBT.',
    experience: 14,
    rating: 4.8,
    availability: ['Monday-Thursday, 9am-7pm'],
    tags: ['eating-disorders', 'ocd', 'anxiety', 'erp', 'cbt', 'exposure-therapy'],
  },
];

/**
 * Match psychiatrists based on clinical summary
 * Uses keyword matching on symptoms, diagnoses, and specialty tags
 * @param summary - Clinical summary from intake
 * @param limit - Maximum number of matches to return
 * @returns Sorted array of matched psychiatrists
 */
export function matchPsychiatrists(
  summary: ClinicalSummary,
  limit: number = 5
): Psychiatrist[] {
  const allPsychiatrists = [...MOCK_PSYCHIATRISTS];
  const scored = allPsychiatrists.map((psych) => {
    let score = 0;

    // Match on symptoms
    const symptomsText = summary.symptoms.join(' ').toLowerCase();
    psych.tags.forEach((tag) => {
      if (symptomsText.includes(tag.toLowerCase())) {
        score += 2;
      }
    });

    // Match on prior diagnoses
    const diagnosesText = summary.priorDiagnoses.join(' ').toLowerCase();
    psych.specialty.forEach((spec) => {
      if (diagnosesText.includes(spec.toLowerCase())) {
        score += 3;
      }
      if (symptomsText.includes(spec.toLowerCase())) {
        score += 2;
      }
    });

    // Match on safety concerns
    if (summary.safetyConcerns.hallucinations || summary.safetyConcerns.delusions) {
      if (psych.tags.includes('psychosis') || psych.tags.includes('schizophrenia')) {
        score += 4;
      }
    }

    // Boost score for higher ratings and experience
    score += psych.rating * 0.5;
    score += psych.experience * 0.1;

    return { psych, score };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((item) => item.psych);
}

/**
 * Get psychiatrists by specialty tags
 */
export function getPsychiatristsByTags(tags: string[]): Psychiatrist[] {
  return MOCK_PSYCHIATRISTS.filter((psych) =>
    tags.some((tag) =>
      psych.tags.some((psychTag) =>
        psychTag.toLowerCase().includes(tag.toLowerCase())
      )
    )
  );
}

