/**
 * Módulo de Física de Intercepção e Defesa Aeroespacial
 * Responsabilidade:
 * - Algoritmo de guiamento Proportional Navigation (PN Guidance Law)
 * - Rastreamento por radar e estimativa de ponto de interceptação futura
 * - Dinâmica cinemática do míssil interceptor de alta manobrabilidade
 * - Verificação de proximidade para destruição cinética "Hit-to-Kill"
 */

import {
  InterceptorBattery,
  InterceptorState,
  InterceptorPoint,
  TelemetryPoint,
} from '../types/physics';
import { CONSTANTS } from './constants';

/**
 * Cria a bateria padrão de defesa posicionada estrategicamente no setor do alvo
 */
export function createDefaultInterceptorBattery(targetRangeM: number): InterceptorBattery {
  // Posiciona a bateria a ~80% do alcance total em direção ao alvo, com ligeiro offset lateral
  const batteryX = Math.max(20000, targetRangeM * 0.78);
  const batteryZ = 15000; // 15 km de offset lateral

  return {
    id: 'battery-alpha-shield-01',
    name: 'Bateria SAM/ABM Aegis-Ômega IV',
    locationName: 'Complexo de Defesa Integrada Delta-4',
    x: batteryX,
    z: batteryZ,
    radarRangeM: Math.max(300000, targetRangeM * 0.45), // Radar cobre 300-1500 km
    maxSpeedMs: 2600, // ~Mach 7.8 (Interceptor hipersônico exo/endoatmosférico)
    maxAltitudeM: 250000, // Capaz de intercepção exoatmosférica até 250 km
    autoEngage: true,
    missDistanceM: 55, // Raio letal de 55 metros
  };
}

/**
 * Inicializa o estado do interceptor em standby
 */
export function createInitialInterceptorState(battery: InterceptorBattery): InterceptorState {
  return {
    status: 'standby',
    battery,
    launchTime: null,
    interceptTime: null,
    currentPoint: null,
    history: [],
    targetInterceptPoint: null,
    missDistance: null,
    killConfirmed: false,
  };
}

/**
 * Executa 1 passo de simulação do míssil interceptor guiado
 */
