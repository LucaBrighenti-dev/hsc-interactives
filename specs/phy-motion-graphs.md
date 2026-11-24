---
id: phy-motion-graphs
title: "Motion graphs lab"
subject: phy
engine: particle2d
setup: cart
priority: P1
status: draft            # stub → draft → approved (Gate B)
page: /interactives/physics/motion-graphs.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Physics","version":"2017","area":"Module 1: Kinematics","outcomes":[],"verified":false}
  - {"course":"Physics","version":"2025","focusArea":"Fundamentals of mechanics","year":11,"outcomes":[],"verified":false}
---
# Motion graphs lab

> Backlog summary: Drive a cart and watch s-t, v-t and a-t live; graph-matching challenge.

## Learning goal
Students connect a moving object to its displacement–time, velocity–time and acceleration–time graphs: the gradient of s–t is velocity, the gradient of v–t is acceleration, and the area under v–t is displacement. They distinguish displacement from distance and average velocity from instantaneous velocity, and use the equations of uniformly accelerated motion to predict where the cart will be.

Syllabus fit: 2017 Module 1 Kinematics (motion in a straight line: graphs, gradients and areas; displacement and distance; uniform acceleration); 2025 Year 11 focus area Fundamentals of mechanics.

## What the student sees
Default view at 1920×1080, projector theme (the `particle2d` engine's cart view):

- **Top strip:** a straight track with a ruler in metres and an origin mark, a cart with velocity and acceleration arrows labelled with their values, and a flag at the start position.
- **Below: three stacked graphs** with a shared time axis from 0 to the run time: position x (m), velocity v (m/s) and acceleration a (m/s²) against t, each traced live, with a cursor line through all three at the current time.
- **Drive mode:** a throttle on the stage sets the acceleration: drag it, or press ← or → (with the stage focused) to change it by 0.5 m/s² per press, between −2 and +2 m/s². The setting stays until it is changed again.
- **Match mode:** a dashed target position–time curve appears; the cart starts at 0 m at rest and the student drives it to follow the curve, with a live root-mean-square error.

## Parameters
Keys and ranges are the `particle2d` engine's `meta.params` for `cart` (branch `w1/engine-particle2d`).

| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| cartMode | Mode | | | | | uniform | enum: `uniform` (Constant a), `drive` (Drive), `match` (Match a graph) |
| x0 | Starting position | m | −10 | 10 | 0.5 | 0 | uniform and drive |
| u | Initial velocity u | m/s | −5 | 5 | 0.1 | 0 | + is to the right; uniform and drive |
| accel | Acceleration a | m/s² | −2 | 2 | 0.1 | 0.5 | constant; uniform only |
| challenge | Target graph | | | | | turn-back | select: `steady` (Steady walk), `speed-up` (Speeding up), `turn-back` (Turn back), `stop-start` (Stop and start); match only |
| duration | Run time | s | 1 | 60 | 1 | 10 | the run completes at this time |
| timeScale | Playback speed | × | 0.25 | 2 | 0.25 | 1 | |

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | uniform, x₀ −8 m, u 4 m/s, a −1 m/s², run 8 s | out and back: v passes through zero at t = 4 s while a stays −1 m/s² |
| from-rest | uniform, x₀ 0, u 0, a 2 m/s², run 3 s | the simplest uniformly accelerated motion |
| reversing | uniform, x₀ −5 m, u −2 m/s, a 1.5 m/s², run 4 s | starts moving left, turns round: distance and displacement differ |
| drive | drive, x₀ 0, u 0, run 15 s | free driving |
| match | match, target turn-back, run 10 s | graph-matching challenge |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| t | Time t | s | 3 |
| x | Position x | m | 3 |
| v | Velocity v | m/s | 3 |
| a | Acceleration a | m/s² | 3 |
| matchError | Match error (RMS) | m | 3 |
| targetX | Target position | m | 3 |

Definitions (the engine's outputs): `x`, `v`, `a` and `t` are current values (a is the constant a, or the throttle setting in drive and match modes); `matchError` and `targetX` appear in match mode only (— otherwise). The match targets start from rest at 0 m and are piecewise uniform acceleration (turn-back: 0.75 m/s² for 2 s, steady for 2 s, −0.75 m/s² for 4 s, then steady). The run ends exactly at the run time.

## Assumptions shown on stage
- Motion in a straight line; + is to the right
- Constant acceleration in "Constant a" mode
- The cart is a particle; no friction
- Match mode starts at 0 m, at rest

## Try this (3–5 predict, observe, explain prompts)
1. Predict: in the default run the cart starts at −8 m moving right at 4 m/s with a = −1 m/s². Sketch all three graphs before you press play. Where is the cart when it stops, and when?
2. Observe: at the moment the cart stops (t = 4 s), what are the velocity and the acceleration? Many people expect both to be zero.
3. Explain: at the end of the default run the cart is back at −8 m. What is its displacement, how far has it travelled, and what is its average velocity? Use the areas above and below the axis of the v–t graph.
4. Observe: pause at any time and estimate the gradient of the x–t graph at the cursor. Compare it with the v readout.
5. Predict, then try: in match mode, use only the throttle to match the "Turn back" target. What must your v–t graph look like, and when must you change the throttle?

## Teacher notes outline
- **Misconceptions to target:** an x–t graph is a picture of the path; negative acceleration always means slowing down; when v = 0, a = 0; distance and displacement are the same; a steeper v–t line means a faster object (it means larger acceleration).
- **10-minute lesson flow:** (1) default: sketch, then run (3 min); (2) pause at t = 4 s: v = 0 but a = −1 m/s² (2 min); (3) gradients and areas: v from the x–t gradient, Δx from the v–t area (2 min); (4) match mode in pairs: one drives, one coaches (3 min).
- **Original HSC-style question idea:** A trolley starts at the origin moving at 3.0 m/s and accelerates uniformly at −0.75 m/s² for 8.0 s. (a) Sketch its v–t graph. (b) Calculate its displacement after 8.0 s (0 m). (c) Calculate the distance it travels in that time (12 m). (d) State its velocity and acceleration at t = 4.0 s (0 m/s, −0.75 m/s²). (Write the full question and worked solution in the notes file.)

## Accessibility notes
- The three graphs are labelled with their quantity and units, not identified by colour; the target curve is dashed. The cart's arrows carry text values.
- Keyboard: all parameters are sliders with number entry, segmented controls or a select; in drive and match modes, with the stage focused, ← and → change the throttle by 0.5 m/s² per press (Space, `.` and R still run, step and reset); the throttle can also be dragged with a pointer.
- Stage `aria-label`: the engine's `describe()` sentence with the cart's time, position, velocity and acceleration.

## Engine change requests
- **Outputs `distance` (total path length ∫|v| dt, m) and `displacement` (x − x₀, m)** for the `cart` setup. Distance against displacement is a central idea of this page (prompt 3); until they exist students read them from the graph areas. Hand values for checks once they are added: default run at 8 s, displacement 0 and distance 16 m; at 6 s, 6 m and 10 m; `reversing` at 4 s, 4 m and 6.667 m.
- **Optional view overlays:** the tangent to the x–t curve at the cursor (gradient = v) and the shaded area under the v–t curve (signed area = Δx).

## Acceptance
Every number below comes from the formula and hand calculation shown here. With constant acceleration: x = x₀ + ut + ½at², v = u + at. RK4 is exact for constant acceleration, and the time step is 1/240 s, so N steps reach t = N/240 s.

- **Check 1, default run to the end (t = 8 s).** x₀ = −8, u = 4, a = −1. x = −8 + 4 × 8 − ½ × 64 = −8 + 32 − 32 = **−8 m**; v = 4 − 8 = **−4 m/s**; a = **−1 m/s²**; t = **8 s**. (Displacement 0; the turn at t = 4 s is at x = 0, so the distance is 8 + 8 = 16 m.)
- **Check 2, default after 480 steps (t = 2 s).** x = −8 + 8 − 2 = **−2 m**; v = 4 − 2 = **2 m/s**.
- **Check 3, default after 1440 steps (t = 6 s).** x = −8 + 24 − 18 = **−2 m**; v = 4 − 6 = **−2 m/s** (the same place as at 2 s, moving the other way).
- **Check 4, `from-rest`.** x₀ = 0, u = 0, a = 2, run 3 s: x = ½ × 2 × 9 = **9 m**; v = **6 m/s**.
- **Check 5, `reversing`.** x₀ = −5, u = −2, a = 1.5, run 4 s: x = −5 − 8 + ½ × 1.5 × 16 = **−1 m**; v = −2 + 6 = **4 m/s**. (Turn at 4/3 s at −6.333 m, so the distance is 1.333 + 5.333 = 6.667 m.)
- **Check 6, `match` target.** Turn-back target from rest at 0: 0–2 s at 0.75 m/s² gives x = 1.5 m, v = 1.5 m/s; 2–4 s steady gives x = 4.5 m. At t = 4 s (960 steps) the target is **4.5 m**. 4–8 s at −0.75 m/s²: Δx = 1.5 × 4 − ½ × 0.75 × 16 = 0, so x = 4.5 m with v = −1.5 m/s; then steady: at t = 10 s the target is 4.5 − 3 = **1.5 m**. With the throttle left at 0 the cart stays at **0 m**.

```acceptance
[
  { "name": "default run to the end", "preset": "default", "params": { "cartMode": "uniform", "x0": -8, "u": 4, "accel": -1, "duration": 8 }, "run": "complete",
    "expect": { "t": { "value": 8, "absTol": 1e-9 }, "x": { "value": -8, "absTol": 1e-6 }, "v": { "value": -4, "absTol": 1e-6 }, "a": { "value": -1, "absTol": 1e-9 } } },
  { "name": "default after 2 s", "params": { "cartMode": "uniform", "x0": -8, "u": 4, "accel": -1, "duration": 8 }, "run": { "steps": 480 },
    "expect": { "t": { "value": 2, "absTol": 1e-9 }, "x": { "value": -2, "absTol": 1e-6 }, "v": { "value": 2, "absTol": 1e-6 } } },
  { "name": "default after 6 s", "params": { "cartMode": "uniform", "x0": -8, "u": 4, "accel": -1, "duration": 8 }, "run": { "steps": 1440 },
    "expect": { "x": { "value": -2, "absTol": 1e-6 }, "v": { "value": -2, "absTol": 1e-6 } } },
  { "name": "from rest", "preset": "from-rest", "params": { "cartMode": "uniform", "x0": 0, "u": 0, "accel": 2, "duration": 3 }, "run": "complete",
    "expect": { "x": { "value": 9, "absTol": 1e-6 }, "v": { "value": 6, "absTol": 1e-6 } } },
  { "name": "reversing", "preset": "reversing", "params": { "cartMode": "uniform", "x0": -5, "u": -2, "accel": 1.5, "duration": 4 }, "run": "complete",
    "expect": { "x": { "value": -1, "absTol": 1e-6 }, "v": { "value": 4, "absTol": 1e-6 } } },
  { "name": "match target after 4 s", "preset": "match", "params": { "cartMode": "match", "challenge": "turn-back", "duration": 10 }, "run": { "steps": 960 },
    "expect": { "targetX": { "value": 4.5, "absTol": 1e-6 }, "x": { "value": 0, "absTol": 1e-9 } } },
  { "name": "match target at the end", "preset": "match", "params": { "cartMode": "match", "challenge": "turn-back", "duration": 10 }, "run": "complete",
    "expect": { "targetX": { "value": 1.5, "absTol": 1e-6 }, "t": { "value": 10, "absTol": 1e-9 } } }
]
```
