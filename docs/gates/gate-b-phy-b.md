# Gate B: Physics, part B (custom pages and P2 pages)

**For:** Luca (delegated to the orchestrator overnight) · **Written:** 25 November 2026 · **Task:** W1-SPEC-phy, part B

Part A (the other Physics spec writer) covers the remaining Physics pages in its own gate file. This file covers the five P1 custom pages, whose specs also define their Wave 2 engines, and the six P2 pages.

## How to check (about 10 minutes)

For each line: is the goal right for the syllabus, are the numbers believable, and would the prompts make students think? Open the spec for the ranges and prompts. Every acceptance number has its formula and hand working in the spec's Acceptance section and was re-checked with a short `node -e` script.

Constants used everywhere: h, c and e are the exact SI values; R = 1.097 × 10⁷ m⁻¹ (HSC data sheet value); μ₀ = 4π × 10⁻⁷ T m A⁻¹; g = 9.8 m/s².

## P1: custom pages (each spec defines its engine: params, outputs, formulas, sign conventions, timing, drawing)

| Spec | Learning goal | Key acceptance numbers |
| --- | --- | --- |
| [phy-bohr-spectra](../../specs/phy-bohr-spectra.md) | A jump between Bohr levels gives one line; λ from the Rydberg equation; series by lower level; de Broglie waves fit the orbits | Hα 3→2: **656.3355 nm**, 1.889 eV, 4.568 × 10¹⁴ Hz · Lyman α: 121.54 nm, 10.20 eV · absorption 1→3: 102.55 nm, ΔE = +12.09 eV · Paschen α: 1875.2 nm · r₃ = 4.763 × 10⁻¹⁰ m |
| [phy-photoelectric](../../specs/phy-photoelectric.md) | Frequency, not intensity, decides emission; KE_max = hf − φ = eV_s; h from the KE–f gradient | 400 nm on φ = 2.14 eV: hf **3.0996 eV**, KE_max **0.9596 eV**, V_s 0.9596 V, I 5.00 µA at 50% · −0.5 V: 4.790 µA · φ = 4.33 eV: f₀ 1.047 × 10¹⁵ Hz, λ₀ 286.34 nm, no current at 400 nm · v_max 5.810 × 10⁵ m/s |
| [phy-relativity](../../specs/phy-relativity.md) | Constant c forces a moving light clock to tick slow by γ; proper time; length contracts only along the motion; symmetric between frames | 0.6c: **γ = 1.25**, Δt₀ 10.007 ns → Δt 12.509 ns · 0.8c: 10 m → 6.00 m · 4 moving ticks at 0.8c: t = 66.713 ns, moving clock reads 40.028 ns, rest clock 6 ticks · 0.99c: γ = 7.0888 |
| [phy-motor-effect](../../specs/phy-motor-effect.md) | F = BIl sin θ; couple on a coil gives τ = nBIA cos θ (θ from B to the coil's plane, stated on stage); split ring vs slip rings | wire 0.2 T, 2 A, 0.1 m: **0.040 N** (0.020 N at 30°) · coil n 100, A 2 × 10⁻³ m²: τ_max **0.080 N m**, 0.040 at 60°, side force 2.0 N · at 120°: +0.040 split ring, −0.040 slip rings · slip rings, no friction: ω_max = √160 = 12.649 rad/s |
| [phy-induction](../../specs/phy-induction.md) | ε = −N dΦ/dt: emf only while flux changes, sign set by Lenz's law; ideal transformer turns ratio and power | dipole magnet, N 200, a 3 cm: Φ(0) **2.094 × 10⁻⁵ Wb**, ε = 0 at the centre · v 0.6 m/s: peak ε **71.93 mV** at x = a/2, reversed for south first · dropped 0.6 m: 0.3499 s, 3.429 m/s · 240 V, 1000:50, 6 Ω: **12 V, 2.0 A, 0.10 A**; η 80%: 0.125 A · DC: 0 V |

Engine change requests from P1: none (custom engines are built in Wave 2 from these specs).
