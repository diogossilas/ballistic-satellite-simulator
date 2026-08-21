/**
 * Painel de Gráficos Físicos Dinâmicos e Curvas de Desempenho
 * Renderiza gráficos sincronizados de Altitude vs Tempo, Velocidade vs Altitude,
 * Decomposição de Forças e Carga G.
 */

import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { TelemetryPoint } from '../types/physics';
import { LineChart as ChartIcon, Zap, Activity, Flame } from 'lucide-react';

interface ChartsPanelProps {
  telemetryHistory: TelemetryPoint[];
}

export const ChartsPanel: React.FC<ChartsPanelProps> = ({ telemetryHistory }) => {
  const [activeTab, setActiveTab] = useState<'altitude' | 'velocity' | 'forces' | 'acceleration'>('altitude');

  // Amostragem de dados para manter renderização fluida mesmo com milhares de pontos
  const sampledData = React.useMemo(() => {
    if (telemetryHistory.length <= 150) return telemetryHistory;
    const step = Math.ceil(telemetryHistory.length / 150);
    const sampled: TelemetryPoint[] = [];
    for (let i = 0; i < telemetryHistory.length; i += step) {
      sampled.push(telemetryHistory[i]);
    }
    // Garante que o último ponto está presente
    if (sampled[sampled.length - 1] !== telemetryHistory[telemetryHistory.length - 1]) {
      sampled.push(telemetryHistory[telemetryHistory.length - 1]);
    }
    return sampled;
  }, [telemetryHistory]);

  const formattedData = React.useMemo(() => {
    return sampledData.map((pt) => ({
      time: Number(pt.time.toFixed(1)),
      altitudeKm: Number((pt.y / 1000).toFixed(2)),
      speedMs: Number(pt.speed.toFixed(1)),
      mach: Number(pt.mach.toFixed(2)),
      gForce: Number(pt.gForce.toFixed(2)),
      thrustKn: Number((pt.thrustForce / 1000).toFixed(1)),
      dragKn: Number((pt.dragForce / 1000).toFixed(1)),
      gravityKn: Number((pt.gravityForce / 1000).toFixed(1)),
      dynamicPressureKpa: Number((pt.dynamicPressure / 1000).toFixed(1)),
    }));
  }, [sampledData]);

  if (telemetryHistory.length < 2) {
    return (
      <div className="p-8 bg-[#121215] border border-[#27272a] rounded-xl text-center">
        <ChartIcon className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
        <p className="text-sm font-mono text-zinc-400">Aguardando dados de telemetria da simulação para plotar curvas físicas...</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-[#121215] border border-[#27272a] rounded-xl space-y-4 shadow-xl">
      {/* Abas dos Gráficos */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#27272a] pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-zinc-200">ANÁLISE_GRÁFICA_DETERMINÍSTICA</h3>
        </div>

        <div className="flex items-center gap-1 bg-[#0a0a0c] p-1 rounded border border-[#27272a]">
          <button
            id="tab-chart-alt"
            onClick={() => setActiveTab('altitude')}
            className={`px-2.5 py-1 text-xs font-mono font-medium rounded transition-colors ${
              activeTab === 'altitude'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Altitude vs Tempo
          </button>

          <button
            id="tab-chart-vel"
            onClick={() => setActiveTab('velocity')}
            className={`px-2.5 py-1 text-xs font-mono font-medium rounded transition-colors ${
              activeTab === 'velocity'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Velocidade & Mach
          </button>

          <button
            id="tab-chart-forces"
            onClick={() => setActiveTab('forces')}
            className={`px-2.5 py-1 text-xs font-mono font-medium rounded transition-colors ${
              activeTab === 'forces'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Decomposição Forças
          </button>

          <button
            id="tab-chart-acc"
            onClick={() => setActiveTab('acceleration')}
            className={`px-2.5 py-1 text-xs font-mono font-medium rounded transition-colors ${
              activeTab === 'acceleration'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Força G & Cargas
          </button>
        </div>
      </div>

      {/* Área do Gráfico */}
      <div className="h-[280px] w-full font-mono">
        <ResponsiveContainer width="100%" height="100%">
          {activeTab === 'altitude' ? (
            <LineChart data={formattedData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.6} />
              <XAxis dataKey="time" stroke="#71717a" tick={{ fontSize: 11 }} label={{ value: 'Tempo (s)', position: 'insideBottomRight', offset: -5, fill: '#71717a', fontSize: 11 }} />
              <YAxis stroke="#71717a" tick={{ fontSize: 11 }} label={{ value: 'Altitude (km)', angle: -90, position: 'insideLeft', fill: '#71717a', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0a0a0c', borderColor: '#27272a', borderRadius: '6px', color: '#f4f4f5', fontSize: '12px', fontFamily: 'monospace' }}
                labelFormatter={(v) => `Tempo: ${v} s`}
              />
              <Line type="monotone" dataKey="altitudeKm" name="Altitude (km)" stroke="#f59e0b" strokeWidth={2.5} dot={false} />
            </LineChart>
          ) : activeTab === 'velocity' ? (
            <LineChart data={formattedData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.6} />
              <XAxis dataKey="time" stroke="#71717a" tick={{ fontSize: 11 }} label={{ value: 'Tempo (s)', position: 'insideBottomRight', offset: -5, fill: '#71717a', fontSize: 11 }} />
              <YAxis yAxisId="left" stroke="#10b981" tick={{ fontSize: 11 }} label={{ value: 'Velocidade (m/s)', angle: -90, position: 'insideLeft', fill: '#10b981', fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" stroke="#06b6d4" tick={{ fontSize: 11 }} label={{ value: 'Número de Mach', angle: 90, position: 'insideRight', fill: '#06b6d4', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0a0a0c', borderColor: '#27272a', borderRadius: '6px', color: '#f4f4f5', fontSize: '12px', fontFamily: 'monospace' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Line yAxisId="left" type="monotone" dataKey="speedMs" name="Velocidade (m/s)" stroke="#10b981" strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="mach" name="Mach" stroke="#06b6d4" strokeWidth={2} strokeDasharray="4 4" dot={false} />
            </LineChart>
          ) : activeTab === 'forces' ? (
            <LineChart data={formattedData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.6} />
              <XAxis dataKey="time" stroke="#71717a" tick={{ fontSize: 11 }} label={{ value: 'Tempo (s)', position: 'insideBottomRight', offset: -5, fill: '#71717a', fontSize: 11 }} />
              <YAxis stroke="#71717a" tick={{ fontSize: 11 }} label={{ value: 'Força (kN)', angle: -90, position: 'insideLeft', fill: '#71717a', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0a0a0c', borderColor: '#27272a', borderRadius: '6px', color: '#f4f4f5', fontSize: '12px', fontFamily: 'monospace' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Line type="monotone" dataKey="thrustKn" name="Empuxo T (kN)" stroke="#f59e0b" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="dragKn" name="Arrasto Fd (kN)" stroke="#ef4444" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="gravityKn" name="Gravidade Fg (kN)" stroke="#eab308" strokeWidth={1.5} dot={false} />
            </LineChart>
          ) : (
            <LineChart data={formattedData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.6} />
              <XAxis dataKey="time" stroke="#71717a" tick={{ fontSize: 11 }} label={{ value: 'Tempo (s)', position: 'insideBottomRight', offset: -5, fill: '#71717a', fontSize: 11 }} />
              <YAxis yAxisId="left" stroke="#f59e0b" tick={{ fontSize: 11 }} label={{ value: 'Força G (g)', angle: -90, position: 'insideLeft', fill: '#f59e0b', fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" stroke="#a855f7" tick={{ fontSize: 11 }} label={{ value: 'Pressão Dinâmica (kPa)', angle: 90, position: 'insideRight', fill: '#a855f7', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0a0a0c', borderColor: '#27272a', borderRadius: '6px', color: '#f4f4f5', fontSize: '12px', fontFamily: 'monospace' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Line yAxisId="left" type="monotone" dataKey="gForce" name="Carga G (g)" stroke="#f59e0b" strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="dynamicPressureKpa" name="Pressão Dinâmica q (kPa)" stroke="#a855f7" strokeWidth={1.5} dot={false} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
