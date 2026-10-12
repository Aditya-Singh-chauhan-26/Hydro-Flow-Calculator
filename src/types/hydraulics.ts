export type ChannelShape = 'rectangular' | 'trapezoidal' | 'triangular' | 'circular';

export type UnitSystem = 'SI' | 'US';

export type CalculationMode = 'forward' | 'normal_depth' | 'slope';

export interface ChannelInputs {
  shape: ChannelShape;
  unitSystem: UnitSystem;
  calculationMode: CalculationMode;
  
  // Geometric parameters (in current unit: m or ft)
  bottomWidth: number; // b (m or ft) - for rectangular, trapezoidal
  depth: number;       // y (m or ft) - water depth
  sideSlope: number;   // z (horizontal per 1 vertical, e.g., 1.5:1 -> z=1.5)
  diameter: number;    // D (m or ft) - for circular channel / pipe
  
  // Hydraulic slope
  bedSlope: number;    // S (dimensionless or m/m, ft/ft, e.g., 0.001)
  
  // Roughness parameters
  manningN: number;    // Manning's n (e.g., 0.013 for smooth concrete)
  chezyInputMode: 'calculate_from_manning' | 'custom_chezy';
  customChezyC: number;// Chezy's C (m^(1/2)/s or ft^(1/2)/s)
  
  // Inverse calculation inputs
  targetDischarge: number; // Q required (m3/s or cfs)
}

export interface HydraulicResults {
  // Geometric outputs
  area: number;             // A (m² or ft²)
  wettedPerimeter: number;  // P (m or ft)
  hydraulicRadius: number;  // R = A/P (m or ft)
  topWidth: number;         // T (m or ft)
  hydraulicDepth: number;   // D_h = A/T (m or ft)
  
  // Manning calculations
  manningVelocity: number;  // V_m (m/s or ft/s)
  manningDischarge: number; // Q_m (m³/s or cfs)
  
  // Chezy calculations
  chezyC: number;           // C (m^(1/2)/s or ft^(1/2)/s)
  chezyVelocity: number;   // V_c (m/s or ft/s)
  chezyDischarge: number;  // Q_c (m³/s or cfs)
  
  // Comparison
  dischargeDeltaPercent: number; // (Q_m - Q_c) / Q_m * 100
  
  // Flow regime & energy
  froudeNumber: number;     // Fr
  flowRegime: 'Subcritical' | 'Critical' | 'Supercritical';
  specificEnergy: number;   // E = y + V² / (2g) (m or ft)
  criticalDepth: number;    // y_c (m or ft)
  criticalVelocity: number; // V_c (m/s or ft/s)
  shearStress: number;      // τ_0 = γ * R * S (Pa or lb/ft²)
  
  // Normal depth solving info (if normal_depth mode)
  solvedDepth?: number;
  iterationsCount?: number;
  
  // Solved slope info (if slope mode)
  solvedSlope?: number;
}

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  field?: keyof ChannelInputs;
}

export interface RoughnessPreset {
  name: string;
  material: string;
  n: number;
  description: string;
}

export interface HydraulicCurvePoint {
  depth: number;
  manningDischarge: number;
  chezyDischarge: number;
  velocity: number;
  specificEnergy: number;
  froudeNumber: number;
  area: number;
  hydraulicRadius: number;
}
