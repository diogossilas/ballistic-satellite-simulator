/**
 * Simulador Balístico Fictício - Orquestrador Principal da Aplicação
 * 
 * Arquitetura Modular & Separação de Responsabilidades (SoC):
 * - Domínio de Física (/src/physics): Integrador RK4, ISA, forças determinísticas, Monte Carlo
 * - Domínio de Simulação (/src/modules/simulation): Hook do motor em tempo real e hook de configuração
 * - Domínio de Telemetria (/src/modules/telemetry): Cálculos de energia, conversão e extração de máximos
 * - Domínio de Componentes (/src/components): Renderizadores de interface, HUD, gráficos e laboratório
 */

import React, { useState } from 'react';
import { Navbar, MainTab } from './components/Navbar';
import { OverviewSection } from './components/OverviewSection';
import { CanvasRenderer } from './components/CanvasRenderer';
import { TelemetryHUD } from './components/TelemetryHUD';
import { SimulationControls } from './components/SimulationControls';
import { ChartsPanel } from './components/ChartsPanel';
import { ProjectileBuilder } from './components/ProjectileBuilder';
import { EnvironmentConfig } from './components/EnvironmentConfig';
import { PresetScenarios } from './components/PresetScenarios';
import { PostFlightReport } from './components/PostFlightReport';
import { PhysicsLab } from './components/PhysicsLab';
import { DocumentationModal } from './components/DocumentationModal';

import { useSimulationConfig, useSimulationEngine, extractMaxTelemetry } from './modules';
import { PresetScenario } from './types/physics';

