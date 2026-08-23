/**
 * Renderizador Gráfico de Alta Performance em HTML5 Canvas
 * Modos de visualização:
 * 1. 'view25d' - Visão 2.5D Tática com Relevo Realista (Montanhas, Casas, Prédios), Fronteiras, Míssil Interceptor da República Territorial, Destruição Mútua no Céu e Bombardeio Cinético por Varas de Deus.
 * 2. 'profile' - Perfil de Trajetória Altitude vs Alcance com Relevo Topográfico no Horizonte e Camadas Atmosféricas.
 * 3. 'radar'   - Visão Top-Down Tática com Relevo, Cidades, Alvos e Dispersão.
 * 4. 'orbital' - Visão Planetária Esférica com Relevo Continental e Arco Orbital.
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  TelemetryPoint,
  ViewMode,
  PlanetaryEnvironment,
  ProjectileConfig,
  InterceptorState,
  SatelliteDefenseSystemState,
} from '../types/physics';
import {
  FICTIONAL_CONTINENTS,
  FICTIONAL_BORDERS,
  FICTIONAL_REGIONS,
} from '../data/fictionalGeography';
import {
  createDefaultTerrainMap,
  applyAreaDestruction,
  TerrainMapData,
} from '../data/terrainFeatures';
import { CanvasUIControls } from './canvas/CanvasUIControls';
import { CanvasLegend } from './canvas/CanvasLegend';
import { drawLaunchPadAlpha, drawDefenseBattery } from './canvas/renderInstallations';

interface CanvasRendererProps {
  currentTelemetry: TelemetryPoint | null;
  telemetryHistory: TelemetryPoint[];
  fullTrajectory: TelemetryPoint[];
  environment: PlanetaryEnvironment;
  projectile: ProjectileConfig;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  showVectors: boolean;
  onToggleVectors: () => void;
  showAtmosphereLayers: boolean;
  onToggleAtmosphere: () => void;
  autoFollow: boolean;
  onToggleAutoFollow: () => void;
  interceptorState: InterceptorState;
  satelliteDefenseState: SatelliteDefenseSystemState;
  onToggleAutoEngage: () => void;
  onManualLaunchInterceptor: () => void;
  onTriggerKineticStrike?: () => void;
}

export const CanvasRenderer: React.FC<CanvasRendererProps> = ({
  currentTelemetry,
  telemetryHistory,
  fullTrajectory,
  environment,
  projectile,
  viewMode,
  onViewModeChange,
  showVectors,
  onToggleVectors,
  showAtmosphereLayers,
  onToggleAtmosphere,
  autoFollow,
  onToggleAutoFollow,
  interceptorState,
  satelliteDefenseState,
  onToggleAutoEngage,
  onManualLaunchInterceptor,
  onTriggerKineticStrike,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Estados de transformação gráfica (Pan & Zoom)
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Mapa de relevo e feições geradas
  const baseTerrain = useMemo(() => {
    const maxRange = Math.max(7000, projectile.targetRangeKm * 1.3);
    return createDefaultTerrainMap(maxRange);
  }, [projectile.targetRangeKm]);

  // Aplica destruição de área em tempo real conforme as Varas de Deus impactam o solo
  const currentTerrain: TerrainMapData = useMemo(() => {
    let terrain = baseTerrain;
    if (satelliteDefenseState && satelliteDefenseState.rods.length > 0) {
      satelliteDefenseState.rods.forEach((rod) => {
        if (rod.status === 'impacted') {
          const blastKm = rod.blastRadiusKm || 30;
          terrain = applyAreaDestruction(
            terrain,
            rod.x / 1000,
            rod.z / 1000,
            blastKm,
            rod.impactTime || 0
          );
        }
      });
    }
    return terrain;
  }, [baseTerrain, satelliteDefenseState]);

  // Reset de câmera ao trocar de modo ou recarregar
  const handleResetCamera = useCallback(() => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  }, []);

  // Handler de Zoom por roda do mouse
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.85;
    setZoom((prev) => Math.min(15.0, Math.max(0.2, prev * factor)));
  };

  // Handlers de Drag / Pan
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Redimensionamento responsivo do Canvas
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        canvasRef.current.width = rect.width * window.devicePixelRatio;
        canvasRef.current.height = rect.height * window.devicePixelRatio;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // LOOP PRINCIPAL DE RENDERIZAÇÃO DO CANVAS
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Fundo aeroespacial profundo
    const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, Math.max(width, height));
    bgGrad.addColorStop(0, '#0d1322');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Grade de estrelas e poeira espacial
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    for (let i = 0; i < 50; i++) {
      const sx = ((i * 137.5 + 23) % width);
      const sy = ((i * 269.3 + 47) % height);
      ctx.fillRect(sx, sy, (i % 3 === 0) ? 1.5 : 1, (i % 3 === 0) ? 1.5 : 1);
    }

    // Calcula limites de escala
    let maxRange = projectile.targetRangeKm * 1000 * 1.25;
    let maxAlt = 50000;

    if (fullTrajectory.length > 0) {
      const trajMaxAlt = Math.max(...fullTrajectory.map((p) => p.y));
      const trajMaxX = Math.max(...fullTrajectory.map((p) => p.x));
      if (trajMaxAlt > 0) maxAlt = trajMaxAlt * 1.25;
      if (trajMaxX > 0) maxRange = Math.max(maxRange, trajMaxX * 1.15);
    }

    // =========================================================================
    // MODO 4: VISÃO 2.5D TÁTICA AMPLIADA COM RELEVO E PLANO CARTESIANO ESPACIAL
    // =========================================================================
    if (viewMode === 'view25d') {
      const originX = width * 0.08 + pan.x;
      const groundY = height * 0.81 + pan.y;

      // Espaço Terrestre Ampliado (Alcance X até 8.500+ km e Profundidade Z de 1.600 km)
      const mapLengthM = Math.max(projectile.targetRangeKm * 1000 * 1.35, 8500000);
      const mapHalfWidthM = 800000; // 800 km para cada lado (Total 1.600 km de profundidade)

      // Altura dos Satélites Ampliada (Eixo Y com cobertura orbital até 650+ km)
      const view25dMaxAlt = Math.max(650000, maxAlt * 1.35);

      const groundScaleX = ((width * 0.84) / mapLengthM) * zoom;
      const altScaleY = ((height * 0.65) / view25dMaxAlt) * zoom;

      // Parâmetros de Projeção Axonométrica 2.5D
      const angleRad = (16 * Math.PI) / 180;
      const cosA = Math.cos(angleRad);
      const sinA = Math.sin(angleRad);
      const tilt = 0.35; // Compressão do plano Z para profundidade isométrica

      // Função de projeção matemática 3D -> 2.5D tela
      const project3Dto25D = (xM: number, yM: number, zM: number) => {
        const xScreen = originX + (xM * cosA - zM * sinA) * groundScaleX;
        const yScreen = groundY + (xM * sinA + zM * cosA) * groundScaleX * tilt - yM * altScaleY;
        return { x: xScreen, y: yScreen };
      };

      const projectGroundTo25D = (xM: number, zM: number) => project3Dto25D(xM, 0, zM);

      // 0. CAMADA DE REFERÊNCIA ESPACIAL E PLANOS ORBITAIS EM 2.5D
      // A. Linha de Kármán (100 km de Altitude - Fronteira Espacial)
      const karmanAltM = 100000;
      const pKarmanStart = project3Dto25D(0, karmanAltM, -mapHalfWidthM * 0.6);
      const pKarmanEnd = project3Dto25D(mapLengthM * 0.9, karmanAltM, -mapHalfWidthM * 0.6);
      
      ctx.beginPath();
      ctx.moveTo(pKarmanStart.x, pKarmanStart.y);
      ctx.lineTo(pKarmanEnd.x, pKarmanEnd.y);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(6, 182, 212, 0.7)';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('── LINHA DE KÁRMÁN (100 km - FRONTEIRA DO ESPAÇO) ──', pKarmanStart.x + 10, pKarmanStart.y - 4);

      // B. Cinturão Orbital LEO dos Satélites Thor (420 km - 480 km)
      const thorOrbitalAltM = 440000;
      const pThorOrbitStart = project3Dto25D(0, thorOrbitalAltM, 0);
      const pThorOrbitEnd = project3Dto25D(mapLengthM * 0.6, thorOrbitalAltM, 0);
      
      ctx.beginPath();
      ctx.moveTo(pThorOrbitStart.x, pThorOrbitStart.y);
      ctx.lineTo(pThorOrbitEnd.x, pThorOrbitEnd.y);
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.22)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 8]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(234, 179, 8, 0.75)';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('🛰️ CINTURÃO ORBITAL DE DEFESA THOR (440 km LEO)', pThorOrbitStart.x + 15, pThorOrbitStart.y - 6);

      // 1. GRADE CARTESIANA AMPLIADA DO PLANO DO SOLO (EIXOS X E Z)
      ctx.lineWidth = 1;
      const xGridStep = mapLengthM > 4000000 ? 500000 : 250000;
      const zGridStep = 200000;

      // Fundo do plano cartesiano terrestre com leve gradiente
      const pCorner1 = projectGroundTo25D(0, -mapHalfWidthM);
      const pCorner2 = projectGroundTo25D(mapLengthM, -mapHalfWidthM);
      const pCorner3 = projectGroundTo25D(mapLengthM, mapHalfWidthM);
      const pCorner4 = projectGroundTo25D(0, mapHalfWidthM);

      ctx.beginPath();
      ctx.moveTo(pCorner1.x, pCorner1.y);
      ctx.lineTo(pCorner2.x, pCorner2.y);
      ctx.lineTo(pCorner3.x, pCorner3.y);
      ctx.lineTo(pCorner4.x, pCorner4.y);
      ctx.closePath();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Linhas transversais (Z)
      for (let z = -mapHalfWidthM; z <= mapHalfWidthM; z += zGridStep) {
        const pStart = projectGroundTo25D(0, z);
        const pEnd = projectGroundTo25D(mapLengthM, z);
        ctx.beginPath();
        ctx.moveTo(pStart.x, pStart.y);
        ctx.lineTo(pEnd.x, pEnd.y);
        ctx.strokeStyle = z === 0 ? 'rgba(6, 182, 212, 0.5)' : 'rgba(51, 65, 85, 0.28)';
        ctx.lineWidth = z === 0 ? 1.5 : 0.8;
        ctx.stroke();

        // Rótulos do Eixo Z na borda inicial (X = 0)
        if (z !== 0) {
          const pZLabel = projectGroundTo25D(0, z);
          ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
          ctx.font = '8px monospace';
          ctx.textAlign = 'right';
          ctx.fillText(`Z: ${z > 0 ? '+' : ''}${(z / 1000).toFixed(0)} km`, pZLabel.x - 8, pZLabel.y + 3);
        }
      }

      // Linhas longitudinais (X)
      for (let x = 0; x <= mapLengthM; x += xGridStep) {
        const pStart = projectGroundTo25D(x, -mapHalfWidthM);
        const pEnd = projectGroundTo25D(x, mapHalfWidthM);
        ctx.beginPath();
        ctx.moveTo(pStart.x, pStart.y);
        ctx.lineTo(pEnd.x, pEnd.y);
        ctx.strokeStyle = x === 0 ? 'rgba(6, 182, 212, 0.5)' : 'rgba(51, 65, 85, 0.25)';
        ctx.lineWidth = x === 0 ? 1.5 : 0.8;
        ctx.stroke();

        // Rótulos do Eixo X no solo
        const pLabel = projectGroundTo25D(x, mapHalfWidthM + 35000);
        ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`X: ${(x / 1000).toFixed(0)} km`, pLabel.x, pLabel.y);
      }

      // 1.1. PILAR VERTICAL DO EIXO CARTESIANO Y (ALTITUDE / ESPAÇO AÉREO E ORBITAL)
      const pOrigin = projectGroundTo25D(0, 0);
      const pTopY = project3Dto25D(0, view25dMaxAlt, 0);

      ctx.beginPath();
      ctx.moveTo(pOrigin.x, pOrigin.y);
      ctx.lineTo(pTopY.x, pTopY.y);
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Graduações de altitude no Eixo Y
      const altStepsKm = [0, 50, 100, 200, 350, 450, 600];
      altStepsKm.forEach((altKm) => {
        const altM = altKm * 1000;
        if (altM <= view25dMaxAlt) {
          const pTick = project3Dto25D(0, altM, 0);
          
          // Traço de graduação
          ctx.beginPath();
          ctx.moveTo(pTick.x - 6, pTick.y);
          ctx.lineTo(pTick.x + 6, pTick.y);
          ctx.strokeStyle = altKm === 100 ? '#06b6d4' : altKm >= 350 ? '#facc15' : 'rgba(255, 255, 255, 0.6)';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Linha de grade de altitude pontilhada
          ctx.beginPath();
          ctx.moveTo(pTick.x, pTick.y);
          const pGridDepth = project3Dto25D(0, altM, -mapHalfWidthM * 0.4);
          ctx.lineTo(pGridDepth.x, pGridDepth.y);
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
          ctx.setLineDash([2, 4]);
          ctx.stroke();
          ctx.setLineDash([]);

          // Rótulo de altitude
          ctx.fillStyle = altKm === 100 ? '#38bdf8' : altKm >= 350 ? '#fef08a' : '#cbd5e1';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'right';
          ctx.fillText(`Y: ${altKm} km`, pTick.x - 10, pTick.y + 3);
        }
      });

      // Indicador do Topo do Eixo Y
      ctx.fillStyle = '#06b6d4';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('▲ +Y (ALTITUDE ORBITAL)', pTopY.x, pTopY.y - 12);

      // Badge HUD das Dimensões do Plano Cartesiano 2.5D
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.lineWidth = 1;
      ctx.fillRect(originX - 10, groundY + 38, 380, 24);
      ctx.strokeRect(originX - 10, groundY + 38, 380, 24);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 9.5px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(
        `📐 PLANO CARTESIANO 2.5D | X: [0-${(mapLengthM/1000).toFixed(0)}km] | Y: [0-${(view25dMaxAlt/1000).toFixed(0)}km] | Z: [±${(mapHalfWidthM/1000).toFixed(0)}km]`,
        originX - 4,
        groundY + 54
      );

      // 2. REGIÕES TERRITORIAIS
      FICTIONAL_REGIONS.forEach((reg) => {
        if (reg.polygon.length > 2) {
          ctx.beginPath();
          reg.polygon.forEach((pt, idx) => {
            const p = projectGroundTo25D(pt.xKm * 1000, pt.zKm * 1000);
            if (idx === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          });
          ctx.closePath();
          ctx.fillStyle = reg.color;
          ctx.fill();
          ctx.strokeStyle = reg.strokeColor;
          ctx.lineWidth = 1;
          ctx.stroke();

          const midX = reg.polygon.reduce((acc, p) => acc + p.xKm, 0) / reg.polygon.length;
          const midZ = reg.polygon.reduce((acc, p) => acc + p.zKm, 0) / reg.polygon.length;
          const pCenter = projectGroundTo25D(midX * 1000, midZ * 1000);
          
          const regName = reg.name.toUpperCase();
          ctx.font = 'bold 9.5px monospace';
          const regW = ctx.measureText(regName).width;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
          ctx.strokeStyle = reg.strokeColor;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.roundRect(pCenter.x - regW / 2 - 6, pCenter.y - 10, regW + 12, 16, 4);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = 'rgba(226, 232, 240, 0.85)';
          ctx.textAlign = 'center';
          ctx.fillText(regName, pCenter.x, pCenter.y + 2);
        }
      });

      // 3. FRONTEIRAS TERRITORIAIS
      FICTIONAL_BORDERS.forEach((border) => {
        if (border.points.length > 1) {
          ctx.beginPath();
          border.points.forEach((pt, idx) => {
            const p = projectGroundTo25D(pt.xKm * 1000, pt.zKm * 1000);
            if (idx === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          });
          ctx.strokeStyle = border.color;
          ctx.lineWidth = border.lineWidth;
          ctx.setLineDash(border.dash);
          ctx.stroke();
          ctx.setLineDash([]);

          const midIdx = Math.floor(border.points.length / 2);
          const midPt = border.points[midIdx];
          const pLabel = projectGroundTo25D(midPt.xKm * 1000, midPt.zKm * 1000 - 20000);
          
          ctx.font = 'bold 9px monospace';
          const bW = ctx.measureText(border.name).width;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.strokeStyle = border.color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(pLabel.x - bW / 2 - 6, pLabel.y - 12, bW + 12, 16, 3);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = border.color;
          ctx.textAlign = 'center';
          ctx.fillText(border.name, pLabel.x, pLabel.y);
        }
      });

      // 4. RELEVO DE MONTANHAS (3D ISOMÉTRICO VOLUMÉTRICO)
      currentTerrain.mountains.forEach((mtn) => {
        const peakElevM = mtn.peakElevationM * 8; // Multiplicador para destaque visual
        const pPeak = project3Dto25D(mtn.xKm * 1000, peakElevM, mtn.zKm * 1000);
        const pBaseCenter = projectGroundTo25D(mtn.xKm * 1000, mtn.zKm * 1000);

        // Desenha as cristas e encostas da montanha
        const baseRadiusM = mtn.baseRadiusKm * 1000;
        const numSides = 8;
        const basePoly: Array<{ x: number; y: number }> = [];

        for (let i = 0; i < numSides; i++) {
          const angle = (i / numSides) * Math.PI * 2;
          const bx = mtn.xKm * 1000 + Math.cos(angle) * baseRadiusM;
          const bz = mtn.zKm * 1000 + Math.sin(angle) * baseRadiusM;
          basePoly.push(projectGroundTo25D(bx, bz));
        }

        // Desenha faces com iluminação solar (faces norte/oeste mais claras, sul/leste sombreadas)
        for (let i = 0; i < numSides; i++) {
          const p1 = basePoly[i];
          const p2 = basePoly[(i + 1) % numSides];

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.lineTo(pPeak.x, pPeak.y);
          ctx.closePath();

          // Sombra direcional
          const faceAngle = (i / numSides) * Math.PI * 2;
          const shade = Math.cos(faceAngle - Math.PI / 4) * 0.5 + 0.5;
          ctx.fillStyle = i % 2 === 0
            ? `rgba(51, 65, 85, ${0.45 + shade * 0.35})`
            : `rgba(30, 41, 59, ${0.5 + shade * 0.35})`;
          ctx.fill();
          ctx.strokeStyle = 'rgba(71, 85, 105, 0.4)';
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }

        // Cume nevado se altitude > 3000m
        if (mtn.peakElevationM > 3000) {
          const pSnowMid = project3Dto25D(mtn.xKm * 1000, peakElevM * 0.75, mtn.zKm * 1000);
          ctx.beginPath();
          ctx.moveTo(pPeak.x, pPeak.y);
          for (let i = 0; i <= numSides; i++) {
            const angle = (i / numSides) * Math.PI * 2;
            const sx = mtn.xKm * 1000 + Math.cos(angle) * (baseRadiusM * 0.25);
            const sz = mtn.zKm * 1000 + Math.sin(angle) * (baseRadiusM * 0.25);
            const sp = project3Dto25D(sx, peakElevM * 0.75, sz);
            ctx.lineTo(sp.x, sp.y);
          }
          ctx.closePath();
          ctx.fillStyle = 'rgba(241, 245, 249, 0.85)';
          ctx.fill();
        }

        // Rótulo da Montanha (exibe apenas para picos principais para manter a tela limpa e natural)
        if (mtn.peakElevationM >= 3800 || zoom > 1.2) {
          const labelText = `⛰️ ${mtn.name}`;
          ctx.font = 'bold 9px monospace';
          const textWidth = ctx.measureText(labelText).width;
          
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.roundRect(pPeak.x - textWidth / 2 - 6, pPeak.y - 24, textWidth + 12, 16, 3);
          ctx.fill();
          ctx.stroke();
          
          ctx.fillStyle = 'rgba(226, 232, 240, 0.9)';
          ctx.textAlign = 'center';
          ctx.fillText(labelText, pPeak.x, pPeak.y - 12);
        }
      });

      // 5. CIDADES, CENTROS URBANOS, PRÉDIOS E CASAS (3D ISOMÉTRICO)
      currentTerrain.settlements.forEach((settlement) => {
        // Marcador do perímetro urbano com badge elegante e GAP
        const pCityCenter = projectGroundTo25D(settlement.centerXKm * 1000, settlement.centerZKm * 1000);
        const cityName = `🏙️ ${settlement.name}`;
        ctx.font = 'bold 9px monospace';
        const cityWidth = ctx.measureText(cityName).width;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = settlement.territory === 'republica_territorial' ? '#10b981' : '#f59e0b';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(pCityCenter.x - cityWidth / 2 - 6, pCityCenter.y - 30, cityWidth + 12, 16, 3);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = settlement.territory === 'republica_territorial' ? '#6ee7b7' : '#fde68a';
        ctx.textAlign = 'center';
        ctx.fillText(cityName, pCityCenter.x, pCityCenter.y - 18);

        // Prédios individuais da cidade
        settlement.buildings.forEach((b) => {
          const bxM = b.xKm * 1000;
          const bzM = b.zKm * 1000;
          const pBase = projectGroundTo25D(bxM, bzM);

          if (b.destroyed) {
            // ESTRUTURA DESTRUÍDA POR VARAS DE DEUS
            ctx.beginPath();
            ctx.ellipse(pBase.x, pBase.y, 6, 3, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(239, 68, 68, 0.6)';
            ctx.fill();
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Fumaça subindo da estrutura destruída
            ctx.beginPath();
            ctx.arc(pBase.x, pBase.y - 5 - Math.random() * 4, 3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(100, 116, 139, 0.5)';
            ctx.fill();
          } else {
            // PRÉDIO OU CASA EM 3D
            const pTop = project3Dto25D(bxM, b.heightM, bzM);
            const wPx = Math.max(3, (b.widthM * groundScaleX * 1.5));
            const hPx = Math.max(4, pBase.y - pTop.y);

            if (b.type === 'skyscraper') {
              // Arranha-céu com fachada de vidro iluminada
              ctx.fillStyle = '#0f172a';
              ctx.fillRect(pTop.x - wPx / 2, pTop.y, wPx, hPx);

              // Fachada iluminada
              ctx.fillStyle = 'rgba(56, 189, 248, 0.7)';
              ctx.fillRect(pTop.x - wPx / 2 + 1, pTop.y + 1, wPx / 2 - 1, hPx - 1);

              ctx.fillStyle = 'rgba(14, 165, 233, 0.85)';
              ctx.fillRect(pTop.x, pTop.y + 1, wPx / 2 - 1, hPx - 1);

              // Topo / Telhado
              ctx.fillStyle = '#38bdf8';
              ctx.fillRect(pTop.x - wPx / 2, pTop.y, wPx, 2);

              // Antena no topo
              ctx.beginPath();
              ctx.moveTo(pTop.x, pTop.y);
              ctx.lineTo(pTop.x, pTop.y - 6);
              ctx.strokeStyle = '#f87171';
              ctx.lineWidth = 1;
              ctx.stroke();
            } else if (b.type === 'building' || b.type === 'industrial') {
              // Edifício comercial / industrial
              ctx.fillStyle = b.color;
              ctx.fillRect(pTop.x - wPx / 2, pTop.y, wPx, hPx);
              ctx.fillStyle = b.roofColor;
              ctx.fillRect(pTop.x - wPx / 2, pTop.y, wPx, 2.5);
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
              ctx.strokeRect(pTop.x - wPx / 2, pTop.y, wPx, hPx);
            } else if (b.type === 'house') {
              // Casa residencial com telhado inclinado
              ctx.fillStyle = b.color;
              ctx.fillRect(pTop.x - wPx / 2, pTop.y + 3, wPx, hPx - 3);

              // Telhado triangular
              ctx.beginPath();
              ctx.moveTo(pTop.x - wPx / 2 - 1, pTop.y + 3);
              ctx.lineTo(pTop.x, pTop.y);
              ctx.lineTo(pTop.x + wPx / 2 + 1, pTop.y + 3);
              ctx.closePath();
              ctx.fillStyle = b.roofColor;
              ctx.fill();
            } else if (b.type === 'radar_dome') {
              // Cúpula Geodésica de Radar
              ctx.beginPath();
              ctx.arc(pTop.x, pTop.y + hPx / 2, wPx / 1.5, Math.PI, 0);
              ctx.fillStyle = '#ffffff';
              ctx.fill();
              ctx.strokeStyle = '#10b981';
              ctx.lineWidth = 1.5;
              ctx.stroke();
            }
          }
        });
      });

      // 6. CASAS RESIDENCIAIS ESPALHADAS PELO MAPA
      currentTerrain.scatteredHouses.forEach((h) => {
        const hxM = h.xKm * 1000;
        const hzM = h.zKm * 1000;
        const pBase = projectGroundTo25D(hxM, hzM);

        if (h.destroyed) {
          ctx.beginPath();
          ctx.ellipse(pBase.x, pBase.y, 4, 2, 0, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(239, 68, 68, 0.7)';
          ctx.fill();
        } else {
          const pTop = project3Dto25D(hxM, h.heightM, hzM);
          const wPx = Math.max(3, h.widthM * groundScaleX * 1.5);
          const hPx = Math.max(3, pBase.y - pTop.y);

          // Parede da casa
          ctx.fillStyle = h.color;
          ctx.fillRect(pTop.x - wPx / 2, pTop.y + 2, wPx, hPx - 2);

          // Telhado inclinado
          ctx.beginPath();
          ctx.moveTo(pTop.x - wPx / 2 - 1, pTop.y + 2);
          ctx.lineTo(pTop.x, pTop.y);
          ctx.lineTo(pTop.x + wPx / 2 + 1, pTop.y + 2);
          ctx.closePath();
          ctx.fillStyle = h.roofColor;
          ctx.fill();
        }
      });

      // 7. BASES E INSTALAÇÕES ESTRATÉGICAS NO PLANO 2D DO SOLO
      const projUtils = { project3Dto25D, projectGroundTo25D };

      // A. Plataforma de Lançamento Alpha com Torre Gantry, Foguete na Rampa e Ignição
      drawLaunchPadAlpha(
        ctx,
        projUtils,
        currentTelemetry,
        projectile,
        groundScaleX,
        tilt
      );

      // B. Bateria de Defesa Aeroespacial da República Territorial com Lançador e Silos
      drawDefenseBattery(
        ctx,
        projUtils,
        interceptorState,
        groundScaleX,
        tilt
      );

      // C. Polígono Alvo Terminal da República Territorial
      const targetRangeM = projectile.targetRangeKm * 1000;
      const pTarget = projectGroundTo25D(targetRangeM, 0);

      // Anéis de alvo no solo 2D
      [25000, 50000].forEach((rM, idx) => {
        ctx.beginPath();
        for (let th = 0; th <= Math.PI * 2; th += Math.PI / 12) {
          const rx = targetRangeM + rM * Math.cos(th);
          const rz = rM * Math.sin(th);
          const pRing = projectGroundTo25D(rx, rz);
          if (th === 0) ctx.moveTo(pRing.x, pRing.y);
          else ctx.lineTo(pRing.x, pRing.y);
        }
        ctx.closePath();
        ctx.strokeStyle = idx === 0 ? 'rgba(245, 158, 11, 0.8)' : 'rgba(245, 158, 11, 0.3)';
        ctx.stroke();
      });

      ctx.beginPath();
      ctx.arc(pTarget.x, pTarget.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();

      // Badge do Alvo com GAP
      const targetLabel = `🎯 POLÍGONO ALVO (${projectile.targetRangeKm} km)`;
      ctx.font = 'bold 10px monospace';
      const targetW = ctx.measureText(targetLabel).width;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(pTarget.x - targetW / 2 - 8, pTarget.y + 20, targetW + 16, 18, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.textAlign = 'center';
      ctx.fillText(targetLabel, pTarget.x, pTarget.y + 32);

      // 8. SOMBRA DA TRAJETÓRIA NO PLANO 2D DO SOLO
      if (telemetryHistory.length > 1) {
        ctx.beginPath();
        telemetryHistory.forEach((pt, idx) => {
          const p = projectGroundTo25D(pt.x, pt.lateralDeviation);
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 9. TRAJETÓRIA ELEVADA 2.5D NO ESPAÇO TRIDIMENSIONAL
      if (telemetryHistory.length > 1) {
        ctx.beginPath();
        telemetryHistory.forEach((pt, idx) => {
          const p = project3Dto25D(pt.x, pt.y, pt.lateralDeviation);
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Ponto de Apogeu em 2.5D com Badge e GAP
        const apogeePt = telemetryHistory.reduce((max, p) => (p.y > max.y ? p : max), telemetryHistory[0]);
        if (apogeePt && apogeePt.y > 2000) {
          const pApo3D = project3Dto25D(apogeePt.x, apogeePt.y, apogeePt.lateralDeviation);
          const pApoGround = projectGroundTo25D(apogeePt.x, apogeePt.lateralDeviation);

          ctx.beginPath();
          ctx.moveTo(pApoGround.x, pApoGround.y);
          ctx.lineTo(pApo3D.x, pApo3D.y);
          ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
          ctx.setLineDash([2, 2]);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = '#a855f7';
          ctx.beginPath();
          ctx.arc(pApo3D.x, pApo3D.y, 4.5, 0, Math.PI * 2);
          ctx.fill();

          // Badge do Apogeu com GAP generoso
          const apogeeLabel = `⭐ APOGEU: ${(apogeePt.y / 1000).toFixed(1)} km`;
          ctx.font = 'bold 9px monospace';
          const apoW = ctx.measureText(apogeeLabel).width;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
          ctx.strokeStyle = '#a855f7';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.roundRect(pApo3D.x - apoW / 2 - 6, pApo3D.y - 26, apoW + 12, 16, 4);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#c084fc';
          ctx.textAlign = 'center';
          ctx.fillText(apogeeLabel, pApo3D.x, pApo3D.y - 15);
        }
      }

      // 10. TRAJETÓRIA DO MÍSSIL DE INTERCEPÇÃO DA REPÚBLICA TERRITORIAL EM 2.5D
      if (interceptorState.history.length > 1) {
        ctx.beginPath();
        interceptorState.history.forEach((pt, idx) => {
          const p = project3Dto25D(pt.x, pt.y, pt.z);
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      // 11. RASTREAMENTO POR FEIXE DE RADAR (REPÚBLICA TERRITORIAL -> MÍSSIL)
      if (
        currentTelemetry &&
        (interceptorState.status === 'launched' || interceptorState.status === 'tracking')
      ) {
        const pBat = projectGroundTo25D(interceptorState.battery.x, interceptorState.battery.z);
        const pTarget3D = project3Dto25D(currentTelemetry.x, currentTelemetry.y, currentTelemetry.lateralDeviation);

        ctx.beginPath();
        ctx.moveTo(pBat.x, pBat.y);
        ctx.lineTo(pTarget3D.x, pTarget3D.y);
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.45)';
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 12. MÍSSIL INTERCEPTOR DA REPÚBLICA TERRITORIAL EM VOO
      if (
        interceptorState.currentPoint &&
        (interceptorState.status === 'launched' || interceptorState.status === 'tracking')
      ) {
        const pInt3D = project3Dto25D(
          interceptorState.currentPoint.x,
          interceptorState.currentPoint.y,
          interceptorState.currentPoint.z
        );
        const pIntGround = projectGroundTo25D(
          interceptorState.currentPoint.x,
          interceptorState.currentPoint.z
        );

        // Haste vertical de altitude do interceptor
        ctx.beginPath();
        ctx.moveTo(pIntGround.x, pIntGround.y);
        ctx.lineTo(pInt3D.x, pInt3D.y);
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
        ctx.setLineDash([2, 2]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Chama de propulsão hipersônica do interceptor
        ctx.beginPath();
        ctx.arc(pInt3D.x, pInt3D.y, 7 + Math.random() * 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(16, 185, 129, 0.6)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(pInt3D.x, pInt3D.y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Badge do Interceptor em Voo com GAP
        const intLabel = `🚀 INTERCEPTOR: ${(interceptorState.currentPoint.speed).toFixed(0)} m/s`;
        ctx.font = 'bold 9px monospace';
        const intW = ctx.measureText(intLabel).width;
        ctx.fillStyle = 'rgba(6, 78, 59, 0.9)';
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(pInt3D.x + 12, pInt3D.y - 18, intW + 10, 16, 3);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#6ee7b7';
        ctx.textAlign = 'left';
        ctx.fillText(intLabel, pInt3D.x + 17, pInt3D.y - 6);
      }

      // 13. DESTRUIÇÃO MÚTUA NO CÉU (AMBOS OS MÍSSEIS EXPLODEM NO APOGEU)
      if (interceptorState.status === 'intercepted' && interceptorState.targetInterceptPoint) {
        const pExplode = project3Dto25D(
          interceptorState.targetInterceptPoint.x,
          interceptorState.targetInterceptPoint.y,
          interceptorState.targetInterceptPoint.z
        );
        const pExplodeGround = projectGroundTo25D(
          interceptorState.targetInterceptPoint.x,
          interceptorState.targetInterceptPoint.z
        );

        // Haste de altitude do ponto de colisão no céu
        ctx.beginPath();
        ctx.moveTo(pExplodeGround.x, pExplodeGround.y);
        ctx.lineTo(pExplode.x, pExplode.y);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
        ctx.setLineDash([2, 2]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Ondas de choque da destruição mútua
        for (let r = 1; r <= 4; r++) {
          ctx.beginPath();
          ctx.arc(pExplode.x, pExplode.y, r * 14, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(239, 68, 68, ${0.9 - r * 0.2})`;
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }

        // Bola de fogo e detritos da colisão
        ctx.beginPath();
        ctx.arc(pExplode.x, pExplode.y, 18, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(245, 158, 11, 0.9)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(pExplode.x, pExplode.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Detritos e estilhaços da destruição mútua
        for (let d = 0; d < 8; d++) {
          const ang = (d / 8) * Math.PI * 2;
          const dist = 24 + (d % 3) * 8;
          ctx.beginPath();
          ctx.moveTo(pExplode.x, pExplode.y);
          ctx.lineTo(pExplode.x + Math.cos(ang) * dist, pExplode.y + Math.sin(ang) * dist);
          ctx.strokeStyle = d % 2 === 0 ? '#ef4444' : '#f59e0b';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Badges de Destruição no Apogeu com GAPs verticais calibrados
        const destTitle = '💥 DESTRUIÇÃO MÚTUA NO APOGEU (HIT-TO-KILL)';
        const destSub = '🛡️ AMEAÇA NEUTRALIZADA PELA DEFESA DA REPÚBLICA';
        
        ctx.font = 'bold 11px monospace';
        const dTitleW = ctx.measureText(destTitle).width;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(pExplode.x - dTitleW / 2 - 8, pExplode.y - 52, dTitleW + 16, 20, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#f87171';
        ctx.textAlign = 'center';
        ctx.fillText(destTitle, pExplode.x, pExplode.y - 38);

        ctx.font = 'bold 9.5px monospace';
        const dSubW = ctx.measureText(destSub).width;
        ctx.fillStyle = 'rgba(6, 78, 59, 0.95)';
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(pExplode.x - dSubW / 2 - 6, pExplode.y - 28, dSubW + 12, 17, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#6ee7b7';
        ctx.textAlign = 'center';
        ctx.fillText(destSub, pExplode.x, pExplode.y - 16);
      }

      // 14. MÍSSIL BALÍSTICO ATIVO EM 2.5D (SE NÃO DESTRUÍDO)
      if (currentTelemetry && currentTelemetry.phase !== 'destruido') {
        const pCur3D = project3Dto25D(
          currentTelemetry.x,
          currentTelemetry.y,
          currentTelemetry.lateralDeviation
        );
        const pCurGround = projectGroundTo25D(
          currentTelemetry.x,
          currentTelemetry.lateralDeviation
        );

        if (autoFollow) {
          const desiredPanX = width / 2 - (pCur3D.x - pan.x);
          const desiredPanY = height / 2 - (pCur3D.y - pan.y);
          setPan((prev) => ({
            x: prev.x + (desiredPanX - prev.x) * 0.1,
            y: prev.y + (desiredPanY - prev.y) * 0.1,
          }));
        }

        // HASTE VERTICAL DE ALTITUDE
        ctx.beginPath();
        ctx.moveTo(pCurGround.x, pCurGround.y);
        ctx.lineTo(pCur3D.x, pCur3D.y);
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([2, 2]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Sombra no chão do mapa 2D
        ctx.beginPath();
        ctx.ellipse(pCurGround.x, pCurGround.y, 6, 3, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.fill();

        // Chama de Propulsão
        if (currentTelemetry.thrustForce > 0) {
          ctx.beginPath();
          ctx.arc(pCur3D.x, pCur3D.y, 8 + Math.random() * 4, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(249, 115, 22, 0.5)';
          ctx.fill();
          ctx.beginPath();
          ctx.arc(pCur3D.x, pCur3D.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#f97316';
          ctx.fill();
        }

        // Plasma de Reentrada
        if (currentTelemetry.heatFluxRate > 15) {
          ctx.beginPath();
          ctx.arc(pCur3D.x, pCur3D.y, 10 + Math.min(15, currentTelemetry.heatFluxRate / 40), 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
          ctx.fill();
        }

        // Ponto do Míssil
        ctx.beginPath();
        ctx.arc(pCur3D.x, pCur3D.y, 5.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Badge do Míssil com GAP e Proteção de Fundo
        const misLabel = `🚀 ${(currentTelemetry.speed).toFixed(0)} m/s | Alt: ${(currentTelemetry.y / 1000).toFixed(1)} km`;
        ctx.font = 'bold 9.5px monospace';
        const misW = ctx.measureText(misLabel).width;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(pCur3D.x + 12, pCur3D.y - 18, misW + 10, 16, 3);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.textAlign = 'left';
        ctx.fillText(misLabel, pCur3D.x + 17, pCur3D.y - 6);
      }

      // 15. CONSTELAÇÃO ORBITAL DE SATÉLITES THOR ("VARAS DE DEUS") EM 2.5D
      if (satelliteDefenseState) {
        // Enlaces Laser Inter-Satélites (ISL - Inter-Satellite Laser Links)
        if (satelliteDefenseState.satellites.length > 1) {
          ctx.beginPath();
          satelliteDefenseState.satellites.forEach((sat, idx) => {
            const pSat3D = project3Dto25D(sat.x, sat.altitudeM, sat.z);
            if (idx === 0) ctx.moveTo(pSat3D.x, pSat3D.y);
            else ctx.lineTo(pSat3D.x, pSat3D.y);
          });
          ctx.strokeStyle = 'rgba(234, 179, 8, 0.4)';
          ctx.lineWidth = 1.2;
          ctx.setLineDash([3, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        satelliteDefenseState.satellites.forEach((sat, satIdx) => {
          const pSat3D = project3Dto25D(sat.x, sat.altitudeM, sat.z);
          const pSatGround = projectGroundTo25D(sat.x, sat.z);

          // Haste orbital pontilhada até o solo com marcação de altitude
          ctx.beginPath();
          ctx.moveTo(pSatGround.x, pSatGround.y);
          ctx.lineTo(pSat3D.x, pSat3D.y);
          ctx.strokeStyle = 'rgba(234, 179, 8, 0.35)';
          ctx.setLineDash([2, 3]);
          ctx.lineWidth = 1.2;
          ctx.stroke();
          ctx.setLineDash([]);

          // Sombra projetada no plano cartesiano terrestre
          ctx.beginPath();
          ctx.ellipse(pSatGround.x, pSatGround.y, 8, 4, 0, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(234, 179, 8, 0.25)';
          ctx.fill();

          // Ícone do Satélite Thor (Painéis Solares + Módulo de Hastes)
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(pSat3D.x - 14, pSat3D.y - 3, 9, 6); // Painel Solar Esq
          ctx.fillRect(pSat3D.x + 5, pSat3D.y - 3, 9, 6);  // Painel Solar Dir
          
          ctx.beginPath();
          ctx.arc(pSat3D.x, pSat3D.y, 6, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Rótulo Inteligente com Alternância de GAP para evitar sobreposição entre satélites
          const isEven = satIdx % 2 === 0;
          const satBadgeY = isEven ? pSat3D.y - 24 : pSat3D.y + 14;
          const satLabel = `🛰️ ${sat.name} | ${(sat.altitudeM / 1000).toFixed(0)}km LEO`;
          
          ctx.font = 'bold 9px monospace';
          const satW = ctx.measureText(satLabel).width;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
          ctx.strokeStyle = '#eab308';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(pSat3D.x - satW / 2 - 6, satBadgeY, satW + 12, 16, 3);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#fef08a';
          ctx.textAlign = 'center';
          ctx.fillText(satLabel, pSat3D.x, satBadgeY + 11);
        });

        // 16. BOMBARDEIO CINÉTICO: VARAS DE DEUS E DESTRUIÇÃO DE ÁREA NO MAPA EM 2.5D
        satelliteDefenseState.rods.forEach((rod, rodIdx) => {
          const pRod3D = project3Dto25D(rod.x, rod.y, rod.z);
          const pRodGround = projectGroundTo25D(rod.x, rod.z);

          // Trajetória de Queda
          if (rod.history.length > 1) {
            ctx.beginPath();
            rod.history.forEach((h, idx) => {
              const p = project3Dto25D(h.x, h.y, h.z);
              if (idx === 0) ctx.moveTo(p.x, p.y);
              else ctx.lineTo(p.x, p.y);
            });
            ctx.strokeStyle = 'rgba(249, 115, 22, 0.8)';
            ctx.lineWidth = 3;
            ctx.stroke();
          }

          if (rod.status !== 'impacted') {
            // Haste vertical ao solo
            ctx.beginPath();
            ctx.moveTo(pRodGround.x, pRodGround.y);
            ctx.lineTo(pRod3D.x, pRod3D.y);
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
            ctx.setLineDash([2, 2]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Cauda de Plasma Hipersônico
            ctx.beginPath();
            ctx.arc(pRod3D.x, pRod3D.y, 9 + Math.random() * 5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(239, 68, 68, 0.7)';
            ctx.fill();

            // Dardo Cinético de Tungstênio
            ctx.beginPath();
            ctx.arc(pRod3D.x, pRod3D.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.strokeStyle = '#f97316';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Badge da Vara de Deus em voo com GAP
            const rodLabel = `⚡ VARA DE DEUS: Mach ${rod.mach.toFixed(1)} | ${(rod.y / 1000).toFixed(1)} km`;
            ctx.font = 'bold 9px monospace';
            const rW = ctx.measureText(rodLabel).width;
            ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
            ctx.strokeStyle = '#f97316';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(pRod3D.x + 12, pRod3D.y - 18, rW + 10, 16, 3);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#fb923c';
            ctx.textAlign = 'left';
            ctx.fillText(rodLabel, pRod3D.x + 17, pRod3D.y - 6);
          } else {
            // IMPACTO CINÉTICO E DESTRUIÇÃO DE ÁREA NO MAPA
            const blastKm = rod.blastRadiusKm || 30;
            const blastRadiusPx = blastKm * 1000 * groundScaleX;

            // Raio de aniquilação de área no solo
            ctx.beginPath();
            ctx.ellipse(pRodGround.x, pRodGround.y, Math.max(25, blastRadiusPx), Math.max(12, blastRadiusPx * tilt), 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Ondas de choque térmicas e de solo
            for (let ring = 1; ring <= 3; ring++) {
              ctx.beginPath();
              ctx.ellipse(pRodGround.x, pRodGround.y, ring * 16, ring * 8, 0, 0, Math.PI * 2);
              ctx.strokeStyle = `rgba(245, 158, 11, ${0.9 - ring * 0.25})`;
              ctx.lineWidth = 2;
              ctx.stroke();
            }

            // Cratera de Tungstênio
            ctx.beginPath();
            ctx.ellipse(pRodGround.x, pRodGround.y, 14, 7, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#18181b';
            ctx.fill();
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Coluna de fogo e fumaça subindo da cratera
            ctx.beginPath();
            ctx.moveTo(pRodGround.x - 4, pRodGround.y);
            ctx.lineTo(pRodGround.x, pRodGround.y - 35);
            ctx.lineTo(pRodGround.x + 4, pRodGround.y);
            ctx.closePath();
            ctx.fillStyle = 'rgba(249, 115, 22, 0.7)';
            ctx.fill();

            // Badges da Área Destruída com GAPs calibrados e alternância vertical
            const craterOffsetY = 46 + (rodIdx % 2) * 24;
            const areaTitle = `💥 ÁREA DESTRUÍDA: ${rod.targetName}`;
            const areaSub = `Raio: ${blastKm.toFixed(0)} km | Cratera: ${rod.craterDiameterM}m | ~${rod.impactTntEquivalentTons?.toFixed(1)} t TNT`;
            
            ctx.font = 'bold 10px monospace';
            const atW = ctx.measureText(areaTitle).width;
            ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.roundRect(pRodGround.x - atW / 2 - 8, pRodGround.y - craterOffsetY, atW + 16, 18, 4);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText(areaTitle, pRodGround.x, pRodGround.y - craterOffsetY + 12);

            ctx.font = 'bold 8.5px monospace';
            const asW = ctx.measureText(areaSub).width;
            ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
            ctx.strokeStyle = '#fca5a5';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.roundRect(pRodGround.x - asW / 2 - 6, pRodGround.y - craterOffsetY + 20, asW + 12, 15, 3);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#fca5a5';
            ctx.textAlign = 'center';
            ctx.fillText(areaSub, pRodGround.x, pRodGround.y - craterOffsetY + 31);
          }
        });
      }
    }

    // ==========================================
    // MODO 1: VISÃO GLOBAL ORBITAL ESFÉRICA
    // ==========================================
    else if (viewMode === 'orbital') {
      const cx = width / 2 + pan.x;
      const cy = height * 0.95 + pan.y;
      const planetRadiusPx = Math.min(width, height) * 0.85 * zoom;
      const R = environment.planetRadius;
      const scale = planetRadiusPx / R;

      // 1. Atmosfera e Linha de Kármán
      if (showAtmosphereLayers && environment.enableAtmosphere) {
        const atmoRadiusPx = (R + environment.atmosphereCeiling) * scale;
        const atmoGrad = ctx.createRadialGradient(cx, cy, planetRadiusPx - 2, cx, cy, atmoRadiusPx + 10);
        atmoGrad.addColorStop(0, 'rgba(6, 182, 212, 0.35)');
        atmoGrad.addColorStop(0.5, 'rgba(14, 165, 233, 0.15)');
        atmoGrad.addColorStop(0.85, 'rgba(56, 189, 248, 0.05)');
        atmoGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.beginPath();
        ctx.arc(cx, cy, atmoRadiusPx, 0, Math.PI * 2);
        ctx.fillStyle = atmoGrad;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(cx, cy, atmoRadiusPx, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 2. Disco do Planeta Fictício
      const planetGrad = ctx.createRadialGradient(cx, cy - planetRadiusPx * 0.8, planetRadiusPx * 0.2, cx, cy, planetRadiusPx);
      planetGrad.addColorStop(0, '#1e293b');
      planetGrad.addColorStop(0.7, '#0f172a');
      planetGrad.addColorStop(1, '#090d16');

      ctx.beginPath();
      ctx.arc(cx, cy, planetRadiusPx, 0, Math.PI * 2);
      ctx.fillStyle = planetGrad;
      ctx.fill();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 3. Continentes Fictícios
      FICTIONAL_CONTINENTS.forEach((cont) => {
        const startTheta = -Math.PI / 2 + (cont.startKm * 1000) / R;
        const endTheta = -Math.PI / 2 + (cont.endKm * 1000) / R;

        ctx.beginPath();
        ctx.arc(cx, cy, planetRadiusPx + 1, startTheta, endTheta);
        ctx.strokeStyle = cont.borderColor;
        ctx.lineWidth = 5;
        ctx.stroke();

        const midTheta = (startTheta + endTheta) / 2;
        const lx = cx + (planetRadiusPx + 20) * Math.cos(midTheta);
        const ly = cy + (planetRadiusPx + 20) * Math.sin(midTheta);

        ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(cont.name, lx, ly);
      });

      // 4. Marcador da Plataforma Alpha de Lançamento
      const launchTheta = -Math.PI / 2;
      const launchPxX = cx + planetRadiusPx * Math.cos(launchTheta);
      const launchPxY = cy + planetRadiusPx * Math.sin(launchTheta);
      ctx.beginPath();
      ctx.arc(launchPxX, launchPxY, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#06b6d4';
      ctx.fill();
      ctx.font = '9px monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('🚀 PLATAFORMA ALPHA (0 km)', launchPxX, launchPxY - 8);

      // 4.5. Marcador da Bateria de Defesa da República Territorial
      const batTheta = -Math.PI / 2 + interceptorState.battery.x / R;
      const batX = cx + planetRadiusPx * Math.cos(batTheta);
      const batY = cy + planetRadiusPx * Math.sin(batTheta);
      ctx.beginPath();
      ctx.arc(batX, batY, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981';
      ctx.fill();
      ctx.font = '9px monospace';
      ctx.fillStyle = '#10b981';
      ctx.fillText('BATERIA REPÚBLICA TERRITORIAL', batX, batY - 8);

      // 5. Marcador do Alvo
      const targetRangeM = projectile.targetRangeKm * 1000;
      const targetTheta = -Math.PI / 2 + targetRangeM / R;
      const targetX = cx + planetRadiusPx * Math.cos(targetTheta);
      const targetY = cy + planetRadiusPx * Math.sin(targetTheta);

      ctx.beginPath();
      ctx.arc(targetX, targetY, 6, 0, Math.PI * 2);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = 'rgba(245, 158, 11, 0.3)';
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`ALVO (${projectile.targetRangeKm} km)`, targetX, targetY - 10);

      // 6. Trajetória Real Percorrida
      if (telemetryHistory.length > 1) {
        ctx.beginPath();
        telemetryHistory.forEach((pt, idx) => {
          const theta = -Math.PI / 2 + pt.x / R;
          const rPx = (R + pt.y) * scale;
          const px = cx + rPx * Math.cos(theta);
          const py = cy + rPx * Math.sin(theta);
          if (idx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      // 7. Trajetória do Interceptor no Globo Orbital
      if (interceptorState.history.length > 1) {
        ctx.beginPath();
        interceptorState.history.forEach((pt, idx) => {
          const theta = -Math.PI / 2 + pt.x / R;
          const rPx = (R + pt.y) * scale;
          const px = cx + rPx * Math.cos(theta);
          const py = cy + rPx * Math.sin(theta);
          if (idx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      // 8. Projétil Atual
      if (currentTelemetry && currentTelemetry.phase !== 'destruido') {
        const theta = -Math.PI / 2 + currentTelemetry.x / R;
        const rPx = (R + currentTelemetry.y) * scale;
        const px = cx + rPx * Math.cos(theta);
        const py = cy + rPx * Math.sin(theta);

        if (autoFollow) {
          const desiredPanX = width / 2 - (px - pan.x);
          const desiredPanY = height / 2 - (py - pan.y);
          setPan((prev) => ({
            x: prev.x + (desiredPanX - prev.x) * 0.1,
            y: prev.y + (desiredPanY - prev.y) * 0.1,
          }));
        }

        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // =======================================================
    // MODO 2: PERFIL DE ALTITUDE VS ALCANCE (2D CROSS-SECTION)
    // =======================================================
    else if (viewMode === 'profile') {
      const padding = { left: 70, right: 40, top: 40, bottom: 60 };
      const plotWidth = width - padding.left - padding.right;
      const plotHeight = height - padding.top - padding.bottom;

      const xToPx = (xM: number) => padding.left + (xM / maxRange) * plotWidth * zoom + pan.x;
      const yToPx = (yM: number) => padding.top + plotHeight - (yM / maxAlt) * plotHeight * zoom + pan.y;

      // 1. Camadas Atmosféricas
      if (showAtmosphereLayers) {
        const layers = [
          { name: 'Troposfera (0-11 km)', min: 0, max: 11000, color: 'rgba(6, 182, 212, 0.12)' },
          { name: 'Estratosfera (11-47 km)', min: 11000, max: 47000, color: 'rgba(59, 130, 246, 0.08)' },
          { name: 'Mesosfera (47-85 km)', min: 47000, max: 85000, color: 'rgba(139, 92, 246, 0.06)' },
          { name: 'Termosfera (100 km+)', min: 85000, max: 120000, color: 'rgba(2, 6, 23, 0.4)' },
        ];

        layers.forEach((l) => {
          const y1 = yToPx(l.max);
          const y0 = yToPx(l.min);
          const h = y0 - y1;
          if (y0 > padding.top && y1 < padding.top + plotHeight) {
            ctx.fillStyle = l.color;
            ctx.fillRect(padding.left, Math.max(padding.top, y1), plotWidth, Math.min(plotHeight, h));

            ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
            ctx.font = '10px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(l.name, width - padding.right - 10, y1 + 14);
          }
        });
      }

      // 2. Grade e Eixos
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
      ctx.lineWidth = 1;

      const altStep = maxAlt > 200000 ? 50000 : maxAlt > 80000 ? 20000 : 5000;
      for (let a = 0; a <= maxAlt; a += altStep) {
        const y = yToPx(a);
        if (y >= padding.top && y <= padding.top + plotHeight) {
          ctx.beginPath();
          ctx.moveTo(padding.left, y);
          ctx.lineTo(padding.left + plotWidth, y);
          ctx.stroke();

          ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
          ctx.font = '10px monospace';
          ctx.textAlign = 'right';
          ctx.fillText(`${(a / 1000).toFixed(0)} km`, padding.left - 8, y + 3);
        }
      }

      const rangeStep = maxRange > 1000000 ? 200000 : maxRange > 200000 ? 50000 : 10000;
      for (let r = 0; r <= maxRange; r += rangeStep) {
        const x = xToPx(r);
        if (x >= padding.left && x <= padding.left + plotWidth) {
          ctx.beginPath();
          ctx.moveTo(x, padding.top);
          ctx.lineTo(x, padding.top + plotHeight);
          ctx.stroke();

          ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${(r / 1000).toFixed(0)} km`, x, padding.top + plotHeight + 18);
        }
      }

      // 3. Relevo Montanhoso no Horizonte do Solo (Perfil Topográfico)
      const groundY = yToPx(0);
      currentTerrain.mountains.forEach((mtn) => {
        const mX = xToPx(mtn.xKm * 1000);
        const mPeakY = yToPx(mtn.peakElevationM);
        const mBaseWidth = (mtn.baseRadiusKm * 1000 / maxRange) * plotWidth * zoom;

        ctx.beginPath();
        ctx.moveTo(mX - mBaseWidth, groundY);
        ctx.lineTo(mX, mPeakY);
        ctx.lineTo(mX + mBaseWidth, groundY);
        ctx.closePath();
        ctx.fillStyle = 'rgba(51, 65, 85, 0.5)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(71, 85, 105, 0.6)';
        ctx.stroke();
      });

      // Linha do solo
      ctx.beginPath();
      ctx.moveTo(padding.left, groundY);
      ctx.lineTo(padding.left + plotWidth, groundY);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Plataforma de Lançamento Alpha no solo em x=0
      const launchPadPx = xToPx(0);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(launchPadPx - 10, groundY - 4, 20, 4);
      // Torre de lançamento
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(launchPadPx - 6, groundY - 4);
      ctx.lineTo(launchPadPx - 6, groundY - 26);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(launchPadPx - 8, groundY - 26, 4, 22);
      ctx.font = '10px monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.fillText('PLATAFORMA ALPHA', launchPadPx, groundY - 30);

      // Bateria de Defesa da República Territorial no solo
      const batPx = xToPx(interceptorState.battery.x);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(batPx - 10, groundY - 4, 20, 4);
      ctx.beginPath();
      ctx.arc(batPx, groundY - 4, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('BATERIA REPÚBLICA', batPx, groundY - 14);

      // Trajetória do Míssil
      if (telemetryHistory.length > 1) {
        ctx.beginPath();
        telemetryHistory.forEach((pt, idx) => {
          const px = xToPx(pt.x);
          const py = yToPx(pt.y);
          if (idx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      // Trajetória do Interceptor
      if (interceptorState.history.length > 1) {
        ctx.beginPath();
        interceptorState.history.forEach((pt, idx) => {
          const px = xToPx(pt.x);
          const py = yToPx(pt.y);
          if (idx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      // Projétil Ativo e Vetores Físicos
      if (currentTelemetry && currentTelemetry.phase !== 'destruido') {
        const curX = xToPx(currentTelemetry.x);
        const curY = yToPx(currentTelemetry.y);

        if (showVectors) {
          const vectorScale = 0.0004;
          // Empuxo
          if (currentTelemetry.thrustForce > 0) {
            const pitchRad = (currentTelemetry.pitchAngleDeg * Math.PI) / 180;
            const tLen = Math.min(60, currentTelemetry.thrustForce * vectorScale);
            ctx.beginPath();
            ctx.moveTo(curX, curY);
            ctx.lineTo(curX + tLen * Math.cos(pitchRad), curY - tLen * Math.sin(pitchRad));
            ctx.strokeStyle = '#f97316';
            ctx.lineWidth = 3;
            ctx.stroke();
          }
          // Arrasto
          if (currentTelemetry.dragForce > 10) {
            const dLen = Math.min(50, currentTelemetry.dragForce * vectorScale);
            const pitchRad = Math.atan2(currentTelemetry.vy, currentTelemetry.vx);
            ctx.beginPath();
            ctx.moveTo(curX, curY);
            ctx.lineTo(curX - dLen * Math.cos(pitchRad), curY + dLen * Math.sin(pitchRad));
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }

        ctx.beginPath();
        ctx.arc(curX, curY, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // ==========================================
    // MODO 3: VISÃO SUPERIOR DE RADAR (TOP-DOWN)
    // ==========================================
    else if (viewMode === 'radar') {
      const centerX = width / 2 + pan.x;
      const centerY = height / 2 + pan.y;
      const radarRadius = Math.min(width, height) * 0.42 * zoom;

      // Anéis de Radar
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
      ctx.lineWidth = 1;
      for (let r = 0.25; r <= 1.0; r += 0.25) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radarRadius * r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Eixos do Radar
      ctx.beginPath();
      ctx.moveTo(centerX - radarRadius, centerY);
      ctx.lineTo(centerX + radarRadius, centerY);
      ctx.moveTo(centerX, centerY - radarRadius);
      ctx.lineTo(centerX, centerY + radarRadius);
      ctx.stroke();

      const scaleRadar = radarRadius / maxRange;

      // Montanhas e Cidades no Radar
      currentTerrain.mountains.forEach((mtn) => {
        const mx = centerX + (mtn.xKm * 1000 - maxRange / 2) * scaleRadar;
        const my = centerY + (mtn.zKm * 1000) * scaleRadar;
        ctx.fillStyle = 'rgba(71, 85, 105, 0.7)';
        ctx.beginPath();
        ctx.arc(mx, my, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      currentTerrain.settlements.forEach((s) => {
        const sx = centerX + (s.centerXKm * 1000 - maxRange / 2) * scaleRadar;
        const sy = centerY + (s.centerZKm * 1000) * scaleRadar;
        ctx.fillStyle = 'rgba(251, 191, 36, 0.8)';
        ctx.beginPath();
        ctx.arc(sx, sy, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Trajetória do Míssil no Radar
      if (telemetryHistory.length > 1) {
        ctx.beginPath();
        telemetryHistory.forEach((pt, idx) => {
          const rx = centerX + (pt.x - maxRange / 2) * scaleRadar;
          const ry = centerY + pt.lateralDeviation * scaleRadar;
          if (idx === 0) ctx.moveTo(rx, ry);
          else ctx.lineTo(rx, ry);
        });
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Trajetória do Interceptor no Radar
      if (interceptorState.history.length > 1) {
        ctx.beginPath();
        interceptorState.history.forEach((pt, idx) => {
          const rx = centerX + (pt.x - maxRange / 2) * scaleRadar;
          const ry = centerY + pt.z * scaleRadar;
          if (idx === 0) ctx.moveTo(rx, ry);
          else ctx.lineTo(rx, ry);
        });
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Plataforma Alpha no Radar
      const launchRx = centerX + (0 - maxRange / 2) * scaleRadar;
      const launchRy = centerY + 0;
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(launchRx, launchRy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('PLATAFORMA ALPHA', launchRx, launchRy - 8);

      // Bateria da República Territorial no Radar
      const batRx = centerX + (interceptorState.battery.x - maxRange / 2) * scaleRadar;
      const batRy = centerY + interceptorState.battery.z * scaleRadar;
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(batRx, batRy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('BATERIA REPÚBLICA', batRx, batRy - 8);

      // Ponto Atual do Míssil
      if (currentTelemetry && currentTelemetry.phase !== 'destruido') {
        const px = centerX + (currentTelemetry.x - maxRange / 2) * scaleRadar;
        const py = centerY + currentTelemetry.lateralDeviation * scaleRadar;
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#06b6d4';
        ctx.fill();
      }
    }

    ctx.restore();
  }, [
    currentTelemetry,
    telemetryHistory,
    fullTrajectory,
    environment,
    projectile,
    viewMode,
    showVectors,
    showAtmosphereLayers,
    zoom,
    pan,
    autoFollow,
    interceptorState,
    satelliteDefenseState,
    currentTerrain,
  ]);

  return (
    <div ref={containerRef} className="relative w-full h-[470px] md:h-[560px] rounded-xl overflow-hidden border border-[#27272a] bg-[#0a0a0c] shadow-2xl">
      {/* Canvas Element */}
      <canvas
        ref={canvasRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />

      <CanvasUIControls
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        showVectors={showVectors}
        onToggleVectors={onToggleVectors}
        showAtmosphereLayers={showAtmosphereLayers}
        onToggleAtmosphere={onToggleAtmosphere}
        autoFollow={autoFollow}
        onToggleAutoFollow={onToggleAutoFollow}
        interceptorState={interceptorState}
        satelliteDefenseState={satelliteDefenseState}
        onToggleAutoEngage={onToggleAutoEngage}
        onManualLaunchInterceptor={onManualLaunchInterceptor}
        onTriggerKineticStrike={onTriggerKineticStrike}
        setZoom={setZoom}
        handleResetCamera={handleResetCamera}
      />

      <CanvasLegend 
        viewMode={viewMode}
        interceptorState={interceptorState}
        zoom={zoom}
      />
    </div>
  );
};
