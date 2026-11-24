---
id: phy-motor-effect
title: "Motor effect and DC motor"
subject: phy
engine: custom
setup: none
priority: P1
status: draft           # stub → draft → approved (Gate B)
page: /interactives/physics/motor-effect.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Physics","version":"2017","area":"Module 6: Electromagnetism","outcomes":[],"verified":false}
  - {"course":"Physics","version":"2025","focusArea":"Electromagnetism","year":12,"outcomes":[],"verified":false}
---
# Motor effect and DC motor

> Backlog summary: Force on a conductor, torque against angle, the commutator.

## Learning goal
Students apply F = BIl sin θ to a current-carrying wire in a magnetic field, then see that the equal and opposite forces on the two sides of a coil form a couple whose torque τ = nBIA cos θ (θ measured from the field to the plane of the coil) is greatest when the coil's plane is parallel to the field and zero when it is perpendicular. They see why a split-ring commutator, which reverses the current every half turn, keeps a DC motor turning one way, while slip rings leave the coil rocking about the zero-torque position.

Syllabus tags: 2017 Module 6 (Electromagnetism: the motor effect and applications); 2025 Year 12 focus area Electromagnetism.

## What the student sees
Default view at 1920×1080 (light projector stage), `scene` = `motor`:

- **Left (about 55% of the width), end-on view along the axle.** Flat N and S pole pieces left and right, with uniform field lines (thin grey arrows) pointing right, labelled "B = 0.20 T". The coil is seen edge-on as a thick bar of length w through the axle, at angle θ to the field. Its two active sides are circles at the bar's ends marked ⊙ (current out of the screen) and ⊗ (into the screen). An orange force arrow on each side (length ∝ F, labelled "F = 2.00 N") points up on one side and down on the other. A dashed line shows the perpendicular distance between the two lines of action, labelled "w cos θ". A curved arrow at the axle shows the torque's sense and size. θ is marked with an arc from the field direction to the coil's plane.
- **Inset (top left), simplified oblique view** of the coil, its commutator (split ring as two half-rings with a gap, or two full slip rings) and the two brushes, with the current direction shown by arrows around the coil. The current arrows flip when the split ring changes over.
- **Right (about 45%), torque–angle graph** (with `showGraph`): τ (N m) against θ from −180° to 180°. The solid curve is the selected commutator (τ = nBIA|cos θ| for the split ring, nBIA cos θ for slip rings); the other is a dashed grey curve. An orange dot rides along at the present angle. Horizontal dashed line at the mean torque for the split ring, (2/π)·nBIA, labelled.

`scene` = `wire` replaces the motor with a single straight conductor of length l in the gap between the poles, in the plane of the screen at angle θ to B. The force on it is perpendicular to the screen, shown as a large ⊙ or ⊗ symbol whose size scales with F, plus a side-view inset with an arrow. The angle θ between the wire and B is marked with an arc. Nothing moves in this scene.

## Model (custom engine)
Engine folder `site/assets/engines/custom/phy-motor-effect/`, `meta.name: 'phy-motor-effect'`, one setup `motor`. **Time-based** with `timeScale`. Fixed step 1/240 s, RK4 on (θ, ω). `stepSize` 24.

Plane convention (shown on stage): the view looks along the axle. B points right (+x). θ is the angle from B to the **plane of the coil**, anticlockwise positive. Positive torque turns the coil anticlockwise (θ increasing). With I > 0 and θ = 0, current comes out of the screen (⊙) on the right-hand side and goes in (⊗) on the left; F = I l × B then points up on the right and down on the left, so the torque is anticlockwise.

Formulas (n = `turns`, B = `field`, I = `current` (signed), L = `coilLength` (active side, parallel to the axle), w = `coilWidth`, A = L·w):

