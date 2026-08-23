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
 * Cria a bateria padrão de defesa posicionada no território da República Territorial
 */
export function createDefaultInterceptorBattery(targetRangeM: number): InterceptorBattery {
  // Posiciona a bateria no território do outro país (85% a 90% do alcance planejado)
  const repTerritorialBaseX = Math.max(25000, targetRangeM * 0.88);
  const batteryZ = 0; // Centralizado

  // Raio de radar que cobre a entrada no espaço aéreo nacional (a partir de 60% do trajeto)
  const focusedRadarRangeM = Math.max(15000, targetRangeM * 0.38);

  return {
    id: 'battery-republica-territorial-01',
    name: 'Bateria de Defesa ABM (República Territorial)',
    locationName: 'Complexo de Defesa Aeroespacial',
    x: repTerritorialBaseX,
    z: batteryZ,
    radarRangeM: focusedRadarRangeM, // Área que cobre o espaço aéreo soberano
    maxSpeedMs: 9200, // Super velocidade para garantir intercepção no ar antes do solo
    maxAltitudeM: 550000,
    autoEngage: true,
    missDistanceM: 850, // Raio letal amplo para assegurar hit-to-kill seguro no céu
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

  // 1. CHECAGEM DE DETECÇÃO POR RADAR TERRITORIAL AO ENTRAR NO ESPAÇO AÉREO DO OUTRO PAÍS
  const dxToBattery = targetPoint.x - state.battery.x;
  const dzToBattery = targetPoint.lateralDeviation - state.battery.z;
  const horizontalDistToBattery = Math.hypot(dxToBattery, dzToBattery);
  const totalDistToBattery = Math.hypot(horizontalDistToBattery, targetPoint.y);

  if (state.status === 'standby') {
    // Engajamento no momento de APOGEU ou ao adentrar o espaço aéreo do outro país
    const isAtApogee = targetPoint.phase === 'apogeu' || (Math.abs(targetPoint.vy) <= 35 && targetPoint.y >= 3000);
    const territorialBorderX = Math.min(state.battery.x - 300000, state.battery.x - state.battery.radarRangeM * 0.95);
    const hasEnteredAirspace = targetPoint.x >= territorialBorderX || totalDistToBattery <= state.battery.radarRangeM || targetPoint.x >= 4500000;
    const isApproaching = targetPoint.vx > 2;
    const isAirborne = targetPoint.y > 500;

    const shouldLaunch = state.battery.autoEngage && isAirborne && isApproaching && (isAtApogee || hasEnteredAirspace);

    if (shouldLaunch) {
      // Dispara imediatamente com vetor direto apontando para o projétil no apogeu
      const dx = targetPoint.x - state.battery.x;
      const dy = targetPoint.y - 15;
      const dz = (targetPoint.lateralDeviation || 0) - state.battery.z;
      const dTotal = Math.hypot(dx, dy, dz);
      const initSpeed = 4800; // Impulso inicial hipersônico direto ao apogeu

      const initialPoint: InterceptorPoint = {
        time: simTime,
        x: state.battery.x,
        y: 15,
        z: state.battery.z,
        vx: dTotal > 0 ? (dx / dTotal) * initSpeed : -2200,
        vy: dTotal > 0 ? (dy / dTotal) * initSpeed : 3600,
        vz: dTotal > 0 ? (dz / dTotal) * initSpeed : 0,
        speed: initSpeed,
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

  // 2. GUIAMENTO ATIVO HIPERSÔNICO PARA DESTRUIÇÃO NO CÉU
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

  // Estimativa de tempo até o encontro (Time to Go - tgo)
  const closingRelativeSpeed = Math.max(600, cur.speed + targetPoint.speed);
  const tGo = Math.max(0.05, currentDistance / closingRelativeSpeed);

  // Ponto futuro estimado de interceptação favorecendo a maior altitude possível
  const predictedTargetX = targetPoint.x + targetPoint.vx * tGo;
  const predictedTargetY = Math.max(3000, targetPoint.y + targetPoint.vy * tGo);
  const predictedTargetZ = targetPoint.lateralDeviation;

  // Vetor de direção desejada com prioridade de altitude elevada
  const aimX = predictedTargetX - cur.x;
  const aimY = (predictedTargetY - cur.y) + (cur.y < targetPoint.y ? 450 : 0);
  const aimZ = predictedTargetZ - cur.z;
  const aimDist = Math.hypot(aimX, aimY, aimZ);

  const dirX = aimDist > 0 ? aimX / aimDist : 0;
  const dirY = aimDist > 0 ? aimY / aimDist : 1;
  const dirZ = aimDist > 0 ? aimZ / aimDist : 0;

  // Aceleração do motor hipersônico e manobrabilidade extrema (45G)
  const maxAcc = 450;

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
