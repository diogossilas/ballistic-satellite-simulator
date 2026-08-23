/**
 * Geografia Fictícia e Locais Acadêmicos
 * Todas as entidades, continentes e zonas de testes são 100% fictícios para fins didáticos.
 */

import { FictionalLocation } from '../types/physics';

export const FICTIONAL_LOCATIONS: Record<string, FictionalLocation> = {
  LAUNCH_COMPLEX_ALPHA: {
    id: 'launch-complex-alpha',
    name: 'Centro de Lançamento Alpha-1',
    continent: 'Continente Alpha',
    lat: 5.2,
    lon: -52.8,
    elevation: 15,
    description: 'Plataforma equatorial em zona costeira de planície.',
    color: '#06b6d4', // Cyan
  },
  TEST_ZONE_01: {
    id: 'test-zone-01',
    name: 'Zona de Testes 01 (Polígono Desértico)',
    continent: 'Continente Alpha',
    lat: 18.5,
    lon: -40.2,
    elevation: 450,
    description: 'Área desabitada e plana destinada a coleta de telemetria balística.',
    color: '#3b82f6', // Blue
  },
  DEFENSE_BASE_DELTA: {
    id: 'defense-base-delta',
    name: 'Bateria de Defesa Aeroespacial da República Territorial',
    continent: 'República Territorial',
    lat: 28.0,
    lon: 10.5,
    elevation: 120,
    description: 'Complexo antimíssil da República Territorial com radar de varredura ativa e mísseis interceptores.',
    color: '#10b981', // Emerald
  },
  TARGET_GRID_OMEGA: {
    id: 'target-grid-omega',
    name: 'Polígono Terminal da República Territorial',
    continent: 'República Territorial',
    lat: 32.1,
    lon: 25.4,
    elevation: 80,
    description: 'Zona de monitoramento e impacto em território da República Territorial.',
    color: '#f59e0b', // Amber
  },
  NEUTRAL_ARCHIPELAGO_BUOY: {
    id: 'neutral-archipelago-buoy',
    name: 'Boia Telemetria Oceânica',
    continent: 'Arquipélago Neutro',
    lat: 12.0,
    lon: -15.0,
    elevation: 0,
    description: 'Ponto intermediário oceânico para verificação de reentrada.',
    color: '#10b981', // Emerald
  },
};

export interface TerritorialBorder {
  id: string;
  name: string;
  type: 'international' | 'dmz' | 'maritime' | 'radar_boundary';
  color: string;
  dash: number[];
  lineWidth: number;
  points: Array<{ xKm: number; zKm: number }>; // Coordenadas no plano 2D (X ao longo do alcance, Z transversal)
}

export interface TerritorialRegion {
  id: string;
  name: string;
  faction: string;
  color: string;
  strokeColor: string;
  polygon: Array<{ xKm: number; zKm: number }>;
}

export const FICTIONAL_REGIONS: TerritorialRegion[] = [
  {
    id: 'fed-alpha',
    name: 'Federação Continental Alpha',
    faction: 'Bloco Alpha (Origem)',
    color: 'rgba(6, 182, 212, 0.08)',
    strokeColor: 'rgba(6, 182, 212, 0.35)',
    polygon: [
      { xKm: -400, zKm: -750 },
      { xKm: 1850, zKm: -800 },
      { xKm: 2000, zKm: -250 },
      { xKm: 2050, zKm: 150 },
      { xKm: 1900, zKm: 750 },
      { xKm: -400, zKm: 700 },
    ],
  },
  {
    id: 'sea-neutral',
    name: 'Mar Central & Arquipélago Neutro',
    faction: 'Águas Internacionais Desmilitarizadas',
    color: 'rgba(59, 130, 246, 0.04)',
    strokeColor: 'rgba(59, 130, 246, 0.2)',
    polygon: [
      { xKm: 2050, zKm: -800 },
      { xKm: 4800, zKm: -800 },
      { xKm: 4800, zKm: 800 },
      { xKm: 2050, zKm: 800 },
    ],
  },
  {
    id: 'rep-omega',
    name: 'República Territorial',
    faction: 'República Territorial (Defesa Soberana)',
    color: 'rgba(245, 158, 11, 0.08)',
    strokeColor: 'rgba(245, 158, 11, 0.35)',
    polygon: [
      { xKm: 4800, zKm: -800 },
      { xKm: 9500, zKm: -800 },
      { xKm: 9500, zKm: 800 },
      { xKm: 5050, zKm: 750 },
      { xKm: 4800, zKm: 200 },
      { xKm: 4900, zKm: -300 },
    ],
  },
];

