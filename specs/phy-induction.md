---
id: phy-induction
title: "Faraday and Lenz"
subject: phy
engine: custom
setup: none
priority: P1
status: draft           # stub → draft → approved (Gate B)
page: /interactives/physics/induction.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Physics","version":"2017","area":"Module 6: Electromagnetism","outcomes":[],"verified":false}
  - {"course":"Physics","version":"2025","focusArea":"Electromagnetism","year":12,"outcomes":[],"verified":false}
---
# Faraday and Lenz

> Backlog summary: Magnet through a coil with flux and emf graphs; transformer turns ratio.

## Learning goal
Students see that an emf is induced only while the magnetic flux through a coil is changing, with ε = −N ΔΦ/Δt: the emf graph is the (negative) gradient of the flux graph, it is larger for a faster magnet or more turns, and its sign reverses as the magnet enters and leaves, as Lenz's law requires. They then apply the same idea to an ideal transformer, V_s/V_p = N_s/N_p with power conserved, and see why a steady DC supply induces nothing.

Syllabus tags: 2017 Module 6 (Electromagnetism: electromagnetic induction, transformers); 2025 Year 12 focus area Electromagnetism.

## What the student sees
Default view at 1920×1080 (light projector stage), `scene` = `magnet`:

- **Upper half, the apparatus.** A coil drawn as a short cylinder of loops (up to 10 loops drawn, labelled "N = 200 turns, radius 3.0 cm") centred on a horizontal axis, with leads to a centre-zero voltmeter whose needle and digits show the emf. A bar magnet (two flat blocks labelled N and S) slides along the axis from left to right at constant speed, with a velocity arrow. Faint field lines of the magnet move with it. The coil's two faces show the induced pole in text ("N" or "S") whenever the emf is non-zero, and small arrows on the front of the loops show the direction an induced current would flow if the coil were connected to a resistor.
- **Lower half, two stacked graphs sharing a time axis** that spans the whole pass: flux per turn Φ (µWb) against t, and emf ε (mV) against t. Both fill in as the run proceeds, with an orange cursor at the present time. Both curves are drawn from the closed forms Φ(t) and ε(t) at display resolution (at least one point per screen pixel, plus the exact peak points), never by joining the 1/240 s step samples, because the pulses are only a few steps wide. The axes are fixed for the run (scaled from the analytic maximum), so nothing rescales mid-run. Each peak is labelled with its analytic value once the magnet has passed it.

With `motion` = `drop`, the scene rotates so the axis is vertical: the magnet falls from rest from `dropHeight` above the coil's centre (5 cm by default), speeding up, and the emf graph shows the classic asymmetric pair: the second, exit peak is 35% taller and narrower than the entry peak for the defaults.

`scene` = `transformer` replaces this with a laminated square core (flat grey frame) carrying a primary coil on the left and a secondary coil on the right, each drawn with a number of loops proportional to log(turns) and labelled with N. The primary connects to an AC (sine symbol) or DC (battery symbol) supply; the secondary connects to a load resistor. Orange arrows around the core show the alternating flux, growing, shrinking and reversing. Two waveform traces show v_p(t) and v_s(t) (peak = √2 × RMS), slowed so that one 50 Hz cycle takes 2 s. With DC the flux arrows are steady and v_s is a flat line at zero.

## Model (custom engine)
Engine folder `site/assets/engines/custom/phy-induction/`, `meta.name: 'phy-induction'`, one setup `induction`. **Time-based** with `timeScale`. Fixed step 1/240 s; `stepSize` 24. The magnet's motion is prescribed (no integration), so every output is a closed form at time t.

Constants (shown on stage): μ₀ = 4π × 10⁻⁷ T m A⁻¹; g = 9.8 m/s² (drop only).

**Magnet scene.** Axis x along the coil's axis, coil centre at x = 0, positive in the direction the magnet travels when v > 0 (to the right; downwards in `drop`).

