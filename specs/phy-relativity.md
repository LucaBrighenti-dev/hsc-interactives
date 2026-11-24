---
id: phy-relativity
title: "Special relativity"
subject: phy
engine: custom
setup: none
priority: P1
status: draft           # stub → draft → approved (Gate B)
page: /interactives/physics/relativity.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Physics","version":"2017","area":"Module 7: The Nature of Light","outcomes":[],"verified":false}
  - {"course":"Physics","version":"2025","focusArea":"Nature of light","year":12,"outcomes":[],"verified":false}
---
# Special relativity

> Backlog summary: Light clock time dilation and length contraction.

## Learning goal
Students see that if light has the same speed c for every observer, a light clock moving past you must tick slowly, by the factor γ = 1/√(1 − v²/c²), because its light travels a longer diagonal path at the same speed. They connect this to proper time (measured by the clock at rest relative to the events) and see that a moving object is shorter only along its direction of motion, L = L₀/γ, and that each observer sees the other's clock run slow.

Syllabus tags: 2017 Module 7 (The Nature of Light: light and special relativity); 2025 Year 12 focus area Nature of light.

## What the student sees
Default view at 1920×1080 (light projector stage), in the Earth frame. Two horizontal lanes share one frame clock "t = … ns" at the top left.

- **Upper lane, "Clock at rest in this frame".** A vertical light clock (two mirrors drawn as thick bars, separation L_c) standing on an Earth platform. A small orange dot (the light pulse) bounces between the mirrors; each return to the bottom mirror flashes the tick counter "Ticks: 3".
- **Lower lane, "Moving clock".** The spacecraft, drawn as a flat outline of length L₀/γ along the motion (with a dashed outline of its proper length L₀ for comparison and dimension lines labelled "L₀ = 10.0 m" and "L = 8.00 m"), carries an identical light clock and moves right at v. The camera follows the craft; ground posts every metre scroll past to show the motion, with a velocity arrow labelled "v = 0.60c". With `showPaths` on, the light pulse leaves a zigzag trail, so the longer diagonal path is visible next to the upper lane's straight up-and-down path. The moving clock has its own tick counter and a readout of the time it shows (t/γ).
- **Footer strip:** γ, Δt₀ and Δt in large mono text, plus the right-angled triangle (half-tick): vertical side L_c, horizontal side vΔt/2, hypotenuse cΔt/2, drawn to scale beside the formula.

With `frame` = `ship`, the roles swap: the upper lane shows the ship's clock at rest (ship drawn at its proper length), and the lower lane shows the Earth platform and its clock moving left at v, with the platform contracted. The lane titles change to say whose clock is at rest.

## Model (custom engine)
Engine folder `site/assets/engines/custom/phy-relativity/`, `meta.name: 'phy-relativity'`, one setup `light-clock`. **Time-based** with `timeScale`. Fixed step 1/240 s; `stepSize` 24.

Constant: c = 299 792 458 m/s (exact). Kinematics are exact (no integration).

Let β = `speed` (as a fraction of c), L_c = `clockLength`, L₀ = `shipLength`.

