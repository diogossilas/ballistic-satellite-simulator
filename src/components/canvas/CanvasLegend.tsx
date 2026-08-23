import React from 'react';
import { ViewMode, InterceptorState } from '../../types/physics';
import { ShieldCheck, ShieldAlert } from 'lucide-react';

interface CanvasLegendProps {
  viewMode: ViewMode;
  interceptorState: InterceptorState;
  zoom: number;
}

export const CanvasLegend: React.FC<CanvasLegendProps> = ({
  viewMode,
  interceptorState,
  zoom,
}) => {
  return (
    <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#050506]/95 backdrop-blur border border-[#27272a] rounded-lg text-[11px] text-zinc-400 pointer-events-none">
      <div className="flex flex-wrap items-center gap-3 font-mono">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <strong className="text-zinc-200">Míssil Agressor</strong>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <strong className="text-zinc-200">Interceptor República Territorial</strong>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <strong className="text-zinc-200">Varas de Deus (Thor)</strong>
        </span>
        {viewMode === 'view25d' && (
          <span className="hidden md:flex items-center gap-2 text-zinc-400">
            <span className="text-slate-300">⛰️ Montanhas</span>
            <span className="text-amber-300">🏙️ Cidades / Prédios</span>
            <span className="text-red-400">💥 Área Destruída</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 font-mono text-zinc-400">
        {interceptorState.status === 'intercepted' ? (
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Destruição Mútua no Céu (Vitória República)
          </span>
        ) : interceptorState.status === 'tracking' ? (
          <span className="text-emerald-300 font-bold animate-pulse flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            Interceptor em Voo
          </span>
        ) : null}
        <span className="text-amber-400">Zoom: {(zoom * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
};
