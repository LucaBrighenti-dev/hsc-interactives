---
id: phy-circular-motion
title: "Circular motion and banked tracks"
subject: phy
engine: particle2d
setup: circular
priority: P1
status: approved            # stub → draft → approved (Gate B)
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
Default view at 1920×1080, projector theme (the `particle2d` engine's circular view), in three situations:

- **Mass on a string (top view).** A frictionless table seen from above with the string's pivot at the centre and a puck moving anticlockwise round a circle of radius r at speed v. Arrows on the puck: velocity (tangent, labelled v) and string tension (towards the centre, labelled F_T, so it is not confused with the period T). With "Cut the string after" set, the string is released at that time and the puck carries on in a straight line along the tangent; the trail shows it.
- **Car on a curve.** A top view of a car going round a curve of radius r, with a cross-section of the car on a track banked at θ showing the forces: weight mg, normal force N (perpendicular to the track) and the friction needed along the track (up or down the slope, or none at the design speed), with the net force pointing horizontally to the centre. The friction needed is compared with what μ can provide.
- **Torque.** A spanner on a nut. A force F acts at distance r from the pivot at angle θ to the spanner; the moment arm r sin θ is drawn dashed with a right-angle mark and the torque is labelled. This situation is static.

## Parameters
Keys and ranges are the `particle2d` engine's `meta.params` for `circular` (branch `w1/engine-particle2d`).

| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| circularMode | Situation | | | | | track | enum: `track` (Car on a curve), `string` (Mass on a string), `torque` (Torque) |
| radius | Radius r | m | 0.5 | 200 | 0.5 | 50 | string length or curve radius |
| speed | Speed v | m/s | 0 | 60 | 0.5 | 20 | shared with the projectile setup |
| mass | Mass m | kg | 0.1 | 10 | 0.1 | 1 | mass on the string |
| carMass | Car mass | kg | 500 | 3000 | 50 | 1500 | |
| bankAngle | Bank angle θ | ° | 0 | 45 | 1 | 15 | 0° is a flat road |
| mu | Tyre–road friction μ | | 0.1 | 1.2 | 0.01 | 0.7 | sets the speed limits for the curve |
| g | Gravitational field g | m/s² | 1 | 25 | 0.1 | 9.8 | |
| releaseAfter | Cut the string after | s | 0 | 20 | 0.5 | 0 | 0 keeps the string attached |
| force | Force F | N | 0 | 500 | 5 | 100 | torque |
| leverArm | Distance from pivot r | m | 0.05 | 2 | 0.05 | 0.3 | torque |
| forceAngle | Angle between r and F | ° | 0 | 180 | 5 | 90 | torque |
| duration | Run time | s | 1 | 60 | 1 | 10 | |
| showVectors | Force and velocity vectors | | | | | on | |
| trail | Show trail | | | | | on | |
| timeScale | Playback speed | × | 0.25 | 2 | 0.25 | 1 | |

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | string, r 1.2 m, v 4 m/s, m 0.5 kg, cut after 0 s, run 10 s | a puck on a string: F_T = 6.67 N |
| cut-string | string, r 1.2 m, v 4 m/s, m 0.5 kg, cut after 1 s, run 3 s | the puck leaves along the tangent |
| banked | track, car 1000 kg, r 50 m, v 20 m/s, θ 20°, μ 0.6, g 9.8 | faster than the 13.4 m/s design speed: friction acts down the slope |
| design-speed | track, car 1000 kg, r 50 m, v 13.5 m/s, θ 20°, μ 0.6, g 9.8 | close to the design speed: friction almost zero |
| flat-road | track, car 1000 kg, r 50 m, v 15 m/s, θ 0°, μ 0.6, g 9.8 | friction alone provides the centripetal force |
| spanner | torque, F 50 N, r 0.30 m, θ 90° | the largest torque for this force and distance |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| centripetalForce | Centripetal force | N | 3 |
| centripetalAccel | Centripetal acceleration | m/s² | 3 |
| period | Period T | s | 3 |
| designSpeed | Design speed √(rg tan θ) | m/s | 3 |
| frictionForce | Friction needed (down the slope +) | N | 3 |
| torque | Torque τ = rF sin θ | N·m | 3 |

Definitions (the engine's outputs): `period` = 2πr/v, `omega` = v/r, `centripetalAccel` = v²/r and `centripetalForce` = mv²/r (car mass on a curve; 0 once the string has been cut). On a curve: `designSpeed`, `normalForce` N = m(g cos θ + (v²/r) sin θ), `frictionForce` f = m((v²/r) cos θ − g sin θ) (positive down the slope, i.e. towards the inside of the curve), `muRequired` = |f|/N, and the speed limits `maxSpeed` = √(rg(sin θ + μ cos θ)/(cos θ − μ sin θ)) and `minSpeed` = √(rg(sin θ − μ cos θ)/(cos θ + μ sin θ)) (0 when friction alone can hold a stopped car). Torque: `torque`, `perpForce` = F sin θ and `momentArm` = r sin θ. Outputs that do not apply to the current situation are — (for example `torque` on a curve). `x`, `y`, `speed` and `t` are current values. The run ends at the run time.

## Assumptions shown on stage
- Uniform circular motion (constant speed)
- String: frictionless table, light inextensible string
- Car: treated as a particle; friction as needed up to μN; no air resistance; g = 9.8 m/s²
- Torque: force and spanner in the plane of the page

## Try this (3–5 predict, observe, explain prompts)
1. Predict: when the string is cut, which way will the puck go: outwards along the string, or along the tangent? Load `cut-string` and look at the trail.
2. Observe: double the speed of the puck. What happens to the tension? Now double the radius instead. Explain the difference using F = mv²/r.
3. Explain: on the `banked` preset, slow the car down until the friction readout reaches zero. Why does the speed you find not depend on the car's mass?
4. Predict: on a flat road (θ = 0), what is the fastest safe speed round a 50 m curve with μ = 0.6? Check against the maximum-speed value.
5. Observe: in torque mode, keep F and r fixed and change the angle from 90° to 30°. By what factor does the torque fall, and why?

## Teacher notes outline
- **Misconceptions to target:** centripetal force is an extra force in the free body diagram (it is the net force, supplied by real forces); objects fly outwards when released (they move along the tangent); "centrifugal force" pushes the car outwards; a banked track needs friction at every speed; torque depends only on the force, not on where or at what angle it acts.
- **10-minute lesson flow:** (1) default: compute F_T = mv²/r, then `cut-string` (3 min); (2) `banked`: build the free body diagram, read N and f; slow down to the design speed (4 min); (3) `flat-road`: friction alone, find the maximum speed (1 min); (4) `spanner`: τ = rF sin θ at three angles (2 min).
- **Original HSC-style question idea:** A 1200 kg car rounds a curve of radius 80 m banked at 12°. (a) Calculate the design speed (12.9 m/s). (b) The car travels at 20 m/s. Draw the forces on the car and calculate the friction force needed, stating its direction (3.42 × 10³ N down the slope). (c) Explain why a lighter car has the same design speed. (Write the full question and worked solution in the notes file.)

## Accessibility notes
- Each arrow carries a text label with symbol and value (v, F_T, mg, N, f, F); friction direction is also written ("down the slope" or "up the slope"). The moment arm is dashed with a right-angle mark.
- Keyboard: all parameters are sliders with number entry, a segmented control or toggles; Space, `.` and R run, step and reset.
- Stage `aria-label`: the engine's `describe()` sentence for the situation, for example the puck's mass, radius, speed and tension, or the car's speed, design speed and the friction needed.

## Engine change requests
- None: every key used here exists in the `particle2d` engine's meta on `w1/engine-particle2d`.

## Acceptance
Every number below comes from the formula and hand calculation shown here. The circular outputs do not change during uniform motion, so the time-based checks run 240 steps (1 s at the 1/240 s step); the cut-string check runs to the end; the torque checks are static.

- **Check 1, mass on a string (default).** m = 0.5 kg, r = 1.2 m, v = 4 m/s. a = v²/r = 16/1.2 = **13.3333 m/s²**. F = ma = 0.5 × 13.3333 = **6.66667 N**. T = 2πr/v = 2π × 1.2/4 = **1.88496 s**. ω = v/r = 4/1.2 = **3.33333 rad/s**.
- **Check 2, cutting the string (`cut-string`).** Same puck, released at t = 1 s, run 3 s. At release the puck has turned φ = ωt = 3.33333 rad from its start at (r, 0), so it is at (r cos φ, r sin φ) moving at 4 m/s along (−sin φ, cos φ). In the remaining 2 s it moves 8 m along that tangent: x = 1.2 cos φ − 8 sin φ = 1.2 × (−0.981674) − 8 × (−0.190568) = **0.346535 m**, y = 1.2 sin φ + 8 cos φ = 1.2 × (−0.190568) + 8 × (−0.981674) = **−8.08207 m**; its distance from the pivot is √(1.2² + 8²) = 8.0895 m. Speed still **4 m/s**; centripetal force **0** after the cut.
- **Check 3, banked curve above the design speed (`banked`).** m = 1000 kg, r = 50 m, θ = 20°, μ = 0.6, g = 9.8, v = 20 m/s. Design speed √(50 × 9.8 × 0.363970) = √178.345 = **13.3546 m/s**. v²/r = 8 m/s², so mv²/r = **8000 N**. N = 1000 × (9.8 × 0.939693 + 8 × 0.342020) = 1000 × (9.20899 + 2.73616) = **11 945.1 N**. f = 1000 × (8 × 0.939693 − 9.8 × 0.342020) = 1000 × (7.51754 − 3.35180) = **+4165.74 N** (down the slope). μ needed = 4165.74/11 945.1 = **0.348739**. Maximum speed = √(490 × (0.342020 + 0.563816)/(0.939693 − 0.205212)) = √(490 × 0.905836/0.734481) = √604.317 = **24.5829 m/s**; minimum speed **0** (sin θ − μ cos θ = −0.221796 < 0).
- **Check 4, below the design speed.** Same curve at v = 10 m/s: v²/r = 2 m/s². N = 1000 × (9.20899 + 0.684040) = **9893.03 N**; f = 1000 × (1.87939 − 3.35180) = **−1472.41 N** (up the slope).
- **Check 5, flat road (`flat-road`).** θ = 0, v = 15 m/s, r = 50 m: f = mv²/r = 1000 × 225/50 = **4500 N**, N = mg = **9800 N**, μ needed = 4500/9800 = **0.459184**; design speed **0**; maximum speed √(μrg) = √(0.6 × 50 × 9.8) = √294 = **17.1464 m/s**.
- **Check 6, a slippery banked curve.** θ = 20°, r = 50 m, μ = 0.1, v = 20 m/s: maximum speed √(490 × (0.342020 + 0.093969)/(0.939693 − 0.034202)) = √(490 × 0.481495) = √235.932 = **15.3601 m/s**, minimum speed √(490 × (0.342020 − 0.093969)/(0.939693 + 0.034202)) = √(490 × 0.254700) = √124.803 = **11.1715 m/s**, so 20 m/s is too fast for this curve.
- **Check 7, torque (`spanner`, then 30°).** τ = rF sin θ = 0.30 × 50 × sin 90° = **15.0 N·m**. At θ = 30°: τ = 0.30 × 50 × 0.5 = **7.50 N·m**, perpendicular force 50 × 0.5 = **25 N**, moment arm 0.30 × 0.5 = **0.150 m**.

```acceptance
[
  { "name": "mass on a string", "preset": "default", "params": { "circularMode": "string", "mass": 0.5, "radius": 1.2, "speed": 4, "releaseAfter": 0 }, "run": { "steps": 240 },
    "expect": { "centripetalAccel": { "value": 13.3333, "relTol": 1e-5 }, "centripetalForce": { "value": 6.66667, "relTol": 1e-5 }, "period": { "value": 1.88496, "relTol": 1e-5 }, "omega": { "value": 3.33333, "relTol": 1e-5 } } },
  { "name": "cutting the string", "preset": "cut-string", "params": { "circularMode": "string", "mass": 0.5, "radius": 1.2, "speed": 4, "releaseAfter": 1, "duration": 3 }, "run": "complete",
    "expect": { "x": { "value": 0.346535, "absTol": 0.001 }, "y": { "value": -8.08207, "relTol": 0.001 }, "speed": { "value": 4, "relTol": 1e-5 }, "centripetalForce": { "value": 0, "absTol": 1e-9 }, "t": { "value": 3, "absTol": 1e-9 } } },
  { "name": "banked curve above the design speed", "preset": "banked", "params": { "circularMode": "track", "carMass": 1000, "radius": 50, "speed": 20, "bankAngle": 20, "mu": 0.6, "g": 9.8 }, "run": { "steps": 240 },
    "expect": { "designSpeed": { "value": 13.3546, "relTol": 1e-5 }, "centripetalForce": { "value": 8000, "relTol": 1e-6 }, "normalForce": { "value": 11945.1, "relTol": 1e-5 }, "frictionForce": { "value": 4165.74, "relTol": 1e-5 }, "muRequired": { "value": 0.348739, "relTol": 1e-5 }, "maxSpeed": { "value": 24.5829, "relTol": 1e-5 }, "minSpeed": { "value": 0, "absTol": 1e-9 } } },
  { "name": "banked curve below the design speed", "params": { "circularMode": "track", "carMass": 1000, "radius": 50, "speed": 10, "bankAngle": 20, "mu": 0.6, "g": 9.8 }, "run": { "steps": 240 },
    "expect": { "normalForce": { "value": 9893.03, "relTol": 1e-5 }, "frictionForce": { "value": -1472.41, "relTol": 1e-5 } } },
  { "name": "flat road: friction does it all", "preset": "flat-road", "params": { "circularMode": "track", "carMass": 1000, "radius": 50, "speed": 15, "bankAngle": 0, "mu": 0.6, "g": 9.8 }, "run": { "steps": 240 },
    "expect": { "frictionForce": { "value": 4500, "relTol": 1e-6 }, "normalForce": { "value": 9800, "relTol": 1e-6 }, "muRequired": { "value": 0.459184, "relTol": 1e-5 }, "designSpeed": { "value": 0, "absTol": 1e-9 }, "maxSpeed": { "value": 17.1464, "relTol": 1e-5 } } },
  { "name": "slippery banked curve: speed window", "params": { "circularMode": "track", "carMass": 1000, "radius": 50, "speed": 20, "bankAngle": 20, "mu": 0.1, "g": 9.8 }, "run": { "steps": 240 },
    "expect": { "maxSpeed": { "value": 15.3601, "relTol": 1e-5 }, "minSpeed": { "value": 11.1715, "relTol": 1e-5 } } },
  { "name": "spanner at 90°", "preset": "spanner", "params": { "circularMode": "torque", "force": 50, "leverArm": 0.3, "forceAngle": 90 }, "run": "static",
    "expect": { "torque": { "value": 15, "relTol": 1e-9 } } },
  { "name": "spanner at 30°", "params": { "circularMode": "torque", "force": 50, "leverArm": 0.3, "forceAngle": 30 }, "run": "static",
    "expect": { "torque": { "value": 7.5, "relTol": 1e-9 }, "perpForce": { "value": 25, "relTol": 1e-9 }, "momentArm": { "value": 0.15, "relTol": 1e-9 } } }
]
```
