/**
 * Construtor Interativo de Projéteis e Veículos Aeroespaciais Fictícios
 * Permite configurar múltiplos estágios, propelente, empuxo, Isp, aerodinâmica e programa de voo.
 */

import React, { useState } from 'react';
import { ProjectileConfig, RocketStage, NoseConeType } from '../types/physics';
import { CONSTANTS } from '../physics/constants';
import { 
  Rocket, 
  Plus, 
  Trash2, 
  Layers, 
  Sliders, 
  Sparkles, 
  Shield, 
  Compass,
  Gauge
} from 'lucide-react';

interface ProjectileBuilderProps {
  projectile: ProjectileConfig;
  onChangeProjectile: (updated: ProjectileConfig) => void;
  disabled?: boolean;
}

export const ProjectileBuilder: React.FC<ProjectileBuilderProps> = ({
  projectile,
  onChangeProjectile,
  disabled = false,
}) => {
  const [activeStageTab, setActiveStageTab] = useState<number>(0);

  // Calcula massa total inicial e Delta-V teórico de Tsiolkovsky
  const totalDryMass = projectile.payloadMass + projectile.stages.reduce((acc, s) => acc + s.dryMass, 0);
  const totalPropellantMass = projectile.stages.reduce((acc, s) => acc + s.propellantMass, 0);
  const totalWetMass = totalDryMass + totalPropellantMass;

  // Delta-V em estágios: sum(Isp_i * g0 * ln(m0_i / mf_i))
  let theoreticalTotalDeltaV = 0;
  let runningTotalMass = totalWetMass;

  projectile.stages.forEach((stage) => {
    const stageM0 = runningTotalMass;
    const stageMf = runningTotalMass - stage.propellantMass;
    if (stageMf > 0 && stage.isp > 0) {
      const dV = stage.isp * CONSTANTS.STANDARD_GRAVITY * Math.log(stageM0 / stageMf);
      theoreticalTotalDeltaV += dV;
    }
    // Desacopla massa seca para o próximo estágio
    runningTotalMass = stageMf - stage.dryMass;
  });

  // Modificar campo raiz do projétil
  const handleUpdateRoot = (field: keyof ProjectileConfig, value: any) => {
    onChangeProjectile({
      ...projectile,
      [field]: value,
    });
  };

  // Modificar estágio específico
  const handleUpdateStage = (index: number, field: keyof RocketStage, value: any) => {
    const updatedStages = projectile.stages.map((st, i) => {
      if (i !== index) return st;
      const updated = { ...st, [field]: value };

      // Se mudou empuxo, propelente ou Isp, recalcula burnTime: tb = m_prop / (T / (Isp * g0))
      if (field === 'thrust' || field === 'propellantMass' || field === 'isp') {
        const t = field === 'thrust' ? Number(value) : st.thrust;
        const p = field === 'propellantMass' ? Number(value) : st.propellantMass;
        const isp = field === 'isp' ? Number(value) : st.isp;
        if (t > 0 && isp > 0 && p > 0) {
          const mDot = t / (isp * CONSTANTS.STANDARD_GRAVITY);
          updated.burnTime = Number((p / mDot).toFixed(1));
        }
      }
      return updated;
    });

    onChangeProjectile({
      ...projectile,
      stages: updatedStages,
    });
  };

  // Adicionar novo estágio
  const handleAddStage = () => {
    const newStageNumber = projectile.stages.length + 1;
    const newStage: RocketStage = {
      id: `stage-${Date.now()}`,
      name: `Estágio ${newStageNumber}`,
      dryMass: 400,
      propellantMass: 2500,
      currentPropellantMass: 2500,
      thrust: 60000,
      isp: 300,
      burnTime: 122,
      area: 0.45,
      cd: 0.15,
      isSeparated: false,
    };
    onChangeProjectile({
      ...projectile,
      stages: [...projectile.stages, newStage],
    });
    setActiveStageTab(projectile.stages.length);
  };

  // Remover estágio
  const handleRemoveStage = (index: number) => {
    if (projectile.stages.length <= 1) return;
    const updatedStages = projectile.stages.filter((_, i) => i !== index);
    onChangeProjectile({
      ...projectile,
      stages: updatedStages,
    });
    setActiveStageTab(Math.max(0, index - 1));
  };

  const activeStage = projectile.stages[activeStageTab] || projectile.stages[0];

  return (
    <div className="space-y-4 p-4 bg-[#121215] border border-[#27272a] rounded-xl shadow-xl">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#27272a] pb-3">
        <div className="flex items-center gap-2">
          <Rocket className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-zinc-100">CONFIGURADOR_DE_VEÍCULO</h3>
            <p className="text-xs font-mono text-zinc-400">Engenharia de estágios, queima de propelente e aerodinâmica</p>
          </div>
        </div>

        {/* Resumo Teórico do Foguete */}
        <div className="flex items-center gap-3 bg-[#0a0a0c] px-3 py-1.5 rounded border border-[#27272a] font-mono text-xs">
          <div>
            <span className="text-zinc-400">Massa Total: </span>
            <span className="font-bold text-zinc-200">{totalWetMass.toFixed(0)} kg</span>
          </div>
          <div className="w-[1px] h-3.5 bg-[#27272a]" />
          <div>
            <span className="text-zinc-400">Δv Teórico: </span>
            <span className="font-bold text-amber-400">{theoreticalTotalDeltaV.toFixed(0)} m/s</span>
          </div>
        </div>
      </div>

      {/* Parâmetros Gerais e Geometria da Ogiva */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-mono font-medium text-zinc-300 mb-1">Nome do Veículo</label>
          <input
            type="text"
            value={projectile.name}
            disabled={disabled}
            onChange={(e) => handleUpdateRoot('name', e.target.value)}
            className="w-full px-3 py-1.5 bg-[#0a0a0c] border border-[#27272a] rounded text-xs font-mono text-zinc-100 focus:outline-none focus:border-amber-500 disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-xs font-mono font-medium text-zinc-300 mb-1">Carga Útil no Topo (kg)</label>
          <input
            type="number"
            min="1"
            max="10000"
            value={projectile.payloadMass}
            disabled={disabled}
            onChange={(e) => handleUpdateRoot('payloadMass', Math.max(1, Number(e.target.value)))}
            className="w-full px-3 py-1.5 bg-[#0a0a0c] border border-[#27272a] rounded text-xs font-mono text-zinc-100 focus:outline-none focus:border-amber-500 disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-xs font-mono font-medium text-zinc-300 mb-1">Geometria da Ogiva (Nose Cone)</label>
          <select
            value={projectile.noseCone}
            disabled={disabled}
            onChange={(e) => handleUpdateRoot('noseCone', e.target.value as NoseConeType)}
            className="w-full px-3 py-1.5 bg-[#0a0a0c] border border-[#27272a] rounded text-xs font-mono text-zinc-100 focus:outline-none focus:border-amber-500 disabled:opacity-50"
          >
            <option value="pontiagudo">Pontiagudo (Menor arrasto supersônico - Cd x0.85)</option>
            <option value="ogival">Ogival Von Kármán (Padrão aeroespacial - Cd x1.0)</option>
            <option value="conico">Cônico Simples (Cd x1.15)</option>
            <option value="rombudo">Rombudo / Cápsula (Alto arrasto - Cd x1.8)</option>
          </select>
        </div>
      </div>

      {/* Ângulo de Lançamento e Pitch Program */}
      <div className="p-3 bg-[#0a0a0c] border border-[#27272a] rounded-lg space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-zinc-200">
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span>Perfil de Lançamento & Orientação de Voo (Pitch Program)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <div className="flex justify-between text-xs text-zinc-400 mb-1 font-mono">
              <span>Ângulo Inicial (θ₀):</span>
              <span className="font-mono text-amber-400">{projectile.launchAngleDeg}°</span>
            </div>
            <input
              type="range"
              min="10"
              max="90"
              step="1"
              value={projectile.launchAngleDeg}
              disabled={disabled}
              onChange={(e) => handleUpdateRoot('launchAngleDeg', Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-zinc-400 mb-1 font-mono">
              <span>Tempo de Inclinação:</span>
              <span className="font-mono text-amber-400">{projectile.pitchKickTime} s</span>
            </div>
            <input
              type="range"
              min="1"
              max="60"
              step="1"
              value={projectile.pitchKickTime}
              disabled={disabled}
              onChange={(e) => handleUpdateRoot('pitchKickTime', Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-zinc-400 mb-1 font-mono">
              <span>Ângulo Alvo da Curva:</span>
              <span className="font-mono text-amber-400">{projectile.pitchKickAngleDeg}°</span>
            </div>
            <input
              type="range"
              min="10"
              max="85"
              step="1"
              value={projectile.pitchKickAngleDeg}
              disabled={disabled}
              onChange={(e) => handleUpdateRoot('pitchKickAngleDeg', Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-zinc-400 mb-1 font-mono">
              <span>Alcance Alvo Projetado:</span>
              <span className="font-mono text-amber-400">{projectile.targetRangeKm} km</span>
            </div>
            <input
              type="range"
              min="10"
              max="8000"
              step="10"
              value={projectile.targetRangeKm}
              disabled={disabled}
              onChange={(e) => handleUpdateRoot('targetRangeKm', Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Gerenciamento de Estágios */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          {/* Abas dos estágios */}
          <div className="flex items-center gap-1.5">
            {projectile.stages.map((stage, idx) => (
              <button
                key={stage.id}
                id={`tab-stage-${idx}`}
                onClick={() => setActiveStageTab(idx)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded transition-colors border ${
                  activeStageTab === idx
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-[#0a0a0c] text-zinc-400 border-[#27272a] hover:text-zinc-200'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>Estágio {idx + 1}</span>
              </button>
            ))}

            {projectile.stages.length < 3 && (
              <button
                id="btn-add-stage"
                onClick={handleAddStage}
                disabled={disabled}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-[#0a0a0c] hover:bg-[#18181c] disabled:opacity-40 text-zinc-400 hover:text-amber-400 text-xs font-mono font-medium rounded border border-dashed border-[#27272a] transition-colors"
                title="Adicionar novo estágio em série"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Estágio</span>
              </button>
            )}
          </div>

          {projectile.stages.length > 1 && (
            <button
              id="btn-remove-stage"
              onClick={() => handleRemoveStage(activeStageTab)}
              disabled={disabled}
              className="flex items-center gap-1 px-2 py-1 text-xs font-mono text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded transition-colors"
              title="Remover este estágio"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remover Estágio</span>
            </button>
          )}
        </div>

        {/* Parâmetros do Estágio Ativo */}
        {activeStage && (
          <div className="p-3.5 bg-[#0a0a0c] border border-[#27272a] rounded-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">Empuxo do Motor (N)</label>
              <input
                type="number"
                min="1000"
                max="10000000"
                step="5000"
                value={activeStage.thrust}
                disabled={disabled}
                onChange={(e) => handleUpdateStage(activeStageTab, 'thrust', Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-[#121215] border border-[#27272a] rounded text-xs font-mono text-zinc-100 focus:border-amber-500"
              />
              <span className="text-[10px] font-mono text-zinc-500 mt-0.5 block">
                {(activeStage.thrust / 1000).toFixed(1)} kN
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">Massa de Propelente (kg)</label>
              <input
                type="number"
                min="1"
                max="100000"
                step="100"
                value={activeStage.propellantMass}
                disabled={disabled}
                onChange={(e) => handleUpdateStage(activeStageTab, 'propellantMass', Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-[#121215] border border-[#27272a] rounded text-xs font-mono text-zinc-100 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">Massa Seca Estrutural (kg)</label>
              <input
                type="number"
                min="0"
                max="50000"
                step="50"
                value={activeStage.dryMass}
                disabled={disabled}
                onChange={(e) => handleUpdateStage(activeStageTab, 'dryMass', Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-[#121215] border border-[#27272a] rounded text-xs font-mono text-zinc-100 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">Impulso Específico Isp (s)</label>
              <input
                type="number"
                min="100"
                max="500"
                step="5"
                value={activeStage.isp}
                disabled={disabled}
                onChange={(e) => handleUpdateStage(activeStageTab, 'isp', Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-[#121215] border border-[#27272a] rounded text-xs font-mono text-zinc-100 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">Tempo de Queima (s)</label>
              <input
                type="number"
                step="0.5"
                value={activeStage.burnTime}
                disabled
                className="w-full px-3 py-1.5 bg-[#121215]/60 border border-[#27272a] rounded text-xs font-mono text-zinc-500 cursor-not-allowed"
              />
              <span className="text-[10px] font-mono text-zinc-500 mt-0.5 block">
                Calculado: m_prop / (T / (Isp · g₀))
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">Área da Seção Transversal A (m²)</label>
              <input
                type="number"
                min="0.005"
                max="10"
                step="0.01"
                value={activeStage.area}
                disabled={disabled}
                onChange={(e) => handleUpdateStage(activeStageTab, 'area', Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-[#121215] border border-[#27272a] rounded text-xs font-mono text-zinc-100 focus:border-amber-500"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
