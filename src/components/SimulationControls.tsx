/**
 * Controles de Simulação Física e Gerenciamento Temporal
 * Play, Pause, Passo a Passo, Time Warp (1x-100x), Reinício e Exportação de Dados CSV/JSON
 */

import React from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  StepForward, 
  FastForward, 
  Download, 
  Rocket,
  FileSpreadsheet,
  FileCode
} from 'lucide-react';
import { TelemetryPoint, FlightPhase } from '../types/physics';

interface SimulationControlsProps {
  isRunning: boolean;
  phase: FlightPhase;
  timeScale: number;
  onTogglePlayPause: () => void;
  onStepForward: () => void;
  onReset: () => void;
  onChangeTimeScale: (scale: number) => void;
  onRunInstant: () => void;
  telemetryHistory: TelemetryPoint[];
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  isRunning,
  phase,
  timeScale,
  onTogglePlayPause,
  onStepForward,
  onReset,
  onChangeTimeScale,
  onRunInstant,
  telemetryHistory,
}) => {
  // Exportar dados de telemetria em CSV
  const handleExportCSV = () => {
    if (telemetryHistory.length === 0) return;

    const headers = [
      'Tempo_s',
      'Alcance_m',
      'Altitude_m',
      'Velocidade_ms',
      'Velocidade_kmh',
      'Mach',
      'Aceleracao_ms2',
      'Forca_G',
      'Massa_kg',
      'Empuxo_N',
      'Arrasto_N',
      'Gravidade_N',
      'PressaoDinamica_Pa',
      'FluxoCalor_kWm2',
      'DesvioLateral_m',
      'Fase',
    ];

    const rows = telemetryHistory.map((pt) => [
      pt.time.toFixed(2),
      pt.x.toFixed(2),
      pt.y.toFixed(2),
      pt.speed.toFixed(2),
      (pt.speed * 3.6).toFixed(2),
      pt.mach.toFixed(3),
      pt.acceleration.toFixed(2),
      pt.gForce.toFixed(2),
      pt.mass.toFixed(1),
      pt.thrustForce.toFixed(1),
      pt.dragForce.toFixed(1),
      pt.gravityForce.toFixed(1),
      pt.dynamicPressure.toFixed(1),
      pt.heatFluxRate.toFixed(2),
      pt.lateralDeviation.toFixed(2),
      pt.phase,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `telemetria_balistica_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Exportar telemetria em JSON
  const handleExportJSON = () => {
    if (telemetryHistory.length === 0) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(telemetryHistory, null, 2)
    )}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = `telemetria_balistica_${Date.now()}.json`;
    link.click();
  };

  const isCompleted = phase === 'impactado' || phase === 'destruido';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#121215] border border-[#27272a] rounded-xl shadow-xl">
      {/* Botões Principais de Execução */}
      <div className="flex items-center gap-2">
        <button
          id="btn-main-play-pause"
          onClick={onTogglePlayPause}
          className={`flex items-center gap-2 px-4 py-2 rounded font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-md ${
            isRunning
              ? 'bg-amber-500 hover:bg-amber-400 text-black'
              : isCompleted
              ? 'bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-amber-500/40'
              : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4 fill-current" />
              <span>Pausar</span>
            </>
          ) : isCompleted ? (
            <>
              <Rocket className="w-4 h-4" />
              <span>Novo Disparo</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Iniciar Simulação</span>
            </>
          )}
        </button>

        <button
          id="btn-step-forward"
          onClick={onStepForward}
          disabled={isRunning || isCompleted}
          className="flex items-center gap-1 px-3 py-2 bg-[#18181c] hover:bg-[#222228] disabled:opacity-30 text-zinc-300 text-xs font-mono font-medium rounded border border-[#27272a] transition-colors"
          title="Avançar 1 passo de integração RK4 (dt = 0.1s)"
        >
          <StepForward className="w-3.5 h-3.5" />
          <span>Passo</span>
        </button>

        <button
          id="btn-reset-sim"
          onClick={onReset}
          className="flex items-center gap-1 px-3 py-2 bg-[#18181c] hover:bg-[#222228] text-zinc-300 text-xs font-mono font-medium rounded border border-[#27272a] transition-colors"
          title="Reiniciar rampa e parâmetros iniciais"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reiniciar</span>
        </button>

        <button
          id="btn-run-instant"
          onClick={onRunInstant}
          className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-[#18181c] hover:bg-[#222228] text-amber-400 text-xs font-mono font-medium rounded border border-amber-500/30 transition-colors"
          title="Calcular trajetória completa instantaneamente até o impacto"
        >
          <FastForward className="w-3.5 h-3.5" />
          <span>Trajetória Completa</span>
        </button>
      </div>

      {/* Multiplicador de Velocidade Temporal (Time Warp) */}
      <div className="flex items-center gap-1 bg-[#0a0a0c] p-1 rounded border border-[#27272a]">
        <span className="text-[11px] font-mono text-zinc-400 px-2 font-medium">Warp:</span>
        {[1, 5, 10, 25, 50, 100].map((scale) => (
          <button
            key={scale}
            id={`btn-timewarp-${scale}x`}
            onClick={() => onChangeTimeScale(scale)}
            className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
              timeScale === scale
                ? 'bg-amber-500 text-black font-bold shadow'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#18181c]'
            }`}
          >
            {scale}x
          </button>
        ))}
      </div>

      {/* Exportação de Dados */}
      <div className="flex items-center gap-1.5">
        <button
          id="btn-export-csv"
          onClick={handleExportCSV}
          disabled={telemetryHistory.length === 0}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-[#18181c] hover:bg-[#222228] disabled:opacity-30 text-zinc-300 text-xs font-mono font-medium rounded border border-[#27272a] transition-colors"
          title="Exportar todos os pontos físicos de telemetria em formato CSV"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden md:inline">CSV</span>
        </button>

        <button
          id="btn-export-json"
          onClick={handleExportJSON}
          disabled={telemetryHistory.length === 0}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-[#18181c] hover:bg-[#222228] disabled:opacity-30 text-zinc-300 text-xs font-mono font-medium rounded border border-[#27272a] transition-colors"
          title="Exportar telemetria em JSON"
        >
          <FileCode className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden md:inline">JSON</span>
        </button>
      </div>
    </div>
  );
};
