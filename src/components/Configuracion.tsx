import React, { useState } from 'react';
import { SkillTargets, QuestionType, PTEEntry, QuestionDetail } from '../types';
import { Save, Trash2, CheckCircle, AlertTriangle, GraduationCap } from 'lucide-react';

interface ConfiguracionProps {
  targets: SkillTargets;
  questionTypes: QuestionType[];
  onUpdateTargets: (targets: SkillTargets) => void;
  onUpdateQuestionTypes: (types: QuestionType[]) => void;
  onDeleteAllEntries: () => void;
  entries: PTEEntry[];
  questionDetails: QuestionDetail[];
}

const SKILL_COLORS: Record<string, string> = {
  Listening: '#5B92E5', // elegante azul
  Reading: '#A8C353',   // elegante verde oliva/lima suave
  Speaking: '#A3A3A3',  // elegante plata/gris
  Writing: '#D65A9C',   // elegante oro rosa/magenta
};

export const GOAL_PRESETS = [
  {
    id: 'visa-482',
    name: 'Visa 482 - Sponsor Australia (TSS)',
    description: 'Requisitos para patrocinio temporal. Equivalente a IELTS 5.0 overall con mínimos específicos por sección (S:24, W:29, L:33, R:36 en PTE Academic).',
    scores: { Overall: 36, Listening: 33, Reading: 36, Speaking: 24, Writing: 29 },
  },
  {
    id: 'visa-competent',
    name: 'Visa 189/190/491 - Competent English',
    description: 'Nivel competente básico requerido para visas de puntos. Equivalente a IELTS 6.0 en cada una de las 4 secciones (Mínimo 50 en cada skill en PTE Academic).',
    scores: { Overall: 50, Listening: 50, Reading: 50, Speaking: 50, Writing: 50 },
  },
  {
    id: 'visa-proficient',
    name: 'Visa 189/190/491 - Proficient English (+10 pts)',
    description: 'Suma 10 puntos en la tabla de puntaje de migración de Australia. Equivalente a IELTS 7.0 en cada una de las 4 secciones (Mínimo 65 en cada skill en PTE Academic).',
    scores: { Overall: 65, Listening: 65, Reading: 65, Speaking: 65, Writing: 65 },
  },
  {
    id: 'visa-superior',
    name: 'Visa 189/190/491 - Superior English (+20 pts)',
    description: 'Suma 20 puntos (máximo) en la tabla de puntaje de migración. Equivalente a IELTS 8.0 en cada una de las 4 secciones (Mínimo 79 en cada skill en PTE Academic).',
    scores: { Overall: 79, Listening: 79, Reading: 79, Speaking: 79, Writing: 79 },
  },
  {
    id: 'visa-500',
    name: 'Visa 500 - Student Visa (Nuevas Reglas)',
    description: 'Requisito mínimo aumentado para estudios universitarios directos de pregrado/postgrado en Australia (PTE Overall 50, mínimo 42 por skill).',
    scores: { Overall: 50, Listening: 42, Reading: 42, Speaking: 42, Writing: 42 },
  },
  {
    id: 'visa-485',
    name: 'Visa 485 - Temporary Graduate (Nuevas Reglas)',
    description: 'Requisito para visa de graduado temporal post-estudio (aumentado a PTE Overall 57, con mínimo 50 en cada sección).',
    scores: { Overall: 57, Listening: 50, Reading: 50, Speaking: 50, Writing: 50 },
  },
  {
    id: 'custom-visa',
    name: 'Otra Visa (Personalizada)',
    description: 'Elige esta opción para configurar otra visa ajustando los puntajes manualmente para cada skill.',
    scores: { Overall: 50, Listening: 50, Reading: 50, Speaking: 50, Writing: 50 },
  },
  {
    id: 'custom',
    name: 'Otro Motivo (Personal, Académico, Laboral)',
    description: 'Selecciona este motivo si no te estás preparando para una visa y quieres personalizar libremente los puntajes mínimos por skill.',
    scores: { Overall: null, Listening: 50, Reading: 50, Speaking: 50, Writing: 50 },
  }
];

