import React, { useState, useMemo, useEffect } from 'react';
import { QuestionDetail, QuestionType } from '../types';
import { Plus, Trash2, Filter, AlertCircle, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { formatLocalPlainDate } from './Dashboard';

interface DetallePreguntasProps {
  questionDetails: QuestionDetail[];
  questionTypes: QuestionType[];
  onAddDetail: (detail: Omit<QuestionDetail, 'id'>) => void;
  onDeleteDetail: (id: string) => void;
}

const SKILL_COLORS: Record<string, string> = {
  Listening: '#5B92E5', // elegante azul
  Reading: '#A8C353',   // elegante verde oliva/lima suave
  Speaking: '#A3A3A3',  // elegante plata/gris
  Writing: '#D65A9C',   // elegante oro rosa/magenta
};

export default function DetallePreguntas({
  questionDetails,
  questionTypes,
  onAddDetail,
  onDeleteDetail,
}: DetallePreguntasProps) {
  // Form states
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedSkill, setSelectedSkill] = useState<'Listening' | 'Reading' | 'Speaking' | 'Writing'>('Speaking');
  const [selectedItem, setSelectedItem] = useState('');
  const [contributeInput, setContributeInput] = useState<string>('');
  const [correctnessInput, setCorrectnessInput] = useState<string>('');
  const [notas, setNotas] = useState('');

  // Collapsible explanation items state
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    contribution: false,
    correctness: false,
    target: false,
  });

  const toggleItem = (key: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Filters state
  const [filterSkill, setFilterSkill] = useState<string>('all');
  const [filterItem, setFilterItem] = useState<string>('all');

  // Filtered question types based on chosen skill in FORM
  const formFilteredItems = useMemo(() => {
    return questionTypes.filter(q => q.skill === selectedSkill);
  }, [questionTypes, selectedSkill]);

  // Set default item when skill changes
  useEffect(() => {
    if (formFilteredItems.length > 0) {
      setSelectedItem(formFilteredItems[0].code);
      
      // Auto-populate default weights/contributions if there are past details for this item
      const pastDetails = questionDetails.filter(d => d.item === formFilteredItems[0].code);
      if (pastDetails.length > 0) {
        setContributeInput((pastDetails[0].contribute * 100).toFixed(1));
      } else {
        setContributeInput('');
      }
    } else {
      setSelectedItem('');
      setContributeInput('');
    }
  }, [selectedSkill, formFilteredItems, questionDetails]);

  // When selectedItem changes, try to auto-fill Contribute % from previous entries
  const handleItemChange = (itemCode: string) => {
    setSelectedItem(itemCode);
    const pastDetails = questionDetails.filter(d => d.item === itemCode);
    if (pastDetails.length > 0) {
      setContributeInput((pastDetails[0].contribute * 100).toFixed(1));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fecha || !selectedItem) {
      alert('Por favor selecciona la fecha y el tipo de ítem.');
      return;
    }

    const contr = parseFloat(contributeInput);
    const corr = parseFloat(correctnessInput);

    if (isNaN(contr) || contr < 0 || contr > 100) {
      alert('La contribución (peso) debe ser un porcentaje válido entre 0% y 100%.');
      return;
    }

    if (isNaN(corr) || corr < 0 || corr > 100) {
      alert('La correctness (logro) debe ser un porcentaje válido entre 0% y 100%.');
      return;
    }

    onAddDetail({
      fecha,
      skill: selectedSkill,
      item: selectedItem,
      contribute: contr / 100, // store as decimal fraction (0.31)
      correctness: corr / 100, // store as decimal fraction (0.182)
      notas: notas.trim() || undefined,
    });

    // Reset inputs
    setCorrectnessInput('');
    setNotas('');
  };

  // Filter items in the filters bar
  const filterFilteredItems = useMemo(() => {
    if (filterSkill === 'all') {
      return questionTypes;
    }
    return questionTypes.filter(q => q.skill === filterSkill);
  }, [questionTypes, filterSkill]);

  // Filtered and sorted historical details list
  const filteredDetails = useMemo(() => {
    return questionDetails
      .filter(d => {
        const matchesSkill = filterSkill === 'all' || d.skill === filterSkill;
        const matchesItem = filterItem === 'all' || d.item === filterItem;
        return matchesSkill && matchesItem;
      })
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime() || b.id.localeCompare(a.id));
  }, [questionDetails, filterSkill, filterItem]);

  return (
    <div className="space-y-8">
      {/* Intro */}
      <div>
        <h2 className="text-2xl font-light font-serif text-white tracking-wide">Análisis Detallado por Pregunta (Score Analysis)</h2>
        <p className="text-xs text-subtext font-light mt-1">
          Registra el detalle de ítems de tu reporte de resultados de APEUni para medir tu logro fino respecto a las metas específicas de cada tipo de pregunta.
        </p>
      </div>

      {/* Main Layout: Left Form, Right catalog/instructions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form panel */}
        <div className="lg:col-span-2 bg-card-dark p-6 rounded-sm border border-border-dark">
          <h3 className="font-serif font-light text-white text-md tracking-wide flex items-center gap-2 mb-6 pb-4 border-b border-border-dark">
            <Plus className="text-gold" size={18} />
            Cargar Ítem de Score Analysis
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                <label className="block text-[10px] uppercase tracking-wider font-bold text-subtext mb-1.5">Sección (Skill)</label>
                <select
                  value={selectedSkill}
                  onChange={(e) => setSelectedSkill(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#090909] text-white border border-border-dark rounded-sm text-sm focus:outline-hidden focus:border-gold cursor-pointer"
                >
                  <option value="Speaking">Speaking</option>
                  <option value="Listening">Listening</option>
                  <option value="Reading">Reading</option>
                  <option value="Writing">Writing</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-subtext mb-1.5">Tipo de Pregunta (Ítem)</label>
                <select
                  value={selectedItem}
                  onChange={(e) => handleItemChange(e.target.value)}
                  className="w-full px-3 py-2 bg-[#090909] text-white border border-border-dark rounded-sm text-sm focus:outline-hidden focus:border-gold cursor-pointer"
                >
                  {formFilteredItems.map(item => (
                    <option key={item.code} value={item.code}>
                      {item.code} - {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-subtext mb-1.5">Contribución %</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="Ej: 31"
                      value={contributeInput}
                      onChange={(e) => setContributeInput(e.target.value)}
                      className="w-full pl-3 pr-8 py-2 bg-[#090909] text-white border border-border-dark rounded-sm text-sm focus:outline-hidden focus:border-gold font-semibold"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gold font-bold">%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-gold mb-1.5">Mi Correctness %</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="Ej: 18.2"
                      value={correctnessInput}
                      onChange={(e) => setCorrectnessInput(e.target.value)}
                      className="w-full pl-3 pr-8 py-2 bg-[#12120d] border border-gold/30 focus:border-gold rounded-sm text-sm focus:outline-hidden font-bold text-gold"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gold font-bold">%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-end">
              <div className="lg:col-span-3">
                <label className="block text-[10px] uppercase tracking-wider font-bold text-subtext mb-1.5">Notas (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: Necesito entonación más fluida."
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="w-full px-3 py-2 bg-[#090909] text-white border border-border-dark rounded-sm text-sm focus:outline-hidden focus:border-gold placeholder-[#444]"
                />
              </div>
              
              <button
                type="submit"
                className="w-full bg-gold hover:bg-gold-hover text-bg-dark py-2 px-4 rounded-sm text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md shadow-gold/5 cursor-pointer"
              >
                <Plus size={15} /> Guardar Ítem
              </button>
            </div>
          </form>
        </div>

        {/* Informative Help Card */}
        <div className="bg-[#0d0d0d] p-6 rounded-sm border border-border-dark flex flex-col justify-between">
          <div>
            <h4 className="font-serif font-light text-white flex items-center gap-2 mb-3 text-md tracking-wide">
              <Sparkles className="text-gold" size={16} />
              Guía del Score Analysis
            </h4>
            <p className="text-xs text-subtext leading-relaxed font-light mb-4">
              En plataformas de práctica como <strong>APEUni</strong>, tras rendir un simulacro se te entrega un desglose detallado. Haz clic en cada concepto para ver su explicación:
            </p>

            {/* Collapsible List */}
            <div className="space-y-2 mt-4">
              {/* Item 1 */}
              <div className="border border-border-dark rounded-sm overflow-hidden bg-[#050505]">
                <button
                  type="button"
                  onClick={() => toggleItem('contribution')}
                  className="w-full flex items-center justify-between p-3 text-left text-xs font-semibold text-white hover:bg-bg-dark transition-colors cursor-pointer"
                >
                  <span>Contribution % (Contribución)</span>
                  {expandedItems.contribution ? <ChevronUp size={14} className="text-gold" /> : <ChevronDown size={14} className="text-[#555]" />}
                </button>
                {expandedItems.contribution && (
                  <div className="p-3 pt-1 border-t border-border-dark text-xs text-subtext font-light leading-relaxed">
                    Representa el peso o impacto proporcional que tiene este tipo de pregunta dentro de la puntuación total de su sección. Te indica qué tan crítico es dominar este ítem para subir tu nota general.
                  </div>
                )}
              </div>

              {/* Item 2 */}
              <div className="border border-border-dark rounded-sm overflow-hidden bg-[#050505]">
                <button
                  type="button"
                  onClick={() => toggleItem('correctness')}
                  className="w-full flex items-center justify-between p-3 text-left text-xs font-semibold text-white hover:bg-bg-dark transition-colors cursor-pointer"
                >
                  <span>My Correctness % (Mi Logro)</span>
                  {expandedItems.correctness ? <ChevronUp size={14} className="text-gold" /> : <ChevronDown size={14} className="text-[#555]" />}
                </button>
                {expandedItems.correctness && (
                  <div className="p-3 pt-1 border-t border-border-dark text-xs text-subtext font-light leading-relaxed">
                    Es la tasa de aciertos o porcentaje de logro real que obtuviste en este tipo de pregunta específico durante tu última práctica o simulacro de examen.
                  </div>
                )}
              </div>

              {/* Item 3 */}
              <div className="border border-border-dark rounded-sm overflow-hidden bg-[#050505]">
                <button
                  type="button"
                  onClick={() => toggleItem('target')}
                  className="w-full flex items-center justify-between p-3 text-left text-xs font-semibold text-white hover:bg-bg-dark transition-colors cursor-pointer"
                >
                  <span>Meta Target (Meta de Referencia)</span>
                  {expandedItems.target ? <ChevronUp size={14} className="text-gold" /> : <ChevronDown size={14} className="text-[#555]" />}
                </button>
                {expandedItems.target && (
                  <div className="p-3 pt-1 border-t border-border-dark text-xs text-subtext font-light leading-relaxed">
                    Es el valor mínimo u objetivo preestablecido para ese tipo de pregunta, diseñado para alinearse con los estándares requeridos para tu postulación de visa (ej. visa 482).
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-border-dark text-[11px] text-[#555] font-light">
            📌 <em>Tip: Al ingresar el ítem, se recordará automáticamente el % de Contribución anterior para facilitarte la carga la próxima vez.</em>
          </div>
        </div>
      </div>

      {/* Historical List */}
      <div className="bg-card-dark rounded-sm border border-border-dark overflow-hidden">
        
        {/* Filters bar */}
        <div className="p-5 border-b border-border-dark bg-[#080808] flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="text-gold" size={16} />
            <h3 className="font-serif font-light text-white text-md tracking-wide">Historial de Desglose ({filteredDetails.length})</h3>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div>
              <select
                value={filterSkill}
                onChange={(e) => {
                  setFilterSkill(e.target.value);
                  setFilterItem('all'); // reset item
                }}
                className="px-2.5 py-1.5 bg-[#090909] text-white border border-border-dark rounded-sm text-xs focus:outline-hidden focus:border-gold cursor-pointer"
              >
                <option value="all">Todas las Skills</option>
                <option value="Speaking">Speaking</option>
                <option value="Listening">Listening</option>
                <option value="Reading">Reading</option>
                <option value="Writing">Writing</option>
              </select>
            </div>
            <div>
              <select
                value={filterItem}
                onChange={(e) => setFilterItem(e.target.value)}
                className="px-2.5 py-1.5 bg-[#090909] text-white border border-border-dark rounded-sm text-xs focus:outline-hidden focus:border-gold max-w-[180px] cursor-pointer"
              >
                <option value="all">Todos los ítems</option>
                {filterFilteredItems.map(item => (
                  <option key={item.code} value={item.code}>
                    {item.code} - {item.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {filteredDetails.length === 0 ? (
          <div className="p-12 text-center text-subtext bg-[#0d0d0d]">
            <AlertCircle className="mx-auto mb-2 text-[#444]" size={32} />
            <p className="font-medium text-sm">No hay detalles registrados</p>
            <p className="text-xs text-[#555] mt-1">Carga un registro detallado usando el formulario superior.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-dark bg-[#080808] text-[10px] font-bold text-subtext uppercase tracking-wider">
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Sección</th>
                  <th className="py-3 px-4">Ítem</th>
                  <th className="py-3 px-4 text-center">Contribución (Peso)</th>
                  <th className="py-3 px-4 text-center">Mi Correctness (Logro)</th>
                  <th className="py-3 px-4 text-center">Meta Target</th>
                  <th className="py-3 px-4 text-center">Diferencia</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4">Notas</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark text-sm">
                {filteredDetails.map(d => {
                  const itemType = questionTypes.find(q => q.code === d.item);
                  const target = itemType ? itemType.target : null;
                  
                  let diff = null;
                  let statusLabel = '';
                  let statusBadgeClass = '';
                  if (target !== null) {
                    diff = d.correctness - target;
                    const diffPct = Math.round(d.correctness * 100) - Math.round(target * 100);
                    if (diffPct > 0) {
                      statusLabel = 'Mayor a lo requerido';
                      statusBadgeClass = 'text-emerald-400 font-semibold';
                    } else if (diffPct === 0) {
                      statusLabel = 'Igual a lo requerido';
                      statusBadgeClass = 'text-amber-400 font-semibold';
                    } else {
                      statusLabel = 'Menor a lo requerido';
                      statusBadgeClass = 'text-rose-500 font-semibold';
                    }
                  }

                  const skillColor = SKILL_COLORS[d.skill] || '#C5A059';

                  return (
                    <tr key={d.id} className="hover:bg-bg-dark/40 transition-colors">
                      <td className="py-3.5 px-4 text-xs text-subtext whitespace-nowrap">
                        {formatLocalPlainDate(d.fecha)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm border" style={{ backgroundColor: `${skillColor}15`, color: skillColor, borderColor: `${skillColor}30` }}>
                          {d.skill}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-serif font-light text-[#E5E5E5] text-md">
                        <span className="font-mono bg-[#111] border border-border-dark px-1.5 py-0.5 rounded-sm text-gold mr-2 text-xs font-semibold">
                          {d.item}
                        </span>
                        <span className="text-xs text-subtext font-light hidden sm:inline">
                          {itemType ? itemType.name : ''}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium font-serif text-[#E5E5E5]">
                        {(d.contribute * 100).toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold font-serif text-gold bg-gold/5">
                        {(d.correctness * 100).toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {target !== null ? (
                          <span className="text-xs font-semibold text-subtext bg-[#111] border border-border-dark px-1.5 py-0.5 rounded-sm">
                            {(target * 100).toFixed(0)}%
                          </span>
                        ) : (
                          <span className="text-xs text-[#555] italic">No fijada</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {diff !== null && target !== null ? (
                          (() => {
                            const diffPct = Math.round(d.correctness * 100) - Math.round(target * 100);
                            return (
                              <span className={`text-xs font-bold font-mono ${
                                diffPct > 0 ? 'text-emerald-400' :
                                diffPct === 0 ? 'text-amber-400' :
                                'text-rose-500'
                              }`}>
                                {diff >= 0 ? `+${(diff * 100).toFixed(1)}%` : `${(diff * 100).toFixed(1)}%`}
                              </span>
                            );
                          })()
                        ) : (
                          <span className="text-[#333]">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {target !== null ? (
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${statusBadgeClass}`}>
                            {statusLabel}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#555]">
                            Sin Meta
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-subtext max-w-xs truncate font-light" title={d.notas}>
                        {d.notas || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => onDeleteDetail(d.id)}
                          className="p-1.5 text-[#555] hover:text-rose-500 rounded-sm hover:bg-rose-950/20 transition-all cursor-pointer"
                          title="Eliminar ítem"
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
