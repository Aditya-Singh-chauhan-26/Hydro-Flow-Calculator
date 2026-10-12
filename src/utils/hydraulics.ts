import {
  ChannelInputs,
  ChannelShape,
  HydraulicResults,
  UnitSystem,
  ValidationIssue,
  HydraulicCurvePoint
} from '../types/hydraulics';

export interface GeometricProperties {
  area: number;            // A
  wettedPerimeter: number; // P
  hydraulicRadius: number; // R
  topWidth: number;        // T
  hydraulicDepth: number;  // D_h
}

/**
 * Computes cross-sectional geometric properties for a given depth.
 */
export function calculateGeometry(
  shape: ChannelShape,
  depth: number,
  params: {
    bottomWidth: number;
    sideSlope: number;
    diameter: number;
  }
): GeometricProperties {
  const y = Math.max(0.0001, depth);
  const b = Math.max(0.0001, params.bottomWidth);
  const z = Math.max(0, params.sideSlope);
  const D = Math.max(0.0001, params.diameter);

  let A = 0;
  let P = 0;
  let T = 0;

  switch (shape) {
    case 'rectangular': {
      A = b * y;
      P = b + 2 * y;
      T = b;
      break;
    }
    case 'trapezoidal': {
      A = (b + z * y) * y;
      P = b + 2 * y * Math.sqrt(1 + z * z);
      T = b + 2 * z * y;
      break;
    }
    case 'triangular': {
      A = z * y * y;
      P = 2 * y * Math.sqrt(1 + z * z);
      T = 2 * z * y;
      break;
    }
    case 'circular': {
      // Partially full pipe
      const effectiveDepth = Math.min(y, D * 0.9999);
      // Central angle theta in radians: cos(theta/2) = 1 - 2*(y/D)
      const ratio = effectiveDepth / D;
      const theta = 2 * Math.acos(Math.max(-1, Math.min(1, 1 - 2 * ratio)));
      
      A = (D * D / 8) * (theta - Math.sin(theta));
      P = (D * theta) / 2;
      T = D * Math.sin(theta / 2);
      break;
    }
  }

  P = Math.max(0.0001, P);
  const R = A / P;
  T = Math.max(0.0001, T);
  const hydraulicDepth = A / T;

  return {
    area: A,
    wettedPerimeter: P,
    hydraulicRadius: R,
    topWidth: T,
    hydraulicDepth
  };
}

/**
 * Returns physical constants for the active unit system.
 */
export function getUnitConstants(unit: UnitSystem) {
  if (unit === 'SI') {
    return {
      kManning: 1.0,           // Manning conversion factor k_n = 1.0 (m^(1/3)/s)
      g: 9.80665,              // Acceleration due to gravity (m/s²)
      unitLength: 'm',
      unitArea: 'm²',
      unitVelocity: 'm/s',
      unitDischarge: 'm³/s',
      unitShear: 'Pa',
      unitSlope: 'm/m',
      densityWater: 1000,      // kg/m³
      gamma: 9806.65,          // Unit weight (N/m³)
    };
  } else {
    return {
      kManning: 1.486,         // Manning conversion factor k_n = 1.486 (ft^(1/3)/s)
      g: 32.174,               // Acceleration due to gravity (ft/s²)
      unitLength: 'ft',
      unitArea: 'ft²',
      unitVelocity: 'ft/s',
      unitDischarge: 'ft³/s (cfs)',
      unitShear: 'lb/ft²',
      unitSlope: 'ft/ft',
      densityWater: 1.94,      // slugs/ft³
      gamma: 62.4,             // Unit weight (lb/ft³)
    };
  }
}

/**
 * Validates inputs and returns errors/warnings.
 */
