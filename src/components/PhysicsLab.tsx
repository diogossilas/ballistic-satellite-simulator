/**
 * Laboratório de Física Teórica e Validador Científico de Leis Físicas
 * Equações de Newton, Runge-Kutta 4, Arrasto de Rayleigh, Tsiolkovsky, Coriolis e Testes Unitários Automáticos.
 */

import React, { useState } from 'react';
import { runPhysicalLawUnitTests, UnitTestResult } from '../physics/unitTests';
import { 
  Atom, 
  CheckCircle, 
  XCircle, 
  BookOpen, 
  Play, 
  RefreshCw, 
  Calculator, 
  ChevronRight, 
  Layers, 
  Flame, 
  Orbit 
} from 'lucide-react';

export const PhysicsLab: React.FC = () => {
  const [testResults, setTestResults] = useState<UnitTestResult[]>(() => runPhysicalLawUnitTests());
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);
  const [activeFormulaTab, setActiveFormulaTab] = useState<string>('rk4');

  const handleRerunTests = () => {
    setIsRunningTests(true);
    setTimeout(() => {
      setTestResults(runPhysicalLawUnitTests());
      setIsRunningTests(false);
    }, 150);
  };

  const allPassed = testResults.every((t) => t.passed);

  return (
    <div className="space-y-5 p-4 bg-[#121215] border border-[#27272a] rounded-xl shadow-xl">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#27272a] pb-3">
        <div className="flex items-center gap-2">
          <Atom className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-zinc-100">LABORATÓRIO_DE_FÍSICA_&_VALIDAÇÃO</h3>
            <p className="text-xs font-mono text-zinc-400">Equações diferenciais, mecânica analítica e suíte de testes de precisão</p>
          </div>
        </div>

        <button
          id="btn-run-physics-tests"
          onClick={handleRerunTests}
          disabled={isRunningTests}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0a0a0c] hover:bg-[#18181c] disabled:opacity-50 text-amber-300 border border-amber-500/30 text-xs font-mono font-semibold rounded shadow transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRunningTests ? 'animate-spin' : ''}`} />
          <span>Executar Bateria de Testes Unitários</span>
        </button>
      </div>

      {/* Seção 1: Suíte de Testes Unitários das Leis Físicas */}
      <div className="p-4 bg-[#0a0a0c] border border-[#27272a] rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
            <span>Validação de Fórmulas por Testes Unitários</span>
            {allPassed ? (
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-mono">
                5/5 Testes Aprovados (100% Determinístico)
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-[10px] font-mono">
                Avisos Detectados
              </span>
            )}
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {testResults.map((test) => (
            <div
              key={test.id}
              className="p-3 bg-[#121215] border border-[#27272a] rounded flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-xs font-mono font-bold text-zinc-200">{test.name}</span>
                  {test.passed ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                </div>

                <div className="font-mono text-[11px] text-amber-400 bg-[#0a0a0c] px-2 py-1 rounded border border-[#27272a] mb-2">
                  {test.theoreticalFormula}
                </div>

                <div className="text-[11px] font-mono text-zinc-300 space-y-0.5 mb-2">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Esperado (Teórico):</span>
                    <span>{test.expectedValue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Calculado (RK4):</span>
                    <span className="text-amber-300">{test.calculatedValue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Erro Relativo:</span>
                    <span className="text-emerald-400">{test.relativeErrorPercent}%</span>
                  </div>
                </div>

                <p className="text-[11px] font-mono text-zinc-400 leading-snug">
                  {test.explanation}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Seção 2: Compêndio Teórico das Equações Fundamentais */}
      <div className="p-4 bg-[#0a0a0c] border border-[#27272a] rounded-xl space-y-3">
        <h4 className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-400" />
          <span>Formulário Matemático da Simulação</span>
        </h4>

        {/* Abas das Fórmulas */}
        <div className="flex flex-wrap gap-1.5 border-b border-[#27272a] pb-2.5 font-mono">
          {[
            { id: 'rk4', label: '1. Integração RK4' },
            { id: 'drag', label: '2. Arrasto Rayleigh & Mach' },
            { id: 'tsiolkovsky', label: '3. Foguetes (Tsiolkovsky)' },
            { id: 'gravity', label: '4. Gravitação Universal' },
            { id: 'coriolis', label: '5. Efeito Coriolis' },
            { id: 'thermo', label: '6. Reentrada & Aquecimento' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFormulaTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                activeFormulaTab === tab.id
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#18181c]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Conteúdo da Fórmula Selecionada */}
        <div className="p-4 bg-[#121215] border border-[#27272a] rounded-lg text-xs leading-relaxed text-zinc-300 space-y-2.5 font-mono">
          {activeFormulaTab === 'rk4' && (
            <div>
              <h5 className="font-bold text-sm text-amber-400 mb-1">Método Numérico de Runge-Kutta de 4ª Ordem (RK4)</h5>
              <div className="p-2.5 bg-[#0a0a0c] font-mono text-amber-300 rounded border border-[#27272a] my-2">
                k₁ = f(tₙ, yₙ)<br />
                k₂ = f(tₙ + Δt/2, yₙ + Δt/2 · k₁)<br />
                k₃ = f(tₙ + Δt/2, yₙ + Δt/2 · k₂)<br />
                k₄ = f(tₙ + Δt, yₙ + Δt · k₃)<br />
                yₙ₊₁ = yₙ + (Δt / 6) · (k₁ + 2k₂ + 2k₃ + k₄)
              </div>
              <p className="text-zinc-400">
                O método RK4 possui erro de truncamento local da ordem de O(Δt⁵) e erro global O(Δt⁴). É amplamente utilizado na indústria aeroespacial por garantir estabilidade numérica superior ao método de Euler ou Verlet em sistemas com forças dinâmicas acopladas (empuxo e arrasto transônico).
              </p>
            </div>
          )}

          {activeFormulaTab === 'drag' && (
            <div>
              <h5 className="font-bold text-sm text-amber-400 mb-1">Força de Arrasto Aerodinâmico Compressível</h5>
              <div className="p-2.5 bg-[#0a0a0c] font-mono text-amber-300 rounded border border-[#27272a] my-2">
                F_d = ½ · ρ(h) · v_rel² · C_d(Mach, ogiva) · A<br />
                q = ½ · ρ(h) · v² (Pressão Dinâmica)<br />
                v_rel = v - v_vento
              </div>
              <p className="text-zinc-400">
                O coeficiente de arrasto Cd não é constante: ele atinge um pico brusco em torno de Mach 1.0–1.2 devido à formação de ondas de choque transônicas (Wave Drag) e depois decai suavemente no regime hipersônico.
              </p>
            </div>
          )}

          {activeFormulaTab === 'tsiolkovsky' && (
            <div>
              <h5 className="font-bold text-sm text-amber-400 mb-1">Equação Fundamental do Foguete de Tsiolkovsky</h5>
              <div className="p-2.5 bg-[#0a0a0c] font-mono text-amber-300 rounded border border-[#27272a] my-2">
                Δv = I_sp · g₀ · ln(m₀ / m_f)<br />
                ṁ = T / (I_sp · g₀) (Taxa de Consumo de Massa)<br />
                Δv_total = Σ [ I_sp,i · g₀ · ln(m₀,i / m_f,i) ]
              </div>
              <p className="text-zinc-400">
                Demonstra que a velocidade final de um foguete depende logaritmicamente da razão de massa inicial sobre massa final. O uso de múltiplos estágios permite descartar a massa estrutural vazia (dry mass) a cada fase de queima, multiplicando a velocidade final do veículo.
              </p>
            </div>
          )}

          {activeFormulaTab === 'gravity' && (
            <div>
              <h5 className="font-bold text-sm text-amber-400 mb-1">Gravitação Universal Esférica e Curvatura</h5>
              <div className="p-2.5 bg-[#0a0a0c] font-mono text-amber-300 rounded border border-[#27272a] my-2">
                F_g = G · (M · m) / r² = m · g₀ · (R / (R + h))²<br />
                a_centrífuga = v_tangencial² / r
              </div>
              <p className="text-zinc-400">
                A aceleração gravitacional diminui com o quadrado da distância ao centro do planeta. Ao longo de alcances suborbitais de milhares de quilômetros, a curvatura planetária garante que o vetor vertical mude continuamente de direção local.
              </p>
            </div>
          )}

          {activeFormulaTab === 'coriolis' && (
            <div>
              <h5 className="font-bold text-sm text-amber-400 mb-1">Efeito Coriolis em Referencial Não-Inercial</h5>
              <div className="p-2.5 bg-[#0a0a0c] font-mono text-amber-300 rounded border border-[#27272a] my-2">
                a_coriolis = -2 · (ω × v)<br />
                onde ω é a velocidade angular de rotação planetária (rad/s)
              </div>
              <p className="text-zinc-400">
                Como a superfície planetária gira enquanto o projétil viaja pelo espaço inercial, observa-se uma deflexão lateral aparente que desvia o ponto de impacto em relação ao plano de lançamento inicial.
              </p>
            </div>
          )}

          {activeFormulaTab === 'thermo' && (
            <div>
              <h5 className="font-bold text-sm text-amber-400 mb-1">Aquecimento Cinético e Reentrada Hipersônica</h5>
              <div className="p-2.5 bg-[#0a0a0c] font-mono text-amber-300 rounded border border-[#27272a] my-2">
                q_dot ≈ k · √(ρ / R_ogiva) · v³ (Modelo de Sutton-Graves)<br />
                E_k = ½ · m · v² (Energia Cinética de Impacto)
              </div>
              <p className="text-zinc-400">
                Durante a reentrada nas camadas mais densas da atmosfera, a energia cinética do veículo é convertida em compressão de choque e calor extremo por estagnação do fluxo de ar, criando uma camada de plasma ionizado.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
