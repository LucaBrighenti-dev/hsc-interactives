---
id: me2-shm
title: "Simple harmonic motion"
subject: me2
engine: particle2d
setup: shm
priority: P1
status: draft            # stub → draft → approved (Gate B)
page: /interactives/maths-ext2/shm.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Mathematics Extension 2","version":"2024","area":"Mechanics","focusArea":"Applications of calculus to mechanics","year":12,"outcomes":[],"verified":false}
---
# Simple harmonic motion

> Backlog summary: Point on a rotating circle drives x(t); v squared against x and phase plots.

## Learning goal
Students recognise simple harmonic motion as motion with ẍ = −n²(x − c), see it as the projection of a point turning uniformly around a circle, and connect the forms x = c + a cos(nt + α) and v² = n²(a² − (x − c)²). They find the centre, amplitude, period 2π/n, phase, greatest speed and greatest acceleration from the initial position and velocity, and see that the speed is greatest at the centre and the acceleration is greatest at the extremes.

## What the student sees
The stage at 1920×1080 is split into two panels that share a horizontal x scale.

- **Left, the reference circle (about 45% of the width):** a circle of radius a centred at (c, 0), with a point Q (orange disc) turning anticlockwise at n rad/s. Q's angle from the positive x direction is labelled "nt + α". A dashed vertical line drops from Q to the particle P (a filled graphite square) moving along the x-axis beneath it. P carries a velocity arrow (labelled v) and an acceleration arrow (labelled ẍ) that always points to the centre. The centre c and the two extremes c ± a are marked on the x-axis with ticks and labels.
- **Right, the graph:** the selected graph drawn live in orange: x–t (default), v–t, ẍ–t, v² against x (a downward parabola through (c ± a, 0) with vertex n²a² at x = c), or v against x (the phase plot, an ellipse with semi-axes a and na). The current point is a filled marker on the curve, and the whole curve is drawn faintly in grey before the run, so students can predict where the marker will go.
- **Above the graph:** the equations with numbers substituted, for example "ẍ = −4x", "x = 5 cos(2t − 0.927)" and "v² = 4(25 − x²)".

The x scale fits c ± a with a margin. The run ends at the chosen run time.

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| n | n | rad/s | 0.5 | 5 | 0.1 | 2 | ẍ = −n²(x − c); period 2π/n |
| centre | Centre of motion c | m | −3 | 3 | 0.1 | 0 | |
| x0 | Initial position x₀ | m | −5 | 5 | 0.1 | 3 | |
| v0 | Initial velocity v₀ | m/s | −30 | 60 | 0.1 | 0 | shared with the resisted-1d setup (one range covers both); this page's default preset sets 8 |
| duration | Run time | s | 1 | 60 | 1 | 20 | shared with the other time-based particle2d setups; the run completes at this time |
| graph | Graph | | | | | xt | enum, select, shared with the resisted-1d setup: `xt` (x–t), `vt` (v–t), `at` (ẍ–t), `vx` (v against x, the phase plot), `v2x` (v² against x) |
| showCircle | Reference circle | | | | | on | boolean |
| showArrows | Velocity and acceleration arrows | | | | | on | boolean |
| timeScale | Playback speed | × | 0.25 | 2 | 0.25 | 1 | |

Changing `n`, `centre`, `x0`, `v0` or `duration` resets the run to t = 0. The amplitude and phase are derived from the initial conditions, not set directly: that is the Ext 2 skill being practised.