export function validateInputs(inputs: ChannelInputs): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (inputs.depth <= 0) {
    issues.push({
      type: 'error',
      message: 'Water depth (y) must be strictly greater than 0.',
      field: 'depth'
    });
  }

  if (inputs.bedSlope <= 0) {
    issues.push({
      type: 'error',
      message: 'Bed slope (S) must be positive for gravity open-channel flow.',
      field: 'bedSlope'
    });
  } else if (inputs.bedSlope > 0.1) {
    issues.push({
      type: 'warning',
      message: 'Bed slope is very steep (> 0.10 / 10%). Standard uniform flow equations may have aeration/roll waves.',
      field: 'bedSlope'
    });
  }

  if (inputs.manningN <= 0) {
    issues.push({
      type: 'error',
      message: "Manning's roughness coefficient (n) must be strictly positive.",
      field: 'manningN'
    });
  } else if (inputs.manningN < 0.008 || inputs.manningN > 0.15) {
    issues.push({
      type: 'warning',
      message: `Manning's n (${inputs.manningN}) is outside typical engineering ranges (0.009 - 0.10).`,
      field: 'manningN'
    });
  }

  if (inputs.shape === 'rectangular' || inputs.shape === 'trapezoidal') {
    if (inputs.bottomWidth <= 0) {
      issues.push({
        type: 'error',
        message: 'Bottom width (b) must be greater than 0.',
        field: 'bottomWidth'
      });
    }
  }

  if (inputs.shape === 'trapezoidal' || inputs.shape === 'triangular') {
    if (inputs.sideSlope < 0) {
      issues.push({
        type: 'error',
        message: 'Side slope ratio (z) cannot be negative.',
        field: 'sideSlope'
      });
    }
  }

  if (inputs.shape === 'circular') {
    if (inputs.diameter <= 0) {
      issues.push({
        type: 'error',
        message: 'Pipe diameter (D) must be greater than 0.',
        field: 'diameter'
      });
    } else if (inputs.depth > inputs.diameter) {
      issues.push({
        type: 'error',
        message: `Water depth (${inputs.depth}) cannot exceed pipe diameter (${inputs.diameter}) in open-channel flow (pipe under pressure).`,
        field: 'depth'
      });
    } else if (inputs.depth > 0.938 * inputs.diameter) {
      issues.push({
        type: 'info',
        message: `Operating near peak hydraulic capacity: circular conduit discharge peaks at y ≈ 0.938·D, not at full depth.`,
        field: 'depth'
      });
    }
  }

  if (inputs.chezyInputMode === 'custom_chezy' && inputs.customChezyC <= 0) {
    issues.push({
      type: 'error',
      message: "Chezy's coefficient (C) must be positive.",
      field: 'customChezyC'
    });
  }

  return issues;
}

/**
 * Solves normal depth (y_n) using Newton-Raphson iteration for Manning's equation:
 * f(y) = Q_target - (k / n) * A(y) * R(y)^(2/3) * S^(1/2) = 0
 */
export function solveNormalDepth(inputs: ChannelInputs): { solvedDepth: number; iterations: number } {
  const { kManning } = getUnitConstants(inputs.unitSystem);
  const targetQ = Math.max(0.0001, inputs.targetDischarge);
  const S = Math.max(0.000001, inputs.bedSlope);
  const n = Math.max(0.001, inputs.manningN);

  const factor = (kManning / n) * Math.sqrt(S);

  let y = inputs.shape === 'circular' ? inputs.diameter * 0.5 : 1.0;
  const maxIterations = 50;
  const tolerance = 1e-5;
  let iterations = 0;

  for (let i = 0; i < maxIterations; i++) {
    iterations = i + 1;
    const geom = calculateGeometry(inputs.shape, y, {
      bottomWidth: inputs.bottomWidth,
      sideSlope: inputs.sideSlope,
      diameter: inputs.diameter
    });

    const Q_calc = factor * geom.area * Math.pow(geom.hydraulicRadius, 2 / 3);
    const f = Q_calc - targetQ;

    if (Math.abs(f) < tolerance) {
      break;
    }

    // Numerical derivative df/dy
    const dy = 0.0001;
    const geomNext = calculateGeometry(inputs.shape, y + dy, {
      bottomWidth: inputs.bottomWidth,
      sideSlope: inputs.sideSlope,
      diameter: inputs.diameter
    });
    const Q_calc_next = factor * geomNext.area * Math.pow(geomNext.hydraulicRadius, 2 / 3);
    const df = (Q_calc_next - Q_calc) / dy;

    if (Math.abs(df) < 1e-12) {
      break;
    }

    let yNext = y - f / df;
    if (inputs.shape === 'circular') {
      yNext = Math.max(0.01, Math.min(inputs.diameter * 0.999, yNext));
    } else {
      yNext = Math.max(0.01, yNext);
    }

    if (Math.abs(yNext - y) < tolerance) {
      y = yNext;
      break;
    }
    y = yNext;
  }

  return { solvedDepth: y, iterations };
}

