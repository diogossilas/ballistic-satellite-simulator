/**
 * Barra Superior de Navegação e Banner Permanente de Segurança e Ficção
 * Contém o aviso ético permanente exigido e os seletores das seções principais da aplicação.
 */

import React from 'react';
import { 
  Rocket, 
  ShieldCheck, 
  Layers, 
  Globe, 
  BookOpen, 
  Activity, 
  Atom, 
  FileText,
  HelpCircle,
  Play
} from 'lucide-react';

export type MainTab = 
  | 'simulador'
  | 'construtor'
  | 'ambiente'
  | 'cenarios'
  | 'graficos'
  | 'laboratorio'
  | 'relatorio';

interface NavbarProps {
  activeTab: MainTab;
  onChangeTab: (tab: MainTab) => void;
  onOpenDocModal: () => void;
  isSimulating: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onChangeTab,
  onOpenDocModal,
  isSimulating,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#050506]/95 backdrop-blur border-b border-[#27272a] shadow-xl">
      {/* 1. AVISO PERMANENTE DE FICÇÃO E SEGURANÇA (REGRA 7) */}
      <div className="w-full bg-[#121215] border-b border-[#27272a] px-3 py-1.5 text-center flex items-center justify-center gap-2 text-[11px] sm:text-xs text-amber-300 font-mono">
        <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="tracking-tight">
          “Simulação de física balística e aeroespacial baseada em cenários fictícios. Destinada exclusivamente a fins educacionais e de pesquisa.”
        </span>
      </div>

      {/* 2. Barra Principal com Logotipo e Abas de Navegação */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 flex flex-col md:flex-row md:items-center justify-between gap-2.5 py-2.5">
        {/* Logotipo e Identidade */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[#18181c] border border-amber-500/40 rounded text-amber-400 shadow-md">
              <Rocket className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-bold text-zinc-100 tracking-tight font-mono">
                  SIMULADOR_BALÍSTICO
                </span>
                <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded">
                  RK4_ENGINE
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline">
                Mecânica Orbital, Balística Exterior & Aerodinâmica
              </span>
            </div>
          </div>

          <button
            onClick={onOpenDocModal}
            className="md:hidden p-1.5 text-zinc-400 hover:text-zinc-200 bg-[#121215] border border-[#27272a] rounded"
            title="Documentação e Ajuda"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>

        {/* Abas Principais */}
        <nav className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
          <button
            id="nav-tab-simulador"
            onClick={() => onChangeTab('simulador')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium whitespace-nowrap transition-colors ${
              activeTab === 'simulador'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/50 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#18181c] border border-transparent'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Simulador</span>
            {isSimulating && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>

          <button
            id="nav-tab-construtor"
            onClick={() => onChangeTab('construtor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium whitespace-nowrap transition-colors ${
              activeTab === 'construtor'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/50 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#18181c] border border-transparent'
            }`}
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>Construtor</span>
          </button>

          <button
            id="nav-tab-ambiente"
            onClick={() => onChangeTab('ambiente')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium whitespace-nowrap transition-colors ${
              activeTab === 'ambiente'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/50 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#18181c] border border-transparent'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Ambiente</span>
          </button>

          <button
            id="nav-tab-cenarios"
            onClick={() => onChangeTab('cenarios')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium whitespace-nowrap transition-colors ${
              activeTab === 'cenarios'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/50 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#18181c] border border-transparent'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Cenários</span>
          </button>

          <button
            id="nav-tab-graficos"
            onClick={() => onChangeTab('graficos')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium whitespace-nowrap transition-colors ${
              activeTab === 'graficos'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/50 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#18181c] border border-transparent'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Gráficos</span>
          </button>

          <button
            id="nav-tab-laboratorio"
            onClick={() => onChangeTab('laboratorio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium whitespace-nowrap transition-colors ${
              activeTab === 'laboratorio'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/50 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#18181c] border border-transparent'
            }`}
          >
            <Atom className="w-3.5 h-3.5" />
            <span>Laboratório</span>
          </button>

          <button
            id="nav-tab-relatorio"
            onClick={() => onChangeTab('relatorio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium whitespace-nowrap transition-colors ${
              activeTab === 'relatorio'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/50 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#18181c] border border-transparent'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Relatório</span>
          </button>

          <div className="hidden md:block w-[1px] h-4 bg-[#27272a] mx-1" />

          <button
            onClick={onOpenDocModal}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono text-zinc-400 hover:text-zinc-200 hover:bg-[#18181c] rounded transition-colors border border-transparent hover:border-[#27272a]"
            title="Manual e Documentação Científica"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Manual</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
