---
id: me1-vector-playground
title: "Vector playground"
subject: me1
engine: space3d
setup: vectors
priority: P1
status: approved            # stub → draft → approved (Gate B)
page: /interactives/maths-ext1/vector-playground.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Mathematics Extension 1","version":"2024","area":"Vectors","focusArea":"Introduction to vectors","year":12,"outcomes":[],"verified":false}
---
# Vector playground

> Backlog summary: 2D and 3D vectors: add, scale, dot product, projection.

## Learning goal
Students work with vectors in two and three dimensions as arrows and as components: adding by the triangle or parallelogram rule, scaling by a real number, finding magnitudes, using the scalar (dot) product a·b = |a||b|cos θ to find the angle between vectors and to test for perpendicularity, and projecting one vector onto another.

## What the student sees
Default view at 1920×1080 (projector theme), 3D, a = (1, 2, 2), b = (2, −1, 2), operation "dot product", perspective camera from the first octant:

- **3D view (left, about 65% of the stage):** x, y and z axes with unit ticks and labels, a faint grid on the xy-plane. Vector **a** is an orange arrow (3 px, filled head) from the origin, vector **b** a blue arrow (`--s2`), each labelled with its name and components, e.g. "a = (1, 2, 2)". Component guides (toggle): dashed lines from each tip down to the xy-plane and across to the axes, forming a box.
- **Operation layers:**
  - *Add:* b is redrawn from the tip of a (triangle rule) with a dashed copy completing the parallelogram; the resultant a + b is a thick dark arrow labelled with its components.
  - *Subtract:* a − b drawn from the origin, with the arrow from the tip of b to the tip of a highlighted as the same vector.
  - *Scale:* ka as a dark arrow along the line of a (reversed when k < 0), with k shown.
  - *Dot product:* an arc between a and b labelled with θ, and the working a·b = a₁b₁ + a₂b₂ + a₃b₃ beside it.
  - *Project:* the projection of a onto b as a thick dark arrow along b, a dashed perpendicular from the tip of a to the line of b with a right-angle mark.
- **Working panel (right):** the formula for the chosen operation in KaTeX with the current numbers substituted, ending in the result.
- In 2D mode the camera looks straight down the z-axis (orthographic), z components are hidden and treated as 0, and the panel drops the third component.
- Dragging rotates the view; vector tips can also be dragged (snapping to 0.5) in the plane facing the camera.

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| dimension | Space | | | | | 3d | enum: `2d`, `3d`. In 2D, az and bz are ignored (treated as 0) |
| ax | a: x component | | −10 | 10 | 0.5 | 1 | |
| ay | a: y component | | −10 | 10 | 0.5 | 2 | |
| az | a: z component | | −10 | 10 | 0.5 | 2 | 3D only |
| bx | b: x component | | −10 | 10 | 0.5 | 2 | |
| by | b: y component | | −10 | 10 | 0.5 | −1 | |
| bz | b: z component | | −10 | 10 | 0.5 | 2 | 3D only |
| operation | Show | | | | | dot | enum: `add` (a + b), `subtract` (a − b), `scale` (ka), `dot` (a·b and θ), `project` (projection of a onto b). Select |
| scalar | k | | −3 | 3 | 0.25 | 2 | scale only |
| showComponents | Component guides | | | | | on | |
| showLabels | Labels | | | | | on | |
| camera | View | | | | | perspective | enum: `perspective`, `orthographic` (2D always uses orthographic) |

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | 3D, a = (1, 2, 2), b = (2, −1, 2), dot | Both magnitudes are 3, so cos θ = 4/9 |
| add-3d | 3D, a = (3, 4, 0), b = (1, −2, 2), add | The resultant (4, 2, 2); a·b < 0, so θ is obtuse |
| perpendicular | 3D, a = (2, 1, −1), b = (1, −1, 1), dot | a·b = 0: perpendicular vectors |
| projection-2d | 2D, a = (3, 4), b = (4, 0), project | The projection onto the x-direction is (3, 0) |
| scale | 3D, a = (2, −2, 1), k = −1.5, scale | A negative scalar reverses direction; \|ka\| = 1.5\|a\| |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| magA | \|a\| | | 4 |
| magB | \|b\| | | 4 |
| dot | a·b | | 4 |
| angle | Angle θ between a and b | ° | 4 |
| scalarProjection | Scalar projection of a on b (a·b/\|b\|) | | 4 |
| resultX | Result: x | | 4 |
| resultY | Result: y | | 4 |
| resultZ | Result: z | | 4 |
| resultMag | Result: magnitude | | 4 |

