/**
 * Painel de Telemetria e Indicadores Dinâmicos em Tempo Real
 * Exibe instrumentos aeroespaciais com precisão científica e unidades físicas explícitas.
 */

import React from 'react';
import { TelemetryPoint, FlightPhase } from '../types/physics';
import { 
  Gauge, 
  ArrowUpRight, 
  Flame, 
  Weight, 
  Wind, 
  ShieldAlert, 
  Zap, 
  Compass, 
  Radio,
  Timer
} from 'lucide-react';

interface TelemetryHUDProps {
  telemetry: TelemetryPoint | null;
  maxAltitude: number;
  maxSpeed: number;
}

export const TelemetryHUD: React.FC<TelemetryHUDProps> = ({
  telemetry,
  maxAltitude,
  maxSpeed,
}) => {
  if (!telemetry) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg animate-pulse">
            <div className="h-3 w-16 bg-slate-800 rounded mb-2" />
            <div className="h-6 w-24 bg-slate-700 rounded" />
          </div>
        ))}
      </div>
    );
  }

  // Cor do badge de fase
  const getPhaseBadge = (phase: FlightPhase) => {
    switch (phase) {
      case 'pronto':
        return { text: 'PRONTO NA RAMPA', bg: 'bg-zinc-800 text-zinc-300 border-[#27272a]' };
      case 'propulsao':
        return { text: 'BOOST / PROPULSÃO', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse' };
      case 'inercial':
        return { text: 'VOO INERCIAL LIVRE', bg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' };
      case 'apogeu':
        return { text: 'APOGEU ORBITAL', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
      case 'reentrada':
        return { text: 'REENTRADA ATMOSFÉRICA', bg: 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse' };
      case 'impactado':
        return { text: 'IMPACTO TERMINAL', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' };
      case 'destruido':
        return { text: 'CRÍTICO / FORÇAS EXTREMAS', bg: 'bg-red-950/60 text-red-300 border-red-700' };
      default:
        return { text: 'EM VOO', bg: 'bg-zinc-800 text-zinc-300 border-[#27272a]' };
    }
  };

  const phaseBadge = getPhaseBadge(telemetry.phase);
  const kmh = telemetry.speed * 3.6;

  return (
    <div className="space-y-2.5">
      {/* Barra de Status Superior com Fase e Tempo */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 bg-[#121215] border border-[#27272a] rounded-lg shadow-md">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="text-xs font-mono font-bold tracking-wider text-zinc-200 uppercase">
            TELEMETRIA_EM_TEMPO_REAL (T+ {telemetry.time.toFixed(1)}s)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 text-[11px] font-mono font-bold uppercase rounded border ${phaseBadge.bg}`}>
            {phaseBadge.text}
          </span>
          <span className="text-xs font-mono text-zinc-400 bg-[#0a0a0c] px-2 py-0.5 rounded border border-[#27272a]">
            Estágio: {telemetry.currentStageIndex >= 0 ? `#${telemetry.currentStageIndex + 1}` : 'Carga Útil'}
          </span>
        </div>
      </div>

      {/* Grid de Medidores Numéricos Científicos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* 1. Altitude */}
        <div className="p-3 bg-[#121215] border border-[#27272a] rounded-lg hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1 font-mono">
            <span className="font-medium">Altitude (h)</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-lg md:text-xl font-mono font-bold text-zinc-100">
            {telemetry.y >= 10000 
              ? `${(telemetry.y / 1000).toFixed(2)} km` 
              : `${telemetry.y.toFixed(0)} m`}
          </div>
          <div className="text-[10px] font-mono text-zinc-500 mt-1">
            Máx: {(maxAltitude / 1000).toFixed(1)} km
          </div>
        </div>

        {/* 2. Velocidade e Mach */}
        <div className="p-3 bg-[#121215] border border-[#27272a] rounded-lg hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1 font-mono">
            <span className="font-medium">Velocidade (v)</span>
            <Gauge className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-lg md:text-xl font-mono font-bold text-zinc-100">
            {telemetry.speed.toFixed(0)} <span className="text-xs font-normal text-zinc-500 font-mono">m/s</span>
          </div>
          <div className="text-[10px] font-mono text-zinc-400 mt-1 flex justify-between">
            <span className="text-amber-400">Mach {telemetry.mach.toFixed(2)}</span>
            <span>{(kmh).toFixed(0)} km/h</span>
          </div>
        </div>

        {/* 3. Aceleração / Força G */}
        <div className="p-3 bg-[#121215] border border-[#27272a] rounded-lg hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1 font-mono">
            <span className="font-medium">Aceleração (g)</span>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-lg md:text-xl font-mono font-bold text-amber-400">
            {telemetry.gForce.toFixed(2)} <span className="text-xs font-normal text-zinc-500 font-mono">g</span>
          </div>
          <div className="text-[10px] font-mono text-zinc-500 mt-1">
            acc: {telemetry.acceleration.toFixed(1)} m/s²
          </div>
        </div>

        {/* 4. Alcance Horizontal */}
        <div className="p-3 bg-[#121215] border border-[#27272a] rounded-lg hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1 font-mono">
            <span className="font-medium">Alcance Superfície</span>
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-lg md:text-xl font-mono font-bold text-zinc-100">
            {(telemetry.x / 1000).toFixed(2)} <span className="text-xs font-normal text-zinc-500 font-mono">km</span>
          </div>
          <div className="text-[10px] font-mono text-zinc-500 mt-1">
            Desvio: {telemetry.lateralDeviation.toFixed(1)} m
          </div>
        </div>

        {/* 5. Massa Restante */}
        <div className="p-3 bg-[#121215] border border-[#27272a] rounded-lg hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1 font-mono">
            <span className="font-medium">Massa Atual</span>
            <Weight className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-lg md:text-xl font-mono font-bold text-zinc-100">
            {telemetry.mass.toFixed(0)} <span className="text-xs font-normal text-zinc-500 font-mono">kg</span>
          </div>
          <div className="text-[10px] font-mono text-zinc-500 mt-1 flex justify-between">
            <span>Empuxo: {(telemetry.thrustForce / 1000).toFixed(1)} kN</span>
          </div>
        </div>

        {/* 6. Pressão Dinâmica & Fluxo Térmico */}
        <div className="p-3 bg-[#121215] border border-[#27272a] rounded-lg hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1 font-mono">
            <span className="font-medium">Pressão Dinâmica</span>
            <Flame className="w-3.5 h-3.5 text-red-400" />
          </div>
          <div className="text-lg md:text-xl font-mono font-bold text-zinc-100">
            {(telemetry.dynamicPressure / 1000).toFixed(1)} <span className="text-xs font-normal text-zinc-500 font-mono">kPa</span>
          </div>
          <div className="text-[10px] font-mono text-zinc-500 mt-1">
            Arrasto: {(telemetry.dragForce / 1000).toFixed(1)} kN
          </div>
        </div>
      </div>
    </div>
  );
};
