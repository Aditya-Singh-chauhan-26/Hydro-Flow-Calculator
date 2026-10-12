import React from 'react';
import { Download, FileText, Terminal, BarChart3, Layers, BookOpen } from 'lucide-react';

interface HeaderProps {
  activeTab: 'calculator' | 'charts' | 'comparison' | 'theory' | 'python' | 'report';
  setActiveTab: (tab: 'calculator' | 'charts' | 'comparison' | 'theory' | 'python' | 'report') => void;
  onOpenReport: () => void;
  onRunPython: () => void;
  isRunningPython: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenReport,
  onRunPython,
  isRunningPython
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-sm shadow-cyan-500/20">
          HF
        </div>
        <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
          HydroFlow
        </span>
        <span className="hidden sm:inline text-xs text-slate-400 font-mono border-l border-slate-700 pl-2.5">
          Manning & Chezy Tool
        </span>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
        <button
          onClick={() => setActiveTab('calculator')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap py-1 ${
            activeTab === 'calculator'
              ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400'
              : 'hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Calculator & Geometry
        </button>
        <button
          onClick={() => setActiveTab('charts')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap py-1 ${
            activeTab === 'charts'
              ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400'
              : 'hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Rating Curves
        </button>
        <button
          onClick={() => setActiveTab('comparison')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap py-1 ${
            activeTab === 'comparison'
              ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400'
              : 'hover:text-slate-200'
          }`}
        >
          Comparison
        </button>
        <button
          onClick={() => setActiveTab('theory')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap py-1 ${
            activeTab === 'theory'
              ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400'
              : 'hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Theory & Formulas
        </button>
        <button
          onClick={() => setActiveTab('python')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap py-1 ${
            activeTab === 'python'
              ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400'
              : 'hover:text-slate-200'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          Python Engine
        </button>
      </nav>

      {/* Zone 3: Primary Action */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onRunPython}
          disabled={isRunningPython}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-cyan-300 bg-cyan-950/60 border border-cyan-700/60 rounded-md hover:bg-cyan-900/60 hover:border-cyan-500 transition-all whitespace-nowrap disabled:opacity-50"
          title="Execute script on Python 3 backend"
        >
          <Terminal className="w-3.5 h-3.5" />
          {isRunningPython ? 'Running Python...' : 'Run with Python'}
        </button>

        <button
          onClick={onOpenReport}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors shadow-sm shadow-cyan-500/20 whitespace-nowrap"
        >
          <FileText className="w-3.5 h-3.5" />
          Project Report
        </button>
      </div>
    </header>
  );
};
