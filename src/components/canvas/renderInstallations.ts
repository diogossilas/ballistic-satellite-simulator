/**
 * Módulo de Renderização de Instalações e Plataformas de Lançamento
 * Desenha a Plataforma de Lançamento Alpha com Torre Umbilical e Foguete na Rampa,
 * o Complexo de Defesa ABM com Silos/Lançadores e a Zona Alvo.
 */

import { TelemetryPoint, InterceptorState, ProjectileConfig } from '../../types/physics';

export interface ProjectFunctions {
  project3Dto25D: (xM: number, yM: number, zM: number) => { x: number; y: number };
  projectGroundTo25D: (xM: number, zM: number) => { x: number; y: number };
}

/**
 * Desenha a Plataforma de Lançamento Alpha no ponto (0, 0)
 * Inclui: Base de Concreto, Torre Gantry de Treliça Metálica, Braços Umbilicais,
 * Foguete na Rampa em Prontidão, Efeitos de Ignição e Nuvem de Vapor/Fogo na Decolagem.
 */
export function drawLaunchPadAlpha(
  ctx: CanvasRenderingContext2D,
  projections: ProjectFunctions,
  currentTelemetry: TelemetryPoint | null,
  projectile: ProjectileConfig,
  groundScaleX: number,
  tilt: number
) {
  const { project3Dto25D, projectGroundTo25D } = projections;
  const pBase = projectGroundTo25D(0, 0);

  // 1. BASE DE CONCRETO REFORÇADO DA PLATAFORMA (Hexagonal / Retangular com profundidade)
  const padRadiusM = 15000;
  const numCorners = 6;
  const padCorners: Array<{ x: number; y: number }> = [];

  for (let i = 0; i < numCorners; i++) {
    const ang = (i / numCorners) * Math.PI * 2;
    const cxM = Math.cos(ang) * padRadiusM;
    const czM = Math.sin(ang) * padRadiusM;
    padCorners.push(projectGroundTo25D(cxM, czM));
  }

  // Desenha a laje de concreto
  ctx.beginPath();
  padCorners.forEach((pt, idx) => {
    if (idx === 0) ctx.moveTo(pt.x, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  });
  ctx.closePath();
  ctx.fillStyle = '#1e293b';
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Faixa amarela/preta de advertência de segurança na borda
  ctx.beginPath();
  ctx.ellipse(pBase.x, pBase.y, 22, 11, 0, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(234, 179, 8, 0.4)';
  ctx.setLineDash([4, 3]);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.setLineDash([]);

  // 2. DEFLETOR DE CHAMAS (FLAME TRENCH)
  const pFlameTrench = projectGroundTo25D(-5000, 0);
  ctx.beginPath();
  ctx.ellipse(pFlameTrench.x, pFlameTrench.y, 12, 6, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#090d16';
  ctx.fill();
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.stroke();

  // 3. TORRE DE LANÇAMENTO E SERVIÇO UMBILICAL (GANTRY TOWER)
  // Localizada ao lado da rampa em (x = -4000m, z = 6000m) com altura de ~80 metros simulados
  const towerHeightM = 25000; // Altura visual calibrada
  const pTowerBase = projectGroundTo25D(-4000, 7000);
  const pTowerTop = project3Dto25D(-4000, towerHeightM, 7000);

  // Estrutura vertical de treliça (vermelha e branca)
  const towerWidth = 8;
  const towerHeightPx = pTowerBase.y - pTowerTop.y;

  // Pernas da torre
  ctx.beginPath();
  ctx.moveTo(pTowerBase.x - towerWidth / 2, pTowerBase.y);
  ctx.lineTo(pTowerTop.x - towerWidth / 2, pTowerTop.y);
  ctx.lineTo(pTowerTop.x + towerWidth / 2, pTowerTop.y);
  ctx.lineTo(pTowerBase.x + towerWidth / 2, pTowerBase.y);
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Treliças diagonais em X da torre
  const segments = 5;
  for (let s = 0; s < segments; s++) {
    const y1 = pTowerBase.y - (towerHeightPx / segments) * s;
    const y2 = pTowerBase.y - (towerHeightPx / segments) * (s + 1);

    ctx.beginPath();
    ctx.moveTo(pTowerBase.x - towerWidth / 2, y1);
    ctx.lineTo(pTowerBase.x + towerWidth / 2, y2);
    ctx.moveTo(pTowerBase.x + towerWidth / 2, y1);
    ctx.lineTo(pTowerBase.x - towerWidth / 2, y2);
    ctx.strokeStyle = s % 2 === 0 ? 'rgba(255, 255, 255, 0.7)' : 'rgba(239, 68, 68, 0.8)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  // Guindaste / Cabeça da torre
  ctx.beginPath();
  ctx.moveTo(pTowerTop.x - towerWidth / 2, pTowerTop.y);
  ctx.lineTo(pTowerTop.x + towerWidth + 6, pTowerTop.y - 4);
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Braços umbilicais retráteis conectando a torre à rampa central
  const isLiftingOff = currentTelemetry && currentTelemetry.y > 500 && currentTelemetry.thrustForce > 0;
  const armRetraction = isLiftingOff ? 0.3 : 1.0;

  [0.35, 0.65, 0.85].forEach((hRatio) => {
    const armY = pTowerBase.y - towerHeightPx * hRatio;
    ctx.beginPath();
    ctx.moveTo(pTowerBase.x, armY);
    ctx.lineTo(pTowerBase.x + 12 * armRetraction, armY + 2);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  // Luz estroboscópica de topo da torre de lançamento
  ctx.beginPath();
  ctx.arc(pTowerTop.x + towerWidth + 6, pTowerTop.y - 4, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = '#ef4444';
  ctx.fill();

  // 4. MÍSSIL MONTADO NA PLATAFORMA (QUANDO NA RAMPA t=0 OU EM INÍCIO DE SUBIDA)
  const isMissileAtPad = !currentTelemetry || currentTelemetry.y < 300 || currentTelemetry.time < 0.2;

  if (isMissileAtPad && (!currentTelemetry || currentTelemetry.phase !== 'destruido')) {
    const rocketHeightM = 22000;
    const pRocketTop = project3Dto25D(0, rocketHeightM, 0);
    const pRocketBase = projectGroundTo25D(0, 0);

    // Corpo do Foguete (Estágios e Ogiva na Vertical)
    const rWidth = 7;
    const rHeight = pRocketBase.y - pRocketTop.y;

    // Estágio 1 (Inferior)
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(pRocketBase.x - rWidth / 2, pRocketBase.y - rHeight * 0.45, rWidth, rHeight * 0.45);

    // Estágio 2 (Médio)
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(pRocketBase.x - rWidth / 2 + 0.5, pRocketBase.y - rHeight * 0.75, rWidth - 1, rHeight * 0.3);

    // Ogiva e Cone de Nariz
    ctx.beginPath();
    ctx.moveTo(pRocketBase.x - rWidth / 2 + 1, pRocketBase.y - rHeight * 0.75);
    ctx.lineTo(pRocketTop.x, pRocketTop.y);
    ctx.lineTo(pRocketBase.x + rWidth / 2 - 1, pRocketBase.y - rHeight * 0.75);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Aletas da base
    ctx.beginPath();
    ctx.moveTo(pRocketBase.x - rWidth / 2, pRocketBase.y - 4);
    ctx.lineTo(pRocketBase.x - rWidth / 2 - 4, pRocketBase.y);
    ctx.lineTo(pRocketBase.x - rWidth / 2, pRocketBase.y);
    ctx.moveTo(pRocketBase.x + rWidth / 2, pRocketBase.y - 4);
    ctx.lineTo(pRocketBase.x + rWidth / 2 + 4, pRocketBase.y);
    ctx.lineTo(pRocketBase.x + rWidth / 2, pRocketBase.y);
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Plumas de ventilação de oxigênio líquido (Vapor Criogênico branco ao lado do foguete)
    ctx.beginPath();
    ctx.arc(pRocketBase.x + rWidth / 2 + 4, pRocketBase.y - rHeight * 0.6, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fill();
  }

  // 5. EFEITO VISUAL DE IGNIÇÃO E DECOLAGEM NA PLATAFORMA (QUANDO O MÍSSIL SOBE)
  if (currentTelemetry && currentTelemetry.y < 20000 && currentTelemetry.thrustForce > 0) {
    // Nuvem volumétrica de fumaça de lançamento na base
    const smokeRadius = Math.min(45, 15 + (currentTelemetry.y / 800));
    ctx.beginPath();
    ctx.ellipse(pBase.x, pBase.y, smokeRadius * 1.5, smokeRadius * tilt, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(226, 232, 240, 0.55)';
    ctx.fill();

    // Flash de Fogo da Ignição na Rampa
    ctx.beginPath();
    ctx.ellipse(pBase.x, pBase.y, smokeRadius * 0.8, smokeRadius * 0.5 * tilt, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(249, 115, 22, 0.7)';
    ctx.fill();
  }

  // 6. RÓTULO DA PLATAFORMA ALPHA COM GAP E BADGE PROTETORA
  const labelText = '🚀 PLATAFORMA ALPHA (0 km)';
  ctx.font = 'bold 10px monospace';
  const textW = ctx.measureText(labelText).width;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(pBase.x - textW / 2 - 8, pBase.y + 20, textW + 16, 18, 4);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.textAlign = 'center';
  ctx.fillText(labelText, pBase.x, pBase.y + 32);
}

/**
 * Desenha o Complexo da Bateria de Defesa ABM (República Territorial)
 * Inclui: Plataforma Militar, Lançadores TEL / Silos Quádruplos, Radar Phased Array,
 * Interceptor em Prontidão na Rampa e Efeitos de Disparo.
 */
export function drawDefenseBattery(
  ctx: CanvasRenderingContext2D,
  projections: ProjectFunctions,
  interceptorState: InterceptorState,
  groundScaleX: number,
  tilt: number
) {
  const { project3Dto25D, projectGroundTo25D } = projections;
  const batX = interceptorState.battery.x;
  const batZ = interceptorState.battery.z;
  const pBat = projectGroundTo25D(batX, batZ);

  // 1. ANEL DE COBERTURA DO RADAR TERRITORIAL
  const radarRadiusM = interceptorState.battery.radarRangeM;
  ctx.beginPath();
  for (let th = 0; th <= Math.PI * 2; th += Math.PI / 16) {
    const rx = batX + radarRadiusM * Math.cos(th);
    const rz = batZ + radarRadiusM * Math.sin(th);
    const pRing = projectGroundTo25D(rx, rz);
    if (th === 0) ctx.moveTo(pRing.x, pRing.y);
    else ctx.lineTo(pRing.x, pRing.y);
  }
  ctx.closePath();
  ctx.strokeStyle = interceptorState.battery.autoEngage ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.35)';
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = interceptorState.battery.autoEngage ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.04)';
  ctx.fill();

  // 2. PLATAFORMA DE CONCRETO MILITAR FORTIFICADA
  ctx.beginPath();
  ctx.ellipse(pBat.x, pBat.y, 22, 11, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#064e3b';
  ctx.fill();
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 3. LANÇADOR DE MÍSSEIS ABM (TEL / SILO ELEVADO)
  const pLauncherTop = project3Dto25D(batX - 4000, 16000, batZ);
  
  // Tubos quádruplos de lançamento inclinados a 65 graus em direção à ameaça
  ctx.beginPath();
  ctx.moveTo(pBat.x - 6, pBat.y);
  ctx.lineTo(pLauncherTop.x - 8, pLauncherTop.y);
  ctx.lineTo(pLauncherTop.x + 8, pLauncherTop.y);
  ctx.lineTo(pBat.x + 6, pBat.y);
  ctx.closePath();
  ctx.fillStyle = '#022c22';
  ctx.fill();
  ctx.strokeStyle = '#34d399';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // 4. MÍSSIL INTERCEPTOR EM PRONTIDÃO NO LANÇADOR (SE EM STANDBY)
  if (interceptorState.status === 'standby') {
    ctx.beginPath();
    ctx.moveTo(pBat.x, pBat.y - 2);
    ctx.lineTo(pLauncherTop.x, pLauncherTop.y - 4);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Ogiva do interceptor
    ctx.beginPath();
    ctx.arc(pLauncherTop.x, pLauncherTop.y - 5, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#10b981';
    ctx.fill();
  }

  // 5. CÚPULA GEODÉSICA DE RADAR PHASED ARRAY DA BASE
  const pRadarDome = project3Dto25D(batX + 5000, 8000, batZ + 3000);
  ctx.beginPath();
  ctx.arc(pRadarDome.x, pRadarDome.y, 6, Math.PI, 0);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Efeito de pulso de varredura do radar
  ctx.beginPath();
  ctx.arc(pRadarDome.x, pRadarDome.y, 10, -Math.PI * 0.8, -Math.PI * 0.2);
  ctx.strokeStyle = 'rgba(52, 211, 153, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 6. RÓTULO DO COMPLEXO DE DEFESA COM GAP E BADGE PROTETORA
  const batLabel = `🛡️ BASE ABM REPÚBLICA TERRITORIAL (${(batX / 1000).toFixed(0)} km)`;
  ctx.font = 'bold 10px monospace';
  const batWidth = ctx.measureText(batLabel).width;

  ctx.fillStyle = 'rgba(6, 78, 59, 0.95)';
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(pBat.x - batWidth / 2 - 8, pBat.y + 20, batWidth + 16, 18, 4);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#6ee7b7';
  ctx.textAlign = 'center';
  ctx.fillText(batLabel, pBat.x, pBat.y + 32);
}
