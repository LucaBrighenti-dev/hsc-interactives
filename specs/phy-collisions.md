---
id: phy-collisions
title: "Collisions"
subject: phy
engine: particle2d
setup: collisions
priority: P1
status: draft            # stub → draft → approved (Gate B)
page: /interactives/physics/collisions.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Physics","version":"2017","area":"Module 2: Dynamics","outcomes":[],"verified":false}
  - {"course":"Physics","version":"2025","focusArea":"Fundamentals of mechanics","year":11,"outcomes":[],"verified":false}
---
# Collisions

> Backlog summary: 1D and 2D collisions with momentum and kinetic energy bars; elasticity slider.

## Learning goal
Students see that total momentum is conserved in every collision of an isolated system, in one and two dimensions (as a vector, component by component), while kinetic energy is conserved only in elastic collisions. They classify collisions as elastic or inelastic from the energy bars and use conservation of momentum to find unknown velocities.

Syllabus fit: 2017 Module 2 Dynamics (momentum, impulse and collisions; elastic and inelastic collisions); 2025 Year 11 focus area Fundamentals of mechanics. Year 11 level: 1D calculations, with 2D shown as vector addition of momentum.

## What the student sees
Default view at 1920×1080, projector theme:

- **1D:** a frictionless air track across the stage with two gliders, A (orange, labelled `A 2.0 kg`) and B (blue, labelled `B 1.0 kg`), each with a velocity arrow and value (`u = 3.00 m/s`). They move, collide and separate (or stick when e = 0).
- **2D:** an air table seen from above with two equal-sized pucks; A slides in from the left along the x-axis and strikes B off-centre. The line of centres at impact is drawn dashed; after the collision each puck's path is traced and its direction angle labelled.
- **Bar charts (right side):** momentum bars for A, B and the total, before and after (signed: bars below the axis for negative momentum; in 2D, separate px and py bars). Kinetic energy bars for A, B and the total, with the energy lost shown as a hatched grey block.
- **2D vector diagram (optional):** momentum vectors before (one arrow) and after (two arrows head to tail), showing that they add to the same total.

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| dimension | Collision | | | | | 1d | enum: `1d` (Track, 1D), `2d` (Table, 2D); segmented |
| m1 | Mass of A, m₁ | kg | 0.1 | 10 | 0.1 | 2 | |
| m2 | Mass of B, m₂ | kg | 0.1 | 10 | 0.1 | 1 | |
| u1 | Initial velocity of A, u₁ | m/s | −10 | 10 | 0.1 | 3 | along +x; positive to the right |
| u2 | Initial velocity of B, u₂ | m/s | −10 | 10 | 0.1 | 0 | along x |
| restitution | Elasticity e (coefficient of restitution) | | 0 | 1 | 0.05 | 1 | 1 elastic, 0 perfectly inelastic (they stick together) |
| offset | Aim offset b/(r_A + r_B) | | −0.95 | 0.95 | 0.05 | 0.5 | how far B's centre sits above A's path, as a fraction of the sum of the radii; `visibleWhen: { dimension: '2d' }` |
| showBars | Momentum and energy bars | | | | | on | |
| showVectorSum | Momentum vector diagram | | | | | on | `visibleWhen: { dimension: '2d' }` |
| timeScale | Playback speed | × | 0.25 | 2 | 0.25 | 1 | |

