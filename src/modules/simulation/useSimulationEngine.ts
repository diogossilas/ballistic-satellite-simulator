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
  setTimeScale: (scale: number) => void;
  togglePlayPause: () => void;
  stepForward: () => void;
  resetSimulation: () => void;
  runInstant: () => SimulationSummary;
  recalculatePlannedTrajectory: () => void;
  loadInitialStateForConfig: (proj: ProjectileConfig, env: PlanetaryEnvironment) => void;
  toggleInterceptorAutoEngage: () => void;
  manualLaunchInterceptor: () => void;
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

  // Refs de sincronização rápida para o loop de requestAnimationFrame
  const isRunningRef = useRef<boolean>(isRunning);
  const timeScaleRef = useRef<number>(timeScale);
  const currentStateRef = useRef<StateVector>(currentState);
  const interceptorStateRef = useRef<InterceptorState>(interceptorState);
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
    projectileRef.current = projectile;
  }, [projectile]);

  useEffect(() => {
    environmentRef.current = environment;
  }, [environment]);

  // Recalcula a trajetória completa planejada de referência
  const recalculatePlannedTrajectory = useCallback(() => {
    const { telemetryHistory: planned } = runFullSimulation(
      projectileRef.current,
      environmentRef.current,
      3600,
      0.2
    );
    setFullTrajectory(planned);
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
        vy: 300,
        vz: 0,
        speed: 300,
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
    if (currentStateRef.current.phase === 'impactado' || currentStateRef.current.phase === 'destruido') return;
    const dt = 0.1;
    const { nextState, telemetry } = stepRK4(
      currentStateRef.current,
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
      };
      setCurrentTelemetry(interceptedTel);
      setTelemetryHistory((prev) => [...prev, interceptedTel]);

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
  }, []);

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
    setSummary(completedSummary);
    return completedSummary;
  }, []);

  // Loop de Animação com sub-stepping de alta fidelidade
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const deltaRealSec = Math.min(0.1, (currentTime - lastTime) / 1000);
      lastTime = currentTime;

      if (
        isRunningRef.current &&
        currentStateRef.current.phase !== 'impactado' &&
        currentStateRef.current.phase !== 'destruido'
      ) {
        const dtStep = 0.05; // Passo de tempo base do integrador RK4
        const totalSimTimeThisFrame = deltaRealSec * timeScaleRef.current;
        const subSteps = Math.max(1, Math.min(20, Math.round(totalSimTimeThisFrame / dtStep)));
        const actualDt = totalSimTimeThisFrame / subSteps;

        let st = currentStateRef.current;
        let lastTel: TelemetryPoint | null = null;
        let curInterceptor = interceptorStateRef.current;
        const newPoints: TelemetryPoint[] = [];

        for (let i = 0; i < subSteps; i++) {
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

          // Caso de Intercepção Bem Sucedida (Hit-to-Kill)
          if (curInterceptor.status === 'intercepted') {
            st = {
              ...st,
              phase: 'destruido',
            };
            lastTel = {
              ...telemetry,
              phase: 'destruido',
            };
            isRunningRef.current = false;
            setIsRunning(false);

            try {
              confetti({
                particleCount: 70,
                spread: 90,
                origin: { y: 0.5 },
                colors: ['#10b981', '#06b6d4', '#f59e0b', '#ef4444'],
              });
            } catch {
              // fallback silencioso
            }
            break;
          }

          if (st.phase === 'impactado') {
            isRunningRef.current = false;
            setIsRunning(false);

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
            break;
          }
        }

        interceptorStateRef.current = curInterceptor;
        setInterceptorState(curInterceptor);

        currentStateRef.current = st;
        setCurrentState(st);
        if (lastTel) setCurrentTelemetry(lastTel);
        if (newPoints.length > 0) {
          setTelemetryHistory((prev) => [...prev, ...newPoints]);
        }

        if (st.phase === 'impactado' || st.phase === 'destruido') {
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
  }, []);

  return {
    isRunning,
    timeScale,
    currentState,
    currentTelemetry,
    telemetryHistory,
    fullTrajectory,
    summary,
    interceptorState,
    setTimeScale,
    togglePlayPause,
    stepForward,
    resetSimulation,
    runInstant,
    recalculatePlannedTrajectory,
    loadInitialStateForConfig,
    toggleInterceptorAutoEngage,
    manualLaunchInterceptor,
  };
}
