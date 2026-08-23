/**
 * Hook Especializado do Motor de Simulação em Tempo Real
 * Responsabilidade única:
 * - Ciclo de vida da simulação física (Play, Pause, Step, Reset, Instant Compute)
 * - Loop determinístico de requestAnimationFrame com sub-stepping de alta fidelidade
 * - Integração do míssil interceptor guiado (defesa aeroespacial)
 * - Armazenamento e buffering do histórico de telemetria
 * - Notificação de conclusão de impacto ou abate cinético (Hit-to-Kill)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  ProjectileConfig,
  PlanetaryEnvironment,
  TelemetryPoint,
  SimulationSummary,
  InterceptorState,
  InterceptorPoint,
  SatelliteDefenseSystemState,
} from '../../types/physics';
import {
  createInitialState,
  stepRK4,
  runFullSimulation,
  StateVector,
} from '../../physics/engine';
import {
  createDefaultInterceptorBattery,
  createInitialInterceptorState,
  stepInterceptor,
} from '../../physics/interceptor';
import {
  createInitialSatelliteDefenseState,
  stepSatelliteDefense,
  triggerKineticBombardment,
} from '../../physics/satelliteDefense';

export interface UseSimulationEngineOptions {
  projectile: ProjectileConfig;
  environment: PlanetaryEnvironment;
}

export interface UseSimulationEngineReturn {
  isRunning: boolean;
  timeScale: number;
  currentState: StateVector;
  currentTelemetry: TelemetryPoint | null;
  telemetryHistory: TelemetryPoint[];
  fullTrajectory: TelemetryPoint[];
  summary: SimulationSummary | null;
  interceptorState: InterceptorState;
  satelliteDefenseState: SatelliteDefenseSystemState;
  setTimeScale: (scale: number) => void;
  togglePlayPause: () => void;
  stepForward: () => void;
  resetSimulation: () => void;
  runInstant: () => SimulationSummary;
  recalculatePlannedTrajectory: () => void;
  loadInitialStateForConfig: (proj: ProjectileConfig, env: PlanetaryEnvironment) => void;
  toggleInterceptorAutoEngage: () => void;
  manualLaunchInterceptor: () => void;
  triggerManualKineticStrike: () => void;
}

export function useSimulationEngine({
  projectile,
  environment,
}: UseSimulationEngineOptions): UseSimulationEngineReturn {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [timeScale, setTimeScale] = useState<number>(5);
  const [currentState, setCurrentState] = useState<StateVector>(() => createInitialState(projectile));
  const [currentTelemetry, setCurrentTelemetry] = useState<TelemetryPoint | null>(null);
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPoint[]>([]);
  const [fullTrajectory, setFullTrajectory] = useState<TelemetryPoint[]>([]);
  const [summary, setSummary] = useState<SimulationSummary | null>(null);

  // Estado do Míssil de Intercepção
  const [interceptorState, setInterceptorState] = useState<InterceptorState>(() =>
    createInitialInterceptorState(createDefaultInterceptorBattery(projectile.targetRangeKm * 1000))
  );

  // Estado do Sistema de Satélites de Defesa e Varas de Deus
  const [satelliteDefenseState, setSatelliteDefenseState] = useState<SatelliteDefenseSystemState>(() =>
    createInitialSatelliteDefenseState(projectile.targetRangeKm * 1000)
  );

  // Refs de sincronização rápida para o loop de requestAnimationFrame
  const isRunningRef = useRef<boolean>(isRunning);
  const timeScaleRef = useRef<number>(timeScale);
  const currentStateRef = useRef<StateVector>(currentState);
  const interceptorStateRef = useRef<InterceptorState>(interceptorState);
  const satelliteDefenseStateRef = useRef<SatelliteDefenseSystemState>(satelliteDefenseState);
  const projectileRef = useRef<ProjectileConfig>(projectile);
  const environmentRef = useRef<PlanetaryEnvironment>(environment);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    timeScaleRef.current = timeScale;
  }, [timeScale]);

  useEffect(() => {
    currentStateRef.current = currentState;
  }, [currentState]);

  useEffect(() => {
    interceptorStateRef.current = interceptorState;
  }, [interceptorState]);

  useEffect(() => {
    satelliteDefenseStateRef.current = satelliteDefenseState;
  }, [satelliteDefenseState]);

  useEffect(() => {
    projectileRef.current = projectile;
  }, [projectile]);

  useEffect(() => {
    environmentRef.current = environment;
  }, [environment]);

  // Recalcula a trajetória completa planejada de referência e inicializa na plataforma
  const recalculatePlannedTrajectory = useCallback(() => {
    const { telemetryHistory: planned } = runFullSimulation(
      projectileRef.current,
      environmentRef.current,
      3600,
      0.2
    );
    setFullTrajectory(planned);
    if (planned.length > 0 && (!currentStateRef.current || currentStateRef.current.time === 0 || currentStateRef.current.phase === 'pronto')) {
      setCurrentTelemetry(planned[0]);
      setTelemetryHistory([planned[0]]);
    }
  }, []);

  // Inicialização quando a configuração muda
  useEffect(() => {
    recalculatePlannedTrajectory();
  }, [projectile, environment, recalculatePlannedTrajectory]);

  // Reinicializa a simulação para a rampa de lançamento
  const resetSimulation = useCallback(() => {
    setIsRunning(false);
    const initial = createInitialState(projectileRef.current);
    setCurrentState(initial);
    currentStateRef.current = initial;

    const newBattery = createDefaultInterceptorBattery(projectileRef.current.targetRangeKm * 1000);
    const initInterceptor = createInitialInterceptorState(newBattery);
    setInterceptorState(initInterceptor);
    interceptorStateRef.current = initInterceptor;

    const initSatellites = createInitialSatelliteDefenseState(projectileRef.current.targetRangeKm * 1000);
    setSatelliteDefenseState(initSatellites);
    satelliteDefenseStateRef.current = initSatellites;

    const { telemetryHistory: initialRun } = runFullSimulation(
      projectileRef.current,
      environmentRef.current,
      0.1,
      0.1
    );

    const initPt = initialRun[0] || null;
    setCurrentTelemetry(initPt);
    setTelemetryHistory(initPt ? [initPt] : []);
    setSummary(null);
  }, []);

  // Carrega estado inicial para novo objeto de configuração (ex: após mudar preset)
  const loadInitialStateForConfig = useCallback((proj: ProjectileConfig, env: PlanetaryEnvironment) => {
    setIsRunning(false);
    const initial = createInitialState(proj);
    setCurrentState(initial);
    currentStateRef.current = initial;

    const newBattery = createDefaultInterceptorBattery(proj.targetRangeKm * 1000);
    const initInterceptor = createInitialInterceptorState(newBattery);
    setInterceptorState(initInterceptor);
    interceptorStateRef.current = initInterceptor;

    const initSatellites = createInitialSatelliteDefenseState(proj.targetRangeKm * 1000);
    setSatelliteDefenseState(initSatellites);
    satelliteDefenseStateRef.current = initSatellites;

    const { telemetryHistory: planned } = runFullSimulation(proj, env, 3600, 0.2);
    setFullTrajectory(planned);
    if (planned.length > 0) {
      setCurrentTelemetry(planned[0]);
      setTelemetryHistory([planned[0]]);
    }
    setSummary(null);
  }, []);

  // Alterna engajamento automático da bateria de defesa
  const toggleInterceptorAutoEngage = useCallback(() => {
    setInterceptorState((prev) => {
      const updated = {
        ...prev,
        battery: {
          ...prev.battery,
          autoEngage: !prev.battery.autoEngage,
        },
      };
      interceptorStateRef.current = updated;
      return updated;
    });
  }, []);

  // Disparo manual do míssil interceptor
  const manualLaunchInterceptor = useCallback(() => {
    setInterceptorState((prev) => {
      if (prev.status !== 'standby') return prev;
      const initialPoint: InterceptorPoint = {
        time: currentStateRef.current.time,
        x: prev.battery.x,
        y: 10,
        z: prev.battery.z,
        vx: 0,
        vy: 400,
        vz: 0,
        speed: 400,
        distanceToTarget: 100000,
      };
      const launched: InterceptorState = {
        ...prev,
        status: 'launched',
        launchTime: currentStateRef.current.time,
        currentPoint: initialPoint,
        history: [initialPoint],
      };
      interceptorStateRef.current = launched;
      return launched;
    });
  }, []);

  // Disparo manual de Retaliação das Varas de Deus (Project Thor)
  const triggerManualKineticStrike = useCallback(() => {
    setSatelliteDefenseState((prev) => {
      const triggered = triggerKineticBombardment(
        prev,
        currentStateRef.current.time,
        projectileRef.current.targetRangeKm
      );
      satelliteDefenseStateRef.current = triggered;
      return triggered;
    });
  }, []);

  // Alterna Play / Pause
  const togglePlayPause = useCallback(() => {
    if (currentStateRef.current.phase === 'impactado' || currentStateRef.current.phase === 'destruido') {
      resetSimulation();
      setIsRunning(true);
    } else {
      setIsRunning((prev) => !prev);
    }
  }, [resetSimulation]);

  // Avança 1 passo numérico discretizado
  const stepForward = useCallback(() => {
    const dt = 0.1;
    const st = currentStateRef.current;
    
    // Passo dos satélites e Varas de Deus
    let curSat = satelliteDefenseStateRef.current;
    curSat = stepSatelliteDefense(
      curSat,
      currentTelemetry,
      interceptorStateRef.current,
      environmentRef.current,
      dt,
      st.time,
      projectileRef.current.targetRangeKm
    );
    satelliteDefenseStateRef.current = curSat;
    setSatelliteDefenseState(curSat);

    if (st.phase !== 'impactado' && st.phase !== 'destruido') {
      const { nextState, telemetry } = stepRK4(
        st,
        projectileRef.current,
        environmentRef.current,
        dt
      );

      // Passo do interceptor
      const nextInterceptor = stepInterceptor(
        interceptorStateRef.current,
        telemetry,
        dt,
        nextState.time
      );
      interceptorStateRef.current = nextInterceptor;
      setInterceptorState(nextInterceptor);

      // DESTRUIÇÃO MÚTUA NO CÉU
      if (nextInterceptor.status === 'intercepted') {
        const interceptedState: StateVector = {
          ...nextState,
          phase: 'destruido',
        };
        setCurrentState(interceptedState);
        currentStateRef.current = interceptedState;
        const interceptedTel: TelemetryPoint = {
          ...telemetry,
          phase: 'destruido',
          midAirDestroyed: true,
        };
        setCurrentTelemetry(interceptedTel);
        setTelemetryHistory((prev) => [...prev, interceptedTel]);

        // Dispara retaliação cinética de todos os satélites Thor (Varas de Deus)
        const retaliatedSat = triggerKineticBombardment(
          curSat,
          nextState.time,
          projectileRef.current.targetRangeKm
        );
        satelliteDefenseStateRef.current = retaliatedSat;
        setSatelliteDefenseState(retaliatedSat);

        const { summary: finalSummary } = runFullSimulation(
          projectileRef.current,
          environmentRef.current,
          3600,
          0.1
        );
        setSummary(finalSummary);
        return;
      }

      setCurrentState(nextState);
      currentStateRef.current = nextState;
      setCurrentTelemetry(telemetry);
      setTelemetryHistory((prev) => [...prev, telemetry]);

      if (nextState.phase === 'impactado') {
        const { summary: completedSummary } = runFullSimulation(
          projectileRef.current,
          environmentRef.current,
          3600,
          0.1
        );
        setSummary(completedSummary);
      }
    }
  }, [currentTelemetry]);

  // Execução analítica instantânea
  const runInstant = useCallback((): SimulationSummary => {
    setIsRunning(false);
    const { telemetryHistory: fullRun, summary: completedSummary } = runFullSimulation(
      projectileRef.current,
      environmentRef.current,
      3600,
      0.1
    );
    setTelemetryHistory(fullRun);
    if (fullRun.length > 0) {
      setCurrentTelemetry(fullRun[fullRun.length - 1]);
    }
    setCurrentState((prev) => ({
      ...prev,
      time: completedSummary.totalFlightTime,
      x: completedSummary.totalRange,
      y: 0,
      phase: 'impactado',
    }));

    // Trigger kinetic rods in satellite state as well
    const retaliatedSat = triggerKineticBombardment(
      satelliteDefenseStateRef.current,
      completedSummary.totalFlightTime,
      projectileRef.current.targetRangeKm
    );
    satelliteDefenseStateRef.current = retaliatedSat;
    setSatelliteDefenseState(retaliatedSat);

    setSummary(completedSummary);
    return completedSummary;
  }, []);

  // Loop de Animação com sub-stepping de alta fidelidade
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const deltaRealSec = Math.min(0.1, (currentTime - lastTime) / 1000);
      lastTime = currentTime;

      const hasActiveRods = satelliteDefenseStateRef.current.rods.some((r) => r.status !== 'impacted');
      let isMissileActive = currentStateRef.current.phase !== 'impactado' && currentStateRef.current.phase !== 'destruido';

      if (isRunningRef.current && (isMissileActive || hasActiveRods)) {
        // Passo de tempo hiper-estável para RK4 (máximo 0.03s por sub-passo)
        const totalSimTimeThisFrame = deltaRealSec * timeScaleRef.current;
        const subSteps = Math.max(1, Math.min(60, Math.ceil(totalSimTimeThisFrame / 0.025)));
        const actualDt = Math.min(0.025, totalSimTimeThisFrame / subSteps);

        let st = currentStateRef.current;
        let lastTel: TelemetryPoint | null = null;
        let curInterceptor = interceptorStateRef.current;
        let curSatellites = satelliteDefenseStateRef.current;
        const newPoints: TelemetryPoint[] = [];

        for (let i = 0; i < subSteps; i++) {
          // Atualização física dos satélites e Varas de Deus
          curSatellites = stepSatelliteDefense(
            curSatellites,
            lastTel || currentTelemetry,
            curInterceptor,
            environmentRef.current,
            actualDt,
            st.time,
            projectileRef.current.targetRangeKm
          );

          if (isMissileActive) {
            const { nextState, telemetry } = stepRK4(
              st,
              projectileRef.current,
              environmentRef.current,
              actualDt
            );
            st = nextState;
            lastTel = telemetry;
            newPoints.push(telemetry);

            // Integração do interceptor
            curInterceptor = stepInterceptor(curInterceptor, telemetry, actualDt, st.time);

            // DESTRUIÇÃO MÚTUA NO CÉU (Ambos os mísseis se destroem em contato)
            if (curInterceptor.status === 'intercepted') {
              st = {
                ...st,
                phase: 'destruido',
              };
              lastTel = {
                ...telemetry,
                phase: 'destruido',
                midAirDestroyed: true,
              };

              isMissileActive = false;

              // Dispara retaliação cinética com "Varas de Deus" de todos os satélites Thor
              if (!curSatellites.retaliationTriggered) {
                curSatellites = triggerKineticBombardment(
                  curSatellites,
                  st.time,
                  projectileRef.current.targetRangeKm
                );
              }

              try {
                confetti({
                  particleCount: 70,
                  spread: 100,
                  origin: { y: 0.45 },
                  colors: ['#10b981', '#06b6d4', '#f59e0b', '#ef4444', '#f97316'],
                });
              } catch {
                // fallback silencioso
              }
            }

            if (st.phase === 'impactado') {
              isMissileActive = false;
              try {
                confetti({
                  particleCount: 40,
                  spread: 60,
                  origin: { y: 0.8 },
                  colors: ['#06b6d4', '#f59e0b', '#3b82f6'],
                });
              } catch {
                // fallback silencioso
              }
            }
          }
        }

        interceptorStateRef.current = curInterceptor;
        setInterceptorState(curInterceptor);

        satelliteDefenseStateRef.current = curSatellites;
        setSatelliteDefenseState(curSatellites);

        currentStateRef.current = st;
        setCurrentState(st);
        if (lastTel) setCurrentTelemetry(lastTel);
        if (newPoints.length > 0) {
          setTelemetryHistory((prev) => [...prev, ...newPoints]);
        }

        // Se o míssil terminou e todas as Varas de Deus já impactaram, finaliza a simulação
        const allRodsDone = curSatellites.rods.length > 0 && curSatellites.rods.every((r) => r.status === 'impacted');
        if (!isMissileActive && (!curSatellites.retaliationTriggered || allRodsDone)) {
          isRunningRef.current = false;
          setIsRunning(false);

          const { summary: finalSummary } = runFullSimulation(
            projectileRef.current,
            environmentRef.current,
            3600,
            0.1
          );
          setSummary(finalSummary);
        }
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [currentTelemetry]);

  return {
    isRunning,
    timeScale,
    currentState,
    currentTelemetry,
    telemetryHistory,
    fullTrajectory,
    summary,
    interceptorState,
    satelliteDefenseState,
    setTimeScale,
    togglePlayPause,
    stepForward,
    resetSimulation,
    runInstant,
    recalculatePlannedTrajectory,
    loadInitialStateForConfig,
    toggleInterceptorAutoEngage,
    manualLaunchInterceptor,
    triggerManualKineticStrike,
  };
}
