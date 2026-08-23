/**
 * Módulo de Relevo, Topografia, Montanhas, Casas e Prédios
 * Gera feições realistas distribuídas ao longo de todo o mapa de forma proporcional e desimpedida:
 * - Cadeias de montanhas com cumes nevados e encostas sombreadas
 * - Cidades com arranha-céus, edifícios governamentais e comerciais
 * - Vilarejos e bairros residenciais com casas, telhados inclinados e ruas
 * - Instalações industriais e radares
 * - Sistema de destruição e deformação de relevo por impacto de Varas de Deus
 */

export interface MountainFeature {
  id: string;
  name: string;
  xKm: number;
  zKm: number;
  baseRadiusKm: number;
  peakElevationM: number;
  color: string;
  ridgePoints: Array<{ dxKm: number; dzKm: number; heightRatio: number }>;
}

export interface BuildingFeature {
  id: string;
  type: 'skyscraper' | 'building' | 'house' | 'industrial' | 'radar_dome' | 'bunker';
  xKm: number;
  zKm: number;
  widthM: number;
  depthM: number;
  heightM: number;
  color: string;
  roofColor: string;
  floors: number;
  destroyed?: boolean;
  destroyedTime?: number;
}

export interface SettlementZone {
  id: string;
  name: string;
  territory: 'alpha' | 'neutral' | 'republica_territorial';
  centerXKm: number;
  centerZKm: number;
  radiusKm: number;
  type: 'capital' | 'metropolis' | 'town' | 'village' | 'military_base' | 'port';
  buildings: BuildingFeature[];
}

export interface TerrainMapData {
  mountains: MountainFeature[];
  settlements: SettlementZone[];
  scatteredHouses: BuildingFeature[];
}

// Gerador determinístico pseudo-aleatório baseado em seed (Linear Congruential Generator)
function createSeededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Gera relevo montanhoso realista ao longo de todo o mapa proporcionalmente ao alcance
 */
export function generateMountains(maxRangeKm: number = 6000): MountainFeature[] {
  const mountains: MountainFeature[] = [];
  const rand = createSeededRandom(4291);
  const targetKm = Math.max(400, maxRangeKm);

  // 1. Cordilheira Ocidental de Alpha (Origem)
  const alphaPeaks = [
    { x: targetKm * 0.08, z: -160, alt: 3400, r: Math.max(20, targetKm * 0.02), name: 'Pico Alpha Setentrional' },
    { x: targetKm * 0.16, z: 200, alt: 4200, r: Math.max(25, targetKm * 0.025), name: 'Maciço Central Alpha' },
    { x: targetKm * 0.25, z: -240, alt: 3800, r: Math.max(22, targetKm * 0.022), name: 'Serra dos Silos' },
    { x: targetKm * 0.35, z: 180, alt: 2900, r: Math.max(20, targetKm * 0.02), name: 'Montanhas da Fronteira' },
  ];

  alphaPeaks.forEach((p, idx) => {
    const ridges: Array<{ dxKm: number; dzKm: number; heightRatio: number }> = [];
    const numRidges = 5 + Math.floor(rand() * 3);
    for (let i = 0; i < numRidges; i++) {
      const angle = (i / numRidges) * Math.PI * 2 + (rand() - 0.5) * 0.4;
      const dist = (p.r * 0.4) + rand() * (p.r * 0.5);
      ridges.push({
        dxKm: Math.cos(angle) * dist,
        dzKm: Math.sin(angle) * dist,
        heightRatio: 0.2 + rand() * 0.5,
      });
    }

    mountains.push({
      id: `mtn-alpha-${idx}`,
      name: p.name,
      xKm: p.x,
      zKm: p.z,
      baseRadiusKm: p.r,
      peakElevationM: p.alt,
      color: '#334155',
      ridgePoints: ridges,
    });
  });

  // 2. Montes e Ilhas no Setor Neutro / Intermediário
  const neutralPeaks = [
    { x: targetKm * 0.50, z: -200, alt: 2400, r: Math.max(20, targetKm * 0.02), name: 'Monte Neutro I' },
    { x: targetKm * 0.62, z: 160, alt: 2650, r: Math.max(22, targetKm * 0.022), name: 'Atol Rochoso Central' },
  ];

  neutralPeaks.forEach((p, idx) => {
    mountains.push({
      id: `mtn-neutral-${idx}`,
      name: p.name,
      xKm: p.x,
      zKm: p.z,
      baseRadiusKm: p.r,
      peakElevationM: p.alt,
      color: '#1e293b',
      ridgePoints: [
        { dxKm: -p.r * 0.4, dzKm: -p.r * 0.3, heightRatio: 0.4 },
        { dxKm: p.r * 0.5, dzKm: -p.r * 0.2, heightRatio: 0.35 },
        { dxKm: p.r * 0.3, dzKm: p.r * 0.4, heightRatio: 0.3 },
        { dxKm: -p.r * 0.4, dzKm: p.r * 0.3, heightRatio: 0.45 },
      ],
    });
  });

  // 3. Grande Cordilheira de Defesa da República Territorial
  const repPeaks = [
    { x: targetKm * 0.78, z: -200, alt: 4800, r: Math.max(25, targetKm * 0.025), name: 'Pico Soberano da República' },
    { x: targetKm * 0.88, z: 220, alt: 5200, r: Math.max(28, targetKm * 0.028), name: 'Grande Maciço Territorial' },
    { x: targetKm * 0.98, z: -150, alt: 4300, r: Math.max(24, targetKm * 0.024), name: 'Baluarte da República' },
  ];

  repPeaks.forEach((p, idx) => {
    const ridges: Array<{ dxKm: number; dzKm: number; heightRatio: number }> = [];
    const numRidges = 6 + Math.floor(rand() * 3);
    for (let i = 0; i < numRidges; i++) {
      const angle = (i / numRidges) * Math.PI * 2 + (rand() - 0.5) * 0.3;
      const dist = (p.r * 0.45) + rand() * (p.r * 0.5);
      ridges.push({
        dxKm: Math.cos(angle) * dist,
        dzKm: Math.sin(angle) * dist,
        heightRatio: 0.25 + rand() * 0.55,
      });
    }

    mountains.push({
      id: `mtn-rep-${idx}`,
      name: p.name,
      xKm: p.x,
      zKm: p.z,
      baseRadiusKm: p.r,
      peakElevationM: p.alt,
      color: '#0f172a',
      ridgePoints: ridges,
    });
  });

  return mountains;
}

