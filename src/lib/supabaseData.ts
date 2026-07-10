import { supabase } from './supabaseClient';
import { PTEEntry, QuestionDetail, QuestionType, SkillTargets } from '../types';

// --- Row <-> App type mapping -------------------------------------------------

interface SkillTargetsRow {
  overall: number | null;
  listening: number;
  reading: number;
  speaking: number;
  writing: number;
  exam_date: string;
  prep_start_date: string;
  goal_type: string | null;
  goal_name: string | null;
}

function rowToSkillTargets(row: SkillTargetsRow): SkillTargets {
  return {
    Overall: row.overall,
    Listening: row.listening,
    Reading: row.reading,
    Speaking: row.speaking,
    Writing: row.writing,
    examDate: row.exam_date,
    prepStartDate: row.prep_start_date,
    goalType: row.goal_type || undefined,
    goalName: row.goal_name || undefined,
  };
}

function skillTargetsToRow(userId: string, targets: SkillTargets) {
  return {
    user_id: userId,
    overall: targets.Overall,
    listening: targets.Listening,
    reading: targets.Reading,
    speaking: targets.Speaking,
    writing: targets.Writing,
    exam_date: targets.examDate,
    prep_start_date: targets.prepStartDate,
    goal_type: targets.goalType || null,
    goal_name: targets.goalName || null,
  };
}

interface QuestionTypeRow {
  code: string;
  name: string;
  skill: QuestionType['skill'];
  target: number | null;
}

function rowToQuestionType(row: QuestionTypeRow): QuestionType {
  return { code: row.code, name: row.name, skill: row.skill, target: row.target };
}

function questionTypeToRow(userId: string, q: QuestionType) {
  return { user_id: userId, code: q.code, name: q.name, skill: q.skill, target: q.target };
}

interface EntryRow {
  id: string;
  fecha: string;
  tipo: PTEEntry['tipo'];
  skill: PTEEntry['skill'];
  detalle: string;
  puntaje: number;
  notas: string | null;
}

function rowToEntry(row: EntryRow): PTEEntry {
  return {
    id: row.id,
    fecha: row.fecha,
    tipo: row.tipo,
    skill: row.skill,
    detalle: row.detalle,
    puntaje: row.puntaje,
    notas: row.notas || undefined,
  };
}

function entryToRow(userId: string, e: PTEEntry) {
  return {
    id: e.id,
    user_id: userId,
    fecha: e.fecha,
    tipo: e.tipo,
    skill: e.skill,
    detalle: e.detalle,
    puntaje: e.puntaje,
    notas: e.notas || null,
  };
}

interface QuestionDetailRow {
  id: string;
  fecha: string;
  skill: QuestionDetail['skill'];
  item: string;
  contribute: number;
  correctness: number;
  notas: string | null;
  entry_id: string | null;
  entry_detalle: string | null;
  completed: boolean;
}

function rowToQuestionDetail(row: QuestionDetailRow): QuestionDetail {
  return {
    id: row.id,
    fecha: row.fecha,
    skill: row.skill,
    item: row.item,
    contribute: row.contribute,
    correctness: row.correctness,
    notas: row.notas || undefined,
    entryId: row.entry_id || undefined,
    entryDetalle: row.entry_detalle || undefined,
    completed: row.completed,
  };
}

function questionDetailToRow(userId: string, d: QuestionDetail) {
  return {
    id: d.id,
    user_id: userId,
    fecha: d.fecha,
    skill: d.skill,
    item: d.item,
    contribute: d.contribute,
    correctness: d.correctness,
    notas: d.notas || null,
    entry_id: d.entryId || null,
    entry_detalle: d.entryDetalle || null,
    completed: d.completed !== false,
  };
}

// --- Fetch all data for a user -------------------------------------------------

export async function fetchAllData(userId: string) {
  const [targetsRes, typesRes, entriesRes, detailsRes] = await Promise.all([
    supabase.from('skill_targets').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('question_types').select('*').eq('user_id', userId),
    supabase.from('entries').select('*').eq('user_id', userId).order('fecha', { ascending: false }),
    supabase.from('question_details').select('*').eq('user_id', userId).order('fecha', { ascending: false }),
  ]);

  if (targetsRes.error) throw targetsRes.error;
  if (typesRes.error) throw typesRes.error;
  if (entriesRes.error) throw entriesRes.error;
  if (detailsRes.error) throw detailsRes.error;

  return {
    skillTargets: targetsRes.data ? rowToSkillTargets(targetsRes.data) : null,
    questionTypes: (typesRes.data || []).map(rowToQuestionType),
    entries: (entriesRes.data || []).map(rowToEntry),
    questionDetails: (detailsRes.data || []).map(rowToQuestionDetail),
  };
}

// --- Skill targets --------------------------------------------------------------

export async function saveSkillTargets(userId: string, targets: SkillTargets) {
  const { error } = await supabase.from('skill_targets').upsert(skillTargetsToRow(userId, targets));
  if (error) throw error;
}

// --- Question types ---------------------------------------------------------------

export async function saveQuestionTypes(userId: string, types: QuestionType[]) {
  const { error } = await supabase
    .from('question_types')
    .upsert(types.map(q => questionTypeToRow(userId, q)));
  if (error) throw error;
}

// --- Entries ------------------------------------------------------------------

export async function insertEntry(userId: string, entry: PTEEntry) {
  const { error } = await supabase.from('entries').insert(entryToRow(userId, entry));
  if (error) throw error;
}

export async function insertEntries(userId: string, entries: PTEEntry[]) {
  const { error } = await supabase.from('entries').insert(entries.map(e => entryToRow(userId, e)));
  if (error) throw error;
}

export async function updateEntry(userId: string, id: string, entry: PTEEntry) {
  const { error } = await supabase.from('entries').update(entryToRow(userId, entry)).eq('id', id);
  if (error) throw error;
}

export async function deleteEntry(id: string) {
  const { error } = await supabase.from('entries').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteAllEntries(userId: string) {
  const { error } = await supabase.from('entries').delete().eq('user_id', userId);
  if (error) throw error;
}

// --- Question details -----------------------------------------------------------

export async function insertQuestionDetail(userId: string, detail: QuestionDetail) {
  const { error } = await supabase.from('question_details').insert(questionDetailToRow(userId, detail));
  if (error) throw error;
}

export async function insertQuestionDetails(userId: string, details: QuestionDetail[]) {
  if (details.length === 0) return;
  const { error } = await supabase
    .from('question_details')
    .insert(details.map(d => questionDetailToRow(userId, d)));
  if (error) throw error;
}

export async function updateQuestionDetail(
  userId: string,
  id: string,
  updates: Pick<QuestionDetail, 'contribute' | 'correctness' | 'notas'>
) {
  const { error } = await supabase
    .from('question_details')
    .update({
      contribute: updates.contribute,
      correctness: updates.correctness,
      notas: updates.notas || null,
      completed: true,
    })
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function deleteQuestionDetail(id: string) {
  const { error } = await supabase.from('question_details').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteAllQuestionDetails(userId: string) {
  const { error } = await supabase.from('question_details').delete().eq('user_id', userId);
  if (error) throw error;
}