/**
 * Solves bed slope S required to convey target Q at given depth y.
 */
export function solveRequiredSlope(inputs: ChannelInputs): number {
  const { kManning } = getUnitConstants(inputs.unitSystem);
  const geom = calculateGeometry(inputs.shape, inputs.depth, {
    bottomWidth: inputs.bottomWidth,
    sideSlope: inputs.sideSlope,
    diameter: inputs.diameter
  });
  const targetQ = Math.max(0.0001, inputs.targetDischarge);
  const n = Math.max(0.001, inputs.manningN);

  // Q = (k/n) * A * R^(2/3) * S^(1/2)
  // S = ( Q * n / (k * A * R^(2/3)) )^2
  const denominator = (kManning / n) * geom.area * Math.pow(geom.hydraulicRadius, 2 / 3);
  const S = Math.pow(targetQ / Math.max(0.0001, denominator), 2);
  return S;
}

/**
 * Solves for critical depth y_c where Froude number Fr = 1.0:
 * Q² * T / (g * A³) = 1  =>  Q² * T - g * A³ = 0
 */
export function calculateCriticalDepth(
  shape: ChannelShape,
  discharge: number,
  params: {
    bottomWidth: number;
    sideSlope: number;
    diameter: number;
  },
  g: number
): number {
  const Q = Math.max(0.0001, discharge);

  // Exact formulas for simple shapes:
  if (shape === 'rectangular') {
    const q = Q / params.bottomWidth; // unit discharge
    return Math.cbrt((q * q) / g);
  } else if (shape === 'triangular') {
    // Q² * (2 z y) / (g * (z y²)³) = 1 => 2 Q² / (g * z² * y⁵) = 1 => y⁵ = 2 Q² / (g z²)
    const z = Math.max(0.001, params.sideSlope);
    return Math.pow((2 * Q * Q) / (g * z * z), 0.2);
  }

  // Newton-Raphson for trapezoidal and circular
  let y = shape === 'circular' ? Math.min(params.diameter * 0.9, 0.5 * params.diameter) : 1.0;
  for (let i = 0; i < 30; i++) {
    const geom = calculateGeometry(shape, y, params);
    const f = (Q * Q * geom.topWidth) / (g * Math.pow(geom.area, 3)) - 1.0;
    if (Math.abs(f) < 1e-4) break;

    const dy = 0.0005;
    const geomNext = calculateGeometry(shape, y + dy, params);
    const fNext = (Q * Q * geomNext.topWidth) / (g * Math.pow(geomNext.area, 3)) - 1.0;
    const df = (fNext - f) / dy;
    if (Math.abs(df) < 1e-10) break;

    let yNext = y - f / df;
    if (shape === 'circular') {
      yNext = Math.max(0.01, Math.min(params.diameter * 0.99, yNext));
    } else {
      yNext = Math.max(0.01, yNext);
    }
    if (Math.abs(yNext - y) < 1e-4) {
      y = yNext;
      break;
    }
    y = yNext;
  }
  return y;
}