- Magnet as a point magnetic dipole of moment m = `magnetStrength` (A m²) on the axis. Its signed axial moment is m_x = s_pole × s_dir × m, where s_pole = +1 if the north pole leads and −1 if the south pole leads, and s_dir = +1 for travel in +x (v ≥ 0, and always for `drop`) or −1 for v < 0.
- Coil: N = `turns` turns, all treated as one thin circular loop of radius a = `coilRadius` at x = 0.
- Flux per turn (exact for a point dipole on the axis of a circular loop): Φ(x) = μ₀ m_x a² / (2 (x² + a²)^{3/2}). Flux linkage NΦ.
- emf, with positive emf defined as driving current around the coil in the right-hand sense about +x: ε = −N dΦ/dt = −N (dΦ/dx)(dx/dt) = 3Nμ₀ m_x a² x v / (2 (x² + a²)^{5/2}).
- For |v| > 0, |ε| is greatest at x = ±a/2, where ε_peak = Nμ₀ m |v| × 3/(4 × 1.25^{5/2} a²) = 0.429 325 × Nμ₀ m |v| / a².
- `steady`: x(t) = x_start + v t with x_start = −0.30 m for v ≥ 0 and +0.30 m for v < 0. The run completes when the magnet reaches the other end, t_end = 0.60/|v| (last step clamped). v = 0 is complete at t = 0 (nothing changes, so ε = 0).
- `drop`: x(t) = −h + ½gt², v = gt, with h = `dropHeight` (released from rest, free fall). The run completes at x = +0.30 m, t_end = √(2(h + 0.30)/g) (last step clamped).
- For the drop, v depends on x (v = √(2g(x + h))), so the peaks are not at ±a/2. Setting d|ε|/dx = 0 with x₀ = −h gives the cubic 7x³ − 8x₀x² − 3a²x + 2a²x₀ = 0, which has one root between −h and 0 (the entry peak) and one above 0 (the exit peak). The engine finds them by bisection on that cubic (or the cubic formula).
- The coil is connected to a high-resistance voltmeter, so negligible current flows and there is no braking force on the magnet (footer says so). The induced-current arrows and induced poles show what Lenz's law predicts if the circuit were closed.
- `peakEmf` is analytic: the largest |ε(x)| over the part of the path the magnet has covered so far, from the closed form, not from step samples. For `steady`, it is |ε| at the present x until the magnet passes x = −a/2 (or +a/2 when v < 0), and ε_peak after that. For `drop`, it is |ε| at the present x until the magnet passes the entry-peak root, then that root's |ε| until it passes the exit-peak root, then the larger of the two (the exit peak). Sampling at 1/240 s would read up to 22% low at allowed settings (2.4% low at 1.5 m/s with the default coil).
- Changing `scene`, `motion`, `magnetSpeed`, `dropHeight`, `leadingPole`, `magnetStrength`, `turns` or `coilRadius` resets the pass to t = 0. Transformer params and `timeScale` apply live.

**Transformer scene.** Ideal flux linkage; losses lumped into an efficiency.

