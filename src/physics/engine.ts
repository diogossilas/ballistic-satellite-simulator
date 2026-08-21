/**
 * Motor Físico Determinístico de Alta Precisão (Integração RK4)
 * Modela mecânica de foguetes multi-estágio, gravidade esférica, arrasto aerodinâmico dinâmico,
 * vento em camadas, efeito Coriolis, separação de estágios e termodinâmica de impacto.
 */

import { CONSTANTS } from './constants';
import { getAtmosphericState, calculateDynamicCd, calculateDragForce, calculateDynamicPressure, calculateHeatFluxRate } from './atmosphere';
import { getActiveStageIndex, calculateCurrentMass, getWindAtAltitude, computeGravityAndCentrifugal, computeCoriolisAcceleration } from './forces';
import { ProjectileConfig, PlanetaryEnvironment, TelemetryPoint, SimulationSummary, FlightPhase } from '../types/physics';

export interface StateVector {
  time: number;
  x: number;               // Alcance ao longo da superfície (m)
  y: number;               // Altitude em relação ao raio do planeta (m)
  vx: number;              // Velocidade tangencial / horizontal (m/s)
  vy: number;              // Velocidade radial / vertical (m/s)
  z: number;               // Desvio lateral / perpendicular à trajetória (m)
  vz: number;              // Velocidade lateral (m/s)
  pitchDeg: number;        // Ângulo de atitude/pitch em relação ao horizonte local
  stagesState: Array<{
    currentPropellantMass: number;
    isSeparated: boolean;
  }>;
  phase: FlightPhase;
}

export interface Derivatives {
  dx: number;
  dy: number;
  dvx: number;
  dvy: number;
  dz: number;
  dvz: number;
  dm: number;
}

/**
 * Calcula as forças instantâneas e derivadas físicas no estado atual
 */