/**
 * Main calculation engine: computes all hydraulic parameters,
 * Manning vs Chezy comparison, regime, energy, and shear stress.
 */
export function calculateHydraulics(inputs: ChannelInputs): HydraulicResults {
  const { kManning, g, gamma } = getUnitConstants(inputs.unitSystem);

  let activeDepth = inputs.depth;
  let activeSlope = inputs.bedSlope;
  let solvedDepthVal: number | undefined;
  let solvedSlopeVal: number | undefined;
  let iterations: number | undefined;

  if (inputs.calculationMode === 'normal_depth') {
    const res = solveNormalDepth(inputs);
    activeDepth = res.solvedDepth;
    solvedDepthVal = res.solvedDepth;
    iterations = res.iterations;
  } else if (inputs.calculationMode === 'slope') {
    activeSlope = solveRequiredSlope(inputs);
    solvedSlopeVal = activeSlope;
  }

  const geom = calculateGeometry(inputs.shape, activeDepth, {
    bottomWidth: inputs.bottomWidth,
    sideSlope: inputs.sideSlope,
    diameter: inputs.diameter
  });

  const S = Math.max(1e-8, activeSlope);
  const n = Math.max(0.001, inputs.manningN);
  const R = geom.hydraulicRadius;
  const A = geom.area;

  // 1. Manning's Equation:
  // V = (k / n) * R^(2/3) * S^(1/2)
  // Q = V * A
  const manningVelocity = (kManning / n) * Math.pow(R, 2 / 3) * Math.sqrt(S);
  const manningDischarge = manningVelocity * A;

  // 2. Chezy's Equation:
  // V = C * sqrt(R * S)
  // Q = V * A
  // Chezy's C relationship from Manning: C = (k / n) * R^(1/6)
  let chezyC = inputs.customChezyC;
  if (inputs.chezyInputMode === 'calculate_from_manning') {
    chezyC = (kManning / n) * Math.pow(R, 1 / 6);
  }
  const chezyVelocity = chezyC * Math.sqrt(R * S);
  const chezyDischarge = chezyVelocity * A;

  // Percentage difference
  const dischargeDeltaPercent = manningDischarge > 0
    ? ((manningDischarge - chezyDischarge) / manningDischarge) * 100
    : 0;

  // Froude Number: Fr = V / sqrt(g * D_h)
  const D_h = geom.hydraulicDepth;
  const froudeNumber = manningVelocity / Math.sqrt(g * D_h);

  let flowRegime: 'Subcritical' | 'Critical' | 'Supercritical' = 'Subcritical';
  if (Math.abs(froudeNumber - 1.0) < 0.02) {
    flowRegime = 'Critical';
  } else if (froudeNumber > 1.0) {
    flowRegime = 'Supercritical';
  }

  // Specific Energy: E = y + V² / (2g)
  const specificEnergy = activeDepth + Math.pow(manningVelocity, 2) / (2 * g);

  // Critical Depth and Critical Velocity
  const criticalDepth = calculateCriticalDepth(
    inputs.shape,
    manningDischarge,
    {
      bottomWidth: inputs.bottomWidth,
      sideSlope: inputs.sideSlope,
      diameter: inputs.diameter
    },
    g
  );

  const geomCrit = calculateGeometry(inputs.shape, criticalDepth, {
    bottomWidth: inputs.bottomWidth,
    sideSlope: inputs.sideSlope,
    diameter: inputs.diameter
  });
  const criticalVelocity = manningDischarge / Math.max(0.0001, geomCrit.area);

  // Boundary Shear Stress: τ_0 = γ * R * S
  const shearStress = gamma * R * S;

  return {
    area: A,
    wettedPerimeter: geom.wettedPerimeter,
    hydraulicRadius: R,
    topWidth: geom.topWidth,
    hydraulicDepth: D_h,
    manningVelocity,
    manningDischarge,
    chezyC,
    chezyVelocity,
    chezyDischarge,
    dischargeDeltaPercent,
    froudeNumber,
    flowRegime,
    specificEnergy,
    criticalDepth,
    criticalVelocity,
    shearStress,
    solvedDepth: solvedDepthVal,
    solvedSlope: solvedSlopeVal,
    iterationsCount: iterations
  };
}