- Turns ratio N_s/N_p. AC: V_s = V_p N_s/N_p (RMS); I_s = V_s/R; P_out = V_s I_s; P_in = P_out/η; I_p = P_in/V_p, where η = `efficiency`/100.
- DC: after switch-on the flux is constant, so V_s = 0, I_s = 0 and P_out = 0. The primary current is then limited only by the winding's resistance, which is not modelled, so `primaryCurrent` and `inputPower` are `null` ("—") and the stage says "Steady DC: no changing flux, no induced emf".
- Waveforms for display: v_p(t) = √2 V_p sin(2πf t′) and v_s(t) = (N_s/N_p) v_p(t), with f = 50 Hz and display time t′ = t/100 (one cycle per 2 s). The transformer scene is open-ended: `isComplete()` is false.

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| scene | Scene | | | | | magnet | enum: `magnet` (Magnet and coil), `transformer` (Transformer) |
| motion | Magnet motion | | | | | steady | enum: `steady` (Steady speed), `drop` (Dropped through the coil); `visibleWhen: { scene: 'magnet' }` |
| magnetSpeed | Magnet speed v | m/s | −2 | 2 | 0.05 | 0.5 | `visibleWhen: { scene: 'magnet', motion: 'steady' }`; negative moves right to left |
| dropHeight | Release height above the coil centre h | m | 0.05 | 0.3 | 0.01 | 0.05 | `visibleWhen: { scene: 'magnet', motion: 'drop' }`; lower releases give a more lopsided pair of peaks |
| leadingPole | Leading pole | | | | | north | enum: `north` (North first), `south` (South first); `visibleWhen: { scene: 'magnet' }` |
| magnetStrength | Magnet strength m | A m² | 0.1 | 5 | 0.1 | 1 | dipole moment; `visibleWhen: { scene: 'magnet' }` |
| turns | Coil turns N | | 1 | 1000 | 1 | 200 | `integer: true`, `visibleWhen: { scene: 'magnet' }` |
| coilRadius | Coil radius a | m | 0.01 | 0.1 | 0.005 | 0.03 | `visibleWhen: { scene: 'magnet' }` |
| supply | Primary supply | | | | | ac | enum: `ac` (AC 50 Hz), `dc` (DC); `visibleWhen: { scene: 'transformer' }` |
| primaryVoltage | Primary voltage V_p (RMS) | V | 1 | 240 | 1 | 240 | `visibleWhen: { scene: 'transformer' }` |
| primaryTurns | Primary turns N_p | | 10 | 5000 | 10 | 1000 | `integer: true`, `visibleWhen: { scene: 'transformer' }` |
| secondaryTurns | Secondary turns N_s | | 10 | 5000 | 10 | 50 | `integer: true`, `visibleWhen: { scene: 'transformer' }` |
| load | Load resistance R | Ω | 1 | 1000 | 1 | 6 | `visibleWhen: { scene: 'transformer' }` |
| efficiency | Efficiency η | % | 50 | 100 | 1 | 100 | `visibleWhen: { scene: 'transformer' }` |
| timeScale | Playback speed | × | 0.25 | 2 | 0.25 | 1 | |

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | scene magnet, motion steady, magnetSpeed 0.5, leadingPole north, magnetStrength 1, turns 200, coilRadius 0.03 | equal and opposite emf peaks of about 60 mV |
| faster | as default with magnetSpeed 1 | peaks double and the pulse is half as long |
| south-first | as default with leadingPole south | every sign flips |
| drop | scene magnet, motion drop, dropHeight 0.05, leadingPole north, magnetStrength 1, turns 200, coilRadius 0.03 | asymmetric peaks: −101 mV entering, +136 mV leaving (35% taller), because the magnet speeds up |
| transformer | scene transformer, supply ac, primaryVoltage 240, primaryTurns 1000, secondaryTurns 50, load 6, efficiency 100 | 240 V mains to 12 V |
| step-up | scene transformer, supply ac, primaryVoltage 12, primaryTurns 100, secondaryTurns 500, load 1000, efficiency 100 | voltage up, current down |
| dc-supply | scene transformer, supply dc, primaryVoltage 12, primaryTurns 100, secondaryTurns 500, load 1000 | no output from steady DC |

No catalogue listing reuses this page.

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| flux | Flux per turn Φ | Wb | 3 |
| fluxLinkage | Flux linkage NΦ | Wb | 3 |
| emf | Induced emf ε | V | 3 |
| peakEmf | Largest emf so far | V | 3 |
| position | Magnet position x | m | 3 |
| speed | Magnet speed | m/s | 3 |
| t | Time t | s | 3 |
| turnsRatio | Turns ratio N_s/N_p | | 3 |
| secondaryVoltage | Secondary voltage V_s (RMS) | V | 3 |
| secondaryCurrent | Secondary current I_s (RMS) | A | 3 |
| primaryCurrent | Primary current I_p (RMS) | A | 3 |
| outputPower | Output power | W | 3 |
| inputPower | Input power | W | 3 |

The engine returns `null` for the outputs of the scene that is not shown, so the shell displays "—" for them. `flux`, `fluxLinkage`, `emf` and `peakEmf` set `siPrefix: true` (guide §5.10), so they read as, for example, "20.9 µWb" and "71.9 mV"; the values returned stay in Wb and V.

## Assumptions shown on stage
- Magnet modelled as a point dipole on the coil's axis
- All N turns at the same place (a thin coil)
- Coil connected to a voltmeter: no current, no magnetic braking
- Steady scene: an external push keeps the magnet's speed constant; drop: free fall, g = 9.8 m/s²
- Transformer: all flux links both coils; losses lumped into η
- μ₀ = 4π × 10⁻⁷ T m A⁻¹; AC animation slowed 100×

## Try this (3–5 predict, observe, explain prompts)
1. **Predict:** sketch the emf–time graph you expect as the magnet passes right through the coil. Then play and compare.
2. **Observe:** where is the flux greatest, and what is the emf at that moment? Link the emf graph to the gradient of the flux graph.
3. **Predict, then observe:** double the speed. What happens to the height of each peak and to the length of the pulse? What stays the same? (Compare the areas under the two emf–time graphs: each equals N × the change in flux.)
4. **Explain:** use Lenz's law to explain why the coil's near face becomes a north pole as a north pole approaches, and why the emf reverses as the magnet leaves.
5. **Explain:** in the transformer, switch the supply to DC. Why is there no output voltage, even though a current flows in the primary?

