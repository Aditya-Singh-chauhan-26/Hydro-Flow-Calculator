import React, { useState } from 'react';
import { ChannelInputs } from '../types/hydraulics';
import { generatePythonScript, generateJupyterNotebook } from '../utils/pythonCodeGenerator';
import {
  Terminal,
  Play,
  Download,
  Copy,
  Check,
  Code2,
  RefreshCw,
  FileCode,
  Sparkles
} from 'lucide-react';

interface PythonTerminalViewProps {
  inputs: ChannelInputs;
  onExecutePython: () => void;
  pythonOutput: string | null;
  isRunningPython: boolean;
  pythonError: string | null;
  executionMs?: number;
}

export const PythonTerminalView: React.FC<PythonTerminalViewProps> = ({
  inputs,
  onExecutePython,
  pythonOutput,
  isRunningPython,
  pythonError,
  executionMs
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'script' | 'terminal'>('script');

  const pythonScript = generatePythonScript(inputs);

  const handleCopy = () => {
    navigator.clipboard.writeText(pythonScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPython = () => {
    const blob = new Blob([pythonScript], { type: 'text/x-python;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'hydro_flow_calculator.py';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadNotebook = () => {
    const notebookJson = generateJupyterNotebook(inputs);
    const blob = new Blob([notebookJson], { type: 'application/x-ipynb+json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'hydro_flow_calculator.ipynb';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Top Controls Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Python 3 Hydraulic Engineering Application
            </h3>
            <p className="text-xs text-slate-400">
              Object-oriented open channel flow calculator with Manning & Chezy solvers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('script')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'script'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5" /> Source (.py)
            </span>
          </button>

          <button
            onClick={() => setActiveTab('terminal')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'terminal'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" /> Output Terminal
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('terminal');
              onExecutePython();
            }}
            disabled={isRunningPython}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-md transition-all shadow-sm shadow-emerald-500/20 whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {isRunningPython ? 'Executing...' : 'Run in Python 3'}
          </button>

          <button
            onClick={handleCopy}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded-md transition-colors"
            title="Copy Python Code"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            onClick={handleDownloadPython}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-950 border border-slate-800 rounded-md transition-colors"
            title="Download .py script"
          >
            <Download className="w-3.5 h-3.5" />
            <span>.py</span>
          </button>

          <button
            onClick={handleDownloadNotebook}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-cyan-300 hover:text-cyan-200 bg-cyan-950/40 border border-cyan-800 rounded-md transition-colors"
            title="Download Jupyter Notebook"
          >
            <Download className="w-3.5 h-3.5" />
            <span>.ipynb</span>
          </button>
        </div>
      </div>

      {/* Script Tab */}
      {activeTab === 'script' && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden font-mono text-xs">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400">
            <span>hydro_flow_calculator.py (PEP-8 Compliant)</span>
            <span>Python 3.10+ · Standard Library (math, dataclasses)</span>
          </div>
          <pre className="p-4 overflow-x-auto text-slate-200 leading-relaxed max-h-[560px] whitespace-pre selection:bg-cyan-500 selection:text-slate-950">
            <code>{pythonScript}</code>
          </pre>
        </div>
      )}

      {/* Terminal Tab */}
      {activeTab === 'terminal' && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden font-mono text-xs shadow-2xl">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
              <span className="text-slate-400 ml-2">bash - python3 hydro_flow_calculator.py</span>
            </div>
            {executionMs !== undefined && (
              <span className="text-emerald-400 text-[10px]">
                Executed in {executionMs}ms
              </span>
            )}
          </div>

          <div className="p-5 min-h-[380px] max-h-[560px] overflow-y-auto text-slate-200 leading-relaxed space-y-2">
            <div className="text-slate-500">
              $ python3 hydro_flow_calculator.py
            </div>

            {isRunningPython && (
              <div className="flex items-center gap-2 text-cyan-400 py-3">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running hydraulic calculations on Python 3 backend...</span>
              </div>
            )}

            {pythonError && (
              <div className="text-rose-400 p-3 bg-rose-950/40 border border-rose-900 rounded">
                Execution Error: {pythonError}
              </div>
            )}

            {pythonOutput ? (
              <pre className="text-emerald-300 whitespace-pre font-mono leading-relaxed">
                {pythonOutput}
              </pre>
            ) : !isRunningPython && (
              <div className="text-slate-500 italic py-6">
                Press "Run in Python 3" above to execute the Python solver script and view formatted terminal output.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
