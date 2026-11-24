---
id: phy-circular-motion
title: "Circular motion and banked tracks"
subject: phy
engine: particle2d
setup: circular
priority: P1
status: draft            # stub → draft → approved (Gate B)
page: /interactives/physics/circular-motion.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Physics","version":"2017","area":"Module 5: Advanced Mechanics","outcomes":[],"verified":false}
  - {"course":"Physics","version":"2025","focusArea":"Advanced mechanics","year":12,"outcomes":[],"verified":false}
---
# Circular motion and banked tracks

> Backlog summary: Forces in circular motion, design speed of a banked track, torque.

## Learning goal
Students explain uniform circular motion as motion with a net force towards the centre of size mv²/r (provided by a real force such as tension, friction or a component of the normal force), calculate centripetal acceleration, period and angular velocity, find the design speed of a banked curve (v² = rg tan θ) and the friction needed above or below it, and calculate the torque of a force about a pivot, τ = rF sin θ.

Syllabus fit: 2017 Module 5 Advanced Mechanics (circular motion: centripetal force and acceleration, banked tracks, torque); 2025 Year 12 focus area Advanced mechanics.

## What the student sees
Default view at 1920×1080, projector theme, in three modes:

- **Mass on a string (top view).** A frictionless table seen from above, a pivot at the centre, a string of length r to an orange puck that moves anticlockwise round a circle at speed v. Arrows on the puck: velocity (orange, tangent, labelled `v = 4.00 m/s`) and tension (blue, towards the centre, labelled `T = 6.67 N`). A dashed circle shows the path. An in-stage button, **Cut the string**, removes the tension: the puck carries on in a straight line along the tangent, and the trail shows it.
- **Car on a curve.** Left: top view of a car driving round a curve of radius r. Right: a cross-section (rear view) of the car on a track banked at θ, with a free body diagram: weight mg (down), normal force N (perpendicular to the track), and friction f along the track (up or down the slope, or absent at the design speed). The net force arrow points horizontally towards the centre. A badge reads `Grip OK` or `Skids: needs μ = 0.35, has 0.30`.
- **Torque.** A spanner on a nut, seen face on. A force arrow of size F acts at distance r from the nut's centre at angle θ to the spanner. The perpendicular lever arm r sin θ is drawn as a dashed line with a right-angle mark, and the torque is shown as a curved arrow labelled `τ = 7.50 N m`. This mode is static.

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| mode | Situation | | | | | string | enum: `string` (Mass on a string), `banked` (Car on a curve), `torque` (Torque); segmented |
| mass | Mass m | kg | 0.1 | 5 | 0.1 | 0.5 | `visibleWhen: { mode: 'string' }` |
| radius | String length r | m | 0.2 | 3 | 0.1 | 1.2 | `visibleWhen: { mode: 'string' }` |
| speed | Speed v | m/s | 0.5 | 10 | 0.1 | 4 | `visibleWhen: { mode: 'string' }` |
| carMass | Car mass m | kg | 500 | 3000 | 50 | 1000 | `visibleWhen: { mode: 'banked' }` |
| curveRadius | Curve radius r | m | 10 | 300 | 5 | 50 | `visibleWhen: { mode: 'banked' }` |
| carSpeed | Car speed v | m/s | 1 | 40 | 0.5 | 20 | `visibleWhen: { mode: 'banked' }` |
| bankAngle | Bank angle θ | ° | 0 | 45 | 1 | 20 | 0° is a flat road; `visibleWhen: { mode: 'banked' }` |
| mu | Coefficient of friction μ | | 0 | 1.2 | 0.05 | 0.6 | for the grip badge only; `visibleWhen: { mode: 'banked' }` |
| g | Gravitational field strength g | m/s² | 1 | 25 | 0.1 | 9.8 | `visibleWhen: { mode: 'banked' }` |
| force | Applied force F | N | 0 | 200 | 1 | 50 | `visibleWhen: { mode: 'torque' }` |
| armLength | Distance from pivot r | m | 0.05 | 1 | 0.01 | 0.3 | `visibleWhen: { mode: 'torque' }` |
| forceAngle | Angle between force and spanner θ | ° | 0 | 180 | 1 | 90 | `visibleWhen: { mode: 'torque' }` |
| showVectors | Force and velocity arrows | | | | | on | |
| showComponents | Components of N | | | | | off | horizontal and vertical components on the cross-section; `visibleWhen: { mode: 'banked' }` |
| timeScale | Playback speed | × | 0.25 | 2 | 0.25 | 1 | |

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | mode string, m 0.5 kg, r 1.2 m, v 4 m/s | a puck on a string: T = 6.67 N |
| banked | mode banked, m 1000 kg, r 50 m, v 20 m/s, θ 20°, μ 0.6, g 9.8 | faster than the 13.4 m/s design speed: friction acts down the slope |
| design-speed | mode banked, m 1000 kg, r 50 m, v 13.5 m/s, θ 20°, μ 0.6, g 9.8 | close to the design speed: friction almost zero |
| flat-road | mode banked, m 1000 kg, r 50 m, v 15 m/s, θ 0°, μ 0.6, g 9.8 | friction alone provides the centripetal force |
| spanner | mode torque, F 50 N, r 0.30 m, θ 90° | the largest torque for this force and distance |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| centripetalForce | Centripetal force mv²/r | N | 3 |
| centripetalAcceleration | Centripetal acceleration v²/r | m/s² | 3 |
| period | Period T = 2πr/v | s | 3 |
| designSpeed | Design speed √(rg tan θ) | m/s | 3 |
| frictionForce | Friction needed f (+ down the slope) | N | 3 |
| torque | Torque τ = rF sin θ | N m | 3 |

