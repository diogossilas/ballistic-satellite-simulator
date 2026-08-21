/**
 * Hook Especializado de Configurações e Cenários do Simulador
 * Responsabilidade única:
 * - Gerenciamento de estado do veículo (estágios, massa, aerodinâmica, empuxo)
 * - Gerenciamento de estado do ambiente planetário (gravidade, ISA, ventos)
 * - Seleção e aplicação de cenários pré-configurados
 * - Preferências de renderização (Modo de visualização, vetores, camadas atmosféricas, auto-follow)
 */

import { useState, useCallback, Dispatch, SetStateAction } from 'react';
import {
  ProjectileConfig,
  PlanetaryEnvironment,
  ViewMode,
  PresetScenario,
} from '../../types/physics';
import { PRESET_SCENARIOS } from '../../data/presets';

export interface UseSimulationConfigReturn {
  selectedPresetId: string;
  projectile: ProjectileConfig;
  environment: PlanetaryEnvironment;
  viewMode: ViewMode;
  showVectors: boolean;
  showAtmosphereLayers: boolean;
  autoFollow: boolean;
  setProjectile: Dispatch<SetStateAction<ProjectileConfig>>;
  setEnvironment: Dispatch<SetStateAction<PlanetaryEnvironment>>;
  setViewMode: (mode: ViewMode) => void;
  setShowVectors: Dispatch<SetStateAction<boolean>>;
  setShowAtmosphereLayers: Dispatch<SetStateAction<boolean>>;
  setAutoFollow: Dispatch<SetStateAction<boolean>>;
  applyPreset: (preset: PresetScenario) => { newProjectile: ProjectileConfig; newEnvironment: PlanetaryEnvironment };
}

export function useSimulationConfig(
  initialPresetIndex: number = 1
): UseSimulationConfigReturn {
  const defaultPreset = PRESET_SCENARIOS[initialPresetIndex] || PRESET_SCENARIOS[0];

  const [selectedPresetId, setSelectedPresetId] = useState<string>(defaultPreset.id);
  const [projectile, setProjectile] = useState<ProjectileConfig>(() => defaultPreset.projectile);
  const [environment, setEnvironment] = useState<PlanetaryEnvironment>(() => defaultPreset.environment);

  // Estados de visualização e renderização
  const [viewMode, setViewMode] = useState<ViewMode>('orbital');
  const [showVectors, setShowVectors] = useState<boolean>(true);
  const [showAtmosphereLayers, setShowAtmosphereLayers] = useState<boolean>(true);
  const [autoFollow, setAutoFollow] = useState<boolean>(false);

  // Aplica um cenário pré-configurado e define o modo de câmera ideal
  const applyPreset = useCallback((preset: PresetScenario) => {
    setSelectedPresetId(preset.id);
    setProjectile(preset.projectile);
    setEnvironment(preset.environment);

    if (preset.id === 'artilharia-classica' || preset.id === 'coeficiente-aerodinamico-comparativo') {
      setViewMode('profile');
    } else if (preset.id === 'vento-cruzado-coriolis' || preset.id === 'monte-carlo-cep-dispersao') {
      setViewMode('radar');
    } else {
      setViewMode('orbital');
    }

    return {
      newProjectile: preset.projectile,
      newEnvironment: preset.environment,
    };
  }, []);

  return {
    selectedPresetId,
    projectile,
    environment,
    viewMode,
    showVectors,
    showAtmosphereLayers,
    autoFollow,
    setProjectile,
    setEnvironment,
    setViewMode,
    setShowVectors,
    setShowAtmosphereLayers,
    setAutoFollow,
    applyPreset,
  };
}
