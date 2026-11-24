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
| [phy-motor-effect](../../specs/phy-motor-effect.md) | F = BIl sin θ; couple on a coil gives τ = nBIA cos θ (θ from B to the coil's plane, stated on stage); split ring vs slip rings | wire 0.2 T, 2 A, 0.1 m: **0.040 N** (0.020 N at 30°) · coil n 100, A 2 × 10⁻³ m²: τ_max **0.080 N m**, 0.040 at 60°, side force 2.0 N · at 120°: +0.040 split ring, −0.040 slip rings · J = 1.0 × 10⁻² kg m²: slip rings, no friction ω_max = √16 = **4 rad/s** · default turns 11 full times in 30 s (no stall); stall preset (b = 0.08 > 2√(nBIA·J) = 0.057) stops at 90° |
| [phy-induction](../../specs/phy-induction.md) | ε = −N dΦ/dt: emf only while flux changes, sign set by Lenz's law; ideal transformer turns ratio and power | dipole magnet, N 200, a 3 cm: Φ(0) **2.094 × 10⁻⁵ Wb**, ε = 0 at the centre · v 0.6 m/s: peak ε **71.93 mV** at x = a/2, reversed for south first · analytic peak at 1.5 m/s 179.8 mV · dropped from 10 cm: 2/7 s, 2.8 m/s; drop preset (5 cm) peaks −100.6 and +135.9 mV, 35% asymmetry · 240 V, 1000:50, 6 Ω: **12 V, 2.0 A, 0.10 A**; η 80%: 0.125 A · DC: 0 V |

Engine change requests from P1: none (custom engines are built in Wave 2 from these specs).

## P2 pages

| Spec | Learning goal | Key acceptance numbers |
| --- | --- | --- |
| [phy-binding-energy](../../specs/phy-binding-energy.md) (custom) | Mass defect → BE = Δmc²; BE/A curve; fusion and fission both climb towards the peak | AME2020 masses to 1 µu (27 nuclides in the spec): ⁴He Δm **0.030377 u**, BE 28.296 MeV, 7.0740 MeV/nucleon · ⁵⁶Fe 8.7904 · ⁶²Ni **8.7946** (the true peak) · ²³⁵U 7.5910 · Q: D–T **17.589 MeV**, D–D 3.2695 MeV, U-235 → Ba-141 + Kr-92 + 3n **173.277 MeV** |
| [phy-hr-diagram](../../specs/phy-hr-diagram.md) (custom) | Read the HR diagram; regions; size from L = 4πR²σT⁴; colour and class from Wien's law; the Sun's schematic future | Sun (IAU 2015: 5772 K, 3.828 × 10²⁶ W): R = 1 R☉ = **6.957 × 10⁸ m**, λ_max **502.04 nm** · 2886 K at 1 L☉: R = 4 · 3000 K at 10⁴ L☉: 370.18 R☉ · 25 000 K at 0.01 L☉: 0.00533 R☉. Star table (23 stars) carries a per-row source; only the Sun is checked; Sirius B uses Bond et al. 2017 (25 400 K, 0.0245 L☉, so R = 0.0081 R☉) |
| [phy-doppler-beats](../../specs/phy-doppler-beats.md) (wave) | f′ = f(v + v_o)/(v − v_s); wavefronts bunch ahead; beats at \|f₁ − f₂\| | 500 Hz source at 20 m/s: **531.25 Hz** (guide check), λ 0.64/0.72 m · observer at 20 m/s: 529.41 Hz · receding: 472.22 Hz, also heard after the source passes · beats 440 + 444 Hz: **4 Hz**, 0.25 s, pitch 442 Hz |
| [phy-heating-curves](../../specs/phy-heating-curves.md) (fnplot) | Q = mcΔT on slopes, Q = mL on plateaus; Newton's law of cooling (2017 only) | 0.5 kg, 500 W, −20 → 120 °C: melt **334 s**, boil **2256 s**, total 3091.2 s, **1 545 600 J** · T = 0 °C mid-melt · cooling 90 → 20 °C, k = 0.002 s⁻¹: t½ **346.57 s**, 20.47 °C after 5/k |
| [phy-magnetic-fields](../../specs/phy-magnetic-fields.md) (field2d) | Right-hand grip; B = μ₀I/2πr; loop and solenoid fields; superposition; force between wires | wire 5 A at 2 cm: **5.0 × 10⁻⁵ T** · two wires 5 A, 10 cm: 0 at midpoint (same) or 4.0 × 10⁻⁵ T (opposite), 5.0 × 10⁻⁵ N/m · loop N 10, 2 A, 5 cm: 2.513 × 10⁻⁴ T · solenoid μ₀NI/L **5.027 × 10⁻³ T**, finite coil centre 4.963 × 10⁻³ T · conductors have a 2 mm radius, so a probe on a loop winding reads a finite 2.067 × 10⁻⁴ T |
| [phy-work-energy-track](../../specs/phy-work-energy-track.md) (particle2d) | KE + GPE + work against friction = constant; speeds from energy | 2 kg from 5 m: GPE **98 J** · frictionless ramp: v = √98 = **9.8995 m/s** · μ = 0.1: stops on the runway with W = **98 J** · push start 4 m/s: √114 = 10.677 m/s |

## Engine change requests (P2)

- **wave / `doppler-beats`:** keys to reconcile. Taken from the in-progress `w1/engine-wave` worktree (not yet pushed); all seven checks were also run against that model and match. No new features.
- **particle2d / `track`:** keys to reconcile. Taken from the in-progress `w1/engine-particle2d` worktree; all five checks were run against that model and match. No new features.
- **fnplot / `heating`:** param names match the in-progress `w1/engine-fnplot` model (checks run against it and match); `index.js` didn't exist yet, so the output keys (`time`, `temperature`, `heatSupplied`, `meltTime`, `boilTime`, `totalTime`, `totalEnergy`, `halfTime`), the param ranges and an `xAxis` option (time or energy) are proposals.
- **field2d / `magnetic`:** no branch yet. All keys are proposals, plus features: `wire`, `two-wires`, `loop`, `solenoid` sources (Biot–Savart; solenoid as up to 200 loops), conductors of 2 mm radius so fields stay finite on every wire and winding, a draggable probe (`probeX`, `probeY`), a compass grid, the readouts listed, and `magnetic` in `staticSetups`.

## Your decision

Approve Physics part B by telling the orchestrator, or list the specs to change. Wave 2 for each page starts once Physics is approved and its engine has merged.
