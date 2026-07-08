import React, { useMemo } from 'react';
import { QuestionDetail, QuestionType } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { AlertTriangle, CheckCircle2, HelpCircle, ArrowDownNarrowWide, Compass } from 'lucide-react';
import { formatLocalPlainDate } from './Dashboard';

interface DetalleBandasProps {
  questionDetails: QuestionDetail[];
  questionTypes: QuestionType[];
}

const SKILL_COLORS: Record<string, string> = {
  Listening: '#5B92E5', // elegante azul
  Reading: '#A8C353',   // elegante verde oliva/lima suave
  Speaking: '#A3A3A3',  // elegante plata/gris
  Writing: '#D65A9C',   // elegante oro rosa/magenta
};

export default function DetalleBandas({ questionDetails, questionTypes }: DetalleBandasProps) {
  
  // 1. Calculate the latest correctness for each item
  const itemsWithLatestStatus = useMemo(() => {
    return questionTypes.map(q => {
      // Find all details recorded for this item, sorted by date descending
      const itemDetails = questionDetails
        .filter(d => d.item === q.code)
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
        
      const latestDetail = itemDetails[0] || null;
      const correctness = latestDetail ? latestDetail.correctness : null;
      const lastFecha = latestDetail ? latestDetail.fecha : null;
      const target = q.target;
      
      let status: 'Greater' | 'Equal' | 'Lesser' | 'Sin meta' | 'Sin datos' = 'Sin datos';
      let diff = null;
      
      if (correctness !== null) {
        if (target !== null) {
          diff = correctness - target;
          const diffPct = Math.round(correctness * 100) - Math.round(target * 100);
          if (diffPct > 0) {
            status = 'Greater';
          } else if (diffPct === 0) {
            status = 'Equal';
          } else {
            status = 'Lesser';
          }
        } else {
          status = 'Sin meta';
        }
      }
      
      return {
        ...q,
        correctness,
        lastFecha,
        status,
        diff,
      };
    });
  }, [questionDetails, questionTypes]);

  // 2. Global "Prioridad de Práctica" (Collect all Lesser items, sorted by most negative diff)
  const priorityStudyItems = useMemo(() => {
    return itemsWithLatestStatus
      .filter(item => item.status === 'Lesser' && item.diff !== null)
      .sort((a, b) => (a.diff || 0) - (b.diff || 0)); // most negative difference first (the biggest gap to close)
  }, [itemsWithLatestStatus]);

  // 3. Group and sort items by skill (Lesser first, then Equal, then Greater, then Sin meta, then Sin datos)
  const groupedSkills = useMemo(() => {
    const skills: Array<'Speaking' | 'Writing' | 'Reading' | 'Listening'> = ['Speaking', 'Writing', 'Reading', 'Listening'];
    const result: Record<string, typeof itemsWithLatestStatus> = {};
    
    skills.forEach(sk => {
      const skillItems = itemsWithLatestStatus.filter(item => item.skill === sk);
      
      // Sort: Lesser first (1), Equal second (2), Greater third (3), Sin meta fourth (4), Sin datos fifth (5)
      skillItems.sort((a, b) => {
        const getPriority = (status: string) => {
          if (status === 'Lesser') return 1;
          if (status === 'Equal') return 2;
          if (status === 'Greater') return 3;
          if (status === 'Sin meta') return 4;
          return 5; // 'Sin datos'
        };
        
        const prioA = getPriority(a.status);
        const prioB = getPriority(b.status);
        
        if (prioA !== prioB) {
          return prioA - prioB;
        }
        
        // If both are Lesser, sort by biggest gap (most negative difference)
        if (a.status === 'Lesser' && a.diff !== null && b.diff !== null) {
          return a.diff - b.diff;
        }
        
        return a.code.localeCompare(b.code);
      });
      
      result[sk] = skillItems;
    });
    
    return result;
  }, [itemsWithLatestStatus]);

  // Helper to construct data for Recharts bar charts
  const getChartDataForSkill = (skillItems: typeof itemsWithLatestStatus) => {
    return skillItems
      // Only include items with targets or correctness for plotting
      .filter(item => item.correctness !== null || item.target !== null)
      .map(item => ({
        code: item.code,
        name: item.name,
        'Logro Actual': item.correctness !== null ? Math.round(item.correctness * 100) : 0,
        'Meta Target': item.target !== null ? Math.round(item.target * 100) : 0,
      }));
  };

  return (
    <div className="space-y-8">
      
      {/* Overview Block */}
      <div className="bg-[#0d0d0d] p-6 rounded-sm border border-border-dark">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-card-dark text-gold border border-border-dark rounded-sm shrink-0">
            <Compass size={24} />
          </div>
          <div>
            <h3 className="text-lg font-serif font-light text-white tracking-wide">Guía de Enfoque y Fortalezas</h3>
            <p className="text-xs text-subtext font-light mt-1.5 leading-relaxed">
              Esta sección es 100% automatizada. Analiza tus desgloses para ordenarlos de peor a mejor. Tu prioridad principal debe ser cerrar las brechas donde estés <strong className="text-rose-500">Menor a lo requerido</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION: PRIORITY STUDY LIST */}
      <div className="bg-card-dark p-6 rounded-sm border border-border-dark">
        <h3 className="text-lg font-serif font-light text-white flex items-center gap-2.5 mb-1.5">
          <ArrowDownNarrowWide className="text-gold" size={20} />
          Plan de Enfoque: Prioridad de Estudio Semanal
        </h3>
        <p className="text-xs text-subtext font-light mb-6">
          Tipos de pregunta prioritarios donde tu tasa de aciertos actual es menor que el objetivo requerido. Ordenados por la brecha más grande a cerrar.
        </p>

        {priorityStudyItems.length === 0 ? (
          <div className="bg-gold/5 p-6 rounded-sm border border-gold/15 text-center flex flex-col items-center justify-center">
            <CheckCircle2 className="text-gold mb-2" size={32} />
            <h4 className="font-serif font-light text-white text-md">¡Excelente trabajo! No tienes brechas críticas</h4>
            <p className="text-xs text-subtext mt-1.5">Todos tus tipos de pregunta registrados superan los targets fijados o están sin meta. ¡Sigue así!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {priorityStudyItems.map(item => {
              const gap = item.diff !== null ? Math.round(item.diff * 100) : 0;
              const skillColor = SKILL_COLORS[item.skill];
              
              const cardBgBorder = 'border-rose-500/15 bg-rose-500/5 hover:border-rose-500/30';
              const textScoreClass = 'text-rose-500';
              const borderTClass = 'border-rose-500/10';
              const badgeBgBorderText = 'text-rose-500 bg-rose-500/10 border-rose-500/20';

              return (
                <div key={item.code} className={`border p-4 rounded-sm flex flex-col justify-between transition-all duration-300 ${cardBgBorder}`}>
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="font-mono font-bold bg-[#111] border border-border-dark px-2.5 py-0.5 rounded-sm text-xs text-gold">
                        {item.code}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-sm text-white" style={{ backgroundColor: skillColor }}>
                        {item.skill}
                      </span>
                    </div>
                    <h4 className="font-serif font-light text-white mt-4 text-md">{item.name}</h4>
                    
                    {/* Visual bar chart of gap */}
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-[#555] font-light">Logrado</p>
                        <p className={`font-bold text-sm font-serif ${textScoreClass}`}>{item.correctness !== null ? Math.round(item.correctness * 100) : 0}%</p>
                      </div>
                      <div>
                        <p className="text-[#555] font-light">Objetivo</p>
                        <p className="font-bold text-subtext text-sm font-serif">{item.target !== null ? Math.round(item.target * 100) : 0}%</p>
                      </div>
                    </div>
                  </div>

                  <div className={`mt-5 pt-3.5 border-t flex items-center justify-between text-xs ${borderTClass}`}>
                    <span className={`font-bold border px-2.5 py-0.5 rounded-sm flex items-center gap-1 text-[11px] uppercase tracking-wider font-sans ${badgeBgBorderText}`}>
                      <AlertTriangle size={12} />
                      Menor a lo requerido: {gap}%
                    </span>
                    <span className="text-[10px] text-[#555] font-mono">
                      Ref: {item.lastFecha ? formatLocalPlainDate(item.lastFecha).slice(0, 10) : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION: DETAILED BREAKDOWN BY SKILL (Tables & Bar charts) */}
      <div className="space-y-10">
        {(['Speaking', 'Writing', 'Reading', 'Listening'] as const).map(sk => {
          const items = groupedSkills[sk];
          const chartData = getChartDataForSkill(items);
          const skillColor = SKILL_COLORS[sk];

          return (
            <div key={sk} className="bg-card-dark p-6 rounded-sm border border-border-dark space-y-6">
              
              {/* Skill Header */}
              <div className="flex items-center justify-between pb-4 border-b border-border-dark">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: skillColor }} />
                  <h3 className="text-lg font-serif font-light text-white tracking-wide">{sk} — Diagnóstico de Fortalezas</h3>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest border px-3 py-1 rounded-sm text-white" style={{ backgroundColor: `${skillColor}15`, color: skillColor, borderColor: `${skillColor}30` }}>
                  {items.filter(i => i.status === 'Greater' || i.status === 'Equal').length} / {items.filter(i => i.status !== 'Sin datos').length} Items logrados
                </span>
              </div>

              {/* Grid: Left table of items (Bad first), Right comparison chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Table list */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-subtext uppercase tracking-widest">Estado de tipos de pregunta (Priorizado)</h4>
                  <div className="overflow-x-auto border border-border-dark rounded-sm">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#080808] text-[10px] text-subtext font-bold uppercase tracking-wider border-b border-border-dark">
                          <th className="py-2.5 px-3">Código</th>
                          <th className="py-2.5 px-3">Nombre</th>
                          <th className="py-2.5 px-3 text-center">Último Logro</th>
                          <th className="py-2.5 px-3 text-center">Objetivo</th>
                          <th className="py-2.5 px-3 text-center">Brecha</th>
                          <th className="py-2.5 px-3 text-center">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-dark bg-[#0a0a0a]">
                        {items.map(item => {
                          const gap = item.diff !== null ? Math.round(item.diff * 100) : null;
                          
                          return (
                            <tr key={item.code} className="hover:bg-bg-dark/40 transition-colors">
                              <td className="py-3 px-3 font-mono font-semibold text-gold">
                                {item.code}
                              </td>
                              <td className="py-3 px-3 font-serif font-light text-[#E5E5E5] truncate max-w-[140px]" title={item.name}>
                                {item.name}
                              </td>
                              <td className="py-3 px-3 text-center font-bold font-serif text-white text-sm">
                                {item.correctness !== null ? `${Math.round(item.correctness * 100)}%` : (
                                  <span className="text-[#555] font-normal italic text-xs">Sin datos</span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-center font-medium font-serif text-subtext text-xs">
                                {item.target !== null ? `${Math.round(item.target * 100)}%` : (
                                  <span className="text-[#333] italic">No set</span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-center">
                                {gap !== null ? (
                                  <span className={`font-mono font-semibold ${
                                    item.status === 'Greater' ? 'text-emerald-400' :
                                    item.status === 'Equal' ? 'text-amber-400' :
                                    'text-rose-500'
                                  }`}>
                                    {gap >= 0 ? `+${gap}%` : `${gap}%`}
                                  </span>
                                ) : (
                                  <span className="text-[#333]">-</span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-center">
                                {item.status === 'Greater' && (
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                                    Mayor a lo requerido
                                  </span>
                                )}
                                {item.status === 'Equal' && (
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400">
                                    Igual a lo requerido
                                  </span>
                                )}
                                {item.status === 'Lesser' && (
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-rose-500">
                                    Menor a lo requerido
                                  </span>
                                )}
                                {item.status === 'Sin meta' && (
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#555]">
                                    Sin Meta
                                  </span>
                                )}
                                {item.status === 'Sin datos' && (
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#333]">
                                    Sin Datos
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recharts grouped bar chart */}
                <div className="flex flex-col justify-between">
                  <h4 className="text-[10px] font-bold text-subtext uppercase tracking-widest mb-2">Comparación: Logro vs Objetivo (%)</h4>
                  
                  {chartData.length === 0 ? (
                     <div className="h-48 sm:h-64 flex flex-col items-center justify-center text-subtext bg-[#0d0d0d] rounded-sm border border-dashed border-border-dark">
                      <HelpCircle size={24} className="mb-1 text-[#444]" />
                      <p className="text-xs font-semibold">Sin datos de desgloses para graficar</p>
                      <p className="text-[10px] text-[#444] mt-1">Registra desgloses en la pestaña "Detalle Preguntas" para ver la comparación.</p>
                    </div>
                  ) : (
                    <div className="h-56 sm:h-64 w-full bg-[#0d0d0d] p-3 rounded-sm border border-border-dark">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={chartData}
                          margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                          barGap={2}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1A1A1A" />
                          <XAxis dataKey="code" tickLine={false} fontSize={10} stroke="#555" />
                          <YAxis domain={[0, 100]} tickLine={false} axisLine={false} fontSize={10} stroke="#555" ticks={[0, 25, 50, 75, 100]} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0A0A0A', borderRadius: '2px', fontSize: '11px', border: '1px solid #222', color: '#fff' }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(value, name) => [`${value}%`, name]}
                          />
                          <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                          <Bar dataKey="Logro Actual" fill={skillColor} radius={[1, 1, 0, 0]} />
                          <Bar dataKey="Meta Target" fill="#222" stroke="#444" strokeWidth={1} radius={[1, 1, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
