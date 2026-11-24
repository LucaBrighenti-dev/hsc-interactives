---
id: phy-inclined-plane
title: "Inclined plane and friction"
subject: phy
engine: statics
setup: incline
priority: P1
status: approved            # stub → draft → approved (Gate B)
page: /interactives/physics/inclined-plane.html
listings:            # catalogue listings that open this page with a preset; define these presets
  - {"id":"eng-friction-horizontal","preset":"eng-horizontal","title":"Static friction on a horizontal plane"}
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Physics","version":"2017","area":"Module 2: Dynamics","outcomes":[],"verified":false}
  - {"course":"Physics","version":"2025","focusArea":"Fundamentals of mechanics","year":11,"outcomes":[],"verified":false}
---
# Inclined plane and friction

> Backlog summary: Free body diagram, components, static vs kinetic friction; angle 0 gives the horizontal plane.

## Learning goal
Students draw the free body diagram for a block on a slope, resolve the weight into components parallel (mg sin θ) and perpendicular (mg cos θ) to the surface, and decide whether the block stays put (static friction matches the net push, up to μₛN) or slides (kinetic friction μₖN opposes the motion). They then use Newton's second law along the slope to find the acceleration.

Syllabus fit: 2017 Module 2 Dynamics (forces, free body diagrams, friction, Newton's laws on inclined planes); 2025 Year 11 focus area Fundamentals of mechanics. Engineering Studies uses the same page at 0° through the `eng-horizontal` preset (2011 Braking Systems / 2026 Applied engineering analysis: static and kinetic friction, with g = 10 m/s²).

## What the student sees
Default view at 1920×1080, projector theme (the `statics` engine's incline view):

- A ramp at angle θ (an arc labelled `θ = 30°` at its foot) with a block on it labelled with its mass. At θ = 0 the ramp becomes a flat floor.
- **Free body diagram on the block:** weight W (straight down), normal force N (perpendicular to the surface), friction f (along the surface, pointing the way it acts), and the applied force F when it is non-zero, at its chosen direction. Each arrow is labelled with symbol and value, for example `f = 24.5 N`.
- **Components (optional):** the weight's components along the slope (mg sin θ) and into the slope (mg cos θ) as dashed arrows with a right-angle mark.
- **State:** the stage says whether the block stays at rest, slides up or down the slope, or lifts off the surface, with the acceleration and its direction when it slides.

The setup is static: every change is solved immediately; play, step and reset are hidden.

## Parameters
Keys and ranges are the `statics` engine's `meta.params` for `incline` (branch `w1/engine-statics`).

| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| angle | Slope angle θ | ° | 0 | 80 | 0.5 | 25 | 0 gives a horizontal surface |
| mass | Mass m | kg | 0.1 | 100 | 0.1 | 5 | |
| muS | Static friction μₛ | | 0 | 1.5 | 0.01 | 0.5 | |
| muK | Kinetic friction μₖ | | 0 | 1.5 | 0.01 | 0.4 | if μₖ > μₛ the engine uses μₖ = μₛ and says so |
| applied | Applied force F | N | 0 | 1000 | 1 | 0 | |
| appliedAngle | Direction of F | ° | −180 | 180 | 5 | 0 | from up the slope, anticlockwise positive: 0° pushes up the slope, 90° pulls straight off the surface, 180° pushes down the slope |
| g | Gravitational field g | m/s² | 1 | 25 | 0.01 | 10 | every Physics preset sets 9.8; the Engineering preset keeps 10 |
| showComponents | Show components | | | | | on | |

Page controls, in order: `angle`, `mass`, `muS`, `muK`, `applied`, `appliedAngle`, `g`, `showComponents`.

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | θ 30°, m 5 kg, μₛ 0.6, μₖ 0.4, F 0, g 9.8 | just below the angle of repose (31.0°): static friction almost at its limit |
| sliding | θ 35°, m 5 kg, μₛ 0.6, μₖ 0.4, F 0, g 9.8 | past the angle of repose: slides down at 2.41 m/s² |
| push-up | θ 30°, m 5 kg, μₛ 0.6, μₖ 0.4, F 60 N at 0°, g 9.8 | pushed up the slope hard enough to slide upwards |
| eng-horizontal | θ 0°, m 10 kg, μₛ 0.5, μₖ 0.3, F 40 N at 0°, g 10 | Engineering listing: a crate on a level floor; 40 N is less than the 50 N limit, so it stays put. g = 10 m/s² |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| weightParallel | W along the slope | N | 3 |
| normalForce | Normal force N | N | 3 |
| friction | Friction f | N | 3 |
| frictionMax | Maximum static friction μₛN | N | 3 |
| acceleration | Acceleration a | m/s² | 3 |
| reposeAngle | Angle of repose tan⁻¹ μₛ | ° | 3 |

Further outputs: `weight` (W = mg), `weightPerp` (mg cos θ) and `slipping` (1 sliding, 0 at rest). `friction` and `acceleration` are magnitudes; their directions are shown on the stage.

Model (the engine's `solveIncline`; along the slope + is up, perpendicular + is away from the surface; F at angle φ from up the slope):
- N = mg cos θ − F sin φ. If this is negative the block lifts off the surface: the stage says so, N and `friction` are 0, `frictionMax` is 0, and `acceleration` and `slipping` are — (the block is no longer on the slope, so the slope model does not apply).
- Net force along the slope without friction: D = F cos φ − mg sin θ.
- If |D| ≤ μₛN: at rest; friction = |D|, acceleration 0.
- If |D| > μₛN: slides in the direction of D; friction = μₖN; acceleration = (|D| − μₖN)/m.
- μₖ is capped at μₛ: if μₖ > μₛ is entered, the engine uses μₖ = μₛ and says so on stage. (Without the cap, a block released from rest could "slide" uphill: θ 20°, m 5 kg, μₛ 0.3, μₖ 0.6 would give a = (16.76 − 27.63)/5 up the slope. With the cap, friction is 0.3 × 46.04 = 13.81 N and a = (16.76 − 13.81)/5 = 0.589 m/s² down the slope.)

## Assumptions shown on stage
- Block treated as a particle; rigid ramp
- Friction: static up to μₛN, kinetic μₖN when sliding
- No air resistance; g = 9.8 m/s² (10 m/s² in the Engineering preset; the current value is shown)
- The block starts at rest

## Try this (3–5 predict, observe, explain prompts)
1. Predict: the default block is at rest on a 30° slope. What will happen if you raise the slope by 2°? Try it, then find the angle at which it starts to slide.
2. Observe: with the block at rest, change the mass. Does the angle of repose change? Why not?
3. Explain: at 30° the friction is 24.5 N, but μₛN is 25.5 N. Why is the friction not 25.5 N?
4. Predict: in the `eng-horizontal` preset, how hard must you push before the crate moves? Increase F to 51 N. Why does the acceleration jump straight to about 2 m/s² rather than starting from almost zero?
5. Explain: pulling at 30° above the horizontal moves the crate with a smaller force than pushing horizontally. Use the normal force readout to explain why.

## Teacher notes outline
- **Misconceptions to target:** friction always equals μN (static friction only matches what is needed, up to μₛN); the normal force always equals mg; heavier blocks slide more easily on a slope; friction always acts down the slope; the weight component along the slope is mg cos θ.
- **10-minute lesson flow:** (1) default: draw the FBD, check mg sin θ and N by hand (3 min); (2) raise θ to find the angle of repose; show tan θ = μₛ and that mass cancels (3 min); (3) `sliding`: a = g(sin θ − μₖ cos θ) (2 min); (4) `eng-horizontal`: the static-to-kinetic jump, and pulling at an angle (2 min).
- **Original HSC-style question idea:** A 12 kg crate rests on a ramp inclined at 25°. The coefficients of friction are μₛ = 0.45 and μₖ = 0.32. (a) Show that the crate will slide down the ramp (tan 25° = 0.466 > 0.45). (b) Calculate its acceleration (1.30 m/s²). (c) Calculate the force parallel to the ramp needed to push it up the ramp at constant speed (83.8 N). (Write the full question and worked solution in the notes file.)

## Accessibility notes
- Every force arrow carries a text label with symbol and value; components are dashed with a right-angle mark; the state is written in words (at rest, slides up, slides down, lifts off), never shown by colour alone.
- Keyboard: every parameter is a slider with number entry or a toggle.
- Stage `aria-label` (the engine's `describe()`): "Block of 5 kilograms on a 30 degree slope with μs 0.6: it stays at rest. Free body diagram with weight, normal force and friction."

## Engine change requests
- None: every key used here exists in the `statics` engine's meta on `w1/engine-statics`.

## Acceptance
Every number below comes from the formula and hand calculation shown here, using the model above. All checks are static.

- **Check 1, default (at rest).** m = 5, θ = 30°, g = 9.8: W = 49 N. mg sin 30° = **24.5 N**; N = 49 cos 30° = **42.4352 N**; μₛN = 0.6 × 42.4352 = **25.4611 N**. |D| = 24.5 ≤ 25.4611, so at rest: friction **24.5 N** (up the slope), acceleration **0**, slipping **0**. Angle of repose tan⁻¹ 0.6 = **30.9638°**.
- **Check 2, sliding (`sliding`, θ = 35°).** mg sin 35° = 49 × 0.573576 = 28.1052 N; N = 49 × 0.819152 = 40.1385 N; μₛN = 24.0831 N < 28.1052, so it slides down. Friction μₖN = 0.4 × 40.1385 = **16.0554 N**; acceleration (28.1052 − 16.0554)/5 = **2.40997 m/s²** down the slope, the same as g(sin θ − μₖ cos θ) = 9.8 × (0.573576 − 0.327661) = 2.40997; slipping **1**.
- **Check 3, pushed up the slope (`push-up`).** F = 60 N, φ = 0°, θ = 30°: D = 60 − 24.5 = 35.5 N > μₛN = 25.4611 N, so it slides up. Friction 0.4 × 42.4352 = **16.9741 N** (down the slope); acceleration (35.5 − 16.9741)/5 = **3.70518 m/s²** up the slope.
- **Check 4, pushed down the slope.** F = 10 N at φ = 180°, θ = 30°: N = 42.4352 N (sin 180° = 0); D = −10 − 24.5 = −34.5 N, |D| > 25.4611 N, so it slides down. Friction **16.9741 N**; acceleration (34.5 − 16.9741)/5 = **3.50518 m/s²** down the slope.
- **Check 5, `eng-horizontal` preset (at rest).** θ = 0, m = 10, g = 10: N = **100 N**, μₛN = **50 N**. D = 40 ≤ 50, so at rest: friction **40 N** (opposing F), acceleration **0**.
- **Check 6, crate pushed harder.** Same with F = 60 N: D = 60 > 50, sliding. Friction 0.3 × 100 = **30 N**; acceleration (60 − 30)/10 = **3.00 m/s²**.
- **Check 7, pulled at an angle.** F = 60 N at φ = 30° (above the floor): N = 100 − 60 sin 30° = **70 N**; D = 60 cos 30° = 51.9615 N > μₛN = 35 N, sliding. Friction 0.3 × 70 = **21 N**; acceleration (51.9615 − 21)/10 = **3.09615 m/s²**.
- **Check 8, on the point of slipping.** F = 50 N at 0°: |D| = 50 = μₛN exactly, so the block is still at rest (it slides only when |D| > μₛN): friction **50 N**, acceleration **0**, slipping **0**.
- **Check 9, μₖ entered above μₛ (capped).** θ = 20°, m = 5 kg, μₛ = 0.3, μₖ = 0.6, g = 9.8: mg sin 20° = 49 × 0.342020 = 16.7590 N; N = 49 × 0.939693 = 46.0449 N; μₛN = 13.8135 N < 16.7590, so it slides down. With μₖ capped at μₛ = 0.3: friction = **13.8135 N**, acceleration = (16.7590 − 13.8135)/5 = **0.589101 m/s²** down the slope, slipping **1**.

```acceptance
[
  { "name": "default: static friction just holds", "preset": "default", "params": { "angle": 30, "mass": 5, "muS": 0.6, "muK": 0.4, "applied": 0, "appliedAngle": 0, "g": 9.8 }, "run": "static",
    "expect": { "weightParallel": { "value": 24.5, "relTol": 1e-6 }, "normalForce": { "value": 42.4352, "relTol": 1e-5 }, "frictionMax": { "value": 25.4611, "relTol": 1e-5 }, "friction": { "value": 24.5, "relTol": 1e-6 }, "acceleration": { "value": 0, "absTol": 1e-9 }, "reposeAngle": { "value": 30.9638, "relTol": 1e-5 }, "slipping": { "value": 0, "absTol": 1e-9 } } },
  { "name": "35°: slides down", "preset": "sliding", "params": { "angle": 35, "mass": 5, "muS": 0.6, "muK": 0.4, "applied": 0, "appliedAngle": 0, "g": 9.8 }, "run": "static",
    "expect": { "friction": { "value": 16.0554, "relTol": 1e-5 }, "acceleration": { "value": 2.40997, "relTol": 1e-5 }, "slipping": { "value": 1, "absTol": 1e-9 } } },
  { "name": "pushed up the slope", "preset": "push-up", "params": { "angle": 30, "mass": 5, "muS": 0.6, "muK": 0.4, "applied": 60, "appliedAngle": 0, "g": 9.8 }, "run": "static",
    "expect": { "friction": { "value": 16.9741, "relTol": 1e-5 }, "acceleration": { "value": 3.70518, "relTol": 1e-5 }, "slipping": { "value": 1, "absTol": 1e-9 } } },
  { "name": "pushed down the slope", "params": { "angle": 30, "mass": 5, "muS": 0.6, "muK": 0.4, "applied": 10, "appliedAngle": 180, "g": 9.8 }, "run": "static",
    "expect": { "normalForce": { "value": 42.4352, "relTol": 1e-5 }, "friction": { "value": 16.9741, "relTol": 1e-5 }, "acceleration": { "value": 3.50518, "relTol": 1e-5 } } },
  { "name": "eng-horizontal preset: crate stays put", "preset": "eng-horizontal", "params": {}, "run": "static",
    "expect": { "normalForce": { "value": 100, "relTol": 1e-9 }, "frictionMax": { "value": 50, "relTol": 1e-9 }, "friction": { "value": 40, "relTol": 1e-9 }, "acceleration": { "value": 0, "absTol": 1e-9 }, "slipping": { "value": 0, "absTol": 1e-9 } } },
  { "name": "crate pushed with 60 N slides", "preset": "eng-horizontal", "params": { "angle": 0, "mass": 10, "muS": 0.5, "muK": 0.3, "applied": 60, "appliedAngle": 0, "g": 10 }, "run": "static",
    "expect": { "friction": { "value": 30, "relTol": 1e-9 }, "acceleration": { "value": 3, "relTol": 1e-9 } } },
  { "name": "crate pulled at 30°", "preset": "eng-horizontal", "params": { "angle": 0, "mass": 10, "muS": 0.5, "muK": 0.3, "applied": 60, "appliedAngle": 30, "g": 10 }, "run": "static",
    "expect": { "normalForce": { "value": 70, "relTol": 1e-9 }, "friction": { "value": 21, "relTol": 1e-9 }, "acceleration": { "value": 3.09615, "relTol": 1e-5 } } },
  { "name": "on the point of slipping stays at rest", "preset": "eng-horizontal", "params": { "angle": 0, "mass": 10, "muS": 0.5, "muK": 0.3, "applied": 50, "appliedAngle": 0, "g": 10 }, "run": "static",
    "expect": { "friction": { "value": 50, "relTol": 1e-9 }, "acceleration": { "value": 0, "absTol": 1e-9 }, "slipping": { "value": 0, "absTol": 1e-9 } } },
  { "name": "μk above μs is capped at μs", "params": { "angle": 20, "mass": 5, "muS": 0.3, "muK": 0.6, "applied": 0, "appliedAngle": 0, "g": 9.8 }, "run": "static",
    "expect": { "friction": { "value": 13.8135, "relTol": 1e-5 }, "acceleration": { "value": 0.589101, "relTol": 1e-5 }, "slipping": { "value": 1, "absTol": 1e-9 } } }
]
```
