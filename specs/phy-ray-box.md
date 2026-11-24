---
id: phy-ray-box
title: "Ray box"
subject: phy
engine: rays
setup: ray-box
priority: P1
status: draft            # stub → draft → approved (Gate B)
page: /interactives/physics/ray-box.html
listings:            # catalogue listings that open this page with a preset; define these presets
  - {"id":"eng-fibre-optics","preset":"eng-fibre","title":"Optical fibre"}
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Physics","version":"2017","area":"Module 3: Waves and Thermodynamics","outcomes":[],"verified":false}
  - {"course":"Physics","version":"2025","focusArea":"Waves","year":11,"outcomes":[],"verified":false}
---
# Ray box

> Backlog summary: Snell's law, critical angle, total internal reflection into an optical fibre.

## Learning goal
Students apply Snell's law, n₁ sin θ₁ = n₂ sin θ₂, with angles measured from the normal, to predict how light bends at a boundary; find the critical angle sin θc = n₂/n₁ for light leaving a denser medium; and explain total internal reflection and how it keeps light inside an optical fibre (with the acceptance angle set by the core and cladding indices).

Syllabus fit: 2017 Module 3 Waves and Thermodynamics (ray model of light: refraction, Snell's law, refractive index, critical angle and total internal reflection); 2025 Year 11 focus area Waves. Engineering Studies uses the same page through the `eng-fibre` preset (2011 Telecommunications Engineering / 2026 Aeronautical and aerospace engineering: optical fibres).

## What the student sees
Default view at 1920×1080, projector theme:

- **A ray box** on the left firing a narrow beam (orange) at a transparent block on a light grid, with the incident, refracted and (faint) partially reflected rays drawn. The normal at each point of incidence is a dashed line.
- **Protractor overlay (optional):** centred on the point of incidence, with the angle of incidence and the angle of refraction marked as arcs and labelled `θ₁ = 30.0°`, `θ₂ = 19.5°`.
- **Rectangular block:** the ray enters the top face, bends towards the normal, and leaves the bottom face parallel to the incoming ray, offset sideways.
- **Semicircular block:** the ray enters the curved face along a radius (no bending) and meets the flat face at its centre, where it refracts out or, beyond the critical angle, reflects. A badge reads `TOTAL INTERNAL REFLECTION` when it does.
- **Optical fibre:** a long straight core with a cladding layer, a ray launched into the end face at the chosen angle, zigzagging along by total internal reflection; rays launched outside the acceptance cone leak out through the cladding, drawn fading.
- Labels show the refractive indices of each region (`n = 1.50`).

The setup is static: the ray is redrawn on every change (up to 50 interactions).

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| block | Block | | | | | rectangle | enum: `rectangle` (Rectangular block), `semicircle` (Semicircular block), `fibre` (Optical fibre); segmented |
| n1 | Surrounding medium n₁ | | 1.00 | 1.80 | 0.01 | 1.00 | air 1.00, water 1.33 |
| n2 | Block (or fibre core) n₂ | | 1.00 | 2.50 | 0.01 | 1.50 | water 1.33, acrylic 1.49, glass 1.50, diamond 2.42 |
| nCladding | Cladding n | | 1.00 | 2.00 | 0.01 | 1.40 | `visibleWhen: { block: 'fibre' }` |
| incidence | Angle θ | ° | 0 | 89 | 0.5 | 30 | rectangle: angle of incidence in medium 1 at the top face; semicircle: angle inside the block at the flat face; fibre: launch angle in medium 1 to the fibre's axis |
| showNormal | Normals | | | | | on | |
| showProtractor | Protractor | | | | | on | |
| showReflected | Partial reflection | | | | | on | faint reflected ray at each boundary |

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | rectangle, n₁ 1.00, n₂ 1.50, θ 30° | air into glass: bends towards the normal, emerges parallel |
| critical | semicircle, n₁ 1.00, n₂ 1.50, θ 41.5° | just below glass's critical angle (41.8°): the ray grazes out along the surface |
| water | semicircle, n₁ 1.00, n₂ 1.33, θ 45° | water's critical angle is 48.8°, so 45° still refracts out |
| eng-fibre | fibre, n₁ 1.00, n₂ (core) 1.50, cladding 1.40, θ 15° | Engineering listing: a guided ray in a step-index fibre; acceptance angle 32.6° |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| refractionAngle | Angle of refraction θ₂ | ° | 3 |
| criticalAngle | Critical angle θc | ° | 3 |
| boundaryAngle | Angle at core–cladding boundary | ° | 3 |
| acceptanceAngle | Acceptance angle | ° | 3 |

Further output: `tir` (1 when total internal reflection occurs at the boundary that matters, 0 otherwise; shown on stage as the badge).

Definitions:
- `refractionAngle`: rectangle, asin(n₁ sin θ/n₂) inside the block (NaN if light cannot enter, which needs n₂ < n₁ and a large θ); semicircle, asin(n₂ sin θ/n₁) outside the flat face (NaN at total internal reflection); fibre, the angle inside the core to the axis after refraction at the end face, asin(n₁ sin θ/n₂).
- `criticalAngle`: rectangle and semicircle, asin(n_low/n_high) for the two media (NaN if equal); fibre, asin(n_cladding/n_core) (NaN if the cladding index is not lower).
- `boundaryAngle` (fibre only): 90° − refraction angle, the angle of incidence on the core–cladding boundary.
- `acceptanceAngle` (fibre only): asin(√(n_core² − n_cladding²)/n₁), or 90° if that argument is 1 or more.
- `tir`: semicircle, 1 when n₂ sin θ/n₁ > 1; fibre, 1 (guided) when `boundaryAngle` > `criticalAngle`; rectangle, 1 if light cannot enter.

## Assumptions shown on stage
- Ray model of light; one wavelength (no dispersion)
- Angles measured from the normal (fibre launch angle measured from the axis)
- Smooth, clean surfaces; partial reflection shown faint, not to scale of brightness
- Straight fibre, step-index (core and cladding of fixed n)

## Try this (3–5 predict, observe, explain prompts)
1. Predict: when light goes from air into glass, does it bend towards or away from the normal? Check with the rectangular block, then explain why the ray leaving the bottom is parallel to the one going in.
2. Observe: with the semicircular block, slowly increase θ. At what angle does the refracted ray skim along the surface? Compare with the critical-angle readout.
3. Explain: use n₁ sin θ₁ = n₂ sin θ₂ to show why there is no refracted ray once sin θ > n₁/n₂.
4. Predict: is the critical angle for water larger or smaller than for glass? Set n₂ = 1.33 and check.
5. Explain: in the `eng-fibre` preset, increase the launch angle until the ray starts to leak out. Why does a cladding with an index closer to the core's make the acceptance angle smaller?

## Teacher notes outline
- **Misconceptions to target:** angles are measured from the surface; light slows down because the glass is "thicker"; total internal reflection can happen going from air into glass; at the critical angle all the light disappears; optical fibres work by reflecting off a mirror coating.
- **10-minute lesson flow:** (1) default: measure θ₁ and θ₂, check Snell's law (3 min); (2) `critical`: find the critical angle, then pass it (3 min); (3) `water`: compare materials (1 min); (4) `eng-fibre`: TIR in a fibre, acceptance angle, link to communications (3 min).
- **Original HSC-style question idea:** (a) Calculate the critical angle for light travelling from water (n = 1.33) into air (48.8°). (b) A glass block (n = 1.52) has a thin layer of water on its top surface. Calculate the critical angle at the glass–water boundary (61.0°) and explain why it is larger than for glass–air. (c) An optical fibre has a core of n = 1.48 and cladding of n = 1.46. Calculate its acceptance angle in air (14.0°). (Write the full question and worked solution in the notes file.)

## Accessibility notes
- The incident ray is solid and thick, the refracted ray solid, the partial reflection thin and dashed, and the normals dashed grey; angles are written next to their arcs. The TIR state is a text badge; leaking rays in the fibre fade and are labelled "escapes".
- Keyboard: every parameter is a slider with number entry, a segmented control or a toggle. With the stage focused, ← and → change θ by 0.5° (Shift: 5°).
- Stage `aria-label` (from `describe()`): "Ray box: light in air hits a rectangular glass block, refractive index 1.50, at 30.0 degrees to the normal. It refracts to 19.5 degrees inside the block and leaves parallel to the incoming ray. Critical angle for this pair 41.8 degrees."

## Engine change requests
- **Keys to reconcile with engine meta** (the `rays` engine had not started when this spec was written): params `block`, `n1`, `n2`, `nCladding`, `incidence`, `showNormal`, `showProtractor`, `showReflected`; outputs `refractionAngle`, `criticalAngle`, `boundaryAngle`, `acceptanceAngle`, `tir`.
- `ray-box` is a static setup (`meta.staticSetups`).
- A `describe()` method for the stage label above.

## Acceptance
Every number below comes from the formula and hand calculation shown here (Snell's law n₁ sin θ₁ = n₂ sin θ₂; sin θc = n_low/n_high). Closed forms, so tolerances are tight (0.001°). All checks are static.

- **Check 1, air into glass (default).** sin θ₂ = 1.00 × sin 30°/1.50 = 0.5/1.5 = 1/3, θ₂ = **19.4712°**. Critical angle for glass–air: sin θc = 1/1.5, θc = **41.8103°**. No TIR: `tir` = **0**.
- **Check 2, steeper incidence.** θ = 60°: sin θ₂ = 0.866025/1.5 = 0.577350, θ₂ = **35.2644°**.
- **Check 3, out of the semicircular block below the critical angle.** θ = 30° inside glass: sin θ_out = 1.5 × 0.5/1.0 = 0.75, θ_out = **48.5904°**; `tir` = **0**.
- **Check 4, beyond the critical angle.** θ = 45° inside glass: 1.5 × sin 45° = 1.0607 > 1, so there is no refracted ray: `tir` = **1**; critical angle **41.8103°**.
- **Check 5, water (`water` preset).** n₂ = 1.33: θc = asin(1/1.33) = asin(0.751880) = **48.7535°**. At θ = 45°: sin θ_out = 1.33 × 0.707107 = 0.940452, θ_out = **70.1276°**, `tir` = **0**.
- **Check 6, optical fibre (`eng-fibre`).** Core 1.50, cladding 1.40, launch 15° in air. Inside the core: sin θ = sin 15°/1.5 = 0.258819/1.5 = 0.172546, θ = **9.93588°** to the axis, so the angle of incidence on the core–cladding boundary is 90° − 9.93588° = **80.0641°**. Critical angle asin(1.40/1.50) = asin(0.933333) = **68.9605°**. 80.06° > 68.96°, so the ray is guided: `tir` = **1**. Acceptance angle = asin(√(1.5² − 1.4²)) = asin(√0.29) = asin(0.538516) = **32.5827°**.
- **Check 7, fibre launch outside the acceptance cone.** θ = 40°: sin θ = 0.642788/1.5 = 0.428525, θ = 25.3740°, boundary angle 90° − 25.3740° = **64.6260°** < 68.9605°, so the ray leaks out: `tir` = **0**.

```acceptance
[
  { "name": "air into glass at 30°", "params": { "block": "rectangle", "n1": 1, "n2": 1.5, "incidence": 30 }, "run": "static",
    "expect": { "refractionAngle": { "value": 19.4712, "absTol": 0.001 }, "criticalAngle": { "value": 41.8103, "absTol": 0.001 }, "tir": { "value": 0, "absTol": 1e-9 } } },
  { "name": "air into glass at 60°", "params": { "block": "rectangle", "n1": 1, "n2": 1.5, "incidence": 60 }, "run": "static",
    "expect": { "refractionAngle": { "value": 35.2644, "absTol": 0.001 } } },
  { "name": "out of the semicircle at 30°", "params": { "block": "semicircle", "n1": 1, "n2": 1.5, "incidence": 30 }, "run": "static",
    "expect": { "refractionAngle": { "value": 48.5904, "absTol": 0.001 }, "tir": { "value": 0, "absTol": 1e-9 } } },
  { "name": "total internal reflection at 45° in glass", "params": { "block": "semicircle", "n1": 1, "n2": 1.5, "incidence": 45 }, "run": "static",
    "expect": { "tir": { "value": 1, "absTol": 1e-9 }, "criticalAngle": { "value": 41.8103, "absTol": 0.001 } } },
  { "name": "water: larger critical angle", "preset": "water", "params": { "block": "semicircle", "n1": 1, "n2": 1.33, "incidence": 45 }, "run": "static",
    "expect": { "criticalAngle": { "value": 48.7535, "absTol": 0.001 }, "refractionAngle": { "value": 70.1276, "absTol": 0.001 }, "tir": { "value": 0, "absTol": 1e-9 } } },
  { "name": "eng-fibre preset: guided ray", "preset": "eng-fibre", "params": {}, "run": "static",
    "expect": { "refractionAngle": { "value": 9.93588, "absTol": 0.001 }, "boundaryAngle": { "value": 80.0641, "absTol": 0.001 }, "criticalAngle": { "value": 68.9605, "absTol": 0.001 }, "acceptanceAngle": { "value": 32.5827, "absTol": 0.001 }, "tir": { "value": 1, "absTol": 1e-9 } } },
  { "name": "fibre: launch outside the acceptance cone leaks", "params": { "block": "fibre", "n1": 1, "n2": 1.5, "nCladding": 1.4, "incidence": 40 }, "run": "static",
    "expect": { "boundaryAngle": { "value": 64.6260, "absTol": 0.001 }, "tir": { "value": 0, "absTol": 1e-9 } } }
]
```
