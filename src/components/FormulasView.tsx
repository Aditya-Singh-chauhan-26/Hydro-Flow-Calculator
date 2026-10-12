import React from 'react';
import { BookOpen, Calculator, Compass, Sparkles, CheckCircle2 } from 'lucide-react';

export const FormulasView: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* 1. Fundamental Hydrodynamic Balance */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-bold text-white">
            1. Theoretical Derivation of Uniform Open-Channel Flow
          </h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          In steady, uniform open-channel flow, water flows under gravity without acceleration.
          The downstream component of the fluid weight (<span className="font-mono text-cyan-300">W · sin θ ≈ γ · A · L · S</span>) is exactly balanced by the boundary shear resistance acting along the wetted perimeter (<span className="font-mono text-amber-300">τ₀ · P · L</span>):
        </p>

        <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 space-y-2">
          <div className="text-slate-400">Force Equilibrium:</div>
          <div className="pl-4">γ · A · L · S = τ₀ · P · L</div>
          <div className="pl-4">τ₀ = γ · (A / P) · S = γ · R · S</div>
          <div className="text-slate-400 mt-2">
            where <span className="text-cyan-300">R = A / P</span> is the Hydraulic Radius, and <span className="text-amber-300">S</span> is the energy/bed slope.
          </div>
        </div>
      </div>

      {/* 2. Chezy & Manning Formulations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Chezy */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3">
          <h4 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            2. Chezy's Equation (1775)
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Assuming boundary shear stress is proportional to the square of velocity (<span className="font-mono">τ₀ = K · ρ · V²</span>):
          </p>
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-xs font-mono text-cyan-300">
            V = C · √(R · S)<br />
            Q = A · C · √(R · S)
          </div>
          <p className="text-xs text-slate-400">
            Here, <span className="font-mono text-slate-200">C</span> is Chezy's coefficient (dimensions: L½/T).
          </p>
        </div>

        {/* Manning */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3">
          <h4 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            3. Manning's Equation (1889)
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Manning correlated velocity with the 2/3 power of hydraulic radius and 1/2 power of slope:
          </p>
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-xs font-mono text-cyan-300">
            V = (k / n) · R^(2/3) · S^(1/2)<br />
            Q = (k / n) · A · R^(2/3) · S^(1/2)
          </div>
          <p className="text-xs text-slate-400">
            <span className="font-mono text-slate-200">k = 1.0</span> (SI units) and <span className="font-mono text-slate-200">k = 1.486 ≈ (3.28084)^(1/3)</span> (US Customary units).
          </p>
        </div>
      </div>

      {/* 3. Equivalence & Transition */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <Compass className="w-4 h-4 text-cyan-400" />
          4. Relation Between Chezy's C and Manning's n
        </h4>
        <p className="text-xs text-slate-300 leading-relaxed">
          By equating the velocities from both formulas:
        </p>
        <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 space-y-1">
          <div>C · √(R · S) = (k / n) · R^(2/3) · S^(1/2)</div>
          <div>C · R^(1/2) = (k / n) · R^(2/3)</div>
          <div className="text-cyan-400 font-bold text-sm pt-1">
            C = (k / n) · R^(1/6)
          </div>
        </div>
        <p className="text-xs text-slate-400">
          This proves that Chezy's <span className="font-mono text-slate-200">C</span> depends on the hydraulic radius <span className="font-mono text-slate-200">R^(1/6)</span>. As the flow depth and radius increase, Chezy's resistance factor increases.
        </p>
      </div>

      {/* 4. Cross-Section Geometric Formulas Summary */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
        <h4 className="text-sm font-bold text-white">
          5. Geometric Properties by Cross-Section
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-1">
            <span className="text-cyan-400 font-semibold block">Rectangular Channel</span>
            <div>Area: A = b · y</div>
            <div>Wetted Perimeter: P = b + 2y</div>
            <div>Top Width: T = b</div>
            <div>Hydraulic Radius: R = (b · y) / (b + 2y)</div>
          </div>

          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-1">
            <span className="text-cyan-400 font-semibold block">Trapezoidal Channel (Side slope z:1)</span>
            <div>Area: A = (b + z·y) · y</div>
            <div>Wetted Perimeter: P = b + 2y · √(1 + z²)</div>
            <div>Top Width: T = b + 2z·y</div>
            <div>Hydraulic Radius: R = A / P</div>
          </div>

          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-1">
            <span className="text-cyan-400 font-semibold block">Triangular Channel</span>
            <div>Area: A = z · y²</div>
            <div>Wetted Perimeter: P = 2y · √(1 + z²)</div>
            <div>Top Width: T = 2z·y</div>
            <div>Hydraulic Radius: R = (z · y) / (2 · √(1 + z²))</div>
          </div>

          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-1">
            <span className="text-cyan-400 font-semibold block">Circular Pipe (Partially Full)</span>
            <div>Angle: θ = 2 · arccos(1 - 2y/D)</div>
            <div>Area: A = (D² / 8) · (θ - sin θ)</div>
            <div>Wetted Perimeter: P = (D · θ) / 2</div>
            <div>Top Width: T = D · sin(θ / 2)</div>
          </div>
        </div>
      </div>

      {/* 5. Newton-Raphson Solver Method */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          6. Automated Newton-Raphson Iterative Normal Depth Solver
        </h4>
        <p className="text-xs text-slate-300 leading-relaxed">
          Because Manning's equation is nonlinear with respect to depth <span className="font-mono">y</span>, finding normal depth <span className="font-mono">y_n</span> for a given discharge <span className="font-mono">Q</span> requires numerical root finding:
        </p>
        <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 space-y-1">
          <div>f(y) = (k / n) · A(y) · [R(y)]^(2/3) · S^(1/2) - Q_target = 0</div>
          <div>y_(i+1) = y_i - f(y_i) / f'(y_i)</div>
        </div>
        <p className="text-xs text-slate-400">
          The Python calculation tool uses this algorithm to converge within 3 to 7 iterations with a tolerance of <span className="font-mono">10⁻⁵</span>.
        </p>
      </div>
    </div>
  );
};
