export interface PTEEntry {
  id: string;
  fecha: string; // YYYY-MM-DD
  tipo: 'Full Test' | 'Section Test' | 'Question Test';
  skill: 'Overall' | 'Listening' | 'Reading' | 'Speaking' | 'Writing';
  detalle: string;
  puntaje: number; // 10 - 90
  notas?: string;
}

export interface SkillTargets {
  Overall: number | null;
  Listening: number;
  Reading: number;
  Speaking: number;
  Writing: number;
  examDate: string; // YYYY-MM-DD
  prepStartDate: string; // YYYY-MM-DD
  goalType?: string; // 'visa-482' | 'competent' | 'proficient' | 'superior' | 'visa-500' | 'visa-485' | 'custom'
  goalName?: string; // For custom goals, e.g., 'Estudio de Postgrado', 'Trabajo', 'Reto Personal'
}

export interface QuestionType {
  code: string;
  name: string;
  skill: 'Listening' | 'Reading' | 'Speaking' | 'Writing';
  target: number | null; // e.g. 0.22 for 22%
}

export interface QuestionDetail {
  id: string;
  fecha: string; // YYYY-MM-DD
  skill: 'Listening' | 'Reading' | 'Speaking' | 'Writing';
  item: string; // code from QuestionType
  contribute: number; // e.g. 0.31 for 31%
  correctness: number; // e.g. 0.182 for 18.2%
  notas?: string;
  entryId?: string; // links back to the PTEEntry (test/section) that generated this item automatically
  entryDetalle?: string; // name of the source test, for display grouping
  completed?: boolean; // false = auto-generated placeholder still awaiting real results
}
