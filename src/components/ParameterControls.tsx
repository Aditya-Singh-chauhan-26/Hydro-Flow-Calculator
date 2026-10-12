import React from 'react';
import {
  ChannelInputs,
  ChannelShape,
  CalculationMode,
  UnitSystem,
  ValidationIssue
} from '../types/hydraulics';
import { MANNING_ROUGHNESS_PRESETS, CHANNEL_CASE_STUDIES } from '../utils/presets';
import { getUnitConstants } from '../utils/hydraulics';
import { AlertTriangle, AlertCircle, Info, Sparkles, HelpCircle } from 'lucide-react';

interface ParameterControlsProps {
  inputs: ChannelInputs;
  setInputs: (updater: (prev: ChannelInputs) => ChannelInputs) => void;
  validationIssues: ValidationIssue[];
  onUnitChange: (targetUnit: UnitSystem) => void;
  onApplyPreset: (presetId: string) => void;
}

export const ParameterControls: React.FC<ParameterControlsProps> = ({
  inputs,
  setInputs,
  validationIssues,
  onUnitChange,
  onApplyPreset
}) => {
  const units = getUnitConstants(inputs.unitSystem);

  const updateField = <K extends keyof ChannelInputs>(field: K, value: ChannelInputs[K]) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const errors = validationIssues.filter(i => i.type === 'error');
  const warnings = validationIssues.filter(i => i.type === 'warning');
  const infos = validationIssues.filter(i => i.type === 'info');

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-6">
      {/* Top Bar: Case Study Preset & Unit System */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            College Lab Problem / Case Study
          </label>
          <select
            onChange={(e) => onApplyPreset(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="">Load Standard Engineering Problem...</option>
            {CHANNEL_CASE_STUDIES.map(cs => (
              <option key={cs.id} value={cs.id}>{cs.title}</option>
            ))}
          </select>
        </div>

        {/* Unit System Switcher */}
        <div>
          <span className="text-xs font-semibold text-slate-300 block mb-1">Unit System</span>
          <div className="inline-flex rounded-lg p-0.5 bg-slate-950 border border-slate-800">
            <button
              type="button"
              onClick={() => onUnitChange('SI')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                inputs.unitSystem === 'SI'
                  ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              SI Metric (m, m³/s)
            </button>
            <button
              type="button"
              onClick={() => onUnitChange('US')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                inputs.unitSystem === 'US'
                  ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              US Customary (ft, cfs)
            </button>
          </div>
        </div>
      </div>

      {/* Cross-Section Geometry Selector */}
      <div>
        <label className="text-xs font-semibold text-slate-300 block mb-2">
          Channel Cross-Section Geometry
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: 'trapezoidal', label: 'Trapezoidal', desc: 'Canals & rivers' },
            { id: 'rectangular', label: 'Rectangular', desc: 'Flumes & troughs' },
            { id: 'triangular', label: 'Triangular', desc: 'V-ditches & swales' },
            { id: 'circular', label: 'Circular', desc: 'Sewers & culverts' },
          ].map(shape => (
            <button
              key={shape.id}
              type="button"
              onClick={() => updateField('shape', shape.id as ChannelShape)}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                inputs.shape === shape.id
                  ? 'bg-cyan-950/40 border-cyan-500 text-cyan-200 shadow-sm shadow-cyan-500/10'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div className="text-xs font-semibold text-slate-200">{shape.label}</div>
              <div className="text-[10px] text-slate-500 truncate">{shape.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Calculation Mode */}
      <div>
        <label className="text-xs font-semibold text-slate-300 block mb-2">
          Calculation Objective
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { id: 'forward', title: 'Forward Calculation', sub: 'Compute Q & V from depth y' },
            { id: 'normal_depth', title: 'Solve Normal Depth (yn)', sub: 'Compute y from target Q' },
            { id: 'slope', title: 'Solve Bed Slope (S)', sub: 'Compute required S for Q & y' }
          ].map(mode => (
            <button
              key={mode.id}
              type="button"
              onClick={() => updateField('calculationMode', mode.id as CalculationMode)}
              className={`p-2 text-left rounded-lg border transition-all ${
                inputs.calculationMode === mode.id
                  ? 'bg-blue-950/40 border-blue-500 text-blue-200'
                  : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div className="text-xs font-semibold text-slate-200">{mode.title}</div>
              <div className="text-[10px] text-slate-500">{mode.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Target Flow Input (if solving inverse problems) */}
      {(inputs.calculationMode === 'normal_depth' || inputs.calculationMode === 'slope') && (
        <div className="p-3 bg-blue-950/30 border border-blue-800/60 rounded-lg">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-blue-300">
              Target Design Discharge (Q)
            </label>
            <span className="text-xs font-mono text-blue-400">
              {inputs.targetDischarge} {units.unitDischarge}
            </span>
          </div>
          <input
            type="number"
            step="0.01"
            min="0.001"
            value={inputs.targetDischarge}
            onChange={(e) => updateField('targetDischarge', Math.max(0.001, parseFloat(e.target.value) || 0.1))}
            className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
          />
        </div>
      )}

      {/* Geometric Dimensions Form */}
      <div className="space-y-4 pt-2 border-t border-slate-800">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Geometric Dimensions
        </h4>

        {/* Depth (y) - Hidden or disabled if solving normal depth */}
        {inputs.calculationMode !== 'normal_depth' && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-slate-300 font-medium">
                Flow Depth (y)
              </span>
              <span className="text-xs font-mono text-cyan-400 tabular-nums">
                {inputs.depth.toFixed(3)} {units.unitLength}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0.05"
                max={inputs.shape === 'circular' ? inputs.diameter : 5.0}
                step="0.01"
                value={inputs.depth}
                onChange={(e) => updateField('depth', parseFloat(e.target.value))}
                className="flex-1 accent-cyan-400"
              />
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={inputs.depth}
                onChange={(e) => updateField('depth', Math.max(0.001, parseFloat(e.target.value) || 0.1))}
                className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-right font-mono text-white"
              />
            </div>
          </div>
        )}

        {/* Bottom width (b) for rectangular and trapezoidal */}
        {(inputs.shape === 'rectangular' || inputs.shape === 'trapezoidal') && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-slate-300 font-medium">
                Bottom Width (b)
              </span>
              <span className="text-xs font-mono text-cyan-400 tabular-nums">
                {inputs.bottomWidth.toFixed(2)} {units.unitLength}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0.2"
                max="20.0"
                step="0.1"
                value={inputs.bottomWidth}
                onChange={(e) => updateField('bottomWidth', parseFloat(e.target.value))}
                className="flex-1 accent-cyan-400"
              />
              <input
                type="number"
                step="0.1"
                min="0.05"
                value={inputs.bottomWidth}
                onChange={(e) => updateField('bottomWidth', Math.max(0.01, parseFloat(e.target.value) || 1.0))}
                className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-right font-mono text-white"
              />
            </div>
          </div>
        )}

        {/* Side slope (z) for trapezoidal and triangular */}
        {(inputs.shape === 'trapezoidal' || inputs.shape === 'triangular') && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-slate-300 font-medium">
                Side Slope Ratio (z : 1)
                <span className="text-[11px] text-slate-500 ml-1.5">(1 Vertical to z Horizontal)</span>
              </span>
              <span className="text-xs font-mono text-cyan-400 tabular-nums">
                {inputs.sideSlope.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0.0"
                max="4.0"
                step="0.1"
                value={inputs.sideSlope}
                onChange={(e) => updateField('sideSlope', parseFloat(e.target.value))}
                className="flex-1 accent-cyan-400"
              />
              <input
                type="number"
                step="0.1"
                min="0.0"
                value={inputs.sideSlope}
                onChange={(e) => updateField('sideSlope', Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-right font-mono text-white"
              />
            </div>
          </div>
        )}

        {/* Diameter (D) for circular */}
        {inputs.shape === 'circular' && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-slate-300 font-medium">
                Pipe Conduit Diameter (D)
              </span>
              <span className="text-xs font-mono text-cyan-400 tabular-nums">
                {inputs.diameter.toFixed(2)} {units.unitLength}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0.2"
                max="6.0"
                step="0.05"
                value={inputs.diameter}
                onChange={(e) => {
                  const newD = parseFloat(e.target.value);
                  updateField('diameter', newD);
                  if (inputs.depth > newD) updateField('depth', newD * 0.8);
                }}
                className="flex-1 accent-cyan-400"
              />
              <input
                type="number"
                step="0.05"
                min="0.1"
                value={inputs.diameter}
                onChange={(e) => {
                  const newD = Math.max(0.1, parseFloat(e.target.value) || 1.0);
                  updateField('diameter', newD);
                  if (inputs.depth > newD) updateField('depth', newD * 0.8);
                }}
                className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-right font-mono text-white"
              />
            </div>
          </div>
        )}

        {/* Longitudinal Bed Slope (S) */}
        {inputs.calculationMode !== 'slope' && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-slate-300 font-medium">
                Bed Slope (S)
                <span className="text-[11px] text-slate-500 ml-1.5">
                  ({(inputs.bedSlope * 100).toFixed(3)}% or 1 in {Math.round(1 / Math.max(1e-6, inputs.bedSlope))})
                </span>
              </span>
              <span className="text-xs font-mono text-cyan-400 tabular-nums">
                {inputs.bedSlope.toFixed(6)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0.0001"
                max="0.03"
                step="0.0001"
                value={inputs.bedSlope}
                onChange={(e) => updateField('bedSlope', parseFloat(e.target.value))}
                className="flex-1 accent-cyan-400"
              />
              <input
                type="number"
                step="0.0001"
                min="0.00001"
                value={inputs.bedSlope}
                onChange={(e) => updateField('bedSlope', Math.max(1e-6, parseFloat(e.target.value) || 0.001))}
                className="w-24 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-right font-mono text-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* Hydraulic Roughness Section */}
      <div className="space-y-4 pt-2 border-t border-slate-800">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Hydraulic Roughness
        </h4>

        {/* Manning's n preset dropdown */}
        <div>
          <label className="text-xs text-slate-300 font-medium block mb-1">
            Boundary Lining Material (Manning's n Presets)
          </label>
          <select
            value={inputs.manningN}
            onChange={(e) => updateField('manningN', parseFloat(e.target.value))}
            className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            {MANNING_ROUGHNESS_PRESETS.map((p, idx) => (
              <option key={idx} value={p.n}>
                {p.name} (n = {p.n})
              </option>
            ))}
          </select>
        </div>

        {/* Manual n input */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-slate-300 font-medium">
              Manning's Roughness Coefficient (n)
            </span>
            <span className="text-xs font-mono text-cyan-400 tabular-nums">
              {inputs.manningN.toFixed(4)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0.008"
              max="0.060"
              step="0.001"
              value={inputs.manningN}
              onChange={(e) => updateField('manningN', parseFloat(e.target.value))}
              className="flex-1 accent-cyan-400"
            />
            <input
              type="number"
              step="0.001"
              min="0.005"
              max="0.2"
              value={inputs.manningN}
              onChange={(e) => updateField('manningN', Math.max(0.001, parseFloat(e.target.value) || 0.014))}
              className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-right font-mono text-white"
            />
          </div>
        </div>

        {/* Chezy's C Mode */}
        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200">
              Chezy Coefficient (C) Mode
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => updateField('chezyInputMode', 'calculate_from_manning')}
                className={`px-2 py-1 text-[11px] rounded transition-colors ${
                  inputs.chezyInputMode === 'calculate_from_manning'
                    ? 'bg-cyan-500 text-slate-950 font-semibold'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                Auto (C = k/n · R^(1/6))
              </button>
              <button
                type="button"
                onClick={() => updateField('chezyInputMode', 'custom_chezy')}
                className={`px-2 py-1 text-[11px] rounded transition-colors ${
                  inputs.chezyInputMode === 'custom_chezy'
                    ? 'bg-cyan-500 text-slate-950 font-semibold'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                Manual C
              </button>
            </div>
          </div>

          {inputs.chezyInputMode === 'custom_chezy' && (
            <div className="pt-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-slate-400">Manual Chezy C</span>
                <span className="text-xs font-mono text-cyan-400">
                  {inputs.customChezyC.toFixed(1)} {inputs.unitSystem === 'SI' ? 'm½/s' : 'ft½/s'}
                </span>
              </div>
              <input
                type="number"
                step="1"
                min="10"
                max="150"
                value={inputs.customChezyC}
                onChange={(e) => updateField('customChezyC', Math.max(1, parseFloat(e.target.value) || 50))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs font-mono text-white"
              />
            </div>
          )}
        </div>
      </div>

      {/* Validation Messages & Alerts */}
      {(errors.length > 0 || warnings.length > 0 || infos.length > 0) && (
        <div className="space-y-2 pt-2 border-t border-slate-800">
          {errors.map((err, i) => (
            <div key={`err-${i}`} className="flex items-start gap-2 p-2.5 bg-rose-950/40 border border-rose-800/80 rounded-md text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{err.message}</span>
            </div>
          ))}
          {warnings.map((warn, i) => (
            <div key={`warn-${i}`} className="flex items-start gap-2 p-2.5 bg-amber-950/40 border border-amber-800/80 rounded-md text-amber-300 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{warn.message}</span>
            </div>
          ))}
          {infos.map((info, i) => (
            <div key={`info-${i}`} className="flex items-start gap-2 p-2.5 bg-cyan-950/40 border border-cyan-800/80 rounded-md text-cyan-300 text-xs">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{info.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
