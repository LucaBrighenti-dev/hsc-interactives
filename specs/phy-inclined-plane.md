---
id: phy-inclined-plane
title: "Inclined plane and friction"
subject: phy
engine: statics
setup: incline
priority: P1
status: draft            # stub → draft → approved (Gate B)
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
Default view at 1920×1080, projector theme:

- A ramp at angle θ (an arc labelled `θ = 30°` at its foot) with a block on it labelled `5.0 kg`. At θ = 0 the ramp becomes a flat floor.
- **Free body diagram on the block:** weight mg (straight down), normal force N (perpendicular to the surface), friction f (along the surface), and the applied force P when it is non-zero (at angle φ above the surface). Each arrow is labelled with symbol and value, for example `f = 24.5 N`.
- **Components (optional):** the weight's components mg sin θ (along the slope) and mg cos θ (into the slope) as dashed arrows with a right-angle mark.
- **Status badge:** `STATIC: friction 24.5 N of a possible 25.5 N` or `SLIDING DOWN: a = 2.41 m/s²`, with a "friction gauge" bar showing f against μₛN.
- When the block slides, an acceleration arrow appears beside it and the block slides a short way down (or up) the ramp in a looping animation, purely to show the direction; the numbers come from the static solution.

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| angle | Slope angle θ | ° | 0 | 60 | 1 | 30 | 0 gives a horizontal surface |
| mass | Mass m | kg | 0.5 | 50 | 0.5 | 5 | |
| muS | Coefficient of static friction μₛ | | 0 | 1.2 | 0.01 | 0.6 | |
| muK | Coefficient of kinetic friction μₖ | | 0 | 1.2 | 0.01 | 0.4 | a note appears if μₖ > μₛ (unusual for real surfaces) |
| appliedForce | Applied force P | N | 0 | 300 | 1 | 0 | acts up the slope (to the right when θ = 0) |
| forceAngle | Angle of P above the surface φ | ° | 0 | 60 | 1 | 0 | |
| g | Gravitational field strength g | m/s² | 1 | 25 | 0.1 | 9.8 | |
| showComponents | Weight components | | | | | on | |
| showGauge | Friction gauge | | | | | on | |

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | θ 30°, m 5 kg, μₛ 0.6, μₖ 0.4, P 0, φ 0, g 9.8 | just below the slip angle (31.0°): static friction almost at its limit |
| sliding | θ 35°, m 5 kg, μₛ 0.6, μₖ 0.4, P 0, φ 0, g 9.8 | past the slip angle: slides down at 2.41 m/s² |
| push-up | θ 30°, m 5 kg, μₛ 0.6, μₖ 0.4, P 60 N, φ 0, g 9.8 | pushed up the slope hard enough to slide upwards |
| eng-horizontal | θ 0°, m 10 kg, μₛ 0.5, μₖ 0.3, P 40 N, φ 0, g 10 | Engineering listing: a crate on a level floor; 40 N is less than the 50 N limit, so it stays put. g = 10 m/s² |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| weightParallel | Weight along slope mg sin θ | N | 3 |
| normalForce | Normal force N | N | 3 |
| frictionForce | Friction f (+ up the slope) | N | 3 |
| maxStaticFriction | Limit of static friction μₛN | N | 3 |
| acceleration | Acceleration a (+ up the slope) | m/s² | 3 |
| criticalAngle | Slip angle with no push, tan⁻¹ μₛ | ° | 3 |

Further outputs: `weightPerpendicular` = mg cos θ (N) and `slipping` (0 static, 1 sliding).

Model (up the slope positive; P at φ above the surface):
- N = mg cos θ − P sin φ (if this is negative the block lifts off; the stage says so and friction is zero).
- Net push without friction: D = P cos φ − mg sin θ.
- If |D| ≤ μₛN: static. f = −D and a = 0.
- If |D| > μₛN: sliding in the direction of D. f = −sign(D) μₖN and a = (D + f)/m.

## Assumptions shown on stage
- Block treated as a particle; rigid ramp
- Friction: static up to μₛN, kinetic μₖN when sliding
- No air resistance; g = 9.8 m/s² (10 m/s² in the Engineering preset; the current value is shown)
- The block starts at rest

