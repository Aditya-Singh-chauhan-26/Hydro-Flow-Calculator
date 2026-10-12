import { ChannelInputs } from '../types/hydraulics';

export function generatePythonScript(inputs: ChannelInputs): string {
  const isSI = inputs.unitSystem === 'SI';
  const unitL = isSI ? 'm' : 'ft';
  const unitQ = isSI ? 'm³/s' : 'ft³/s (cfs)';
  const unitV = isSI ? 'm/s' : 'ft/s';
  const kManning = isSI ? 1.0 : 1.486;
  const g = isSI ? 9.80665 : 32.174;

  return `"""
================================================================================
HydroFlow: Flow Rate Calculation Tool Using Chezy's and Manning's Equations
Academic College Project - Open Channel Hydraulics Analysis
================================================================================
Author: Hydraulic Engineering Student
Language: Python 3
Modules: math, sys, dataclasses
================================================================================
"""

import math
from dataclasses import dataclass
from typing import Dict, Any, Tuple, List


# ------------------------------------------------------------------------------
# 1. CHANNEL GEOMETRY CLASSES
# ------------------------------------------------------------------------------

@dataclass
class GeometricProperties:
    area: float             # A (cross-sectional area)
    wetted_perimeter: float # P (wetted perimeter)
    hydraulic_radius: float # R = A / P
    top_width: float        # T (free surface top width)
    hydraulic_depth: float  # D_h = A / T


class ChannelSection:
    """Base abstract representation of an open-channel cross-section."""
    def compute_geometry(self, depth: float) -> GeometricProperties:
        raise NotImplementedError("Subclasses must implement compute_geometry")


class RectangularChannel(ChannelSection):
    """
    Rectangular Channel:
    Area: A = b * y
    Perimeter: P = b + 2y
    Top width: T = b
    """
    def __init__(self, bottom_width: float):
        if bottom_width <= 0:
            raise ValueError("Bottom width 'b' must be > 0.")
        self.b = bottom_width

    def compute_geometry(self, depth: float) -> GeometricProperties:
        y = max(1e-5, depth)
        A = self.b * y
        P = self.b + 2.0 * y
        R = A / P
        T = self.b
        return GeometricProperties(
            area=A,
            wetted_perimeter=P,
            hydraulic_radius=R,
            top_width=T,
            hydraulic_depth=A / T
        )


class TrapezoidalChannel(ChannelSection):
    """
    Trapezoidal Channel:
    Area: A = (b + z * y) * y
    Perimeter: P = b + 2 * y * sqrt(1 + z^2)
    Top width: T = b + 2 * z * y
    """
    def __init__(self, bottom_width: float, side_slope: float):
        if bottom_width <= 0:
            raise ValueError("Bottom width 'b' must be > 0.")
        if side_slope < 0:
            raise ValueError("Side slope 'z' cannot be negative.")
        self.b = bottom_width
        self.z = side_slope

    def compute_geometry(self, depth: float) -> GeometricProperties:
        y = max(1e-5, depth)
        A = (self.b + self.z * y) * y
        P = self.b + 2.0 * y * math.sqrt(1.0 + self.z ** 2)
        R = A / P
        T = self.b + 2.0 * self.z * y
        return GeometricProperties(
            area=A,
            wetted_perimeter=P,
            hydraulic_radius=R,
            top_width=T,
            hydraulic_depth=A / T
        )


class TriangularChannel(ChannelSection):
    """
    Triangular / V-Notch Channel:
    Area: A = z * y^2
    Perimeter: P = 2 * y * sqrt(1 + z^2)
    Top width: T = 2 * z * y
    """
    def __init__(self, side_slope: float):
        if side_slope <= 0:
            raise ValueError("Side slope 'z' must be > 0.")
        self.z = side_slope

    def compute_geometry(self, depth: float) -> GeometricProperties:
        y = max(1e-5, depth)
        A = self.z * (y ** 2)
        P = 2.0 * y * math.sqrt(1.0 + self.z ** 2)
        R = A / P
        T = 2.0 * self.z * y
        return GeometricProperties(
            area=A,
            wetted_perimeter=P,
            hydraulic_radius=R,
            top_width=T,
            hydraulic_depth=A / T
        )


class CircularChannel(ChannelSection):
    """
    Circular Conduit / Culvert (Partially full pipe under gravity flow):
    Central angle: theta = 2 * acos(1 - 2*y/D)
    Area: A = (D^2 / 8) * (theta - sin(theta))
    Perimeter: P = (D * theta) / 2
    """
    def __init__(self, diameter: float):
        if diameter <= 0:
            raise ValueError("Conduit diameter 'D' must be > 0.")
        self.D = diameter

    def compute_geometry(self, depth: float) -> GeometricProperties:
        y = max(1e-5, min(depth, self.D * 0.9999))
        ratio = y / self.D
        # Central angle in radians
        cos_val = max(-1.0, min(1.0, 1.0 - 2.0 * ratio))
        theta = 2.0 * math.acos(cos_val)

        A = (self.D ** 2 / 8.0) * (theta - math.sin(theta))
        P = (self.D * theta) / 2.0
        P = max(1e-5, P)
        R = A / P
        T = max(1e-5, self.D * math.sin(theta / 2.0))
        return GeometricProperties(
            area=A,
            wetted_perimeter=P,
            hydraulic_radius=R,
            top_width=T,
            hydraulic_depth=A / T
        )


# ------------------------------------------------------------------------------
# 2. HYDRAULIC EQUATIONS SOLVER (Manning & Chezy)
# ------------------------------------------------------------------------------

class HydraulicFlowCalculator:
    """
    Solves open-channel flow rate using Manning's and Chezy's formulations.
    Includes unit conversions, critical depth, Froude number, and Newton-Raphson solvers.
    """
    def __init__(self, unit_system: str = '${inputs.unitSystem}'):
        self.unit_system = unit_system.upper()
        if self.unit_system == 'SI':
            self.k_manning = 1.0        # SI conversion factor
            self.g = 9.80665            # m/s^2
            self.gamma = 9806.65        # N/m^3 unit weight of water
            self.unit_L = 'm'
            self.unit_Q = 'm³/s'
            self.unit_V = 'm/s'
            self.unit_shear = 'Pa'
        else:
            self.k_manning = 1.486      # US Customary conversion factor
            self.g = 32.174             # ft/s^2
            self.gamma = 62.4           # lb/ft^3
            self.unit_L = 'ft'
            self.unit_Q = 'ft³/s (cfs)'
            self.unit_V = 'ft/s'
            self.unit_shear = 'lb/ft²'

    def calculate_flow(
        self,
        channel: ChannelSection,
        depth: float,
        bed_slope: float,
        manning_n: float,
        custom_chezy_c: float = None
    ) -> Dict[str, Any]:
        """
        Executes automated forward calculations for both Manning and Chezy equations.
        """
        # Input Validation
        if depth <= 0:
            raise ValueError("Depth 'y' must be positive.")
        if bed_slope <= 0:
            raise ValueError("Bed slope 'S' must be positive.")
        if manning_n <= 0:
            raise ValueError("Manning's 'n' must be positive.")

        geom = channel.compute_geometry(depth)
        R = geom.hydraulic_radius
        A = geom.area
        S = bed_slope

        # --- Manning's Equation ---
        # V = (k / n) * R^(2/3) * S^(1/2)
        # Q = V * A
        v_manning = (self.k_manning / manning_n) * (R ** (2.0 / 3.0)) * math.sqrt(S)
        q_manning = v_manning * A

        # --- Chezy's Equation ---
        # V = C * sqrt(R * S)
        # Q = V * A
        # Relationship: C = (k / n) * R^(1/6)
        if custom_chezy_c is not None and custom_chezy_c > 0:
            c_chezy = custom_chezy_c
        else:
            c_chezy = (self.k_manning / manning_n) * (R ** (1.0 / 6.0))

        v_chezy = c_chezy * math.sqrt(R * S)
        q_chezy = v_chezy * A

        # Difference
        diff_pct = ((q_manning - q_chezy) / q_manning) * 100.0 if q_manning > 0 else 0.0

        # --- Froude Number & Regime ---
        # Fr = V / sqrt(g * D_h)
        froude = v_manning / math.sqrt(self.g * geom.hydraulic_depth)
        if abs(froude - 1.0) < 0.02:
            regime = "Critical"
        elif froude > 1.0:
            regime = "Supercritical (Rapid / Shooting Flow)"
        else:
            regime = "Subcritical (Tranquil / Streaming Flow)"

        # --- Specific Energy ---
        # E = y + V^2 / (2g)
        specific_energy = depth + (v_manning ** 2) / (2.0 * self.g)

        # --- Boundary Shear Stress (Tractive Force) ---
        # tau_0 = gamma * R * S
        shear_stress = self.gamma * R * S

        return {
            "geometry": {
                "area": round(A, 4),
                "wetted_perimeter": round(geom.wetted_perimeter, 4),
                "hydraulic_radius": round(R, 4),
                "top_width": round(geom.top_width, 4),
                "hydraulic_depth": round(geom.hydraulic_depth, 4),
            },
            "manning": {
                "velocity": round(v_manning, 4),
                "discharge": round(q_manning, 4),
                "formula": f"Q = ({self.k_manning}/n) * A * R^(2/3) * S^(1/2)"
            },
            "chezy": {
                "coefficient_C": round(c_chezy, 3),
                "velocity": round(v_chezy, 4),
                "discharge": round(q_chezy, 4),
                "formula": "Q = C * A * sqrt(R * S)"
            },
            "comparison": {
                "delta_percentage": round(diff_pct, 3),
                "manning_to_chezy_ratio": round(q_manning / q_chezy, 4) if q_chezy else 1.0
            },
            "hydraulics": {
                "froude_number": round(froude, 4),
                "flow_regime": regime,
                "specific_energy": round(specific_energy, 4),
                "boundary_shear_stress": round(shear_stress, 3),
            }
        }

    def solve_normal_depth_newton_raphson(
        self,
        channel: ChannelSection,
        target_discharge: float,
        bed_slope: float,
        manning_n: float,
        tol: float = 1e-5,
        max_iter: int = 50
    ) -> Tuple[float, int]:
        """
        Solves for normal depth (y_n) using Newton-Raphson numerical iteration:
        f(y) = (k/n) * A(y) * R(y)^(2/3) * S^(1/2) - Q_target = 0
        """
        y = 1.0
        factor = (self.k_manning / manning_n) * math.sqrt(bed_slope)

        for i in range(max_iter):
            geom = channel.compute_geometry(y)
            q_curr = factor * geom.area * (geom.hydraulic_radius ** (2.0 / 3.0))
            f = q_curr - target_discharge

            if abs(f) < tol:
                return round(y, 4), i + 1

            # Numerical derivative approximation df/dy
            dy = 0.0001
            geom_next = channel.compute_geometry(y + dy)
            q_next = factor * geom_next.area * (geom_next.hydraulic_radius ** (2.0 / 3.0))
            df = (q_next - q_curr) / dy

            if abs(df) < 1e-12:
                break

            y_new = y - f / df
            y = max(0.01, y_new)

        return round(y, 4), max_iter


# ------------------------------------------------------------------------------
# 3. DEMONSTRATION & VERIFICATION RUNNER
# ------------------------------------------------------------------------------

def main():
    print("=" * 76)
    print(" HYDROFLOW: OPEN-CHANNEL HYDRAULICS ENGINE (PYTHON)")
    print(" Equations: Chezy (1775) & Manning (1889)")
    print("=" * 76)

    # Instantiate Solver with current settings
    calculator = HydraulicFlowCalculator(unit_system="${inputs.unitSystem}")

    # Build active channel
    channel_shape = "${inputs.shape}"
    print(f"\\n[*] Channel Configuration: {channel_shape.upper()} SECTION")
    print(f"[*] Unit System: ${inputs.unitSystem} (${unitL}, ${unitQ}, ${unitV})")

    if channel_shape == 'rectangular':
        channel = RectangularChannel(bottom_width=${inputs.bottomWidth})
        print(f"    - Bottom Width (b): ${inputs.bottomWidth} ${unitL}")
    elif channel_shape == 'trapezoidal':
        channel = TrapezoidalChannel(bottom_width=${inputs.bottomWidth}, side_slope=${inputs.sideSlope})
        print(f"    - Bottom Width (b): ${inputs.bottomWidth} ${unitL}")
        print(f"    - Side Slope (z):   ${inputs.sideSlope} (1V : {${inputs.sideSlope}}H)")
    elif channel_shape == 'triangular':
        channel = TriangularChannel(side_slope=${inputs.sideSlope})
        print(f"    - Side Slope (z):   ${inputs.sideSlope} (1V : {${inputs.sideSlope}}H)")
    elif channel_shape == 'circular':
        channel = CircularChannel(diameter=${inputs.diameter})
        print(f"    - Pipe Diameter (D): ${inputs.diameter} ${unitL}")

    depth = ${inputs.depth}
    bed_slope = ${inputs.bedSlope}
    manning_n = ${inputs.manningN}
    custom_c = ${inputs.chezyInputMode === 'custom_chezy' ? inputs.customChezyC : 'None'}

    print(f"    - Flow Depth (y):   {depth} ${unitL}")
    print(f"    - Bed Slope (S):    {bed_slope:.6f}")
    print(f"    - Manning's n:      {manning_n}")
    if custom_c:
        print(f"    - Chezy's C (user): {custom_c}")

    # Compute Forward
    results = calculator.calculate_flow(
        channel=channel,
        depth=depth,
        bed_slope=bed_slope,
        manning_n=manning_n,
        custom_chezy_c=custom_c
    )

    geom = results["geometry"]
    manning = results["manning"]
    chezy = results["chezy"]
    hyd = results["hydraulics"]

    print("\\n" + "-" * 76)
    print(" RESULTS SUMMARY")
    print("-" * 76)
    print(f"  Cross-Sectional Area (A) : {geom['area']:>10.4f} ${isSI ? 'm²' : 'ft²'}")
    print(f"  Wetted Perimeter (P)     : {geom['wetted_perimeter']:>10.4f} ${unitL}")
    print(f"  Hydraulic Radius (R)     : {geom['hydraulic_radius']:>10.4f} ${unitL}")
    print(f"  Top Surface Width (T)    : {geom['top_width']:>10.4f} ${unitL}")
    print(f"  Hydraulic Depth (D_h)    : {geom['hydraulic_depth']:>10.4f} ${unitL}")
    print("-" * 76)
    print(f"  MANNING'S EQUATION:")
    print(f"    Mean Velocity (V_m)    : {manning['velocity']:>10.4f} ${unitV}")
    print(f"    Flow Rate / Discharge  : {manning['discharge']:>10.4f} ${unitQ}")
    print(f"  CHEZY'S EQUATION:")
    print(f"    Chezy Coefficient (C)  : {chezy['coefficient_C']:>10.3f}")
    print(f"    Mean Velocity (V_c)    : {chezy['velocity']:>10.4f} ${unitV}")
    print(f"    Flow Rate / Discharge  : {chezy['discharge']:>10.4f} ${unitQ}")
    print(f"  DISCHARGE DISCREPANCY    : {results['comparison']['delta_percentage']:>10.3f} %")
    print("-" * 76)
    print(f"  Froude Number (Fr)       : {hyd['froude_number']:>10.4f}")
    print(f"  Flow Regime              : {hyd['flow_regime']}")
    print(f"  Specific Energy (E)      : {hyd['specific_energy']:>10.4f} ${unitL}")
    print(f"  Boundary Shear (τ_0)     : {hyd['boundary_shear_stress']:>10.3f} ${isSI ? 'Pa' : 'psf'}")
    print("=" * 76)

    # Inverse Problem Demo: Normal Depth
    target_q = ${inputs.targetDischarge}
    y_norm, iters = calculator.solve_normal_depth_newton_raphson(
        channel=channel,
        target_discharge=target_q,
        bed_slope=bed_slope,
        manning_n=manning_n
    )
    print(f"\\n[*] Inverse Problem (Newton-Raphson Solver):")
    print(f"    Target Discharge (Q)   : {target_q} ${unitQ}")
    print(f"    Solved Normal Depth (yn): {y_norm} ${unitL} (converged in {iters} iterations)")
    print("=" * 76)


if __name__ == "__main__":
    main()
`;
}

