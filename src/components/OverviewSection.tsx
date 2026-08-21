/**
 * Seção Visão Geral e Diagrama Esquemático de Fases de Voo
 * Diagrama interativo mostrando Boost, Trajetória Suborbital, Reentrada e Impacto.
 */

import React from 'react';
import { 
  Rocket, 
  Orbit, 
  Flame, 
  Target, 
  ShieldAlert, 
  Play, 
  BookOpen, 
  Atom, 
  Activity,
  ArrowRight,
  HelpCircle
} from 'lucide-react';

interface OverviewSectionProps {
  onStartNewLaunch: () => void;
  onOpenPresets: () => void;
  onOpenPhysicsLab: () => void;
  onOpenCharts: () => void;
  onOpenDocModal: () => void;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({
  onStartNewLaunch,
  onOpenPresets,
  onOpenPhysicsLab,
  onOpenCharts,
  onOpenDocModal,
}) => {
  return (
    <div className="space-y-4 p-4 md:p-6 bg-[#121215] border border-[#27272a] rounded-xl shadow-2xl">
      {/* Título Principal e Apresentação Didática */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#27272a] pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#18181c] border border-amber-500/30 rounded text-amber-400">
              <Rocket className="w-5 h-5" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-zinc-100 tracking-tight font-mono">
              SIMULADOR_BALÍSTICO_FICTÍCIO
            </h1>
          </div>
          <p className="text-xs md:text-sm text-zinc-400 max-w-3xl leading-relaxed">
            Ambiente interativo de modelagem aeroespacial para ensino e pesquisa de física orbital, balística exterior e dinâmica de projéteis. Todos os cenários, territórios e corpos celestes são inteiramente fictícios, regidos por equações diferenciais científicas exatas.
          </p>
        </div>

        {/* Botões de Ação Rápida */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-overview-new-launch"
            onClick={onStartNewLaunch}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-mono font-bold uppercase tracking-wider rounded shadow-lg transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Novo Lançamento</span>
          </button>

          <button
            id="btn-overview-presets"
            onClick={onOpenPresets}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#18181c] hover:bg-[#202026] text-zinc-300 hover:text-amber-400 text-xs font-mono font-semibold rounded border border-[#27272a] transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Cenários</span>
          </button>

          <button
            id="btn-overview-physics-lab"
            onClick={onOpenPhysicsLab}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#18181c] hover:bg-[#202026] text-zinc-300 hover:text-amber-400 text-xs font-mono font-semibold rounded border border-[#27272a] transition-colors"
          >
            <Atom className="w-3.5 h-3.5 text-amber-400" />
            <span>Laboratório</span>
          </button>

          <button
            id="btn-overview-charts"
            onClick={onOpenCharts}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#18181c] hover:bg-[#202026] text-zinc-300 hover:text-amber-400 text-xs font-mono font-semibold rounded border border-[#27272a] transition-colors"
          >
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span>Painel Dados</span>
          </button>

          <button
            id="btn-overview-doc"
            onClick={onOpenDocModal}
            className="p-2 bg-[#18181c] hover:bg-[#202026] text-zinc-400 hover:text-amber-400 rounded border border-[#27272a] transition-colors"
            title="Documentação Técnica e Diretrizes Éticas"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* DIAGRAMA ESQUEMÁTICO DIDÁTICO DAS FASES DE VOO */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
          <span>Diagrama Esquemático do Ciclo de Voo Aeroespacial</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Fase 1: Boost */}
          <div className="p-3.5 bg-[#0a0a0c] border border-[#27272a] hover:border-amber-500/50 rounded-xl relative overflow-hidden group transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider px-2 py-0.5 bg-amber-500/10 rounded border border-amber-500/30">
                Fase 1: Boost
              </span>
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <h4 className="text-xs font-bold text-zinc-100 mb-1 font-mono">Propulsão & Queima</h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed mb-2">
              Aceleração contínua pela queima de propelente (F = ṁ · Isp · g₀). O veículo ganha energia cinética, supera o Max Q e inicia o gravity turn.
            </p>
            <div className="text-[10px] font-mono text-amber-400/90 bg-[#121215] p-1.5 rounded border border-[#27272a]">
              Segunda Lei: a = (T - F_d)/m - g
            </div>
          </div>

          {/* Fase 2: Voo Balístico / Suborbital */}
          <div className="p-3.5 bg-[#0a0a0c] border border-[#27272a] hover:border-cyan-500/50 rounded-xl relative overflow-hidden group transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider px-2 py-0.5 bg-cyan-500/10 rounded border border-cyan-500/30">
                Fase 2: Inercial
              </span>
              <Orbit className="w-4 h-4 text-cyan-400" />
            </div>
            <h4 className="text-xs font-bold text-zinc-100 mb-1 font-mono">Trajetória & Apogeu</h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed mb-2">
              Motores desligados. O projétil descreve arco elíptico kepleriano sob gravidade central esférica no vácuo espacial (h &gt; 100 km).
            </p>
            <div className="text-[10px] font-mono text-cyan-400/90 bg-[#121215] p-1.5 rounded border border-[#27272a]">
              Kepler: g(r) = g₀ · (R/r)²
            </div>
          </div>

          {/* Fase 3: Reentrada */}
          <div className="p-3.5 bg-[#0a0a0c] border border-[#27272a] hover:border-red-500/50 rounded-xl relative overflow-hidden group transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-wider px-2 py-0.5 bg-red-500/10 rounded border border-red-500/30">
                Fase 3: Reentrada
              </span>
              <Flame className="w-4 h-4 text-red-400" />
            </div>
            <h4 className="text-xs font-bold text-zinc-100 mb-1 font-mono">Reentrada Hipersônica</h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed mb-2">
              Ao mergulhar na atmosfera densa, o projétil comprime o ar gerando onda de choque, frenagem violenta e aquecimento térmico por estagnação.
            </p>
            <div className="text-[10px] font-mono text-red-400/90 bg-[#121215] p-1.5 rounded border border-[#27272a]">
              Rayleigh: F_d = ½ · ρ · v² · Cd · A
            </div>
          </div>

          {/* Fase 4: Impacto Terminal */}
          <div className="p-3.5 bg-[#0a0a0c] border border-[#27272a] hover:border-emerald-500/50 rounded-xl relative overflow-hidden group transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider px-2 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/30">
                Fase 4: Impacto
              </span>
              <Target className="w-4 h-4 text-emerald-400" />
            </div>
            <h4 className="text-xs font-bold text-zinc-100 mb-1 font-mono">Ponto Terminal</h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed mb-2">
              Chegada ao solo na zona de testes fictícia. Determinação da energia cinética residual (Ek = ½mv²), ângulo de impacto e dispersão por vento.
            </p>
            <div className="text-[10px] font-mono text-emerald-400/90 bg-[#121215] p-1.5 rounded border border-[#27272a]">
              Energia: E_k = ½ · m · v²
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
