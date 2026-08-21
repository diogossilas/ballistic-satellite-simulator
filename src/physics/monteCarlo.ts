/**
 * Motor Estocástico de Dispersão Balística (Monte Carlo & Cálculo de CEP)
 * Modela incertezas atmosféricas, variações de vento gaussiano e dispersão estatística de impacto.
 */

import { ProjectileConfig, PlanetaryEnvironment, MonteCarloResult } from '../types/physics';
import { runFullSimulation } from './engine';

/**
 * Gera um número com distribuição Normal / Gaussiana (Transformação de Box-Muller)
 */
function randomGaussian(mean: number = 0, stdev: number = 1): number {
  const u1 = Math.max(1e-7, Math.random());
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * stdev + mean;
}

/**
 * Executa simulação Monte Carlo para calcular dispersão balística e CEP
 */
export function runMonteCarloSimulation(
  projectile: ProjectileConfig,
  baseEnv: PlanetaryEnvironment,
  iterations: number = 30
): MonteCarloResult {
  const impactPoints: Array<{
    x: number;
    y: number; // desvio lateral
    range: number;
    flightTime: number;
    impactSpeed: number;
  }> = [];

  let sumRange = 0;
  let sumLateral = 0;

  for (let i = 0; i < iterations; i++) {
    // Aplica perturbações estocásticas realistas:
    // 1. Variação no vento (+- 15 m/s aleatório por camada)
    const perturbedWindLayers = baseEnv.windLayers.map((layer) => ({
      ...layer,
      speed: Math.max(0, layer.speed + randomGaussian(0, 4.0)),
      directionDeg: (layer.directionDeg + randomGaussian(0, 15) + 360) % 360,
    }));

    // Se o ambiente não tiver vento configurado, adiciona perturbação aerodinâmica suave
    if (perturbedWindLayers.length === 0 && baseEnv.enableAtmosphere) {
      perturbedWindLayers.push({
        minAltitude: 0,
        maxAltitude: 50000,
        speed: Math.abs(randomGaussian(5, 3)),
        directionDeg: Math.random() * 360,
        gustiness: 0.3,
      });
    }

    // 2. Variação no empuxo (+- 1.5%) e densidade atmosférica (+- 2%)
    const perturbedDensity = baseEnv.seaLevelAirDensity * (1 + randomGaussian(0, 0.02));
    const perturbedEnv: PlanetaryEnvironment = {
      ...baseEnv,
      seaLevelAirDensity: perturbedDensity,
      windLayers: perturbedWindLayers,
    };

    const perturbedProjectile: ProjectileConfig = {
      ...projectile,
      launchAngleDeg: projectile.launchAngleDeg + randomGaussian(0, 0.2), // erro de mira +- 0.2 deg
      stages: projectile.stages.map((st) => ({
        ...st,
        thrust: st.thrust * (1 + randomGaussian(0, 0.015)),
        cd: st.cd * (1 + randomGaussian(0, 0.03)),
      })),
    };

    // Executa simulação
    const { summary } = runFullSimulation(perturbedProjectile, perturbedEnv, 1800, 0.3);

    const range = summary.totalRange;
    const lateral = summary.lateralDeviation;
    sumRange += range;
    sumLateral += lateral;

    impactPoints.push({
      x: range,
      y: lateral,
      range,
      flightTime: summary.totalFlightTime,
      impactSpeed: summary.impactSpeed,
    });
  }

  const meanRange = sumRange / iterations;
  const meanLateral = sumLateral / iterations;

  // Desvio padrão
  let varianceRange = 0;
  let varianceLateral = 0;
  const radialDistances: number[] = [];

  for (const pt of impactPoints) {
    varianceRange += Math.pow(pt.x - meanRange, 2);
    varianceLateral += Math.pow(pt.y - meanLateral, 2);
    
    // Distância radial ao centro médio dos impactos
    const r = Math.hypot(pt.x - meanRange, pt.y - meanLateral);
    radialDistances.push(r);
  }

  const stdDevRange = Math.sqrt(varianceRange / iterations);
  const stdDevLateral = Math.sqrt(varianceLateral / iterations);

  // Ordena distâncias radiais para calcular quantis (CEP 50% e CEP 95%)
  radialDistances.sort((a, b) => a - b);
  const index50 = Math.floor(iterations * 0.5);
  const index95 = Math.min(radialDistances.length - 1, Math.floor(iterations * 0.95));

  const cep50 = radialDistances[index50] || 0;
  const cep95 = radialDistances[index95] || 0;

  return {
    simulationsCount: iterations,
    impactPoints,
    meanRange,
    meanLateralDeviation: meanLateral,
    stdDevRange,
    stdDevLateral,
    cep50,
    cep95,
  };
}
