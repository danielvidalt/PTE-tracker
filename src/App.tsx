import React, { useState, useEffect } from 'react';
import { PTEEntry, SkillTargets, QuestionType, QuestionDetail } from './types';
import {
  INITIAL_SKILL_TARGETS,
  INITIAL_QUESTION_TYPES,
  INITIAL_ENTRIES,
  INITIAL_QUESTION_DETAILS
} from './data/seedData';
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
  BookOpen, 
  GraduationCap
} from 'lucide-react';

const STORAGE_KEY = 'pte-tracker-data-v1';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'registro' | 'preguntas' | 'bandas' | 'config'>('dashboard');

  // Application Data States
  const [skillTargets, setSkillTargets] = useState<SkillTargets>(INITIAL_SKILL_TARGETS);
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>(INITIAL_QUESTION_TYPES);
  const [entries, setEntries] = useState<PTEEntry[]>(INITIAL_ENTRIES);
  const [questionDetails, setQuestionDetails] = useState<QuestionDetail[]>(INITIAL_QUESTION_DETAILS);

  // 1. Initial hydration from LocalStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.skillTargets) setSkillTargets(parsed.skillTargets);
        if (parsed.questionTypes) setQuestionTypes(parsed.questionTypes);
        if (parsed.entries) setEntries(parsed.entries);
        if (parsed.questionDetails) setQuestionDetails(parsed.questionDetails);
      }
    } catch (e) {
      console.error('Error hydrating state from local storage', e);
    }
  }, []);

  // 2. Persist state to LocalStorage when any state change happens
  useEffect(() => {
    try {
      const dataToSave = {
        skillTargets,
        questionTypes,
        entries,
        questionDetails,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
      console.error('Error saving state to local storage', e);
    }
  }, [skillTargets, questionTypes, entries, questionDetails]);

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

  // ACTIONS

  // Add a single PTE score entry
  const handleAddEntry = (newEntry: Omit<PTEEntry, 'id'>) => {
    const entryWithId: PTEEntry = {
      ...newEntry,
      id: generateId('entry'),
    };
    setEntries(prev => [entryWithId, ...prev]);

    // Section Test / Question Test single-skill entries: auto-list that skill's items.
    // Question Test is for practicing one specific item, so it's excluded here.
    if (entryWithId.tipo !== 'Question Test') {
      setQuestionDetails(prev => [
        ...generateDetailStubs(entryWithId.id, entryWithId.detalle, entryWithId.fecha, entryWithId.skill, questionTypes, prev),
        ...prev,
      ]);
    }
  };

  // Add multiple PTE score entries (used for Full Test shortcut)
  const handleAddMultipleEntries = (newEntries: Array<Omit<PTEEntry, 'id'>>) => {
    const entriesWithIds = newEntries.map((e, index) => ({
      ...e,
      id: `${generateId('entry')}-${index}`,
    }));
    setEntries(prev => [...entriesWithIds, ...prev]);

    // Full Test: auto-list every item across all 4 skills.
    setQuestionDetails(prev => {
      const stubs = entriesWithIds.flatMap(e =>
        generateDetailStubs(e.id, e.detalle, e.fecha, e.skill, questionTypes, prev)
      );
      return [...stubs, ...prev];
    });
  };

  // Edit an existing PTE score entry
  const handleUpdateEntry = (id: string, updates: Omit<PTEEntry, 'id'>) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...updates, id } : e));
  };

  // Delete a PTE score entry
  const handleDeleteEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  // Delete ALL PTE score entries
  const handleDeleteAllEntries = () => {
    setEntries([]);
  };

  // Add detailed score analysis question item (manual, standalone entry)
  const handleAddDetail = (newDetail: Omit<QuestionDetail, 'id'>) => {
    const detailWithId: QuestionDetail = {
      ...newDetail,
      id: generateId('qdetail'),
      completed: true,
    };
    setQuestionDetails(prev => [detailWithId, ...prev]);
  };

  // Fill in results for an auto-generated pending Score Analysis item
  const handleUpdateDetail = (id: string, updates: Pick<QuestionDetail, 'contribute' | 'correctness' | 'notas'>) => {
    setQuestionDetails(prev => prev.map(d => d.id === id ? { ...d, ...updates, completed: true } : d));
  };

  // Delete detailed score analysis question item
  const handleDeleteDetail = (id: string) => {
    setQuestionDetails(prev => prev.filter(d => d.id !== id));
  };

  // Delete ALL detailed score analysis question items
  const handleDeleteAllDetails = () => {
    setQuestionDetails([]);
  };

  // Save/Update main targets & dates
  const handleUpdateTargets = (updatedTargets: SkillTargets) => {
    setSkillTargets(updatedTargets);
  };

  // Save/Update 15 question items objectives
  const handleUpdateQuestionTypes = (updatedTypes: QuestionType[]) => {
    setQuestionTypes(updatedTypes);
  };

  // Load from backup file
  const handleImportBackup = (backup: {
    entries: PTEEntry[];
    targets?: SkillTargets;
    skillTargets?: SkillTargets;
    questionTypes: QuestionType[];
    questionDetails: QuestionDetail[];
  }) => {
    setEntries(backup.entries);
    setSkillTargets((backup.targets || backup.skillTargets) as SkillTargets);
    setQuestionTypes(backup.questionTypes);
    setQuestionDetails(backup.questionDetails);
  };

  return (
    <div className="min-h-screen bg-bg-dark text-[#E5E5E5] flex flex-col font-sans antialiased selection:bg-gold selection:text-bg-dark">
      
      {/* Upper Brand Nav Header */}
      <header className="bg-bg-dark border-b border-border-dark-light pb-6 pt-8 shrink-0">
        <div className="max-w-7xl mx-auto px-4 flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.4em] text-gold font-bold mb-1">
            {skillTargets.goalName || 'Visa 482 Sponsorship Prep'}
          </span>
          <h1 className="text-3xl md:text-4xl font-light tracking-tight font-serif text-white">
            PTE <span className="italic text-gold">Mastery</span> Dashboard
          </h1>
        </div>
      </header>

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
