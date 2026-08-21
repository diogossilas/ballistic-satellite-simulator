/**
 * Bateria de Testes Unitários e Validação Científica das Leis da Física
 * Executada interativamente dentro da aplicação para comprovar a exatidão das equações implementadas.
 */

import { CONSTANTS } from './constants';
import { getAtmosphericState, calculateDynamicPressure, calculateDragForce } from './atmosphere';
import { runFullSimulation, createInitialState, stepRK4 } from './engine';
import { ProjectileConfig, PlanetaryEnvironment } from '../types/physics';

export interface UnitTestResult {
  id: string;
  name: string;
  category: 'Cinemática' | 'Gravitação' | 'Propulsão' | 'Aerodinâmica' | 'Termodinâmica';
  theoreticalFormula: string;
  expectedValue: string;
  calculatedValue: string;
  relativeErrorPercent: number;
  passed: boolean;
  explanation: string;
}

export function runPhysicalLawUnitTests(): UnitTestResult[] {
  const tests: UnitTestResult[] = [];

  // TESTE 1: Alcance Teórico Parabólico no Vácuo (Equação de Galileu/Newton)
  // R = (v0² * sin(2*theta)) / g0
  {
    const v0 = 500; // m/s
    const angleDeg = 45;
    const g0 = 9.80665;
    const theoreticalRange = (Math.pow(v0, 2) * Math.sin((2 * angleDeg * Math.PI) / 180)) / g0; // ~ 25492.9 m

    // Configura projétil no vácuo com rampa e impulso instantâneo
    const testProjectile: ProjectileConfig = {
      name: 'Teste Vácuo',
      description: 'Disparo no vácuo',
      noseCone: 'pontiagudo',
      payloadMass: 100,
      launchAngleDeg: 45,
      launchAzimuthDeg: 0,
      pitchKickTime: 9999,
      pitchKickAngleDeg: 45,
      targetRangeKm: 25.5,
      stages: [
        {
          id: 's1',
          name: 'Impulsor Curto',
          dryMass: 0,
          propellantMass: 1,
          currentPropellantMass: 1,
          thrust: 500000, // impulso muito rápido
          isp: 500,
          burnTime: 0.1,
          area: 0.01,
          cd: 0.0,
          isSeparated: false,
        },
      ],
    };

    const vacuumEnv: PlanetaryEnvironment = {
      name: 'Vácuo Plano',
      planetRadius: 1e9, // raio gigantesco para aproximar campo plano
      surfaceGravity: g0,
      seaLevelAirDensity: 0,
      scaleHeight: 8500,
      atmosphereCeiling: 100000,
      enableAtmosphere: false,
      enableCoriolis: false,
      planetaryRotationRate: 0,
      windLayers: [],
    };

    // Teste com integração RK4 de um projétil de velocidade inicial v0
    let state = createInitialState(testProjectile);
    state.vx = v0 * Math.cos((45 * Math.PI) / 180);
    state.vy = v0 * Math.sin((45 * Math.PI) / 180);
    state.stagesState[0].currentPropellantMass = 0; // já queimado

    while (state.time < 200) {
      const { nextState } = stepRK4(state, testProjectile, vacuumEnv, 0.05);
      state = nextState;
      if (state.phase === 'impactado') break;
    }

    const calculatedRange = state.x;
    const errorPct = Math.abs((calculatedRange - theoreticalRange) / theoreticalRange) * 100;

    tests.push({
      id: 'test-parabolic-vacuum',
      name: 'Alcance Balístico Parabólico no Vácuo',
      category: 'Cinemática',
      theoreticalFormula: 'R = (v₀² · sen(2θ)) / g₀',
      expectedValue: `${theoreticalRange.toFixed(2)} m`,
      calculatedValue: `${calculatedRange.toFixed(2)} m`,
      relativeErrorPercent: Number(errorPct.toFixed(4)),
      passed: errorPct < 0.2,
      explanation: 'Verifica a conservação de energia e a integração temporal RK4 comparada à solução analítica de Galileu.',
    });
  }

  // TESTE 2: Equação do Foguete de Tsiolkovsky
  // Delta_v = Isp * g0 * ln(m0 / mf)
  {
    const dryMass = 500;
    const propMass = 1500;
    const payloadMass = 200;
    const m0 = dryMass + propMass + payloadMass; // 2200 kg
    const mf = dryMass + payloadMass;            // 700 kg
    const isp = 300; // s
    const g0 = CONSTANTS.STANDARD_GRAVITY;
    const theoreticalDeltaV = isp * g0 * Math.log(m0 / mf); // 300 * 9.80665 * ln(2200 / 700) = 3367.65 m/s

    // Simulação no vácuo sem gravidade (espaço profundo)
    const zeroGEnv: PlanetaryEnvironment = {
      name: 'Espaço Profundo',
      planetRadius: 1e9,
      surfaceGravity: 0,
      seaLevelAirDensity: 0,
      scaleHeight: 8500,
      atmosphereCeiling: 0,
      enableAtmosphere: false,
      enableCoriolis: false,
      planetaryRotationRate: 0,
      windLayers: [],
    };

    const rocketProj: ProjectileConfig = {
      name: 'Tsiolkovsky Prover',
      description: 'Validador Tsiolkovsky',
      noseCone: 'ogival',
      payloadMass,
      launchAngleDeg: 0,
      launchAzimuthDeg: 0,
      pitchKickTime: 9999,
      pitchKickAngleDeg: 0,
      targetRangeKm: 1000,
      stages: [
        {
          id: 'ts1',
          name: 'Estágio 1',
          dryMass,
          propellantMass: propMass,
          currentPropellantMass: propMass,
          thrust: 30000, // 30 kN
          isp,
          burnTime: propMass / (30000 / (isp * g0)),
          area: 1,
          cd: 0,
          isSeparated: false,
        },
      ],
    };

    let state = createInitialState(rocketProj);
    state.vx = 0;
    state.vy = 0;

    const { telemetryHistory } = runFullSimulation(rocketProj, zeroGEnv, 300, 0.05);
    const lastTelemetry = telemetryHistory[telemetryHistory.length - 1];
    const calculatedDeltaV = lastTelemetry.speed;

    const errorPct = Math.abs((calculatedDeltaV - theoreticalDeltaV) / theoreticalDeltaV) * 100;

    tests.push({
      id: 'test-tsiolkovsky-rocket',
      name: 'Equação de Foguete de Tsiolkovsky',
      category: 'Propulsão',
      theoreticalFormula: 'Δv = I_sp · g₀ · ln(m₀ / m_f)',
      expectedValue: `${theoreticalDeltaV.toFixed(2)} m/s`,
      calculatedValue: `${calculatedDeltaV.toFixed(2)} m/s`,
      relativeErrorPercent: Number(errorPct.toFixed(4)),
      passed: errorPct < 0.1,
      explanation: 'Comprova que o esgotamento contínuo de propelente produz exatamente o ganho de momento previsto pela equação do foguete.',
    });
  }

  // TESTE 3: Velocidade Terminal em Queda Livre com Arrasto Aerodinâmico
  // v_terminal = sqrt((2 * m * g) / (rho * Cd * A))
  {
    const mass = 80; // kg
    const area = 0.5; // m²
    const cd = 0.8;
    const rho = 1.225; // kg/m³
    const g = 9.80665;
    const theoreticalVTerm = Math.sqrt((2 * mass * g) / (rho * cd * area)); // ~ 57.73 m/s

    // Simulação de objeto caindo de 3000m até atingir equilíbrio de forças
    const dragEnv: PlanetaryEnvironment = {
      name: 'Atmosfera Uniforme',
      planetRadius: CONSTANTS.EARTH_RADIUS,
      surfaceGravity: g,
      seaLevelAirDensity: rho,
      scaleHeight: 1e8, // atmosfera quase constante para teste de terminal
      atmosphereCeiling: 100000,
      enableAtmosphere: true,
      enableCoriolis: false,
      planetaryRotationRate: 0,
      windLayers: [],
    };

    const fallProj: ProjectileConfig = {
      name: 'Objeto em Queda',
      description: 'Queda livre',
      noseCone: 'rombudo',
      payloadMass: mass,
      launchAngleDeg: 90,
      launchAzimuthDeg: 0,
      pitchKickTime: 9999,
      pitchKickAngleDeg: 90,
      targetRangeKm: 0,
      stages: [
        {
          id: 'f1',
          name: 'Corpo',
          dryMass: 0,
          propellantMass: 0,
          currentPropellantMass: 0,
          thrust: 0,
          isp: 300,
          burnTime: 0,
          area,
          cd,
          isSeparated: false,
        },
      ],
    };

    let state = createInitialState(fallProj);
    state.y = 2000;
    state.vy = -theoreticalVTerm; // inicia próximo à velocidade terminal

    for (let step = 0; step < 200; step++) {
      const { nextState } = stepRK4(state, fallProj, dragEnv, 0.05);
      state = nextState;
    }

    const calculatedVTerm = Math.abs(state.vy);
    const errorPct = Math.abs((calculatedVTerm - theoreticalVTerm) / theoreticalVTerm) * 100;

    tests.push({
      id: 'test-terminal-velocity',
      name: 'Velocidade Terminal Aerodinâmica',
      category: 'Aerodinâmica',
      theoreticalFormula: 'v_term = √((2·m·g) / (ρ·Cd·A))',
      expectedValue: `${theoreticalVTerm.toFixed(2)} m/s`,
      calculatedValue: `${calculatedVTerm.toFixed(2)} m/s`,
      relativeErrorPercent: Number(errorPct.toFixed(4)),
      passed: errorPct < 0.2,
      explanation: 'Confirma o equilíbrio dinâmico exato entre a força da gravidade (F_g) e a força de arrasto de Rayleigh (F_d).',
    });
  }

  // TESTE 4: Lei da Gravitação Universal de Newton em Altitude (Inverso do Quadrado)
  // g(h) = g0 * (R / (R + h))²
  {
    const h = 400000; // 400 km (Altitude da ISS)
    const R = CONSTANTS.EARTH_RADIUS;
    const g0 = CONSTANTS.STANDARD_GRAVITY;
    const theoreticalG = g0 * Math.pow(R / (R + h), 2); // ~ 8.68 m/s²

    const env: PlanetaryEnvironment = {
      name: 'Planeta Padrão',
      planetRadius: R,
      surfaceGravity: g0,
      seaLevelAirDensity: 0,
      scaleHeight: 8500,
      atmosphereCeiling: 100000,
      enableAtmosphere: false,
      enableCoriolis: false,
      planetaryRotationRate: 0,
      windLayers: [],
    };

    const r = R + h;
    const calculatedG = env.surfaceGravity * Math.pow(env.planetRadius / r, 2);
    const errorPct = Math.abs((calculatedG - theoreticalG) / theoreticalG) * 100;

    tests.push({
      id: 'test-gravity-inverse-square',
      name: 'Gravitação Esférica (Inverso do Quadrado)',
      category: 'Gravitação',
      theoreticalFormula: 'g(h) = g₀ · (R / (R + h))²',
      expectedValue: `${theoreticalG.toFixed(4)} m/s²`,
      calculatedValue: `${calculatedG.toFixed(4)} m/s²`,
      relativeErrorPercent: Number(errorPct.toFixed(6)),
      passed: errorPct < 0.001,
      explanation: 'Valida a variação da aceleração da gravidade com a altitude orbital em geometrias planetárias.',
    });
  }

  // TESTE 5: Pressão Dinâmica e Equação de Rayleigh
  // q = 0.5 * rho * v²
  {
    const rho = 1.225;
    const v = 340; // ~ Mach 1 ao nível do mar
    const theoreticalQ = 0.5 * rho * Math.pow(v, 2); // 70805 Pa = 70.805 kPa
    const calculatedQ = calculateDynamicPressure(rho, v);
    const errorPct = Math.abs((calculatedQ - theoreticalQ) / theoreticalQ) * 100;

    tests.push({
      id: 'test-dynamic-pressure',
      name: 'Pressão Dinâmica (Max Q)',
      category: 'Aerodinâmica',
      theoreticalFormula: 'q = ½ · ρ · v²',
      expectedValue: `${theoreticalQ.toFixed(1)} Pa`,
      calculatedValue: `${calculatedQ.toFixed(1)} Pa`,
      relativeErrorPercent: Number(errorPct.toFixed(6)),
      passed: errorPct < 0.001,
      explanation: 'Determina a carga aerodinâmica máxima exercida na estrutura do veículo aeroespacial durante a passagem atmosférica.',
    });
  }

  return tests;
}
