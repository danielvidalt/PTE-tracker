import React, { useMemo } from 'react';
import { PTEEntry, SkillTargets } from '../types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Calendar, Target, Award, TrendingUp, HelpCircle, ClipboardCheck } from 'lucide-react';

interface DashboardProps {
  entries: PTEEntry[];
  targets: SkillTargets;
}

const SKILL_COLORS: Record<string, string> = {
  Listening: '#5B92E5', // elegante azul
  Reading: '#A8C353',   // elegante verde oliva/lima suave
  Speaking: '#A3A3A3',  // elegante plata/gris
  Writing: '#D65A9C',   // elegante oro rosa/magenta
  Overall: '#C5A059',   // oro
};

// Returns today's date as YYYY-MM-DD using local calendar date components.
// Date().toISOString() reports the UTC date instead, which rolls over to
// "tomorrow" in the evening for any timezone behind UTC (e.g. Chile, Perú).
export function getLocalDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatLocalPlainDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parts[0];
  const monthNames = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  const monthIndex = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return `${day} de ${monthNames[monthIndex] || parts[1]}, ${year}`;
}

export function getGoalDescriptionText(targets: SkillTargets): string {
  if (targets.goalType === 'visa-482') {
    return 'Requisito Visa 482 Australia: IELTS 5.0 equivalente (S:24, W:29, L:33, R:36 en PTE Academic)';
  }
  if (targets.goalType === 'visa-competent') {
    return 'Competent English: IELTS 6.0 equivalente (Mínimo de 50 en cada una de las 4 secciones)';
  }
  if (targets.goalType === 'visa-proficient') {
    return 'Proficient English (+10 pts): IELTS 7.0 equivalente (Mínimo de 65 en cada una de las 4 secciones)';
  }
  if (targets.goalType === 'visa-superior') {
    return 'Superior English (+20 pts): IELTS 8.0 equivalente (Mínimo de 79 en cada una de las 4 secciones)';
  }
  if (targets.goalType === 'visa-500') {
    return 'Visa 500 de Estudiante: IELTS 6.0 equivalente (PTE Overall 50, con al menos 42 por skill)';
  }
  if (targets.goalType === 'visa-485') {
    return 'Visa 485 de Graduado: IELTS 6.5 equivalente (PTE Overall 57, con al menos 50 por skill)';
  }
  
  // Custom average/minimum score translation:
  const minScore = Math.min(targets.Listening, targets.Reading, targets.Speaking, targets.Writing);
  
  let ieltsMin = "4.5";
  if (minScore >= 79) ieltsMin = "8.0 (Superior)";
  else if (minScore >= 65) ieltsMin = "7.0 (Proficient)";
  else if (minScore >= 50) ieltsMin = "6.0 (Competente)";
  else if (minScore >= 36) ieltsMin = "5.0";
  else if (minScore >= 30) ieltsMin = "4.5";
  
  return `Objetivo Personalizado: Mínimo PTE ${minScore} (Equivalencia IELTS ~${ieltsMin} por skill)`;
}