- The result vector is a + b (add), a − b (subtract), ka (scale) or ((a·b)/|b|²) b (project). For `dot` there is no result vector and the four result outputs are NaN.
- angle = cos⁻¹(a·b/(|a||b|)) in degrees, from 0° to 180°. If a or b is the zero vector, angle, scalarProjection and the projection are NaN and the stage says so.

## Assumptions shown on stage
- Vectors drawn from the origin (position vectors) unless shown head to tail
- Right-handed axes; components snap to multiples of 0.5
- In 2D, the z components are 0

## Try this (3–5 predict, observe, explain prompts)
1. Predict: in the default scene, both vectors have magnitude 3. Is the angle between them more or less than 90°? Check the sign of a·b first.
2. Observe: in the add-3d preset, drag b around. Is |a + b| ever larger than |a| + |b|? When is it equal?
3. Predict: in the perpendicular preset, change bz from 1 to 2. Will the angle become acute or obtuse?
4. Observe: in the projection-2d preset, rotate a about the origin by changing its components. When is the projection zero, and when is it longer than b?
5. Explain: why is the projection of a onto b unchanged when b is replaced by 2b, even though a·b doubles?

## Teacher notes outline
- Misconceptions to target: a·b is a vector (it is a scalar); the projection of a onto b is the same as the projection of b onto a; |a + b| = |a| + |b|; a negative dot product is an error (it means an obtuse angle); "perpendicular in the picture" is enough (perspective can mislead, so use a·b = 0); multiplying by a negative scalar changes the line the vector lies on.
- 10-minute lesson flow: 0–2 min read components and magnitudes in 3D, rotating the view; 2–4 min add and subtract with the triangle and parallelogram; 4–6 min dot product and the angle, predicting the sign first; 6–8 min the perpendicular preset; 8–10 min projection in 2D, then in 3D.
- Original HSC-style question idea: the points A(1, 0, 2), B(3, 1, 0) and C(0, 4, 1) are given. (a) Find the vectors AB and AC. (b) Find the angle BAC to the nearest degree. (c) Find the projection of AC onto AB, and hence the shortest distance from C to the line AB. Full question and worked solution go in the notes file.

## Accessibility notes
- Second cues beyond colour: every arrow carries its name and components as text; the resultant is thicker and dark; the projection's perpendicular is dashed with a right-angle mark; component guides are dashed.
- Keyboard: every component is a panel control; the camera turns with the arrow keys when the stage has focus; "Reset view" restores it.
- Stage aria-label (from `describe()`), for example: "Vectors a = (1, 2, 2) and b = (2, −1, 2) in three dimensions. Dot product 4; angle between them 63.6 degrees."

## Engine change requests
The space3d engine was not yet on `origin` when this spec was written, so these are **keys to reconcile with engine meta**:
- Params (setup `vectors`): `dimension`, `ax`, `ay`, `az`, `bx`, `by`, `bz`, `operation`, `scalar`, `showComponents`, `showLabels`, `camera` (named `camera` rather than `projection` so it cannot be confused with vector projection).
- Outputs: `magA`, `magB`, `dot`, `angle`, `scalarProjection`, `resultX`, `resultY`, `resultZ`, `resultMag`.
- Uses the pure vec3 helpers in `space3d/model.js` (dot, cross, projection).

## Acceptance
Every number below comes from the formula and hand calculation shown here. All are closed forms (tolerance 1e-9 absolute for exact values, relative 1e-9 otherwise).

- **Check 1, default (dot).** |a| = √(1 + 4 + 4) = **3**; |b| = √(4 + 1 + 4) = **3**. a·b = 2 − 2 + 4 = **4**. cos θ = 4/9, θ = cos⁻¹(0.4444444444) = **63.61220004°**. Scalar projection a·b/|b| = 4/3 = **1.333333333**.
- **Check 2, default (project).** Projection = (a·b/|b|²) b = (4/9)(2, −1, 2) = (**0.8888888889**, **−0.4444444444**, **0.8888888889**), magnitude 4/3 = **1.333333333**.
- **Check 3, add.** a = (3, 4, 0), b = (1, −2, 2): a + b = (**4**, **2**, **2**), |a + b| = √24 = **4.898979486**. a·b = 3 − 8 + 0 = **−5**; |a| = 5, |b| = 3, cos θ = −5/15 = −1/3, θ = **109.4712206°** (obtuse).
- **Check 4, subtract.** a − b = (3 − 1, 4 + 2, 0 − 2) = (**2**, **6**, **−2**), magnitude √(4 + 36 + 4) = √44 = **6.633249581**.
- **Check 5, perpendicular.** a = (2, 1, −1), b = (1, −1, 1): a·b = 2 − 1 − 1 = **0**, so θ = **90°**.
- **Check 6, projection in 2D.** a = (3, 4), b = (4, 0) (az = 5 is set but ignored in 2D): |a| = **5**, a·b = 12, |b|² = 16, projection = (12/16)(4, 0) = (**3**, **0**, **0**); θ = cos⁻¹(12/20) = cos⁻¹(0.6) = **53.13010235°**.
- **Check 7, scale.** k = −1.5, a = (2, −2, 1): ka = (**−3**, **3**, **−1.5**); |ka| = 1.5 × √(4 + 4 + 1) = 1.5 × 3 = **4.5**.

