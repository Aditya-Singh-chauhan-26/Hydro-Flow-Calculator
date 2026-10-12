import React from 'react';
import { ChannelInputs, HydraulicResults } from '../types/hydraulics';
import { calculateGeometry, getUnitConstants } from '../utils/hydraulics';
import { Scale, ArrowUpDown, History, BookCheck, Check } from 'lucide-react';

interface ComparisonViewProps {
  inputs: ChannelInputs;
  results: HydraulicResults;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ inputs, results }) => {
  const units = getUnitConstants(inputs.unitSystem);
  const activeDepth = inputs.calculationMode === 'normal_depth' && results.solvedDepth ? results.solvedDepth : inputs.depth;

  // Generate sensitivity depths: 0.25y, 0.5y, 0.75y, 1.0y, 1.25y, 1.5y, 2.0y
  const multipliers = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
  const sensitivityRows = multipliers.map(m => {
    let testDepth = activeDepth * m;
    if (inputs.shape === 'circular') {
      testDepth = Math.min(inputs.diameter * 0.98, testDepth);
    }

    const geom = calculateGeometry(inputs.shape, testDepth, {
      bottomWidth: inputs.bottomWidth,
      sideSlope: inputs.sideSlope,
      diameter: inputs.diameter
    });

    const S = Math.max(1e-6, inputs.bedSlope);
    const n = Math.max(0.001, inputs.manningN);
    const R = geom.hydraulicRadius;
    const A = geom.area;

    const Vm = (units.kManning / n) * Math.pow(R, 2 / 3) * Math.sqrt(S);
    const Qm = Vm * A;

    let C = inputs.customChezyC;
    if (inputs.chezyInputMode === 'calculate_from_manning') {
      C = (units.kManning / n) * Math.pow(R, 1 / 6);
    }
    const Vc = C * Math.sqrt(R * S);
    const Qc = Vc * A;

    const deltaPct = Qm > 0 ? ((Qm - Qc) / Qm) * 100 : 0;
    const Fr = Vm / Math.sqrt(units.g * geom.hydraulicDepth);

    return {
      multiplier: m,
      depth: testDepth,
      area: A,
      hydraulicRadius: R,
      chezyC: C,
      manningQ: Qm,
      chezyQ: Qc,
      deltaPct,
      froude: Fr,
      isCurrent: m === 1.0
    };
  });

  return (
    <div className="space-y-6">
      {/* Introduction Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Scale className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-bold text-white">
            Manning vs. Chezy Comparative Formulation Analysis
          </h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Chezy's equation (developed in 1775 for the Canal de l'Yvette by Antoine de Chézy) was the world's first uniform flow equation.
          Over a century later in 1889, Irish civil engineer Robert Manning recognized that Chezy's resistance coefficient <span className="font-mono text-amber-300">C</span> was not constant for a given lining material, but systematically increased with the <span className="font-mono text-cyan-300">hydraulic radius to the 1/6th power</span> (<span className="font-mono text-cyan-300">C ∝ R^(1/6)</span>).
        </p>

        {/* Side-by-Side Equation Contrast */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-cyan-400">Chezy's Equation (1775)</span>
              <span className="text-[10px] text-slate-500 font-mono">Antoine de Chézy</span>
            </div>
            <div className="text-sm font-mono text-white mb-2">
              V = C · √(R · S)
            </div>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>• Treats roughness as empirical coefficient <span className="font-mono text-slate-200">C</span>.</li>
              <li>• Dimensions of C are <span className="font-mono text-slate-200">{inputs.unitSystem === 'SI' ? 'm½/s' : 'ft½/s'}</span>.</li>
              <li>• Requires empirical adjustment charts for differing channel depths.</li>
            </ul>
          </div>

          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-cyan-400">Manning's Equation (1889)</span>
              <span className="text-[10px] text-slate-500 font-mono">Robert Manning</span>
            </div>
            <div className="text-sm font-mono text-white mb-2">
              V = ({units.kManning} / n) · R^(2/3) · S^(1/2)
            </div>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>• Roughness <span className="font-mono text-slate-200">n</span> remains constant across depths for a fixed boundary.</li>
              <li>• Incorporates boundary layer growth via exponent <span className="font-mono text-slate-200">R^(2/3)</span>.</li>
              <li>• Universally standardized by ASCE, USACE, and ISO.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Sensitivity Analysis Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-cyan-400" />
              Depth Sensitivity & Discrepancy Matrix
            </h4>
            <p className="text-xs text-slate-400">
              Evaluated across varying flow depths for current cross-section and slope
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/50">
                <th className="py-2.5 px-3">Stage Ratio</th>
                <th className="py-2.5 px-3">Depth y ({units.unitLength})</th>
                <th className="py-2.5 px-3">Radius R ({units.unitLength})</th>
                <th className="py-2.5 px-3">Chezy C</th>
                <th className="py-2.5 px-3">Manning Q ({units.unitDischarge})</th>
                <th className="py-2.5 px-3">Chezy Q ({units.unitDischarge})</th>
                <th className="py-2.5 px-3">Δ Diff (%)</th>
                <th className="py-2.5 px-3">Froude (Fr)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sensitivityRows.map((row, idx) => (
                <tr
                  key={idx}
                  className={`transition-colors ${
                    row.isCurrent
                      ? 'bg-cyan-950/30 font-semibold text-cyan-200'
                      : 'hover:bg-slate-800/40 text-slate-300'
                  }`}
                >
                  <td className="py-2 px-3">
                    {row.isCurrent ? (
                      <span className="flex items-center gap-1 text-cyan-400">
                        <Check className="w-3 h-3" /> 1.00·y (Current)
                      </span>
                    ) : (
                      `${row.multiplier.toFixed(2)}·y`
                    )}
                  </td>
                  <td className="py-2 px-3 tabular-nums">{row.depth.toFixed(3)}</td>
                  <td className="py-2 px-3 tabular-nums">{row.hydraulicRadius.toFixed(3)}</td>
                  <td className="py-2 px-3 tabular-nums text-amber-300">{row.chezyC.toFixed(2)}</td>
                  <td className="py-2 px-3 tabular-nums text-cyan-300">{row.manningQ.toFixed(3)}</td>
                  <td className="py-2 px-3 tabular-nums text-amber-300">{row.chezyQ.toFixed(3)}</td>
                  <td className="py-2 px-3 tabular-nums">
                    <span className={Math.abs(row.deltaPct) > 5 ? 'text-rose-400' : 'text-slate-400'}>
                      {row.deltaPct.toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-2 px-3 tabular-nums">
                    {row.froude.toFixed(3)}{' '}
                    <span className="text-[10px] text-slate-500">
                      ({row.froude > 1 ? 'Super' : 'Sub'})
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
