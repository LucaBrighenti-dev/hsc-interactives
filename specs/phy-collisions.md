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
Students see that total momentum is conserved in every collision of an isolated system, in one and two dimensions (as a vector, component by component), while kinetic energy is conserved only in elastic collisions. They classify collisions as elastic or inelastic from the energy bars, use conservation of momentum to find unknown velocities, and relate the change in momentum of each body to the impulse it receives.

Syllabus fit: 2017 Module 2 Dynamics (momentum, impulse and collisions; elastic and inelastic collisions); 2025 Year 11 focus area Fundamentals of mechanics. Year 11 level: 1D calculations, with 2D shown as vector addition of momentum.

## What the student sees
Default view at 1920×1080, projector theme (the `particle2d` engine's collisions view):

- Two equal-sized pucks, A and B (radius 0.25 m), on a frictionless surface seen from above, each labelled with its mass and velocity. A starts 3 m to the left of B. In 1D they move along one line; in 2D, A's line of motion is offset sideways by b from B's centre, so it strikes B off-centre and both move off at angles, with their paths traced and their directions labelled.
- **Bar charts (optional):** momentum of A, B and the total, before and after (signed, so bars below the axis show negative momentum, with separate x and y bars in 2D), and kinetic energy of A, B and the total, with the energy lost shown separately.
- The run ends 2.5 s after the collision.

## Parameters
Keys and ranges are the `particle2d` engine's `meta.params` for `collisions` (branch `w1/engine-particle2d`).

| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| dimension | Collision | | | | | 1d | enum: `1d`, `2d` |
| m1 | Mass of A | kg | 0.1 | 10 | 0.1 | 1 | |
| m2 | Mass of B | kg | 0.1 | 10 | 0.1 | 1 | |
| u1 | Initial velocity of A | m/s | −5 | 5 | 0.1 | 2 | along x; positive to the right |
| u2 | Initial velocity of B | m/s | −5 | 5 | 0.1 | 0 | along x |
| restitution | Coefficient of restitution e | | 0 | 1 | 0.05 | 1 | 1 is elastic; 0 leaves no relative velocity along the line of centres (in 1D they move off together; in 2D the pucks can still slide apart sideways) |
| offset | Offset b | m | −0.6 | 0.6 | 0.05 | 0.2 | 2D only: sideways distance between the centres' lines; the pucks miss when \|b\| ≥ 0.5 m |
| showBars | Momentum and energy bars | | | | | on | |
| timeScale | Playback speed | × | 0.25 | 2 | 0.25 | 1 | |

Geometry (engine): A starts at x = −3 m, y = b; B at the origin. At contact the line of centres makes an angle α with the x-axis, where sin α = b/(r_A + r_B) = b/0.5. The impulse acts along the line of centres; components along the common tangent are unchanged (smooth pucks).

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | 1D, m₁ 2, m₂ 1, u₁ 3, u₂ 0, e 1 | elastic: A slows to 1 m/s, B leaves at 4 m/s |
| stick | 1D, m₁ 2, m₂ 1, u₁ 3, u₂ 0, e 0 | perfectly inelastic: they move off together and a third of the KE is lost |
| head-on-swap | 1D, m₁ 1, m₂ 1, u₁ 3, u₂ −1, e 1 | equal masses swap velocities |
| glancing | 2D, m₁ 1, m₂ 1, u₁ 4, u₂ 0, e 1, b 0.25 m | equal masses, elastic, target at rest: paths 90° apart |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| vA | Velocity of A (x) | m/s | 3 |
| vB | Velocity of B (x) | m/s | 3 |
| pTotal | Total momentum (x) | kg·m/s | 3 |
| keTotal | Total kinetic energy | J | 3 |
| keLost | Kinetic energy lost | J | 3 |
| impulse | Impulse | N·s | 3 |

Definitions (the engine's outputs): `vA`, `vB` are the x-velocities and `vAy`, `vBy` the y-velocities; `pTotal` and `pTotalY` the total momentum components; `angleA`, `angleB` each puck's direction after the collision (° anticlockwise from +x); `keLost` = initial KE − current KE and `impulse` (the size of the impulse along the line of centres) appear after the collision; `collisionTime` is when contact happens. The contact time is solved exactly, so the results are exact apart from rounding.

## Assumptions shown on stage
- Isolated system: frictionless surface, no external horizontal force
- Collision is instantaneous; smooth pucks (impulse along the line of centres)
- e = 1 elastic; e = 0 no rebound along the line of centres (in 1D, they stick together)
- KE lost goes to heat, sound and deformation

## Try this (3–5 predict, observe, explain prompts)
1. Predict: in the default elastic collision, will A stop, keep going forwards, or bounce back? Run it. Now make m₁ smaller than m₂ and try again.
2. Observe: set e = 0 (`stick` preset). Compare the total momentum bar before and after. Then compare the total KE bar. What is conserved and what is not?
3. Explain: in `head-on-swap`, two equal gliders exchange velocities. Show from momentum and energy conservation that this is the only possible elastic outcome.
4. Observe: in the 2D `glancing` preset, measure the angle between the two paths after the collision. Change the offset. What stays the same?
5. Explain: in the `stick` preset the impulse readout is 2 N·s. Show that this equals B's change in momentum, and that A's change in momentum is equal and opposite.

## Teacher notes outline
- **Misconceptions to target:** momentum is lost in inelastic collisions (KE is lost, momentum is not); a heavier object exerts a bigger force on a lighter one during the collision (Newton's third law: equal and opposite); elastic means "bouncy" rather than "KE conserved"; momentum is a scalar, so 2D momenta add like numbers.
- **10-minute lesson flow:** (1) default: predict, run, check p before and after (2 min); (2) slide e from 1 to 0: momentum bars unchanged, KE lost grows (3 min); (3) `head-on-swap`: why equal masses swap; impulse = change in momentum (2 min); (4) `glancing`: momentum components conserved; 90° between the paths (3 min).
- **Original HSC-style question idea:** A 0.16 kg ball moving at 4.0 m/s strikes a stationary 0.20 kg ball head-on. Afterwards the first ball moves at 0.50 m/s in its original direction. (a) Calculate the velocity of the second ball (2.8 m/s). (b) Determine, with calculations, whether the collision is elastic (KE falls from 1.28 J to 0.804 J: inelastic). (c) Describe where the missing energy has gone. (Write the full question and worked solution in the notes file.)

## Accessibility notes
- Pucks are labelled A and B with their masses, not just coloured. Negative momentum bars hang below the axis and carry a minus sign; the KE lost is a separate labelled bar. Path angles are written as text.
- Keyboard: all parameters are sliders with number entry or segmented controls; Space, `.` and R run, step and reset.
- Stage `aria-label`: the engine's `describe()` sentence giving the masses, velocities before and after, total momentum and kinetic energy lost.

## Engine change requests
- Every key used here exists in the `particle2d` engine's meta on `w1/engine-particle2d`.
- **Restitution help text (particle2d):** the `restitution` help says "0 means the pucks stick together", which is only true in 1D; in 2D, smooth pucks with e = 0 can still slide apart (Check 6). Suggested text: "1 is elastic; 0 leaves no rebound along the line of centres (in 1D the pucks move off together)." The orchestrator has passed this to the particle2d builder.

## Acceptance
Every number below comes from the formula and hand calculation shown here. Along the line of impact, with approach velocities u₁, u₂: v₁ = (m₁u₁ + m₂u₂ − m₂e(u₁ − u₂))/(m₁ + m₂) and v₂ = (m₁u₁ + m₂u₂ + m₁e(u₁ − u₂))/(m₁ + m₂), which conserve momentum and give a separation speed e times the approach speed. The impulse along the line of centres is J = (1 + e)(approach speed)/(1/m₁ + 1/m₂). Contact happens when the centres are 0.5 m apart.

- **Check 1, elastic (default).** m₁ = 2, m₂ = 1, u₁ = 3, u₂ = 0, e = 1. v₁ = (6 − 1 × 3)/3 = **1 m/s**; v₂ = (6 + 2 × 3)/3 = **4 m/s**. p = 2 × 3 = **6 kg·m/s** (after: 2 + 4 = 6 ✓). KE = ½ × 2 × 9 = **9 J** before and 1 + 8 = **9 J** after; lost **0**. J = 2 × 3/(1/2 + 1) = **4 N·s** (B's momentum change, 1 × 4). Contact after (3 − 0.5)/3 = **0.833333 s**.
- **Check 2, perfectly inelastic (`stick`).** e = 0: v₁ = v₂ = 6/3 = **2 m/s**. KE after = ½ × 3 × 4 = **6 J**; lost 9 − 6 = **3 J**. J = 1 × 3/1.5 = **2 N·s**.
- **Check 3, equal masses swap (`head-on-swap`).** m₁ = m₂ = 1, u₁ = 3, u₂ = −1, e = 1. v₁ = (3 − 1 − 1 × 4)/2 = **−1 m/s**; v₂ = (2 + 4)/2 = **3 m/s**. p = **2 kg·m/s**. Closing speed 4 m/s, so contact after 2.5/4 = **0.625 s**.
- **Check 4, partly elastic.** m₁ = 1, m₂ = 3, u₁ = 4, u₂ = 0, e = 0.5. v₁ = (4 − 3 × 0.5 × 4)/4 = **−0.5 m/s** (A bounces back); v₂ = (4 + 1 × 0.5 × 4)/4 = **1.5 m/s**. KE before 8 J; after 0.125 + 3.375 = **3.5 J**; lost **4.5 J**. J = 1.5 × 4/(1 + 1/3) = **4.5 N·s**.
- **Check 5, 2D elastic glancing collision (`glancing`).** m₁ = m₂ = 1, u₁ = 4, e = 1, b = 0.25 m, so sin α = 0.25/0.5 and α = 30°. A sits above B's line, so the line of centres from B to A at contact is (−cos 30°, sin 30°) and B is pushed the opposite way, at −30°. A's velocity component along the line is 4 cos 30° = 3.46410 m/s and its tangential component is 4 sin 30° = 2 m/s. Equal masses, elastic: the components along the line swap. B: 3.46410 m/s at −30°, i.e. (**3**, **−1.73205**) m/s. A keeps only its tangential part, 2 m/s at +60°: (**1**, **1.73205**) m/s. The paths are 90° apart. pₓ = 1 + 3 = **4**, p_y = 1.73205 − 1.73205 = **0**; KE lost **0**; J = 2 × 3.46410/2 = **3.46410 N·s**. Contact when A's centre is at x = −√(0.5² − 0.25²) = −0.433013 m, after (3 − 0.433013)/4 = **0.641747 s**.
- **Check 6, 2D with e = 0.** Same, e = 0: along the line both end with (3.46410 + 0)/2 = 1.73205 m/s, so there is no rebound along the line of centres, but A keeps its tangential 2 m/s and the pucks slide apart. B: 1.73205 m/s at −30°, (1.5, **−0.866025**) m/s. A: 1.73205 × (cos 30°, −sin 30°) + 2 × (cos 60°, sin 60°) = (1.5 + 1, −0.866025 + 1.73205) = (**2.5**, **0.866025**) m/s, direction atan(0.866025/2.5) = **19.1066°**. KE after ½(7 + 3) = 5 J; lost **3 J** (sticking together would have lost 4 J). J = 1 × 3.46410/2 = **1.73205 N·s**.

```acceptance
[
  { "name": "1D elastic (default)", "preset": "default", "params": { "dimension": "1d", "m1": 2, "m2": 1, "u1": 3, "u2": 0, "restitution": 1 }, "run": "complete",
    "expect": { "vA": { "value": 1, "absTol": 1e-9 }, "vB": { "value": 4, "absTol": 1e-9 }, "pTotal": { "value": 6, "absTol": 1e-9 }, "keTotal": { "value": 9, "absTol": 1e-9 }, "keLost": { "value": 0, "absTol": 1e-9 }, "impulse": { "value": 4, "relTol": 1e-9 }, "collisionTime": { "value": 0.833333, "relTol": 1e-6 } } },
  { "name": "1D perfectly inelastic", "preset": "stick", "params": { "dimension": "1d", "m1": 2, "m2": 1, "u1": 3, "u2": 0, "restitution": 0 }, "run": "complete",
    "expect": { "vA": { "value": 2, "absTol": 1e-9 }, "vB": { "value": 2, "absTol": 1e-9 }, "pTotal": { "value": 6, "absTol": 1e-9 }, "keTotal": { "value": 6, "absTol": 1e-9 }, "keLost": { "value": 3, "absTol": 1e-9 }, "impulse": { "value": 2, "relTol": 1e-9 } } },
  { "name": "equal masses swap velocities", "preset": "head-on-swap", "params": { "dimension": "1d", "m1": 1, "m2": 1, "u1": 3, "u2": -1, "restitution": 1 }, "run": "complete",
    "expect": { "vA": { "value": -1, "absTol": 1e-9 }, "vB": { "value": 3, "absTol": 1e-9 }, "pTotal": { "value": 2, "absTol": 1e-9 }, "collisionTime": { "value": 0.625, "relTol": 1e-6 } } },
  { "name": "1D with e = 0.5", "params": { "dimension": "1d", "m1": 1, "m2": 3, "u1": 4, "u2": 0, "restitution": 0.5 }, "run": "complete",
    "expect": { "vA": { "value": -0.5, "absTol": 1e-9 }, "vB": { "value": 1.5, "absTol": 1e-9 }, "keTotal": { "value": 3.5, "absTol": 1e-9 }, "keLost": { "value": 4.5, "absTol": 1e-9 }, "impulse": { "value": 4.5, "relTol": 1e-9 } } },
  { "name": "2D elastic glancing collision", "preset": "glancing", "params": { "dimension": "2d", "m1": 1, "m2": 1, "u1": 4, "u2": 0, "restitution": 1, "offset": 0.25 }, "run": "complete",
    "expect": { "vA": { "value": 1, "absTol": 1e-6 }, "vAy": { "value": 1.73205, "absTol": 1e-5 }, "vB": { "value": 3, "absTol": 1e-6 }, "vBy": { "value": -1.73205, "absTol": 1e-5 }, "angleA": { "value": 60, "absTol": 1e-4 }, "angleB": { "value": -30, "absTol": 1e-4 }, "pTotal": { "value": 4, "absTol": 1e-6 }, "pTotalY": { "value": 0, "absTol": 1e-6 }, "keLost": { "value": 0, "absTol": 1e-6 }, "impulse": { "value": 3.46410, "relTol": 1e-5 }, "collisionTime": { "value": 0.641747, "relTol": 1e-5 } } },
  { "name": "2D, e = 0: no rebound along the line of centres", "params": { "dimension": "2d", "m1": 1, "m2": 1, "u1": 4, "u2": 0, "restitution": 0, "offset": 0.25 }, "run": "complete",
    "expect": { "vA": { "value": 2.5, "absTol": 1e-6 }, "vAy": { "value": 0.866025, "absTol": 1e-5 }, "vB": { "value": 1.5, "absTol": 1e-6 }, "vBy": { "value": -0.866025, "absTol": 1e-5 }, "angleA": { "value": 19.1066, "absTol": 1e-4 }, "angleB": { "value": -30, "absTol": 1e-4 }, "keLost": { "value": 3, "absTol": 1e-6 }, "impulse": { "value": 1.73205, "relTol": 1e-5 } } }
]
```
