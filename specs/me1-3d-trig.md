---
id: me1-3d-trig
title: "3D trigonometry scenes"
subject: me1
engine: space3d
setup: trig3d
priority: P1
status: approved            # stub → draft → approved (Gate B)
page: /interactives/maths-ext1/3d-trig.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Mathematics Extension 1","version":"2024","area":"Trigonometric functions","focusArea":"Further trigonometry","year":11,"outcomes":[],"verified":false}
---
# 3D trigonometry scenes

> Backlog summary: Rotatable towers, ramps and prisms with angle-of-elevation problems.

## Learning goal
Students solve three-dimensional problems by finding the right-angled (and non-right-angled) triangles that lie in vertical and horizontal planes, then applying Pythagoras, the trigonometric ratios, the cosine rule and true bearings. They learn to see the angle between a line and a plane as an angle inside a vertical right-angled triangle.

## What the student sees
Default view at 1920×1080 (projector theme), the tower scene, perspective camera looking down from the south-east at about 30° above the ground:

- A flat, light grey ground plane with a faint square grid and a north arrow labelled **N**.
- **Tower scene:** a vertical tower OT of height h (dark line, 4 px, with a small square base at O and the top labelled T). Observers A and B are small orange and blue markers on the ground, each placed by a true bearing and a distance from O. Dashed lines of sight from A and B to T. The two vertical right-angled triangles AOT and BOT are shaded (flat, 15% opacity fills, no gradients) with right-angle squares at O. The horizontal triangle AOB lies on the ground with its side AB drawn as a solid line. Angle arcs show the angles of elevation at A and B, and the angle AOB at the base, each labelled with its value.
- **Cuboid scene (a ramp in a box):** a rectangular prism length × width × height with the base diagonal and the space diagonal drawn; the vertical right-angled triangle formed by the base diagonal, a vertical edge and the space diagonal is shaded, with the angle between the space diagonal and the base marked.
- **Pyramid scene:** a right square pyramid with base side s and height h. The apex is joined to the base centre M (the height), the midpoint of a base edge (the slant height) and a base vertex (a slant edge). The two vertical right-angled triangles are shaded, with the face angle (between a triangular face and the base) and the edge angle (between a slant edge and the base) marked.
- Labels for every given length and every computed angle (CSS2D labels, at least 18 px). Dragging rotates the scene (OrbitControls); a "Reset view" button returns to the default camera; a toggle switches between perspective and orthographic views.

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| scene | Scene | | | | | tower | enum: `tower`, `cuboid`, `pyramid`. Segmented |
| towerHeight | Tower height h | m | 5 | 300 | 1 | 60 | tower |
| distA | Distance from the base to A | m | 10 | 500 | 1 | 80 | tower |
| bearingA | Bearing of A from the base | ° | 0 | 359 | 1 | 180 | tower; true bearing, clockwise from north |
| distB | Distance from the base to B | m | 10 | 500 | 1 | 60 | tower |
| bearingB | Bearing of B from the base | ° | 0 | 359 | 1 | 90 | tower; true bearing |
| length | Length | m | 1 | 50 | 0.5 | 4 | cuboid (east–west edge) |
| width | Width | m | 1 | 50 | 0.5 | 3 | cuboid (north–south edge) |
| height | Height | m | 1 | 50 | 0.5 | 12 | cuboid and pyramid |
| baseSide | Base side s | m | 1 | 50 | 0.5 | 6 | pyramid |
| showTriangles | Shade the key triangles | | | | | on | |
| showLabels | Labels | | | | | on | |
| camera | View | | | | | perspective | enum: `perspective`, `orthographic` |

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | scene tower, h = 60, A 80 m on bearing 180°, B 60 m on bearing 090° | A due south and B due east: the base angle is 90°, so AB comes from Pythagoras (100 m) |
| tower-obtuse | scene tower, h = 40, A 100 m on bearing 030°, B 100 m on bearing 150° | Base angle 120°: AB needs the cosine rule |
| tower-wrap | scene tower, h = 50, A 120 m on bearing 300°, B 90 m on bearing 040° | The angle between the bearings goes through north (100°) |
| cuboid | scene cuboid, 4 × 3 × 12 | A 3-4-5 base diagonal and a 5-12-13 space diagonal |
| pyramid | scene pyramid, s = 6, h = 4 | A 3-4-5 triangle gives the slant height |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| elevA | Elevation of T from A | ° | 4 |
| elevB | Elevation of T from B | ° | 4 |
| baseAngle | Angle AOB at the base | ° | 4 |
| distAB | Distance AB | m | 4 |
| bearingAtoB | Bearing of B from A | ° | 4 |
| faceDiagonal | Base diagonal | m | 4 |
| spaceDiagonal | Space diagonal | m | 4 |
| diagonalAngle | Space diagonal to base | ° | 4 |
| slantHeight | Slant height | m | 4 |
| faceAngle | Face to base | ° | 4 |
| slantEdge | Slant edge | m | 4 |
| edgeAngle | Slant edge to base | ° | 4 |