## Try this (3–5 predict, observe, explain prompts)
1. Predict: the default block is at rest on a 30° slope. What will happen if you raise the slope by 2°? Try it, then find the exact angle at which it starts to slide.
2. Observe: with the block at rest, change the mass. Does the slip angle change? Why not?
3. Explain: at 30° the friction is 24.5 N, but μₛN is 25.5 N. Why is the friction not 25.5 N?
4. Predict: in the `eng-horizontal` preset, how hard must you push before the crate moves? Increase P to 51 N. Why does the acceleration jump straight to about 2 m/s² rather than starting from almost zero?
5. Explain: pulling at 30° above the horizontal moves the crate with a smaller force than pushing horizontally. Use the normal force readout to explain why.

## Teacher notes outline
- **Misconceptions to target:** friction always equals μN (static friction only matches what is needed, up to μₛN); the normal force always equals mg; heavier blocks slide more easily on a slope; friction always acts down the slope; the weight component along the slope is mg cos θ.
- **10-minute lesson flow:** (1) default: draw the FBD, check mg sin θ and N by hand (3 min); (2) raise θ to find the slip angle; show tan θ = μₛ and that mass cancels (3 min); (3) `sliding`: a = g(sin θ − μₖ cos θ) (2 min); (4) `eng-horizontal`: the static to kinetic jump, and pulling at an angle (2 min).
- **Original HSC-style question idea:** A 12 kg crate rests on a ramp inclined at 25°. The coefficients of friction are μₛ = 0.45 and μₖ = 0.32. (a) Show that the crate will slide down the ramp (tan 25° = 0.466 > 0.45). (b) Calculate its acceleration (1.30 m/s²). (c) Calculate the force parallel to the ramp needed to push it up the ramp at constant speed (83.8 N). (Write the full question and worked solution in the notes file.)

## Accessibility notes
- Every force arrow carries a text label with symbol and value; components are dashed with a right-angle mark; the status badge is text (`STATIC`, `SLIDING DOWN`, `SLIDING UP`, `LIFTS OFF`), and the gauge also shows "24.5 of 25.5 N".
- With `prefers-reduced-motion` the sliding animation is replaced by a static acceleration arrow.
- Keyboard: every parameter is a slider with number entry or a toggle.
- Stage `aria-label` (from `describe()`): "A 5.0 kilogram block on a 30 degree slope, no applied force. Weight component along the slope 24.5 newtons; normal force 42.4 newtons. Static friction 24.5 newtons up the slope, limit 25.5 newtons. The block stays at rest."

## Engine change requests
- **Keys to reconcile with engine meta** (the `statics` meta was not published when this spec was written): params `angle`, `mass`, `muS`, `muK`, `appliedForce`, `forceAngle`, `g`, `showComponents`, `showGauge`; outputs `weightParallel`, `weightPerpendicular`, `normalForce`, `frictionForce`, `maxStaticFriction`, `acceleration`, `criticalAngle`, `slipping`.
- The applied force at an angle φ to the surface (`forceAngle`) extends the guide's "applied force" for the incline; it is needed for the classic pull-at-an-angle problems in both Physics and Engineering.
- The sliding animation is a view-only loop; `incline` remains a static setup (`meta.staticSetups`).
- A `describe()` method for the stage label above.

## Acceptance
Every number below comes from the formula and hand calculation shown here, using the model above. All checks are static.

- **Check 1, default (at rest).** m = 5, θ = 30°, g = 9.8: mg = 49 N. mg sin 30° = **24.5 N**; N = 49 cos 30° = **42.4352 N**; μₛN = 0.6 × 42.4352 = **25.4611 N**. D = −24.5 and |D| ≤ 25.4611, so static: f = **+24.5 N** (up the slope), a = **0**. Slip angle tan⁻¹ 0.6 = **30.9638°**.
- **Check 2, sliding (`sliding`, θ = 35°).** mg sin 35° = 49 × 0.573576 = 28.1052 N; N = 49 × 0.819152 = 40.1385 N; μₛN = 24.0831 N < 28.1052, so it slides down. f = +μₖN = 0.4 × 40.1385 = **+16.0554 N**; a = (−28.1052 + 16.0554)/5 = **−2.40997 m/s²**, the same as −g(sin θ − μₖ cos θ) = −9.8 × (0.573576 − 0.327661) = −2.40997.
- **Check 3, pushed up the slope (`push-up`).** P = 60 N, φ = 0, θ = 30°: D = 60 − 24.5 = 35.5 N > μₛN = 25.4611 N, so it slides up. f = −0.4 × 42.4352 = **−16.9741 N**; a = (35.5 − 16.9741)/5 = **3.70518 m/s²**.
- **Check 4, `eng-horizontal` preset (at rest).** θ = 0, m = 10, g = 10: N = **100 N**, μₛN = **50 N**. D = 40 ≤ 50, so static: f = **−40 N** (opposing P), a = **0**.
- **Check 5, crate pushed harder.** Same with P = 60 N: D = 60 > 50, sliding. f = −0.3 × 100 = **−30 N**; a = (60 − 30)/10 = **3.00 m/s²**.
- **Check 6, pulled at an angle.** P = 60 N at φ = 30°: N = 100 − 60 sin 30° = **70 N**; D = 60 cos 30° = 51.9615 N > μₛN = 35 N, sliding. f = −0.3 × 70 = **−21 N**; a = (51.9615 − 21)/10 = **3.09615 m/s²**.
- **Check 7, on the point of slipping.** P = 50 N, φ = 0: D = 50 = μₛN exactly, so the block is still static (it slides only when |D| > μₛN): f = **−50 N**, a = **0**.

