/**
 * Modelo Atmosférico Internacional (ISA) e Aerodinâmica Compressível
 * Calcula densidade, pressão, velocidade do som, número de Mach e Coeficiente de Arrasto Cd(Mach)
 */

import { CONSTANTS } from './constants';
import { NoseConeType } from '../types/physics';

export interface AtmosphericState {
  layerName: string;
  altitude: number;      // m
  temperature: number;   // K
  pressure: number;      // Pa
  density: number;       // kg/m³
  speedOfSound: number;  // m/s
}

/**
 * Calcula o estado atmosférico para uma dada altitude (modelo ISA em camadas)
 */
export function getAtmosphericState(altitude: number, seaLevelDensity: number = CONSTANTS.SEA_LEVEL_AIR_DENSITY): AtmosphericState {
  if (altitude < 0) altitude = 0;

  // Acima de 100km (Termosfera / Vácuo espacial)
  if (altitude >= CONSTANTS.KARMAN_LINE) {
    return {
      layerName: 'Exosfera / Espaço',
      altitude,
      temperature: 200,
      pressure: 0,
      density: 0,
      speedOfSound: 280,
    };
  }

  // Camadas ISA padrão
  let temp: number;
  let pressure: number;
  let layerName: string;

  if (altitude <= 11000) {
    // Troposfera: gradiente de temperatura constante -6.5 K/km
    layerName: layerName = 'Troposfera (0 - 11 km)';
    const lapseRate = -0.0065;
    temp = CONSTANTS.SEA_LEVEL_TEMPERATURE + lapseRate * altitude;
    pressure = CONSTANTS.SEA_LEVEL_PRESSURE * Math.pow(temp / CONSTANTS.SEA_LEVEL_TEMPERATURE, -CONSTANTS.STANDARD_GRAVITY / (lapseRate * 287.058));
  } else if (altitude <= 20000) {
    // Baixa Estratosfera: temperatura isotérmica a 216.65 K
    layerName = 'Baixa Estratosfera (11 - 20 km)';
    temp = 216.65;
    const p11 = 22632.1; // Pressão aos 11km em Pa
    pressure = p11 * Math.exp(-CONSTANTS.STANDARD_GRAVITY * (altitude - 11000) / (287.058 * temp));
  } else if (altitude <= 32000) {
    // Alta Estratosfera: gradiente positivo +1.0 K/km
    layerName = 'Alta Estratosfera (20 - 32 km)';
    const lapseRate = 0.001;
    const temp20 = 216.65;
    const p20 = 5474.89;
    temp = temp20 + lapseRate * (altitude - 20000);
    pressure = p20 * Math.pow(temp / temp20, -CONSTANTS.STANDARD_GRAVITY / (lapseRate * 287.058));
  } else if (altitude <= 47000) {
    // Estratopausa: gradiente +2.8 K/km
    layerName = 'Estratopausa (32 - 47 km)';
    const lapseRate = 0.0028;
    const temp32 = 228.65;
    const p32 = 868.02;
    temp = temp32 + lapseRate * (altitude - 32000);
    pressure = p32 * Math.pow(temp / temp32, -CONSTANTS.STANDARD_GRAVITY / (lapseRate * 287.058));
  } else if (altitude <= 71000) {
    // Mesosfera: gradiente negativo -2.8 K/km
    layerName = 'Mesosfera (47 - 71 km)';
    const lapseRate = -0.0028;
    const temp47 = 270.65;
    const p47 = 110.91;
    temp = temp47 + lapseRate * (altitude - 47000);
    pressure = p47 * Math.pow(temp / temp47, -CONSTANTS.STANDARD_GRAVITY / (lapseRate * 287.058));
  } else {
    // Alta Mesosfera / Mesopausa (71 - 100 km)
    layerName = 'Mesopausa / Termosfera (71 - 100 km)';
    const lapseRate = -0.002;
    const temp71 = 203.45;
    const p71 = 3.96;
    temp = Math.max(160, temp71 + lapseRate * (altitude - 71000));
    pressure = p71 * Math.pow(temp / temp71, -CONSTANTS.STANDARD_GRAVITY / (lapseRate * 287.058));
  }

  // Lei dos Gases Ideais: rho = P / (R_sp * T)
  const R_specific = 287.058; // J/(kg·K) para o ar
  const baseDensity = pressure / (R_specific * temp);
  
  // Escala relativa caso o ambiente planetário tenha densidade customizada ao nível do mar
  const density = baseDensity * (seaLevelDensity / CONSTANTS.SEA_LEVEL_AIR_DENSITY);

  // Velocidade do som: a = sqrt(gamma * R_sp * T)
  const speedOfSound = Math.sqrt(CONSTANTS.SPECIFIC_HEAT_RATIO_AIR * R_specific * temp);

  return {
    layerName,
    altitude,
    temperature: temp,
    pressure: Math.max(0, pressure),
    density: Math.max(0, density),
    speedOfSound,
  };
}

