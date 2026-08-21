/**
 * Seletor de Cenários Educacionais Pré-Configurados
 * 1. Projétil de Artilharia Clássica
 * 2. Voo Suborbital de Média Distância
 * 3. Efeito do Vento Cruzado e Coriolis
 * 4. Influência do Coeficiente Aerodinâmico (Cd)
 * 5. Lançamento com Múltiplos Estágios
 * 6. Ensaio Estocástico de Dispersão (CEP)
 */

import React from 'react';
import { PRESET_SCENARIOS } from '../data/presets';
import { PresetScenario } from '../types/physics';
import { BookOpen, CheckCircle, ArrowRight, Sparkles, Orbit, Wind, Layers } from 'lucide-react';

interface PresetScenariosProps {
  selectedPresetId: string;
  onSelectPreset: (preset: PresetScenario) => void;
  disabled?: boolean;
}

export const PresetScenarios: React.FC<PresetScenariosProps> = ({
  selectedPresetId,
  onSelectPreset,
  disabled = false,
}) => {
  return (
    <div className="space-y-4 p-4 bg-[#121215] border border-[#27272a] rounded-xl shadow-xl">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-zinc-100">CENÁRIOS_DIDÁTICOS_PRÉ_CONFIGURADOS</h3>
            <p className="text-xs font-mono text-zinc-400">Casos de estudo concebidos para demonstrar leis físicas específicas</p>
          </div>
        </div>
      </div>

      {/* Grid de Cards de Cenários */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {PRESET_SCENARIOS.map((preset) => {
          const isSelected = selectedPresetId === preset.id;
          return (
            <div
              key={preset.id}
              onClick={() => !disabled && onSelectPreset(preset)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#18181c] border-amber-500/60 shadow-lg shadow-amber-950/20 ring-1 ring-amber-500/40'
                  : 'bg-[#0a0a0c] border-[#27272a] hover:border-amber-500/30 hover:bg-[#121215]'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div>
                {/* Cabeçalho do Card */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h4 className="text-xs font-mono font-bold text-zinc-100 leading-snug">{preset.title}</h4>
                  {isSelected && <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />}
                </div>

                <p className="text-[11px] font-mono text-amber-400 mb-2">{preset.subtitle}</p>

                <p className="text-xs text-zinc-300 line-clamp-3 mb-3 leading-relaxed">
                  {preset.description}
                </p>

                {/* Conceitos Físicos */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {preset.expectedOutcomes.physicsConcepts.map((concept, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 bg-[#121215] border border-[#27272a] text-zinc-400 text-[10px] font-mono rounded"
                    >
                      {concept}
                    </span>
                  ))}
                </div>
              </div>

              {/* Rodapé do Card com Valores Esperados */}
              <div className="pt-2.5 border-t border-[#27272a] flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span>Alcance: ~{preset.expectedOutcomes.approxRangeKm} km</span>
                <span className="text-amber-400">Apogeu: ~{preset.expectedOutcomes.approxApogeeKm} km</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