```acceptance
[
  { "name": "default: static friction just holds", "params": { "angle": 30, "mass": 5, "muS": 0.6, "muK": 0.4, "appliedForce": 0, "forceAngle": 0, "g": 9.8 }, "run": "static",
    "expect": { "weightParallel": { "value": 24.5, "relTol": 1e-6 }, "normalForce": { "value": 42.4352, "relTol": 1e-5 }, "maxStaticFriction": { "value": 25.4611, "relTol": 1e-5 }, "frictionForce": { "value": 24.5, "relTol": 1e-6 }, "acceleration": { "value": 0, "absTol": 1e-9 }, "criticalAngle": { "value": 30.9638, "relTol": 1e-5 }, "slipping": { "value": 0, "absTol": 1e-9 } } },
  { "name": "35°: slides down", "preset": "sliding", "params": { "angle": 35, "mass": 5, "muS": 0.6, "muK": 0.4, "appliedForce": 0, "forceAngle": 0, "g": 9.8 }, "run": "static",
    "expect": { "frictionForce": { "value": 16.0554, "relTol": 1e-5 }, "acceleration": { "value": -2.40997, "relTol": 1e-5 }, "slipping": { "value": 1, "absTol": 1e-9 } } },
  { "name": "pushed up the slope", "preset": "push-up", "params": { "angle": 30, "mass": 5, "muS": 0.6, "muK": 0.4, "appliedForce": 60, "forceAngle": 0, "g": 9.8 }, "run": "static",
    "expect": { "frictionForce": { "value": -16.9741, "relTol": 1e-5 }, "acceleration": { "value": 3.70518, "relTol": 1e-5 } } },
  { "name": "eng-horizontal preset: crate stays put", "preset": "eng-horizontal", "params": {}, "run": "static",
    "expect": { "normalForce": { "value": 100, "relTol": 1e-9 }, "maxStaticFriction": { "value": 50, "relTol": 1e-9 }, "frictionForce": { "value": -40, "relTol": 1e-9 }, "acceleration": { "value": 0, "absTol": 1e-9 } } },
  { "name": "crate pushed with 60 N slides", "preset": "eng-horizontal", "params": { "angle": 0, "mass": 10, "muS": 0.5, "muK": 0.3, "appliedForce": 60, "forceAngle": 0, "g": 10 }, "run": "static",
    "expect": { "frictionForce": { "value": -30, "relTol": 1e-9 }, "acceleration": { "value": 3, "relTol": 1e-9 } } },
  { "name": "crate pulled at 30°", "preset": "eng-horizontal", "params": { "angle": 0, "mass": 10, "muS": 0.5, "muK": 0.3, "appliedForce": 60, "forceAngle": 30, "g": 10 }, "run": "static",
    "expect": { "normalForce": { "value": 70, "relTol": 1e-9 }, "frictionForce": { "value": -21, "relTol": 1e-9 }, "acceleration": { "value": 3.09615, "relTol": 1e-5 } } },
  { "name": "on the point of slipping stays static", "preset": "eng-horizontal", "params": { "angle": 0, "mass": 10, "muS": 0.5, "muK": 0.3, "appliedForce": 50, "forceAngle": 0, "g": 10 }, "run": "static",
    "expect": { "frictionForce": { "value": -50, "relTol": 1e-9 }, "acceleration": { "value": 0, "absTol": 1e-9 } } }
]
```