export function generateJupyterNotebook(inputs: ChannelInputs): string {
  const script = generatePythonScript(inputs);
  const notebook = {
    cells: [
      {
        cell_type: "markdown",
        metadata: {},
        source: [
          "# College Project: Flow Rate Calculation Tool Using Chezy's & Manning's Equations\\n",
          "\\n",
          "### Theoretical Overview\\n",
          "Open-channel flow is liquid flow with a free surface open to atmospheric pressure. The two foundational empirical relationships governing uniform flow are:\\n",
          "\\n",
          "1. **Chezy's Equation (1775)**:\\n",
          "   $$V = C \\sqrt{R S}$$\\n",
          "   $$Q = A C \\sqrt{R S}$$\\n",
          "\\n",
          "2. **Manning's Equation (1889)**:\\n",
          "   $$V = \\frac{k}{n} R^{2/3} S^{1/2}$$\\n",
          "   $$Q = \\frac{k}{n} A R^{2/3} S^{1/2}$$\\n",
          "   where $k = 1.0$ in SI units and $k = 1.486$ in US Customary units.\\n",
          "\\n",
          "3. **Relationship between Manning's $n$ and Chezy's $C$**:\\n",
          "   Equating both velocity formulations yields:\\n",
          "   $$C = \\frac{k}{n} R^{1/6}$$\\n",
          "   This demonstrates that Chezy's resistance factor $C$ is not purely constant, but grows mildly with the hydraulic radius $R^{1/6}$.\\n"
        ]
      },
      {
        cell_type: "code",
        execution_count: 1,
        metadata: {},
        outputs: [],
        source: [
          script
        ]
      },
      {
        cell_type: "markdown",
        metadata: {},
        source: [
          "### Rating Curve Plotting with Matplotlib\\n",
          "The cell below plots the Stage-Discharge rating curve comparing Manning's and Chezy's formulas.\\n"
        ]
      },
      {
        cell_type: "code",
        execution_count: 2,
        metadata: {},
        outputs: [],
        source: [
          "import matplotlib.pyplot as plt\n",
          "import numpy as np\n\n",
          "depths = np.linspace(0.1, 2.5, 40)\n",
          "q_manning = []\n",
          "q_chezy = []\n\n",
          "calc = HydraulicFlowCalculator(unit_system='" + inputs.unitSystem + "')\n",
          "chan = TrapezoidalChannel(bottom_width=" + inputs.bottomWidth + ", side_slope=" + inputs.sideSlope + ") if '" + inputs.shape + "' == 'trapezoidal' else RectangularChannel(bottom_width=" + inputs.bottomWidth + ")\n\n",
          "for d in depths:\n",
          "    res = calc.calculate_flow(chan, depth=d, bed_slope=" + inputs.bedSlope + ", manning_n=" + inputs.manningN + ")\n",
          "    q_manning.append(res['manning']['discharge'])\n",
          "    q_chezy.append(res['chezy']['discharge'])\n\n",
          "plt.figure(figsize=(9, 5))\n",
          "plt.plot(q_manning, depths, label=\"Manning's Equation\", color='#06B6D4', lw=2)\n",
          "plt.plot(q_chezy, depths, '--', label=\"Chezy's Equation\", color='#F59E0B', lw=2)\n",
          "plt.title(\"Open Channel Stage-Discharge Rating Curve (Q vs y)\")\n",
          "plt.xlabel(\"Flow Rate Q (" + (inputs.unitSystem === 'SI' ? 'm³/s' : 'cfs') + ")\")\n",
          "plt.ylabel(\"Water Depth y (" + (inputs.unitSystem === 'SI' ? 'm' : 'ft') + ")\")\n",
          "plt.grid(True, linestyle=':', alpha=0.6)\n",
          "plt.legend()\n",
          "plt.show()\n"
        ]
      }
    ],
    metadata: {
      language_info: {
        name: "python",
        version: "3.10"
      }
    },
    nbformat: 4,
    nbformat_minor: 4
  };

  return JSON.stringify(notebook, null, 2);
}
