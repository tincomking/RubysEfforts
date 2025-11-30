export interface Word {
  word: string;
  definition: string;
  example: string;
  phonetic: string;
  quiz_sentence: string; // Sentence with the word missing (represented by underscores)
  options: string[]; // 4 options including the correct word
}

export interface DailyRecord {
  date: string; // YYYY-MM-DD
  words: Word[];
  completed: boolean;
  score?: number;
}

export interface UserProgress {
  streak: number;
  lastLoginDate: string;
  history: DailyRecord[];
  totalWordsLearned: number;
}

export enum AppState {
  HOME = 'HOME',
  LEARNING = 'LEARNING', // Viewing the card
  SPELLING = 'SPELLING', // Spelling check
  QUIZ = 'QUIZ',         // Fill in the blank
  COMPLETED = 'COMPLETED',
  WEEKLY_TEST = 'WEEKLY_TEST', // Batch testing
  LOADING = 'LOADING',
  ERROR = 'ERROR'
}

export type QuizMode = 'DAILY' | 'WEEKLY';
