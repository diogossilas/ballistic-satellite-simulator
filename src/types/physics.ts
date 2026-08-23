/**
 * Tipos e interfaces fundamentais para o Simulador Balístico Fictício
 * Rigor físico e modelagem matemática determinística
 */

export interface Vector2D {
  x: number; // Alcance horizontal / eixo X (metros)
  y: number; // Altitude / eixo Y (metros)
}

export interface Vector3D {
  x: number; // Coordenada X no referencial inercial/cartesiano (m)
  y: number; // Coordenada Y (m)
  z: number; // Coordenada Z (m)
}

export type NoseConeType = 'pontiagudo' | 'ogival' | 'conico' | 'rombudo';

export interface RocketStage {
  id: string;
  name: string;
  dryMass: number;        // Massa seca da estrutura do estágio (kg)
  propellantMass: number; // Massa inicial de propelente (kg)
  currentPropellantMass: number; // Massa atual de propelente (kg)
  thrust: number;         // Empuxo gerado pelo motor (Newtons)
  isp: number;            // Impulso específico no vácuo/nível do mar médio (segundos)
  burnTime: number;       // Tempo total de queima (segundos)
  area: number;           // Área da seção transversal frontal (m²)
  cd: number;             // Coeficiente de arrasto aerodinâmico base
  isSeparated: boolean;   // Se o estágio já foi desacoplado
}

export interface ProjectileConfig {
  name: string;
  description: string;
  noseCone: NoseConeType;
  stages: RocketStage[];
  payloadMass: number;      // Massa da carga útil no topo (kg)
  launchAngleDeg: number;   // Ângulo inicial de elevação (graus, 0 a 90)
  launchAzimuthDeg: number; // Azimute / direção (graus)
  pitchKickTime: number;    // Momento da manobra de inclinação (segundos)
  pitchKickAngleDeg: number;// Ângulo alvo de inclinação (graus)
  targetRangeKm: number;    // Alcance alvo projetado (km)
}

export interface WindLayer {
  minAltitude: number; // Altitude mínima da camada (m)
  maxAltitude: number; // Altitude máxima da camada (m)
  speed: number;       // Velocidade média do vento (m/s)
  directionDeg: number;// Direção do vento (graus)
  gustiness: number;   // Fator de rajada/turbulência (0 a 1)
}

export interface PlanetaryEnvironment {
  name: string;
  planetRadius: number;       // Raio do planeta fictício (m) - Terra padrão ~ 6.371.000m
  surfaceGravity: number;     // Gravidade na superfície g0 (m/s²) - padrão 9.80665 m/s²
  seaLevelAirDensity: number; // Densidade do ar ao nível do mar rho0 (kg/m³) - padrão 1.225 kg/m³
  scaleHeight: number;        // Altura de escala da atmosfera H (m) - padrão ~ 8500m
  atmosphereCeiling: number;  // Teto atmosférico limite (m) - padrão 100.000m (Linha de Kármán)
  enableAtmosphere: boolean;  // Chave para ligar/desligar arrasto para comparações
  enableCoriolis: boolean;    // Chave para ativar efeito Coriolis
  planetaryRotationRate: number; // Velocidade angular de rotação (rad/s) - Terra ~ 7.292e-5 rad/s
  windLayers: WindLayer[];
}

export interface FictionalLocation {
  id: string;
  name: string;
  continent: string;
  lat: number;
  lon: number;
  elevation: number;
  description: string;
  color: string;
}

export type FlightPhase = 
  | 'pronto'       // No suporte de lançamento
  | 'propulsao'    // Fase de queima dos motores (Boost)
  | 'inercial'     // Voo balístico livre fora/acima da resistência pesada
  | 'apogeu'       // Ponto mais alto da trajetória
  | 'reentrada'    // Reentrando nas camadas densas da atmosfera
  | 'impactado'    // Atingiu o solo / alvo
  | 'destruido';   // Forças dinâmicas extremas

export interface TelemetryPoint {
  time: number;              // Tempo transcorrido (s)
  x: number;                 // Posição horizontal na superfície (m)
  y: number;                 // Altitude em relação ao nível médio do solo (m)
  r: number;                 // Distância ao centro do planeta (m)
  vx: number;                // Velocidade horizontal (m/s)
  vy: number;                // Velocidade vertical (m/s)
  speed: number;             // Velocidade escalar (m/s)
  mach: number;              // Número de Mach
  acceleration: number;      // Aceleração total (m/s²)
  gForce: number;            // Força g sentida
  mass: number;              // Massa atual do veículo (kg)
  currentStageIndex: number; // Estágio ativo
  thrustForce: number;       // Força de empuxo (N)
  dragForce: number;         // Força de arrasto aerodinâmico (N)
  gravityForce: number;      // Força de gravidade (N)
  dynamicPressure: number;   // Pressão dinâmica q (Pa)
  heatFluxRate: number;      // Taxa aproximada de aquecimento cinético (kW/m²)
  pitchAngleDeg: number;     // Ângulo de inclinação em relação ao horizonte local (graus)
  phase: FlightPhase;
  lateralDeviation: number;  // Desvio lateral por vento/Coriolis (m)
  midAirDestroyed?: boolean; // Míssil destruído em colisão no ar com interceptor
}

