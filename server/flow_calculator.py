#!/usr/bin/env python3
import json
import math
import sys

def compute_geometry(shape, depth, b, z, d):
    y = max(1e-5, depth)
    b = max(1e-5, b)
    z = max(0.0, z)
    d = max(1e-5, d)

    if shape == 'rectangular':
        A = b * y
        P = b + 2.0 * y
        T = b
    elif shape == 'trapezoidal':
        A = (b + z * y) * y
        P = b + 2.0 * y * math.sqrt(1.0 + z * z)
        T = b + 2.0 * z * y
    elif shape == 'triangular':
        A = z * y * y
        P = 2.0 * y * math.sqrt(1.0 + z * z)
        T = 2.0 * z * y
    elif shape == 'circular':
        eff_y = min(y, d * 0.9999)
        ratio = eff_y / d
        theta = 2.0 * math.acos(max(-1.0, min(1.0, 1.0 - 2.0 * ratio)))
        A = (d * d / 8.0) * (theta - math.sin(theta))
        P = (d * theta) / 2.0
        T = max(1e-5, d * math.sin(theta / 2.0))
    else:
        A = b * y
        P = b + 2.0 * y
        T = b

    P = max(1e-5, P)
    R = A / P
    T = max(1e-5, T)
    D_h = A / T
    return A, P, R, T, D_h

def main():
    try:
        if len(sys.argv) > 1:
            raw_input = sys.argv[1]
            data = json.loads(raw_input)
        else:
            data = json.loads(sys.stdin.read())

        shape = data.get('shape', 'rectangular')
        unit_system = data.get('unitSystem', 'SI').upper()
        depth = float(data.get('depth', 1.0))
        b = float(data.get('bottomWidth', 2.0))
        z = float(data.get('sideSlope', 1.5))
        diameter = float(data.get('diameter', 1.5))
        bed_slope = float(data.get('bedSlope', 0.001))
        manning_n = float(data.get('manningN', 0.014))
        chezy_mode = data.get('chezyInputMode', 'calculate_from_manning')
        custom_c = float(data.get('customChezyC', 60.0))

        is_si = (unit_system == 'SI')
        k = 1.0 if is_si else 1.486
        g = 9.80665 if is_si else 32.174
        gamma = 9806.65 if is_si else 62.4

        A, P, R, T, D_h = compute_geometry(shape, depth, b, z, diameter)

        # Manning
        V_manning = (k / manning_n) * (R ** (2.0 / 3.0)) * math.sqrt(bed_slope)
        Q_manning = V_manning * A

        # Chezy
        if chezy_mode == 'custom_chezy' and custom_c > 0:
            C = custom_c
        else:
            C = (k / manning_n) * (R ** (1.0 / 6.0))

        V_chezy = C * math.sqrt(R * bed_slope)
        Q_chezy = V_chezy * A

        delta_pct = ((Q_manning - Q_chezy) / Q_manning * 100.0) if Q_manning > 0 else 0.0
        froude = V_manning / math.sqrt(g * D_h)
        regime = "Subcritical"
        if abs(froude - 1.0) < 0.02:
            regime = "Critical"
        elif froude > 1.0:
            regime = "Supercritical"

        specific_energy = depth + (V_manning ** 2) / (2.0 * g)
        shear_stress = gamma * R * bed_slope

        output = {
            "status": "success",
            "pythonVersion": sys.version.split()[0],
            "geometry": {
                "area": round(A, 4),
                "wettedPerimeter": round(P, 4),
                "hydraulicRadius": round(R, 4),
                "topWidth": round(T, 4),
                "hydraulicDepth": round(D_h, 4)
            },
            "manning": {
                "velocity": round(V_manning, 4),
                "discharge": round(Q_manning, 4),
                "formula": f"Q = ({k}/n) * A * R^(2/3) * S^(1/2)"
            },
            "chezy": {
                "coefficientC": round(C, 3),
                "velocity": round(V_chezy, 4),
                "discharge": round(Q_chezy, 4),
                "formula": "Q = C * A * sqrt(R * S)"
            },
            "comparison": {
                "deltaPercent": round(delta_pct, 3),
                "ratio": round(Q_manning / Q_chezy, 4) if Q_chezy > 0 else 1.0
            },
            "hydraulics": {
                "froudeNumber": round(froude, 4),
                "regime": regime,
                "specificEnergy": round(specific_energy, 4),
                "shearStress": round(shear_stress, 3)
            }
        }
        print(json.dumps(output))

    except Exception as e:
        print(json.dumps({"status": "error", "error": str(e)}))

if __name__ == '__main__':
    main()
