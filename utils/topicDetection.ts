// Topic keywords for detecting what has been discussed
export const TOPIC_KEYWORDS: Record<string, string[]> = {
  greeting: ['hello', 'hi', 'hey', 'greeting'],
  identifying: ['name', 'age', 'date of birth', 'dob', 'address', 'phone', 'email', 'contact'],
  chiefComplaint: ['reason', 'why', 'problem', 'issue', 'concern', 'visit', 'here', 'come'],
  presentIllness: ['feeling', 'symptoms', 'mood', 'depressed', 'anxious', 'stress', 'worried', 'sad', 'down'],
  sleep: ['sleep', 'insomnia', 'sleeping', 'tired', 'rest', 'wake', 'night'],
  energy: ['energy', 'fatigue', 'tired', 'exhausted', 'lethargic'],
  appetite: ['appetite', 'eating', 'food', 'hungry', 'weight'],
  anxiety: ['anxious', 'anxiety', 'worry', 'worried', 'panic', 'nervous'],
  relationships: ['relationship', 'family', 'friends', 'partner', 'spouse', 'social'],
  substanceUse: ['alcohol', 'drug', 'substance', 'smoking', 'drinking', 'marijuana', 'cannabis', 'cocaine', 'opioid'],
  pastPsychiatric: ['therapy', 'counseling', 'psychiatrist', 'psychologist', 'medication', 'meds', 'treatment', 'diagnosis'],
  familyHistory: ['family', 'parent', 'mother', 'father', 'sibling', 'relative', 'genetic', 'hereditary'],
  medicalHistory: ['medical', 'health', 'condition', 'disease', 'illness', 'medication', 'meds', 'doctor'],
  mentalStatus: ['concentration', 'focus', 'memory', 'thinking', 'thoughts', 'suicidal', 'self-harm'],
  functioning: ['work', 'job', 'school', 'daily', 'function', 'activities', 'routine'],
};

export function detectTopics(text: string): string[] {
  const lowerText = text.toLowerCase();
  const detectedTopics: string[] = [];

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      detectedTopics.push(topic);
    }
  }

  return detectedTopics;
}

export function getTopicsNotDiscussed(discussedTopics: Set<string>): string[] {
  const allTopics = Object.keys(TOPIC_KEYWORDS);
  return allTopics.filter(topic => !discussedTopics.has(topic));
}