/**
 * Calcula o Coeficiente de Arrasto Cd em função do Mach e da forma da ogiva (Wave Drag Transonic Curve)
 */
export function calculateDynamicCd(baseCd: number, mach: number, noseType: NoseConeType = 'ogival'): number {
  // Ajuste base pela geometria da ogiva
  let shapeFactor = 1.0;
  switch (noseType) {
    case 'pontiagudo':
      shapeFactor = 0.85;
      break;
    case 'ogival':
      shapeFactor = 1.0;
      break;
    case 'conico':
      shapeFactor = 1.15;
      break;
    case 'rombudo':
      shapeFactor = 1.8;
      break;
  }

  const effectiveBaseCd = baseCd * shapeFactor;

  // Curva de compressibilidade aerodinâmica:
  // - Subsônico (Mach < 0.8): Cd praticamente constante (efeito Prandtl-Glauert suave)
  // - Transônico (0.8 <= Mach <= 1.2): pico abrupto de arrasto por onda de choque
  // - Supersônico (1.2 < Mach <= 5.0): decaimento gradual com 1/sqrt(M² - 1)
  // - Hipersônico (Mach > 5.0): estabilização assintótica pelo modelo de choque de Newton

  if (mach < 0.8) {
    // Subsônico
    return effectiveBaseCd * (1 + 0.05 * Math.pow(mach, 2));
  } else if (mach < 1.05) {
    // Transônico inicial (subida íngreme)
    const factor = 1 + 1.8 * Math.pow((mach - 0.8) / 0.25, 2);
    return effectiveBaseCd * factor;
  } else if (mach < 1.4) {
    // Pico transônico máximo
    const peak = 2.8;
    const factor = peak - 0.6 * ((mach - 1.05) / 0.35);
    return effectiveBaseCd * factor;
  } else if (mach < 5.0) {
    // Supersônico
    const supersonicDecay = 2.2 / Math.sqrt(Math.max(1.01, Math.pow(mach, 2) - 1));
    return effectiveBaseCd * Math.max(1.1, supersonicDecay);
  } else {
    // Hipersônico
    return effectiveBaseCd * 1.15;
  }
}

/**
 * Pressão Dinâmica q = 0.5 * rho * v²
 */
export function calculateDynamicPressure(density: number, velocity: number): number {
  return 0.5 * density * Math.pow(velocity, 2);
}

/**
 * Força de Arrasto Aerodinâmico Fd = 0.5 * rho * v² * Cd * A = q * Cd * A
 */
export function calculateDragForce(density: number, velocity: number, cd: number, area: number): number {
  const q = calculateDynamicPressure(density, velocity);
  return q * cd * area;
}

/**
 * Estimativa do Fluxo de Calor Cinético por Estagnação (Sutton-Graves simplificado):
 * q_dot ≈ k * sqrt(rho / R_nose) * v³ (kW/m²)
 */
export function calculateHeatFluxRate(density: number, velocity: number, noseRadiusMeters: number = 0.2): number {
  if (density <= 0 || velocity < 500) return 0;
  const k = 1.74153e-4; // Constante empírica para atmosfera terrestre
  const heatFluxW = k * Math.sqrt(density / noseRadiusMeters) * Math.pow(velocity, 3);
  return heatFluxW / 1000; // Retorna em kW/m²
}
