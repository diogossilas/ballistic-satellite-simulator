/**
 * Componente: Sequenciador Visual da Cadeia de Instruções da Missão
 * 
 * Exibe em tempo real o fluxo exato da cadeia de eventos solicitada:
 * 1. Lançamento do Míssil de um lado (Origem / Federação Alpha)
 * 2. Passagem pelos Satélites em órbita sem nenhum problema
 * 3. Entrada no Território Aéreo do outro país (Detecção & Disparo de Interceptor)
 * 4. Destruição Mútua no Céu antes que o míssil atinja o solo
 * 5. Liberação das "Varas de Deus" / Bomba Cinética pelos Satélites
 * 6. Impacto Terminal e Aniquilação de Área nas Bases Agressoras
 */

import React from 'react';
import { 
  Rocket, 
  Satellite, 
  ShieldAlert, 
  Flame, 
  Zap, 
  CheckCircle2, 
  Radio, 
  Target,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { TelemetryPoint, InterceptorState, SatelliteDefenseSystemState, FlightPhase } from '../types/physics';

interface InstructionChainTrackerProps {
  currentTelemetry: TelemetryPoint | null;
  interceptorState: InterceptorState;
  satelliteDefenseState: SatelliteDefenseSystemState;
  phase: FlightPhase;
  isRunning: boolean;
  targetRangeKm: number;
  onStartSimulation: () => void;
}

export const InstructionChainTracker: React.FC<InstructionChainTrackerProps> = ({
  currentTelemetry,
  interceptorState,
  satelliteDefenseState,
  phase,
  isRunning,
  targetRangeKm,
  onStartSimulation,
}) => {
  // Determina a etapa ativa da cadeia de instruções
  const targetRangeM = targetRangeKm * 1000;
  const currentXM = currentTelemetry?.x || 0;
  const currentYM = currentTelemetry?.y || 0;
  const isDestroyedInAir = phase === 'destruido' || interceptorState.status === 'intercepted' || !!currentTelemetry?.midAirDestroyed;
  const isRetaliating = satelliteDefenseState.retaliationTriggered;
  const activeRods = satelliteDefenseState.rods;
  const allRodsImpacted = activeRods.length > 0 && activeRods.every((r) => r.status === 'impacted');

  // Cálculos de estágio da cadeia (1 a 6)
  let currentStep = 1;
  let statusDetail = 'Aguardando início do lançamento na plataforma.';

  if (phase === 'pronto' && !isRunning) {
    currentStep = 1;
    statusDetail = 'Pronto para iniciar. Clique em "Iniciar Simulação" para executar a cadeia completa.';
  } else if (!isDestroyedInAir && phase !== 'impactado') {
    // Míssil ainda voando
    const crossedAirspaceBorder = currentXM >= targetRangeM * 0.65;
    const isPassingSatellites = currentYM >= 150000 && !crossedAirspaceBorder;

    if (interceptorState.status === 'launched' || interceptorState.status === 'tracking' || crossedAirspaceBorder) {
      currentStep = 3;
      statusDetail = 'Míssil invadiu o espaço aéreo do país alvo! Interceptor disparado em rota de colisão.';
    } else if (isPassingSatellites || currentXM >= targetRangeM * 0.25) {
      currentStep = 2;
      statusDetail = 'Míssil cruza a camada orbital e passa pelos satélites sem interferência.';
    } else {
      currentStep = 1;
      statusDetail = 'Míssil lançado com sucesso da base de origem (Plataforma Alpha).';
    }
  } else if (isDestroyedInAir) {
    if (allRodsImpacted) {
      currentStep = 6;
      statusDetail = 'Varas de Deus impactaram as bases de origem a Mach 10+. Missão concluída com sucesso.';
    } else if (isRetaliating && activeRods.some((r) => r.status === 'falling' || r.status === 'reentering')) {
      currentStep = 5;
      statusDetail = 'Satélites soltaram as "Varas de Deus"! Hastes de tungstênio em reentrada hipersônica.';
    } else {
      currentStep = 4;
      statusDetail = 'Interceptor colidiu no céu! Míssil destruído no ar antes que atingisse o solo.';
    }
  } else if (phase === 'impactado') {
    currentStep = 6;
    statusDetail = 'Simulação finalizada.';
  }

  const steps = [
    {
      num: 1,
      title: 'Lançamento de Origem',
      subtitle: 'Disparo do míssil na Base Alpha',
      icon: Rocket,
      color: 'amber',
    },
    {
      num: 2,
      title: 'Passagem Orbital',
      subtitle: 'Passa pelos satélites sem problemas',
      icon: Satellite,
      color: 'cyan',
    },
    {
      num: 3,
      title: 'Espaço Aéreo Alvo',
      subtitle: 'Radar detecta e lança interceptor',
      icon: Target,
      color: 'emerald',
    },
    {
      num: 4,
      title: 'Abate no Céu',
      subtitle: 'Destrói no ar antes do solo',
      icon: ShieldAlert,
      color: 'red',
    },
    {
      num: 5,
      title: 'Varas de Deus',
      subtitle: 'Satélites soltam bomba/hastes',
      icon: Zap,
      color: 'amber',
    },
    {
      num: 6,
      title: 'Impacto Terminal',
      subtitle: 'Aniquilação cinética do agressor',
      icon: Flame,
      color: 'orange',
    },
  ];

  return (
    <div className="p-3.5 bg-[#121215] border border-[#27272a] rounded-xl shadow-xl space-y-3">
      {/* Cabeçalho do Sequenciador */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#27272a]/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-500/10 border border-amber-500/30 rounded text-amber-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-100">
                Cadeia de Instruções da Simulação
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full">
                Etapa {currentStep} de 6
              </span>
            </div>
            <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
              {statusDetail}
            </p>
          </div>
        </div>

        {/* Botão de Disparo / Reinício da Cadeia se Parado */}
        {!isRunning && (
          <button
            id="btn-chain-start-trigger"
            onClick={onStartSimulation}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-mono font-bold text-xs uppercase tracking-wider rounded shadow transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Executar Cadeia Completa</span>
          </button>
        )}
      </div>

      {/* Grid Interativo dos 6 Passos da Cadeia de Instruções */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {steps.map((step) => {
          const Icon = step.icon;
          const isCurrent = currentStep === step.num;
          const isPassed = currentStep > step.num;

          return (
            <div
              key={step.num}
              className={`p-2.5 rounded-lg border transition-all relative ${
                isCurrent
                  ? 'bg-amber-500/15 border-amber-500/60 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/30'
                  : isPassed
                  ? 'bg-emerald-950/30 border-emerald-500/40 opacity-90'
                  : 'bg-[#0a0a0c]/80 border-[#27272a] opacity-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    isCurrent
                      ? 'bg-amber-500 text-black font-bold animate-pulse'
                      : isPassed
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {isPassed ? '✓ CONCLUÍDO' : `PASSO 0${step.num}`}
                </span>
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isCurrent
                      ? 'text-amber-400 animate-bounce'
                      : isPassed
                      ? 'text-emerald-400'
                      : 'text-zinc-500'
                  }`}
                />
              </div>
              <h4
                className={`text-[11px] font-mono font-bold line-clamp-1 ${
                  isCurrent ? 'text-amber-200' : isPassed ? 'text-emerald-200' : 'text-zinc-400'
                }`}
              >
                {step.title}
              </h4>
              <p className="text-[9.5px] font-mono text-zinc-400 line-clamp-2 mt-0.5 leading-tight">
                {step.subtitle}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