Geometry: A starts on the left and B on the right, far enough apart that they meet within a few seconds. In 2D, B starts at rest or moving along x with its centre a distance b = offset × (r_A + r_B) above A's line of motion, so at impact the line of centres makes an angle α with the x-axis where sin α = offset. The collision is resolved along the line of centres with coefficient of restitution e; the components along the common tangent are unchanged (smooth pucks).

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | 1D, m₁ 2, m₂ 1, u₁ 3, u₂ 0, e 1 | elastic: A slows to 1 m/s, B leaves at 4 m/s |
| stick | 1D, m₁ 2, m₂ 1, u₁ 3, u₂ 0, e 0 | perfectly inelastic: they move off together and a third of the KE is lost |
| head-on-swap | 1D, m₁ 1, m₂ 1, u₁ 3, u₂ −1, e 1 | equal masses swap velocities |
| glancing | 2D, m₁ 1, m₂ 1, u₁ 4, u₂ 0, e 1, offset 0.5 | equal masses, elastic, target at rest: paths 90° apart |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| v1 | Velocity of A | m/s | 3 |
| v2 | Velocity of B | m/s | 3 |
| px | Total momentum pₓ | kg m/s | 3 |
| py | Total momentum p_y | kg m/s | 3 |
| keTotal | Total kinetic energy | J | 3 |
| keLost | Kinetic energy lost | J | 3 |

Definitions: in 1D, `v1` and `v2` are the current signed velocities (positive to the right). In 2D they are the current speeds, and the outputs `angle1` and `angle2` give each puck's direction of motion in degrees, anticlockwise from +x, in (−180°, 180°]. `keLost` = initial total KE − current total KE. The run completes 1.0 s after the collision ends (or 10 s after the start if the bodies never meet); readouts then show the final values.

## Assumptions shown on stage
- Isolated system: frictionless track or table, no external horizontal force
- Collision is instantaneous; smooth pucks (impulse along the line of centres)
- Elasticity e: 1 elastic, 0 the bodies stick together
- KE lost goes to heat, sound and deformation

## Try this (3–5 predict, observe, explain prompts)
1. Predict: in the default elastic collision, will A stop, keep going forwards, or bounce back? Run it. Now make m₁ smaller than m₂ and try again.
2. Observe: set e = 0 (`stick` preset). Compare the total momentum bar before and after. Then compare the total KE bar. What is conserved and what is not?
3. Explain: in `head-on-swap`, two equal gliders exchange velocities. Show from momentum and energy conservation that this is the only possible elastic outcome.
4. Observe: in the 2D `glancing` preset, measure the angle between the two paths after the collision. Change the offset. What stays the same?
5. Explain: in 2D, why must the total p_y stay zero even though both pucks move off at an angle?