Further outputs (stage labels and checks): `angularVelocity` ω = v/r (rad/s), `normalForce` N (N), `muNeeded` = |f|/N, `leverArm` r sin θ (m). Outputs that do not apply to the current mode are NaN (shown as —): `designSpeed`, `frictionForce`, `normalForce` and `muNeeded` are for `banked` only; `torque` and `leverArm` for `torque` only; the circular-motion outputs are NaN in `torque` mode.

Banked-track model (friction f along the slope, positive down the slope, i.e. towards the inside of the curve): horizontal, N sin θ + f cos θ = mv²/r; vertical, N cos θ − f sin θ = mg. Solving: N = m(g cos θ + (v²/r) sin θ) and f = m((v²/r) cos θ − g sin θ). The badge says "Skids" when |f| > μN.

## Assumptions shown on stage
- Uniform circular motion (constant speed)
- String mode: frictionless table, light inextensible string
- Car: treated as a particle; friction as needed up to μN; no air resistance; g = 9.8 m/s²
- Torque: force and spanner in the plane of the page

## Try this (3–5 predict, observe, explain prompts)
1. Predict: when you cut the string, which way will the puck go: outwards along the string, or along the tangent? Cut it and look at the trail.
2. Observe: double the speed of the puck. What happens to the tension? Now double the radius instead. Explain the difference using F = mv²/r.
3. Explain: on the `banked` preset, slow the car down until the friction readout reaches zero. Why does the speed you find not depend on the car's mass?
4. Predict: on a flat road (θ = 0), what is the fastest safe speed round a 50 m curve with μ = 0.6? Check with the grip badge.
5. Observe: in torque mode, keep F and r fixed and change the angle from 90° to 30°. By what factor does the torque fall, and why?

