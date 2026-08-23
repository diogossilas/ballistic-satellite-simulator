/**
 * Módulo de Satélites de Defesa Orbital e Bombardeio Cinético ("Varas de Deus" / Project Thor)
 * 
 * Regras Operacionais Estratégicas:
 * 1. Constelação Orbital de Satélites Thor ("Varas de Deus"):
 *    - Satélites equipados com hastes de tungstênio puro de 9.000 kg (Project Thor).
 *    - Posicionados em órbita sobre o território agressor (Origem / Federação Alpha: x de 150 km a 1.300 km).
 * 2. Gatilho de Liberação das Varas de Deus:
 *    - Liberadas automaticamente imediatamente APÓS a destruição mútua no céu e a vitória da defesa da República Territorial.
 * 3. Destruição de Área no Mapa:
 *    - Ao reentrarem em velocidades hipersônicas (Mach 10+) e colidirem com o solo, cada Vara dissipa gigajoules de energia cinética.
 *    - Abre crateras gigantes e aniquila uma área ao redor do ponto de impacto, destruindo estruturas, edificações e alterando a topografia.
 */

import {
  OrbitalSatellite,
  KineticRod,
  SatelliteDefenseSystemState,
  TelemetryPoint,
  PlanetaryEnvironment,
  InterceptorState,
} from '../types/physics';
import { CONSTANTS } from './constants';
import { getAtmosphericState, calculateDynamicCd, calculateDragForce } from './atmosphere';

/**
 * Cria a constelação orbital estratégica de Satélites Thor ("Varas de Deus")
 * Posicionados sobre as bases militares e complexos estratégicos do agressor
 */
export function createDefaultSatelliteConstellation(targetRangeM: number): OrbitalSatellite[] {
  const scale = Math.max(1, targetRangeM / 6500000);

  return [
    {
      id: 'sat-thor-01-kinetic',
      name: 'SAT-Thor I (Plataforma Orbital Alpha-Norte)',
      code: 'THOR-01',
      type: 'rods_from_god',
      status: 'orbiting',
      altitudeM: 420000, // 420 km LEO (Altitude Espacial Ampliada)
      x: 220000 * scale, // Orbitando sobre a plataforma de lançamento original
      z: -45000,
      orbitalSpeedMs: 7660,
      assignedRegion: 'enemy_territory',
      rodsLoaded: 2,
      rodsLaunched: 0,
      description: 'Plataforma orbital armada com hastes de tungstênio posicionada no teto LEO (420 km).',
    },
    {
      id: 'sat-thor-02-kinetic',
      name: 'SAT-Thor II (Plataforma Orbital Setor de Silos)',
      code: 'THOR-02',
      type: 'rods_from_god',
      status: 'orbiting',
      altitudeM: 460000, // 460 km LEO
      x: 750000 * scale, // Orbitando sobre o setor de silos subterrâneos
      z: 55000,
      orbitalSpeedMs: 7650,
      assignedRegion: 'enemy_territory',
      rodsLoaded: 2,
      rodsLaunched: 0,
      description: 'Plataforma orbital armada com Varas de Deus para saturação de silos e bunkers (460 km).',
    },
    {
      id: 'sat-thor-03-kinetic',
      name: 'SAT-Thor III (Plataforma Orbital Centro de Comando)',
      code: 'THOR-03',
      type: 'rods_from_god',
      status: 'orbiting',
      altitudeM: 440000, // 440 km LEO
      x: 1450000 * scale, // Orbitando sobre o comando militar e bases avançadas
      z: -35000,
      orbitalSpeedMs: 7670,
      assignedRegion: 'enemy_territory',
      rodsLoaded: 2,
      rodsLaunched: 0,
      description: 'Plataforma orbital de interceptação e ataque cinético a alvos estratégicos (440 km).',
    },
    {
      id: 'sat-thor-04-kinetic',
      name: 'SAT-Thor IV (Plataforma Orbital Setor Central)',
      code: 'THOR-04',
      type: 'rods_from_god',
      status: 'orbiting',
      altitudeM: 480000, // 480 km LEO
      x: 2100000 * scale, // Cobertura de transição continental
      z: 30000,
      orbitalSpeedMs: 7640,
      assignedRegion: 'enemy_territory',
      rodsLoaded: 2,
      rodsLaunched: 0,
      description: 'Plataforma de vigilância e bombardeio de alta órbita (480 km).',
    },
  ];
}

/**
 * Cria o estado inicial do sistema de defesa por satélites
 */
