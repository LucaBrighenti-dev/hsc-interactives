---
id: eng-force-sandbox
title: "Force sandbox"
subject: eng
engine: statics
setup: concurrent
priority: P1
status: draft            # stub → draft → approved (Gate B)
page: /interactives/engineering/force-sandbox.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Engineering Studies","version":"2011","area":"Engineered products","subtopic":"Engineering mechanics","year":11,"outcomes":["P3.1"],"url":"https://www.nsw.gov.au/education-and-training/nesa/curriculum/tas/engineering-studies-stage-6-2011","verified":true}
  - {"course":"Engineering Studies","version":"2026","focusArea":"Applied engineering analysis","subtopic":"Equilibrium in mechanics","year":11,"outcomes":["ES-11-04"],"url":"https://curriculum.nsw.edu.au/learning-areas/tas/engineering-studies-11-12-2026/content/year-11/faa305594d","verified":true}
---
# Force sandbox

> Backlog summary: Resolve components, resultant and equilibrant, concurrent forces, three-force rule.

## Learning goal
Students resolve forces into x and y components, add concurrent forces to find their resultant (by components and by a closed force polygon), and recognise the equilibrant as the force that would close the polygon. In the boom scene they apply the three-force rule: three non-parallel forces in equilibrium must meet at one point, which locates the line of action of an unknown pin reaction.

Syllabus fit: 2011 Engineered products (engineering mechanics: forces, resolution, resultants, equilibrium); 2026 Applied engineering analysis, Year 11, equilibrium in mechanics. Pitched at Stage 6: graphical (polygon) and analytical (components) methods side by side.

## What the student sees
Default view at 1920×1080, light projector theme.

**Concurrent forces scene (default):**
- **Left half, space diagram:** a point O at the centre of a polar grid (30° spokes, rings every 20 N). Up to four force arrows start at O, each draggable by its head, labelled "F₁ = 50 N, 30°". With **Show components** on, each force casts dashed x and y component arrows with values ("43.3 N", "25.0 N"). The resultant R is a thick double-headed arrow labelled "R = …" and the equilibrant E a thick arrow with an open head labelled "E = …", pointing the opposite way.
- **Right half, force polygon:** the same forces drawn head to tail in order, to the same scale, with the resultant closing the polygon from the first tail to the last head (labelled R) and the equilibrant from the last head back to the first tail (labelled E). When R is less than 0.5% of the largest force, the polygon is labelled "Closed: in equilibrium".
- **Below:** a components table (F, θ, Fx = F cos θ, Fy = F sin θ, and the sums ΣFx, ΣFy).

**Three-force body scene:** a horizontal boom AB pinned to a wall at A, held by a cable from its end B to a wall point C above A, carrying a hanging load W at distance a from A. The lines of action of W (vertical) and of the cable are extended as dashed lines to meet at point O, and the pin reaction at A is drawn along the line AO. A small force triangle (W, T, R_A) is drawn closed beside it.

Static setup: play, step and reset are hidden.

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| concurrentMode | Scene | | | | | forces | enum: `forces` (concurrent forces), `boom` (three-force body) |
| forceCount | Number of forces | | 2 | 4 | 1 | 3 | integer; forces scene |
| force1 | Force F₁ | N | 0 | 200 | 1 | 100 | |
| angle1 | F₁ direction (anticlockwise from +x) | ° | −180 | 180 | 1 | 0 | |
| force2 | Force F₂ | N | 0 | 200 | 1 | 80 | |
| angle2 | F₂ direction | ° | −180 | 180 | 1 | 90 | |
| force3 | Force F₃ | N | 0 | 200 | 1 | 60 | visible when forceCount ≥ 3 |
| angle3 | F₃ direction | ° | −180 | 180 | 1 | −150 | visible when forceCount ≥ 3 |
| force4 | Force F₄ | N | 0 | 200 | 1 | 50 | visible when forceCount = 4 |
| angle4 | F₄ direction | ° | −180 | 180 | 1 | −60 | visible when forceCount = 4 |
| boomLength | Boom length L | m | 1 | 10 | 0.1 | 4 | boom scene |
| cableHeight | Cable anchor height h | m | 0.5 | 10 | 0.1 | 3 | boom scene; above the pin A |
| boomLoad | Load W | kN | 0 | 100 | 0.5 | 10 | boom scene |
| boomLoadAt | Load distance from the wall a | m | 0 | 10 | 0.1 | 3 | boom scene; clamped to the boom |
| showComponents | Show components | | | | | on | boolean |

Angles −110° and 250° are the same direction; the sliders use −180° to 180°. These keys, ranges and engine defaults match the statics engine's `meta` on `origin/w1/engine-statics` (checked 25 November 2026).

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | forces, 3 forces: 50 N at 30°, 80 N at 135°, 40 N at −110° | a general resultant in the second quadrant |
| right-angle | forces, 2 forces: 30 N at 0°, 40 N at 90° | the 3-4-5 resultant |
| balanced | forces, 3 forces of 100 N at 0°, 120°, −120° | a closed polygon: equilibrium |
| four-forces | forces, 4 forces: 50 N at 30°, 80 N at 135°, 40 N at −110°, 60 N at −45° | more forces, same method |
| boom | boom, L = 4 m, h = 3 m, W = 6 kN at a = 4 m | three-force rule with a 3-4-5 cable |
| boom-mid | boom, L = 4 m, h = 3 m, W = 6 kN at a = 2 m | the pin reaction tilts up |