/**
 * Generates data points for Stage-Discharge (Rating curve),
 * Velocity curve, and Specific Energy curves.
 */
export function generateHydraulicCurves(inputs: ChannelInputs, pointsCount = 35): HydraulicCurvePoint[] {
  const { kManning, g } = getUnitConstants(inputs.unitSystem);
  const maxDepth = inputs.shape === 'circular'
    ? inputs.diameter * 0.98
    : Math.max(inputs.depth * 2.0, 2.0);

  const minDepth = 0.05 * (inputs.shape === 'circular' ? inputs.diameter : inputs.depth || 1.0);
  const step = (maxDepth - minDepth) / (pointsCount - 1);
  const n = Math.max(0.001, inputs.manningN);
  const S = Math.max(1e-8, inputs.bedSlope);

  const points: HydraulicCurvePoint[] = [];

  for (let i = 0; i < pointsCount; i++) {
    const y = minDepth + i * step;
    const geom = calculateGeometry(inputs.shape, y, {
      bottomWidth: inputs.bottomWidth,
      sideSlope: inputs.sideSlope,
      diameter: inputs.diameter
    });

    const Vm = (kManning / n) * Math.pow(geom.hydraulicRadius, 2 / 3) * Math.sqrt(S);
    const Qm = Vm * geom.area;

    let C = inputs.customChezyC;
    if (inputs.chezyInputMode === 'calculate_from_manning') {
      C = (kManning / n) * Math.pow(geom.hydraulicRadius, 1 / 6);
    }
    const Vc = C * Math.sqrt(geom.hydraulicRadius * S);
    const Qc = Vc * geom.area;

    const Fr = Vm / Math.sqrt(g * geom.hydraulicDepth);
    const E = y + Math.pow(Vm, 2) / (2 * g);

    points.push({
      depth: y,
      manningDischarge: Qm,
      chezyDischarge: Qc,
      velocity: Vm,
      specificEnergy: E,
      froudeNumber: Fr,
      area: geom.area,
      hydraulicRadius: geom.hydraulicRadius
    });
  }

  return points;
}

/**
 * Converts inputs seamlessly between SI and US Customary.
 */
export function convertInputsUnitSystem(inputs: ChannelInputs, targetUnit: UnitSystem): ChannelInputs {
  if (inputs.unitSystem === targetUnit) return inputs;

  const M_TO_FT = 3.28084;
  const FT_TO_M = 1 / M_TO_FT;
  const M3_TO_CFT = 35.3147;
  const CFT_TO_M3 = 1 / M3_TO_CFT;

  const factor = targetUnit === 'US' ? M_TO_FT : FT_TO_M;
  const qFactor = targetUnit === 'US' ? M3_TO_CFT : CFT_TO_M3;

  return {
    ...inputs,
    unitSystem: targetUnit,
    bottomWidth: parseFloat((inputs.bottomWidth * factor).toFixed(3)),
    depth: parseFloat((inputs.depth * factor).toFixed(3)),
    diameter: parseFloat((inputs.diameter * factor).toFixed(3)),
    targetDischarge: parseFloat((inputs.targetDischarge * qFactor).toFixed(3)),
    // Side slope z is dimensionless ratio H:V, bed slope S is dimensionless
    // Manning's n is traditionally treated as having the same nominal value across systems
    // while Chezy C scales by (ft/m)^(1/6) or ~1.22
    customChezyC: targetUnit === 'US'
      ? parseFloat((inputs.customChezyC * Math.pow(M_TO_FT, 1 / 6)).toFixed(2))
      : parseFloat((inputs.customChezyC * Math.pow(FT_TO_M, 1 / 6)).toFixed(2))
  };
}