export function evaluateDerivatives(
  state: StateVector,
  projectile: ProjectileConfig,
  env: PlanetaryEnvironment,
  dt: number
): {
  derivs: Derivatives;
  thrustForce: number;
  dragForce: number;
  gravityForce: number;
  dynamicPressure: number;
  heatFlux: number;
  mach: number;
  gForce: number;
  phase: FlightPhase;
} {
  const currentMass = calculateCurrentMass(projectile, state.stagesState);
  const r = env.planetRadius + Math.max(0, state.y);

  // 1. Gravitação Esférica Newtoniana: g(r) = g0 * (R / r)²
  const gLocal = env.surfaceGravity * Math.pow(env.planetRadius / r, 2);
  const gravityForce = currentMass * gLocal;

  // Aceleração centrífuga devido ao movimento em torno do planeta esférico: ac = vx² / r
  const centrifugalAcc = Math.pow(state.vx, 2) / r;

  // 2. Estágio ativo e Empuxo
  const activeIdx = getActiveStageIndex(projectile.stages, state.stagesState);
  let thrustForce = 0;
  let massFlowRate = 0;
  let effectiveArea = 0.05;
  let effectiveCdBase = 0.25;

  if (activeIdx !== -1) {
    const stage = projectile.stages[activeIdx];
    const stageState = state.stagesState[activeIdx];
    effectiveArea = stage.area;
    effectiveCdBase = stage.cd;

    if (stageState.currentPropellantMass > 0) {
      thrustForce = stage.thrust;
      const g0 = CONSTANTS.STANDARD_GRAVITY;
      massFlowRate = thrustForce / (stage.isp * g0);
    }
  }

  // 3. Orientação e Ângulo de Voo (Pitch Program)
  let pitchRad: number;
  if (thrustForce > 0) {
    if (state.time < projectile.pitchKickTime) {
      // Ângulo de lançamento inicial
      pitchRad = (projectile.launchAngleDeg * Math.PI) / 180;
    } else {
      // Manobra de inclinação (Gravity turn program)
      const progress = Math.min(1, (state.time - projectile.pitchKickTime) / Math.max(1, 15));
      const targetRad = (projectile.pitchKickAngleDeg * Math.PI) / 180;
      const initialRad = (projectile.launchAngleDeg * Math.PI) / 180;
      pitchRad = initialRad + (targetRad - initialRad) * progress;
    }
  } else {
    // Voo inercial balístico: o projétil se alinha naturalmente com o vetor velocidade
    const speed = Math.hypot(state.vx, state.vy);
    if (speed > 1e-3) {
      pitchRad = Math.atan2(state.vy, state.vx);
    } else {
      pitchRad = (projectile.launchAngleDeg * Math.PI) / 180;
    }
  }

  // Componentes do Empuxo
  const thrustX = thrustForce * Math.cos(pitchRad);
  const thrustY = thrustForce * Math.sin(pitchRad);

  // 4. Atmosfera e Arrasto Aerodinâmico
  const wind = env.enableAtmosphere ? getWindAtAltitude(state.y, env) : { vx: 0, vy: 0, vz: 0 };
  const vRelX = state.vx - wind.vx;
  const vRelY = state.vy - wind.vy;
  const vRelZ = state.vz - wind.vz;
  const vRelTotal = Math.sqrt(vRelX * vRelX + vRelY * vRelY + vRelZ * vRelZ);

  let dragForce = 0;
  let dynamicPressure = 0;
  let heatFlux = 0;
  let mach = 0;
  let dragX = 0;
  let dragY = 0;
  let dragZ = 0;

  if (env.enableAtmosphere && state.y < env.atmosphereCeiling) {
    const atmo = getAtmosphericState(state.y, env.seaLevelAirDensity);
    mach = atmo.speedOfSound > 0 ? vRelTotal / atmo.speedOfSound : 0;
    const dynamicCd = calculateDynamicCd(effectiveCdBase, mach, projectile.noseCone);
    dynamicPressure = calculateDynamicPressure(atmo.density, vRelTotal);
    dragForce = calculateDragForce(atmo.density, vRelTotal, dynamicCd, effectiveArea);
    heatFlux = calculateHeatFluxRate(atmo.density, vRelTotal);

    if (vRelTotal > 1e-4) {
      dragX = -dragForce * (vRelX / vRelTotal);
      dragY = -dragForce * (vRelY / vRelTotal);
      dragZ = -dragForce * (vRelZ / vRelTotal);
    }
  }

  // 5. Efeito Coriolis da Rotação Planetária: a_coriolis = -2 * (omega x v)
  let coriolisX = 0;
  let coriolisZ = 0;
  if (env.enableCoriolis) {
    const omega = env.planetaryRotationRate;
    // Rotação em torno do eixo polar
    coriolisX = 2 * omega * state.vz;
    coriolisZ = -2 * omega * state.vx;
  }

  // 6. Acelerações Finais (Segunda Lei de Newton: a = Sum(F) / m)
  const ax = (thrustX + dragX) / currentMass + (state.vx * state.vy) / r + coriolisX;
  const ay = (thrustY + dragY) / currentMass - gLocal + centrifugalAcc;
  const az = dragZ / currentMass + coriolisZ;

  // Aceleração aparente sentida (G-force = a_não-gravitacional / g0)
  const nonGravAx = (thrustX + dragX) / currentMass;
  const nonGravAy = (thrustY + dragY) / currentMass;
  const nonGravAz = dragZ / currentMass;
  const gForce = Math.sqrt(nonGravAx * nonGravAx + nonGravAy * nonGravAy + nonGravAz * nonGravAz) / CONSTANTS.STANDARD_GRAVITY;

  // 7. Determinação da Fase de Voo
  let phase: FlightPhase = state.phase;
  if (state.y <= 0 && state.time > 0.5) {
    phase = 'impactado';
  } else if (thrustForce > 0) {
    phase = 'propulsao';
  } else if (state.vy < -5 && state.y < 35000 && env.enableAtmosphere) {
    phase = 'reentrada';
  } else if (Math.abs(state.vy) < 5 && state.y > 1000) {
    phase = 'apogeu';
  } else {
    phase = 'inercial';
  }

  const derivs: Derivatives = {
    dx: (state.vx * env.planetRadius) / r, // velocidade linear na superfície
    dy: state.vy,
    dvx: ax,
    dvy: ay,
    dz: state.vz,
    dvz: az,
    dm: -massFlowRate,
  };

  return {
    derivs,
    thrustForce,
    dragForce,
    gravityForce,
    dynamicPressure,
    heatFlux,
    mach,
    gForce,
    phase,
  };
}

/**
 * Passo de Integração Numérica de 4ª Ordem de Runge-Kutta (RK4)
 */