export default function App() {
  // 1. Módulo de Navegação e Diálogos
  const [activeTab, setActiveTab] = useState<MainTab>('simulador');
  const [isDocModalOpen, setIsDocModalOpen] = useState<boolean>(false);

  // 2. Módulo de Configuração (Veículo, Ambiente e Câmera)
  const {
    selectedPresetId,
    projectile,
    environment,
    viewMode,
    showVectors,
    showAtmosphereLayers,
    autoFollow,
    setProjectile,
    setEnvironment,
    setViewMode,
    setShowVectors,
    setShowAtmosphereLayers,
    setAutoFollow,
    applyPreset,
  } = useSimulationConfig(1);

  // 3. Módulo do Motor de Simulação em Tempo Real (RK4 Loop & State Machine)
  const {
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
    loadInitialStateForConfig,
    toggleInterceptorAutoEngage,
    manualLaunchInterceptor,
  } = useSimulationEngine({
    projectile,
    environment,
  });

  // Manipulador para carregar cenários pré-configurados
  const handleSelectPreset = (preset: PresetScenario) => {
    const { newProjectile, newEnvironment } = applyPreset(preset);
    setTimeout(() => {
      loadInitialStateForConfig(newProjectile, newEnvironment);
    }, 30);
  };

  // Manipulador para execução instantânea com redirecionamento ao relatório
  const handleRunInstantWithRedirect = () => {
    runInstant();
    setActiveTab('relatorio');
  };

  // Métricas máximas extraídas via módulo de telemetria
  const { maxAltitude, maxSpeed } = extractMaxTelemetry(telemetryHistory);

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-[#d1d1d1] flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200 tech-grid">
      {/* Barra de Navegação Superior e Banner Permanente de Segurança */}
      <Navbar
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onOpenDocModal={() => setIsDocModalOpen(true)}
        isSimulating={isRunning}
      />

      {/* Conteúdo Principal Dinâmico e Modular */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 lg:p-6 space-y-4">
        {/* Seção de Visão Geral e Diagrama Conceitual */}
        <OverviewSection
          onStartNewLaunch={() => {
            setActiveTab('simulador');
            resetSimulation();
            togglePlayPause();
          }}
          onOpenPresets={() => setActiveTab('cenarios')}
          onOpenPhysicsLab={() => setActiveTab('laboratorio')}
          onOpenCharts={() => setActiveTab('graficos')}
          onOpenDocModal={() => setIsDocModalOpen(true)}
        />

        {/* ========================================================= */}
        {/* MÓDULO 1: SIMULADOR PRINCIPAL (CANVAS, HUD E CONTROLES) */}
        {/* ========================================================= */}
        {activeTab === 'simulador' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            {/* HUD de Instrumentos de Telemetria */}
            <TelemetryHUD
              telemetry={currentTelemetry}
              maxAltitude={maxAltitude}
              maxSpeed={maxSpeed}
            />

            {/* Renderizador de Canvas 2D / 2.5D */}
            <CanvasRenderer
              currentTelemetry={currentTelemetry}
              telemetryHistory={telemetryHistory}
              fullTrajectory={fullTrajectory}
              environment={environment}
              projectile={projectile}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              showVectors={showVectors}
              onToggleVectors={() => setShowVectors((v) => !v)}
              showAtmosphereLayers={showAtmosphereLayers}
              onToggleAtmosphere={() => setShowAtmosphereLayers((a) => !a)}
              autoFollow={autoFollow}
              onToggleAutoFollow={() => setAutoFollow((f) => !f)}
              interceptorState={interceptorState}
              onToggleAutoEngage={toggleInterceptorAutoEngage}
              onManualLaunchInterceptor={manualLaunchInterceptor}
            />

            {/* Painel de Controles de Reprodução e Escala de Tempo */}
            <SimulationControls
              isRunning={isRunning}
              phase={currentState.phase}
              timeScale={timeScale}
              onTogglePlayPause={togglePlayPause}
              onStepForward={stepForward}
              onReset={resetSimulation}
              onChangeTimeScale={setTimeScale}
              onRunInstant={handleRunInstantWithRedirect}
              telemetryHistory={telemetryHistory}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* MÓDULO 2: CONSTRUTOR DE VEÍCULOS E ESTÁGIOS */}
        {/* ========================================================= */}
        {activeTab === 'construtor' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <ProjectileBuilder
              projectile={projectile}
              onChangeProjectile={setProjectile}
              disabled={isRunning}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setActiveTab('simulador');
                  resetSimulation();
                  togglePlayPause();
                }}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-mono font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg transition-all cursor-pointer"
              >
                Salvar & Lançar no Simulador
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MÓDULO 3: AMBIENTE PLANETÁRIO & ATMOSFERA */}
        {/* ========================================================= */}
        {activeTab === 'ambiente' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <EnvironmentConfig
              environment={environment}
              onChangeEnvironment={setEnvironment}
              disabled={isRunning}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setActiveTab('simulador');
                  resetSimulation();
                }}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-amber-500/30 font-mono font-bold text-xs uppercase tracking-wider rounded-lg shadow transition-all cursor-pointer"
              >
                Aplicar ao Simulador
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MÓDULO 4: CENÁRIOS PRONTOS DIDÁTICOS */}
        {/* ========================================================= */}
        {activeTab === 'cenarios' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <PresetScenarios
              selectedPresetId={selectedPresetId}
              onSelectPreset={(preset) => {
                handleSelectPreset(preset);
                setActiveTab('simulador');
              }}
              disabled={isRunning}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* MÓDULO 5: PAINEL DE GRÁFICOS DINÂMICOS */}
        {/* ========================================================= */}
        {activeTab === 'graficos' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <ChartsPanel telemetryHistory={telemetryHistory} />
            <SimulationControls
              isRunning={isRunning}
              phase={currentState.phase}
              timeScale={timeScale}
              onTogglePlayPause={togglePlayPause}
              onStepForward={stepForward}
              onReset={resetSimulation}
              onChangeTimeScale={setTimeScale}
              onRunInstant={handleRunInstantWithRedirect}
              telemetryHistory={telemetryHistory}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* MÓDULO 6: LABORATÓRIO DE FÍSICA & TESTES UNITÁRIOS */}
        {/* ========================================================= */}
        {activeTab === 'laboratorio' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <PhysicsLab />
          </div>
        )}

        {/* ========================================================= */}
        {/* MÓDULO 7: RELATÓRIO PÓS-IMPACTO */}
        {/* ========================================================= */}
        {activeTab === 'relatorio' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <PostFlightReport
              summary={summary}
              projectile={projectile}
              environment={environment}
            />
          </div>
        )}
      </main>

      {/* Modal de Documentação Técnica e Diretrizes */}
      <DocumentationModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
      />

      {/* Rodapé Científico */}
      <footer className="w-full border-t border-[#27272a] bg-[#050506] py-4 px-4 text-center text-zinc-500 text-xs">
        <p className="font-mono">
          Simulador Balístico Fictício • Ensino de Física Aeroespacial, Mecânica Clássica e Modelagem Numérica RK4
        </p>
        <p className="text-[11px] text-zinc-600 mt-1 font-mono">
          Cenários e entidades geográficas 100% fictícios. Uso estritamente acadêmico e de pesquisa.
        </p>
      </footer>
    </div>
  );
}