export interface SimulationSummary {
  maxAltitude: number;       // Apogeu (m)
  totalRange: number;        // Alcance total percorrido na superfície (m)
  totalFlightTime: number;   // Duração total (s)
  maxSpeed: number;          // Velocidade máxima alcançada (m/s)
  maxMach: number;           // Mach máximo
  maxGForce: number;         // G-force máxima
  maxDynamicPressure: number;// Max Q (Pa)
  impactSpeed: number;       // Velocidade no impacto (m/s)
  impactAngleDeg: number;    // Ângulo de impacto (graus)
  impactKineticEnergy: number; // Energia cinética no impacto (Joules)
  impactTntEquivalentKg: number; // Equivalência mecânica em kg de TNT (4.184e6 J/kg)
  targetDistanceError: number; // Distância do ponto de impacto ao alvo previsto (m)
  lateralDeviation: number;  // Desvio lateral final (m)
  apogeeTime: number;        // Instante do apogeu (s)
  separationTimes: number[]; // Momentos de separação de estágios
}

export interface PresetScenario {
  id: string;
  title: string;
  subtitle: string;
  category: 'basico' | 'intermediario' | 'avancado' | 'estocastico';
  description: string;
  educationalFocus: string;
  projectile: ProjectileConfig;
  environment: PlanetaryEnvironment;
  launchSite: FictionalLocation;
  targetSite: FictionalLocation;
  expectedOutcomes: {
    approxRangeKm: number;
    approxApogeeKm: number;
    physicsConcepts: string[];
  };
}

export interface MonteCarloResult {
  simulationsCount: number;
  impactPoints: Array<{
    x: number;
    y: number; // desvio lateral
    range: number;
    flightTime: number;
    impactSpeed: number;
  }>;
  meanRange: number;
  meanLateralDeviation: number;
  stdDevRange: number;
  stdDevLateral: number;
  cep50: number; // Raio dentro do qual 50% dos impactos ocorrem (m)
  cep95: number; // Raio dentro do qual 95% dos impactos ocorrem (m)
}

export type ViewMode = 'orbital' | 'profile' | 'radar' | 'view25d';

export type InterceptorStatus = 'standby' | 'launched' | 'tracking' | 'intercepted' | 'missed';

export interface InterceptorBattery {
  id: string;
  name: string;
  locationName: string;
  x: number;             // Posição no solo longitudinal (m)
  z: number;             // Posição lateral (m)
  radarRangeM: number;   // Raio de cobertura do radar de engajamento (m)
  maxSpeedMs: number;    // Velocidade máxima de interceptação (m/s)
  maxAltitudeM: number;  // Teto máximo de engajamento (m)
  autoEngage: boolean;   // Disparo automático ao detectar alvo em alcance
  missDistanceM: number; // Raio letal de destruição cinética Hit-to-Kill (m)
}

export interface InterceptorPoint {
  time: number;
  x: number;
  y: number; // altitude (m)
  z: number; // desvio lateral (m)
  vx: number;
  vy: number;
  vz: number;
  speed: number;
  distanceToTarget: number;
}

export interface InterceptorState {
  status: InterceptorStatus;
  battery: InterceptorBattery;
  launchTime: number | null;
  interceptTime: number | null;
  currentPoint: InterceptorPoint | null;
  history: InterceptorPoint[];
  targetInterceptPoint: { x: number; y: number; z: number } | null;
  missDistance: number | null;
  killConfirmed: boolean;
}

export type SatelliteWeaponType = 'rods_from_god';
export type SatelliteStatus = 'orbiting' | 'locking_target' | 'launching_rod' | 'mission_completed';

export interface OrbitalSatellite {
  id: string;
  name: string;
  code: string;
  type: SatelliteWeaponType;
  status: SatelliteStatus;
  altitudeM: number;         // Altitude orbital LEO (ex: 320.000m a 380.000m)
  x: number;                 // Posição longitudinal no solo / alcance (m)
  z: number;                 // Posição lateral / inclinação (m)
  orbitalSpeedMs: number;    // Velocidade orbital tangencial
  assignedRegion: 'enemy_territory';
  rodsLoaded: number;        // Quantidade de "Varas de Deus" (hastes de tungstênio) a bordo
  rodsLaunched: number;
  description: string;
}

export interface KineticRod {
  id: string;
  satelliteId: string;
  satelliteName: string;
  releaseTime: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  speed: number;
  mach: number;
  massKg: number;            // Massa da haste de tungstênio puro (ex: 9.000 kg)
  targetX: number;
  targetZ: number;
  targetName: string;
  status: 'falling' | 'reentering' | 'impacted';
  impactTime?: number;
  impactSpeed?: number;
  impactKineticEnergyJ?: number;
  impactTntEquivalentTons?: number;
  craterDiameterM?: number;
  blastRadiusKm?: number;    // Raio de destruição de área aproximada no mapa
  history: Array<{ x: number; y: number; z: number; time: number }>;
}

export interface SatelliteDefenseSystemState {
  satellites: OrbitalSatellite[];
  rods: KineticRod[];
  retaliationTriggered: boolean;
  retaliationTriggerTime: number | null;
  totalRodsImpacted: number;
  totalKineticDamageJoules: number;
  destroyedAreaSummary?: {
    totalStructuresDestroyed: number;
    impactLocations: Array<{ name: string; xKm: number; zKm: number; craterM: number; blastKm: number }>;
  };
}