No preset uses g: forces and loads are given in newtons and kilonewtons.

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| resultant | Resultant R | N | 3 |
| resultantAngle | Direction of R (anticlockwise from +x) | ° | 3 |
| sumFx | ΣFx | N | 3 |
| sumFy | ΣFy | N | 3 |
| equilibrant | Equilibrant E | N | 3 |
| equilibrantAngle | Direction of E | ° | 3 |
| cableTension | Cable tension T (boom) | kN | 3 |
| pinReaction | Pin reaction R_A (boom) | kN | 3 |
| pinAngle | Direction of R_A | ° | 3 |

Directions are in (−180°, 180°]. Readouts for the other scene show "—".

## Assumptions shown on stage
- Forces act at one point (concurrent), in one plane
- Angles measured anticlockwise from the positive x-axis
- Boom scene: weightless boom and cable, frictionless pin; the cable can only pull

## Try this (3–5 predict, observe, explain prompts)
1. Predict: two forces of 30 N and 40 N act at right angles. How big is the resultant? Observe with the **right-angle** preset.
2. Observe: in the default preset, reorder the forces in the polygon (drag F₃ to be first). Does the resultant change?
3. Predict, then observe: in the **balanced** preset, change one force to 120 N. Where does the equilibrant point?
4. Explain: in the **boom** preset, why must the pin reaction at A point straight along the boom when the load hangs at the end?
5. Observe: slide the load towards A in the boom scene. How do the cable tension and the direction of the pin reaction change, and where is point O?

## Teacher notes outline
- Misconceptions to target: the resultant's size is the sum of the sizes; the equilibrant is the same as the resultant; the order in a force polygon matters; a pin reaction always acts along the member it supports (only for a two-force member).
- 10-minute lesson flow: (1) right-angle preset by Pythagoras; (2) the default preset by components, checked against the polygon; (3) balanced: a closed polygon means equilibrium; (4) boom with the load at the end (two-force member), then at mid-span (three-force rule).
- Original HSC-style question idea: a sign of weight 9 kN hangs from the end of a 3 m horizontal boom pinned to a wall; a cable runs from the boom's end to the wall 4 m above the pin. Find the cable tension and the pin reaction. Worked solution: cable length 5 m; moments about the pin: T × (perpendicular distance 3 × 4/5 = 2.4 m) = 9 × 3, so T = 11.25 kN; pin reaction = 11.25 × 3/5 = 6.75 kN horizontally into the wall.

## Accessibility notes
Each force arrow carries a text label with its name, size and angle; the resultant is a thick double-headed arrow and the equilibrant has an open arrowhead, so they differ by shape as well as colour. Components are dashed. In the boom scene, the cable (tension) is a solid line tagged "T" and the boom (compression) a thick dashed line tagged "C". Forces can be selected with Tab and adjusted with arrow keys (left/right turn by 1°, up/down change size by 1 N). Stage label: "… concurrent forces. Resultant … newtons at … degrees; equilibrant … newtons at … degrees."

## Engine change requests
- None for the keys: every param and output used here is in the statics engine's `meta` for `concurrent` on `origin/w1/engine-statics` (checked 25 November 2026): params `concurrentMode`, `forceCount`, `force1`–`force4`, `angle1`–`angle4`, `boomLength`, `cableHeight`, `boomLoad`, `boomLoadAt`, `showComponents`; outputs `resultant`, `resultantAngle`, `sumFx`, `sumFy`, `equilibrant`, `equilibrantAngle`, `cableTension`, `pinReaction`, `pinAngle`.
- The force polygon is part of the view this page relies on.

## Acceptance
Every number below comes from the formula and hand calculation shown here. Components: Fx = F cos θ, Fy = F sin θ; R = √(ΣFx² + ΣFy²); direction = atan2(ΣFy, ΣFx); the equilibrant has the same size and the opposite direction. Boom: moments about the pin A give T × (Lh/√(L² + h²)) = W × a; then the pin reaction balances W and T.