- γ = 1/√(1 − β²).
- Proper tick (clock at rest): Δt₀ = 2L_c/c. Output in ns.
- Dilated tick (moving clock, measured in this frame): Δt = γΔt₀.
- Light path per tick of the moving clock in this frame: c·Δt = 2γL_c (m). Its vertical speed component is c/γ and horizontal component v.
- Contracted length of the moving object: L = L₀/γ. In the Earth frame the moving object is the ship; in the ship frame it is the Earth platform, which has the same proper length L₀ so the comparison is symmetric. Lengths perpendicular to the motion (mirror separation, heights) do not change.
- Frame time t (ns) starts at 0. Display pacing: each fixed step advances t by Δt₀/240, so one tick of the clock at rest takes 1 s on screen at timeScale 1 (footer: "Slow motion: one rest-clock tick = 1 s").
- Moving clock's own reading: τ = t/γ.
- Tick counts: restClockTicks = floor(t/Δt₀ + 10⁻⁹), movingClockTicks = floor(t/(γΔt₀) + 10⁻⁹). The 10⁻⁹ guards against rounding at exact tick boundaries.
- The run is complete when the moving clock has completed `ticks` ticks: t_end = ticks × γ × Δt₀. The last step is clamped so t ends at exactly t_end.
- β = 0 is allowed: γ = 1, both clocks tick together and nothing moves.
- Changing `speed`, `clockLength`, `ticks` or `frame` resets the run to t = 0; `shipLength`, `showPaths` and `timeScale` apply live.

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| speed | Speed v | c | 0 | 0.99 | 0.01 | 0.6 | fraction of the speed of light |
| clockLength | Mirror separation L_c | m | 0.5 | 3 | 0.1 | 1.5 | perpendicular to the motion |
| shipLength | Proper length L₀ | m | 2 | 50 | 1 | 10 | along the motion |
| frame | Frame shown | | | | | earth | enum: `earth` (Earth frame), `ship` (Ship frame) |
| ticks | Run until the moving clock ticks | | 1 | 20 | 1 | 5 | `integer: true` |
| showPaths | Light-path trail | | | | | on | boolean |
| timeScale | Playback speed | × | 0.25 | 2 | 0.25 | 1 | |

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | speed 0.6, clockLength 1.5, shipLength 10, frame earth, ticks 5, showPaths on | γ = 1.25 exactly, so 5 moving ticks take 6.25 rest ticks |
| slow | speed 0.1, clockLength 1.5, shipLength 10, ticks 5 | γ = 1.005: everyday speeds show almost no effect |
| fast | speed 0.99, clockLength 1.5, shipLength 10, ticks 2 | γ ≈ 7.09; the craft is 1.41 m long |
| ship-frame | speed 0.6, clockLength 1.5, shipLength 10, frame ship, ticks 5 | symmetry: now Earth's clock runs slow |
| gamma-2 | speed 0.87, clockLength 1, shipLength 20, ticks 4 | γ ≈ 2.03: about twice the time, half the length |

No catalogue listing reuses this page.

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| gamma | Lorentz factor γ | | 4 |
| properTick | Proper tick Δt₀ | ns | 4 |
| dilatedTick | Moving-clock tick Δt | ns | 4 |
| contractedLength | Moving length L | m | 3 |
| t | Frame time t | ns | 4 |
| movingClockTime | Moving clock reads τ | ns | 4 |
| restClockTicks | Rest-clock ticks | | 3 |
| movingClockTicks | Moving-clock ticks | | 3 |
| pathPerTick | Light path per moving tick | m | 3 |

## Assumptions shown on stage
- Light travels at c = 2.998 × 10⁸ m/s in every inertial frame
- Constant velocity (inertial frames); no acceleration
- Ideal light clock; mirrors perpendicular to the motion
- Slow motion: one rest-clock tick = 1 s on screen
- What is drawn is what each frame measures, not what an eye would see (light-travel delays ignored)

## Try this (3–5 predict, observe, explain prompts)
1. **Predict:** at 0.6c, how many times will the clock at rest tick while the moving clock ticks 5 times? Play to the end and check.
2. **Observe:** turn on the light-path trail. Compare the distance the light travels in one tick in each lane. The light's speed is the same in both, so what must be different?
3. **Explain:** use the right-angled triangle in the footer, (cΔt/2)² = L_c² + (vΔt/2)², to show that Δt = γΔt₀.
4. **Predict, then observe:** change the mirror separation. Does γ change? Does the moving craft's height change, or only its length?
5. **Explain:** switch to the ship frame. Now Earth's clock runs slow. How can both observers be right? Which clock measures proper time in each case?

## Teacher notes outline
- **Misconceptions to target:** the moving clock is faulty or "looks" slow because light takes time to reach you; only the ship's clock is ever slow (it is symmetric); length contraction squashes objects in every direction; proper time is the "real" time and the other is an illusion; relativity only matters near c (the slow preset shows γ = 1.005 at 0.1c, measurable with atomic clocks).
- **10-minute lesson flow:** 2 min predict prompt 1; 3 min run the default and derive γ from the footer triangle; 2 min length contraction with the dashed proper-length outline; 2 min the ship-frame preset and the symmetry discussion; 1 min link to muons reaching the ground (in the notes).
- **Original HSC-style question idea:** a probe passes Earth at 0.75c carrying a light clock whose mirrors are 1.2 m apart. (a) Calculate the proper tick time. (b) Calculate the tick time measured from Earth. (c) The probe is 24 m long at rest; calculate its length measured from Earth. (d) Explain, using the postulates, why the Earth-measured tick must be longer. Worked solution in the notes file.

