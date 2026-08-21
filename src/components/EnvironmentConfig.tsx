/**
 * Painel de Configuração do Ambiente Planetário e Atmosférico
 * Gravidade, Raio, Densidade do Ar, Camadas de Vento e Efeito Coriolis
 */

import React from 'react';
import { PlanetaryEnvironment, WindLayer } from '../types/physics';
import { CONSTANTS } from '../physics/constants';
import { 
  Globe, 
  Wind, 
  Orbit, 
  Compass, 
  Plus, 
  Trash2, 
  Sliders,
  RotateCw,
  Sparkles
} from 'lucide-react';

interface EnvironmentConfigProps {
  environment: PlanetaryEnvironment;
  onChangeEnvironment: (updated: PlanetaryEnvironment) => void;
  disabled?: boolean;
}

export const EnvironmentConfig: React.FC<EnvironmentConfigProps> = ({
  environment,
  onChangeEnvironment,
  disabled = false,
}) => {
  const handleUpdate = (field: keyof PlanetaryEnvironment, value: any) => {
    onChangeEnvironment({
      ...environment,
      [field]: value,
    });
  };

  // Presets de mundos fictícios
  const handleApplyPlanetPreset = (presetType: 'padrao' | 'lua' | 'superterra' | 'microplaneta') => {
    switch (presetType) {
      case 'padrao':
        onChangeEnvironment({
          name: 'Planeta Gauss-9 (Padrão Terrestre)',
          planetRadius: CONSTANTS.EARTH_RADIUS,
          surfaceGravity: CONSTANTS.STANDARD_GRAVITY,
          seaLevelAirDensity: CONSTANTS.SEA_LEVEL_AIR_DENSITY,
          scaleHeight: CONSTANTS.SCALE_HEIGHT,
          atmosphereCeiling: CONSTANTS.KARMAN_LINE,
          enableAtmosphere: true,
          enableCoriolis: true,
          planetaryRotationRate: CONSTANTS.STANDARD_ROTATION_RATE,
          windLayers: [
            { minAltitude: 0, maxAltitude: 10000, speed: 12, directionDeg: 45, gustiness: 0.2 },
            { minAltitude: 10000, maxAltitude: 25000, speed: 28, directionDeg: 90, gustiness: 0.1 },
          ],
        });
        break;
      case 'lua':
        onChangeEnvironment({
          name: 'Satélite Fictício Selene-B (Vácuo / Baixa Gravidade)',
          planetRadius: 1737000, // 1737 km
          surfaceGravity: 1.62,   // 1.62 m/s²
          seaLevelAirDensity: 0,
          scaleHeight: 8500,
          atmosphereCeiling: 0,
          enableAtmosphere: false,
          enableCoriolis: false,
          planetaryRotationRate: 2.66e-6,
          windLayers: [],
        });
        break;
      case 'superterra':
        onChangeEnvironment({
          name: 'Super-Terra Titânica (Alta Gravidade e Atmosfera Densa)',
          planetRadius: 10000000, // 10.000 km
          surfaceGravity: 15.2,   // 15.2 m/s²
          seaLevelAirDensity: 2.8, // 2.8 kg/m³
          scaleHeight: 6500,
          atmosphereCeiling: 140000,
          enableAtmosphere: true,
          enableCoriolis: true,
          planetaryRotationRate: CONSTANTS.STANDARD_ROTATION_RATE * 1.5,
          windLayers: [
            { minAltitude: 0, maxAltitude: 15000, speed: 35, directionDeg: 90, gustiness: 0.5 },
          ],
        });
        break;
      case 'microplaneta':
        onChangeEnvironment({
          name: 'Planetoide Curvatura Extrema (Raio Miniatura 800 km)',
          planetRadius: 800000, // 800 km
          surfaceGravity: 5.0,
          seaLevelAirDensity: 0.4,
          scaleHeight: 12000,
          atmosphereCeiling: 50000,
          enableAtmosphere: true,
          enableCoriolis: true,
          planetaryRotationRate: CONSTANTS.STANDARD_ROTATION_RATE * 4,
          windLayers: [],
        });
        break;
    }
  };

  // Adicionar camada de vento
  const handleAddWindLayer = () => {
    const newLayer: WindLayer = {
      minAltitude: 0,
      maxAltitude: 12000,
      speed: 15,
      directionDeg: 90,
      gustiness: 0.2,
    };
    onChangeEnvironment({
      ...environment,
      windLayers: [...environment.windLayers, newLayer],
    });
  };

  // Remover camada de vento
  const handleRemoveWindLayer = (index: number) => {
    onChangeEnvironment({
      ...environment,
      windLayers: environment.windLayers.filter((_, i) => i !== index),
    });
  };

  // Atualizar camada de vento
  const handleUpdateWindLayer = (index: number, field: keyof WindLayer, value: any) => {
    const updated = environment.windLayers.map((l, i) => (i === index ? { ...l, [field]: value } : l));
    onChangeEnvironment({
      ...environment,
      windLayers: updated,
    });
  };

  return (
    <div className="space-y-4 p-4 bg-[#121215] border border-[#27272a] rounded-xl shadow-xl">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#27272a] pb-3">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-zinc-100">AMBIENTE_E_GEOMETRIA_PLANETÁRIA</h3>
            <p className="text-xs font-mono text-zinc-400">Gravidade, curvatura, densidade atmosférica e rotação</p>
          </div>
        </div>

        {/* Presets Rápidos */}
        <div className="flex flex-wrap items-center gap-1.5 font-mono">
          <span className="text-[11px] text-zinc-400 mr-1">Predefinições:</span>
          <button
            onClick={() => handleApplyPlanetPreset('padrao')}
            className="px-2 py-1 bg-[#0a0a0c] hover:bg-[#18181c] text-amber-400 border border-[#27272a] rounded text-xs transition-colors"
          >
            Padrão
          </button>
          <button
            onClick={() => handleApplyPlanetPreset('lua')}
            className="px-2 py-1 bg-[#0a0a0c] hover:bg-[#18181c] text-zinc-300 border border-[#27272a] rounded text-xs transition-colors"
          >
            Vácuo (Lua)
          </button>
          <button
            onClick={() => handleApplyPlanetPreset('superterra')}
            className="px-2 py-1 bg-[#0a0a0c] hover:bg-[#18181c] text-amber-400 border border-[#27272a] rounded text-xs transition-colors"
          >
            Super-Terra
          </button>
          <button
            onClick={() => handleApplyPlanetPreset('microplaneta')}
            className="px-2 py-1 bg-[#0a0a0c] hover:bg-[#18181c] text-purple-400 border border-[#27272a] rounded text-xs transition-colors"
          >
            Micro-Planeta
          </button>
        </div>
      </div>

      {/* Grid de Parâmetros Fundamentais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div>
          <label className="block text-xs font-mono text-zinc-300 mb-1">Gravidade Superfície g₀ (m/s²)</label>
          <input
            type="number"
            min="0"
            max="30"
            step="0.1"
            value={environment.surfaceGravity}
            disabled={disabled}
            onChange={(e) => handleUpdate('surfaceGravity', Number(e.target.value))}
            className="w-full px-3 py-1.5 bg-[#0a0a0c] border border-[#27272a] rounded text-xs font-mono text-zinc-100 focus:border-amber-500"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-zinc-300 mb-1">Raio Planetário (km)</label>
          <input
            type="number"
            min="100"
            max="50000"
            step="100"
            value={environment.planetRadius / 1000}
            disabled={disabled}
            onChange={(e) => handleUpdate('planetRadius', Number(e.target.value) * 1000)}
            className="w-full px-3 py-1.5 bg-[#0a0a0c] border border-[#27272a] rounded text-xs font-mono text-zinc-100 focus:border-amber-500"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-zinc-300 mb-1">Densidade do Ar Mar (kg/m³)</label>
          <input
            type="number"
            min="0"
            max="10"
            step="0.05"
            value={environment.seaLevelAirDensity}
            disabled={disabled}
            onChange={(e) => handleUpdate('seaLevelAirDensity', Number(e.target.value))}
            className="w-full px-3 py-1.5 bg-[#0a0a0c] border border-[#27272a] rounded text-xs font-mono text-zinc-100 focus:border-amber-500"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-zinc-300 mb-1">Teto Kármán (km)</label>
          <input
            type="number"
            min="10"
            max="300"
            step="5"
            value={environment.atmosphereCeiling / 1000}
            disabled={disabled}
            onChange={(e) => handleUpdate('atmosphereCeiling', Number(e.target.value) * 1000)}
            className="w-full px-3 py-1.5 bg-[#0a0a0c] border border-[#27272a] rounded text-xs font-mono text-zinc-100 focus:border-amber-500"
          />
        </div>
      </div>

      {/* Switches de Atmosfera e Coriolis */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-[#0a0a0c] border border-[#27272a] rounded-lg">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={environment.enableAtmosphere}
            disabled={disabled}
            onChange={(e) => handleUpdate('enableAtmosphere', e.target.checked)}
            className="w-4 h-4 rounded accent-amber-500"
          />
          <div className="text-xs font-mono">
            <span className="font-semibold text-zinc-200 block">Ativar Atmosfera e Arrasto Aerodinâmico</span>
            <span className="text-zinc-400">Modela densidade ISA em camadas, pressão dinâmica e aquecimento</span>
          </div>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={environment.enableCoriolis}
            disabled={disabled}
            onChange={(e) => handleUpdate('enableCoriolis', e.target.checked)}
            className="w-4 h-4 rounded accent-amber-500"
          />
          <div className="text-xs font-mono">
            <span className="font-semibold text-zinc-200 block">Ativar Efeito Coriolis (Rotação Planetária)</span>
            <span className="text-zinc-400">Aceleração -2(ω × v) e desvio lateral tridimensional</span>
          </div>
        </label>
      </div>

      {/* Camadas de Vento */}
      {environment.enableAtmosphere && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-zinc-300">
              <Wind className="w-3.5 h-3.5 text-amber-400" />
              <span>Camadas de Vento e Turbulência Atmosférica</span>
            </div>

            <button
              onClick={handleAddWindLayer}
              disabled={disabled}
              className="flex items-center gap-1 px-2 py-1 text-xs font-mono text-amber-400 hover:bg-[#18181c] border border-amber-500/30 rounded transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>Adicionar Camada</span>
            </button>
          </div>

          {environment.windLayers.length === 0 ? (
            <div className="p-3 bg-[#0a0a0c] border border-dashed border-[#27272a] rounded-lg text-center text-xs font-mono text-zinc-500">
              Atmosfera em calmaria (sem ventos configurados). Adicione camadas para simular desvio lateral.
            </div>
          ) : (
            <div className="space-y-2">
              {environment.windLayers.map((layer, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-[#0a0a0c] border border-[#27272a] rounded-lg grid grid-cols-1 sm:grid-cols-5 gap-2 items-center text-xs font-mono"
                >
                  <div>
                    <label className="text-[10px] text-zinc-400 block">Alt Min (m)</label>
                    <input
                      type="number"
                      value={layer.minAltitude}
                      disabled={disabled}
                      onChange={(e) => handleUpdateWindLayer(idx, 'minAltitude', Number(e.target.value))}
                      className="w-full px-2 py-1 bg-[#121215] border border-[#27272a] rounded font-mono text-zinc-200"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-400 block">Alt Max (m)</label>
                    <input
                      type="number"
                      value={layer.maxAltitude}
                      disabled={disabled}
                      onChange={(e) => handleUpdateWindLayer(idx, 'maxAltitude', Number(e.target.value))}
                      className="w-full px-2 py-1 bg-[#121215] border border-[#27272a] rounded font-mono text-zinc-200"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-400 block">Velocidade (m/s)</label>
                    <input
                      type="number"
                      value={layer.speed}
                      disabled={disabled}
                      onChange={(e) => handleUpdateWindLayer(idx, 'speed', Number(e.target.value))}
                      className="w-full px-2 py-1 bg-[#121215] border border-[#27272a] rounded font-mono text-zinc-200"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-400 block">Azimute (°)</label>
                    <input
                      type="number"
                      min="0"
                      max="360"
                      value={layer.directionDeg}
                      disabled={disabled}
                      onChange={(e) => handleUpdateWindLayer(idx, 'directionDeg', Number(e.target.value))}
                      className="w-full px-2 py-1 bg-[#121215] border border-[#27272a] rounded font-mono text-zinc-200"
                    />
                  </div>

                  <div className="flex items-center justify-end">
                    <button
                      onClick={() => handleRemoveWindLayer(idx)}
                      disabled={disabled}
                      className="p-1 text-red-400 hover:bg-red-950/40 rounded transition-colors"
                      title="Excluir camada de vento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