## Teacher notes outline
- **Misconceptions to target:** centripetal force is an extra force in the free body diagram (it is the net force, supplied by real forces); objects fly outwards when released (they move along the tangent); "centrifugal force" pushes the car outwards; a banked track needs friction at every speed; torque depends only on the force, not on where or at what angle it acts.
- **10-minute lesson flow:** (1) default: compute T = mv²/r, then cut the string (3 min); (2) `banked`: build the free body diagram, read N and f; slow down to the design speed (4 min); (3) `flat-road`: friction alone, find the skid speed (1 min); (4) `spanner`: τ = rF sin θ at three angles (2 min).
- **Original HSC-style question idea:** A 1200 kg car rounds a curve of radius 80 m banked at 12°. (a) Calculate the design speed (12.9 m/s). (b) The car travels at 20 m/s. Draw the forces on the car and calculate the friction force needed, stating its direction (3.42 × 10³ N down the slope). (c) Explain why a lighter car has the same design speed. (Write the full question and worked solution in the notes file.)

## Accessibility notes
- Each arrow carries a text label with symbol and value (v, T, mg, N, f, F); friction direction is also written ("down the slope" or "up the slope"). The grip badge uses words, not just colour. The lever arm is dashed with a right-angle mark.
- Keyboard: all parameters are sliders with number entry; the **Cut the string** button is a focusable stage button (Enter or Space), and also responds to the `C` key while the stage has focus; Space, `.` and R run, step and reset.
- Stage `aria-label` (from `describe()`): "A 0.5 kilogram puck moves in a circle of radius 1.2 metres at 4.0 metres per second. Tension 6.67 newtons towards the centre; period 1.88 seconds." Banked: "A 1000 kilogram car at 20 metres per second on a 50 metre curve banked at 20 degrees. Design speed 13.4 metres per second. Friction needed 4170 newtons down the slope; grip OK." Torque: "A 50 newton force acts 0.30 metres from the nut at 90 degrees to the spanner. Torque 15.0 newton metres."

## Engine change requests
- **Keys to reconcile with engine meta** (the `particle2d` meta was not published when this spec was written): params `mode`, `mass`, `radius`, `speed`, `carMass`, `curveRadius`, `carSpeed`, `bankAngle`, `mu`, `g`, `force`, `armLength`, `forceAngle`, `showVectors`, `showComponents`, `timeScale`; outputs `centripetalForce`, `centripetalAcceleration`, `period`, `angularVelocity`, `designSpeed`, `frictionForce`, `normalForce`, `muNeeded`, `torque`, `leverArm`.
- **Two view features beyond a plain particle:** (1) an in-stage **Cut the string** button that removes the central force mid-run (the release is an action, not a param); (2) a static **torque** mode (spanner, force, lever arm, torque arc). The backlog lists torque for this page; if the engine owner prefers, the torque view could live in the `statics` engine's `moments` setup instead and this page would gain a second engine, but one engine per page is simpler.
- The banked mode needs a side-by-side top view and cross-section with a free body diagram.
- A `describe()` method for the stage label above.

## Acceptance
Every number below comes from the formula and hand calculation shown here. Circular motion outputs are constant during uniform circular motion, so the time-based checks run 240 steps (1 s at the 1/240 s step) and read them; the torque check is static.