/**
 * Gera centros urbanos, metrópoles e complexos militares distribuídos proporcionalmente
 */
export function generateSettlements(maxRangeKm: number = 6000): SettlementZone[] {
  const settlements: SettlementZone[] = [];
  const rand = createSeededRandom(7789);
  const targetKm = Math.max(400, maxRangeKm);

  // 1. CIDADE METRÓPOLE DE ALPHA (Ponto de Lançamento)
  const alphaCity: SettlementZone = {
    id: 'settlement-alpha-metro',
    name: 'Metrópole Alpha (Centro de Comando)',
    territory: 'alpha',
    centerXKm: targetKm * 0.03,
    centerZKm: -20,
    radiusKm: Math.max(15, targetKm * 0.015),
    type: 'metropolis',
    buildings: [],
  };

  for (let i = 0; i < 28; i++) {
    const angle = rand() * Math.PI * 2;
    const dist = Math.pow(rand(), 0.6) * (alphaCity.radiusKm * 0.8);
    const xKm = alphaCity.centerXKm + Math.cos(angle) * dist;
    const zKm = alphaCity.centerZKm + Math.sin(angle) * dist;
    const isCore = dist < alphaCity.radiusKm * 0.4;

    const type = isCore
      ? rand() > 0.3 ? 'skyscraper' : 'building'
      : rand() > 0.5 ? 'building' : 'house';

    const height = type === 'skyscraper'
      ? 120 + rand() * 200
      : type === 'building'
      ? 35 + rand() * 70
      : 8 + rand() * 12;

    const floors = Math.max(1, Math.round(height / 3.8));

    alphaCity.buildings.push({
      id: `bld-alpha-${i}`,
      type,
      xKm,
      zKm,
      widthM: type === 'skyscraper' ? 500 + rand() * 400 : type === 'building' ? 300 + rand() * 250 : 150 + rand() * 100,
      depthM: type === 'skyscraper' ? 500 + rand() * 400 : type === 'building' ? 300 + rand() * 250 : 150 + rand() * 100,
      heightM: height * 10,
      color: type === 'skyscraper' ? '#38bdf8' : type === 'building' ? '#64748b' : '#94a3b8',
      roofColor: type === 'house' ? '#b91c1c' : '#1e293b',
      floors,
    });
  }
  settlements.push(alphaCity);

  // Cidade Secundária Alpha (Setor Industrial / Silos)
  const alphaSiloCity: SettlementZone = {
    id: 'settlement-alpha-industrial',
    name: 'Distrito de Silos Alpha',
    territory: 'alpha',
    centerXKm: targetKm * 0.12,
    centerZKm: 50,
    radiusKm: Math.max(12, targetKm * 0.012),
    type: 'town',
    buildings: [],
  };

  for (let i = 0; i < 20; i++) {
    const angle = rand() * Math.PI * 2;
    const dist = Math.pow(rand(), 0.7) * (alphaSiloCity.radiusKm * 0.8);
    const xKm = alphaSiloCity.centerXKm + Math.cos(angle) * dist;
    const zKm = alphaSiloCity.centerZKm + Math.sin(angle) * dist;
    const type = rand() > 0.4 ? 'industrial' : rand() > 0.5 ? 'building' : 'house';
    const height = type === 'industrial' ? 30 + rand() * 40 : type === 'building' ? 40 + rand() * 50 : 10 + rand() * 10;

    alphaSiloCity.buildings.push({
      id: `bld-alpha-ind-${i}`,
      type,
      xKm,
      zKm,
      widthM: 250 + rand() * 250,
      depthM: 250 + rand() * 250,
      heightM: height * 10,
      color: '#475569',
      roofColor: '#dc2626',
      floors: Math.max(1, Math.round(height / 4)),
    });
  }
  settlements.push(alphaSiloCity);

  // 2. VILAS NO ARQUIPÉLAGO NEUTRO
  const neutralTown: SettlementZone = {
    id: 'settlement-neutral-port',
    name: 'Porto Neutro',
    territory: 'neutral',
    centerXKm: targetKm * 0.55,
    centerZKm: 0,
    radiusKm: Math.max(10, targetKm * 0.01),
    type: 'port',
    buildings: [],
  };

  for (let i = 0; i < 16; i++) {
    const angle = rand() * Math.PI * 2;
    const dist = Math.pow(rand(), 0.6) * (neutralTown.radiusKm * 0.8);
    const xKm = neutralTown.centerXKm + Math.cos(angle) * dist;
    const zKm = neutralTown.centerZKm + Math.sin(angle) * dist;
    const type = rand() > 0.6 ? 'building' : 'house';
    const height = type === 'building' ? 30 + rand() * 40 : 8 + rand() * 8;

    neutralTown.buildings.push({
      id: `bld-neutral-${i}`,
      type,
      xKm,
      zKm,
      widthM: 180 + rand() * 180,
      depthM: 180 + rand() * 180,
      heightM: height * 10,
      color: '#0284c7',
      roofColor: '#0369a1',
      floors: Math.max(1, Math.round(height / 4)),
    });
  }
  settlements.push(neutralTown);

  // 3. CENTROS URBANOS DA REPÚBLICA TERRITORIAL (DEFESA & POPULAÇÃO)
  const repCapital: SettlementZone = {
    id: 'settlement-rep-capital',
    name: 'Capital República Territorial',
    territory: 'republica_territorial',
    centerXKm: targetKm * 0.94,
    centerZKm: -20,
    radiusKm: Math.max(20, targetKm * 0.02),
    type: 'capital',
    buildings: [],
  };

  for (let i = 0; i < 35; i++) {
    const angle = rand() * Math.PI * 2;
    const dist = Math.pow(rand(), 0.6) * (repCapital.radiusKm * 0.85);
    const xKm = repCapital.centerXKm + Math.cos(angle) * dist;
    const zKm = repCapital.centerZKm + Math.sin(angle) * dist;
    const isCore = dist < repCapital.radiusKm * 0.45;

    const type = isCore
      ? rand() > 0.25 ? 'skyscraper' : 'building'
      : rand() > 0.5 ? 'building' : 'house';

    const height = type === 'skyscraper'
      ? 140 + rand() * 240
      : type === 'building'
      ? 45 + rand() * 80
      : 10 + rand() * 14;

    const floors = Math.max(1, Math.round(height / 3.8));

    repCapital.buildings.push({
      id: `bld-rep-cap-${i}`,
      type,
      xKm,
      zKm,
      widthM: type === 'skyscraper' ? 550 + rand() * 400 : type === 'building' ? 320 + rand() * 280 : 180 + rand() * 120,
      depthM: type === 'skyscraper' ? 550 + rand() * 400 : type === 'building' ? 320 + rand() * 280 : 180 + rand() * 120,
      heightM: height * 10,
      color: type === 'skyscraper' ? '#10b981' : type === 'building' ? '#059669' : '#f59e0b',
      roofColor: type === 'house' ? '#b45309' : '#064e3b',
      floors,
    });
  }
  settlements.push(repCapital);

  // Complexo Militar e Bateria Defensiva da República Territorial
  const repDefenseCity: SettlementZone = {
    id: 'settlement-rep-defense',
    name: 'Base de Defesa República Territorial',
    territory: 'republica_territorial',
    centerXKm: targetKm * 0.82,
    centerZKm: 15,
    radiusKm: Math.max(15, targetKm * 0.015),
    type: 'military_base',
    buildings: [],
  };

  for (let i = 0; i < 22; i++) {
    const angle = rand() * Math.PI * 2;
    const dist = Math.pow(rand(), 0.6) * (repDefenseCity.radiusKm * 0.8);
    const xKm = repDefenseCity.centerXKm + Math.cos(angle) * dist;
    const zKm = repDefenseCity.centerZKm + Math.sin(angle) * dist;
    const type = rand() > 0.6 ? 'radar_dome' : rand() > 0.4 ? 'bunker' : 'building';
    const height = type === 'radar_dome' ? 25 + rand() * 20 : type === 'bunker' ? 15 + rand() * 15 : 30 + rand() * 40;

    repDefenseCity.buildings.push({
      id: `bld-rep-def-${i}`,
      type,
      xKm,
      zKm,
      widthM: 300 + rand() * 200,
      depthM: 300 + rand() * 200,
      heightM: height * 10,
      color: '#10b981',
      roofColor: '#047857',
      floors: Math.max(1, Math.round(height / 4)),
    });
  }
  settlements.push(repDefenseCity);

  return settlements;
}

