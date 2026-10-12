import React, { useState } from 'react';
import { ChannelInputs, HydraulicResults } from '../types/hydraulics';
import { getUnitConstants } from '../utils/hydraulics';
import { FileText, Printer, Copy, Check, X, GraduationCap, Download } from 'lucide-react';

interface CollegeReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  inputs: ChannelInputs;
  results: HydraulicResults;
}

export const CollegeReportModal: React.FC<CollegeReportModalProps> = ({
  isOpen,
  onClose,
  inputs,
  results
}) => {
  const [studentName, setStudentName] = useState('Hydraulic Engineering Student');
  const [courseCode, setCourseCode] = useState('CE-304: Fluid Mechanics & Open Channel Hydraulics');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const units = getUnitConstants(inputs.unitSystem);
  const activeDepth = inputs.calculationMode === 'normal_depth' && results.solvedDepth ? results.solvedDepth : inputs.depth;

  const reportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const generateMarkdownReport = () => {
    return `# COLLEGE LAB REPORT: FLOW RATE CALCULATION USING CHEZY'S AND MANNING'S EQUATIONS
**Course:** ${courseCode}
**Author:** ${studentName}
**Date:** ${reportDate}

---

## 1. OBJECTIVE
To develop and apply a computerized calculation tool in Python to determine the uniform flow rate (discharge, Q) in open channels using Chezy's and Manning's equations, and to analyze their comparative behavior, boundary shear stresses, and flow regimes.

## 2. GOVERNING EQUATIONS
1. **Manning's Equation:**
   V = (${units.kManning} / n) · R^(2/3) · S^(1/2)
   Q = A · V = (${units.kManning} / n) · A · R^(2/3) · S^(1/2)

2. **Chezy's Equation:**
   V = C · √(R · S)
   Q = A · C · √(R · S)

3. **Theoretical Relation:**
   C = (${units.kManning} / n) · R^(1/6)

## 3. INPUT PARAMETERS
- Channel Geometry: ${inputs.shape.toUpperCase()}
- Unit System: ${inputs.unitSystem}
- Flow Depth (y): ${activeDepth.toFixed(3)} ${units.unitLength}
${inputs.shape === 'rectangular' || inputs.shape === 'trapezoidal' ? `- Bottom Width (b): ${inputs.bottomWidth.toFixed(2)} ${units.unitLength}\n` : ''}${inputs.shape === 'trapezoidal' || inputs.shape === 'triangular' ? `- Side Slope (z): ${inputs.sideSlope.toFixed(2)} (1V:${inputs.sideSlope}H)\n` : ''}${inputs.shape === 'circular' ? `- Conduit Diameter (D): ${inputs.diameter.toFixed(2)} ${units.unitLength}\n` : ''}- Longitudinal Bed Slope (S): ${inputs.bedSlope.toFixed(6)}
- Manning's Roughness (n): ${inputs.manningN}
- Chezy's Coefficient (C): ${results.chezyC.toFixed(2)} ${inputs.unitSystem === 'SI' ? 'm½/s' : 'ft½/s'}

## 4. CALCULATED RESULTS
- Cross-Sectional Area (A): ${results.area.toFixed(4)} ${units.unitArea}
- Wetted Perimeter (P): ${results.wettedPerimeter.toFixed(4)} ${units.unitLength}
- Hydraulic Radius (R): ${results.hydraulicRadius.toFixed(4)} ${units.unitLength}
- Top Water Width (T): ${results.topWidth.toFixed(4)} ${units.unitLength}
- Hydraulic Depth (Dh): ${results.hydraulicDepth.toFixed(4)} ${units.unitLength}

### Flow Rates:
- Manning Discharge (Q_m): ${results.manningDischarge.toFixed(4)} ${units.unitDischarge}
- Manning Velocity (V_m): ${results.manningVelocity.toFixed(4)} ${units.unitVelocity}
- Chezy Discharge (Q_c): ${results.chezyDischarge.toFixed(4)} ${units.unitDischarge}
- Chezy Velocity (V_c): ${results.chezyVelocity.toFixed(4)} ${units.unitVelocity}
- Relative Discrepancy: ${results.dischargeDeltaPercent.toFixed(2)} %

### Energy and Regime:
- Froude Number (Fr): ${results.froudeNumber.toFixed(4)}
- Flow Regime: ${results.flowRegime}
- Specific Energy (E): ${results.specificEnergy.toFixed(4)} ${units.unitLength}
- Critical Depth (yc): ${results.criticalDepth.toFixed(4)} ${units.unitLength}
- Boundary Shear Stress (τ₀): ${results.shearStress.toFixed(3)} ${units.unitShear}

## 5. DISCUSSION & CONCLUSIONS
1. The Manning and Chezy equations yield concordant discharge values when Chezy's C is calculated from Manning's n via C = (k/n)·R^(1/6).
2. The Froude number of ${results.froudeNumber.toFixed(3)} indicates that the flow is ${results.flowRegime.toLowerCase()}.
3. The boundary shear stress of ${results.shearStress.toFixed(3)} ${units.unitShear} must be checked against the critical tractive force of the boundary material to avoid bank erosion or bed siltation.
`;
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(generateMarkdownReport());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">
              College Project Lab Report Generator
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied Markdown' : 'Copy Markdown'}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Customizable Student Info Form */}
        <div className="px-6 py-3 bg-slate-950/50 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Student / Author Name:</label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-white text-xs"
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">Course Title / Subject:</label>
            <input
              type="text"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-white text-xs"
            />
          </div>
        </div>

        {/* Report Content Body (Printable) */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300 font-sans leading-relaxed bg-slate-900">
          {/* Title Header */}
          <div className="text-center pb-4 border-b border-slate-800 space-y-1">
            <h2 className="text-lg font-bold text-white tracking-tight uppercase">
              Development of a Flow Rate Calculation Tool Using Chezy's and Manning's Equations
            </h2>
            <div className="text-slate-400 text-xs font-mono">
              Academic College Project · Open Channel Hydraulics Analysis
            </div>
            <div className="text-[11px] text-slate-500 pt-1">
              Author: <strong className="text-slate-300">{studentName}</strong> | Course: <strong className="text-slate-300">{courseCode}</strong> | Date: {reportDate}
            </div>
          </div>

          {/* Section 1: Objective */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">
              1. Project Objective & Scope
            </h4>
            <p>
              The purpose of this project is to implement an automated hydraulic calculation engine (in Python) to evaluate open-channel flow rates using both Chezy's (1775) and Manning's (1889) empirical relationships. The tool validates engineering inputs, performs unit transformations between SI and US Customary systems, and visually presents stage-discharge characteristics and flow regime states.
            </p>
          </div>

          {/* Section 2: Input Parameters Summary */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2">
              2. Channel Specifications & Input Data
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px] bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div>Channel Geometry: <span className="text-white font-bold">{inputs.shape.toUpperCase()}</span></div>
              <div>Flow Depth (y): <span className="text-white font-bold">{activeDepth.toFixed(3)} {units.unitLength}</span></div>
              {inputs.shape !== 'circular' && <div>Bottom Width (b): <span className="text-white font-bold">{inputs.bottomWidth.toFixed(2)} {units.unitLength}</span></div>}
              {(inputs.shape === 'trapezoidal' || inputs.shape === 'triangular') && <div>Side Slope (z): <span className="text-white font-bold">{inputs.sideSlope.toFixed(2)}</span></div>}
              {inputs.shape === 'circular' && <div>Pipe Diameter (D): <span className="text-white font-bold">{inputs.diameter.toFixed(2)} {units.unitLength}</span></div>}
              <div>Bed Slope (S): <span className="text-white font-bold">{inputs.bedSlope.toFixed(6)}</span></div>
              <div>Manning's n: <span className="text-white font-bold">{inputs.manningN}</span></div>
              <div>Chezy's C: <span className="text-white font-bold">{results.chezyC.toFixed(2)}</span></div>
            </div>
          </div>

          {/* Section 3: Calculated Hydraulic Results Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2">
              3. Computational Results & Parameters
            </h4>
            <table className="w-full text-left font-mono text-[11px] border border-slate-800">
              <tbody>
                <tr className="border-b border-slate-800 bg-slate-950/60">
                  <td className="p-2 text-slate-400">Flow Area (A)</td>
                  <td className="p-2 font-bold text-white">{results.area.toFixed(4)} {units.unitArea}</td>
                  <td className="p-2 text-slate-400">Wetted Perimeter (P)</td>
                  <td className="p-2 font-bold text-white">{results.wettedPerimeter.toFixed(4)} {units.unitLength}</td>
                </tr>
                <tr className="border-b border-slate-800">
                  <td className="p-2 text-slate-400">Hydraulic Radius (R = A/P)</td>
                  <td className="p-2 font-bold text-white">{results.hydraulicRadius.toFixed(4)} {units.unitLength}</td>
                  <td className="p-2 text-slate-400">Free Top Width (T)</td>
                  <td className="p-2 font-bold text-white">{results.topWidth.toFixed(4)} {units.unitLength}</td>
                </tr>
                <tr className="border-b border-slate-800 bg-slate-950/60">
                  <td className="p-2 text-cyan-400 font-semibold">Manning Discharge (Q_m)</td>
                  <td className="p-2 font-bold text-cyan-300">{results.manningDischarge.toFixed(4)} {units.unitDischarge}</td>
                  <td className="p-2 text-cyan-400 font-semibold">Manning Velocity (V_m)</td>
                  <td className="p-2 font-bold text-cyan-300">{results.manningVelocity.toFixed(4)} {units.unitVelocity}</td>
                </tr>
                <tr className="border-b border-slate-800">
                  <td className="p-2 text-amber-400 font-semibold">Chezy Discharge (Q_c)</td>
                  <td className="p-2 font-bold text-amber-300">{results.chezyDischarge.toFixed(4)} {units.unitDischarge}</td>
                  <td className="p-2 text-amber-400 font-semibold">Chezy Velocity (V_c)</td>
                  <td className="p-2 font-bold text-amber-300">{results.chezyVelocity.toFixed(4)} {units.unitVelocity}</td>
                </tr>
                <tr className="border-b border-slate-800 bg-slate-950/60">
                  <td className="p-2 text-slate-400">Froude Number (Fr)</td>
                  <td className="p-2 font-bold text-white">{results.froudeNumber.toFixed(4)} ({results.flowRegime})</td>
                  <td className="p-2 text-slate-400">Specific Energy (E)</td>
                  <td className="p-2 font-bold text-white">{results.specificEnergy.toFixed(4)} {units.unitLength}</td>
                </tr>
                <tr>
                  <td className="p-2 text-slate-400">Critical Depth (yc)</td>
                  <td className="p-2 font-bold text-white">{results.criticalDepth.toFixed(4)} {units.unitLength}</td>
                  <td className="p-2 text-slate-400">Boundary Shear (τ₀)</td>
                  <td className="p-2 font-bold text-white">{results.shearStress.toFixed(3)} {units.unitShear}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 4: Engineering Discussion */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">
              4. Technical Observations & Engineering Analysis
            </h4>
            <ul className="list-disc list-inside space-y-1 text-slate-300">
              <li>
                <strong>Discrepancy Evaluation:</strong> The percentage difference between Manning's and Chezy's flow rate is <span className="font-mono text-cyan-300">{results.dischargeDeltaPercent.toFixed(2)}%</span>. The agreement stems from equating the boundary resistance relationship where <span className="font-mono">C = (k/n)·R^(1/6)</span>.
              </li>
              <li>
                <strong>Flow State Regime:</strong> With a Froude number of <span className="font-mono text-cyan-300">{results.froudeNumber.toFixed(4)}</span>, the flow regime is <strong>{results.flowRegime}</strong>. {results.froudeNumber > 1 ? 'Care must be taken to account for hydraulic jumps when transitioning downstream to subcritical slopes.' : 'Flow is tranquil and gravity waves can propagate upstream.'}
              </li>
              <li>
                <strong>Scour & Siltation Assessment:</strong> Flow velocity is <span className="font-mono text-cyan-300">{results.manningVelocity.toFixed(3)} {units.unitVelocity}</span>. Standard civil design criteria suggest non-silting minimum velocities of 0.6 m/s (2.0 ft/s) and maximum non-erodible velocities of 3.0 m/s (10 ft/s) for concrete or lined channels.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