## Teacher notes outline
- **Misconceptions to target:** momentum is lost in inelastic collisions (KE is lost, momentum is not); a heavier object exerts a bigger force on a lighter one during the collision (Newton's third law: equal and opposite); elastic means "bouncy" rather than "KE conserved"; momentum is a scalar, so 2D momenta add like numbers.
- **10-minute lesson flow:** (1) default: predict, run, check p before and after (2 min); (2) slide e from 1 to 0: momentum bars unchanged, KE lost grows (3 min); (3) `head-on-swap`: why equal masses swap (2 min); (4) `glancing`: vector diagram, components conserved (3 min).
- **Original HSC-style question idea:** A 0.16 kg ball moving at 4.0 m/s strikes a stationary 0.20 kg ball head-on. Afterwards the first ball moves at 0.50 m/s in its original direction. (a) Calculate the velocity of the second ball (2.8 m/s). (b) Determine, with calculations, whether the collision is elastic (KE falls from 1.28 J to 0.804 J: inelastic). (c) Describe where the missing energy has gone. (Write the full question and worked solution in the notes file.)

## Accessibility notes
- Bodies are labelled A and B with their masses, not just coloured. Negative momentum bars hang below the axis and carry a minus sign; the KE lost block is hatched. Path angles are written as text.
- Keyboard: all parameters are sliders with number entry or segmented controls; Space, `.` and R run, step and reset.
- Stage `aria-label` (from `describe()`): "One-dimensional collision. A, 2.0 kilograms at 3.00 metres per second, hits B, 1.0 kilograms at rest. Elastic. After: A moves at 1.00 metres per second and B at 4.00 metres per second. Total momentum 6.00 kilogram metres per second before and after; no kinetic energy lost."

## Engine change requests
- **Keys to reconcile with engine meta** (the `particle2d` meta was not published when this spec was written): params `dimension`, `m1`, `m2`, `u1`, `u2`, `restitution`, `offset`, `showBars`, `showVectorSum`, `timeScale`; outputs `v1`, `v2`, `angle1`, `angle2`, `px`, `py`, `keTotal`, `keLost`.
- The `collisions` setup needs bar charts (momentum and KE, before and after) and the 2D momentum vector diagram as view features.
- A `describe()` method for the stage label above.

## Acceptance
Every number below comes from the formula and hand calculation shown here. Along the line of impact, with approach speeds u₁, u₂: v₁ = (m₁u₁ + m₂u₂ − m₂e(u₁ − u₂))/(m₁ + m₂) and v₂ = (m₁u₁ + m₂u₂ + m₁e(u₁ − u₂))/(m₁ + m₂). These satisfy momentum conservation and v₂ − v₁ = e(u₁ − u₂). The impulse is applied exactly at contact, so the results are exact apart from rounding.

- **Check 1, elastic (default).** m₁ = 2, m₂ = 1, u₁ = 3, u₂ = 0, e = 1. v₁ = (6 − 1 × 3)/3 = **1 m/s**; v₂ = (6 + 2 × 3)/3 = **4 m/s**. pₓ = 2 × 3 = **6 kg m/s** (after: 2 × 1 + 1 × 4 = 6 ✓). KE = ½ × 2 × 9 = **9 J** before; after ½ × 2 × 1 + ½ × 1 × 16 = 1 + 8 = **9 J**; lost **0 J**.
- **Check 2, perfectly inelastic (`stick`).** e = 0: v₁ = v₂ = 6/3 = **2 m/s**. KE after = ½ × 3 × 4 = **6 J**; lost 9 − 6 = **3 J**.
- **Check 3, equal masses swap (`head-on-swap`).** m₁ = m₂ = 1, u₁ = 3, u₂ = −1, e = 1. v₁ = (3 − 1 − 1 × 4)/2 = **−1 m/s**; v₂ = (2 + 4)/2 = **3 m/s**. pₓ = 3 − 1 = **2 kg m/s**.
- **Check 4, partly elastic.** m₁ = 1, m₂ = 3, u₁ = 4, u₂ = 0, e = 0.5. v₁ = (4 − 3 × 0.5 × 4)/4 = (4 − 6)/4 = **−0.5 m/s** (A bounces back); v₂ = (4 + 1 × 0.5 × 4)/4 = **1.5 m/s**. Check: p = −0.5 + 4.5 = 4 ✓; separation 2.0 = 0.5 × 4 ✓. KE before ½ × 1 × 16 = 8 J; after ½ × 0.25 + ½ × 3 × 2.25 = 0.125 + 3.375 = **3.5 J**; lost **4.5 J**.
- **Check 5, 2D elastic glancing (`glancing`).** m₁ = m₂ = 1, u₁ = 4, u₂ = 0, e = 1, offset 0.5, so α = asin 0.5 = 30°. Along the line of centres A's component is 4 cos 30° = 3.46410 and the tangential component is 4 sin 30° = 2. Equal masses, elastic: the normal components swap. B moves along the line of centres at **3.46410 m/s**, direction **+30°**. A keeps only its tangential component, **2 m/s**, direction 30° − 90° = **−60°**. Totals: pₓ = 2 cos 60° + 3.46410 cos 30° = 1 + 3 = **4 kg m/s**; p_y = −2 sin 60° + 3.46410 sin 30° = −1.73205 + 1.73205 = **0**. KE: 8 J before, ½(4 + 12) = 8 J after; lost **0**.
- **Check 6, 2D perfectly inelastic.** Same with e = 0. Normal components: both become (3.46410 + 0)/2 = 1.73205 along the line of centres. B (no tangential part) moves at **1.73205 m/s** at **+30°**. A: normal 1.73205 plus tangential 2 (direction −60°): velocity = 1.73205(cos 30°, sin 30°) + 2(cos(−60°), sin(−60°)) = (1.5 + 1, 0.866025 − 1.73205) = (2.5, −0.866025); speed √(6.25 + 0.75) = √7 = **2.64575 m/s**, direction atan(−0.866025/2.5) = **−19.1066°**. KE after ½(7 + 3) = 5 J; lost **3 J**. pₓ = 2.5 + 1.5 = **4** ✓.

```acceptance
[
  { "name": "1D elastic (default)", "params": { "dimension": "1d", "m1": 2, "m2": 1, "u1": 3, "u2": 0, "restitution": 1 }, "run": "complete",
    "expect": { "v1": { "value": 1, "absTol": 1e-6 }, "v2": { "value": 4, "absTol": 1e-6 }, "px": { "value": 6, "absTol": 1e-6 }, "keTotal": { "value": 9, "absTol": 1e-6 }, "keLost": { "value": 0, "absTol": 1e-6 } } },
  { "name": "1D perfectly inelastic", "preset": "stick", "params": { "dimension": "1d", "m1": 2, "m2": 1, "u1": 3, "u2": 0, "restitution": 0 }, "run": "complete",
    "expect": { "v1": { "value": 2, "absTol": 1e-6 }, "v2": { "value": 2, "absTol": 1e-6 }, "px": { "value": 6, "absTol": 1e-6 }, "keTotal": { "value": 6, "absTol": 1e-6 }, "keLost": { "value": 3, "absTol": 1e-6 } } },
  { "name": "equal masses swap velocities", "preset": "head-on-swap", "params": { "dimension": "1d", "m1": 1, "m2": 1, "u1": 3, "u2": -1, "restitution": 1 }, "run": "complete",
    "expect": { "v1": { "value": -1, "absTol": 1e-9 }, "v2": { "value": 3, "absTol": 1e-9 }, "px": { "value": 2, "absTol": 1e-9 } } },
  { "name": "1D with e = 0.5", "params": { "dimension": "1d", "m1": 1, "m2": 3, "u1": 4, "u2": 0, "restitution": 0.5 }, "run": "complete",
    "expect": { "v1": { "value": -0.5, "absTol": 1e-6 }, "v2": { "value": 1.5, "absTol": 1e-6 }, "keTotal": { "value": 3.5, "absTol": 1e-6 }, "keLost": { "value": 4.5, "absTol": 1e-6 } } },
  { "name": "2D elastic glancing collision", "preset": "glancing", "params": { "dimension": "2d", "m1": 1, "m2": 1, "u1": 4, "u2": 0, "restitution": 1, "offset": 0.5 }, "run": "complete",
    "expect": { "v1": { "value": 2, "absTol": 1e-6 }, "v2": { "value": 3.46410, "absTol": 1e-5 }, "angle1": { "value": -60, "absTol": 1e-4 }, "angle2": { "value": 30, "absTol": 1e-4 }, "px": { "value": 4, "absTol": 1e-6 }, "py": { "value": 0, "absTol": 1e-6 }, "keLost": { "value": 0, "absTol": 1e-6 } } },
  { "name": "2D perfectly inelastic glancing collision", "params": { "dimension": "2d", "m1": 1, "m2": 1, "u1": 4, "u2": 0, "restitution": 0, "offset": 0.5 }, "run": "complete",
    "expect": { "v1": { "value": 2.64575, "absTol": 1e-5 }, "v2": { "value": 1.73205, "absTol": 1e-5 }, "angle1": { "value": -19.1066, "absTol": 1e-4 }, "angle2": { "value": 30, "absTol": 1e-4 }, "px": { "value": 4, "absTol": 1e-6 }, "keLost": { "value": 3, "absTol": 1e-6 } } }
]
```
