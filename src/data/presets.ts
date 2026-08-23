/**
 * Cenários Pré-Configurados Educacionais
 * Implementa todos os casos de estudo didáticos pedidos com parâmetros físicos reais em terras fictícias.
 */

import { PresetScenario, PlanetaryEnvironment } from '../types/physics';
import { FICTIONAL_LOCATIONS } from './fictionalGeography';
import { CONSTANTS } from '../physics/constants';

export const STANDARD_EARTH_ENVIRONMENT: PlanetaryEnvironment = {
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
    {
      minAltitude: 0,
      maxAltitude: 10000,
      speed: 12,
      directionDeg: 45,
      gustiness: 0.2,
    },
    {
      minAltitude: 10000,
      maxAltitude: 25000,
      speed: 28, // Corrente de jato estratosférica
      directionDeg: 90,
      gustiness: 0.1,
    },
  ],
};

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'artilharia-classica',
    title: '1. Projétil de Artilharia Clássica',
    subtitle: 'Mecânica Newtoniana Pura e Voo Balístico de Baixa Cota',
    category: 'basico',
    description:
      'Disparo de projétil balístico em baixa altitude sob campo gravitacional quase plano. Demonstra a simetria da parábola de Galileu, a relação entre ângulo de 45° e alcance máximo teórico, e como uma atmosfera sutil afeta levemente a trajetória.',
    educationalFocus:
      'Conservação de energia, decomposição vetorial de velocidades (vx, vy), equação horária da posição e tempo de voo quadrático.',
    launchSite: FICTIONAL_LOCATIONS.LAUNCH_COMPLEX_ALPHA,
    targetSite: FICTIONAL_LOCATIONS.TEST_ZONE_01,
    expectedOutcomes: {
      approxRangeKm: 32,
      approxApogeeKm: 8,
      physicsConcepts: ['Equação de Galileu', 'Conservação de Momento', 'Trajetória Parabólica', 'Voo de Baixa Altitude'],
    },
    environment: {
      ...STANDARD_EARTH_ENVIRONMENT,
      windLayers: [],
    },
    projectile: {
      name: 'Projétil Didático Newton-I',
      description: 'Projétil balístico sólido com queima curta de ejeção inicial.',
      noseCone: 'ogival',
      payloadMass: 45,
      launchAngleDeg: 45,
      launchAzimuthDeg: 0,
      pitchKickTime: 999,
      pitchKickAngleDeg: 45,
      targetRangeKm: 32,
      stages: [
        {
          id: 'stage-cannon',
          name: 'Impulsor de Boca',
          dryMass: 5,
          propellantMass: 25,
          currentPropellantMass: 25,
          thrust: 350000, // 350 kN por 1.2s para acelerar até ~600 m/s
          isp: 260,
          burnTime: 1.2,
          area: 0.025, // diâmetro ~180mm
          cd: 0.18,
          isSeparated: false,
        },
      ],
    },
  },
  {
    id: 'voo-suborbital-curvatura',
    title: '2. Voo Suborbital de Média Distância',
    subtitle: 'Gravidade Esférica Central, Curvatura Planetária e Reentrada',
    category: 'intermediario',
    description:
      'Lançamento de longo alcance entre o Continente Alpha e o Continente Ômega. O projétil sobe acima da linha de Kármán (100+ km) em regime orbital elíptico e experimenta desaceleração severa e aquecimento cinético ao reentrar na atmosfera.',
    educationalFocus:
      'Gravitação universal inversa ao quadrado (g(r) < g0 no apogeu), elipses de Kepler, compressão hipersônica e dissipação de energia cinética.',
    launchSite: FICTIONAL_LOCATIONS.LAUNCH_COMPLEX_ALPHA,
    targetSite: FICTIONAL_LOCATIONS.TARGET_GRID_OMEGA,
    expectedOutcomes: {
      approxRangeKm: 2400,
      approxApogeeKm: 380,
      physicsConcepts: ['Mecânica Orbital de Kepler', 'Linha de Kármán', 'Reentrada Hipersônica', 'Fluxo Térmico'],
    },
    environment: STANDARD_EARTH_ENVIRONMENT,
    projectile: {
      name: 'Veículo de Pesquisa Suborbital Kepler-X',
      description: 'Foguete suborbital mono-estágio de alta performance para alcance intercontinental.',
      noseCone: 'pontiagudo',
      payloadMass: 300,
      launchAngleDeg: 82,
      launchAzimuthDeg: 0,
      pitchKickTime: 12,
      pitchKickAngleDeg: 46,
      targetRangeKm: 2400,
      stages: [
        {
          id: 'stage-suborbital',
          name: 'Motor Criogênico Suborbital',
          dryMass: 750,
          propellantMass: 6600,
          currentPropellantMass: 6600,
          thrust: 165000, // 165 kN
          isp: 325,
          burnTime: 130,
          area: 0.45,
          cd: 0.12,
          isSeparated: false,
        },
      ],
    },
  },
  {
    id: 'vento-cruzado-coriolis',
    title: '3. Efeito do Vento Cruzado e Coriolis',
    subtitle: 'Desvio Lateral Dinâmico por Forças Aerodinâmicas e Rotação',
    category: 'intermediario',
    description:
      'Experimento de trajetória com fortes camadas de vento lateral de 40 m/s na média altitude e rotação planetária ativada. Demonstra como o vetor velocidade relativa induz arrasto tridimensional e dispersão fora do plano cartesiano original.',
    educationalFocus:
      'Arrasto 3D vetorial (F_drag = -0.5 * rho * v_rel² * Cd * A * v_rel_hat), aceleração de Coriolis (-2 * omega x v) e deflexão azimutal.',
    launchSite: FICTIONAL_LOCATIONS.LAUNCH_COMPLEX_ALPHA,
    targetSite: FICTIONAL_LOCATIONS.NEUTRAL_ARCHIPELAGO_BUOY,
    expectedOutcomes: {
      approxRangeKm: 420,
      approxApogeeKm: 65,
      physicsConcepts: ['Vetor de Vento Relativo', 'Força de Coriolis', 'Desvio Azimutal', 'Dispersão Lateral'],
    },
    environment: {
      ...STANDARD_EARTH_ENVIRONMENT,
      enableCoriolis: true,
      windLayers: [
        {
          minAltitude: 0,
          maxAltitude: 8000,
          speed: 15,
          directionDeg: 90, // Vento lateral puro
          gustiness: 0.3,
        },
        {
          minAltitude: 8000,
          maxAltitude: 22000,
          speed: 42, // Corrente de jato severa
          directionDeg: 90,
          gustiness: 0.2,
        },
      ],
    },
    projectile: {
      name: 'Sonda Atmosférica Coriolis-V',
      description: 'Sonda experimental de pesquisa com estabilização inercial.',
      noseCone: 'ogival',
      payloadMass: 180,
      launchAngleDeg: 78,
      launchAzimuthDeg: 0,
      pitchKickTime: 10,
      pitchKickAngleDeg: 55,
      targetRangeKm: 420,
      stages: [
        {
          id: 'stage-crosswind',
          name: 'Propulsor Sólido',
          dryMass: 400,
          propellantMass: 2100,
          currentPropellantMass: 2100,
          thrust: 75000,
          isp: 285,
          burnTime: 78,
          area: 0.32,
          cd: 0.22,
          isSeparated: false,
        },
      ],
    },
  },
  {
    id: 'coeficiente-aerodinamico-comparativo',
    title: '4. Influência do Coeficiente Aerodinâmico',
    subtitle: 'Comparação Hidrodinâmica: Ogiva Pontiaguda vs. Corpo Rombudo',
    category: 'avancado',
    description:
      'Configuração com corpo de alto arrasto frontal (Nose Cone Rombudo com Cd elevado). Ao comparar com projéteis finos, o usuário observa a frenagem drástica na baixa atmosfera, perda prematura de energia cinética e redução substancial de alcance.',
    educationalFocus:
      'Regime de choque transônico, onda de choque descolada (blunt body shock wave), dissipação térmica vs. penetração aerodinâmica.',
    launchSite: FICTIONAL_LOCATIONS.LAUNCH_COMPLEX_ALPHA,
    targetSite: FICTIONAL_LOCATIONS.TEST_ZONE_01,
    expectedOutcomes: {
      approxRangeKm: 180,
      approxApogeeKm: 42,
      physicsConcepts: ['Arrasto de Pressão', 'Pico Transônico de Onda', 'Onda de Choque Descolada', 'Perda de Energia'],
    },
    environment: STANDARD_EARTH_ENVIRONMENT,
    projectile: {
      name: 'Veículo Teste de Alto Arrasto (Blunt Body)',
      description: 'Cápsula de teste aerodinâmico com seção frontal rombuda e alto Cd.',
      noseCone: 'rombudo',
      payloadMass: 250,
      launchAngleDeg: 70,
      launchAzimuthDeg: 0,
      pitchKickTime: 8,
      pitchKickAngleDeg: 52,
      targetRangeKm: 180,
      stages: [
        {
          id: 'stage-drag-test',
          name: 'Impulsor Experimental',
          dryMass: 350,
          propellantMass: 1400,
          currentPropellantMass: 1400,
          thrust: 55000,
          isp: 270,
          burnTime: 68,
          area: 0.85, // Grande área frontal
          cd: 0.82,  // Alto coeficiente de arrasto
          isSeparated: false,
        },
      ],
    },
  },
  {
    id: 'multiplos-estagios-eficiencia',
    title: '5. Lançamento com Múltiplos Estágios',
    subtitle: 'Equação de Tsiolkovsky e Descarte de Massa Estrutural Morta',
    category: 'avancado',
    description:
      'Veículo de 2 estágios em série. Mostra visualmente o momento da queima do 1º estágio, o desacoplamento da massa seca vazia (jettison) e a ignição do 2º estágio no ar rarefeito, maximizando o Delta-V final e alcançando distâncias intercontinentais.',
    educationalFocus:
      'Fórmula de Tsiolkovsky em estágios múltiplos (DeltaV_total = sum(Isp_i * g0 * ln(m0_i / mf_i))), eficiência da fração de propelente e aceleração crescente.',
    launchSite: FICTIONAL_LOCATIONS.LAUNCH_COMPLEX_ALPHA,
    targetSite: FICTIONAL_LOCATIONS.TARGET_GRID_OMEGA,
    expectedOutcomes: {
      approxRangeKm: 4800,
      approxApogeeKm: 650,
      physicsConcepts: ['Equação de Tsiolkovsky Multi-Estágio', 'Fração de Massa Estrutural', 'Salto de Eficiência', 'Trajetória de Longo Alcance'],
    },
    environment: STANDARD_EARTH_ENVIRONMENT,
    projectile: {
      name: 'Veículo Multi-Estágio Tsiolkovsky-II',
      description: 'Lançador de 2 estágios com separação sequencial automatizada.',
      noseCone: 'pontiagudo',
      payloadMass: 400,
      launchAngleDeg: 85,
      launchAzimuthDeg: 0,
      pitchKickTime: 14,
      pitchKickAngleDeg: 42,
      targetRangeKm: 4800,
      stages: [
        {
          id: 'stage-1-booster',
          name: 'Estágio 1 (Booster Principal)',
          dryMass: 1800,
          propellantMass: 14000,
          currentPropellantMass: 14000,
          thrust: 320000, // 320 kN
          isp: 290,
          burnTime: 124,
          area: 0.95,
          cd: 0.16,
          isSeparated: false,
        },
        {
          id: 'stage-2-orbital',
          name: 'Estágio 2 (Vácuo / Alta Cota)',
          dryMass: 600,
          propellantMass: 4500,
          currentPropellantMass: 4500,
          thrust: 85000, // 85 kN
          isp: 345, // Maior eficiência de tubeira no vácuo
          burnTime: 178,
          area: 0.55,
          cd: 0.12,
          isSeparated: false,
        },
      ],
    },
  },
  {
    id: 'monte-carlo-cep-dispersao',
    title: '6. Análise Estocástica de Dispersão (CEP)',
    subtitle: 'Método de Monte Carlo e Incerteza do Erro Circular Provável',
    category: 'estocastico',
    description:
      'Execução de dezenas de simulações com perturbações aleatórias de vento, empuxo e aerodinâmica para calcular o raio CEP (Circular Error Probable) de 50% e 95% e plotar a elipse de dispersão no plano terminal.',
    educationalFocus:
      'Estatística aplicada à balística, variância de trajetórias, distribuição normal de rajadas e quantis de dispersão de impacto.',
    launchSite: FICTIONAL_LOCATIONS.LAUNCH_COMPLEX_ALPHA,
    targetSite: FICTIONAL_LOCATIONS.TEST_ZONE_01,
    expectedOutcomes: {
      approxRangeKm: 280,
      approxApogeeKm: 55,
      physicsConcepts: ['Simulação de Monte Carlo', 'Cálculo de CEP 50% / 95%', 'Elipse de Dispersão', 'Incerteza Estocástica'],
    },
    environment: {
      ...STANDARD_EARTH_ENVIRONMENT,
      windLayers: [
        {
          minAltitude: 0,
          maxAltitude: 15000,
          speed: 18,
          directionDeg: 60,
          gustiness: 0.4,
        },
      ],
    },
    projectile: {
      name: 'Veículo Estocástico Gauss-Prober',
      description: 'Veículo balístico de precisão para amostragem estocástica.',
      noseCone: 'ogival',
      payloadMass: 150,
      launchAngleDeg: 75,
      launchAzimuthDeg: 0,
      pitchKickTime: 8,
      pitchKickAngleDeg: 50,
      targetRangeKm: 280,
      stages: [
        {
          id: 'stage-stochastic',
          name: 'Propulsor Sólido Padrão',
          dryMass: 300,
          propellantMass: 1600,
          currentPropellantMass: 1600,
          thrust: 62000,
          isp: 278,
          burnTime: 70,
          area: 0.28,
          cd: 0.2,
          isSeparated: false,
        },
      ],
    },
  },
];