- **Check 1, right angle.** 30 N at 0° and 40 N at 90°: ΣFx = **30 N**, ΣFy = **40 N**, R = √(900 + 1600) = **50 N** at atan(40/30) = **53.130°**. Equilibrant **50 N** at 53.130° − 180° = **−126.870°**.
- **Check 2, balanced.** 100 N at 0°, 120° and −120°: ΣFx = 100 + 100 cos 120° + 100 cos(−120°) = 100 − 50 − 50 = 0; ΣFy = 0 + 86.603 − 86.603 = 0. R = **0**.
- **Check 3, three general forces (default).** 50 N at 30°: (43.301, 25.000). 80 N at 135°: (−56.569, 56.569). 40 N at −110°: (40 cos(−110°), 40 sin(−110°)) = (−13.681, −37.588). ΣFx = 43.301 − 56.569 − 13.681 = **−26.948 N**; ΣFy = 25.000 + 56.569 − 37.588 = **43.981 N**. R = √(26.948² + 43.981²) = √(726.20 + 1934.32) = **51.580 N**. Direction: second quadrant, 180° − atan(43.981/26.948) = 180° − 58.503° = **121.497°**. Equilibrant at 121.497° − 180° = **−58.503°**.
- **Check 4, boom with the load at the end.** L = 4 m, h = 3 m, cable BC length √(4² + 3²) = 5 m. W = 6 kN at a = 4 m. The cable's perpendicular distance from A is Lh/5 = 2.4 m, so T × 2.4 = 6 × 4 and **T = 10 kN**. Cable components on B: (−10 × 4/5, +10 × 3/5) = (−8, +6) kN. Equilibrium of the boom: A_x = +8 kN, A_y = 6 − 6 = 0, so the pin reaction is **8 kN at 0°** (straight along the boom). Three-force check: W's line x = 4 and the cable line meet at O = (4, 0), on the boom's axis ✓.
- **Check 5, boom with the load at mid-span.** a = 2 m: T × 2.4 = 6 × 2, so **T = 5 kN**, components (−4, +3) kN. A_x = 4 kN, A_y = 6 − 3 = 3 kN: pin reaction √(4² + 3²) = **5 kN** at atan(3/4) = **36.870°**. Three-force check: W's line x = 2 meets the cable line y = 3(1 − x/4) at O = (2, 1.5), and 1.5/2 = 0.75 = tan 36.870° ✓.
- **Check 6, question idea.** L = 3 m, h = 4 m, W = 9 kN at a = 3 m: T = 9 × 3 × 5/(3 × 4) = **11.25 kN**; A_x = 11.25 × 3/5 = 6.75 kN, A_y = 9 − 11.25 × 4/5 = 0, so the pin reaction is **6.75 kN at 0°**.

```acceptance
[
  { "name": "right angle: 3-4-5 resultant", "params": { "concurrentMode": "forces", "forceCount": 2, "force1": 30, "angle1": 0, "force2": 40, "angle2": 90 }, "run": "static",
    "expect": { "resultant": { "value": 50, "relTol": 1e-12 }, "resultantAngle": { "value": 53.13010235, "absTol": 1e-7 }, "sumFx": { "value": 30, "absTol": 1e-9 }, "sumFy": { "value": 40, "absTol": 1e-9 }, "equilibrant": { "value": 50, "relTol": 1e-12 }, "equilibrantAngle": { "value": -126.86989765, "absTol": 1e-7 } } },
  { "name": "balanced: three 100 N forces at 120°", "params": { "concurrentMode": "forces", "forceCount": 3, "force1": 100, "angle1": 0, "force2": 100, "angle2": 120, "force3": 100, "angle3": -120 }, "run": "static",
    "expect": { "resultant": { "value": 0, "absTol": 1e-9 }, "equilibrant": { "value": 0, "absTol": 1e-9 } } },
  { "name": "three general forces by components", "params": { "concurrentMode": "forces", "forceCount": 3, "force1": 50, "angle1": 30, "force2": 80, "angle2": 135, "force3": 40, "angle3": -110 }, "run": "static",
    "expect": { "sumFx": { "value": -26.94807804, "absTol": 1e-7 }, "sumFy": { "value": 43.98083766, "absTol": 1e-7 }, "resultant": { "value": 51.58016083, "relTol": 1e-9 }, "resultantAngle": { "value": 121.49676658, "absTol": 1e-7 }, "equilibrantAngle": { "value": -58.50323342, "absTol": 1e-7 } } },
  { "name": "boom, load at the end: two-force boom", "params": { "concurrentMode": "boom", "boomLength": 4, "cableHeight": 3, "boomLoad": 6, "boomLoadAt": 4 }, "run": "static",
    "expect": { "cableTension": { "value": 10, "relTol": 1e-12 }, "pinReaction": { "value": 8, "relTol": 1e-12 }, "pinAngle": { "value": 0, "absTol": 1e-9 } } },
  { "name": "boom, load at mid-span: three-force rule", "params": { "concurrentMode": "boom", "boomLength": 4, "cableHeight": 3, "boomLoad": 6, "boomLoadAt": 2 }, "run": "static",
    "expect": { "cableTension": { "value": 5, "relTol": 1e-12 }, "pinReaction": { "value": 5, "relTol": 1e-12 }, "pinAngle": { "value": 36.86989765, "absTol": 1e-7 } } },
  { "name": "question idea: 9 kN sign on a 3 m boom", "params": { "concurrentMode": "boom", "boomLength": 3, "cableHeight": 4, "boomLoad": 9, "boomLoadAt": 3 }, "run": "static",
    "expect": { "cableTension": { "value": 11.25, "relTol": 1e-12 }, "pinReaction": { "value": 6.75, "relTol": 1e-12 }, "pinAngle": { "value": 0, "absTol": 1e-9 } } }
]
```