## Teacher notes outline
- **Misconceptions to target:** a strong magnet sitting in the coil induces an emf (only change does); the emf is greatest when the flux is greatest (it is zero there); the second peak is the same as the first for a dropped magnet (it is taller and narrower because the magnet is faster); a transformer makes energy when it steps up the voltage (power in ≥ power out); transformers work on DC.
- **10-minute lesson flow:** 2 min prompt 1 sketch; 2 min play the default and compare; 2 min faster and south-first presets (what scales, what flips); 2 min the drop preset and the asymmetric peaks; 2 min transformer presets, ending on DC.
- **Original HSC-style question idea:** a 150-turn coil has flux per turn rising from 0 to 2.4 × 10⁻⁴ Wb in 0.030 s as a magnet is pushed in, then falling back to 0 in 0.020 s as it is pulled out. (a) Calculate the average emf in each stage. (b) Sketch the emf–time graph, labelling signs. (c) A transformer then steps 240 V down to 15 V with 1600 primary turns: find N_s and the primary current when the secondary delivers 3.0 A (ideal). Worked solution in the notes file.

## Accessibility notes
- Induced poles are labelled "N" and "S" in text; current direction uses arrows; the voltmeter shows a signed number as well as a needle.
- The flux and emf graphs are separate panels with text axis titles, not two colours on one axis. The primary and secondary waveforms are labelled at their right-hand ends.
- Keyboard: all controls through the shell; the magnet speed slider steps 0.05 m/s.
- Stage `aria-label` from `describe()`: "Bar magnet, north pole first, moving at 0.50 metres per second, 2 centimetres before the centre of a 200-turn coil. Flux 12 microwebers per turn and rising; emf −56 millivolts." Transformer: "Transformer, 1000 primary turns and 50 secondary turns on 240 volts AC: secondary 12 volts, 2.0 amps."

## Engine change requests
None. This spec defines the custom engine, built in Wave 2 under `site/assets/engines/custom/phy-induction/` with tests in `tests/engines/custom-phy-induction.test.mjs` covering every check below.

## Acceptance
Every number below comes from the formula and hand calculation shown here. Defaults for the magnet: N = 200, a = 0.030 m, m = 1.0 A m², μ₀m = 1.256 637 × 10⁻⁶ T m³ (since μ₀ m has units T m³ for a dipole).

