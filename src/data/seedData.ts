import { SkillTargets, QuestionType } from '../types';

export const INITIAL_SKILL_TARGETS: SkillTargets = {
  Overall: null,
  Listening: 33,
  Reading: 36,
  Speaking: 24,
  Writing: 29,
  examDate: '2026-08-08',
  prepStartDate: '2026-07-06',
  goalType: 'visa-482',
  goalName: 'Visa 482 - Sponsor Australia'
};

export const INITIAL_QUESTION_TYPES: QuestionType[] = [
  { code: 'RA', name: 'Read Aloud', skill: 'Speaking', target: 0.22 },
  { code: 'RS', name: 'Repeat Sentence', skill: 'Speaking', target: 0.44 },
  { code: 'DI', name: 'Describe Image', skill: 'Speaking', target: 0.39 },
  { code: 'RL', name: 'Retell Lecture', skill: 'Speaking', target: 0.44 },
  { code: 'SGD', name: 'Summarize Group Discussion', skill: 'Speaking', target: 0.44 },
  { code: 'RTS', name: 'Respond To A Situation', skill: 'Speaking', target: 0.39 },
  { code: 'WE', name: 'Write Essay', skill: 'Writing', target: null },
  { code: 'SWT', name: 'Summarize Written Text', skill: 'Writing', target: null },
  { code: 'FIB', name: 'Fill in the Blanks (Reading)', skill: 'Reading', target: null },
  { code: 'FIBD&D', name: 'Fill in Blanks Drag & Drop (Reading)', skill: 'Reading', target: null },
  { code: 'RO', name: 'Reorder Paragraphs', skill: 'Reading', target: null },
  { code: 'WFD', name: 'Write From Dictation', skill: 'Listening', target: null },
  { code: 'SST', name: 'Summarize Spoken Text', skill: 'Listening', target: null },
  { code: 'FIB-L', name: 'Fill in the Blanks (Listening)', skill: 'Listening', target: null },
  { code: 'HIW', name: 'Highlight Incorrect Words', skill: 'Listening', target: null }
];