- Force on each active side: F = nBIL. Because B is uniform and the active sides stay perpendicular to B, F does not depend on θ. Output `sideForce` = nB|I|L.
- Torque, **slip rings** (current fixed relative to the coil): τ = nBIA cos θ.
- Torque, **split-ring commutator** (current reverses as the coil's plane passes perpendicular to B, at θ = ±90°): τ = nBIA |cos θ|. The commutator's gap and sparking are ignored. A coil at rest at exactly θ = ±90° has zero torque and does not start (the "dead spot"). In floating point cos 90° = 6 × 10⁻¹⁷, so the engine snaps |cos θ| < 10⁻¹² to 0; otherwise a frictionless coil at the dead spot would start turning by itself.
- Maximum torque: nB|I|A.
- Dynamics: J dω/dt = τ(θ) − bω, dθ/dt = ω, with J = 1.0 × 10⁻² kg m² (fixed moment of inertia of a heavy demonstration armature, shown on stage) and b = `friction` (viscous friction, N m s). RK4 at 1/240 s; when |ω| × 1/240 s exceeds 0.05 rad, the step is split into equal sub-steps that each turn at most 0.05 rad, so fast spinning stays accurate. The supply holds the current constant, so **back emf is not modelled** (footer says so). With b = 0 and a split ring, the motor keeps speeding up, which is the cue for the back-emf discussion.
- **Stalling at the dead spot.** Near θ = 90° the split-ring torque is about nBIA·|θ − 90°|, which pushes the coil towards 90° before it gets there and away afterwards. Approaching it, the coil behaves like a damped oscillator with stiffness nBIA, so if b is above about 2√(nBIA·J) (0.057 N m s for the defaults) the motion is overdamped and the coil can creep to rest at 90° instead of coasting past. Lowering the current or raising the friction can therefore stall the motor. When a split-ring coil is at rest at the dead spot (|cos θ| < 0.01 and |ω| < 0.01 rad/s), the stage shows "Stalled at the dead spot: no torque here. Real motors use several coils at different angles so they never stall." This is a teaching point, not an error.
- The run starts at θ = `coilAngle` with ω = 0 and completes at t = `duration` (last step clamped). Output `maxOmega` is the largest |ω| reached so far in the run. Output `revolutions` is the number of complete turns made since the start, floor(|θ − θ₀|/360° + 10⁻⁹). The `angle` readout and the graph dot use θ wrapped to (−180°, 180°].
- Mean speed for teachers (not an acceptance check, because ω ripples): with a split ring the mean torque is (2/π)nBIA, so the mean speed is close to (2/π)nBIA/b only when the ripple is small, that is when J/b is long compared with the time for a half-turn. For the defaults J/b = 0.5 s against about 1.3 s per half-turn: the estimate gives 2.55 rad/s and the model settles to a mean of 2.45 rad/s (about 0.4 rev/s).
- Changing `scene` or `coilAngle` resets the run (t = 0, θ = `coilAngle`, ω = 0). Every other param applies live from the present θ and ω, so a teacher can reverse the current or swap the commutator while the coil turns; if `duration` is lowered below t, the run completes.
- If |ω| exceeds 20 rad/s the view adds "Spinning fast: lower the playback speed" (drawing stays at the true angle).
- **Wire scene:** F = B|I|l|sin θ| with θ = `wireAngle` between the wire and B. Direction from F = I l × B: for I > 0 and 0° < θ < 180° (wire direction measured anticlockwise from B) the force points into the screen; reversing I reverses it. Nothing evolves in this scene: `isComplete()` is true and Play does nothing.

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| scene | Scene | | | | | motor | enum: `motor` (DC motor), `wire` (Straight wire) |
| field | Magnetic field B | T | 0 | 0.5 | 0.01 | 0.2 | |
| current | Current I | A | −5 | 5 | 0.1 | 2 | negative reverses the current |
| turns | Turns n | | 1 | 200 | 1 | 100 | `integer: true`, `visibleWhen: { scene: 'motor' }` |
| coilLength | Coil side L (along axle) | m | 0.02 | 0.1 | 0.005 | 0.05 | `visibleWhen: { scene: 'motor' }` |
| coilWidth | Coil width w | m | 0.02 | 0.1 | 0.005 | 0.04 | `visibleWhen: { scene: 'motor' }` |
| coilAngle | Starting angle θ (plane to B) | ° | −180 | 180 | 1 | 0 | `visibleWhen: { scene: 'motor' }` |
| commutator | Commutator | | | | | split-ring | enum: `split-ring` (Split ring), `slip-rings` (Slip rings); `visibleWhen: { scene: 'motor' }` |
| friction | Friction b | N m s | 0 | 0.1 | 0.001 | 0.02 | `visibleWhen: { scene: 'motor' }` |
| duration | Run time | s | 1 | 60 | 1 | 30 | `visibleWhen: { scene: 'motor' }` |
| wireLength | Wire length l | m | 0.01 | 0.5 | 0.01 | 0.1 | `visibleWhen: { scene: 'wire' }` |
| wireAngle | Angle θ (wire to B) | ° | 0 | 180 | 1 | 90 | `visibleWhen: { scene: 'wire' }` |
| showGraph | Torque–angle graph | | | | | on | boolean, `visibleWhen: { scene: 'motor' }` |
| timeScale | Playback speed | × | 0.25 | 2 | 0.25 | 1 | |

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | scene motor, field 0.2, current 2, turns 100, coilLength 0.05, coilWidth 0.04, coilAngle 0, commutator split-ring, friction 0.02, duration 30 | τ_max = 0.08 N m; turns steadily at a mean of about 2.45 rad/s, 11 full turns in 30 s |
| slip-rings | as default with commutator slip-rings, friction 0.005 | the coil rocks about θ = 90° and settles there instead of turning |
| dead-spot | as default with coilAngle 90 | zero torque: the motor will not start |
| stall | as default with friction 0.08 | heavy friction: the coil creeps to the dead spot after a quarter turn and stalls |
| no-friction | as default with friction 0, duration 10 | keeps accelerating (about 52 rad/s after 10 s): why do real motors not? (back emf) |
| wire | scene wire, field 0.2, current 2, wireLength 0.1, wireAngle 90 | F = BIl = 0.04 N |

No catalogue listing reuses this page.

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| torque | Torque τ | N m | 3 |
| maxTorque | Maximum torque nBIA | N m | 3 |
| sideForce | Force on each side | N | 3 |
| angle | Coil angle θ | ° | 3 |
| omega | Angular velocity ω | rad/s | 3 |
| maxOmega | Largest angular speed | rad/s | 3 |
| revolutions | Complete turns | | 3 |
| force | Force on wire F | N | 3 |
| t | Time t | s | 3 |

The page lists all of them; the shell shows only the outputs meaningful for the scene (the engine returns `null` for `force` in the motor scene and for the motor outputs in the wire scene). `revolutions` sets `integer: true` (guide §5.10).

## Assumptions shown on stage
- Uniform magnetic field between flat poles
- θ = angle between B and the plane of the coil: τ = nBIA cos θ
- Constant current; back emf not modelled
- Commutator gap ignored; armature J = 1.0 × 10⁻² kg m²
- Viscous friction torque bω

## Try this (3–5 predict, observe, explain prompts)
1. **Predict:** at which coil angle is the torque greatest, and at which is it zero? Drag the starting angle (paused) and watch the dot on the graph.
2. **Observe:** the force on each side has the same size at every angle. So why does the torque change? Watch the dashed distance between the two forces.
3. **Predict, then observe:** switch to slip rings and play. What will the coil do? Why does it stop turning all the way round?
4. **Explain:** with the split ring, why does reversing the current every half turn keep the torque in the same direction? Point to the graph.
5. **Explain:** set friction to zero. The motor keeps speeding up. What happens in a real motor that stops this? (Back emf: see the Faraday and Lenz page.)

## Teacher notes outline
- **Misconceptions to target:** the forces on the coil sides get smaller as the coil turns (in a uniform field they don't; the lever arm does); torque is greatest when the coil faces the poles (it is zero there); the commutator changes the direction of the field; the angle in τ = nBIA cos θ is from the normal (state the convention every time); a motor would turn forever without a commutator.
- **10-minute lesson flow:** 2 min wire scene and the right-hand rule; 2 min prompt 1 on the paused coil; 3 min slip rings vs split ring on the graph; 2 min the dead-spot and stall presets and why real motors use several coils; 1 min no-friction preset as a hook for back emf.
- **Original HSC-style question idea:** a 60-turn rectangular coil, 4.0 cm by 3.0 cm, carries 1.5 A in a 0.25 T field. (a) Calculate the force on one 4.0 cm side. (b) Calculate the torque when the plane of the coil is at 40° to the field. (c) Sketch torque against angle for one full turn with a split-ring commutator and explain the shape. Worked solution in the notes file, stating the plane convention.

## Accessibility notes
- Current direction uses ⊙ and ⊗ symbols and arrows, not colour. Forces are arrows with text labels; the torque sense is a curved arrow plus the sign of the readout.
- The selected commutator's graph is solid and the other is dashed, so they differ by line style.
- Keyboard: all controls through the shell; the starting-angle slider steps 1° (Page Up/Down 15°).
- Stage `aria-label` from `describe()`: "DC motor with split-ring commutator. Coil plane at 30 degrees to a 0.20 tesla field, torque 0.069 newton metres anticlockwise, turning at 2.5 radians per second." Stalled: "DC motor stalled at the dead spot, coil plane at 90 degrees to the field, zero torque." Wire scene: "Straight wire 0.10 metres long at 90 degrees to a 0.20 tesla field carrying 2.0 amps; force 0.040 newtons into the screen."

## Engine change requests
None. This spec defines the custom engine, built in Wave 2 under `site/assets/engines/custom/phy-motor-effect/` with tests in `tests/engines/custom-phy-motor-effect.test.mjs` covering every check below.

## Acceptance
Every number below comes from the formula and hand calculation shown here. Defaults: n = 100, B = 0.20 T, I = 2.0 A, L = 0.050 m, w = 0.040 m, so A = 0.050 × 0.040 = 2.0 × 10⁻³ m² and nBIA = 100 × 0.20 × 2.0 × 2.0 × 10⁻³ = 0.080 N m.

- **Check 1, wire at 90°.** F = BIl sin 90° = 0.20 × 2.0 × 0.10 × 1 = **0.040 N**.
- **Check 2, wire at 30°.** F = 0.040 × sin 30° = **0.020 N**.
- **Check 3, wire along the field.** θ = 0°: F = 0.040 × sin 0° = **0 N**.
- **Check 4, coil plane parallel to B.** θ = 0°: τ = nBIA cos 0° = **0.080 N m** = maximum torque. Side force F = nBIL = 100 × 0.20 × 2.0 × 0.050 = **2.0 N**; check: F × w cos 0° = 2.0 × 0.040 = 0.080 N m.
- **Check 5, θ = 60°.** τ = 0.080 × cos 60° = **0.040 N m**.
- **Check 6, the commutator matters at θ = 120°.** cos 120° = −0.5. Slip rings: τ = **−0.040 N m** (turns the coil back towards 90°). Split ring: τ = 0.080 × |−0.5| = **+0.040 N m** (keeps turning forwards).
- **Check 7, dead spot.** θ = 90°: τ = 0.080 × cos 90° = **0**. The engine snaps |cos θ| < 10⁻¹² to 0, so the torque is exactly 0.
- **Check 8, reversed current.** I = −2.0 A, θ = 0°, split ring: τ = nBIA|cos 0°| = **−0.080 N m** (the motor turns the other way).
- **Check 9, energy for slip rings with no friction.** Released from rest at θ = 0, the coil swings to θ = 90° where the torque is zero and the speed is greatest. Work done by the torque from 0 to 90°: ∫₀^{π/2} nBIA cos θ dθ = nBIA = 0.080 J. So ½Jω_max² = 0.080, ω_max = √(2 × 0.080 / 1.0 × 10⁻²) = √16 = **4 rad/s**. The coil then oscillates between 0° and 180°, so over a 10 s run `maxOmega` = 4 rad/s and **t = 10 s**. Sampling at 1/240 s lowers the sampled maximum by at most ½(nBIA/J)·ω_max·(1/480)² = ½ × 8 × 4 × 4.34 × 10⁻⁶ ≈ 7 × 10⁻⁵ rad/s (0.002%); tolerance 0.1%.
- **Check 10, the default motor keeps turning (catches a stall).** The defaults are underdamped at the dead spot: b = 0.02 is below 2√(nBIA·J) = 2√(0.080 × 0.010) = 0.057 N m s, so the coil coasts past 90° every half-turn. Hand estimate of the distance turned in 30 s: the mean torque (2/π)nBIA = 0.0509 N m balances bω̄ at ω̄ ≈ 2.55 rad/s; because J/b = 0.5 s is shorter than a half-turn the speed ripples, which lowers the mean to about 2.45 rad/s in the specified model (RK4 at 1/240 s), and spin-up costs about J/b = 0.5 s. So the coil turns about 2.45 × (30 − 0.5) = 72.3 rad = 11.5 turns. The model gives 4169° = 11.58 turns, so `revolutions` = **11**. A stalled motor gives 0. The tolerance of ±1.5 turns allows harmless differences in integration detail and still fails a stall or a runaway.
- **Check 11, a frictionless coil at the dead spot never starts.** θ₀ = 90°, b = 0, split ring, 10 s run: τ = 0 exactly (check 7), so ω stays 0: `maxOmega` = **0** and `revolutions` = **0**.
- **Check 12, the stall preset stalls.** b = 0.08 N m s is above 2√(nBIA·J) = 0.057 N m s, so the approach to 90° is overdamped. Linearising about 90° with δ = θ − 90° < 0 gives J δ″ + b δ′ + nBIA δ = 0 (nBIA per radian), whose slower decay rate is (b − √(b² − 4J·nBIA))/(2J) = (0.08 − √(0.0064 − 0.0032))/0.02 = (0.08 − 0.0566)/0.02 = 1.17 s⁻¹. The coil creeps up to 90° without crossing it, so after 30 s it sits at **θ = 90°** (to far better than 0.01°) and `revolutions` = **0**.

Tolerances: 1 × 10⁻⁹ relative for the static closed forms; exact zeros use absolute 1 × 10⁻¹²; counts use the absolute tolerances stated above.

```acceptance
[
  { "name": "wire at 90 degrees", "params": { "scene": "wire", "field": 0.2, "current": 2, "wireLength": 0.1, "wireAngle": 90 }, "run": "static",
    "expect": { "force": { "value": 0.04, "relTol": 1e-9 } } },
  { "name": "wire at 30 degrees", "params": { "scene": "wire", "field": 0.2, "current": 2, "wireLength": 0.1, "wireAngle": 30 }, "run": "static",
    "expect": { "force": { "value": 0.02, "relTol": 1e-9 } } },
  { "name": "wire along the field", "params": { "scene": "wire", "field": 0.2, "current": 2, "wireLength": 0.1, "wireAngle": 0 }, "run": "static",
    "expect": { "force": { "value": 0, "absTol": 1e-12 } } },
  { "name": "coil parallel to B: maximum torque", "params": { "scene": "motor", "turns": 100, "field": 0.2, "current": 2, "coilLength": 0.05, "coilWidth": 0.04, "coilAngle": 0, "commutator": "split-ring" }, "run": "static",
    "expect": { "torque": { "value": 0.08, "relTol": 1e-9 }, "maxTorque": { "value": 0.08, "relTol": 1e-9 }, "sideForce": { "value": 2, "relTol": 1e-9 } } },
  { "name": "coil at 60 degrees", "params": { "scene": "motor", "turns": 100, "field": 0.2, "current": 2, "coilLength": 0.05, "coilWidth": 0.04, "coilAngle": 60, "commutator": "split-ring" }, "run": "static",
    "expect": { "torque": { "value": 0.04, "relTol": 1e-9 } } },
  { "name": "slip rings at 120 degrees", "params": { "scene": "motor", "turns": 100, "field": 0.2, "current": 2, "coilLength": 0.05, "coilWidth": 0.04, "coilAngle": 120, "commutator": "slip-rings" }, "run": "static",
    "expect": { "torque": { "value": -0.04, "relTol": 1e-9 } } },
  { "name": "split ring at 120 degrees", "params": { "scene": "motor", "turns": 100, "field": 0.2, "current": 2, "coilLength": 0.05, "coilWidth": 0.04, "coilAngle": 120, "commutator": "split-ring" }, "run": "static",
    "expect": { "torque": { "value": 0.04, "relTol": 1e-9 } } },
  { "name": "dead spot at 90 degrees", "params": { "scene": "motor", "turns": 100, "field": 0.2, "current": 2, "coilLength": 0.05, "coilWidth": 0.04, "coilAngle": 90, "commutator": "split-ring" }, "run": "static",
    "expect": { "torque": { "value": 0, "absTol": 1e-12 } } },
  { "name": "reversed current", "params": { "scene": "motor", "turns": 100, "field": 0.2, "current": -2, "coilLength": 0.05, "coilWidth": 0.04, "coilAngle": 0, "commutator": "split-ring" }, "run": "static",
    "expect": { "torque": { "value": -0.08, "relTol": 1e-9 } } },
  { "name": "slip rings, no friction: energy gives max speed", "params": { "scene": "motor", "turns": 100, "field": 0.2, "current": 2, "coilLength": 0.05, "coilWidth": 0.04, "coilAngle": 0, "commutator": "slip-rings", "friction": 0, "duration": 10 }, "run": "complete",
    "expect": { "maxOmega": { "value": 4, "relTol": 1e-3 }, "t": { "value": 10, "absTol": 1e-9 } } },
  { "name": "default motor keeps turning for 30 s", "params": { "scene": "motor", "turns": 100, "field": 0.2, "current": 2, "coilLength": 0.05, "coilWidth": 0.04, "coilAngle": 0, "commutator": "split-ring", "friction": 0.02, "duration": 30 }, "run": "complete",
    "expect": { "revolutions": { "value": 11, "absTol": 1.5 }, "t": { "value": 30, "absTol": 1e-9 } } },
  { "name": "frictionless coil at the dead spot never starts", "params": { "scene": "motor", "turns": 100, "field": 0.2, "current": 2, "coilLength": 0.05, "coilWidth": 0.04, "coilAngle": 90, "commutator": "split-ring", "friction": 0, "duration": 10 }, "run": "complete",
    "expect": { "maxOmega": { "value": 0, "absTol": 1e-12 }, "revolutions": { "value": 0, "absTol": 0.5 } } },
  { "name": "stall preset stalls at the dead spot", "preset": "stall", "params": { "friction": 0.08, "duration": 30 }, "run": "complete",
    "expect": { "revolutions": { "value": 0, "absTol": 0.5 }, "angle": { "value": 90, "absTol": 0.01 } } }
]
```