- **Check 1, flux at the start.** x = −0.30 m: x² + a² = 0.09 + 0.0009 = 0.0909, (0.0909)^{3/2} = 0.027 406. Φ = 1.256 637 × 10⁻⁶ × 9 × 10⁻⁴ / (2 × 0.027 406) = **2.063 367 × 10⁻⁸ Wb**.
- **Check 2, magnet at the centre.** v = 0.50 m/s reaches x = 0 at t = 0.30/0.50 = 0.60 s = 144 steps. Φ = μ₀m/(2a) = 1.256 637 × 10⁻⁶ / 0.060 = **2.094 395 × 10⁻⁵ Wb**; NΦ = 200 × 2.094 395 × 10⁻⁵ = **4.188 790 × 10⁻³ Wb**; x = 0 so **ε = 0**.
- **Check 3, at the emf peak.** v = 0.60 m/s reaches x = +a/2 = 0.015 m at t = 0.315/0.60 = 0.525 s = 126 steps. ε = 0.429 325 × 200 × 1.256 637 × 10⁻⁶ × 0.60 / 9 × 10⁻⁴ = **+0.071 934 V** (positive: the flux is falling as the magnet leaves). Φ(a/2) = μ₀m a² / (2 (1.25a²)^{3/2}) = μ₀m/(2a × 1.397 54) = **1.498 627 × 10⁻⁵ Wb**.
- **Check 4, a complete steady pass.** v = 0.60 m/s, t_end = 0.60/0.60 = **1.0 s** (240 steps). The magnet has passed both x = −a/2 and x = +a/2, so the analytic `peakEmf` = ε_peak = **0.071 934 V**, and the magnet ends at **x = 0.30 m**.
- **Check 5, south pole first.** Same as check 3 with the magnet reversed: m_x = −1, so **ε = −0.071 934 V**.
- **Check 6, dropped magnet timing.** Released h = 0.10 m above the centre, it falls 0.40 m to x = +0.30 m: t_end = √(2 × 0.40/9.8) = √0.081 633 = **0.285 714 s** (= 2/7 s); final speed v = gt = √(2 × 9.8 × 0.40) = √7.84 = **2.8 m/s**; final x = **0.30 m**.
- **Check 7, step-down transformer.** N_s/N_p = 50/1000 = **0.05**; V_s = 240 × 0.05 = **12 V**; I_s = 12/6 = **2.0 A**; P_out = 12 × 2 = **24 W**; ideal, so I_p = 24/240 = **0.10 A**.
- **Check 8, efficiency 80%.** Same transformer with η = 0.80: P_in = 24/0.80 = **30 W**, I_p = 30/240 = **0.125 A**; V_s is still **12 V**.
- **Check 9, step-up.** N_p = 100, N_s = 500, V_p = 12 V, R = 1000 Ω: V_s = 12 × 5 = **60 V**, I_s = 60/1000 = **0.060 A**, I_p = (60 × 0.060)/12 = **0.30 A**.
- **Check 10, DC.** Same as check 9 with `supply: dc`: **V_s = 0** and **P_out = 0**.
- **Check 11, analytic peak at a fast steady speed.** v = 1.5 m/s with the default coil: ε_peak = 0.429 325 × 200 × 1.256 637 × 10⁻⁶ × 1.5 / 9 × 10⁻⁴ = **0.179 835 V**. A complete pass must report this. (The largest step sample is 0.175 452 V, 2.4% low, so this check fails a sampled readout.)
- **Check 12, the drop preset's exit peak.** h = 0.05 m, so x₀ = −0.05, and with a² = 9 × 10⁻⁴ the stationary points of |ε| satisfy 7x³ − 8x₀x² − 3a²x + 2a²x₀ = 7x³ + 0.40x² − 0.0027x − 0.000 09 = 0. Its roots are x = −0.013 279 m (entry) and x = +0.016 137 m (exit). At the exit root, v = √(2 × 9.8 × (0.016 137 + 0.05)) = √1.296 284 = 1.138 542 m/s, and ε = 3 × 200 × 1.256 637 × 10⁻⁶ × 9 × 10⁻⁴ × 0.016 137 × 1.138 542 / (2 × (0.016 137² + 9 × 10⁻⁴)^{5/2}) = **+0.135 902 V**. After the complete run (t_end = √(2 × 0.35/9.8) = 0.267 261 s), `peakEmf` = **0.135 902 V**. (Step sampling would give 0.135 771 V.)
- **Check 13, the drop preset's entry peak.** At the entry root x = −0.013 279 m: v = √(2 × 9.8 × 0.036 721) = 0.848 365 m/s and ε = **−0.100 568 V**, passed at t = v/g = 0.0866 s. After 24 steps (t = 0.1 s, x = −0.05 + 4.9 × 0.01 = −0.001 m) the magnet has passed the entry peak but not the exit peak, so `peakEmf` = **0.100 568 V**. (Step sampling would give 0.100 267 V.) The exit peak is 0.135 902/0.100 568 = 1.35 times the entry peak.

Tolerances: 1 × 10⁻⁶ relative for closed forms (the drop peaks come from a cubic root found to full precision); values that should be zero use absolute tolerances (1 × 10⁻⁹ V for ε at the centre, where x is a sum of floating-point steps).

