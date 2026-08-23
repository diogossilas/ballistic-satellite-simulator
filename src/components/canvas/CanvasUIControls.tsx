import React from 'react';
import { ViewMode, InterceptorState, SatelliteDefenseSystemState } from '../../types/physics';
import {
  Globe,
  Layers,
  Crosshair,
  Box,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Eye,
  Activity,
  Wind,
  Shield,
  ShieldCheck,
  Target,
  Flame,
} from 'lucide-react';

interface CanvasUIControlsProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  showVectors: boolean;
  onToggleVectors: () => void;
  showAtmosphereLayers: boolean;
  onToggleAtmosphere: () => void;
  autoFollow: boolean;
  onToggleAutoFollow: () => void;
  interceptorState: InterceptorState;
  satelliteDefenseState?: SatelliteDefenseSystemState;
  onToggleAutoEngage: () => void;
  onManualLaunchInterceptor: () => void;
  onTriggerKineticStrike?: () => void;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  handleResetCamera: () => void;
}

export const CanvasUIControls: React.FC<CanvasUIControlsProps> = ({
  viewMode,
  onViewModeChange,
  showVectors,
  onToggleVectors,
  showAtmosphereLayers,
  onToggleAtmosphere,
  autoFollow,
  onToggleAutoFollow,
  interceptorState,
  satelliteDefenseState,
  onToggleAutoEngage,
  onManualLaunchInterceptor,
  onTriggerKineticStrike,
  setZoom,
  handleResetCamera,
}) => {
  return (
    <>
      {/* Barra de Seleção de Modos de Visualização (Topo Esquerdo) */}
      <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 p-1 bg-[#121215]/95 backdrop-blur border border-[#27272a] rounded-lg shadow-lg">
        <button
          id="btn-view-25d"
          onClick={() => onViewModeChange('view25d')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-medium rounded transition-colors ${
            viewMode === 'view25d'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#18181c]'
          }`}
          title="Visão 2.5D Tática com Relevo Realista, Interceptor e Varas de Deus"
        >
          <Box className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-bold">Visão 2.5D com Relevo</span>
        </button>

        <button
          id="btn-view-orbital"
          onClick={() => onViewModeChange('orbital')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-medium rounded transition-colors ${
            viewMode === 'orbital'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#18181c]'
          }`}
          title="Visão Esférica Global com Continentes Fictícios"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Esfera Planetária</span>
        </button>

        <button
          id="btn-view-profile"
          onClick={() => onViewModeChange('profile')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-medium rounded transition-colors ${
            viewMode === 'profile'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#18181c]'
          }`}
          title="Corte Transversal Altitude vs Alcance com Relevo Topográfico"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Perfil Alt vs Alcance</span>
        </button>

        <button
          id="btn-view-radar"
          onClick={() => onViewModeChange('radar')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-medium rounded transition-colors ${
            viewMode === 'radar'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#18181c]'
          }`}
          title="Visão Superior Top-Down com Relevo e Dispersão"
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span>Radar & Dispersão</span>
        </button>
      </div>

      {/* Controles de Defesa e Câmera (Topo Direito) */}
      <div className="absolute top-3 right-3 flex flex-wrap items-center gap-1.5 p-1 bg-[#121215]/95 backdrop-blur border border-[#27272a] rounded-lg shadow-lg">
        <button
          id="btn-toggle-auto-engage"
          onClick={onToggleAutoEngage}
          className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono rounded transition-colors ${
            interceptorState.battery.autoEngage
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700'
          }`}
          title="Alternar Engajamento Automático da Defesa da República Territorial"
        >
          {interceptorState.battery.autoEngage ? (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Shield className="w-3.5 h-3.5 text-zinc-400" />
          )}
          <span className="hidden sm:inline">
            {interceptorState.battery.autoEngage ? 'Auto-Defesa República' : 'Defesa Manual'}
          </span>
        </button>

        {interceptorState.status === 'standby' && (
          <button
            id="btn-manual-launch-interceptor"
            onClick={onManualLaunchInterceptor}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black font-mono font-bold text-xs rounded transition-colors shadow"
            title="Lançar Interceptor da República Territorial Imediatamente"
          >
            <Target className="w-3.5 h-3.5 fill-current" />
            <span>Disparar ABM</span>
          </button>
        )}

        {onTriggerKineticStrike && (
          <button
            id="btn-trigger-kinetic-strike"
            onClick={onTriggerKineticStrike}
            className={`flex items-center gap-1 px-2.5 py-1.5 font-mono text-xs rounded transition-colors ${
              satelliteDefenseState?.retaliationTriggered
                ? 'bg-amber-600/30 text-amber-300 border border-amber-500/50'
                : 'bg-zinc-800 hover:bg-amber-900/40 text-amber-300 border border-amber-500/30'
            }`}
            title="Lançar 'Varas de Deus' (Project Thor)"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">
              {satelliteDefenseState?.retaliationTriggered ? 'Varas de Deus Ativas' : 'Varas de Deus'}
            </span>
          </button>
        )}

        <div className="w-[1px] h-4 bg-[#27272a] mx-0.5" />

        {viewMode === 'profile' && (
          <button
            id="btn-toggle-vectors"
            onClick={onToggleVectors}
            className={`p-1.5 rounded transition-colors ${
              showVectors
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#18181c]'
            }`}
            title="Exibir Vetores de Força"
          >
            <Activity className="w-4 h-4" />
          </button>
        )}

        <button
          id="btn-toggle-atmosphere"
          onClick={onToggleAtmosphere}
          className={`p-1.5 rounded transition-colors ${
            showAtmosphereLayers
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#18181c]'
          }`}
          title="Exibir Camadas Atmosféricas"
        >
          <Wind className="w-4 h-4" />
        </button>

        <button
          id="btn-toggle-follow"
          onClick={onToggleAutoFollow}
          className={`p-1.5 rounded transition-colors ${
            autoFollow
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#18181c]'
          }`}
          title="Acompanhamento Automático de Câmera"
        >
          <Eye className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-[#27272a] mx-0.5" />

        <button
          id="btn-zoom-in"
          onClick={() => setZoom((z) => Math.min(15, z * 1.25))}
          className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-[#18181c] rounded transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          id="btn-zoom-out"
          onClick={() => setZoom((z) => Math.max(0.2, z * 0.8))}
          className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-[#18181c] rounded transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          id="btn-reset-camera"
          onClick={handleResetCamera}
          className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-[#18181c] rounded transition-colors"
          title="Reset Camera"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </>
  );
};
