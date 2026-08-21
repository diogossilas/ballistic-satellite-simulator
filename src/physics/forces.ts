/**
 * Módulo de Forças Físicas e Dinâmica Aeroespacial
 * Responsabilidade única: Cálculo isolado e determinístico de vetores de forças atuantes:
 * - Gravidade esférica com lei do inverso do quadrado
 * - Empuxo por queima de propelente e vazão mássica (Isp)
 * - Arrasto aerodinâmico compressível dependente de Mach
 * - Aceleração centrífuga em coordenadas esféricas
 * - Aceleração de Coriolis aparente devido à rotação planetária
 */

import { CONSTANTS } from './constants';
import { getAtmosphericState, calculateDynamicCd, calculateDragForce, calculateDynamicPressure, calculateHeatFluxRate } from './atmosphere';
import { ProjectileConfig, PlanetaryEnvironment, FlightPhase } from '../types/physics';
import { StateVector } from './engine';

export interface ForcesBreakdown {
  thrustForce: number;
  dragForce: number;
  gravityForce: number;
  dynamicPressure: number;
  heatFlux: number;
  mach: number;
  gForce: number;
  massFlowRate: number;
  effectiveArea: number;
  effectiveCd: number;
  pitchRad: number;
  phase: FlightPhase;
}

/**
 * Encontra o índice do estágio ativo atual
 */
export function getActiveStageIndex(
  stages: ProjectileConfig['stages'],
  stagesState: StateVector['stagesState']
): number {
  for (let i = 0; i < stages.length; i++) {
    if (!stagesState[i].isSeparated) {
      return i;
    }
  }
  return -1;
}

/**
 * Calcula a massa total atual do veículo (massa seca + propelente restante + carga útil)
 */
export function calculateCurrentMass(
  projectile: ProjectileConfig,
  stagesState: StateVector['stagesState']
): number {
  let mass = projectile.payloadMass;
  for (let i = 0; i < projectile.stages.length; i++) {
    if (!stagesState[i].isSeparated) {
      mass += projectile.stages[i].dryMass + stagesState[i].currentPropellantMass;
    }
  }
  return Math.max(1, mass);
}

/**
 * Obtém as componentes do vento para uma determinada altitude
 */
export function getWindAtAltitude(
  altitude: number,
  env: PlanetaryEnvironment
): { vx: number; vy: number; vz: number } {
  for (const layer of env.windLayers) {
    if (altitude >= layer.minAltitude && altitude <= layer.maxAltitude) {
      const rad = (layer.directionDeg * Math.PI) / 180;
      const speed = layer.speed;
      return {
        vx: speed * Math.cos(rad),
        vy: 0,
        vz: speed * Math.sin(rad),
      };
    }
  }
  return { vx: 0, vy: 0, vz: 0 };
}

/**
 * Calcula a gravidade esférica local e aceleração centrífuga
 */
export function computeGravityAndCentrifugal(
  altitude: number,
  vx: number,
  surfaceGravity: number,
  planetRadius: number
): { gLocal: number; centrifugalAcc: number } {
  const r = planetRadius + Math.max(0, altitude);
  const gLocal = surfaceGravity * Math.pow(planetRadius / r, 2);
  const centrifugalAcc = Math.pow(vx, 2) / r;
  return { gLocal, centrifugalAcc };
}

/**
 * Calcula a aceleração aparente de Coriolis
 */
export function computeCoriolisAcceleration(
  vx: number,
  vy: number,
  vz: number,
  enabled: boolean,
  planetRadius: number
): { ax: number; ay: number; az: number } {
  if (!enabled) {
    return { ax: 0, ay: 0, az: 0 };
  }
  // Velocidade angular de rotação planetária (Terra padrão: 7.292115e-5 rad/s)
  const omega = CONSTANTS.STANDARD_ROTATION_RATE * Math.sqrt(CONSTANTS.EARTH_RADIUS / planetRadius);
  return {
    ax: 2 * omega * vy,
    ay: -2 * omega * vx,
    az: -2 * omega * vx * 0.3,
  };
}