**Shared keys.** `particle2d` has one flat `meta.params` for all its setups, so `v0`, `duration`, `graph` and `timeScale` have the same definitions here as in the resisted-motion spec (the v₀ range −30 to 60 m/s is the union of both pages' needs), and the acceleration output is `acc` on both pages. With |v₀| up to 60 and n down to 0.5 the amplitude can reach about 120 m; the x scale fits c ± a, so the picture still fits the stage.

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | n = 2, c = 0, x₀ = 3, v₀ = 8, run 20 s, graph x–t, circle on, arrows on | a 3-4-5 start: amplitude √(3² + (8/2)²) = 5, period π |
| from-rest | n = 2, c = 0, x₀ = 2, v₀ = 0 | released at an extreme: x = 2 cos 2t, α = 0 |
| through-centre | n = 0.5, c = 1, x₀ = 1, v₀ = 1 | starts at the centre: x = 1 + 2 sin(t/2), α = −π/2, period 4π |
| shifted-centre | n = 3, c = −1, x₀ = 2, v₀ = −6 | centre away from the origin: amplitude √13 |
| v-squared | default values, graph v² against x | the parabola v² = n²(a² − (x − c)²) |
| phase-plot | default values, graph v against x | the ellipse (x − c)²/a² + v²/(na)² = 1 |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| t | Time t | s | 3 |
| x | Position x | m | 3 |
| v | Velocity v | m/s | 3 |
| acc | Acceleration ẍ | m/s² | 3 |
| amplitude | Amplitude a | m | 3 |
| period | Period 2π/n | s | 3 |
| alpha | Phase α | rad | 3 |
| maxSpeed | Greatest speed na | m/s | 3 |
| maxAcc | Greatest acceleration n²a | m/s² | 3 |

Definitions: amplitude a = √((x₀ − c)² + (v₀/n)²); period = 2π/n; α is the angle in (−π, π] with a cos α = x₀ − c and a sin α = −v₀/n, so that x = c + a cos(nt + α); maxSpeed = na; maxAcc = n²a; acc = −n²(x − c) at the current state. These five derived outputs are analytic. t = n_steps·dt with dt = 1/240 s, and the run completes after round(duration/dt) steps. When x₀ = c and v₀ = 0 the particle rests at the centre: amplitude 0 and α = 0.

## Assumptions shown on stage
- Simple harmonic motion: ẍ = −n²(x − c), no damping
- x = c + a cos(nt + α), with −π < α ≤ π
- The reference point turns anticlockwise at n rad/s

## Try this (3–5 predict, observe, explain prompts)
1. Predict: the particle starts at x = 3 with v = 8 and n = 2. What is the amplitude? Check the readout, then explain where the 5 comes from on the reference circle.
2. Observe: watch the velocity and acceleration arrows through one period. Where is the speed greatest, and where is the acceleration greatest?
3. Predict: if you double n, what happens to the period, the greatest speed and the greatest acceleration? Test it.
4. Observe: choose "v² against x". Drag x₀ and v₀. Why does the parabola always cut the x-axis at c ± a?
5. Explain: in "Shifted centre", the particle starts at x = 2 moving left at 6 m/s. Use v² = n²(a² − (x − c)²) to explain why the amplitude is √13.

## Teacher notes outline
- Misconceptions to target: the amplitude is the starting position (true only when starting from rest); the particle is fastest at the extremes; acceleration is zero at the extremes; the period depends on the amplitude; the centre of motion is always the origin; α is the starting angle measured clockwise.
- 10-minute lesson flow: (1) default: predict the amplitude, reveal, link to the reference-circle triangle with sides 3 and v₀/n = 4 (3 min); (2) arrows on: speed and acceleration through a cycle; ẍ = −n²(x − c) (2 min); (3) v² against x: derive v² = n²(a² − (x − c)²) from v dv/dx = −n²(x − c) (3 min); (4) shifted centre: use the formula to get a = √13 and the period 2π/3 (2 min).
- Original HSC-style question idea: a particle moves in simple harmonic motion about x = 1 with period π seconds. At t = 0 it is at x = 4 and moving towards the centre at 8 m/s. (a) Show that n = 2. (b) Find the amplitude. (c) Find the greatest speed. (d) Find, in exact form, the first time it reaches x = −4. (Answers: a = √(3² + 4²) = 5; 10 m/s; with x = 1 + 5 cos(2t + α), cos α = 3/5 and sin α = 4/5, so t = (π − tan⁻¹(4/3))/2 ≈ 1.11 s.) Write the full question and worked solution in the notes file.

## Accessibility notes
- Second cues beyond colour: Q is a disc and P a square; the velocity arrow has a filled head and the label v, and the acceleration arrow has a hollow head and the label ẍ; the live curve is solid and the preview curve is thin and grey; the centre and extremes are labelled in text.
- Keyboard: all controls are sliders, a select or toggles; Space plays and pauses, . steps, R resets.
- Stage aria-label (from `describe()`), for example: "Simple harmonic motion about x = 0 with n = 2, amplitude 5 metres and period 3.14 seconds. At t = 1.00 s the particle is at x = 2.39 m moving at −8.78 m/s."

## Engine change requests
No `particle2d` engine meta had been pushed when this spec was written (origin had no `w1/engine-particle2d` branch on 25 Nov). **Keys to reconcile with engine meta:**
- Params for setup `shm`: `n`, `centre`, `x0`, `v0`, `duration`, `graph`, `showCircle`, `showArrows`, `timeScale`. Ext 2 states SHM kinematically as ẍ = −n²(x − c); if the engine's `shm` setup is a mass on a spring (m, k), the page needs `n` and `centre` as params (with n² = k/m internally), or the page builder sets m = 1 and k = n² and the acceptance block is updated to match.
- Outputs: `t`, `x`, `v`, `acc`, `amplitude`, `period`, `alpha`, `maxSpeed`, `maxAcc`.
- Graphs v² against x (`v2x`) and v against x (`vx`, the phase plot), beyond the s–t, v–t and a–t graphs in guide §9.1; and the reference circle drawn in step with the particle.
- Behaviour needed: time is n·dt with dt = 1/240 s and completion after round(duration/dt) steps (as in the demo engine); a parameter change resets the run to t = 0.

## Acceptance
Every number below comes from the formula and hand calculation shown here. The closed form is x = c + (x₀ − c) cos nt + (v₀/n) sin nt and v = −n(x₀ − c) sin nt + v₀ cos nt. Derived outputs are analytic (tolerance 1e-9). Positions and velocities after stepping come from the engine's RK4 integration, so they use a relative tolerance of 1e-4; an independent RK4 run at dt = 1/240 s agrees with them to about 1e-9.

- **Check 1, default at t = 0.** n = 2, c = 0, x₀ = 3, v₀ = 8. a = √(3² + (8/2)²) = √25 = **5 m**. Period = 2π/2 = **π = 3.14159265359 s**. α: 5 cos α = 3 and 5 sin α = −4, so α = −tan⁻¹(4/3) = **−0.927295218002**. Greatest speed na = **10 m/s**, greatest acceleration n²a = **20 m/s²**. ẍ = −4 × 3 = **−12 m/s²**, x = **3**, v = **8**.
- **Check 2, default after 240 steps (t = 1 s).** cos 2 = −0.416146837, sin 2 = 0.909297427. x = 3 cos 2 + 4 sin 2 = −1.248440510 + 3.637189707 = **2.38874920 m**. v = −6 sin 2 + 8 cos 2 = −5.455784561 − 3.329174692 = **−8.78495925 m/s**. ẍ = −4 × 2.38874920 = **−9.55499679 m/s²**. (Check: v² = 77.1755 and n²(a² − x²) = 4(25 − 5.70612) = 77.1755.)
- **Check 3, shifted centre at t = 0.** n = 3, c = −1, x₀ = 2, v₀ = −6. x₀ − c = 3 and v₀/n = −2, so a = √(9 + 4) = **√13 = 3.60555127546 m**. Period = **2π/3 = 2.09439510239 s**. a cos α = 3, a sin α = −(−6)/3 = 2, so α = tan⁻¹(2/3) = **0.588002603548**. na = 3√13 = **10.8166538264 m/s**, n²a = 9√13 = **32.4499614792 m/s²**, ẍ = −9 × 3 = **−27 m/s²**.
- **Check 4, through the centre, run to completion at 2 s.** n = 0.5, c = 1, x₀ = 1, v₀ = 1, run time 2 s (480 steps). a = √(0 + (1/0.5)²) = **2 m**; a cos α = 0 and a sin α = −2, so α = **−π/2 = −1.57079632679**; period = 2π/0.5 = **4π = 12.5663706144 s**. At t = 2: x = 1 + 2 sin 1 = 1 + 2 × 0.841470985 = **2.68294197 m**, v = cos 1 = **0.540302306 m/s**, **t = 2 s**.
- **Check 5, default after 720 steps (t = 3 s).** cos 6 = 0.960170287, sin 6 = −0.279415498. x = 3 cos 6 + 4 sin 6 = 2.880510860 − 1.117661993 = **1.76284887 m**; v = −6 sin 6 + 8 cos 6 = 1.676492989 + 7.681362293 = **9.35785528 m/s**.

```acceptance
[
  { "name": "default at t = 0: amplitude 5, period pi", "params": { "n": 2, "centre": 0, "x0": 3, "v0": 8 }, "run": "static",
    "expect": { "amplitude": { "value": 5, "relTol": 1e-9 }, "period": { "value": 3.14159265359, "relTol": 1e-9 }, "alpha": { "value": -0.927295218002, "absTol": 1e-9 },
                "maxSpeed": { "value": 10, "relTol": 1e-9 }, "maxAcc": { "value": 20, "relTol": 1e-9 }, "acc": { "value": -12, "relTol": 1e-9 },
                "x": { "value": 3, "absTol": 1e-9 }, "v": { "value": 8, "absTol": 1e-9 } } },
  { "name": "default after 1 s", "params": { "n": 2, "centre": 0, "x0": 3, "v0": 8, "duration": 20 }, "run": { "steps": 240 },
    "expect": { "t": { "value": 1, "absTol": 1e-9 }, "x": { "value": 2.3887492, "relTol": 1e-4 }, "v": { "value": -8.78495925, "relTol": 1e-4 }, "acc": { "value": -9.55499679, "relTol": 1e-4 } } },
  { "name": "shifted centre: amplitude sqrt(13)", "params": { "n": 3, "centre": -1, "x0": 2, "v0": -6 }, "run": "static",
    "expect": { "amplitude": { "value": 3.60555127546, "relTol": 1e-9 }, "period": { "value": 2.09439510239, "relTol": 1e-9 }, "alpha": { "value": 0.588002603548, "absTol": 1e-9 },
                "maxSpeed": { "value": 10.8166538264, "relTol": 1e-9 }, "maxAcc": { "value": 32.4499614792, "relTol": 1e-9 }, "acc": { "value": -27, "relTol": 1e-9 } } },
  { "name": "through the centre: run completes at 2 s", "params": { "n": 0.5, "centre": 1, "x0": 1, "v0": 1, "duration": 2 }, "run": "complete",
    "expect": { "t": { "value": 2, "absTol": 1e-9 }, "x": { "value": 2.68294197, "relTol": 1e-4 }, "v": { "value": 0.540302306, "relTol": 1e-4 },
                "amplitude": { "value": 2, "relTol": 1e-9 }, "alpha": { "value": -1.57079632679, "absTol": 1e-9 }, "period": { "value": 12.5663706144, "relTol": 1e-9 } } },
  { "name": "default after 3 s", "params": { "n": 2, "centre": 0, "x0": 3, "v0": 8, "duration": 20 }, "run": { "steps": 720 },
    "expect": { "t": { "value": 3, "absTol": 1e-9 }, "x": { "value": 1.76284887, "relTol": 1e-4 }, "v": { "value": 9.35785528, "relTol": 1e-4 } } }
]
```
