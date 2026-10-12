import React, { useState } from 'react';
import { ChannelInputs, HydraulicResults, HydraulicCurvePoint } from '../types/hydraulics';
import { generateHydraulicCurves, getUnitConstants } from '../utils/hydraulics';
import { LineChart, BarChart2, TrendingUp, Info } from 'lucide-react';

interface HydraulicChartsProps {
  inputs: ChannelInputs;
  results: HydraulicResults;
}

type ChartType = 'stage_discharge' | 'velocity_depth' | 'specific_energy' | 'hydraulic_radius';

export const HydraulicCharts: React.FC<HydraulicChartsProps> = ({ inputs, results }) => {
  const [activeChart, setActiveChart] = useState<ChartType>('stage_discharge');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const units = getUnitConstants(inputs.unitSystem);
  const points = generateHydraulicCurves(inputs, 40);

  const activeDepth = inputs.calculationMode === 'normal_depth' && results.solvedDepth ? results.solvedDepth : inputs.depth;

  // SVG dimensions
  const svgWidth = 720;
  const svgHeight = 360;
  const padLeft = 70;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 55;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  // Determine axes bounds depending on chart type
  let xLabel = '';
  let yLabel = '';
  let xMin = 0;
  let xMax = 1;
  let yMin = 0;
  let yMax = 1;

  let getPointCoords: (pt: HydraulicCurvePoint) => { xVal: number; yVal: number; xVal2?: number };
  let currentOperatingPoint: { xVal: number; yVal: number } = { xVal: 0, yVal: 0 };

  if (activeChart === 'stage_discharge') {
    // Stage (depth y) vs Discharge (Q)
    xLabel = `Discharge Q (${units.unitDischarge})`;
    yLabel = `Flow Depth y (${units.unitLength})`;
    const maxQ = Math.max(...points.map(p => Math.max(p.manningDischarge, p.chezyDischarge)), results.manningDischarge * 1.15);
    const maxY = Math.max(...points.map(p => p.depth), activeDepth * 1.15);
    xMin = 0;
    xMax = maxQ * 1.08;
    yMin = 0;
    yMax = maxY;

    getPointCoords = (pt) => ({
      xVal: pt.manningDischarge,
      xVal2: pt.chezyDischarge,
      yVal: pt.depth
    });
    currentOperatingPoint = { xVal: results.manningDischarge, yVal: activeDepth };
  } else if (activeChart === 'velocity_depth') {
    xLabel = `Mean Velocity V (${units.unitVelocity})`;
    yLabel = `Flow Depth y (${units.unitLength})`;
    const maxV = Math.max(...points.map(p => p.velocity), results.manningVelocity * 1.2);
    const maxY = Math.max(...points.map(p => p.depth));
    xMin = 0;
    xMax = maxV * 1.1;
    yMin = 0;
    yMax = maxY;

    getPointCoords = (pt) => ({ xVal: pt.velocity, yVal: pt.depth });
    currentOperatingPoint = { xVal: results.manningVelocity, yVal: activeDepth };
  } else if (activeChart === 'specific_energy') {
    // Specific Energy Diagram: E on x-axis, y on y-axis
    xLabel = `Specific Energy E = y + V²/(2g) (${units.unitLength})`;
    yLabel = `Flow Depth y (${units.unitLength})`;
    const maxE = Math.max(...points.map(p => p.specificEnergy), results.specificEnergy * 1.2);
    const maxY = Math.max(...points.map(p => p.depth));
    xMin = 0;
    xMax = maxE * 1.1;
    yMin = 0;
    yMax = maxY;

    getPointCoords = (pt) => ({ xVal: pt.specificEnergy, yVal: pt.depth });
    currentOperatingPoint = { xVal: results.specificEnergy, yVal: activeDepth };
  } else {
    // Hydraulic Radius vs Depth
    xLabel = `Hydraulic Radius R = A/P (${units.unitLength})`;
    yLabel = `Flow Depth y (${units.unitLength})`;
    const maxR = Math.max(...points.map(p => p.hydraulicRadius), results.hydraulicRadius * 1.2);
    const maxY = Math.max(...points.map(p => p.depth));
    xMin = 0;
    xMax = maxR * 1.1;
    yMin = 0;
    yMax = maxY;

    getPointCoords = (pt) => ({ xVal: pt.hydraulicRadius, yVal: pt.depth });
    currentOperatingPoint = { xVal: results.hydraulicRadius, yVal: activeDepth };
  }

  const mapX = (val: number) => padLeft + ((val - xMin) / (xMax - xMin || 1)) * plotW;
  const mapY = (val: number) => padTop + plotH - ((val - yMin) / (yMax - yMin || 1)) * plotH;

  // Generate SVG path for primary curve
  const primaryPath = points.map((pt, idx) => {
    const coords = getPointCoords(pt);
    const px = mapX(coords.xVal);
    const py = mapY(coords.yVal);
    return `${idx === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`;
  }).join(' ');

  // Generate secondary path for Chezy if stage_discharge
  let secondaryPath = '';
  if (activeChart === 'stage_discharge') {
    secondaryPath = points.map((pt, idx) => {
      const coords = getPointCoords(pt);
      const px = mapX(coords.xVal2 || coords.xVal);
      const py = mapY(coords.yVal);
      return `${idx === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`;
    }).join(' ');
  }

  // Operating point coordinates
  const opX = mapX(currentOperatingPoint.xVal);
  const opY = mapY(currentOperatingPoint.yVal);

  // Critical depth line
  const critY = mapY(results.criticalDepth);

  // Grid tick markers
  const xTicks = [0, 0.25, 0.5, 0.75, 1.0].map(frac => xMin + frac * (xMax - xMin));
  const yTicks = [0, 0.25, 0.5, 0.75, 1.0].map(frac => yMin + frac * (yMax - yMin));

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
      {/* Chart Selector Tabs & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            Hydraulic Rating Curves & Performance Diagrams
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Empirical curve generation comparing Manning's and Chezy's formulations
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-lg">
          <button
            onClick={() => setActiveChart('stage_discharge')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeChart === 'stage_discharge'
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Stage-Discharge (Q vs y)
          </button>
          <button
            onClick={() => setActiveChart('velocity_depth')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeChart === 'velocity_depth'
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Velocity (V vs y)
          </button>
          <button
            onClick={() => setActiveChart('specific_energy')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeChart === 'specific_energy'
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Specific Energy (E vs y)
          </button>
          <button
            onClick={() => setActiveChart('hydraulic_radius')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeChart === 'hydraulic_radius'
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Hydraulic Radius (R vs y)
          </button>
        </div>
      </div>

      {/* Interactive SVG Plot Viewport */}
      <div className="relative w-full aspect-[2/1] max-h-[380px] bg-slate-950/80 rounded-lg border border-slate-800/80 p-2 overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background Grid Lines */}
          <g stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3">
            {xTicks.map((val, idx) => (
              <line key={`xt-${idx}`} x1={mapX(val)} y1={padTop} x2={mapX(val)} y2={padTop + plotH} />
            ))}
            {yTicks.map((val, idx) => (
              <line key={`yt-${idx}`} x1={padLeft} y1={mapY(val)} x2={padLeft + plotW} y2={mapY(val)} />
            ))}
          </g>

          {/* Plot Axes */}
          <line
            x1={padLeft}
            y1={padTop + plotH}
            x2={padLeft + plotW}
            y2={padTop + plotH}
            stroke="#475569"
            strokeWidth="1.5"
          />
          <line
            x1={padLeft}
            y1={padTop}
            x2={padLeft}
            y2={padTop + plotH}
            stroke="#475569"
            strokeWidth="1.5"
          />

          {/* X-axis tick labels */}
          {xTicks.map((val, idx) => (
            <text
              key={`xtl-${idx}`}
              x={mapX(val)}
              y={padTop + plotH + 18}
              fill="#94a3b8"
              fontSize="10"
              fontFamily="JetBrains Mono"
              textAnchor="middle"
            >
              {val < 10 ? val.toFixed(2) : val.toFixed(1)}
            </text>
          ))}
          <text
            x={padLeft + plotW / 2}
            y={svgHeight - 12}
            fill="#cbd5e1"
            fontSize="11"
            fontWeight="600"
            textAnchor="middle"
          >
            {xLabel}
          </text>

          {/* Y-axis tick labels */}
          {yTicks.map((val, idx) => (
            <text
              key={`ytl-${idx}`}
              x={padLeft - 10}
              y={mapY(val) + 3}
              fill="#94a3b8"
              fontSize="10"
              fontFamily="JetBrains Mono"
              textAnchor="end"
            >
              {val.toFixed(2)}
            </text>
          ))}
          <text
            x={16}
            y={padTop + plotH / 2}
            fill="#cbd5e1"
            fontSize="11"
            fontWeight="600"
            textAnchor="middle"
            transform={`rotate(-90 16 ${padTop + plotH / 2})`}
          >
            {yLabel}
          </text>

          {/* Critical Depth line (horizontal dashed magenta) */}
          {results.criticalDepth <= yMax && (
            <g>
              <line
                x1={padLeft}
                y1={critY}
                x2={padLeft + plotW}
                y2={critY}
                stroke="#c084fc"
                strokeWidth="1.5"
                strokeDasharray="5 4"
              />
              <text
                x={padLeft + plotW - 6}
                y={critY - 5}
                fill="#d8b4fe"
                fontSize="9"
                fontFamily="JetBrains Mono"
                textAnchor="end"
              >
                Critical Depth yc = {results.criticalDepth.toFixed(3)} {units.unitLength}
              </text>
            </g>
          )}

          {/* Chezy Curve (Secondary, if stage-discharge) */}
          {activeChart === 'stage_discharge' && secondaryPath && (
            <path
              d={secondaryPath}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeDasharray="5 3"
              strokeLinecap="round"
            />
          )}

          {/* Primary Curve (Manning's / Selected) */}
          <path
            d={primaryPath}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Interactive Operating Point Callout */}
          <g>
            {/* Pulsing halo */}
            <circle cx={opX} cy={opY} r="9" fill="#06b6d4" opacity="0.25" />
            <circle cx={opX} cy={opY} r="5" fill="#22d3ee" stroke="#ffffff" strokeWidth="1.5" />

            {/* Operating point HUD Tag */}
            <g transform={`translate(${Math.min(padLeft + plotW - 130, Math.max(padLeft + 10, opX + 12))}, ${Math.max(padTop + 25, opY - 15)})`}>
              <rect
                x="0"
                y="-18"
                width="120"
                height="32"
                rx="4"
                fill="#090d16"
                stroke="#06b6d4"
                strokeWidth="1"
              />
              <text x="6" y="-5" fill="#67e8f9" fontSize="9" fontFamily="JetBrains Mono" fontWeight="600">
                Operating Point
              </text>
              <text x="6" y="8" fill="#e2e8f0" fontSize="9" fontFamily="JetBrains Mono">
                y={activeDepth.toFixed(2)} | Q={results.manningDischarge.toFixed(2)}
              </text>
            </g>
          </g>
        </svg>
      </div>

      {/* Legend & Interpretation Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-mono text-cyan-300">
            <span className="w-3.5 h-0.5 bg-cyan-400"></span> Manning's Formulation (Q_m)
          </span>
          {activeChart === 'stage_discharge' && (
            <span className="flex items-center gap-1.5 font-mono text-amber-300">
              <span className="w-3.5 h-0.5 border-t border-dashed border-amber-400"></span> Chezy's Formulation (Q_c)
            </span>
          )}
          <span className="flex items-center gap-1.5 font-mono text-purple-300">
            <span className="w-3 h-0.5 border-t border-dashed border-purple-400"></span> Critical Depth (yc)
          </span>
        </div>

        <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span>Stage increases monotonically with discharge in uniform open-channel flow</span>
        </div>
      </div>
    </div>
  );
};