export default function Configuracion({
  targets,
  questionTypes,
  onUpdateTargets,
  onUpdateQuestionTypes,
  onDeleteAllEntries,
  entries,
  questionDetails,
}: ConfiguracionProps) {
  // Skill targets local states
  const [listeningTarget, setListeningTarget] = useState(targets.Listening.toString());
  const [readingTarget, setReadingTarget] = useState(targets.Reading.toString());
  const [speakingTarget, setSpeakingTarget] = useState(targets.Speaking.toString());
  const [writingTarget, setWritingTarget] = useState(targets.Writing.toString());
  const [overallTarget, setOverallTarget] = useState(targets.Overall !== null ? targets.Overall.toString() : '');
  const [examDate, setExamDate] = useState(targets.examDate);
  const [prepStartDate, setPrepStartDate] = useState(targets.prepStartDate);
  const [goalType, setGoalType] = useState(targets.goalType || 'visa-482');
  const [goalName, setGoalName] = useState(targets.goalName || 'Visa 482 - Sponsor Australia');

  // Success indicator states
  const [showTargetsSaved, setShowTargetsSaved] = useState(false);
  const [showQuestionTypesSaved, setShowQuestionTypesSaved] = useState(false);

  // Question targets local states - mapped as code -> percentage input string
  const [localQuestionTargets, setLocalQuestionTargets] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    questionTypes.forEach(q => {
      map[q.code] = q.target !== null ? Math.round(q.target * 100).toString() : '';
    });
    return map;
  });

  // Handle saving skill targets
  const handleSaveSkillTargets = (e: React.FormEvent) => {
    e.preventDefault();
    const lVal = parseInt(listeningTarget, 10);
    const rVal = parseInt(readingTarget, 10);
    const sVal = parseInt(speakingTarget, 10);
    const wVal = parseInt(writingTarget, 10);
    const oVal = overallTarget.trim() !== '' ? parseInt(overallTarget, 10) : null;

    if (isNaN(lVal) || isNaN(rVal) || isNaN(sVal) || isNaN(wVal) ||
        (oVal !== null && isNaN(oVal))) {
      alert('Todos los puntajes PTE habilitados deben ser números válidos.');
      return;
    }

    if (!examDate || !prepStartDate) {
      alert('Por favor configura la fecha de examen y de inicio de preparación.');
      return;
    }

    onUpdateTargets({
      Overall: oVal,
      Listening: lVal,
      Reading: rVal,
      Speaking: sVal,
      Writing: wVal,
      examDate,
      prepStartDate,
      goalType,
      goalName,
    });

    setShowTargetsSaved(true);
    setTimeout(() => setShowTargetsSaved(false), 3000);
  };

  // Handle single question type target change
  const handleQuestionTargetChange = (code: string, value: string) => {
    setLocalQuestionTargets(prev => ({
      ...prev,
      [code]: value,
    }));
  };

  // Save question type targets
  const handleSaveQuestionTargets = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedTypes = questionTypes.map(q => {
      const rawVal = localQuestionTargets[q.code];
      const targetDecimal = rawVal.trim() !== '' ? parseFloat(rawVal) / 100 : null;
      
      if (targetDecimal !== null && (isNaN(targetDecimal) || targetDecimal < 0 || targetDecimal > 1)) {
        alert(`La meta para ${q.code} debe ser un porcentaje válido entre 0% y 100%.`);
        throw new Error('Validación fallida');
      }
      
      return {
        ...q,
        target: targetDecimal,
      };
    });

    onUpdateQuestionTypes(updatedTypes);
    setShowQuestionTypesSaved(true);
    setTimeout(() => setShowQuestionTypesSaved(false), 3000);
  };



  const handleDeleteAllClick = () => {
    if (confirm(`¿Estás seguro de eliminar los ${entries.length} registro(s) de score? Esta acción no se puede deshacer.`)) {
      onDeleteAllEntries();
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-serif font-light text-white tracking-wide">Configuración de Metas y Datos</h2>
        <p className="text-xs text-subtext font-light mt-1.5">Ajusta los puntajes mínimos de visa, tus objetivos específicos por tipo de pregunta, o gestiona respaldos.</p>
      </div>

      {/* Grid: Left column edit targets, Right column Backup and seeds */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* EDIT SKILL TARGETS */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Card 1: Skill Targets */}
          <div className="bg-card-dark p-6 rounded-sm border border-border-dark">
            <h3 className="text-lg font-serif font-light text-white mb-6 pb-3 border-b border-border-dark flex items-center justify-between">
              <span>Metas Principales (Escala PTE 10-90)</span>
              {showTargetsSaved && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-gold bg-gold/10 border border-gold/20 px-2.5 py-1 rounded-sm flex items-center gap-1 animate-fade-in">
                  <CheckCircle size={12} /> ¡Metas guardadas!
                </span>
              )}
            </h3>

            <form onSubmit={handleSaveSkillTargets} className="space-y-6">
              
              {/* Goal Selector Dropdown */}
              <div className="bg-[#0d0d0d] p-5 rounded-sm border border-border-dark space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold text-subtext uppercase tracking-widest mb-1.5">
                    Tipo de Meta / Objetivo de Preparación
                  </label>
                  <select
                    value={goalType}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      setGoalType(selectedId);
                      const preset = GOAL_PRESETS.find(p => p.id === selectedId);
                      if (preset) {
                        setGoalName(preset.name);
                        setListeningTarget(preset.scores.Listening.toString());
                        setReadingTarget(preset.scores.Reading.toString());
                        setSpeakingTarget(preset.scores.Speaking.toString());
                        setWritingTarget(preset.scores.Writing.toString());
                        setOverallTarget(preset.scores.Overall !== null ? preset.scores.Overall.toString() : '');
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-[#0f0f0f] border border-border-dark rounded-sm text-xs text-white focus:outline-hidden focus:border-gold transition-all"
                  >
                    {GOAL_PRESETS.map((preset) => (
                      <option key={preset.id} value={preset.id} className="bg-bg-dark">
                        {preset.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-subtext/70 mt-2 font-light leading-relaxed">
                    {GOAL_PRESETS.find(p => p.id === goalType)?.description}
                  </p>
                </div>

                {/* Customizable goal name input for Custom or Custom-Visa or Custom Non-Visa */}
                {(goalType === 'custom' || goalType === 'custom-visa') && (
                  <div className="animate-fade-in pt-2">
                    <label className="block text-[10px] font-semibold text-subtext uppercase tracking-widest mb-1.5">
                      Nombre Personalizado del Motivo u Objetivo
                    </label>
                    <input
                      type="text"
                      placeholder={goalType === 'custom' ? 'Ej. Ingreso a Maestría, Trabajo en Canadá, Reto Personal...' : 'Ej. Visa de Talento Distinguido'}
                      value={goalName}
                      onChange={(e) => setGoalName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#0f0f0f] border border-border-dark rounded-sm text-xs text-white focus:outline-hidden focus:border-gold transition-all"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-semibold text-subtext uppercase tracking-widest mb-1.5">Fecha del Examen</label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0f0f0f] border border-border-dark rounded-sm text-xs text-white focus:outline-hidden focus:border-gold transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-subtext uppercase tracking-widest mb-1.5">Inicio de Preparación</label>
                  <input
                    type="date"
                    value={prepStartDate}
                    onChange={(e) => setPrepStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0f0f0f] border border-border-dark rounded-sm text-xs text-white focus:outline-hidden focus:border-gold transition-all"
                  />
                </div>
              </div>

              {/* Grid of 5 scores */}
              <div className="bg-[#0d0d0d] p-5 rounded-sm border border-border-dark">
                <p className="text-[10px] font-bold text-subtext uppercase tracking-widest mb-4">Requisitos de puntaje mínimo:</p>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#E5E5E5] mb-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" /> Overall
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="90"
                      placeholder="N/A"
                      value={overallTarget}
                      onChange={(e) => setOverallTarget(e.target.value)}
                      className="w-full px-3 py-2 bg-card-dark border border-border-dark rounded-sm text-sm text-center text-white focus:outline-hidden font-serif"
                    />
                    <span className="text-[10px] text-subtext/60 block mt-1.5 text-center">Opcional</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#E5E5E5] mb-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: SKILL_COLORS.Listening }} /> Listening
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="90"
                      value={listeningTarget}
                      onChange={(e) => setListeningTarget(e.target.value)}
                      className="w-full px-3 py-2 bg-card-dark border border-border-dark rounded-sm text-sm text-center text-gold font-serif font-bold"
                    />
                    <span className="text-[10px] text-subtext/60 block mt-1.5 text-center">Sugerido: 33</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#E5E5E5] mb-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: SKILL_COLORS.Reading }} /> Reading
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="90"
                      value={readingTarget}
                      onChange={(e) => setReadingTarget(e.target.value)}
                      className="w-full px-3 py-2 bg-card-dark border border-border-dark rounded-sm text-sm text-center text-gold font-serif font-bold"
                    />
                    <span className="text-[10px] text-subtext/60 block mt-1.5 text-center">Sugerido: 36</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#E5E5E5] mb-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: SKILL_COLORS.Speaking }} /> Speaking
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="90"
                      value={speakingTarget}
                      onChange={(e) => setSpeakingTarget(e.target.value)}
                      className="w-full px-3 py-2 bg-card-dark border border-border-dark rounded-sm text-sm text-center text-gold font-serif font-bold"
                    />
                    <span className="text-[10px] text-subtext/60 block mt-1.5 text-center">Sugerido: 24</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#E5E5E5] mb-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: SKILL_COLORS.Writing }} /> Writing
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="90"
                      value={writingTarget}
                      onChange={(e) => setWritingTarget(e.target.value)}
                      className="w-full px-3 py-2 bg-card-dark border border-border-dark rounded-sm text-sm text-center text-gold font-serif font-bold"
                    />
                    <span className="text-[10px] text-subtext/60 block mt-1.5 text-center">Sugerido: 29</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-gold hover:bg-gold-light text-[#050505] px-5 py-2.5 rounded-sm text-xs uppercase tracking-wider font-bold flex items-center gap-2 shadow-xs transition-colors duration-300 cursor-pointer"
                >
                  <Save size={16} /> Guardar Fechas y Metas
                </button>
              </div>
            </form>
          </div>

          {/* Card 2: Question types (15 APEUni categories) targets editing */}
          <div className="bg-card-dark p-6 rounded-sm border border-border-dark">
            <h3 className="text-lg font-serif font-light text-white mb-3 pb-3 border-b border-border-dark flex items-center justify-between">
              <span>Metas Finas por Tipo de Pregunta (%)</span>
              {showQuestionTypesSaved && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-gold bg-gold/10 border border-gold/20 px-2.5 py-1 rounded-sm flex items-center gap-1 animate-fade-in">
                  <CheckCircle size={12} /> ¡Metas finas actualizadas!
                </span>
              )}
            </h3>
            <p className="text-xs text-subtext font-light mb-6 leading-relaxed">
              Establece las metas recomendadas o personales de tasa de aciertos (Correctness) para cada uno de los 15 tipos de pregunta principales de APEUni. Se guardan como porcentajes de 0% a 100%. Dejar en blanco si no deseas meta fija aún.
            </p>

            <form onSubmit={handleSaveQuestionTargets} className="space-y-6">
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {(['Speaking', 'Writing', 'Reading', 'Listening'] as const).map(sk => {
                  const items = questionTypes.filter(q => q.skill === sk);
                  const color = SKILL_COLORS[sk];
                  
                  return (
                    <div key={sk} className="space-y-3 bg-[#0d0d0d] p-4 rounded-sm border border-border-dark">
                      <h4 className="text-xs font-semibold font-serif text-[#E5E5E5] flex items-center gap-2 pb-2 border-b border-border-dark">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                        Sección {sk}
                      </h4>
                      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                        {items.map(item => (
                          <div key={item.code} className="flex items-center justify-between gap-3 bg-card-dark p-2 rounded-sm border border-[#1d1d1d] text-xs">
                            <div className="flex items-center gap-2 truncate">
                              <span className="font-mono font-semibold bg-[#111] border border-border-dark px-2 py-0.5 rounded-sm text-[11px] text-gold">{item.code}</span>
                              <span className="text-[#E5E5E5] font-light truncate" title={item.name}>{item.name}</span>
                            </div>
                            
                            <div className="flex items-center gap-1.5 shrink-0 w-20 relative">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="--"
                                value={localQuestionTargets[item.code]}
                                onChange={(e) => handleQuestionTargetChange(item.code, e.target.value)}
                                className="w-full pl-2 pr-5 py-1.5 bg-[#0f0f0f] border border-border-dark rounded-sm text-right font-semibold text-white focus:outline-hidden"
                              />
                              <span className="absolute right-2 text-[10px] font-bold text-subtext/60">%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-gold hover:bg-gold-light text-[#050505] px-5 py-2.5 rounded-sm text-xs uppercase tracking-wider font-bold flex items-center gap-2 shadow-xs transition-colors duration-300 cursor-pointer"
                >
                  <Save size={16} /> Guardar Metas de Items
                </button>
              </div>

            </form>
          </div>

        </div>

        {/* BACKUPS & RESET SEEDS COLUMN */}
        <div className="space-y-6">

          {/* Delete all score entries */}
          <div className="bg-card-dark p-6 rounded-sm border border-border-dark space-y-4">
            <h3 className="font-serif font-light text-white text-md tracking-wide flex items-center gap-2">
              <Trash2 className="text-rose-400" size={18} />
              Borrar Registros
            </h3>
            <p className="text-xs text-subtext font-light leading-relaxed">
              ¿Quieres eliminar permanentemente todos los registros de score guardados? Esta acción no se puede deshacer.
            </p>

            <button
              onClick={handleDeleteAllClick}
              disabled={entries.length === 0}
              className="w-full bg-rose-500/5 hover:bg-rose-500/10 disabled:opacity-40 disabled:cursor-not-allowed text-rose-400 py-2.5 px-4 rounded-sm text-xs font-bold uppercase tracking-wider transition-all duration-300 border border-rose-500/20 hover:border-rose-500/40 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Trash2 size={14} /> Borrar Todos los Registros
            </button>
          </div>

          {/* PTE vs IELTS Equivalence Card */}
          <div className="bg-card-dark p-6 rounded-sm border border-border-dark space-y-4 animate-fade-in">
            <h3 className="font-serif font-light text-white text-md tracking-wide flex items-center gap-2">
              <GraduationCap className="text-gold" size={18} />
              Equivalencias PTE vs. IELTS
            </h3>
            <p className="text-xs text-subtext font-light leading-relaxed">
              Equivalencias oficiales vigentes entre los puntajes de Pearson PTE Academic y las bandas de IELTS Academic para procesos de visado y estudios.
            </p>
            
            <div className="border border-border-dark rounded-sm overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#080808] text-[10px] text-subtext font-bold uppercase tracking-wider border-b border-border-dark">
                    <th className="py-2 px-3">Banda IELTS</th>
                    <th className="py-2 px-3 text-right">Puntaje PTE</th>
                    <th className="py-2 px-3 text-center">Nivel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dark bg-[#0a0a0a]">
                  <tr className="hover:bg-bg-dark/40">
                    <td className="py-2 px-3 font-semibold text-white">8.5 - 9.0</td>
                    <td className="py-2 px-3 text-right font-mono text-gold">83 - 90</td>
                    <td className="py-2 px-3 text-center text-subtext font-light">Experto</td>
                  </tr>
                  <tr className="hover:bg-bg-dark/40">
                    <td className="py-2 px-3 font-semibold text-white">8.0</td>
                    <td className="py-2 px-3 text-right font-mono text-gold">79 - 82</td>
                    <td className="py-2 px-3 text-center text-gold font-light">Superior</td>
                  </tr>
                  <tr className="hover:bg-bg-dark/40">
                    <td className="py-2 px-3 font-semibold text-white">7.5</td>
                    <td className="py-2 px-3 text-right font-mono text-gold">73 - 78</td>
                    <td className="py-2 px-3 text-center text-subtext font-light">Avanzado</td>
                  </tr>
                  <tr className="hover:bg-bg-dark/40">
                    <td className="py-2 px-3 font-semibold text-white">7.0</td>
                    <td className="py-2 px-3 text-right font-mono text-gold">65 - 72</td>
                    <td className="py-2 px-3 text-center text-gold font-light">Proficiente</td>
                  </tr>
                  <tr className="hover:bg-bg-dark/40">
                    <td className="py-2 px-3 font-semibold text-white">6.5</td>
                    <td className="py-2 px-3 text-right font-mono text-gold">58 - 64</td>
                    <td className="py-2 px-3 text-center text-subtext font-light">Intermedio-Alto</td>
                  </tr>
                  <tr className="hover:bg-bg-dark/40">
                    <td className="py-2 px-3 font-semibold text-white">6.0</td>
                    <td className="py-2 px-3 text-right font-mono text-gold">50 - 57</td>
                    <td className="py-2 px-3 text-center text-gold font-light">Competente</td>
                  </tr>
                  <tr className="hover:bg-bg-dark/40">
                    <td className="py-2 px-3 font-semibold text-white">5.5</td>
                    <td className="py-2 px-3 text-right font-mono text-gold">42 - 49</td>
                    <td className="py-2 px-3 text-center text-subtext font-light">Vocacional</td>
                  </tr>
                  <tr className="hover:bg-bg-dark/40">
                    <td className="py-2 px-3 font-semibold text-white">5.0</td>
                    <td className="py-2 px-3 text-right font-mono text-gold">36 - 41</td>
                    <td className="py-2 px-3 text-center text-subtext font-light">TSS 482 Mín.</td>
                  </tr>
                  <tr className="hover:bg-bg-dark/40">
                    <td className="py-2 px-3 font-semibold text-white">4.5</td>
                    <td className="py-2 px-3 text-right font-mono text-gold">30 - 35</td>
                    <td className="py-2 px-3 text-center text-subtext/50 font-light">Limitado</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <p className="text-[10px] text-subtext/60 italic leading-relaxed">
              * Nota: Los requisitos migratorios se basan en el puntaje de cada skill individual. El Overall es referencial para estudios.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
