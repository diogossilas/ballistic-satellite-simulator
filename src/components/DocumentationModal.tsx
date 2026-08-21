/**
 * Modal de Documentação Técnica Detalhada (README) e Diretrizes Éticas
 * Explica as equações diferenciais determinísticas, coordenadas planetárias e compromisso educacional.
 */

import React from 'react';
import { X, BookOpen, ShieldCheck, Atom, FileText, CheckCircle2, Code2, Layers } from 'lucide-react';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentationModal: React.FC<DocumentationModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto font-mono">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#121215] border border-[#27272a] rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto">
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272a] bg-[#0a0a0c]">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-mono font-bold uppercase tracking-wider text-zinc-100">DOCUMENTAÇÃO_TÉCNICA_&_MANUAL_CIENTÍFICO</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-[#18181c] rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="px-6 py-5 overflow-y-auto space-y-6 text-xs text-zinc-300 leading-relaxed font-mono">
          {/* Seção 1: Diretrizes Éticas e Educacionais */}
          <div className="p-4 bg-[#18181c] border border-amber-500/30 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>Diretrizes Éticas e Finalidade Exclusivamente Educacional</span>
            </div>
            <p className="text-zinc-300">
              O <strong className="text-amber-400">Simulador Balístico Fictício</strong> foi concebido exclusivamente para fins de pesquisa acadêmica, ensino de mecânica clássica, física orbital, cálculo numérico e aerodinâmica de corpos em movimento. Todos os continentes (Continente Alpha, Continente Ômega, Arquipélago Neutro), polígonos de testes e veículos são entidades 100% fictícias. O aplicativo não ensina nem encoraja a fabricação, modificação, operação ou mira de armamentos reais contra alvos reais.
            </p>
          </div>

          {/* Seção 2: Formulação Matemática do Motor Físico */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <Atom className="w-4 h-4 text-amber-400" />
              <span>1. Formulação Matemática & Motor de Integração RK4</span>
            </h3>
            <p className="text-zinc-400">
              A trajetória do veículo aeroespacial é regida pelo sistema de equações diferenciais ordinárias acopladas de segunda ordem:
            </p>
            <div className="p-3 bg-[#0a0a0c] font-mono text-amber-300 rounded-lg border border-[#27272a] space-y-1">
              <div>d²r/dt² = (T_r + F_drag,r)/m - g(r) + v_θ²/r + a_coriolis,r</div>
              <div>d²θ/dt² = (T_θ + F_drag,θ)/(m · r) - (2 · vr · vθ)/r + a_coriolis,θ</div>
              <div>dm/dt = -ṁ = - T / (I_sp · g₀)</div>
            </div>
            <p className="text-zinc-400">
              Onde:
            </p>
            <ul className="list-disc list-inside space-y-1 text-zinc-400 pl-2">
              <li><strong className="text-zinc-200">T:</strong> Vetor empuxo do motor de foguete alinhado ao ângulo de atitude (pitch program).</li>
              <li><strong className="text-zinc-200">F_drag = ½ · ρ(h) · v_rel² · Cd(Mach) · A:</strong> Força de arrasto aerodinâmico de Rayleigh orientada em oposição ao vetor de velocidade relativa com o vento.</li>
              <li><strong className="text-zinc-200">g(r) = g₀ · (R / r)²:</strong> Campo gravitacional esférico inverso ao quadrado de Newton.</li>
              <li><strong className="text-zinc-200">a_coriolis = -2(ω × v):</strong> Aceleração de Coriolis induzida pela rotação da superfície planetária.</li>
            </ul>
          </div>

          {/* Seção 3: Modelo Atmosférico em Camadas (ISA) */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>2. Modelo Atmosférico e Compressibilidade (ISA)</span>
            </h3>
            <p className="text-zinc-400">
              A atmosfera modela a variação contínua de temperatura, pressão e densidade desde o nível do mar até o teto espacial (Linha de Kármán a 100 km):
            </p>
            <div className="p-3 bg-[#0a0a0c] font-mono text-amber-300 rounded-lg border border-[#27272a]">
              P(h) = P_base · [ 1 + (L · h) / T_base ] ^ ( -g₀ / (R_sp · L) )<br />
              ρ(h) = P(h) / (R_sp · T(h))<br />
              a(h) = √(γ · R_sp · T(h)) (Velocidade do Som)<br />
              Mach = v_rel / a(h)
            </div>
            <p className="text-zinc-400">
              O coeficiente de arrasto Cd sofre um incremento transônico abrupto entre Mach 0.8 e 1.4 devido à compressão de choque (wave drag), estabilizando-se em valores assintóticos no regime hipersônico.
            </p>
          </div>

          {/* Seção 4: Multi-Estágios & Equação de Tsiolkovsky */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-amber-400" />
              <span>3. Veículos Multi-Estágios & Tsiolkovsky</span>
            </h3>
            <p className="text-zinc-400">
              Quando o propelente de um estágio se esgota, o motor desacopla a massa seca estrutural morta (dry mass jettison). Isso eleva a fração de propelente do estágio seguinte, permitindo atingir velocidades suborbitais com a fórmula de Tsiolkovsky sequencial:
            </p>
            <div className="p-3 bg-[#0a0a0c] font-mono text-amber-300 rounded-lg border border-[#27272a]">
              Δv_total = Σ [ I_sp,i · g₀ · ln(m_inicial,i / m_final,i) ]
            </div>
          </div>

          {/* Seção 5: Método de Monte Carlo & Erro Circular Provável (CEP) */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span>4. Dispersão Estocástica e Erro Circular Provável (CEP)</span>
            </h3>
            <p className="text-zinc-400">
              O módulo de análise de dispersão utiliza amostragem de Monte Carlo com perturbações gaussianas de vento, empuxo e mira para determinar o raio CEP 50% (mediana) e CEP 95% (intervalo de confiança estatística de impacto).
            </p>
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div className="px-6 py-3 border-t border-[#27272a] bg-[#0a0a0c] flex items-center justify-between text-zinc-400 text-xs font-mono">
          <span>Simulador Balístico Fictício • Versão Educacional</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#18181c] hover:bg-[#27272a] text-zinc-100 border border-[#27272a] font-mono font-semibold rounded transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