/**
 * Gera casas e pequenos vilarejos residenciais espalhados aleatoriamente pelo mapa
 */
export function generateScatteredHouses(): BuildingFeature[] {
  const rand = createSeededRandom(99317);
  const houses: BuildingFeature[] = [];

  for (let i = 0; i < 60; i++) {
    let xKm = rand() * 7000;
    let zKm = (rand() - 0.5) * 500;

    const houseType = rand() > 0.85 ? 'building' : 'house';
    const height = houseType === 'building' ? 25 + rand() * 25 : 8 + rand() * 8;
    const roofPalette = ['#b91c1c', '#c2410c', '#b45309', '#15803d', '#1e40af', '#475569'];
    const roofColor = roofPalette[Math.floor(rand() * roofPalette.length)];

    houses.push({
      id: `scattered-house-${i}`,
      type: houseType,
      xKm,
      zKm,
      widthM: houseType === 'building' ? 220 + rand() * 120 : 110 + rand() * 80,
      depthM: houseType === 'building' ? 220 + rand() * 120 : 110 + rand() * 80,
      heightM: height * 10,
      color: houseType === 'building' ? '#64748b' : '#cbd5e1',
      roofColor,
      floors: houseType === 'building' ? 4 : 1,
    });
  }

  return houses;
}

