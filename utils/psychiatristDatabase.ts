import { Psychiatrist } from '@/types';

// Mock psychiatrist database
export const PSYCHIATRIST_DATABASE: Psychiatrist[] = [
  {
    id: '1',
    name: 'Dr. Sarah Johnson',
    credential: 'MD',
    subspecialty: 'Depression & Anxiety Disorders',
    inNetwork: true,
    acceptingNewPatients: true,
    availability: 'Mon-Fri 9am-5pm',
    bio: 'Board-certified psychiatrist with 12 years of experience specializing in mood and anxiety disorders. Dr. Johnson takes a comprehensive, patient-centered approach to treatment.',
    languages: ['English', 'Spanish'],
    yearsOfExperience: 12,
    additionalCredentials: ['Board Certified in Psychiatry', 'Fellowship in Mood Disorders'],
    location: 'New York, NY',
    gender: 'female',
  },
  {
    id: '2',
    name: 'Dr. Michael Chen',
    credential: 'DO',
    subspecialty: 'ADHD & Trauma-Informed Care',
    inNetwork: false,
    acceptingNewPatients: true,
    availability: 'Tue-Thu 10am-6pm, Sat 9am-1pm',
    bio: 'Experienced psychiatrist with 8 years of practice focusing on ADHD, trauma, and stress-related disorders. Dr. Chen emphasizes a holistic approach to mental health.',
    languages: ['English', 'Mandarin'],
    yearsOfExperience: 8,
    additionalCredentials: ['Board Certified in Psychiatry', 'Certified in Trauma-Informed Care'],
    location: 'Los Angeles, CA',
    gender: 'male',
  },
  {
    id: '3',
    name: 'Dr. Emily Rodriguez',
    credential: 'MD',
    subspecialty: 'Bipolar Disorder & Schizophrenia',
    inNetwork: true,
    acceptingNewPatients: true,
    availability: 'Mon-Wed 8am-4pm, Fri 8am-12pm',
    bio: 'Specialized psychiatrist with 15 years of experience in treating severe mental illnesses. Dr. Rodriguez is known for her expertise in medication management and supportive therapy.',
    languages: ['English', 'Spanish'],
    yearsOfExperience: 15,
    additionalCredentials: ['Board Certified in Psychiatry', 'Fellowship in Psychotic Disorders'],
    location: 'Chicago, IL',
    gender: 'female',
  },
  {
    id: '4',
    name: 'Dr. James Wilson',
    credential: 'MD',
    subspecialty: 'Addiction Psychiatry & Dual Diagnosis',
    inNetwork: true,
    acceptingNewPatients: false,
    availability: 'Mon-Thu 9am-5pm',
    bio: 'Dual-certified psychiatrist with expertise in addiction medicine and co-occurring disorders. Dr. Wilson has 10 years of experience helping patients with substance use and mental health conditions.',
    languages: ['English'],
    yearsOfExperience: 10,
    additionalCredentials: ['Board Certified in Psychiatry', 'Board Certified in Addiction Medicine'],
    location: 'New York, NY',
    gender: 'male',
  },
  {
    id: '5',
    name: 'Dr. Priya Patel',
    credential: 'MD',
    subspecialty: 'Child & Adolescent Psychiatry',
    inNetwork: true,
    acceptingNewPatients: true,
    availability: 'Mon-Fri 10am-6pm',
    bio: 'Child and adolescent psychiatrist with 7 years of experience. Dr. Patel specializes in working with children, teens, and their families to address developmental and mental health challenges.',
    languages: ['English', 'Hindi', 'Gujarati'],
    yearsOfExperience: 7,
    additionalCredentials: ['Board Certified in Psychiatry', 'Board Certified in Child & Adolescent Psychiatry'],
    location: 'San Francisco, CA',
    gender: 'female',
  },
  {
    id: '6',
    name: 'Dr. Robert Martinez',
    credential: 'DO',
    subspecialty: 'Geriatric Psychiatry',
    inNetwork: false,
    acceptingNewPatients: true,
    availability: 'Mon-Wed 9am-3pm',
    bio: 'Geriatric psychiatrist with 20 years of experience focusing on mental health in older adults. Dr. Martinez specializes in dementia, depression, and anxiety in the elderly population.',
    languages: ['English', 'Spanish'],
    yearsOfExperience: 20,
    additionalCredentials: ['Board Certified in Psychiatry', 'Fellowship in Geriatric Psychiatry'],
    location: 'Miami, FL',
    gender: 'male',
  },
  {
    id: '7',
    name: 'Dr. Jennifer Kim',
    credential: 'MD',
    subspecialty: 'Women\'s Mental Health & Perinatal Psychiatry',
    inNetwork: true,
    acceptingNewPatients: true,
    availability: 'Mon-Thu 9am-5pm',
    bio: 'Specialized in women\'s mental health with 9 years of experience. Dr. Kim focuses on reproductive psychiatry, including pregnancy, postpartum, and menopause-related mental health concerns.',
    languages: ['English', 'Korean'],
    yearsOfExperience: 9,
    additionalCredentials: ['Board Certified in Psychiatry', 'Certified in Perinatal Psychiatry'],
    location: 'Seattle, WA',
    gender: 'female',
  },
  {
    id: '8',
    name: 'Dr. David Thompson',
    credential: 'MD',
    subspecialty: 'General Adult Psychiatry',
    inNetwork: true,
    acceptingNewPatients: true,
    availability: 'Mon-Fri 8am-4pm',
    bio: 'General adult psychiatrist with 6 years of experience providing comprehensive psychiatric care. Dr. Thompson treats a wide range of mental health conditions with a focus on evidence-based practices.',
    languages: ['English'],
    yearsOfExperience: 6,
    additionalCredentials: ['Board Certified in Psychiatry'],
    location: 'Boston, MA',
    gender: 'male',
  },
];

export function filterPsychiatrists(
  preferences: { location?: string; preferredGender?: string }
): Psychiatrist[] {
  let filtered = [...PSYCHIATRIST_DATABASE];

  // Filter by location (if specified and not "no preference")
  if (preferences.location && preferences.location.toLowerCase() !== 'no preference') {
    const locationLower = preferences.location.toLowerCase();
    filtered = filtered.filter(psych => {
      const psychLocation = psych.location?.toLowerCase() || '';
      // Match if location contains the preference or vice versa
      return psychLocation.includes(locationLower) || locationLower.includes(psychLocation.split(',')[0]);
    });
  }

  // Filter by gender (if specified and not "no preference")
  if (preferences.preferredGender && preferences.preferredGender.toLowerCase() !== 'no preference') {
    filtered = filtered.filter(psych => 
      psych.gender?.toLowerCase() === preferences.preferredGender?.toLowerCase()
    );
  }

  // Only return psychiatrists accepting new patients
  filtered = filtered.filter(psych => psych.acceptingNewPatients);

  // Return up to 5 matches
  return filtered.slice(0, 5);
}