export function stepInterceptor(
  state: InterceptorState,
  targetPoint: TelemetryPoint | null,
  dt: number,
  simTime: number
): InterceptorState {
  if (!targetPoint) return state;

  // Se o alvo já colidiu ou foi destruído e não estamos ativos
  if (targetPoint.phase === 'impactado' || targetPoint.phase === 'destruido') {
    if (state.status === 'launched' || state.status === 'tracking') {
      return { ...state, status: 'missed' };
    }
    return state;
  }

  // 1. CHECAGEM DE DETECÇÃO POR RADAR E DISPARO AUTOMÁTICO
  const dxToBattery = targetPoint.x - state.battery.x;
  const dzToBattery = targetPoint.lateralDeviation - state.battery.z;
  const horizontalDistToBattery = Math.hypot(dxToBattery, dzToBattery);
  const totalDistToBattery = Math.hypot(horizontalDistToBattery, targetPoint.y);

  if (state.status === 'standby') {
    // Verifica se deve engajar automaticamente
    const isInRadarCone = totalDistToBattery <= state.battery.radarRangeM;
    const isApproaching = targetPoint.vx > 50; // alvo viajando em direção à bateria/alvo
    const isDescendingOrMidcourse = targetPoint.phase === 'inercial' || targetPoint.phase === 'apogeu' || targetPoint.phase === 'reentrada';

    if (state.battery.autoEngage && isInRadarCone && (isDescendingOrMidcourse || targetPoint.y > 15000)) {
      // Dispara o interceptor!
      const initialPoint: InterceptorPoint = {
        time: simTime,
        x: state.battery.x,
        y: 10,
        z: state.battery.z,
        vx: 0,
        vy: 200, // Impulso vertical inicial da rampa de lançamento
        vz: 0,
        speed: 200,
        distanceToTarget: totalDistToBattery,
      };

      return {
        ...state,
        status: 'launched',
        launchTime: simTime,
        currentPoint: initialPoint,
        history: [initialPoint],
      };
    }
    return state;
  }

  // Se já foi concluído (interceptado ou perdeu)
  if (state.status === 'intercepted' || state.status === 'missed') {
    return state;
  }

  // 2. GUIAMENTO ATIVO DO INTERCEPTOR (PROPORTIONAL NAVIGATION & PURSUIT)
  if (!state.currentPoint) return state;

  const cur = state.currentPoint;

  // Vetor relativo da mira ao alvo
  const relX = targetPoint.x - cur.x;
  const relY = targetPoint.y - cur.y;
  const relZ = targetPoint.lateralDeviation - cur.z;
  const currentDistance = Math.hypot(relX, relY, relZ);

  // Checagem de sucesso "Hit-to-Kill"
  if (currentDistance <= state.battery.missDistanceM) {
    return {
      ...state,
      status: 'intercepted',
      interceptTime: simTime,
      missDistance: currentDistance,
      killConfirmed: true,
      currentPoint: {
        ...cur,
        time: simTime,
        distanceToTarget: currentDistance,
      },
    };
  }

  // Checagem de overshoot / perda de contato
  if (cur.y < 0 && simTime > (state.launchTime || 0) + 5) {
    return {
      ...state,
      status: 'missed',
      missDistance: currentDistance,
    };
  }

  // Vetor de velocidade de fechamento (Closing Velocity)
  const relVx = targetPoint.vx - cur.vx;
  const relVy = targetPoint.vy - cur.vy;
  const relVz = 0 - cur.vz;
  const closingSpeed = -(relX * relVx + relY * relVy + relZ * relVz) / Math.max(1, currentDistance);

  // Estimativa de tempo até o encontro (Time to Go - tgo)
  const tGo = Math.max(0.2, currentDistance / Math.max(100, cur.speed + targetPoint.speed));

  // Ponto futuro estimado de interceptação com compensação de gravidade
  const predictedTargetX = targetPoint.x + targetPoint.vx * tGo;
  const predictedTargetY = Math.max(0, targetPoint.y + targetPoint.vy * tGo - 0.5 * CONSTANTS.STANDARD_GRAVITY * Math.pow(tGo, 2));
  const predictedTargetZ = targetPoint.lateralDeviation;

  // Vetor de direção desejada
  const aimX = predictedTargetX - cur.x;
  const aimY = predictedTargetY - cur.y;
  const aimZ = predictedTargetZ - cur.z;
  const aimDist = Math.hypot(aimX, aimY, aimZ);

  const dirX = aimDist > 0 ? aimX / aimDist : 0;
  const dirY = aimDist > 0 ? aimY / aimDist : 1;
  const dirZ = aimDist > 0 ? aimZ / aimDist : 0;

  // Aceleração do motor e limite de manobra
  const maxAcc = 280; // ~28.5 Gs de manobrabilidade aerodinâmica / RCS
  const boostAcc = 180; // aceleração de empuxo axial

  // Atualiza velocidades com aceleração guiada
  const targetVx = dirX * state.battery.maxSpeedMs;
  const targetVy = dirY * state.battery.maxSpeedMs;
  const targetVz = dirZ * state.battery.maxSpeedMs;

  const newVx = cur.vx + Math.min(maxAcc * dt, Math.max(-maxAcc * dt, targetVx - cur.vx));
  const newVy = cur.vy + Math.min(maxAcc * dt, Math.max(-maxAcc * dt, targetVy - cur.vy)) - CONSTANTS.STANDARD_GRAVITY * dt;
  const newVz = cur.vz + Math.min(maxAcc * dt, Math.max(-maxAcc * dt, targetVz - cur.vz));

  const newSpeed = Math.hypot(newVx, newVy, newVz);

  // Atualiza posições
  const newX = cur.x + newVx * dt;
  const newY = Math.max(0, cur.y + newVy * dt);
  const newZ = cur.z + newVz * dt;

  const newDistance = Math.hypot(targetPoint.x - newX, targetPoint.y - newY, targetPoint.lateralDeviation - newZ);

  const updatedPoint: InterceptorPoint = {
    time: simTime,
    x: newX,
    y: newY,
    z: newZ,
    vx: newVx,
    vy: newVy,
    vz: newVz,
    speed: newSpeed,
    distanceToTarget: newDistance,
  };

  // Se a nova distância cruzou o limiar de destruição
  if (newDistance <= state.battery.missDistanceM) {
    return {
      ...state,
      status: 'intercepted',
      interceptTime: simTime,
      missDistance: newDistance,
      killConfirmed: true,
      currentPoint: updatedPoint,
      history: [...state.history, updatedPoint],
      targetInterceptPoint: { x: newX, y: newY, z: newZ },
    };
  }

  return {
    ...state,
    status: 'tracking',
    currentPoint: updatedPoint,
    history: [...state.history, updatedPoint],
    targetInterceptPoint: { x: predictedTargetX, y: predictedTargetY, z: predictedTargetZ },
  };
}
