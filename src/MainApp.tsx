import React, { useState, useEffect, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { PTEEntry, SkillTargets, QuestionType, QuestionDetail } from './types';
import { INITIAL_SKILL_TARGETS, INITIAL_QUESTION_TYPES } from './data/seedData';
import { supabase } from './lib/supabaseClient';
import * as db from './lib/supabaseData';
import Dashboard from './components/Dashboard';
import Registro from './components/Registro';
import DetallePreguntas from './components/DetallePreguntas';
import DetalleBandas from './components/DetalleBandas';
import Configuracion from './components/Configuracion';
import {
  LayoutDashboard,
  FileText,
  Settings,
  Compass,
  Network,
  LogOut,
  UploadCloud,
  X
} from 'lucide-react';

const LEGACY_STORAGE_KEY = 'pte-tracker-data-v1';
const MIGRATION_DISMISSED_KEY = 'pte-tracker-migration-dismissed';

interface MainAppProps {
  session: Session;
}

export default function MainApp({ session }: MainAppProps) {
  const userId = session.user.id;

  // Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'registro' | 'preguntas' | 'bandas' | 'config'>('dashboard');

  // Application Data States
  const [skillTargets, setSkillTargets] = useState<SkillTargets | null>(null);
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([]);
  const [entries, setEntries] = useState<PTEEntry[]>([]);
  const [questionDetails, setQuestionDetails] = useState<QuestionDetail[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Migration banner (offers to import data from this browser's localStorage, if any)
  const [showMigrationBanner, setShowMigrationBanner] = useState(false);
  const [migrating, setMigrating] = useState(false);

  // 1. Load all data for the signed-in user
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setDataLoading(true);
      setLoadError(null);
      try {
        const data = await db.fetchAllData(userId);
        if (cancelled) return;

        if (data.skillTargets) {
          setSkillTargets(data.skillTargets);
          setQuestionTypes(data.questionTypes);
        } else {
          // First time this user has logged in: seed their defaults in Supabase.
          await db.saveSkillTargets(userId, INITIAL_SKILL_TARGETS);
          await db.saveQuestionTypes(userId, INITIAL_QUESTION_TYPES);
          if (cancelled) return;
          setSkillTargets(INITIAL_SKILL_TARGETS);
          setQuestionTypes(INITIAL_QUESTION_TYPES);
        }

        setEntries(data.entries);
        setQuestionDetails(data.questionDetails);

        // Offer to import this browser's local data once, if there's something to import
        // and the account is otherwise empty (avoids re-prompting after it's done).
        const alreadyDismissed = localStorage.getItem(MIGRATION_DISMISSED_KEY) === 'true';
        const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (!alreadyDismissed && legacyRaw && data.entries.length === 0 && data.questionDetails.length === 0) {
          setShowMigrationBanner(true);
        }
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Error cargando tus datos.');
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [userId]);

  const handleImportLocalData = async () => {
    setMigrating(true);
    try {
      const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        skillTargets?: SkillTargets;
        questionTypes?: QuestionType[];
        entries?: PTEEntry[];
        questionDetails?: QuestionDetail[];
      };

      if (parsed.skillTargets) await db.saveSkillTargets(userId, parsed.skillTargets);
      if (parsed.questionTypes && parsed.questionTypes.length > 0) await db.saveQuestionTypes(userId, parsed.questionTypes);
      if (parsed.entries && parsed.entries.length > 0) await db.insertEntries(userId, parsed.entries);
      if (parsed.questionDetails && parsed.questionDetails.length > 0) await db.insertQuestionDetails(userId, parsed.questionDetails);

      if (parsed.skillTargets) setSkillTargets(parsed.skillTargets);
      if (parsed.questionTypes) setQuestionTypes(parsed.questionTypes);
      if (parsed.entries) setEntries(parsed.entries);
      if (parsed.questionDetails) setQuestionDetails(parsed.questionDetails);

      localStorage.setItem(MIGRATION_DISMISSED_KEY, 'true');
      setShowMigrationBanner(false);
    } catch (err) {
      alert('No se pudo importar tus datos locales: ' + (err instanceof Error ? err.message : 'error desconocido'));
    } finally {
      setMigrating(false);
    }
  };

  const dismissMigrationBanner = () => {
    localStorage.setItem(MIGRATION_DISMISSED_KEY, 'true');
    setShowMigrationBanner(false);
  };

  // ID Helper
  const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

  // Auto-generate pending Score Analysis items for every question type of a skill,
  // so the user only has to fill in results instead of adding them one by one.
  const generateDetailStubs = (
    entryId: string,
    entryDetalle: string,
    fecha: string,
    skill: PTEEntry['skill'],
    currentQuestionTypes: QuestionType[],
    currentDetails: QuestionDetail[]
  ): QuestionDetail[] => {
    if (skill === 'Overall') return [];
    return currentQuestionTypes
      .filter(q => q.skill === skill)
      .map((item, index) => {
        const pastDetails = currentDetails
          .filter(d => d.item === item.code && d.completed !== false)
          .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
        return {
          id: `${generateId('qdetail')}-${index}`,
          fecha,
          skill,
          item: item.code,
          contribute: pastDetails[0]?.contribute ?? 0,
          correctness: 0,
          entryId,
          entryDetalle,
          completed: false,
        };
      });
  };

  const reportError = (err: unknown) => {
    alert('Ocurrió un error guardando en la nube: ' + (err instanceof Error ? err.message : 'error desconocido'));
  };

  // ACTIONS

  const handleAddEntry = async (newEntry: Omit<PTEEntry, 'id'>) => {
    const entryWithId: PTEEntry = { ...newEntry, id: generateId('entry') };
    try {
      await db.insertEntry(userId, entryWithId);
      setEntries(prev => [entryWithId, ...prev]);

      if (entryWithId.tipo !== 'Question Test') {
        const stubs = generateDetailStubs(entryWithId.id, entryWithId.detalle, entryWithId.fecha, entryWithId.skill, questionTypes, questionDetails);
        if (stubs.length > 0) {
          await db.insertQuestionDetails(userId, stubs);
          setQuestionDetails(prev => [...stubs, ...prev]);
        }
      }
    } catch (err) {
      reportError(err);
    }
  };

  const handleAddMultipleEntries = async (newEntries: Array<Omit<PTEEntry, 'id'>>) => {
    const entriesWithIds = newEntries.map((e, index) => ({ ...e, id: `${generateId('entry')}-${index}` }));
    try {
      await db.insertEntries(userId, entriesWithIds);
      setEntries(prev => [...entriesWithIds, ...prev]);

      const stubs = entriesWithIds.flatMap(e =>
        generateDetailStubs(e.id, e.detalle, e.fecha, e.skill, questionTypes, questionDetails)
      );
      if (stubs.length > 0) {
        await db.insertQuestionDetails(userId, stubs);
        setQuestionDetails(prev => [...stubs, ...prev]);
      }
    } catch (err) {
      reportError(err);
    }
  };

  const handleUpdateEntry = async (id: string, updates: Omit<PTEEntry, 'id'>) => {
    try {
      await db.updateEntry(userId, id, { ...updates, id });
      setEntries(prev => prev.map(e => e.id === id ? { ...updates, id } : e));
    } catch (err) {
      reportError(err);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      await db.deleteEntry(id);
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      reportError(err);
    }
  };

  const handleDeleteAllEntries = async () => {
    try {
      await db.deleteAllEntries(userId);
      setEntries([]);
    } catch (err) {
      reportError(err);
    }
  };

  const handleAddDetail = async (newDetail: Omit<QuestionDetail, 'id'>) => {
    const detailWithId: QuestionDetail = { ...newDetail, id: generateId('qdetail'), completed: true };
    try {
      await db.insertQuestionDetail(userId, detailWithId);
      setQuestionDetails(prev => [detailWithId, ...prev]);
    } catch (err) {
      reportError(err);
    }
  };

  const handleUpdateDetail = async (id: string, updates: Pick<QuestionDetail, 'contribute' | 'correctness' | 'notas'>) => {
    try {
      await db.updateQuestionDetail(userId, id, updates);
      setQuestionDetails(prev => prev.map(d => d.id === id ? { ...d, ...updates, completed: true } : d));
    } catch (err) {
      reportError(err);
    }
  };

  const handleDeleteDetail = async (id: string) => {
    try {
      await db.deleteQuestionDetail(id);
      setQuestionDetails(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      reportError(err);
    }
  };

  const handleDeleteAllDetails = async () => {
    try {
      await db.deleteAllQuestionDetails(userId);
      setQuestionDetails([]);
    } catch (err) {
      reportError(err);
    }
  };

  const handleUpdateTargets = async (updatedTargets: SkillTargets) => {
    try {
      await db.saveSkillTargets(userId, updatedTargets);
      setSkillTargets(updatedTargets);
    } catch (err) {
      reportError(err);
    }
  };

  const handleUpdateQuestionTypes = async (updatedTypes: QuestionType[]) => {
    try {
      await db.saveQuestionTypes(userId, updatedTypes);
      setQuestionTypes(updatedTypes);
    } catch (err) {
      reportError(err);
    }
  };

  const handleSignOut = useCallback(() => {
    supabase.auth.signOut();
  }, []);

  if (dataLoading || !skillTargets) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center">
        {loadError ? (
          <p className="text-rose-400 text-sm">{loadError}</p>
        ) : (
          <p className="text-subtext text-sm animate-pulse">Cargando tus datos...</p>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-dark text-[#E5E5E5] flex flex-col font-sans antialiased selection:bg-gold selection:text-bg-dark">

      {/* Upper Brand Nav Header */}
      <header className="bg-bg-dark border-b border-border-dark-light pb-6 pt-8 shrink-0">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-[0.4em] text-gold font-bold mb-1">
              {skillTargets.goalName || 'Visa 482 Sponsorship Prep'}
            </span>
            <h1 className="text-3xl md:text-4xl font-light tracking-tight font-serif text-white">
              PTE <span className="italic text-gold">Mastery</span> Dashboard
            </h1>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-subtext hover:text-white bg-card-dark hover:bg-border-dark border border-border-dark rounded-sm transition-all self-start sm:self-auto cursor-pointer"
            title={session.user.email || ''}
          >
            <LogOut size={13} />
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Migration banner */}
      {showMigrationBanner && (
        <div className="bg-gold/10 border-b border-gold/20">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <UploadCloud className="text-gold shrink-0" size={18} />
              <p className="text-xs text-[#E5E5E5] font-light">
                Encontramos datos guardados en este navegador. ¿Quieres importarlos a tu cuenta?
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleImportLocalData}
                disabled={migrating}
                className="px-3 py-1.5 bg-gold hover:bg-gold-hover disabled:opacity-50 text-bg-dark text-[10px] font-bold uppercase tracking-wider rounded-sm transition-all cursor-pointer"
              >
                {migrating ? 'Importando...' : 'Importar datos'}
              </button>
              <button
                onClick={dismissMigrationBanner}
                className="p-1.5 text-subtext hover:text-white transition-colors cursor-pointer"
                title="Cerrar"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Tab bar */}
      <nav className="bg-card-dark border-b border-border-dark sticky top-0 z-40 shrink-0">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-1 md:space-x-3 overflow-x-auto no-scrollbar py-3">

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-sm text-xs md:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-gold text-bg-dark font-semibold shadow-md shadow-gold/10'
                  : 'text-subtext hover:bg-border-dark hover:text-white'
              }`}
            >
              <LayoutDashboard size={15} />
              Dashboard
            </button>

            <button
              onClick={() => setActiveTab('registro')}
              className={`flex items-center gap-2 px-4 py-2 rounded-sm text-xs md:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'registro'
                  ? 'bg-gold text-bg-dark font-semibold shadow-md shadow-gold/10'
                  : 'text-subtext hover:bg-border-dark hover:text-white'
              }`}
            >
              <FileText size={15} />
              Registro de Puntaje
            </button>

            <button
              onClick={() => setActiveTab('preguntas')}
              className={`flex items-center gap-2 px-4 py-2 rounded-sm text-xs md:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'preguntas'
                  ? 'bg-gold text-bg-dark font-semibold shadow-md shadow-gold/10'
                  : 'text-subtext hover:bg-border-dark hover:text-white'
              }`}
            >
              <Network size={15} />
              Análisis de Preguntas
            </button>

            <button
              onClick={() => setActiveTab('bandas')}
              className={`flex items-center gap-2 px-4 py-2 rounded-sm text-xs md:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'bandas'
                  ? 'bg-gold text-bg-dark font-semibold shadow-md shadow-gold/10'
                  : 'text-subtext hover:bg-border-dark hover:text-white'
              }`}
            >
              <Compass size={15} />
              Fortalezas y Enfoque
            </button>

            <button
              onClick={() => setActiveTab('config')}
              className={`flex items-center gap-2 px-4 py-2 rounded-sm text-xs md:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'config'
                  ? 'bg-gold text-bg-dark font-semibold shadow-md shadow-gold/10'
                  : 'text-subtext hover:bg-border-dark hover:text-white'
              }`}
            >
              <Settings size={15} />
              Metas / Ajustes
            </button>

          </div>
        </div>
      </nav>

      {/* Main content body */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        <div className="animate-fade-in">
          {activeTab === 'dashboard' && (
            <Dashboard
              entries={entries}
              targets={skillTargets}
            />
          )}

          {activeTab === 'registro' && (
            <Registro
              entries={entries}
              targets={skillTargets}
              questionTypes={questionTypes}
              onAddEntry={handleAddEntry}
              onAddMultipleEntries={handleAddMultipleEntries}
              onUpdateEntry={handleUpdateEntry}
              onDeleteEntry={handleDeleteEntry}
              onGoToAnalysis={() => setActiveTab('preguntas')}
            />
          )}

          {activeTab === 'preguntas' && (
            <DetallePreguntas
              questionDetails={questionDetails}
              questionTypes={questionTypes}
              onAddDetail={handleAddDetail}
              onUpdateDetail={handleUpdateDetail}
              onDeleteDetail={handleDeleteDetail}
              onDeleteAllDetails={handleDeleteAllDetails}
            />
          )}

          {activeTab === 'bandas' && (
            <DetalleBandas
              questionDetails={questionDetails.filter(d => d.completed !== false)}
              questionTypes={questionTypes}
            />
          )}

          {activeTab === 'config' && (
            <Configuracion
              targets={skillTargets}
              questionTypes={questionTypes}
              onUpdateTargets={handleUpdateTargets}
              onUpdateQuestionTypes={handleUpdateQuestionTypes}
              onDeleteAllEntries={handleDeleteAllEntries}
              entries={entries}
              questionDetails={questionDetails}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card-dark border-t border-border-dark-light py-8 text-center text-xs text-subtext shrink-0 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="font-light text-left md:text-left">PTE Mastery Dashboard © 2026. Herramienta independiente de apoyo para el examen PTE Academic.</p>
          <div className="flex justify-center gap-4 text-muted font-bold text-[10px] tracking-widest uppercase">
            <span>Seguimiento de Visa 482</span>
            <span>•</span>
            <span>APEUni Compatible</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