```acceptance
[
  { "name": "default: dot product and angle",
    "params": { "dimension": "3d", "ax": 1, "ay": 2, "az": 2, "bx": 2, "by": -1, "bz": 2, "operation": "dot" },
    "run": "static",
    "expect": {
      "magA": { "value": 3, "absTol": 1e-9 },
      "magB": { "value": 3, "absTol": 1e-9 },
      "dot": { "value": 4, "absTol": 1e-9 },
      "angle": { "value": 63.61220004, "relTol": 1e-9 },
      "scalarProjection": { "value": 1.333333333, "relTol": 1e-9 } } },
  { "name": "projection of a onto b",
    "params": { "dimension": "3d", "ax": 1, "ay": 2, "az": 2, "bx": 2, "by": -1, "bz": 2, "operation": "project" },
    "run": "static",
    "expect": {
      "resultX": { "value": 0.8888888889, "relTol": 1e-9 },
      "resultY": { "value": -0.4444444444, "relTol": 1e-9 },
      "resultZ": { "value": 0.8888888889, "relTol": 1e-9 },
      "resultMag": { "value": 1.333333333, "relTol": 1e-9 } } },
  { "name": "add: (3, 4, 0) + (1, -2, 2)",
    "params": { "dimension": "3d", "ax": 3, "ay": 4, "az": 0, "bx": 1, "by": -2, "bz": 2, "operation": "add" },
    "run": "static",
    "expect": {
      "resultX": { "value": 4, "absTol": 1e-9 },
      "resultY": { "value": 2, "absTol": 1e-9 },
      "resultZ": { "value": 2, "absTol": 1e-9 },
      "resultMag": { "value": 4.898979486, "relTol": 1e-9 },
      "dot": { "value": -5, "absTol": 1e-9 },
      "angle": { "value": 109.4712206, "relTol": 1e-9 } } },
  { "name": "subtract: (3, 4, 0) - (1, -2, 2)",
    "params": { "dimension": "3d", "ax": 3, "ay": 4, "az": 0, "bx": 1, "by": -2, "bz": 2, "operation": "subtract" },
    "run": "static",
    "expect": {
      "resultX": { "value": 2, "absTol": 1e-9 },
      "resultY": { "value": 6, "absTol": 1e-9 },
      "resultZ": { "value": -2, "absTol": 1e-9 },
      "resultMag": { "value": 6.633249581, "relTol": 1e-9 } } },
  { "name": "perpendicular vectors",
    "params": { "dimension": "3d", "ax": 2, "ay": 1, "az": -1, "bx": 1, "by": -1, "bz": 1, "operation": "dot" },
    "run": "static",
    "expect": { "dot": { "value": 0, "absTol": 1e-9 }, "angle": { "value": 90, "absTol": 1e-9 } } },
  { "name": "2D projection ignores z",
    "params": { "dimension": "2d", "ax": 3, "ay": 4, "az": 5, "bx": 4, "by": 0, "bz": 0, "operation": "project" },
    "run": "static",
    "expect": {
      "magA": { "value": 5, "absTol": 1e-9 },
      "resultX": { "value": 3, "absTol": 1e-9 },
      "resultY": { "value": 0, "absTol": 1e-9 },
      "resultZ": { "value": 0, "absTol": 1e-9 },
      "angle": { "value": 53.13010235, "relTol": 1e-9 } } },
  { "name": "scale by -1.5",
    "params": { "dimension": "3d", "ax": 2, "ay": -2, "az": 1, "bx": 2, "by": -1, "bz": 2, "operation": "scale", "scalar": -1.5 },
    "run": "static",
    "expect": {
      "resultX": { "value": -3, "absTol": 1e-9 },
      "resultY": { "value": 3, "absTol": 1e-9 },
      "resultZ": { "value": -1.5, "absTol": 1e-9 },
      "resultMag": { "value": 4.5, "absTol": 1e-9 } } }
]
```
