import React from 'react';
import { ChannelInputs, HydraulicResults } from '../types/hydraulics';
import { getUnitConstants } from '../utils/hydraulics';
import { Eye, Maximize2 } from 'lucide-react';

interface ChannelVisualizerProps {
  inputs: ChannelInputs;
  results: HydraulicResults;
}

export const ChannelVisualizer: React.FC<ChannelVisualizerProps> = ({ inputs, results }) => {
  const units = getUnitConstants(inputs.unitSystem);
  const shape = inputs.shape;
  const y = inputs.calculationMode === 'normal_depth' && results.solvedDepth ? results.solvedDepth : inputs.depth;
  const b = inputs.bottomWidth;
  const z = inputs.sideSlope;
  const D = inputs.diameter;

  // SVG viewBox settings
  const width = 580;
  const height = 340;
  const paddingX = 70;
  const paddingY = 50;

  // Determine scaling based on shape dimensions
  let totalWidth = 0;
  let totalHeight = 0;

  if (shape === 'rectangular') {
    totalWidth = b;
    totalHeight = y * 1.5;
  } else if (shape === 'trapezoidal') {
    totalWidth = b + 2 * z * y * 1.3;
    totalHeight = y * 1.5;
  } else if (shape === 'triangular') {
    totalWidth = 2 * z * y * 1.3;
    totalHeight = y * 1.4;
  } else if (shape === 'circular') {
    totalWidth = D * 1.2;
    totalHeight = D * 1.2;
  }

  // Max bound safeguards
  totalWidth = Math.max(0.5, totalWidth);
  totalHeight = Math.max(0.5, totalHeight);

  const scaleX = (width - 2 * paddingX) / totalWidth;
  const scaleY = (height - 2 * paddingY) / totalHeight;
  const scale = Math.min(scaleX, scaleY);

  const centerX = width / 2;
  const groundY = height - paddingY - 20;

  // Generate SVG geometries
  let channelPath = '';
  let waterPath = '';
  let wettedPath = '';
  let topWidthPoints = { x1: 0, x2: 0, y: 0 };
  let bottomPoints = { x1: 0, x2: 0, y: 0 };
  let depthGauge = { x: 0, yTop: 0, yBottom: 0 };

  if (shape === 'rectangular') {
    const halfB = (b * scale) / 2;
    const waterH = y * scale;
    const channelH = waterH * 1.35;

    // Outer channel bounds
    channelPath = `M ${centerX - halfB - 25} ${groundY - channelH} L ${centerX - halfB} ${groundY - channelH} L ${centerX - halfB} ${groundY} L ${centerX + halfB} ${groundY} L ${centerX + halfB} ${groundY - channelH} L ${centerX + halfB + 25} ${groundY - channelH}`;
    
    // Water polygon
    waterPath = `M ${centerX - halfB} ${groundY - waterH} L ${centerX + halfB} ${groundY - waterH} L ${centerX + halfB} ${groundY} L ${centerX - halfB} ${groundY} Z`;

    // Wetted perimeter
    wettedPath = `M ${centerX - halfB} ${groundY - waterH} L ${centerX - halfB} ${groundY} L ${centerX + halfB} ${groundY} L ${centerX + halfB} ${groundY - waterH}`;

    topWidthPoints = { x1: centerX - halfB, x2: centerX + halfB, y: groundY - waterH };
    bottomPoints = { x1: centerX - halfB, x2: centerX + halfB, y: groundY };
    depthGauge = { x: centerX + halfB + 30, yTop: groundY - waterH, yBottom: groundY };
  } else if (shape === 'trapezoidal') {
    const halfB = (b * scale) / 2;
    const waterH = y * scale;
    const channelH = waterH * 1.35;
    const topWaterSpread = z * y * scale;
    const topChannelSpread = z * (waterH * 1.35 / scale) * scale;

    channelPath = `M ${centerX - halfB - topChannelSpread - 20} ${groundY - channelH} L ${centerX - halfB - topChannelSpread} ${groundY - channelH} L ${centerX - halfB} ${groundY} L ${centerX + halfB} ${groundY} L ${centerX + halfB + topChannelSpread} ${groundY - channelH} L ${centerX + halfB + topChannelSpread + 20} ${groundY - channelH}`;

    waterPath = `M ${centerX - halfB - topWaterSpread} ${groundY - waterH} L ${centerX + halfB + topWaterSpread} ${groundY - waterH} L ${centerX + halfB} ${groundY} L ${centerX - halfB} ${groundY} Z`;

    wettedPath = `M ${centerX - halfB - topWaterSpread} ${groundY - waterH} L ${centerX - halfB} ${groundY} L ${centerX + halfB} ${groundY} L ${centerX + halfB + topWaterSpread} ${groundY - waterH}`;

    topWidthPoints = { x1: centerX - halfB - topWaterSpread, x2: centerX + halfB + topWaterSpread, y: groundY - waterH };
    bottomPoints = { x1: centerX - halfB, x2: centerX + halfB, y: groundY };
    depthGauge = { x: centerX + halfB + topWaterSpread + 25, yTop: groundY - waterH, yBottom: groundY };
  } else if (shape === 'triangular') {
    const waterH = y * scale;
    const channelH = waterH * 1.35;
    const topWaterSpread = z * y * scale;
    const topChannelSpread = z * (channelH / scale) * scale;

    channelPath = `M ${centerX - topChannelSpread - 20} ${groundY - channelH} L ${centerX - topChannelSpread} ${groundY - channelH} L ${centerX} ${groundY} L ${centerX + topChannelSpread} ${groundY - channelH} L ${centerX + topChannelSpread + 20} ${groundY - channelH}`;

    waterPath = `M ${centerX - topWaterSpread} ${groundY - waterH} L ${centerX + topWaterSpread} ${groundY - waterH} L ${centerX} ${groundY} Z`;

    wettedPath = `M ${centerX - topWaterSpread} ${groundY - waterH} L ${centerX} ${groundY} L ${centerX + topWaterSpread} ${groundY - waterH}`;

    topWidthPoints = { x1: centerX - topWaterSpread, x2: centerX + topWaterSpread, y: groundY - waterH };
    bottomPoints = { x1: centerX - 5, x2: centerX + 5, y: groundY };
    depthGauge = { x: centerX + topWaterSpread + 25, yTop: groundY - waterH, yBottom: groundY };
  } else if (shape === 'circular') {
    const radius = (D * scale) / 2;
    const pipeCenterY = groundY - radius;
    const waterH = Math.min(y, D * 0.999) * scale;
    const waterSurfaceY = groundY - waterH;

    // Angle theta
    const ratio = Math.min(y, D * 0.999) / D;
    const theta = 2 * Math.acos(Math.max(-1, Math.min(1, 1 - 2 * ratio)));
    const halfTopW = radius * Math.sin(theta / 2);

    const xLeft = centerX - halfTopW;
    const xRight = centerX + halfTopW;

    channelPath = ''; // We'll render circle element directly
    waterPath = `M ${xLeft} ${waterSurfaceY} A ${radius} ${radius} 0 ${waterH > radius ? 1 : 0} 0 ${xRight} ${waterSurfaceY} Z`;
    wettedPath = `M ${xLeft} ${waterSurfaceY} A ${radius} ${radius} 0 ${waterH > radius ? 1 : 0} 0 ${xRight} ${waterSurfaceY}`;

    topWidthPoints = { x1: xLeft, x2: xRight, y: waterSurfaceY };
    bottomPoints = { x1: centerX - radius, x2: centerX + radius, y: groundY };
    depthGauge = { x: centerX + radius + 25, yTop: waterSurfaceY, yBottom: groundY };
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4 flex flex-col justify-between">
      {/* Visualizer Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyan-400" />
            Cross-Section Hydraulic Geometry
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time scaled rendering with free surface and wetted perimeter
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-cyan-300">
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400"></span> Water Area (A)
          </span>
          <span className="flex items-center gap-1.5 text-amber-300">
            <span className="w-3 h-0.5 bg-amber-400"></span> Wetted Perimeter (P)
          </span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full aspect-[16/9] max-h-[340px] bg-slate-950/80 rounded-lg border border-slate-800/80 overflow-hidden flex items-center justify-center p-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Water gradient */}
            <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.9" />
            </linearGradient>

            {/* Pattern for soil embankment */}
            <pattern id="soilHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="8" stroke="#334155" strokeWidth="1" strokeOpacity="0.4" />
            </pattern>
          </defs>

          {/* Grid background lines */}
          <g stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3">
            {[60, 120, 180, 240, 300].map(gy => (
              <line key={gy} x1="20" y1={gy} x2={width - 20} y2={gy} />
            ))}
          </g>

          {/* Circular Channel Body (if circular) */}
          {shape === 'circular' && (
            <circle
              cx={centerX}
              cy={groundY - (D * scale) / 2}
              r={(D * scale) / 2}
              fill="#090d16"
              stroke="#475569"
              strokeWidth="3.5"
            />
          )}

          {/* Non-circular Channel Boundary */}
          {shape !== 'circular' && channelPath && (
            <path
              d={channelPath}
              fill="none"
              stroke="#475569"
              strokeWidth="3"
              strokeLinejoin="round"
            />
          )}

          {/* Water Area Polygon */}
          {waterPath && (
            <path
              d={waterPath}
              fill="url(#waterGradient)"
              opacity="0.9"
            />
          )}

          {/* Free Water Surface Wave line */}
          <line
            x1={topWidthPoints.x1}
            y1={topWidthPoints.y}
            x2={topWidthPoints.x2}
            y2={topWidthPoints.y}
            stroke="#67e8f9"
            strokeWidth="2.5"
            strokeDasharray="6 3"
          />

          {/* Wetted Perimeter Highlighting (Solid Amber) */}
          {wettedPath && (
            <path
              d={wettedPath}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )}

          {/* Free Surface Level Marker Inverted Triangle */}
          <polygon
            points={`${(topWidthPoints.x1 + topWidthPoints.x2) / 2 - 5},${topWidthPoints.y - 8} ${(topWidthPoints.x1 + topWidthPoints.x2) / 2 + 5},${topWidthPoints.y - 8} ${(topWidthPoints.x1 + topWidthPoints.x2) / 2},${topWidthPoints.y - 2}`}
            fill="#38bdf8"
          />

          {/* Top Width (T) Dimension Callout */}
          <g stroke="#38bdf8" strokeWidth="1.2">
            <line x1={topWidthPoints.x1} y1={topWidthPoints.y - 18} x2={topWidthPoints.x2} y2={topWidthPoints.y - 18} />
            <line x1={topWidthPoints.x1} y1={topWidthPoints.y - 23} x2={topWidthPoints.x1} y2={topWidthPoints.y - 13} />
            <line x1={topWidthPoints.x2} y1={topWidthPoints.y - 23} x2={topWidthPoints.x2} y2={topWidthPoints.y - 13} />
          </g>
          <text
            x={(topWidthPoints.x1 + topWidthPoints.x2) / 2}
            y={topWidthPoints.y - 23}
            fill="#7dd3fc"
            fontSize="10"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
          >
            T = {results.topWidth.toFixed(3)} {units.unitLength}
          </text>

          {/* Bottom Width (b) Dimension Callout (Rectangular & Trapezoidal) */}
          {(shape === 'rectangular' || shape === 'trapezoidal') && (
            <g stroke="#94a3b8" strokeWidth="1.2">
              <line x1={bottomPoints.x1} y1={bottomPoints.y + 16} x2={bottomPoints.x2} y2={bottomPoints.y + 16} />
              <line x1={bottomPoints.x1} y1={bottomPoints.y + 11} x2={bottomPoints.x1} y2={bottomPoints.y + 21} />
              <line x1={bottomPoints.x2} y1={bottomPoints.y + 11} x2={bottomPoints.x2} y2={bottomPoints.y + 21} />
              <text
                x={(bottomPoints.x1 + bottomPoints.x2) / 2}
                y={bottomPoints.y + 28}
                fill="#cbd5e1"
                fontSize="10"
                fontFamily="JetBrains Mono"
                textAnchor="middle"
              >
                b = {b.toFixed(2)} {units.unitLength}
              </text>
            </g>
          )}

          {/* Pipe Diameter (D) Callout for Circular */}
          {shape === 'circular' && (
            <g stroke="#94a3b8" strokeWidth="1.2">
              <line x1={centerX - (D * scale) / 2} y1={groundY + 16} x2={centerX + (D * scale) / 2} y2={groundY + 16} />
              <text
                x={centerX}
                y={groundY + 28}
                fill="#cbd5e1"
                fontSize="10"
                fontFamily="JetBrains Mono"
                textAnchor="middle"
              >
                D = {D.toFixed(2)} {units.unitLength}
              </text>
            </g>
          )}

          {/* Water Depth (y) Vertical Dimension Gauge */}
          <g stroke="#22d3ee" strokeWidth="1.2">
            <line x1={depthGauge.x} y1={depthGauge.yTop} x2={depthGauge.x} y2={depthGauge.yBottom} />
            <line x1={depthGauge.x - 4} y1={depthGauge.yTop} x2={depthGauge.x + 4} y2={depthGauge.yTop} />
            <line x1={depthGauge.x - 4} y1={depthGauge.yBottom} x2={depthGauge.x + 4} y2={depthGauge.yBottom} />
            <text
              x={depthGauge.x + 7}
              y={(depthGauge.yTop + depthGauge.yBottom) / 2 + 3}
              fill="#22d3ee"
              fontSize="10"
              fontFamily="JetBrains Mono"
              alignmentBaseline="middle"
            >
              y = {y.toFixed(3)} {units.unitLength}
            </text>
          </g>

          {/* Side slope annotation (z:1) */}
          {(shape === 'trapezoidal' || shape === 'triangular') && (
            <text
              x={topWidthPoints.x1 - 10}
              y={(topWidthPoints.y + groundY) / 2}
              fill="#94a3b8"
              fontSize="9"
              fontFamily="JetBrains Mono"
              textAnchor="end"
            >
              1 : {z.toFixed(1)}
            </text>
          )}
        </svg>
      </div>

      {/* Hydraulic Geometry Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
        <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg text-center">
          <span className="text-[10px] uppercase font-mono text-slate-400 block">Area (A)</span>
          <span className="text-base font-bold font-mono text-cyan-300 tabular-nums">
            {results.area.toFixed(3)}
          </span>
          <span className="text-[10px] text-slate-500 font-mono ml-1">{units.unitArea}</span>
        </div>

        <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg text-center">
          <span className="text-[10px] uppercase font-mono text-slate-400 block">Perimeter (P)</span>
          <span className="text-base font-bold font-mono text-amber-300 tabular-nums">
            {results.wettedPerimeter.toFixed(3)}
          </span>
          <span className="text-[10px] text-slate-500 font-mono ml-1">{units.unitLength}</span>
        </div>

        <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg text-center">
          <span className="text-[10px] uppercase font-mono text-slate-400 block">Hydraulic Radius (R)</span>
          <span className="text-base font-bold font-mono text-emerald-300 tabular-nums">
            {results.hydraulicRadius.toFixed(3)}
          </span>
          <span className="text-[10px] text-slate-500 font-mono ml-1">{units.unitLength}</span>
        </div>

        <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg text-center">
          <span className="text-[10px] uppercase font-mono text-slate-400 block">Top Width (T)</span>
          <span className="text-base font-bold font-mono text-sky-300 tabular-nums">
            {results.topWidth.toFixed(3)}
          </span>
          <span className="text-[10px] text-slate-500 font-mono ml-1">{units.unitLength}</span>
        </div>

        <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg text-center col-span-2 sm:col-span-1">
          <span className="text-[10px] uppercase font-mono text-slate-400 block">Hydraulic Depth (Dh)</span>
          <span className="text-base font-bold font-mono text-indigo-300 tabular-nums">
            {results.hydraulicDepth.toFixed(3)}
          </span>
          <span className="text-[10px] text-slate-500 font-mono ml-1">{units.unitLength}</span>
        </div>
      </div>
    </div>
  );
};