Outputs that do not belong to the current scene are NaN (the shell shows —). Angles are in degrees. Formulas:
- Tower: elevA = tan⁻¹(h/distA), elevB = tan⁻¹(h/distB); baseAngle = the smaller angle between the two bearings (0° to 180°); distAB = √(distA² + distB² − 2·distA·distB·cos(baseAngle)); bearingAtoB = the true bearing (0° ≤ θ < 360°) of the vector from A to B, with A at (distA sin bearingA, distA cos bearingA) in (east, north) coordinates and B likewise.
- Cuboid: faceDiagonal = √(l² + w²); spaceDiagonal = √(l² + w² + h²); diagonalAngle = tan⁻¹(h/faceDiagonal).
- Pyramid: slantHeight = √(h² + (s/2)²); faceAngle = tan⁻¹(h/(s/2)); slantEdge = √(h² + (s/√2)²); edgeAngle = tan⁻¹(h/(s/√2)).

## Assumptions shown on stage
- Ground is flat and horizontal; towers are vertical
- Observers' eyes are at ground level
- Bearings are true bearings, measured clockwise from north
- Drawn to scale (the camera may foreshorten in perspective view)

## Try this (3–5 predict, observe, explain prompts)
1. Predict: in the default scene, which observer sees the top of the tower at the larger angle of elevation, A or B? Check the arcs.
2. Observe: rotate the scene until you look straight down. Which triangle do you see in its true shape, and which triangles collapse to lines?
3. Predict: in the tower-obtuse preset, the observers are 100 m from the base and the base angle is 120°. Is AB more or less than 200 m? Then calculate it.
4. Observe: in the cuboid, double the height from 12 m to 24 m. Does the angle between the space diagonal and the base double?
5. Explain: in the pyramid, why is the face angle always larger than the edge angle for the same pyramid?

## Teacher notes outline
- Misconceptions to target: measuring the angle of elevation in the sloping plane instead of the vertical plane; assuming every triangle in a 3D diagram is right-angled (AOB usually is not); bearings measured anticlockwise or from east; using the base edge instead of the base diagonal for the angle between a space diagonal and the base; "doubling the height doubles the angle".
- 10-minute lesson flow: 0–2 min orient the class (north arrow, rotate, top view); 2–5 min default tower: predict, then read the angles and AB; 5–7 min tower-obtuse: the cosine rule on the ground triangle; 7–9 min pyramid: two vertical triangles, two different angles; 9–10 min students set a scene for a partner and swap calculations.
- Original HSC-style question idea: from a point P due west of the foot F of a vertical mast, the angle of elevation of the top is 32°. From a point Q on a bearing of 200° from F, the angle of elevation is 24°. P and Q are 150 m apart. Find the height of the mast, to the nearest metre. (It needs both vertical triangles to express FP and FQ in terms of h, then the cosine rule in the horizontal triangle PFQ with angle 70°.) Full question and worked solution go in the notes file.

## Accessibility notes
- Second cues beyond colour: observer A is a circle labelled **A** and observer B a square labelled **B**; lines of sight are dashed while edges of solids are solid; every angle has an arc and a text label; the shaded triangles also carry right-angle squares.
- Keyboard: all parameters are panel controls; the camera can be rotated with the arrow keys when the stage has focus, and the "Reset view" button restores it.
- Stage aria-label (from `describe()`), for example: "Tower 60 metres high. A is 80 metres from the base on a bearing of 180 degrees; B is 60 metres away on a bearing of 090 degrees. Elevation from A 36.87 degrees, from B 45 degrees; AB is 100 metres."

## Engine change requests
The space3d engine was not yet on `origin` when this spec was written, so these are **keys to reconcile with engine meta**:
- Params (setup `trig3d`): `scene`, `towerHeight`, `distA`, `bearingA`, `distB`, `bearingB`, `length`, `width`, `height`, `baseSide`, `showTriangles`, `showLabels`, `camera` (named `camera` rather than `projection` so it cannot be confused with vector projection).
- Outputs: `elevA`, `elevB`, `baseAngle`, `distAB`, `bearingAtoB`, `faceDiagonal`, `spaceDiagonal`, `diagonalAngle`, `slantHeight`, `faceAngle`, `slantEdge`, `edgeAngle` (NaN when not in the current scene).
- Optional, for the orchestrator (a shell feature, not needed for correctness): a way to hide readouts that are NaN for the current scene would tidy the readouts row.

## Acceptance
Every number below comes from the formula and hand calculation shown here. All are closed forms (tolerance 1e-9 for exact values, relative 1e-9 otherwise).