- **Check 1, mass on a string (default).** m = 0.5 kg, r = 1.2 m, v = 4 m/s. a = v²/r = 16/1.2 = **13.3333 m/s²**. F = ma = 0.5 × 13.3333 = **6.66667 N**. T = 2πr/v = 2π × 1.2/4 = **1.88496 s**. ω = v/r = 4/1.2 = **3.33333 rad/s**.
- **Check 2, banked curve above the design speed (`banked`).** m = 1000 kg, r = 50 m, θ = 20°, g = 9.8, v = 20 m/s. Design speed: v₀ = √(rg tan θ) = √(50 × 9.8 × 0.363970) = √178.345 = **13.3546 m/s**. v²/r = 400/50 = 8 m/s², so mv²/r = **8000 N**. N = 1000 × (9.8 × 0.939693 + 8 × 0.342020) = 1000 × (9.20899 + 2.73616) = **11 945.1 N**. f = 1000 × (8 × 0.939693 − 9.8 × 0.342020) = 1000 × (7.51754 − 3.35180) = **+4165.74 N** (down the slope). μ needed = 4165.74/11 945.1 = **0.348739**.
- **Check 3, below the design speed.** Same curve at v = 10 m/s: v²/r = 2 m/s². N = 1000 × (9.20899 + 2 × 0.342020) = **9893.03 N**; f = 1000 × (2 × 0.939693 − 3.35180) = 1000 × (1.87939 − 3.35180) = **−1472.41 N** (up the slope).
- **Check 4, flat road (`flat-road`).** θ = 0, v = 15 m/s, r = 50 m: f = mv²/r = 1000 × 225/50 = **4500 N**, N = mg = **9800 N**, μ needed = 4500/9800 = **0.459184**; design speed √(rg tan 0) = **0**.
- **Check 5, torque (`spanner`, then 30°).** τ = rF sin θ = 0.30 × 50 × sin 90° = **15.0 N m**. At θ = 30°: τ = 0.30 × 50 × 0.5 = **7.50 N m**, lever arm r sin θ = 0.30 × 0.5 = **0.150 m**.

```acceptance
[
  { "name": "mass on a string", "params": { "mode": "string", "mass": 0.5, "radius": 1.2, "speed": 4 }, "run": { "steps": 240 },
    "expect": { "centripetalAcceleration": { "value": 13.3333, "relTol": 1e-5 }, "centripetalForce": { "value": 6.66667, "relTol": 1e-5 }, "period": { "value": 1.88496, "relTol": 1e-5 }, "angularVelocity": { "value": 3.33333, "relTol": 1e-5 } } },
  { "name": "banked curve above the design speed", "preset": "banked", "params": { "mode": "banked", "carMass": 1000, "curveRadius": 50, "carSpeed": 20, "bankAngle": 20, "g": 9.8 }, "run": { "steps": 240 },
    "expect": { "designSpeed": { "value": 13.3546, "relTol": 1e-5 }, "centripetalForce": { "value": 8000, "relTol": 1e-6 }, "normalForce": { "value": 11945.1, "relTol": 1e-5 }, "frictionForce": { "value": 4165.74, "relTol": 1e-5 }, "muNeeded": { "value": 0.348739, "relTol": 1e-5 } } },
  { "name": "banked curve below the design speed", "params": { "mode": "banked", "carMass": 1000, "curveRadius": 50, "carSpeed": 10, "bankAngle": 20, "g": 9.8 }, "run": { "steps": 240 },
    "expect": { "normalForce": { "value": 9893.03, "relTol": 1e-5 }, "frictionForce": { "value": -1472.41, "relTol": 1e-5 } } },
  { "name": "flat road: friction does it all", "preset": "flat-road", "params": { "mode": "banked", "carMass": 1000, "curveRadius": 50, "carSpeed": 15, "bankAngle": 0, "g": 9.8 }, "run": { "steps": 240 },
    "expect": { "frictionForce": { "value": 4500, "relTol": 1e-6 }, "normalForce": { "value": 9800, "relTol": 1e-6 }, "muNeeded": { "value": 0.459184, "relTol": 1e-5 }, "designSpeed": { "value": 0, "absTol": 1e-9 } } },
  { "name": "spanner at 90°", "preset": "spanner", "params": { "mode": "torque", "force": 50, "armLength": 0.3, "forceAngle": 90 }, "run": "static",
    "expect": { "torque": { "value": 15, "relTol": 1e-9 } } },
  { "name": "spanner at 30°", "params": { "mode": "torque", "force": 50, "armLength": 0.3, "forceAngle": 30 }, "run": "static",
    "expect": { "torque": { "value": 7.5, "relTol": 1e-9 }, "leverArm": { "value": 0.15, "relTol": 1e-9 } } }
]
```
