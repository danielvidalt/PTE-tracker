import { PTEEntry, SkillTargets, QuestionType, QuestionDetail } from '../types';

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

export const INITIAL_ENTRIES: PTEEntry[] = [
  {
    id: 'entry-1',
    fecha: '2026-07-06',
    tipo: 'Full Test',
    skill: 'Overall',
    detalle: 'Mock Test 45C - VIP Full Test',
    puntaje: 35,
    notas: 'Primer test de diagnóstico completo'
  },
  {
    id: 'entry-2',
    fecha: '2026-07-06',
    tipo: 'Full Test',
    skill: 'Listening',
    detalle: 'Mock Test 45C - VIP Full Test',
    puntaje: 28,
    notas: 'Muy bajo, necesito mejorar Write From Dictation'
  },
  {
    id: 'entry-3',
    fecha: '2026-07-06',
    tipo: 'Full Test',
    skill: 'Reading',
    detalle: 'Mock Test 45C - VIP Full Test',
    puntaje: 50,
    notas: 'Buen puntaje inicial, por encima de la meta'
  },
  {
    id: 'entry-4',
    fecha: '2026-07-06',
    tipo: 'Full Test',
    skill: 'Speaking',
    detalle: 'Mock Test 45C - VIP Full Test',
    puntaje: 29,
    notas: 'Supera la meta mínima, pero hay que asegurar'
  },
  {
    id: 'entry-5',
    fecha: '2026-07-06',
    tipo: 'Full Test',
    skill: 'Writing',
    detalle: 'Mock Test 45C - VIP Full Test',
    puntaje: 34,
    notas: 'Buen puntaje inicial'
  },
  {
    id: 'entry-6',
    fecha: '2026-07-07',
    tipo: 'Section Test',
    skill: 'Speaking',
    detalle: 'Speaking Section Test 44C',
    puntaje: 31,
    notas: 'Mejora de 2 puntos respecto al anterior'
  }
];

export const INITIAL_QUESTION_DETAILS: QuestionDetail[] = [
  {
    id: 'qdetail-1',
    fecha: '2026-07-07',
    skill: 'Speaking',
    item: 'DI',
    contribute: 0.31,
    correctness: 0.182,
    notas: 'Describe Image',
    entryId: 'entry-6',
    entryDetalle: 'Speaking Section Test 44C',
    completed: true
  },
  {
    id: 'qdetail-2',
    fecha: '2026-07-07',
    skill: 'Speaking',
    item: 'SGD',
    contribute: 0.19,
    correctness: 0.272,
    notas: 'Summarize Group Discussion',
    entryId: 'entry-6',
    entryDetalle: 'Speaking Section Test 44C',
    completed: true
  },
  {
    id: 'qdetail-3',
    fecha: '2026-07-07',
    skill: 'Speaking',
    item: 'RS',
    contribute: 0.16,
    correctness: 0.544,
    notas: 'Repeat Sentence',
    entryId: 'entry-6',
    entryDetalle: 'Speaking Section Test 44C',
    completed: true
  },
  {
    id: 'qdetail-4',
    fecha: '2026-07-07',
    skill: 'Speaking',
    item: 'RTS',
    contribute: 0.13,
    correctness: 0.378,
    notas: 'Respond To A Situation',
    entryId: 'entry-6',
    entryDetalle: 'Speaking Section Test 44C',
    completed: true
  },
  {
    id: 'qdetail-5',
    fecha: '2026-07-07',
    skill: 'Speaking',
    item: 'RL',
    contribute: 0.13,
    correctness: 0.156,
    notas: 'Retell Lecture',
    entryId: 'entry-6',
    entryDetalle: 'Speaking Section Test 44C',
    completed: true
  },
  {
    id: 'qdetail-6',
    fecha: '2026-07-07',
    skill: 'Speaking',
    item: 'RA',
    contribute: 0.09,
    correctness: 0.467,
    notas: 'Read Aloud',
    entryId: 'entry-6',
    entryDetalle: 'Speaking Section Test 44C',
    completed: true
  }
];