export function stepRK4(
  state: StateVector,
  projectile: ProjectileConfig,
  env: PlanetaryEnvironment,
  dt: number
): { nextState: StateVector; telemetry: TelemetryPoint } {
  // k1
  const eval1 = evaluateDerivatives(state, projectile, env, dt);
  const k1 = eval1.derivs;

  // Estado intermediário para k2 (t + dt/2)
  const state2: StateVector = {
    ...state,
    time: state.time + dt / 2,
    x: state.x + k1.dx * (dt / 2),
    y: Math.max(0, state.y + k1.dy * (dt / 2)),
    vx: state.vx + k1.dvx * (dt / 2),
    vy: state.vy + k1.dvy * (dt / 2),
    z: state.z + k1.dz * (dt / 2),
    vz: state.vz + k1.dvz * (dt / 2),
  };
  const eval2 = evaluateDerivatives(state2, projectile, env, dt);
  const k2 = eval2.derivs;

  // Estado intermediário para k3 (t + dt/2)
  const state3: StateVector = {
    ...state,
    time: state.time + dt / 2,
    x: state.x + k2.dx * (dt / 2),
    y: Math.max(0, state.y + k2.dy * (dt / 2)),
    vx: state.vx + k2.dvx * (dt / 2),
    vy: state.vy + k2.dvy * (dt / 2),
    z: state.z + k2.dz * (dt / 2),
    vz: state.vz + k2.dvz * (dt / 2),
  };
  const eval3 = evaluateDerivatives(state3, projectile, env, dt);
  const k3 = eval3.derivs;

  // Estado intermediário para k4 (t + dt)
  const state4: StateVector = {
    ...state,
    time: state.time + dt,
    x: state.x + k3.dx * dt,
    y: Math.max(0, state.y + k3.dy * dt),
    vx: state.vx + k3.dvx * dt,
    vy: state.vy + k3.dvy * dt,
    z: state.z + k3.dz * dt,
    vz: state.vz + k3.dvz * dt,
  };
  const eval4 = evaluateDerivatives(state4, projectile, env, dt);
  const k4 = eval4.derivs;

  // Combinação ponderada de Runge-Kutta
  const nextX = state.x + (dt / 6) * (k1.dx + 2 * k2.dx + 2 * k3.dx + k4.dx);
  const rawNextY = state.y + (dt / 6) * (k1.dy + 2 * k2.dy + 2 * k3.dy + k4.dy);
  const nextVx = state.vx + (dt / 6) * (k1.dvx + 2 * k2.dvx + 2 * k3.dvx + k4.dvx);
  const nextVy = state.vy + (dt / 6) * (k1.dvy + 2 * k2.dvy + 2 * k3.dvy + k4.dvy);
  const nextZ = state.z + (dt / 6) * (k1.dz + 2 * k2.dz + 2 * k3.dz + k4.dz);
  const nextVz = state.vz + (dt / 6) * (k1.dvz + 2 * k2.dvz + 2 * k3.dvz + k4.dvz);

  // Atualização do combustível e estágios
  const nextStagesState = state.stagesState.map((st) => ({ ...st }));
  const activeIdx = getActiveStageIndex(projectile.stages, state.stagesState);
  if (activeIdx !== -1 && nextStagesState[activeIdx].currentPropellantMass > 0) {
    const dMass = -(dt / 6) * (k1.dm + 2 * k2.dm + 2 * k3.dm + k4.dm);
    nextStagesState[activeIdx].currentPropellantMass = Math.max(0, nextStagesState[activeIdx].currentPropellantMass - dMass);

    // Se o combustível acabou e existe um próximo estágio, marca para separação automática
    if (nextStagesState[activeIdx].currentPropellantMass <= 0 && activeIdx < projectile.stages.length - 1) {
      nextStagesState[activeIdx].isSeparated = true;
    }
  }

  const nextY = Math.max(0, rawNextY);
  const isImpact = rawNextY <= 0 && state.time > 0.2;

  const nextState: StateVector = {
    time: state.time + dt,
    x: nextX,
    y: nextY,
    vx: nextVx,
    vy: isImpact ? 0 : nextVy,
    z: nextZ,
    vz: isImpact ? 0 : nextVz,
    pitchDeg: (Math.atan2(nextVy, nextVx) * 180) / Math.PI,
    stagesState: nextStagesState,
    phase: isImpact ? 'impactado' : eval1.phase,
  };

  const currentMass = calculateCurrentMass(projectile, nextStagesState);
  const speed = Math.hypot(nextVx, nextVy, nextVz);
  const accel = Math.hypot(eval1.derivs.dvx, eval1.derivs.dvy, eval1.derivs.dvz);

  const telemetry: TelemetryPoint = {
    time: nextState.time,
    x: nextState.x,
    y: nextState.y,
    r: env.planetRadius + nextState.y,
    vx: nextState.vx,
    vy: nextState.vy,
    speed,
    mach: eval1.mach,
    acceleration: accel,
    gForce: eval1.gForce,
    mass: currentMass,
    currentStageIndex: activeIdx,
    thrustForce: eval1.thrustForce,
    dragForce: eval1.dragForce,
    gravityForce: eval1.gravityForce,
    dynamicPressure: eval1.dynamicPressure,
    heatFluxRate: eval1.heatFlux,
    pitchAngleDeg: nextState.pitchDeg,
    phase: nextState.phase,
    lateralDeviation: nextState.z,
  };

  return { nextState, telemetry };
}

