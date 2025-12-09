/**
 * Memory tracking utilities for intake agent
 * Tracks covered topics to avoid repetition
 */

export interface TopicMemory {
  coveredTopics: Set<string>;
  lastQuestion: string | null;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
}

// Topic keywords for detection
export const TOPIC_KEYWORDS: Record<string, string[]> = {
  reasonForVisit: ['reason', 'why', 'visit', 'here', 'come', 'problem', 'issue', 'concern'],
  identifyingInfo: ['name', 'age', 'date of birth', 'dob', 'address', 'phone', 'email', 'contact'],
  chiefComplaint: ['chief complaint', 'main concern', 'primary issue', 'what brings you'],
  presentIllness: ['feeling', 'symptoms', 'mood', 'depressed', 'anxious', 'stress', 'worried', 'sad', 'down', 'recent'],
  pastPsychiatric: ['therapy', 'counseling', 'psychiatrist', 'psychologist', 'medication', 'meds', 'treatment', 'diagnosis', 'past', 'previous', 'history'],
  familyHistory: ['family', 'parent', 'mother', 'father', 'sibling', 'relative', 'genetic', 'hereditary'],
  medicalHistory: ['medical', 'health', 'condition', 'disease', 'illness', 'doctor', 'physician', 'hospital'],
  substanceUse: ['alcohol', 'drug', 'substance', 'smoking', 'drinking', 'marijuana', 'cannabis', 'cocaine', 'opioid', 'tobacco'],
  mentalStatus: ['concentration', 'focus', 'memory', 'thinking', 'thoughts', 'suicidal', 'self-harm', 'cognitive'],
  functioning: ['work', 'job', 'school', 'daily', 'function', 'activities', 'routine', 'social', 'relationships'],
  sleep: ['sleep', 'insomnia', 'sleeping', 'tired', 'rest', 'wake', 'night'],
  energy: ['energy', 'fatigue', 'tired', 'exhausted', 'lethargic'],
  appetite: ['appetite', 'eating', 'food', 'hungry', 'weight'],
};

/**
 * Detect topics from user message
 */
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

/**
 * Check if a topic has been covered
 */
export function isTopicCovered(topic: string, memory: TopicMemory): boolean {
  return memory.coveredTopics.has(topic);
}

/**
 * Add topics to memory
 */
export function addTopicsToMemory(topics: string[], memory: TopicMemory): void {
  topics.forEach(topic => memory.coveredTopics.add(topic));
}

/**
 * Get uncovered topics
 */
export function getUncoveredTopics(memory: TopicMemory): string[] {
  const allTopics = Object.keys(TOPIC_KEYWORDS);
  return allTopics.filter(topic => !memory.coveredTopics.has(topic));
}

/**
 * Initialize memory
 */
export function initializeMemory(): TopicMemory {
  return {
    coveredTopics: new Set(),
    lastQuestion: null,
    conversationHistory: [],
  };
}