export function createInitialSatelliteDefenseState(targetRangeM: number): SatelliteDefenseSystemState {
  const satellites = createDefaultSatelliteConstellation(targetRangeM);
  return {
    satellites,
    rods: [],
    retaliationTriggered: false,
    retaliationTriggerTime: null,
    totalRodsImpacted: 0,
    totalKineticDamageJoules: 0,
  };
}

/**
 * Dispara o bombardeio cinético simultâneo ("Varas de Deus") de todas as plataformas Thor
 * Após a vitória e destruição do míssil agressor no céu pela defesa da República Territorial
 */
export function triggerKineticBombardment(
  state: SatelliteDefenseSystemState,
  simTime: number,
  targetRangeKm: number
): SatelliteDefenseSystemState {
  if (state.retaliationTriggered) return state;

  const newRods: KineticRod[] = [];
  const scale = Math.max(1, (targetRangeKm * 1000) / 6500000);

  // Alvos estratégicos no território que atacou (Setor Alpha - Origem)
  const targetLocations = [
    { name: 'Centro de Lançamento Alpha-1 (Base Agressora)', x: 45000 * scale, z: -30000 },
    { name: 'Complexo de Silos Subterrâneos Alpha', x: 650000 * scale, z: 45000 },
    { name: 'Base Aérea & Centro de Comando Militar Alpha', x: 1350000 * scale, z: -40000 },
    { name: 'Distrito Industrial Militar & Bateria Radar Alpha', x: 1950000 * scale, z: 50000 },
  ];

  const updatedSatellites = state.satellites.map((sat, idx) => {
    if (sat.type === 'rods_from_god' && sat.rodsLoaded > 0) {
      const target = targetLocations[idx % targetLocations.length];
      const rodMass = 9000; // 9 toneladas de tungstênio puro

      // Vetor de desorbitagem e reentrada vertical íngreme
      const dx = target.x - sat.x;
      const dz = target.z - sat.z;
      const horizDist = Math.hypot(dx, dz);
      const deorbitVy = -1100; // Desorbitagem hipersônica
      const deorbitVx = (dx / Math.max(1000, horizDist)) * 2100;
      const deorbitVz = (dz / Math.max(1000, horizDist)) * 2100;

      const rod: KineticRod = {
        id: `rod-${sat.id}-${Date.now()}-${idx}`,
        satelliteId: sat.id,
        satelliteName: sat.name,
        releaseTime: simTime,
        x: sat.x,
        y: sat.altitudeM,
        z: sat.z,
        vx: deorbitVx,
        vy: deorbitVy,
        vz: deorbitVz,
        speed: Math.hypot(deorbitVx, deorbitVy, deorbitVz),
        mach: 0,
        massKg: rodMass,
        targetX: target.x,
        targetZ: target.z,
        targetName: target.name,
        status: 'falling',
        blastRadiusKm: 25 + Math.random() * 15, // Raio de destruição de área de 25 a 40 km
        history: [{ x: sat.x, y: sat.altitudeM, z: sat.z, time: simTime }],
      };

      newRods.push(rod);

      return {
        ...sat,
        status: 'launching_rod' as const,
        rodsLoaded: sat.rodsLoaded - 1,
        rodsLaunched: sat.rodsLaunched + 1,
      };
    }
    return sat;
  });

  return {
    ...state,
    satellites: updatedSatellites,
    rods: [...state.rods, ...newRods],
    retaliationTriggered: true,
    retaliationTriggerTime: simTime,
  };
}

/**
 * Passo de atualização física das Varas de Deus e satélites
 */
