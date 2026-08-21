/**
 * Módulo de Telemetria e Análise de Dados de Voo
 * Responsabilidade: Formatação, conversão de unidades, métricas derivadas e formatação de relatórios.
 */

import { TelemetryPoint, SimulationSummary } from '../../types/physics';

export function formatAltitude(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${meters.toFixed(1)} m`;
}

export function formatSpeed(speedMs: number): string {
  const kmh = speedMs * 3.6;
  return `${speedMs.toFixed(1)} m/s (${kmh.toFixed(0)} km/h)`;
}

export function formatForce(newtons: number): string {
  if (Math.abs(newtons) >= 1000) {
    return `${(newtons / 1000).toFixed(2)} kN`;
  }
  return `${newtons.toFixed(1)} N`;
}

export function formatEnergy(joules: number): string {
  if (joules >= 1e9) {
    return `${(joules / 1e9).toFixed(2)} GJ`;
  }
  if (joules >= 1e6) {
    return `${(joules / 1e6).toFixed(2)} MJ`;
  }
  if (joules >= 1e3) {
    return `${(joules / 1e3).toFixed(2)} kJ`;
  }
  return `${joules.toFixed(1)} J`;
}

export function calculateKineticEnergy(massKg: number, speedMs: number): number {
  return 0.5 * massKg * Math.pow(speedMs, 2);
}

export function calculateTntEquivalent(joules: number): number {
  // 1 kg TNT = 4.184e6 Joules
  return joules / 4.184e6;
}

export function extractMaxTelemetry(history: TelemetryPoint[]): {
  maxAltitude: number;
  maxSpeed: number;
  maxMach: number;
  maxGForce: number;
  maxDynamicPressure: number;
} {
  if (history.length === 0) {
    return {
      maxAltitude: 0,
      maxSpeed: 0,
      maxMach: 0,
      maxGForce: 0,
      maxDynamicPressure: 0,
    };
  }

  let maxAltitude = 0;
  let maxSpeed = 0;
  let maxMach = 0;
  let maxGForce = 0;
  let maxDynamicPressure = 0;

  for (const pt of history) {
    if (pt.y > maxAltitude) maxAltitude = pt.y;
    if (pt.speed > maxSpeed) maxSpeed = pt.speed;
    if (pt.mach > maxMach) maxMach = pt.mach;
    if (pt.gForce > maxGForce) maxGForce = pt.gForce;
    if (pt.dynamicPressure > maxDynamicPressure) maxDynamicPressure = pt.dynamicPressure;
  }

  return {
    maxAltitude,
    maxSpeed,
    maxMach,
    maxGForce,
    maxDynamicPressure,
  };
}
