/**
 * Renderizador Gráfico de Alta Performance em HTML5 Canvas
 * Modos de visualização:
 * 1. 'orbital' - Visão Planetária Esférica com Continentes Fictícios e Arco Orbital
 * 2. 'profile' - Perfil de Trajetória Altitude vs Alcance com Camadas Atmosféricas e Vetores de Força
 * 3. 'radar'   - Visão Top-Down de Radar, Alvo e Dispersão Lateral
 * 4. 'view25d' - Visão 2.5D Tática com Mapa 2D no Solo, Fronteiras Territoriais, Elevação 3D e Míssil Interceptor
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  TelemetryPoint,
  ViewMode,
  PlanetaryEnvironment,
  ProjectileConfig,
  InterceptorState,
} from '../types/physics';
import {
  FICTIONAL_CONTINENTS,
  FICTIONAL_BORDERS,
  FICTIONAL_REGIONS,
  FICTIONAL_LOCATIONS,
} from '../data/fictionalGeography';
import {
  Globe,
  Layers,
  Crosshair,
  Box,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Eye,
  Activity,
  Wind,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Target,
} from 'lucide-react';

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
  onToggleAutoEngage: () => void;
  onManualLaunchInterceptor: () => void;
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
  onToggleAutoEngage,
  onManualLaunchInterceptor,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Estados de transformação gráfica (Pan & Zoom)
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

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

  // LOOP DE RENDERIZAÇÃO DO CANVAS
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
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    for (let i = 0; i < 45; i++) {
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
    // MODO 4 (NOVO): VISÃO 2.5D TÁTICA (MAPA 2D NO SOLO + ELEVAÇÃO + INTERCEPTOR)
    // =========================================================================
    if (viewMode === 'view25d') {
      const originX = width * 0.15 + pan.x;
      const groundY = height * 0.76 + pan.y;

      // Parâmetros de projeção isométrica / oblíqua 2.5D
      const isoAngle = Math.PI / 6.5; // ~27.7 graus
      const cosA = Math.cos(isoAngle);
      const sinA = Math.sin(isoAngle);
      const tilt = 0.48; // Fator de perspectiva do solo 2D

      const mapLengthM = maxRange;
      const mapHalfWidthM = Math.max(450000, maxRange * 0.25);

      const usableWidth = width * 0.72 * zoom;
      const groundScaleX = usableWidth / (mapLengthM * cosA + mapHalfWidthM * 2 * sinA);
      const altScaleY = (height * 0.58 * zoom) / Math.max(40000, maxAlt);

      // Função de projeção matemática 3D -> 2.5D tela
      const project3Dto25D = (xM: number, yM: number, zM: number) => {
        const xScreen = originX + (xM * cosA - zM * sinA) * groundScaleX;
        const yScreen = groundY + (xM * sinA + zM * cosA) * groundScaleX * tilt - yM * altScaleY;
        return { x: xScreen, y: yScreen };
      };

      const projectGroundTo25D = (xM: number, zM: number) => project3Dto25D(xM, 0, zM);

      // 1. GRADE TÁTICA DO PLANO 2D DO SOLO (GROUND MAP GRID)
      ctx.lineWidth = 1;
      const xGridStep = maxRange > 1000000 ? 250000 : maxRange > 300000 ? 100000 : 25000;
      const zGridStep = 100000;

      // Linhas transversais (Z)
      for (let z = -mapHalfWidthM; z <= mapHalfWidthM; z += zGridStep) {
        const pStart = projectGroundTo25D(0, z);
        const pEnd = projectGroundTo25D(mapLengthM, z);
        ctx.beginPath();
        ctx.moveTo(pStart.x, pStart.y);
        ctx.lineTo(pEnd.x, pEnd.y);
        ctx.strokeStyle = z === 0 ? 'rgba(6, 182, 212, 0.4)' : 'rgba(51, 65, 85, 0.25)';
        ctx.stroke();
      }

      // Linhas longitudinais (X - Alcance)
      for (let x = 0; x <= mapLengthM; x += xGridStep) {
        const pStart = projectGroundTo25D(x, -mapHalfWidthM);
        const pEnd = projectGroundTo25D(x, mapHalfWidthM);
        ctx.beginPath();
        ctx.moveTo(pStart.x, pStart.y);
        ctx.lineTo(pEnd.x, pEnd.y);
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.25)';
        ctx.stroke();

        // Rótulos de distância no bordo do mapa 2D
        const pLabel = projectGroundTo25D(x, mapHalfWidthM + 25000);
        ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${(x / 1000).toFixed(0)} km`, pLabel.x, pLabel.y);
      }

      // 2. REGIÕES TERRITORIAIS FICTÍCIAS NO PLANO 2D
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

          // Rótulo da Região/Facção
          const midX = reg.polygon.reduce((acc, p) => acc + p.xKm, 0) / reg.polygon.length;
          const midZ = reg.polygon.reduce((acc, p) => acc + p.zKm, 0) / reg.polygon.length;
          const pCenter = projectGroundTo25D(midX * 1000, midZ * 1000);
          ctx.fillStyle = 'rgba(203, 213, 225, 0.45)';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(reg.name.toUpperCase(), pCenter.x, pCenter.y);
        }
      });

      // 3. DESENHO DE FRONTEIRAS TERRITORIAIS FICTÍCIAS (2D MAP BORDERS)
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

          // Rótulo da Linha de Fronteira
          const midIdx = Math.floor(border.points.length / 2);
          const midPt = border.points[midIdx];
          const pLabel = projectGroundTo25D(midPt.xKm * 1000, midPt.zKm * 1000 - 15000);
          ctx.fillStyle = border.color;
          ctx.font = '9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(border.name, pLabel.x, pLabel.y);
        }
      });

      // 4. BASES E INSTALAÇÕES ESTRATÉGICAS NO PLANO 2D DO SOLO
      // A. Plataforma de Lançamento Alpha (Origem)
      const pLaunch = projectGroundTo25D(0, 0);
      ctx.beginPath();
      ctx.arc(pLaunch.x, pLaunch.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#06b6d4';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#06b6d4';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('PLATAFORMA ALPHA (0 km)', pLaunch.x - 10, pLaunch.y);

      // B. Bateria de Defesa Aeroespacial (SAM/ABM)
      const pBattery = projectGroundTo25D(interceptorState.battery.x, interceptorState.battery.z);
      
      // Anel de Cobertura do Radar de Defesa no Plano 2D
      const radarRadiusM = interceptorState.battery.radarRangeM;
      ctx.beginPath();
      for (let th = 0; th <= Math.PI * 2; th += Math.PI / 16) {
        const rx = interceptorState.battery.x + radarRadiusM * Math.cos(th);
        const rz = interceptorState.battery.z + radarRadiusM * Math.sin(th);
        const pRing = projectGroundTo25D(rx, rz);
        if (th === 0) ctx.moveTo(pRing.x, pRing.y);
        else ctx.lineTo(pRing.x, pRing.y);
      }
      ctx.closePath();
      ctx.strokeStyle = interceptorState.battery.autoEngage ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.3)';
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = interceptorState.battery.autoEngage ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.04)';
      ctx.fill();

      // Marcador da Bateria de Defesa
      ctx.beginPath();
      ctx.arc(pBattery.x, pBattery.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#10b981';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`BATERIA DEFESA ABM (${(interceptorState.battery.x / 1000).toFixed(0)} km)`, pBattery.x + 10, pBattery.y - 2);

      // C. Polígono Alvo Terminal Ômega
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
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`ALVO TERMINAL (${projectile.targetRangeKm} km)`, pTarget.x, pTarget.y + 16);

      // 5. SOMBRA DA TRAJETÓRIA NO PLANO 2D DO SOLO (GROUND TRACK)
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

      // 6. TRAJETÓRIA ELEVADA 2.5D NO ESPAÇO TRIDIMENSIONAL
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

        // Ponto de Apogeu em 2.5D
        const apogeePt = telemetryHistory.reduce((max, p) => (p.y > max.y ? p : max), telemetryHistory[0]);
        if (apogeePt && apogeePt.y > 2000) {
          const pApo3D = project3Dto25D(apogeePt.x, apogeePt.y, apogeePt.lateralDeviation);
          const pApoGround = projectGroundTo25D(apogeePt.x, apogeePt.lateralDeviation);

          // Linha de projeção vertical do apogeu
          ctx.beginPath();
          ctx.moveTo(pApoGround.x, pApoGround.y);
          ctx.lineTo(pApo3D.x, pApo3D.y);
          ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
          ctx.setLineDash([2, 2]);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = '#a855f7';
          ctx.beginPath();
          ctx.arc(pApo3D.x, pApo3D.y, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.font = '9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`APOGEU: ${(apogeePt.y / 1000).toFixed(1)} km`, pApo3D.x, pApo3D.y - 8);
        }
      }

      // 7. TRAJETÓRIA DO MÍSSIL DE INTERCEPÇÃO EM 2.5D
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

      // 8. RASTREAMENTO POR FEIXE DE RADAR (BATTERY -> MISSILE)
      if (
        currentTelemetry &&
        (interceptorState.status === 'launched' || interceptorState.status === 'tracking')
      ) {
        const pBat = projectGroundTo25D(interceptorState.battery.x, interceptorState.battery.z);
        const pTarget3D = project3Dto25D(currentTelemetry.x, currentTelemetry.y, currentTelemetry.lateralDeviation);

        ctx.beginPath();
        ctx.moveTo(pBat.x, pBat.y);
        ctx.lineTo(pTarget3D.x, pTarget3D.y);
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 9. MÍSSIL INTERCEPTOR ATIVO EM VOO
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
        ctx.arc(pInt3D.x, pInt3D.y, 6 + Math.random() * 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(16, 185, 129, 0.5)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(pInt3D.x, pInt3D.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#10b981';
        ctx.font = '9px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`INTERCEPTOR: ${(interceptorState.currentPoint.speed).toFixed(0)} m/s`, pInt3D.x + 8, pInt3D.y - 4);
      }

      // 10. EFEITO DE ABATE / DETONAÇÃO CINÉTICA "HIT-TO-KILL"
      if (interceptorState.status === 'intercepted' && interceptorState.targetInterceptPoint) {
        const pExplode = project3Dto25D(
          interceptorState.targetInterceptPoint.x,
          interceptorState.targetInterceptPoint.y,
          interceptorState.targetInterceptPoint.z
        );

        // Ondas de choque concêntricas
        for (let r = 1; r <= 3; r++) {
          ctx.beginPath();
          ctx.arc(pExplode.x, pExplode.y, r * 12, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(16, 185, 129, ${0.8 - r * 0.2})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(pExplode.x, pExplode.y, 14, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(245, 158, 11, 0.8)';
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ ABATE CONFIRMADO (HIT-TO-KILL)', pExplode.x, pExplode.y - 20);
      }

      // 11. MÍSSIL BALÍSTICO ATIVO EM 2.5D
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

        // Auto-follow suave de câmera
        if (autoFollow) {
          const desiredPanX = width / 2 - (pCur3D.x - pan.x);
          const desiredPanY = height / 2 - (pCur3D.y - pan.y);
          setPan((prev) => ({
            x: prev.x + (desiredPanX - prev.x) * 0.1,
            y: prev.y + (desiredPanY - prev.y) * 0.1,
          }));
        }

        // HASTE VERTICAL DE ALTITUDE (ALTITUDE STALK)
        ctx.beginPath();
        ctx.moveTo(pCurGround.x, pCurGround.y);
        ctx.lineTo(pCur3D.x, pCur3D.y);
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([2, 2]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Sombra / Disco no chão do mapa 2D
        ctx.beginPath();
        ctx.ellipse(pCurGround.x, pCurGround.y, 6, 3, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.fill();

        // Chama de Propulsão se motor aceso
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

        // HUD Flutuante com Altitude Real
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(
          `MÍSSIL: ${(currentTelemetry.speed).toFixed(0)} m/s | Alt: ${(currentTelemetry.y / 1000).toFixed(1)} km`,
          pCur3D.x + 10,
          pCur3D.y - 6
        );
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

      // 4. Marcador da Bateria de Defesa SAM/ABM
      const batTheta = -Math.PI / 2 + interceptorState.battery.x / R;
      const batX = cx + planetRadiusPx * Math.cos(batTheta);
      const batY = cy + planetRadiusPx * Math.sin(batTheta);
      ctx.beginPath();
      ctx.arc(batX, batY, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981';
      ctx.fill();
      ctx.font = '9px monospace';
      ctx.fillStyle = '#10b981';
      ctx.fillText('BATERIA ABM', batX, batY - 8);

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

      // Linha do solo
      const groundY = yToPx(0);
      ctx.beginPath();
      ctx.moveTo(padding.left, groundY);
      ctx.lineTo(padding.left + plotWidth, groundY);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Bateria de Defesa no solo
      const batPx = xToPx(interceptorState.battery.x);
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(batPx, groundY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('BATERIA ABM', batPx, groundY - 10);

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

    // =======================================================
    // MODO 3: VISÃO TOP-DOWN / RADAR DE DISPERSÃO E CORIOLIS
    // =======================================================
    else if (viewMode === 'radar') {
      const cx = width / 2 + pan.x;
      const cy = height / 2 + pan.y;
      const radarRadius = Math.min(width, height) * 0.42 * zoom;

      ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)';
      ctx.lineWidth = 1;
      for (let r = 1; r <= 4; r++) {
        ctx.beginPath();
        ctx.arc(cx, cy, (radarRadius / 4) * r, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.moveTo(cx - radarRadius, cy);
      ctx.lineTo(cx + radarRadius, cy);
      ctx.moveTo(cx, cy - radarRadius);
      ctx.lineTo(cx, cy + radarRadius);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
      ctx.stroke();

      const maxDist = Math.max(projectile.targetRangeKm * 1000, 100000);
      const toRadarX = (distM: number) => cx + (distM / maxDist) * radarRadius;
      const toRadarY = (devM: number) => cy - (devM / maxDist) * radarRadius * 20;

      // Bateria no radar
      const batRx = toRadarX(interceptorState.battery.x);
      const batRy = toRadarY(interceptorState.battery.z);
      ctx.beginPath();
      ctx.arc(batRx, batRy, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981';
      ctx.fill();
      ctx.fillText('BATERIA ABM', batRx, batRy - 8);

      if (telemetryHistory.length > 1) {
        ctx.beginPath();
        telemetryHistory.forEach((pt, idx) => {
          const px = toRadarX(pt.x);
          const py = toRadarY(pt.lateralDeviation);
          if (idx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2.5;
        ctx.stroke();
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

      {/* Barra de Seleção de Modos de Visualização (Topo Esquerdo) */}
      <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 p-1 bg-[#121215]/95 backdrop-blur border border-[#27272a] rounded-lg shadow-lg">
        <button
          id="btn-view-25d"
          onClick={() => onViewModeChange('view25d')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-medium rounded transition-colors ${
            viewMode === 'view25d'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#18181c]'
          }`}
          title="Visão 2.5D Tática com Mapa 2D no Solo, Fronteiras Territoriais e Míssil Interceptor"
        >
          <Box className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-bold">Visão 2.5D Tática</span>
        </button>

        <button
          id="btn-view-orbital"
          onClick={() => onViewModeChange('orbital')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-medium rounded transition-colors ${
            viewMode === 'orbital'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#18181c]'
          }`}
          title="Visão Esférica Global com Continentes Fictícios"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Esfera Planetária</span>
        </button>

        <button
          id="btn-view-profile"
          onClick={() => onViewModeChange('profile')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-medium rounded transition-colors ${
            viewMode === 'profile'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#18181c]'
          }`}
          title="Corte Transversal Altitude vs Alcance com Camadas Atmosféricas"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Perfil Alt vs Alcance</span>
        </button>

        <button
          id="btn-view-radar"
          onClick={() => onViewModeChange('radar')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-medium rounded transition-colors ${
            viewMode === 'radar'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#18181c]'
          }`}
          title="Visão Superior Top-Down com Desvio Lateral de Vento e Coriolis"
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span>Radar & Dispersão</span>
        </button>
      </div>

      {/* Controles de Defesa Antimíssil e Câmera (Topo Direito) */}
      <div className="absolute top-3 right-3 flex flex-wrap items-center gap-1.5 p-1 bg-[#121215]/95 backdrop-blur border border-[#27272a] rounded-lg shadow-lg">
        {/* Disparo / Engajamento do Interceptor */}
        <button
          id="btn-toggle-auto-engage"
          onClick={onToggleAutoEngage}
          className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono rounded transition-colors ${
            interceptorState.battery.autoEngage
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700'
          }`}
          title="Alternar Modo de Engajamento Automático da Bateria Antimíssil"
        >
          {interceptorState.battery.autoEngage ? (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Shield className="w-3.5 h-3.5 text-zinc-400" />
          )}
          <span className="hidden sm:inline">
            {interceptorState.battery.autoEngage ? 'Auto-Defesa Ativa' : 'Defesa Manual'}
          </span>
        </button>

        {interceptorState.status === 'standby' && (
          <button
            id="btn-manual-launch-interceptor"
            onClick={onManualLaunchInterceptor}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black font-mono font-bold text-xs rounded transition-colors shadow"
            title="Disparar Míssil Interceptor Imediatamente"
          >
            <Target className="w-3.5 h-3.5 fill-current" />
            <span>Disparar ABM</span>
          </button>
        )}

        <div className="w-[1px] h-4 bg-[#27272a] mx-0.5" />

        {viewMode === 'profile' && (
          <button
            id="btn-toggle-vectors"
            onClick={onToggleVectors}
            className={`p-1.5 rounded transition-colors ${
              showVectors
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#18181c]'
            }`}
            title="Exibir Decomposição dos Vetores de Força"
          >
            <Activity className="w-4 h-4" />
          </button>
        )}

        <button
          id="btn-toggle-atmosphere"
          onClick={onToggleAtmosphere}
          className={`p-1.5 rounded transition-colors ${
            showAtmosphereLayers
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#18181c]'
          }`}
          title="Exibir Camadas Atmosféricas e Linha de Kármán"
        >
          <Wind className="w-4 h-4" />
        </button>

        <button
          id="btn-toggle-follow"
          onClick={onToggleAutoFollow}
          className={`p-1.5 rounded transition-colors ${
            autoFollow
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#18181c]'
          }`}
          title="Acompanhamento Automático de Câmera no Míssil"
        >
          <Eye className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-[#27272a] mx-0.5" />

        <button
          id="btn-zoom-in"
          onClick={() => setZoom((z) => Math.min(15, z * 1.25))}
          className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-[#18181c] rounded transition-colors"
          title="Aproximar Zoom"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          id="btn-zoom-out"
          onClick={() => setZoom((z) => Math.max(0.2, z * 0.8))}
          className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-[#18181c] rounded transition-colors"
          title="Afastar Zoom"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          id="btn-reset-camera"
          onClick={handleResetCamera}
          className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-[#18181c] rounded transition-colors"
          title="Redefinir Câmera e Enquadramento"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Legenda Científica Inferior com Fronteiras e Interceptor */}
      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#050506]/95 backdrop-blur border border-[#27272a] rounded-lg text-[11px] text-zinc-400 pointer-events-none">
        <div className="flex flex-wrap items-center gap-3 font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <strong className="text-zinc-200">Míssil Balístico</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <strong className="text-zinc-200">Míssil Interceptor</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <strong className="text-zinc-200">Alvo Terminal</strong>
          </span>
          {viewMode === 'view25d' && (
            <span className="hidden md:flex items-center gap-2 text-zinc-400">
              <span className="text-cyan-300">Fronteira Alpha</span>
              <span className="text-purple-300">DMZ Marítima</span>
              <span className="text-amber-300">Fronteira Ômega</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 font-mono text-zinc-400">
          {interceptorState.status === 'intercepted' ? (
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Abate Concluído
            </span>
          ) : interceptorState.status === 'tracking' ? (
            <span className="text-emerald-300 font-bold animate-pulse flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              Interceptor em Voo
            </span>
          ) : null}
          <span className="text-amber-400">Zoom: {(zoom * 100).toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
};