/**
 * Cria o estado inicial do projétil na rampa de lançamento
 */
export function createInitialState(projectile: ProjectileConfig): StateVector {
  const initialPitchRad = (projectile.launchAngleDeg * Math.PI) / 180;
  // Velocidade inicial quase zero na rampa (ou velocidade de ejeção inicial de 1 m/s para estabilidade)
  const v0 = 0.5;

  return {
    time: 0,
    x: 0,
    y: 0,
    vx: v0 * Math.cos(initialPitchRad),
    vy: v0 * Math.sin(initialPitchRad),
    z: 0,
    vz: 0,
    pitchDeg: projectile.launchAngleDeg,
    stagesState: projectile.stages.map((st) => ({
      currentPropellantMass: st.propellantMass,
      isSeparated: false,
    })),
    phase: 'pronto',
  };
}

/**
 * Executa uma simulação completa rápida até o impacto ou tempo máximo
 */
export function runFullSimulation(
  projectile: ProjectileConfig,
  env: PlanetaryEnvironment,
  maxTime: number = 3600,
  dt: number = 0.1
): { telemetryHistory: TelemetryPoint[]; summary: SimulationSummary } {
  let state = createInitialState(projectile);
  const telemetryHistory: TelemetryPoint[] = [];

  // Ponto inicial
  const initEval = evaluateDerivatives(state, projectile, env, dt);
  telemetryHistory.push({
    time: 0,
    x: 0,
    y: 0,
    r: env.planetRadius,
    vx: state.vx,
    vy: state.vy,
    speed: Math.hypot(state.vx, state.vy),
    mach: 0,
    acceleration: 0,
    gForce: 1,
    mass: calculateCurrentMass(projectile, state.stagesState),
    currentStageIndex: 0,
    thrustForce: initEval.thrustForce,
    dragForce: 0,
    gravityForce: initEval.gravityForce,
    dynamicPressure: 0,
    heatFluxRate: 0,
    pitchAngleDeg: projectile.launchAngleDeg,
    phase: 'propulsao',
    lateralDeviation: 0,
  });

  let maxAltitude = 0;
  let maxSpeed = 0;
  let maxMach = 0;
  let maxGForce = 0;
  let maxDynamicPressure = 0;
  let apogeeTime = 0;
  const separationTimes: number[] = [];

  while (state.time < maxTime) {
    const prevActiveStage = getActiveStageIndex(projectile.stages, state.stagesState);
    const { nextState, telemetry } = stepRK4(state, projectile, env, dt);
    const newActiveStage = getActiveStageIndex(projectile.stages, nextState.stagesState);

    if (prevActiveStage !== newActiveStage && newActiveStage !== -1) {
      separationTimes.push(nextState.time);
    }

    if (telemetry.y > maxAltitude) {
      maxAltitude = telemetry.y;
      apogeeTime = telemetry.time;
    }
    if (telemetry.speed > maxSpeed) maxSpeed = telemetry.speed;
    if (telemetry.mach > maxMach) maxMach = telemetry.mach;
    if (telemetry.gForce > maxGForce) maxGForce = telemetry.gForce;
    if (telemetry.dynamicPressure > maxDynamicPressure) maxDynamicPressure = telemetry.dynamicPressure;

    telemetryHistory.push(telemetry);
    state = nextState;

    if (state.phase === 'impactado') {
      break;
    }
  }

  const lastPoint = telemetryHistory[telemetryHistory.length - 1];
  const impactSpeed = lastPoint.speed;
  const impactMass = lastPoint.mass;
  const impactKineticEnergy = 0.5 * impactMass * Math.pow(impactSpeed, 2);
  const impactTntEquivalentKg = impactKineticEnergy / CONSTANTS.TNT_JOULES_PER_KG;
  const impactAngleDeg = (Math.atan2(Math.abs(lastPoint.vy), Math.abs(lastPoint.vx)) * 180) / Math.PI;
  const targetDistanceError = Math.abs(lastPoint.x - projectile.targetRangeKm * 1000);

  const summary: SimulationSummary = {
    maxAltitude,
    totalRange: lastPoint.x,
    totalFlightTime: lastPoint.time,
    maxSpeed,
    maxMach,
    maxGForce,
    maxDynamicPressure,
    impactSpeed,
    impactAngleDeg,
    impactKineticEnergy,
    impactTntEquivalentKg,
    targetDistanceError,
    lateralDeviation: lastPoint.lateralDeviation,
    apogeeTime,
    separationTimes,
  };

  return { telemetryHistory, summary };
}