export default function Dashboard({ entries, targets }: DashboardProps) {
  // 1. Countdown calculation
  const countdownInfo = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const exam = new Date(targets.examDate + 'T00:00:00');
    const start = new Date(targets.prepStartDate + 'T00:00:00');

    const totalDuration = exam.getTime() - start.getTime();
    const elapsedDuration = today.getTime() - start.getTime();

    const diffTime = exam.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let progressPercent = 0;
    if (totalDuration > 0) {
      progressPercent = Math.min(100, Math.max(0, Math.round((elapsedDuration / totalDuration) * 100)));
    }

    return {
      daysLeft: diffDays,
      progressPercent,
      isPassed: diffDays < 0,
    };
  }, [targets.examDate, targets.prepStartDate]);

  // 2. Latest scores per skill
  const latestScores = useMemo(() => {
    const skills: Array<'Overall' | 'Listening' | 'Reading' | 'Speaking' | 'Writing'> = [
      'Overall', 'Listening', 'Reading', 'Speaking', 'Writing'
    ];
    
    const result: Record<string, { entry: PTEEntry | null; target: number | null }> = {};
    
    skills.forEach(skill => {
      const filtered = entries
        .filter(e => e.skill === skill)
        .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
        
      const latest = filtered.length > 0 ? filtered[filtered.length - 1] : null;
      const targetVal = skill === 'Overall' ? targets.Overall : targets[skill];
      
      result[skill] = {
        entry: latest,
        target: targetVal,
      };
    });
    
    return result;
  }, [entries, targets]);

  // 2b. Most recent Full Test session (all 5 scores loaded together)
  const lastFullTestSession = useMemo(() => {
    const fullTestEntries = entries.filter(e => e.tipo === 'Full Test');
    if (fullTestEntries.length === 0) return null;

    const groups = new Map<string, PTEEntry[]>();
    fullTestEntries.forEach(e => {
      const key = `${e.fecha}|${e.detalle}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(e);
    });

    const latestGroup = Array.from(groups.values()).sort((a, b) => {
      const fechaDiff = new Date(b[0].fecha).getTime() - new Date(a[0].fecha).getTime();
      if (fechaDiff !== 0) return fechaDiff;
      return b[0].id.localeCompare(a[0].id);
    })[0];

    const scoresBySkill: Partial<Record<PTEEntry['skill'], PTEEntry>> = {};
    latestGroup.forEach(e => { scoresBySkill[e.skill] = e; });

    return {
      fecha: latestGroup[0].fecha,
      detalle: latestGroup[0].detalle,
      scores: scoresBySkill,
    };
  }, [entries]);

  // 3. Prepare chart data per skill
  const chartDataBySkill = useMemo(() => {
    const skills = ['Overall', 'Listening', 'Reading', 'Speaking', 'Writing'];
    const result: Record<string, Array<{ fecha: string; formattedFecha: string; puntaje: number; detalle: string }>> = {};
    
    skills.forEach(skill => {
      const filtered = entries
        .filter(e => e.skill === skill)
        .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
        
      result[skill] = filtered.map(e => ({
        fecha: e.fecha,
        formattedFecha: e.fecha.slice(5), // simplified date MM-DD
        puntaje: e.puntaje,
        detalle: e.detalle || 'Test'
      }));
    });
    
    return result;
  }, [entries]);

  // Render a single KPI Row
  const renderKPIRow = (skill: 'Overall' | 'Listening' | 'Reading' | 'Speaking' | 'Writing') => {
    const { entry, target } = latestScores[skill];
    const score = entry ? entry.puntaje : null;
    const color = SKILL_COLORS[skill];
    
    let diff = null;
    let percent = null;
    let progressBg = 'bg-[#151515]';
    let textStatusClass = 'text-subtext';

    if (score !== null && target !== null) {
      diff = score - target;
      percent = Math.round((score / target) * 100);
      if (diff > 0) {
        progressBg = 'bg-emerald-500';
        textStatusClass = 'text-emerald-400 font-semibold';
      } else if (diff === 0) {
        progressBg = 'bg-amber-500';
        textStatusClass = 'text-amber-400 font-semibold';
      } else {
        progressBg = 'bg-rose-500';
        textStatusClass = 'text-rose-500 font-semibold';
      }
    }

    return (
      <tr key={skill} className="border-b border-border-dark hover:bg-bg-dark/40 transition-colors">
        {/* Skill label column */}
        <td className="py-4 px-4 font-medium">
          <div className="flex items-center gap-3">
            <span 
              className="w-3 h-3 rounded-full inline-block shrink-0" 
              style={{ backgroundColor: color }}
            />
            <span className="text-[#E5E5E5] font-medium text-sm md:text-base">
              {skill === 'Overall' ? 'Overall (General)' : skill}
            </span>
          </div>
        </td>
        
        {/* Latest score */}
        <td className="py-4 px-4 text-center">
          {score !== null ? (
            <span className="text-xl font-light font-serif text-white">{score}</span>
          ) : (
            <span className="text-xs text-[#555] italic">Sin datos</span>
          )}
        </td>
        
        {/* Visa Target */}
        <td className="py-4 px-4 text-center">
          {target !== null ? (
            <span className="text-sm font-medium text-[#E5E5E5] bg-[#111] border border-border-dark px-2.5 py-1 rounded-sm">
              {target}
            </span>
          ) : (
            <span className="text-xs text-[#555]">N/A</span>
          )}
        </td>
        
        {/* Score Difference */}
        <td className="py-4 px-4 text-center">
          {diff !== null && percent !== null ? (
            <span className={`text-sm font-semibold ${
              diff > 0 ? 'text-emerald-400' :
              diff === 0 ? 'text-amber-400' :
              'text-rose-500'
            }`}>
              {diff >= 0 ? `+${diff}` : diff}
            </span>
          ) : (
            <span className="text-xs text-[#555]">-</span>
          )}
        </td>
        
        {/* Percentage or ProgressBar */}
        <td className="py-4 px-4">
          {target !== null && score !== null ? (
            <div className="flex items-center gap-3 min-w-[120px] md:min-w-[180px]">
              <div className="w-full bg-[#151515] h-1.5 rounded-sm overflow-hidden border border-border-dark">
                <div 
                  className={`h-full ${progressBg} transition-all duration-500`}
                  style={{ width: `${Math.min(100, percent || 0)}%` }}
                />
              </div>
              <span className={`text-xs ${textStatusClass} shrink-0`}>
                {percent}%
              </span>
            </div>
          ) : target === null ? (
            <span className="text-xs text-subtext italic font-light">
              Sin mínimo requerido
            </span>
          ) : (
            <span className="text-xs text-[#555] italic">Registra un test para calcular</span>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-8">
      {/* Top Section: Hero Welcome and Countdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: App Quick Summary */}
        <div className="bg-card-dark p-6 rounded-sm border border-border-dark flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="p-2 bg-[#111] border border-border-dark-light text-gold rounded-sm">
                <TrendingUp size={18} />
              </span>
              <h2 className="text-md uppercase tracking-[0.2em] font-semibold text-white font-serif">Tu Preparación</h2>
            </div>
            <p className="text-sm text-subtext leading-relaxed font-light">
              Monitorea tus resultados de simulacros para cumplir las metas del examen PTE Academic para tu objetivo: <strong className="text-gold font-normal">{targets.goalName || 'Visa 482 Sponsorship'}</strong>.
            </p>
          </div>
          
          <div className="mt-8 border-t border-border-dark pt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted font-bold">Fecha de Inicio</p>
              <p className="text-sm font-semibold text-[#E5E5E5] mt-1">
                {formatLocalPlainDate(targets.prepStartDate)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted font-bold">Fecha del Examen</p>
              <p className="text-sm font-semibold text-gold mt-1">
                {formatLocalPlainDate(targets.examDate)}
              </p>
            </div>
          </div>
        </div>

        {/* Middle/Right: Outstanding Countdown Widget */}
        <div className="lg:col-span-2 bg-gold text-bg-dark p-8 rounded-sm relative overflow-hidden flex flex-col justify-between shadow-lg shadow-gold/5">
          {/* Background subtle graphics */}
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-12 translate-y-12 text-bg-dark">
            <Calendar size={240} />
          </div>

          <div className="flex justify-between items-start z-10">
            <div>
              <span className="text-[10px] uppercase bg-bg-dark/10 border border-bg-dark/15 px-3 py-1 rounded-sm font-bold tracking-wider">
                Examen PTE Academic
              </span>
              <h3 className="text-2xl font-light tracking-tight mt-3 font-serif" style={{ fontFamily: 'Georgia, serif' }}>
                {targets.goalName || 'Visa Sponsor 482 Australia'}
              </h3>
            </div>
            <Calendar className="text-bg-dark/80 shrink-0" size={26} />
          </div>

          <div className="my-6 z-10">
            {countdownInfo.isPassed ? (
              <div>
                <p className="text-3xl font-light font-serif">¡Examen Realizado!</p>
                <p className="text-xs text-bg-dark/70 mt-1 font-medium">
                  Tu fecha de examen fue el {formatLocalPlainDate(targets.examDate)}
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-light tracking-tighter" style={{ fontFamily: 'Georgia, serif' }}>{countdownInfo.daysLeft}</span>
                  <span className="text-sm font-medium uppercase tracking-widest text-bg-dark/80">días restantes</span>
                </div>
                <p className="text-xs text-bg-dark/70 mt-2 font-medium leading-relaxed max-w-md">
                  {getGoalDescriptionText(targets)}
                </p>
              </div>
            )}
          </div>

          <div className="z-10 space-y-2">
            <div className="flex justify-between text-[11px] uppercase tracking-wider text-bg-dark/80 font-bold">
              <span>Progreso de Estudio</span>
              <span>{countdownInfo.progressPercent}% transcurrido</span>
            </div>
            <div className="w-full bg-bg-dark/10 h-[3px] rounded-full overflow-hidden">
              <div 
                className="h-full bg-bg-dark transition-all duration-500"
                style={{ width: `${countdownInfo.progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Last Full Test Session Card */}
      <div className="bg-card-dark rounded-sm border border-border-dark overflow-hidden">
        <div className="p-6 border-b border-border-dark flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#080808]">
          <div>
            <h3 className="text-md uppercase tracking-[0.2em] font-semibold text-white font-serif flex items-center gap-2">
              <ClipboardCheck className="text-gold" size={18} />
              Último Simulacro Completo
            </h3>
            <p className="text-xs text-subtext mt-1 font-light">
              {lastFullTestSession ? lastFullTestSession.detalle : 'Los 5 puntajes de tu Full Test más reciente.'}
            </p>
          </div>
          {lastFullTestSession && (
            <span className="text-xs font-semibold text-gold bg-gold/10 border border-gold/20 px-3 py-1.5 rounded-sm self-start sm:self-auto whitespace-nowrap">
              {formatLocalPlainDate(lastFullTestSession.fecha)}
            </span>
          )}
        </div>

        {lastFullTestSession ? (
          <div className="grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-border-dark">
            {(['Overall', 'Listening', 'Reading', 'Speaking', 'Writing'] as const).map(skill => {
              const entry = lastFullTestSession.scores[skill];
              const target = skill === 'Overall' ? targets.Overall : targets[skill];
              const score = entry ? entry.puntaje : null;
              const diff = score !== null && target !== null ? score - target : null;
              const color = SKILL_COLORS[skill];

              return (
                <div key={skill} className="p-4 text-center">
                  <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color }}>
                    {skill === 'Overall' ? 'Overall (General)' : skill}
                  </p>
                  <p className="text-2xl font-serif font-light text-white mt-1.5">
                    {score !== null ? score : <span className="text-sm text-[#555] italic">Sin datos</span>}
                  </p>
                  {target !== null && diff !== null ? (
                    <p className={`text-[11px] font-semibold mt-1 ${
                      diff > 0 ? 'text-emerald-400' : diff === 0 ? 'text-amber-400' : 'text-rose-500'
                    }`}>
                      {diff >= 0 ? `+${diff}` : diff} vs. meta {target}
                    </p>
                  ) : (
                    <p className="text-[11px] text-[#555] mt-1">Sin meta</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-subtext bg-[#0d0d0d]">
            <HelpCircle className="mx-auto mb-2 text-[#444]" size={28} />
            <p className="text-sm font-medium">Aún no registras un Simulacro Completo</p>
            <p className="text-xs text-[#555] mt-1">Ve a "Registro de Puntaje" y carga los 5 puntajes de un Full Test.</p>
          </div>
        )}
      </div>

      {/* KPIs Table Card */}
      <div className="bg-card-dark rounded-sm border border-border-dark overflow-hidden">
        <div className="p-6 border-b border-border-dark flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#080808]">
          <div>
            <h3 className="text-md uppercase tracking-[0.2em] font-semibold text-white font-serif flex items-center gap-2">
              <Award className="text-gold" size={18} />
              Último Diagnóstico vs. Objetivos ({targets.goalName || 'Visa 482'})
            </h3>
            <p className="text-xs text-subtext mt-1 font-light">
              Resultados más recientes cargados para cada sección. Los puntajes de PTE van de 10 a 90.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 self-start text-[10px] font-bold tracking-widest uppercase text-subtext bg-bg-dark border border-border-dark px-3 py-1.5 rounded-sm">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Mayor a lo requerido</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Igual a lo requerido</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" /> Menor a lo requerido</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-dark bg-[#080808] text-[10px] font-bold tracking-wider text-subtext uppercase">
                <th className="py-3 px-4">Sección (Skill)</th>
                <th className="py-3 px-4 text-center">Último Puntaje</th>
                <th className="py-3 px-4 text-center">Meta Mínima</th>
                <th className="py-3 px-4 text-center">Diferencia</th>
                <th className="py-3 px-4">Progreso / Meta</th>
              </tr>
            </thead>
            <tbody>
              {renderKPIRow('Overall')}
              {renderKPIRow('Listening')}
              {renderKPIRow('Reading')}
              {renderKPIRow('Speaking')}
              {renderKPIRow('Writing')}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-[#0d0d0d] text-xs text-subtext border-t border-border-dark leading-relaxed font-light">
          💡 <strong>Nota sobre {targets.goalName || 'tu objetivo'}:</strong> El requisito mínimo establecido es (Overall: {targets.Overall !== null ? targets.Overall : 'N/A'}, Listening: {targets.Listening}, Reading: {targets.Reading}, Speaking: {targets.Speaking}, Writing: {targets.Writing}). Haz seguimiento periódico y compara con la tabla de equivalencias de IELTS.
        </div>
      </div>

      {/* Historial de Evolución - Gráficos de Línea */}
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-light font-serif text-white tracking-wide">Evolución Histórica de Puntajes</h3>
          <p className="text-xs text-subtext font-light mt-1">Haz seguimiento visual de tu avance sobre el tiempo en simulacros y exámenes.</p>
        </div>

        {/* Row 1: Overall (Full size/prominent) */}
        <div className="bg-card-dark p-6 rounded-sm border border-border-dark">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-gold" />
              <h4 className="font-serif font-light text-white tracking-wide text-md">Evolución del Puntaje General (Overall)</h4>
            </div>
            <span className="text-[10px] uppercase tracking-widest bg-bg-dark text-subtext border border-border-dark px-2 py-1 rounded-sm font-mono">
              Escala PTE (10 - 90)
            </span>
          </div>

          <div className="h-64 sm:h-80 w-full">
            {chartDataBySkill['Overall'].length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-subtext bg-[#0d0d0d] rounded-sm border border-border-dark border-dashed">
                <HelpCircle size={28} className="mb-2 text-[#555]" />
                <p className="text-sm font-medium">Sin datos registrados para Overall</p>
                <p className="text-xs text-[#555]">Registra un simulacro completo para ver el gráfico.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartDataBySkill['Overall']}
                  margin={{ top: 10, right: 20, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#181818" />
                  <XAxis 
                    dataKey="fecha" 
                    stroke="#555" 
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis 
                    domain={[10, 90]} 
                    stroke="#555" 
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    ticks={[10, 20, 30, 40, 50, 60, 70, 80, 90]}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0A0A0A', borderRadius: '2px', border: '1px solid #1A1A1A', color: '#E5E5E5' }}
                    labelFormatter={(label) => `Fecha: ${formatLocalPlainDate(label)}`}
                    formatter={(value, name, props) => [
                      <span className="font-semibold text-gold" key="val">{value} <span className="text-xs text-subtext font-normal">pts</span></span>,
                      <span className="text-xs text-subtext font-normal block" key="det">Detalle: {props.payload.detalle}</span>
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="puntaje" 
                    stroke="#C5A059" 
                    strokeWidth={2}
                    dot={{ r: 4, strokeWidth: 1.5, fill: '#050505', stroke: '#C5A059' }}
                    activeDot={{ r: 6 }}
                    name="Puntaje"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Row 2: 2x2 Grid of standard skills */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(['Listening', 'Reading', 'Speaking', 'Writing'] as const).map(skill => {
            const data = chartDataBySkill[skill];
            const color = SKILL_COLORS[skill];
            const target = targets[skill];

            return (
              <div key={skill} className="bg-card-dark p-5 rounded-sm border border-border-dark flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                      <h4 className="font-serif font-light text-white tracking-wide">{skill}</h4>
                    </div>
                    {target !== null && (
                      <span className="text-[10px] uppercase tracking-wider text-gold bg-gold/10 font-bold px-2 py-0.5 rounded-sm border border-gold/15">
                        Meta: {target}
                      </span>
                    )}
                  </div>

                  <div className="h-48 sm:h-56 w-full">
                    {data.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-subtext bg-[#0d0d0d] rounded-sm border border-border-dark border-dashed">
                        <HelpCircle size={22} className="mb-1 text-[#555]" />
                        <p className="text-xs font-semibold">Sin datos de {skill}</p>
                        <p className="text-[10px] text-[#555]">Carga un test o simulacro de {skill}.</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                           data={data}
                          margin={{ top: 5, right: 10, left: -25, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#181818" />
                          <XAxis 
                            dataKey="formattedFecha" 
                            stroke="#555" 
                            fontSize={10}
                            tickLine={false}
                          />
                          <YAxis 
                            domain={[10, 90]} 
                            stroke="#555" 
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            ticks={[10, 30, 50, 70, 90]}
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0A0A0A', borderRadius: '2px', border: '1px solid #1A1A1A', padding: '8px', color: '#E5E5E5' }}
                            labelFormatter={(label, items) => {
                              const fullDate = items[0]?.payload?.fecha || '';
                              return `Fecha: ${formatLocalPlainDate(fullDate)}`;
                            }}
                            formatter={(value, name, props) => [
                              <span className="font-semibold text-gold" key="val">{value} <span className="text-xs text-subtext font-normal">pts</span></span>,
                              <span className="text-[10px] text-subtext font-normal block" key="det">Detalle: {props.payload.detalle}</span>
                            ]}
                          />
                          {target !== null && (
                            <ReferenceLine 
                              y={target} 
                              stroke="#ff5555" 
                              strokeDasharray="4 4" 
                              strokeWidth={1}
                            />
                          )}
                          <Line 
                            type="monotone" 
                            dataKey="puntaje" 
                            stroke={color} 
                            strokeWidth={1.5}
                            dot={{ r: 3.5, strokeWidth: 1, fill: '#050505', stroke: color }}
                            activeDot={{ r: 5 }}
                            name="Puntaje"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
