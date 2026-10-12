import React from 'react';
import { ChannelInputs, HydraulicResults } from '../types/hydraulics';
import { getUnitConstants } from '../utils/hydraulics';
import {
  Waves,
  Gauge,
  Zap,
  Activity,
  ArrowRight,
  TrendingDown,
  Info,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface ResultsDashboardProps {
  inputs: ChannelInputs;
  results: HydraulicResults;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ inputs, results }) => {
  const units = getUnitConstants(inputs.unitSystem);

  const isCritical = results.flowRegime === 'Critical';
  const isSupercritical = results.flowRegime === 'Supercritical';

  return (
    <div className="space-y-4">
      {/* Primary KPI Row: Manning vs Chezy side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Manning's Equation Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
                <Waves className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-bold text-white">Manning's Equation</h3>
            </div>
            <span className="text-[11px] font-mono text-cyan-400">
              k = {units.kManning} · n = {inputs.manningN}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 my-4">
            <div>
              <span className="text-xs text-slate-400 uppercase font-mono tracking-wider block">
                Discharge (Q)
              </span>
              <div className="text-2xl font-bold font-mono text-cyan-400 tabular-nums mt-0.5">
                {results.manningDischarge.toFixed(4)}
              </div>
              <span className="text-[11px] font-mono text-slate-500">{units.unitDischarge}</span>
            </div>

            <div>
              <span className="text-xs text-slate-400 uppercase font-mono tracking-wider block">
                Mean Velocity (V)
              </span>
              <div className="text-2xl font-bold font-mono text-white tabular-nums mt-0.5">
                {results.manningVelocity.toFixed(4)}
              </div>
              <span className="text-[11px] font-mono text-slate-500">{units.unitVelocity}</span>
            </div>
          </div>

          <div className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded-lg text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>Formula:</span>
            <span className="text-cyan-300">
              V = ({units.kManning} / n) · R^(2/3) · S^(1/2)
            </span>
          </div>
        </div>

        {/* Chezy's Equation Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400">
                <Gauge className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-bold text-white">Chezy's Equation</h3>
            </div>
            <span className="text-[11px] font-mono text-amber-400">
              C = {results.chezyC.toFixed(2)} {inputs.unitSystem === 'SI' ? 'm½/s' : 'ft½/s'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 my-4">
            <div>
              <span className="text-xs text-slate-400 uppercase font-mono tracking-wider block">
                Discharge (Q)
              </span>
              <div className="text-2xl font-bold font-mono text-amber-400 tabular-nums mt-0.5">
                {results.chezyDischarge.toFixed(4)}
              </div>
              <span className="text-[11px] font-mono text-slate-500">{units.unitDischarge}</span>
            </div>

            <div>
              <span className="text-xs text-slate-400 uppercase font-mono tracking-wider block">
                Mean Velocity (V)
              </span>
              <div className="text-2xl font-bold font-mono text-white tabular-nums mt-0.5">
                {results.chezyVelocity.toFixed(4)}
              </div>
              <span className="text-[11px] font-mono text-slate-500">{units.unitVelocity}</span>
            </div>
          </div>

          <div className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded-lg text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>Formula:</span>
            <span className="text-amber-300">
              V = C · √(R · S)
            </span>
          </div>
        </div>
      </div>

      {/* Discrepancy & Solver Banner */}
      <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span className="text-slate-300 font-medium">Equation Concordance:</span>
          <span className="font-mono font-semibold text-white">
            Δ = {results.dischargeDeltaPercent.toFixed(2)}%
          </span>
          <span className="text-slate-500">
            ({inputs.chezyInputMode === 'calculate_from_manning' ? 'Identical due to C = (k/n)·R^(1/6)' : 'Evaluated with independent manual Chezy C'})
          </span>
        </div>

        {inputs.calculationMode === 'normal_depth' && results.solvedDepth && (
          <div className="flex items-center gap-2 px-2.5 py-1 bg-blue-950/60 border border-blue-800 rounded-md text-blue-300 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Solved Normal Depth: yn = {results.solvedDepth.toFixed(4)} {units.unitLength}</span>
            <span className="text-blue-400 text-[10px]">({results.iterationsCount} iters)</span>
          </div>
        )}

        {inputs.calculationMode === 'slope' && results.solvedSlope && (
          <div className="flex items-center gap-2 px-2.5 py-1 bg-blue-950/60 border border-blue-800 rounded-md text-blue-300 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Solved Required Slope: S = {results.solvedSlope.toFixed(6)}</span>
          </div>
        )}
      </div>

      {/* Flow State & Hydraulics Multi-Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Froude Number & Regime */}
        <div className={`p-4 rounded-xl border ${
          isSupercritical
            ? 'bg-amber-950/20 border-amber-800/80'
            : isCritical
            ? 'bg-purple-950/20 border-purple-800/80'
            : 'bg-slate-900/90 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
              Froude Number (Fr)
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              isSupercritical
                ? 'bg-amber-500/20 text-amber-300'
                : isCritical
                ? 'bg-purple-500/20 text-purple-300'
                : 'bg-emerald-500/20 text-emerald-300'
            }`}>
              {results.flowRegime}
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-white tabular-nums">
            {results.froudeNumber.toFixed(3)}
          </div>
          <p className="text-[10px] text-slate-500 mt-1 truncate">
            {isSupercritical ? 'Supercritical (Shooting/Rapid)' : isCritical ? 'Critical State (Fr = 1)' : 'Subcritical (Tranquil/Streaming)'}
          </p>
        </div>

        {/* Specific Energy */}
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1">
            Specific Energy (E)
          </span>
          <div className="text-xl font-bold font-mono text-cyan-300 tabular-nums">
            {results.specificEnergy.toFixed(4)}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">{units.unitLength} (E = y + V²/2g)</span>
        </div>

        {/* Critical Depth (yc) */}
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1">
            Critical Depth (yc)
          </span>
          <div className="text-xl font-bold font-mono text-indigo-300 tabular-nums">
            {results.criticalDepth.toFixed(4)}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">{units.unitLength} (Vc = {results.criticalVelocity.toFixed(2)} {units.unitVelocity})</span>
        </div>

        {/* Boundary Shear Stress */}
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1">
            Boundary Shear (τ₀)
          </span>
          <div className="text-xl font-bold font-mono text-rose-300 tabular-nums">
            {results.shearStress.toFixed(3)}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">{units.unitShear} (Tractive force)</span>
        </div>
      </div>
    </div>
  );
};