export function stepSatelliteDefense(
  state: SatelliteDefenseSystemState,
  targetPoint: TelemetryPoint | null,
  interceptorState: InterceptorState,
  env: PlanetaryEnvironment,
  dt: number,
  simTime: number,
  targetRangeKm: number
): SatelliteDefenseSystemState {
  let updatedState = { ...state };

  // 1. RETALIAÇÃO COM "VARAS DE DEUS" APÓS VITÓRIA DA DEFESA DA REPÚBLICA TERRITORIAL
  // Quando o interceptor destrói o míssil no ar, solta as Varas de Deus
  const isTargetDestroyedByInterceptor =
    interceptorState.status === 'intercepted' ||
    interceptorState.killConfirmed ||
    (targetPoint !== null && targetPoint.phase === 'destruido');

  if (isTargetDestroyedByInterceptor && !updatedState.retaliationTriggered) {
    updatedState = triggerKineticBombardment(updatedState, simTime, targetRangeKm);
  }

  // 2. INTEGRAÇÃO FÍSICA DETERMINÍSTICA DAS HASTES DE TUNGSTÊNIO (VARAS DE DEUS)
  let newlyImpactedCount = 0;
  let additionalDamageJoules = 0;
  const newlyImpactedLocations: Array<{ name: string; xKm: number; zKm: number; craterM: number; blastKm: number }> = [];

  const updatedRods = updatedState.rods.map((rod) => {
    if (rod.status === 'impacted') return rod;

    // Aceleração gravitacional inversa ao quadrado
    const r = env.planetRadius + Math.max(0, rod.y);
    const gLocal = env.surfaceGravity * Math.pow(env.planetRadius / r, 2);

    // Arrasto aerodinâmico em reentrada hipersônica
    let dragX = 0;
    let dragY = 0;
    let dragZ = 0;
    let mach = 0;

    const currentSpeed = Math.hypot(rod.vx, rod.vy, rod.vz);

    if (env.enableAtmosphere && rod.y < env.atmosphereCeiling) {
      const atmo = getAtmosphericState(rod.y, env.seaLevelAirDensity);
      mach = atmo.speedOfSound > 0 ? currentSpeed / atmo.speedOfSound : 0;

      // Haste pontiaguda ultra-aerodinâmica (área frontal ~0.07 m², Cd ~0.08)
      const rodArea = 0.07;
      const dynamicCd = calculateDynamicCd(0.08, mach, 'pontiagudo');
      const dragForce = calculateDragForce(atmo.density, currentSpeed, dynamicCd, rodArea);

      if (currentSpeed > 1e-3) {
        dragX = -dragForce * (rod.vx / currentSpeed);
        dragY = -dragForce * (rod.vy / currentSpeed);
        dragZ = -dragForce * (rod.vz / currentSpeed);
      }
    }

    // Acelerações (a = F/m)
    const ax = dragX / rod.massKg;
    const ay = dragY / rod.massKg - gLocal;
    const az = dragZ / rod.massKg;

    // Atualização de velocidade
    const newVx = rod.vx + ax * dt;
    const newVy = rod.vy + ay * dt;
    const newVz = rod.vz + az * dt;
    const newSpeed = Math.hypot(newVx, newVy, newVz);

    // Atualização de posição
    const newX = rod.x + newVx * dt;
    const newY = Math.max(0, rod.y + newVy * dt);
    const newZ = rod.z + newVz * dt;

    // Determina status de reentrada / impacto
    let newStatus: 'falling' | 'reentering' | 'impacted' = 'falling';
    if (newY <= 0) {
      newStatus = 'impacted';
      newlyImpactedCount++;
      const impactSpeed = newSpeed;
      const kineticEnergyJ = 0.5 * rod.massKg * Math.pow(impactSpeed, 2);
      const tntEquivalentTons = kineticEnergyJ / (CONSTANTS.TNT_JOULES_PER_KG * 1000);
      const craterDiameterM = Math.round(0.075 * Math.pow(kineticEnergyJ, 1 / 3.4));
      const blastRadiusKm = rod.blastRadiusKm || 30;
      additionalDamageJoules += kineticEnergyJ;

      newlyImpactedLocations.push({
        name: rod.targetName,
        xKm: newX / 1000,
        zKm: newZ / 1000,
        craterM: craterDiameterM,
        blastKm: blastRadiusKm,
      });

      return {
        ...rod,
        x: newX,
        y: 0,
        z: newZ,
        vx: 0,
        vy: 0,
        vz: 0,
        speed: 0,
        mach,
        status: newStatus,
        impactTime: simTime,
        impactSpeed,
        impactKineticEnergyJ: kineticEnergyJ,
        impactTntEquivalentTons: tntEquivalentTons,
        craterDiameterM,
        blastRadiusKm,
        history: [...rod.history, { x: newX, y: 0, z: newZ, time: simTime }],
      };
    } else if (newY < 70000) {
      newStatus = 'reentering';
    }

    return {
      ...rod,
      x: newX,
      y: newY,
      z: newZ,
      vx: newVx,
      vy: newVy,
      vz: newVz,
      speed: newSpeed,
      mach,
      status: newStatus,
      history: [...rod.history, { x: newX, y: newY, z: newZ, time: simTime }],
    };
  });

  // Atualiza status dos satélites Thor
  const updatedSatellites = updatedState.satellites.map((sat) => {
    if (sat.type === 'rods_from_god') {
      if (updatedState.retaliationTriggered) {
        return {
          ...sat,
          status: sat.rodsLoaded === 0 ? ('mission_completed' as const) : ('launching_rod' as const),
        };
      }
    }
    return sat;
  });

  return {
    ...updatedState,
    satellites: updatedSatellites,
    rods: updatedRods,
    totalRodsImpacted: updatedState.totalRodsImpacted + newlyImpactedCount,
    totalKineticDamageJoules: updatedState.totalKineticDamageJoules + additionalDamageJoules,
  };
}