## Accessibility notes
- The two lanes are distinguished by titles in words, by position (top and bottom) and by the trail shape, not by colour. Tick counters are large mono digits, and each tick also flashes the counter's frame (shape and weight change, not only colour).
- The contracted and proper lengths are shown as dimension lines with text labels.
- Keyboard: all controls through the shell; Step advances 0.1 s of display time.
- Stage `aria-label` from `describe()`: "Earth frame at 0.60 c, gamma 1.25. The clock at rest has ticked 6 times; the moving clock has ticked 5 times and reads 50.0 nanoseconds. The spacecraft measures 8.00 metres instead of 10.0 metres."

## Engine change requests
None. This spec defines the custom engine, built in Wave 2 under `site/assets/engines/custom/phy-relativity/` with tests in `tests/engines/custom-phy-relativity.test.mjs` covering every check below.

## Acceptance
Every number below comes from the formula and hand calculation shown here. c = 299 792 458 m/s, so Δt₀ = 2L_c/c gives 1.5 m → 3/299 792 458 s = 1.000 692 × 10⁻⁸ s = **10.006 923 ns**, and 1.0 m → **6.671 282 ns**.

- **Check 1, γ at 0.6c.** γ = 1/√(1 − 0.36) = 1/0.8 = **1.25**. Δt₀ = **10.006 923 ns**; Δt = 1.25 × 10.006 923 = **12.508 654 ns**. Light path per moving tick = 2γL_c = 2 × 1.25 × 1.5 = **3.75 m**.
- **Check 2, length at 0.8c.** γ = 1/√(1 − 0.64) = 1/0.6 = **1.666 667**; L = 10/1.666 667 = **6.00 m**.
- **Check 3, a complete run at 0.8c.** L_c = 1.5 m, ticks = 4: t_end = 4 × (5/3) × 10.006 923 = **66.712 819 ns**. The moving clock reads τ = t/γ = 4 × 10.006 923 = **40.027 691 ns** and has ticked **4** times. The clock at rest has ticked floor(66.712 819/10.006 923) = floor(6.667) = **6** times. Steps needed: 4 × (5/3) × 240 = 1600.
- **Check 4, near light speed.** β = 0.99: γ = 1/√(1 − 0.9801) = 1/√0.0199 = 1/0.141 067 = **7.088 812**; L = 10/7.088 812 = **1.410 674 m**.
- **Check 5, at rest.** β = 0: γ = **1**; with L_c = 1.0 m, Δt = Δt₀ = **6.671 282 ns**.

Tolerances: 1 × 10⁻⁹ relative for closed forms; tick counts use absolute 0.5 (any counting error is at least 1).

```acceptance
[
  { "name": "gamma and ticks at 0.6c", "params": { "speed": 0.6, "clockLength": 1.5 }, "run": "static",
    "expect": { "gamma": { "value": 1.25, "relTol": 1e-9 }, "properTick": { "value": 10.00692286, "relTol": 1e-9 },
                "dilatedTick": { "value": 12.50865357, "relTol": 1e-9 }, "pathPerTick": { "value": 3.75, "relTol": 1e-9 } } },
  { "name": "length contraction at 0.8c", "params": { "speed": 0.8, "shipLength": 10 }, "run": "static",
    "expect": { "gamma": { "value": 1.666666667, "relTol": 1e-9 }, "contractedLength": { "value": 6, "relTol": 1e-9 } } },
  { "name": "complete run: 4 moving ticks at 0.8c", "params": { "speed": 0.8, "clockLength": 1.5, "ticks": 4, "frame": "earth" }, "run": "complete",
    "expect": { "t": { "value": 66.71281904, "relTol": 1e-9 }, "movingClockTime": { "value": 40.02769142, "relTol": 1e-9 },
                "movingClockTicks": { "value": 4, "absTol": 0.5 }, "restClockTicks": { "value": 6, "absTol": 0.5 } } },
  { "name": "gamma at 0.99c", "params": { "speed": 0.99, "shipLength": 10 }, "run": "static",
    "expect": { "gamma": { "value": 7.08881205, "relTol": 1e-9 }, "contractedLength": { "value": 1.410673598, "relTol": 1e-9 } } },
  { "name": "at rest, gamma is 1", "params": { "speed": 0, "clockLength": 1 }, "run": "static",
    "expect": { "gamma": { "value": 1, "relTol": 1e-12 }, "dilatedTick": { "value": 6.671281904, "relTol": 1e-9 } } }
]
```
