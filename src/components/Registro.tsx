import React, { useState, useMemo } from 'react';
import { PTEEntry, SkillTargets, QuestionType } from '../types';
import { Plus, Trash2, SlidersHorizontal, BookOpen, AlertCircle, Sparkles } from 'lucide-react';
import { formatLocalPlainDate } from './Dashboard';

interface RegistroProps {
  entries: PTEEntry[];
  targets: SkillTargets;
  questionTypes: QuestionType[];
  onAddEntry: (entry: Omit<PTEEntry, 'id'>) => void;
  onAddMultipleEntries: (entries: Array<Omit<PTEEntry, 'id'>>) => void;
  onDeleteEntry: (id: string) => void;
  onDeleteAllEntries: () => void;
}

const SKILL_COLORS: Record<string, string> = {
  Listening: '#5B92E5', // elegante azul
  Reading: '#A8C353',   // elegante verde oliva/lima suave
  Speaking: '#A3A3A3',  // elegante plata/gris
  Writing: '#D65A9C',   // elegante oro rosa/magenta
  Overall: '#C5A059',   // oro
};

export default function Registro({
  entries,
  targets,
  questionTypes,
  onAddEntry,
  onAddMultipleEntries,
  onDeleteEntry,
  onDeleteAllEntries,
}: RegistroProps) {
  // Form single entry state
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [tipo, setTipo] = useState<'Full Test' | 'Section Test' | 'Question Test'>('Full Test');
  const [skill, setSkill] = useState<'Overall' | 'Listening' | 'Reading' | 'Speaking' | 'Writing'>('Overall');
  const [detalle, setDetalle] = useState('');
  const [puntaje, setPuntaje] = useState<number | ''>('');
  const [notas, setNotas] = useState('');

  // Full Test (5-scores-in-one-go) state
  const [fullOverall, setFullOverall] = useState<number | ''>('');
  const [fullListening, setFullListening] = useState<number | ''>('');
  const [fullReading, setFullReading] = useState<number | ''>('');
  const [fullSpeaking, setFullSpeaking] = useState<number | ''>('');
  const [fullWriting, setFullWriting] = useState<number | ''>('');

  // Filters state
  const [filterSkill, setFilterSkill] = useState<string>('all');
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Sidebar reference table collapsed state
  const [showRefTable, setShowRefTable] = useState(false);

  // Suggestions for 'detalle' based on existing entries
  const suggestions = useMemo(() => {
    const set = new Set(entries.map(e => e.detalle).filter(Boolean));
    return Array.from(set).slice(0, 5);
  }, [entries]);

  // Handle Quick Add Single Entry
  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fecha || !detalle) {
      alert('Por favor, ingresa la fecha y el detalle del test.');
      return;
    }
    const parsedPuntaje = Number(puntaje);
    if (isNaN(parsedPuntaje) || parsedPuntaje < 10 || parsedPuntaje > 90) {
      alert('El puntaje PTE debe estar entre 10 y 90.');
      return;
    }

    onAddEntry({
      fecha,
      tipo,
      skill,
      detalle,
      puntaje: parsedPuntaje,
      notas: notas.trim() || undefined,
    });

    // Reset some fields
    setPuntaje('');
    setNotas('');
  };

  // Handle Quick Add Full Test (5 entries)
  const handleFullTestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fecha || !detalle) {
      alert('Por favor, ingresa la fecha y el detalle del simulacro completo.');
      return;
    }

    const scores = {
      Overall: fullOverall,
      Listening: fullListening,
      Reading: fullReading,
      Speaking: fullSpeaking,
      Writing: fullWriting,
    };

    // Check if at least Overall score or any score is loaded, but ideally overall and skills
    const missingAny = Object.values(scores).some(v => v === '');
    if (missingAny) {
      alert('Por favor, completa los 5 puntajes del simulacro completo (deben estar entre 10 y 90).');
      return;
    }

    // Validate scores range
    for (const [sName, sVal] of Object.entries(scores)) {
      const num = Number(sVal);
      if (isNaN(num) || num < 10 || num > 90) {
        alert(`El puntaje de ${sName} debe estar entre 10 y 90.`);
        return;
      }
    }

    const newEntries: Array<Omit<PTEEntry, 'id'>> = [
      { fecha, tipo: 'Full Test', skill: 'Overall', detalle, puntaje: Number(fullOverall), notas: (notas ? `${notas} (Full Test)` : 'Simulacro Completo') },
      { fecha, tipo: 'Full Test', skill: 'Listening', detalle, puntaje: Number(fullListening), notas: notas || undefined },
      { fecha, tipo: 'Full Test', skill: 'Reading', detalle, puntaje: Number(fullReading), notas: notas || undefined },
      { fecha, tipo: 'Full Test', skill: 'Speaking', detalle, puntaje: Number(fullSpeaking), notas: notas || undefined },
      { fecha, tipo: 'Full Test', skill: 'Writing', detalle, puntaje: Number(fullWriting), notas: notas || undefined },
    ];

    onAddMultipleEntries(newEntries);

    // Reset scores fields
    setFullOverall('');
    setFullListening('');
    setFullReading('');
    setFullSpeaking('');
    setFullWriting('');
    setNotas('');
  };

  // Filter and search entries
  const filteredEntries = useMemo(() => {
    return entries
      .filter(e => {
        const matchesSkill = filterSkill === 'all' || e.skill === filterSkill;
        const matchesTipo = filterTipo === 'all' || e.tipo === filterTipo;
        const matchesSearch = e.detalle.toLowerCase().includes(searchTerm.toLowerCase()) || 
          (e.notas && e.notas.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesSkill && matchesTipo && matchesSearch;
      })
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime() || b.id.localeCompare(a.id));
  }, [entries, filterSkill, filterTipo, searchTerm]);

  return (
    <div className="space-y-8">
      
      {/* Header and Controls Row */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-light font-serif text-white tracking-wide">Registro de Diagnósticos</h2>
          <p className="text-xs text-subtext font-light mt-1">Agrega simulacros completos, de sección o preguntas específicas para medir tu progreso.</p>
        </div>
        
        {/* Toggle reference codes */}
        <button
          onClick={() => setShowRefTable(!showRefTable)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-gold bg-card-dark hover:bg-border-dark border border-border-dark rounded-sm transition-all self-start md:self-auto cursor-pointer"
        >
          <BookOpen size={14} />
          {showRefTable ? 'Ocultar Catálogo APEUni' : 'Ver Catálogo APEUni'}
        </button>
      </div>

      {/* APEUni Reference Catalog collapsible widget */}
      {showRefTable && (
        <div className="bg-[#0d0d0d] p-6 rounded-sm border border-border-dark grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          <div className="lg:col-span-3 mb-1">
            <h4 className="font-serif font-light text-white text-md tracking-wide flex items-center gap-2">
              <Sparkles className="text-gold" size={16} />
              Códigos de Pregunta APEUni (Consulta Rápida)
            </h4>
            <p className="text-xs text-subtext mt-1 font-light">Usa estos códigos en tus detalles para facilitar el seguimiento fino de tus habilidades.</p>
          </div>
          {(['Speaking', 'Writing', 'Reading', 'Listening'] as const).map(sk => {
            const items = questionTypes.filter(q => q.skill === sk);
            return (
              <div key={sk} className="bg-card-dark p-4 rounded-sm border border-border-dark">
                <span className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-sm border" style={{ backgroundColor: `${SKILL_COLORS[sk]}15`, color: SKILL_COLORS[sk], borderColor: `${SKILL_COLORS[sk]}30` }}>
                  {sk}
                </span>
                <div className="mt-4 space-y-2 max-h-40 overflow-y-auto no-scrollbar">
                  {items.map(item => (
                    <div key={item.code} className="flex justify-between items-center text-xs text-subtext hover:bg-bg-dark/60 p-1 rounded-sm">
                      <span className="font-mono font-medium bg-[#111] border border-border-dark px-1.5 py-0.5 rounded-sm text-gold">{item.code}</span>
                      <span className="truncate max-w-[150px] font-light" title={item.name}>{item.name}</span>
                      {item.target !== null && (
                        <span className="text-gold font-medium">{Math.round(item.target * 100)}%</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Add Form Box */}
      <div className="bg-card-dark p-6 rounded-sm border border-border-dark">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border-dark">
          <h3 className="font-serif font-light text-white text-md tracking-wide flex items-center gap-2">
            <Plus className="text-gold" size={18} />
            Cargar Nuevo Diagnóstico / Test
          </h3>
          <div className="flex bg-bg-dark border border-border-dark p-1 rounded-sm gap-1 self-start sm:self-auto">
            <button
              onClick={() => { setTipo('Full Test'); setSkill('Overall'); }}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-all cursor-pointer ${tipo === 'Full Test' ? 'bg-gold text-bg-dark shadow-md shadow-gold/5' : 'text-subtext hover:text-white'}`}
            >
              Simulacro Completo
            </button>
            <button
              onClick={() => { setTipo('Section Test'); }}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-all cursor-pointer ${tipo !== 'Full Test' ? 'bg-gold text-bg-dark shadow-md shadow-gold/5' : 'text-subtext hover:text-white'}`}
            >
              Individual (Sección/Pregunta)
            </button>
          </div>
        </div>

        {/* 1. MOCK COMPLETO FORM (5-inputs-in-one-row shortcut) */}
        {tipo === 'Full Test' ? (
          <form onSubmit={handleFullTestSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-subtext mb-1.5">Fecha</label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full px-3 py-2 bg-[#090909] text-white border border-border-dark rounded-sm text-sm focus:outline-hidden focus:border-gold"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] uppercase tracking-wider font-bold text-subtext mb-1.5">Nombre / Detalle del Simulacro</label>
                <input
                  type="text"
                  placeholder="Ej: Mock Test 46C - VIP Full Test de APEUni"
                  value={detalle}
                  onChange={(e) => setDetalle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#090909] text-white border border-border-dark rounded-sm text-sm focus:outline-hidden focus:border-gold placeholder-[#444]"
                  list="details-suggestions"
                />
                <datalist id="details-suggestions">
                  {suggestions.map(s => <option key={s} value={s} />)}
                </datalist>
              </div>
            </div>

            {/* Row of 5 PTE scores */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-bold text-gold mb-3">
                Puntajes de las Secciones (Escala PTE 10 a 90)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 bg-[#0d0d0d] p-4 rounded-sm border border-border-dark">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[11px] font-bold text-subtext mb-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold" /> Overall
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="90"
                    placeholder="10-90"
                    value={fullOverall}
                    onChange={(e) => setFullOverall(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-bg-dark border border-border-dark text-white rounded-sm text-sm focus:outline-hidden text-center font-bold font-serif"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-subtext mb-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5B92E5]" /> Listening
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="90"
                    placeholder={`Meta ${targets.Listening}`}
                    value={fullListening}
                    onChange={(e) => setFullListening(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-bg-dark border border-border-dark text-white rounded-sm text-sm focus:outline-hidden text-center font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-subtext mb-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A8C353]" /> Reading
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="90"
                    placeholder={`Meta ${targets.Reading}`}
                    value={fullReading}
                    onChange={(e) => setFullReading(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-bg-dark border border-border-dark text-white rounded-sm text-sm focus:outline-hidden text-center font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-subtext mb-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A3A3A3]" /> Speaking
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="90"
                    placeholder={`Meta ${targets.Speaking}`}
                    value={fullSpeaking}
                    onChange={(e) => setFullSpeaking(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-bg-dark border border-border-dark text-white rounded-sm text-sm focus:outline-hidden text-center font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-subtext mb-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D65A9C]" /> Writing
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="90"
                    placeholder={`Meta ${targets.Writing}`}
                    value={fullWriting}
                    onChange={(e) => setFullWriting(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-bg-dark border border-border-dark text-white rounded-sm text-sm focus:outline-hidden text-center font-semibold"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-end">
              <div className="lg:col-span-3">
                <label className="block text-[10px] uppercase tracking-wider font-bold text-subtext mb-1.5">Notas u Observaciones (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: Me costó el ruido de fondo en Speaking."
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="w-full px-3 py-2 bg-[#090909] text-white border border-border-dark rounded-sm text-sm focus:outline-hidden focus:border-gold placeholder-[#444]"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gold hover:bg-gold-hover text-bg-dark py-2 px-4 rounded-sm text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-gold/5 cursor-pointer"
              >
                <Plus size={15} /> Guardar 5 Puntajes
              </button>
            </div>
          </form>
        ) : (
          /* 2. SINGLE DIAGNOSTIC ENTRY FORM */
          <form onSubmit={handleSingleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-subtext mb-1.5">Fecha</label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full px-3 py-2 bg-[#090909] text-white border border-border-dark rounded-sm text-sm focus:outline-hidden focus:border-gold"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-subtext mb-1.5">Tipo de Registro</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#090909] text-white border border-border-dark rounded-sm text-sm focus:outline-hidden focus:border-gold cursor-pointer"
                >
                  <option value="Section Test">Section Test (Sección)</option>
                  <option value="Question Test">Question Test (Práctica Tipo)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-subtext mb-1.5">Skill / Habilidad</label>
                <select
                  value={skill}
                  onChange={(e) => setSkill(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#090909] text-white border border-border-dark rounded-sm text-sm focus:outline-hidden focus:border-gold cursor-pointer"
                >
                  <option value="Overall">Overall (Promedio)</option>
                  <option value="Listening">Listening</option>
                  <option value="Reading">Reading</option>
                  <option value="Speaking">Speaking</option>
                  <option value="Writing">Writing</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-subtext mb-1.5">Puntaje PTE (10-90)</label>
                <input
                  type="number"
                  min="10"
                  max="90"
                  placeholder="Ej: 35"
                  value={puntaje}
                  onChange={(e) => setPuntaje(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#090909] text-white border border-border-dark rounded-sm text-sm focus:outline-hidden focus:border-gold placeholder-[#444]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-end">
              <div className="lg:col-span-2">
                <label className="block text-[10px] uppercase tracking-wider font-bold text-subtext mb-1.5">Detalle / Nombre del Test / Código de Pregunta</label>
                <input
                  type="text"
                  placeholder="Ej: DI Practice, Section Test 44C, etc."
                  value={detalle}
                  onChange={(e) => setDetalle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#090909] text-white border border-border-dark rounded-sm text-sm focus:outline-hidden focus:border-gold placeholder-[#444]"
                  list="details-suggestions"
                />
              </div>
              <div className="lg:col-span-1">
                <label className="block text-[10px] uppercase tracking-wider font-bold text-subtext mb-1.5">Notas (Opcional)</label>
                <input
                  type="text"
                  placeholder="Comentarios..."
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="w-full px-3 py-2 bg-[#090909] text-white border border-border-dark rounded-sm text-sm focus:outline-hidden focus:border-gold placeholder-[#444]"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gold hover:bg-gold-hover text-bg-dark py-2 px-4 rounded-sm text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-gold/5 cursor-pointer"
              >
                <Plus size={15} /> Guardar Registro
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Historical Table and Filter Box */}
      <div className="bg-card-dark rounded-sm border border-border-dark overflow-hidden">
        <div className="p-5 border-b border-border-dark bg-[#080808] flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="text-gold" size={16} />
            <h3 className="font-serif font-light text-white text-md tracking-wide">Historial Registrado ({filteredEntries.length})</h3>
          </div>

          {/* Filters controls */}
          <div className="flex flex-wrap items-center gap-3">
            {entries.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`¿Estás seguro de eliminar los ${entries.length} registro(s)? Esta acción no se puede deshacer.`)) {
                    onDeleteAllEntries();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:border-rose-500/40 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer"
              >
                <Trash2 size={13} /> Borrar Todos
              </button>
            )}
            <div>
              <input
                type="text"
                placeholder="Buscar por detalle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1.5 bg-[#090909] text-white border border-border-dark rounded-sm text-xs w-44 focus:outline-hidden focus:border-gold placeholder-[#444]"
              />
            </div>
            <div>
              <select
                value={filterSkill}
                onChange={(e) => setFilterSkill(e.target.value)}
                className="px-2.5 py-1.5 bg-[#090909] text-white border border-border-dark rounded-sm text-xs focus:outline-hidden focus:border-gold cursor-pointer"
              >
                <option value="all">Todas las Skills</option>
                <option value="Overall">Overall</option>
                <option value="Listening">Listening</option>
                <option value="Reading">Reading</option>
                <option value="Speaking">Speaking</option>
                <option value="Writing">Writing</option>
              </select>
            </div>
            <div>
              <select
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                className="px-2.5 py-1.5 bg-[#090909] text-white border border-border-dark rounded-sm text-xs focus:outline-hidden focus:border-gold cursor-pointer"
              >
                <option value="all">Todos los Tipos</option>
                <option value="Full Test">Full Test</option>
                <option value="Section Test">Section Test</option>
                <option value="Question Test">Question Test</option>
              </select>
            </div>
          </div>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="p-12 text-center text-subtext bg-[#0d0d0d]">
            <AlertCircle className="mx-auto mb-2 text-[#444]" size={32} />
            <p className="font-medium text-sm">No se encontraron registros</p>
            <p className="text-xs text-[#555] mt-1">Prueba cambiando los filtros o cargando un nuevo diagnóstico arriba.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-dark bg-[#080808] text-[10px] font-bold text-subtext uppercase tracking-wider">
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Habilidad</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Nombre / Detalle del simulacro</th>
                  <th className="py-3 px-4 text-center">Puntaje</th>
                  <th className="py-3 px-4 text-center">Meta 482</th>
                  <th className="py-3 px-4 text-center">Dif.</th>
                  <th className="py-3 px-4">Notas</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark text-sm">
                {filteredEntries.map(e => {
                  const target = e.skill === 'Overall' ? null : targets[e.skill];
                  const diff = target !== null ? e.puntaje - target : null;
                  const color = SKILL_COLORS[e.skill] || '#C5A059';

                  return (
                    <tr key={e.id} className="hover:bg-bg-dark/40 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-subtext">
                        {formatLocalPlainDate(e.fecha)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span 
                          className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-sm border inline-block text-center shadow-xs min-w-[75px]"
                          style={{ backgroundColor: `${color}15`, color: color, borderColor: `${color}30` }}
                        >
                          {e.skill}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-subtext font-light">
                        {e.tipo}
                      </td>
                      <td className="py-3.5 px-4 font-serif font-light text-[#E5E5E5] text-md">
                        {e.detalle}
                      </td>
                      <td className="py-3.5 px-4 text-center font-serif font-light text-white text-base">
                        {e.puntaje}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {target !== null ? (
                          <span className="text-xs bg-[#111] border border-border-dark px-1.5 py-0.5 rounded-sm text-subtext">
                            {target}
                          </span>
                        ) : (
                          <span className="text-xs text-[#555] italic">N/A</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {diff !== null && target !== null ? (
                          (() => {
                            return (
                              <span className={`text-xs font-bold ${
                                diff > 0 ? 'text-emerald-400' :
                                diff === 0 ? 'text-amber-400' :
                                'text-rose-500'
                              }`}>
                                {diff >= 0 ? `+${diff}` : diff}
                              </span>
                            );
                          })()
                        ) : diff !== null ? (
                          <span className="text-xs font-bold text-subtext">
                            {diff >= 0 ? `+${diff}` : diff}
                          </span>
                        ) : (
                          <span className="text-[#333]">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-subtext max-w-xs truncate font-light" title={e.notas}>
                        {e.notas || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            if (confirm('¿Estás seguro de que deseas eliminar este registro?')) {
                              onDeleteEntry(e.id);
                            }
                          }}
                          className="p-1.5 text-[#555] hover:text-rose-500 rounded-sm hover:bg-rose-950/20 transition-all cursor-pointer"
                          title="Eliminar registro"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