/**
 * Cria o mapa completo de feições geográficas, montanhas, prédios e casas
 */
export function createDefaultTerrainMap(maxRangeKm: number = 6000): TerrainMapData {
  return {
    mountains: generateMountains(maxRangeKm),
    settlements: generateSettlements(maxRangeKm),
    scatteredHouses: generateScatteredHouses(),
  };
}

/**
 * Aplica destruição de área quando uma Vara de Deus impacta o solo
 */
export function applyAreaDestruction(
  terrain: TerrainMapData,
  impactXKm: number,
  impactZKm: number,
  blastRadiusKm: number,
  impactTime: number
): TerrainMapData {
  const updatedSettlements = terrain.settlements.map((s) => ({
    ...s,
    buildings: s.buildings.map((b) => {
      const dist = Math.hypot(b.xKm - impactXKm, b.zKm - impactZKm);
      if (dist <= blastRadiusKm) {
        return {
          ...b,
          destroyed: true,
          destroyedTime: impactTime,
        };
      }
      return b;
    }),
  }));

  const updatedHouses = terrain.scatteredHouses.map((h) => {
    const dist = Math.hypot(h.xKm - impactXKm, h.zKm - impactZKm);
    if (dist <= blastRadiusKm) {
      return {
        ...h,
        destroyed: true,
        destroyedTime: impactTime,
      };
    }
    return h;
  });

  return {
    ...terrain,
    settlements: updatedSettlements,
    scatteredHouses: updatedHouses,
  };
}