export const FICTIONAL_BORDERS: TerritorialBorder[] = [
  // Linha de Fronteira Costeira Oriental Alpha
  {
    id: 'border-alpha-east',
    name: 'Linha Costeira & Limite Territorial Alpha',
    type: 'international',
    color: '#06b6d4',
    dash: [6, 4],
    lineWidth: 1.5,
    points: [
      { xKm: 1850, zKm: -800 },
      { xKm: 1950, zKm: -450 },
      { xKm: 2000, zKm: -150 },
      { xKm: 2050, zKm: 150 },
      { xKm: 1980, zKm: 450 },
      { xKm: 1900, zKm: 750 },
    ],
  },
  // Fronteira de Defesa / Zona de Exclusão Marítima (Linha Mediana)
  {
    id: 'border-dmz-median',
    name: 'Zona Desmilitarizada Marítima (DMZ Central)',
    type: 'dmz',
    color: '#a855f7',
    dash: [8, 6, 2, 6],
    lineWidth: 2,
    points: [
      { xKm: 3400, zKm: -800 },
      { xKm: 3400, zKm: -350 },
      { xKm: 3450, zKm: 0 },
      { xKm: 3400, zKm: 350 },
      { xKm: 3400, zKm: 800 },
    ],
  },
  // Linha de Radar de Alerta Precoce Ômega
  {
    id: 'border-omega-early-warning',
    name: 'Linha de Cobertura de Alerta Precoce (Radar Ômega)',
    type: 'radar_boundary',
    color: '#10b981',
    dash: [4, 4],
    lineWidth: 1.5,
    points: [
      { xKm: 4400, zKm: -800 },
      { xKm: 4550, zKm: -350 },
      { xKm: 4600, zKm: 0 },
      { xKm: 4550, zKm: 350 },
      { xKm: 4400, zKm: 800 },
    ],
  },
  // Fronteira Costeira Ocidental Ômega
  {
    id: 'border-omega-west',
    name: 'Fronteira Soberana Ômega (Zona de Defesa Ativa)',
    type: 'international',
    color: '#f59e0b',
    dash: [6, 4],
    lineWidth: 2,
    points: [
      { xKm: 4800, zKm: -800 },
      { xKm: 4920, zKm: -400 },
      { xKm: 4850, zKm: -100 },
      { xKm: 4900, zKm: 250 },
      { xKm: 5050, zKm: 750 },
    ],
  },
  // Divisa Interna de Polígonos de Testes no Continente Alpha
  {
    id: 'border-alpha-internal-corridor',
    name: 'Corredor de Lançamento Balístico Alpha',
    type: 'radar_boundary',
    color: '#38bdf8',
    dash: [2, 4],
    lineWidth: 1,
    points: [
      { xKm: 0, zKm: -150 },
      { xKm: 500, zKm: -120 },
      { xKm: 1000, zKm: -150 },
      { xKm: 1600, zKm: -180 },
    ],
  },
];

export const FICTIONAL_CONTINENTS = [
  {
    name: 'Continente Alpha',
    startKm: 0,
    endKm: 1800,
    color: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
    label: 'CONTINENTE ALPHA (ORIGEM)',
  },
  {
    name: 'Oceano Central & Arquipélago Neutro',
    startKm: 1800,
    endKm: 4200,
    color: 'rgba(6, 182, 212, 0.08)',
    borderColor: 'rgba(6, 182, 212, 0.25)',
    label: 'ARQUIPÉLAGO NEUTRO (OCEÂNICO)',
  },
  {
    name: 'República Territorial',
    startKm: 4200,
    endKm: 7000,
    color: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    label: 'REPÚBLICA TERRITORIAL (DEFESA ATIVA)',
  },
];