- **Check 1, default tower.** h = 60, distA = 80, distB = 60. elevA = tan⁻¹(60/80) = tan⁻¹(0.75) = **36.86989765°**; elevB = tan⁻¹(60/60) = **45°**. Bearings 180° and 090° differ by **90°**, so AB = √(80² + 60²) = √10 000 = **100 m**. In (east, north) coordinates A = (0, −80) and B = (60, 0), so A→B = (60, 80) and its bearing is tan⁻¹(60/80) = **36.86989765°** (about 037°).
- **Check 2, tower-obtuse.** h = 40, both distances 100. elevA = elevB = tan⁻¹(0.4) = **21.80140949°**. Base angle 150° − 30° = **120°**. AB² = 100² + 100² − 2(100)(100)cos 120° = 20 000 + 10 000 = 30 000, so AB = 100√3 = **173.2050808 m**. A = (100 sin 30°, 100 cos 30°) = (50, 86.60), B = (50, −86.60), so A→B points due south: bearing **180°**.
- **Check 3, tower-wrap.** h = 50, distA = 120 on 300°, distB = 90 on 040°. The bearings differ by 100° going through north (|300 − 40| = 260 > 180, so 360 − 260 = **100°**). elevA = tan⁻¹(50/120) = **22.61986495°**; elevB = tan⁻¹(50/90) = **29.0546041°**. AB² = 120² + 90² − 2(120)(90)cos 100° = 22 500 + 21 600 × 0.1736481777 = 22 500 + 3750.800638 = 26 250.80064, so AB = **162.0209883 m**. A = (120 sin 300°, 120 cos 300°) = (−103.9230485, 60), B = (90 sin 40°, 90 cos 40°) = (57.85088487, 68.94399988), so A→B = (161.7739334, 8.94399988) and its bearing is tan⁻¹(161.7739334/8.94399988) = **86.83550830°**.
- **Check 4, cuboid 4 × 3 × 12.** Base diagonal √(16 + 9) = **5 m**; space diagonal √(25 + 144) = **13 m**; angle to the base tan⁻¹(12/5) = **67.38013505°**.
- **Check 5, pyramid s = 6, h = 4.** Slant height √(4² + 3²) = **5 m**; face angle tan⁻¹(4/3) = **53.13010235°**. Half-diagonal s/√2 = 6/√2 = 3√2 = 4.242640687, so the slant edge is √(16 + 18) = √34 = **5.830951895 m** and the edge angle is tan⁻¹(4/4.242640687) = **43.31385666°**.
- **Check 6, other-scene outputs are blank.** In the pyramid scene the tower output elevA is NaN; the runner cannot compare NaN, so this is checked by eye in review (the readout shows —).

```acceptance
[
  { "name": "default tower: A due south, B due east",
    "params": { "scene": "tower", "towerHeight": 60, "distA": 80, "bearingA": 180, "distB": 60, "bearingB": 90 },
    "run": "static",
    "expect": {
      "elevA": { "value": 36.86989765, "relTol": 1e-9 },
      "elevB": { "value": 45, "absTol": 1e-9 },
      "baseAngle": { "value": 90, "absTol": 1e-9 },
      "distAB": { "value": 100, "absTol": 1e-9 },
      "bearingAtoB": { "value": 36.86989765, "relTol": 1e-9 } } },
  { "name": "obtuse base angle needs the cosine rule",
    "params": { "scene": "tower", "towerHeight": 40, "distA": 100, "bearingA": 30, "distB": 100, "bearingB": 150 },
    "run": "static",
    "expect": {
      "elevA": { "value": 21.80140949, "relTol": 1e-9 },
      "elevB": { "value": 21.80140949, "relTol": 1e-9 },
      "baseAngle": { "value": 120, "absTol": 1e-9 },
      "distAB": { "value": 173.2050808, "relTol": 1e-9 },
      "bearingAtoB": { "value": 180, "absTol": 1e-9 } } },
  { "name": "bearings that wrap through north",
    "params": { "scene": "tower", "towerHeight": 50, "distA": 120, "bearingA": 300, "distB": 90, "bearingB": 40 },
    "run": "static",
    "expect": {
      "baseAngle": { "value": 100, "absTol": 1e-9 },
      "elevA": { "value": 22.61986495, "relTol": 1e-9 },
      "elevB": { "value": 29.0546041, "relTol": 1e-9 },
      "distAB": { "value": 162.0209883, "relTol": 1e-9 },
      "bearingAtoB": { "value": 86.8355083, "relTol": 1e-9 } } },
  { "name": "cuboid 4 by 3 by 12",
    "params": { "scene": "cuboid", "length": 4, "width": 3, "height": 12 },
    "run": "static",
    "expect": {
      "faceDiagonal": { "value": 5, "absTol": 1e-9 },
      "spaceDiagonal": { "value": 13, "absTol": 1e-9 },
      "diagonalAngle": { "value": 67.38013505, "relTol": 1e-9 } } },
  { "name": "square pyramid s = 6, h = 4",
    "params": { "scene": "pyramid", "baseSide": 6, "height": 4 },
    "run": "static",
    "expect": {
      "slantHeight": { "value": 5, "absTol": 1e-9 },
      "faceAngle": { "value": 53.13010235, "relTol": 1e-9 },
      "slantEdge": { "value": 5.830951895, "relTol": 1e-9 },
      "edgeAngle": { "value": 43.31385666, "relTol": 1e-9 } } }
]
```
