/**
 * Relatório Técnico Pós-Impacto e Análise Balística Terminal
 * Apogeu, tempo de voo, velocidade terminal, energia cinética (Ek = 0.5 mv²),
 * erro de mira e ensaio estocástico Monte Carlo de CEP 50% / 95%.
 */

import React, { useState } from 'react';
import { SimulationSummary, ProjectileConfig, PlanetaryEnvironment, MonteCarloResult } from '../types/physics';
import { runMonteCarloSimulation } from '../physics/monteCarlo';
import { 
  FileText, 
  Target, 
  Flame, 
  Gauge, 
  Compass, 
  Clock, 
  Zap, 
  Layers, 
  ArrowUpRight,
  TrendingDown,
  ScatterChart as ScatterIcon,
  RefreshCw,
  Award
} from 'lucide-react';

interface PostFlightReportProps {
  summary: SimulationSummary | null;
  projectile: ProjectileConfig;
  environment: PlanetaryEnvironment;
}

export const PostFlightReport: React.FC<PostFlightReportProps> = ({
  summary,
  projectile,
  environment,
}) => {
  const [monteCarloResult, setMonteCarloResult] = useState<MonteCarloResult | null>(null);
  const [isCalculatingMonteCarlo, setIsCalculatingMonteCarlo] = useState<boolean>(false);

  if (!summary) {
    return (
      <div className="p-8 bg-[#121215] border border-[#27272a] rounded-xl text-center">
        <FileText className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
        <p className="text-sm font-mono text-zinc-400">
          O relatório pós-impacto será gerado automaticamente quando o projétil atingir o solo ou quando o cálculo for finalizado.
        </p>
      </div>
    );
  }

  // Executar simulação Monte Carlo
  const handleRunMonteCarlo = () => {
    setIsCalculatingMonteCarlo(true);
    setTimeout(() => {
      try {
        const res = runMonteCarloSimulation(projectile, environment, 30);
        setMonteCarloResult(res);
      } finally {
        setIsCalculatingMonteCarlo(false);
      }
    }, 50);
  };

  const kineticEnergyMJ = summary.impactKineticEnergy / 1e6;
  const targetKm = projectile.targetRangeKm;
  const actualKm = summary.totalRange / 1000;
  const errorMeters = Math.abs(summary.totalRange - targetKm * 1000);

  return (
    <div className="space-y-4 p-4 bg-[#121215] border border-[#27272a] rounded-xl shadow-xl">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#27272a] pb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-zinc-100">RELATÓRIO_BALÍSTICO_&_ANÁLISE_TERMINAL</h3>
            <p className="text-xs font-mono text-zinc-400">Resumo cinemático, termodinâmico e estocástico do impacto</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-xs font-mono font-bold flex items-center gap-1">
            <Award className="w-3.5 h-3.5" />
            VOO_CONCLUÍDO
          </span>
        </div>
      </div>

      {/* Grid de Métricas Chave do Impacto */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {/* 1. Alcance Total Percorrido */}
        <div className="p-3 bg-[#0a0a0c] border border-[#27272a] rounded">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono mb-1">
            <span>Alcance Efetivo</span>
            <Compass className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-lg font-mono font-bold text-zinc-100">
            {actualKm.toFixed(2)} <span className="text-xs font-normal text-zinc-400">km</span>
          </div>
          <div className="text-[10px] font-mono text-zinc-400 mt-1">
            Alvo: {targetKm.toFixed(1)} km (Erro: {(errorMeters / 1000).toFixed(2)} km)
          </div>
        </div>

        {/* 2. Apogeu Máximo */}
        <div className="p-3 bg-[#0a0a0c] border border-[#27272a] rounded">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono mb-1">
            <span>Apogeu Máximo (H_max)</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-lg font-mono font-bold text-zinc-100">
            {(summary.maxAltitude / 1000).toFixed(2)} <span className="text-xs font-normal text-zinc-400">km</span>
          </div>
          <div className="text-[10px] font-mono text-zinc-400 mt-1">
            Aos T+ {summary.apogeeTime.toFixed(1)} s
          </div>
        </div>

        {/* 3. Tempo Total de Voo */}
        <div className="p-3 bg-[#0a0a0c] border border-[#27272a] rounded">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono mb-1">
            <span>Tempo Total de Voo</span>
            <Clock className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-lg font-mono font-bold text-zinc-100">
            {summary.totalFlightTime.toFixed(1)} <span className="text-xs font-normal text-zinc-400">s</span>
          </div>
          <div className="text-[10px] font-mono text-zinc-400 mt-1">
            ({(summary.totalFlightTime / 60).toFixed(2)} min)
          </div>
        </div>

        {/* 4. Velocidade Terminal de Impacto */}
        <div className="p-3 bg-[#0a0a0c] border border-[#27272a] rounded">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono mb-1">
            <span>Velocidade de Impacto</span>
            <Gauge className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-lg font-mono font-bold text-zinc-100">
            {summary.impactSpeed.toFixed(1)} <span className="text-xs font-normal text-zinc-400">m/s</span>
          </div>
          <div className="text-[10px] font-mono text-zinc-400 mt-1">
            {(summary.impactSpeed * 3.6).toFixed(0)} km/h | Ângulo: {summary.impactAngleDeg.toFixed(1)}°
          </div>
        </div>

        {/* 5. Energia Cinética no Impacto */}
        <div className="p-3 bg-[#0a0a0c] border border-[#27272a] rounded">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono mb-1">
            <span>Energia Cinética (½mv²)</span>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-lg font-mono font-bold text-amber-400">
            {kineticEnergyMJ >= 1000 ? `${(kineticEnergyMJ / 1000).toFixed(2)} GJ` : `${kineticEnergyMJ.toFixed(2)} MJ`}
          </div>
          <div className="text-[10px] font-mono text-zinc-400 mt-1">
            Equiv. Mecânica: {summary.impactTntEquivalentKg.toFixed(2)} kg TNT
          </div>
        </div>

        {/* 6. Velocidade Máxima e Mach */}
        <div className="p-3 bg-[#0a0a0c] border border-[#27272a] rounded">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono mb-1">
            <span>Velocidade Máx / Mach</span>
            <Flame className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-lg font-mono font-bold text-zinc-100">
            {summary.maxSpeed.toFixed(0)} <span className="text-xs font-normal text-zinc-400">m/s</span>
          </div>
          <div className="text-[10px] font-mono text-zinc-400 mt-1">
            Mach Máx: {summary.maxMach.toFixed(2)}
          </div>
        </div>

        {/* 7. Desvio Lateral de Vento */}
        <div className="p-3 bg-[#0a0a0c] border border-[#27272a] rounded">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono mb-1">
            <span>Desvio Lateral</span>
            <TrendingDown className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-lg font-mono font-bold text-zinc-100">
            {summary.lateralDeviation.toFixed(1)} <span className="text-xs font-normal text-zinc-400">m</span>
          </div>
          <div className="text-[10px] font-mono text-zinc-400 mt-1">
            Desvio azimutal terminal
          </div>
        </div>

        {/* 8. Carga G Máxima */}
        <div className="p-3 bg-[#0a0a0c] border border-[#27272a] rounded">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono mb-1">
            <span>Carga Dinâmica Máx</span>
            <Layers className="w-3.5 h-3.5 text-red-400" />
          </div>
          <div className="text-lg font-mono font-bold text-red-400">
            {summary.maxGForce.toFixed(2)} <span className="text-xs font-normal text-zinc-400">g</span>
          </div>
          <div className="text-[10px] font-mono text-zinc-400 mt-1">
            Max Q: {(summary.maxDynamicPressure / 1000).toFixed(1)} kPa
          </div>
        </div>
      </div>

      {/* Seção Estocástica de Dispersão e Erro Circular Provável (CEP) */}
      <div className="p-4 bg-[#0a0a0c] border border-[#27272a] rounded-xl space-y-3 font-mono">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#27272a] pb-2.5">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-400" />
            <div>
              <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                Análise de Dispersão Estocástica e CEP (Monte Carlo)
              </h4>
              <p className="text-[11px] text-zinc-400">
                Calcula o Erro Circular Provável (CEP) simulando 30 disparos com rajadas e perturbações gaussianas
              </p>
            </div>
          </div>

          <button
            id="btn-run-monte-carlo"
            onClick={handleRunMonteCarlo}
            disabled={isCalculatingMonteCarlo}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 disabled:opacity-50 text-xs font-bold rounded shadow transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCalculatingMonteCarlo ? 'animate-spin' : ''}`} />
            <span>{isCalculatingMonteCarlo ? 'Calculando...' : 'Executar Ensaio CEP (30x)'}</span>
          </button>
        </div>

        {monteCarloResult ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="p-3 bg-[#121215] border border-[#27272a] rounded">
              <span className="text-xs text-zinc-400 block mb-1">CEP 50% (Raio Mediano)</span>
              <div className="text-xl font-mono font-bold text-amber-400">
                {monteCarloResult.cep50 >= 1000
                  ? `${(monteCarloResult.cep50 / 1000).toFixed(2)} km`
                  : `${monteCarloResult.cep50.toFixed(1)} m`}
              </div>
              <span className="text-[10px] text-zinc-500 mt-1 block">
                50% dos projéteis caem dentro deste círculo
              </span>
            </div>

            <div className="p-3 bg-[#121215] border border-[#27272a] rounded">
              <span className="text-xs text-zinc-400 block mb-1">CEP 95% (Intervalo de Confiança)</span>
              <div className="text-xl font-mono font-bold text-amber-300">
                {monteCarloResult.cep95 >= 1000
                  ? `${(monteCarloResult.cep95 / 1000).toFixed(2)} km`
                  : `${monteCarloResult.cep95.toFixed(1)} m`}
              </div>
              <span className="text-[10px] text-zinc-500 mt-1 block">
                95% de probabilidade de impacto contido
              </span>
            </div>

            <div className="p-3 bg-[#121215] border border-[#27272a] rounded">
              <span className="text-xs text-zinc-400 block mb-1">Desvio Padrão Longitudinal / Lateral</span>
              <div className="text-sm font-mono font-bold text-zinc-200">
                σ_X: {monteCarloResult.stdDevRange.toFixed(1)} m | σ_Z: {monteCarloResult.stdDevLateral.toFixed(1)} m
              </div>
              <span className="text-[10px] text-zinc-500 mt-1 block">
                Alcance Médio: {(monteCarloResult.meanRange / 1000).toFixed(2)} km
              </span>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-[#121215] border border-dashed border-[#27272a] rounded text-center text-xs text-zinc-400">
            Clique no botão acima para rodar a simulação estocástica de Monte Carlo e gerar as métricas de dispersão balística (CEP).
          </div>
        )}
      </div>
    </div>
  );
};