```acceptance
[
  { "name": "flux at the start of the pass", "params": { "scene": "magnet", "motion": "steady", "magnetSpeed": 0.5, "leadingPole": "north", "magnetStrength": 1, "turns": 200, "coilRadius": 0.03 }, "run": "static",
    "expect": { "flux": { "value": 2.063367344e-8, "relTol": 1e-6 }, "position": { "value": -0.3, "absTol": 1e-12 } } },
  { "name": "magnet at the centre: maximum flux, zero emf", "params": { "scene": "magnet", "motion": "steady", "magnetSpeed": 0.5, "leadingPole": "north", "magnetStrength": 1, "turns": 200, "coilRadius": 0.03 }, "run": { "steps": 144 },
    "expect": { "flux": { "value": 2.094395102e-5, "relTol": 1e-6 }, "fluxLinkage": { "value": 4.188790205e-3, "relTol": 1e-6 }, "emf": { "value": 0, "absTol": 1e-9 } } },
  { "name": "at x = a/2: peak emf", "params": { "scene": "magnet", "motion": "steady", "magnetSpeed": 0.6, "leadingPole": "north", "magnetStrength": 1, "turns": 200, "coilRadius": 0.03 }, "run": { "steps": 126 },
    "expect": { "emf": { "value": 0.07193410285, "relTol": 1e-6 }, "flux": { "value": 1.498627143e-5, "relTol": 1e-6 } } },
  { "name": "complete steady pass", "params": { "scene": "magnet", "motion": "steady", "magnetSpeed": 0.6, "leadingPole": "north", "magnetStrength": 1, "turns": 200, "coilRadius": 0.03 }, "run": "complete",
    "expect": { "peakEmf": { "value": 0.07193410285, "relTol": 1e-6 }, "t": { "value": 1, "absTol": 1e-9 }, "position": { "value": 0.3, "absTol": 1e-9 } } },
  { "name": "south pole first reverses the emf", "params": { "scene": "magnet", "motion": "steady", "magnetSpeed": 0.6, "leadingPole": "south", "magnetStrength": 1, "turns": 200, "coilRadius": 0.03 }, "run": { "steps": 126 },
    "expect": { "emf": { "value": -0.07193410285, "relTol": 1e-6 } } },
  { "name": "magnet dropped from 10 cm falls 0.4 m", "params": { "scene": "magnet", "motion": "drop", "dropHeight": 0.1, "leadingPole": "north", "magnetStrength": 1, "turns": 200, "coilRadius": 0.03 }, "run": "complete",
    "expect": { "t": { "value": 0.2857142857, "relTol": 1e-6 }, "speed": { "value": 2.8, "relTol": 1e-6 }, "position": { "value": 0.3, "absTol": 1e-9 } } },
  { "name": "step-down transformer 240 V to 12 V", "params": { "scene": "transformer", "supply": "ac", "primaryVoltage": 240, "primaryTurns": 1000, "secondaryTurns": 50, "load": 6, "efficiency": 100 }, "run": "static",
    "expect": { "turnsRatio": { "value": 0.05, "relTol": 1e-9 }, "secondaryVoltage": { "value": 12, "relTol": 1e-9 }, "secondaryCurrent": { "value": 2, "relTol": 1e-9 },
                "outputPower": { "value": 24, "relTol": 1e-9 }, "primaryCurrent": { "value": 0.1, "relTol": 1e-9 } } },
  { "name": "80% efficient transformer", "params": { "scene": "transformer", "supply": "ac", "primaryVoltage": 240, "primaryTurns": 1000, "secondaryTurns": 50, "load": 6, "efficiency": 80 }, "run": "static",
    "expect": { "inputPower": { "value": 30, "relTol": 1e-9 }, "primaryCurrent": { "value": 0.125, "relTol": 1e-9 }, "secondaryVoltage": { "value": 12, "relTol": 1e-9 } } },
  { "name": "step-up transformer", "params": { "scene": "transformer", "supply": "ac", "primaryVoltage": 12, "primaryTurns": 100, "secondaryTurns": 500, "load": 1000, "efficiency": 100 }, "run": "static",
    "expect": { "secondaryVoltage": { "value": 60, "relTol": 1e-9 }, "secondaryCurrent": { "value": 0.06, "relTol": 1e-9 }, "primaryCurrent": { "value": 0.3, "relTol": 1e-9 } } },
  { "name": "DC supply gives no output", "params": { "scene": "transformer", "supply": "dc", "primaryVoltage": 12, "primaryTurns": 100, "secondaryTurns": 500, "load": 1000 }, "run": "static",
    "expect": { "secondaryVoltage": { "value": 0, "absTol": 1e-12 }, "outputPower": { "value": 0, "absTol": 1e-12 } } },
  { "name": "analytic peak at 1.5 m/s, not a step sample", "params": { "scene": "magnet", "motion": "steady", "magnetSpeed": 1.5, "leadingPole": "north", "magnetStrength": 1, "turns": 200, "coilRadius": 0.03 }, "run": "complete",
    "expect": { "peakEmf": { "value": 0.1798352571, "relTol": 1e-6 } } },
  { "name": "drop preset: exit peak after the full fall", "params": { "scene": "magnet", "motion": "drop", "dropHeight": 0.05, "leadingPole": "north", "magnetStrength": 1, "turns": 200, "coilRadius": 0.03 }, "run": "complete",
    "expect": { "peakEmf": { "value": 0.1359016775, "relTol": 1e-6 }, "t": { "value": 0.2672612419, "relTol": 1e-6 } } },
  { "name": "drop preset: entry peak after 24 steps", "params": { "scene": "magnet", "motion": "drop", "dropHeight": 0.05, "leadingPole": "north", "magnetStrength": 1, "turns": 200, "coilRadius": 0.03 }, "run": { "steps": 24 },
    "expect": { "peakEmf": { "value": 0.1005677687, "relTol": 1e-6 }, "position": { "value": -0.001, "absTol": 1e-9 } } }
]
```
