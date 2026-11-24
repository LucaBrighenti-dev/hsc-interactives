---
id: eng-isometric-grid
title: "Isometric sketching grid"
subject: eng
engine: custom
setup: none
priority: P2
status: draft            # stub → draft → approved (Gate B)
page: /interactives/engineering/isometric-grid.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Engineering Studies","version":"2011","area":"Engineering fundamentals","subtopic":"Communication","year":11,"outcomes":["P3.3"],"url":"https://www.nsw.gov.au/education-and-training/nesa/curriculum/tas/engineering-studies-stage-6-2011","verified":true}
  - {"course":"Engineering Studies","version":"2026","focusArea":"Technical graphics and communication","subtopic":"Engineering graphics – pictorial representation","year":11,"outcomes":["ES-11-06"],"url":"https://curriculum.nsw.edu.au/learning-areas/tas/engineering-studies-11-12-2026/content/year-11/fa3a2669b1","verified":true}
---
# Isometric sketching grid

> Backlog summary: Isometric grid with snap for practice sketches.

## Learning goal
Students practise isometric pictorial sketching on a grid whose three axes sit at 30°, 30° and vertical, and learn the rules that make it work: lines parallel to the axes (isometric lines) are drawn at their true length (or at 0.816 of it in a true isometric projection), lines that are not parallel to an axis are foreshortened or stretched and must be found by joining points, and circles on any face become ellipses with known axes.

Syllabus fit: 2011 Engineering Fundamentals (pictorial drawing: isometric); 2026 Technical graphics and communication, Year 11. Pitched at Stage 6: isometric drawing to AS 1100 conventions, isometric scale against true scale, isometric circles; freehand sketching practice.

## What the student sees
Default view at 1920×1080, light projector theme:

- **Most of the stage, the sketching grid:** an isometric grid (lines or dots) with the three axis directions marked at the origin and labelled (x at 30° above the horizontal to the right, y at 30° above the horizontal to the left, z vertical).
- **Drawing on a face plane:** a point on isometric paper does not fix a 3D point ((x, y, z) and (x + t, y + t, z − t) land on the same spot), so pointer drawing always happens on one face plane, chosen with **Draw on**: the top plane (z = level), the left plane (x = level) or the right plane (y = level), with **Plane level** setting which one. The chosen plane's grid is drawn darker. Clicks or taps snap to that plane's grid nodes, so every line end has known 3D grid coordinates, and a cursor readout shows them, for example "(3, 0, 2)". To draw an edge that leaves the plane (a vertical edge from the top plane, say), switch planes, use the keyboard cursor, or type the line.
- **Lines:** every stored line has 3D ends, so its true length is defined. Lines parallel to an axis are drawn solid; any other line is drawn solid but tagged "non-isometric" with its drawn length beside its true length, so the difference is visible. A line of zero length is ignored.
- **Exercise panel (optional):** the three orthogonal views of a simple part (the same parts as the orthogonal projection trainer) for students to sketch in isometric; a reveal button overlays the correct isometric outline in a dashed line. Exercises set the grid step to 10 mm, because the parts' dimensions are multiples of 10 mm.
- **Circle guide:** when on, the true isometric ellipse for a circle of the chosen diameter on the chosen face (top, left or right), drawn solid and dimensioned with its true major and minor axes. With **Show four-centre arcs** on, the four-centre construction (the method students use by hand) is overlaid as dashed arcs labelled "four-centre approximation", with its own, slightly different, axes shown in text.
- **Toolbar:** undo, clear, and a toggle between isometric drawing and isometric projection (which rescales the drawing by 0.816).

Static custom page: play, step and reset are hidden. The drawing is stored in the `drawing` text, so the URL shares the sketch.

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| scaleMode | Scale | | | | | drawing | enum: `drawing` (isometric drawing: true lengths along the axes), `projection` (isometric projection: × 0.816) |
| gridSpacing | Grid step (true length) | mm | 5 | 20 | 1 | 10 | the true length of one grid step |
| drawPlane | Draw on | | | | | top | enum: `top` (z = level), `left` (x = level), `right` (y = level) |
| planeLevel | Plane level | | −30 | 30 | 1 | 0 | integer, in grid steps |
| gridStyle | Grid | | | | | lines | enum: `lines`, `dots` |
| drawing | Sketch | | | | | (empty) | string, max 2000 characters: lines as `x,y,z x,y,z` in grid steps (integers −30 to 30), separated by `;` |
| exercise | Exercise | | | | | free | enum: `free`, `stepBlock`, `slottedBlock`, `chamferBlock`, `holeBlock` |
| circleGuide | Show circle guide | | | | | off | boolean |
| circleDiameter | Circle diameter | mm | 10 | 100 | 5 | 40 | |
| circleFace | Circle on face | | | | | top | enum: `top`, `left`, `right` |
| showFourCentre | Show four-centre arcs | | | | | off | boolean; visible when the circle guide is on |

There is no "snap off" mode: line ends are always grid nodes, which is what the `drawing` text stores.

## Model (custom engine `site/assets/engines/custom/eng-isometric-grid/`)
Pure functions in `model.js`:

- Grid point (x, y, z) in grid steps maps to the paper at (X, Y) = s × ((x − y) cos 30°, (x + y) sin 30° + z), where s = gridSpacing × k, and k = 1 for an isometric drawing or √(2/3) = 0.816497 for an isometric projection.
- Pointer to grid node: divide (X, Y) by s, then solve on the chosen plane and round the two free coordinates to the nearest integers. Top plane (z = L): x − y = X/cos 30°, x + y = 2(Y − L). Left plane (x = L): y = L − X/cos 30°, z = Y − (L + y)/2. Right plane (y = L): x = L + X/cos 30°, z = Y − (x + L)/2. Each gives exactly one 3D point.
- A line from P₁ to P₂ with Δ = (Δx, Δy, Δz) ≠ 0: true length = gridSpacing × √(Δx² + Δy² + Δz²); drawn length = s × √(((Δx − Δy) cos 30°)² + ((Δx + Δy) sin 30° + Δz)²). Zero-length lines are ignored (not stored, not counted).
- A line is isometric when exactly one of Δx, Δy, Δz is non-zero; then its drawn length is k × its true length.
- True isometric ellipse for a circle of diameter D on any face: in a projection, major axis D and minor axis D/√3; in a drawing (scaled by 1/0.816497), major D√(3/2) = 1.2247D and minor D/√2 = 0.7071D. This is the curve drawn and dimensioned.
- Four-centre approximation (overlay only): in a drawing it gives major 2D/√3 = 1.1547D and minor (√3 − 1)D = 0.7321D (large arcs of radius (√3/2)D from the rhombus's obtuse corners, small arcs of radius D/(2√3)); in a projection both are × 0.816497.
- The ellipse readouts show "—" when the circle guide is off.
- The `drawing` text is parsed without `eval`; a malformed entry gives a calm message and is ignored, never NaN.

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | drawing scale, 10 mm grid, lines, draw on the top plane at level 0, empty sketch | free sketching |
| corner | default with the sketch `0,0,0 4,0,0;0,0,0 0,3,0;0,0,0 0,0,2` | three edges of a box from one corner |
| diagonal | default with the sketch `0,0,0 2,2,0` | a top-face diagonal: on paper it is the same segment as a 20 mm vertical edge `0,0,0 0,0,2`, which is why an isometric sketch needs context |
| step-block | exercise = stepBlock | sketch the step block from its three views |
| circles | circle guide on, four-centre arcs on, D = 40 mm, top face | the true ellipse against the four-centre approximation for a 40 mm hole |

g is not used on this page.

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| lineCount | Lines drawn | | integer |
| nonIsometricLines | Non-isometric lines | | integer |
| trueLength | Total true length of the lines | mm | 4 |
| drawnLength | Total length on the paper | mm | 4 |
| scaleFactor | Scale along the axes | | 4 |
| ellipseMajor | Ellipse major axis | mm | 4 |
| ellipseMinor | Ellipse minor axis | mm | 4 |
| fourCentreMajor | Four-centre approximation: major axis | mm | 4 |
| fourCentreMinor | Four-centre approximation: minor axis | mm | 4 |

## Assumptions shown on stage
- Two axes at 30° above the horizontal, the third vertical
- Isometric drawing uses true lengths along the axes; isometric projection scales them by √(2/3) = 0.816
- Hidden edges are normally left out of isometric sketches
- Pointer drawing happens on one face plane at a time; the ellipse drawn is the true ellipse, and the four-centre arcs are an approximation

## Try this (3–5 predict, observe, explain prompts)
1. Predict: draw a line 3 steps along x, then one 3 steps along x and 4 up. Which is drawn at its true length? Compare the readouts.
2. Observe: in **diagonal**, the 2 × 2 square's diagonal is drawn vertical. Is it shorter or longer on paper than its true length?
3. Predict, then observe: switch to isometric projection. By what factor does every axis line shrink, and does the shape change?
4. Explain: why must the ends of a sloping (non-isometric) edge be located by measuring along the axes, not by measuring the slope itself?
5. Observe: with the circle guide, how do the ellipse's axes compare with the circle's diameter in an isometric drawing?

## Teacher notes outline
- Misconceptions to target: every line in an isometric drawing is true length (only lines parallel to the axes); isometric drawing and isometric projection are the same (projection is 0.816 of drawing size); a circle on an isometric face is drawn as a circle (it is an ellipse); the 30° lines are measured at 30° to the vertical (they are at 30° to the horizontal).
- 10-minute lesson flow: (1) draw a box from its overall sizes along the three axes; (2) add a sloping face by locating its ends along axes; (3) compare true and drawn lengths of the slope; (4) isometric circles with the four-centre method, compared with the true ellipse (about 6% short on the major axis); (5) sketch the step block from its three views and reveal the answer.
- Original HSC-style question idea: a block 60 × 40 × 30 mm has a 20 mm diameter vertical hole through its centre. Sketch it in isometric drawing at full size and state the lengths of the major and minor axes of the hole's ellipse on the top face; then state how long the block's 60 mm edge would be in an isometric projection. Worked solution: major = 20 × √1.5 = 24.5 mm, minor = 20/√2 = 14.1 mm; in projection the 60 mm edge is 60 × 0.816 = 49.0 mm.

## Accessibility notes
Non-isometric lines carry a text tag as well as their length labels; the axes are labelled x, y and z in text; the ellipse's axes are dimension lines with values. Drawing works with a mouse, a finger or a pen on the chosen face plane; for keyboard use, arrow keys move a grid cursor in full 3D along the three axes (left/right for x, Shift+left/right for y, up/down for z) and Enter starts or ends a line; the sketch can also be typed into the `drawing` text box. The cursor readout gives the 3D coordinates in text. Stage label: "Isometric grid with … lines drawn, total true length … millimetres; … non-isometric lines."

## Engine change requests
None for shared engines. This page builds its own custom engine (`site/assets/engines/custom/eng-isometric-grid/`, with `tests/engines/custom-eng-isometric-grid.test.mjs`) to the model above, with every key above in its `meta.params`, every readout in its `meta.outputs`, and the page as a static setup. The exercise parts should reuse the orthogonal projection trainer's part dimensions (step block 60 × 30 × 40 and so on).

## Acceptance
Every number below comes from the formula and hand calculation shown here. cos 30° = 0.866025, sin 30° = 0.5; grid step 10 mm.

- **Check 1, an axis line.** `0,0,0 3,0,0`: Δ = (3, 0, 0). True length = 10 × 3 = **30 mm**. Drawn = 10 × √((3 × 0.866025)² + (3 × 0.5)²) = 10 × √(6.75 + 2.25) = 10 × 3 = **30 mm** (true length). Non-isometric lines: **0**.
- **Check 2, a sloping line.** `0,0,0 3,0,4`: Δ = (3, 0, 4). True length = 10 × √(9 + 16) = **50 mm**. Drawn = 10 × √(6.75 + (1.5 + 4)²) = 10 × √(6.75 + 30.25) = 10√37 = **60.828 mm**, longer than true. Non-isometric lines: **1**.
- **Check 3, isometric projection.** The axis line in check 1 is drawn 30 × 0.816497 = **24.495 mm**; scale factor **0.816497**; its true length is still **30 mm**.
- **Check 4, a box corner.** Three lines of 4, 3 and 2 steps along x, y and z: **3** lines, all isometric, true and drawn totals both 10 × (4 + 3 + 2) = **90 mm**.
- **Check 5, a top-face diagonal.** `0,0,0 2,2,0`: true length 10 × √8 = **28.284 mm**; drawn = 10 × √(0² + (1 + 1)²) = **20 mm** (vertical, shorter than true).
- **Check 6, isometric ellipses.** D = 40 mm. True ellipse, drawing: major 40 × √1.5 = **48.990 mm**, minor 40/√2 = **28.284 mm**; projection: major **40 mm**, minor 40/√3 = **23.094 mm**. Four-centre approximation, drawing: the rhombus of side 40 has its obtuse corners 20 mm above and below the centre and its acute corners 34.641 mm either side; the small arcs are centred 40/(2√3) = 11.547 mm from the centre with radius 11.547 mm, so the major axis is 2 × 23.094 = **46.188 mm**; the large arcs have radius 40 × √3/2 = 34.641 mm from the far corner, reaching 34.641 − 20 = 14.641 mm past the centre, so the minor axis is **29.282 mm**. Projection: both × 0.816497, **37.712 mm** and **23.909 mm**.
- **Question idea check.** 20 × √1.5 = 24.495 mm; 20/√2 = 14.142 mm; 60 × 0.816497 = 48.990 mm.

```acceptance
[
  { "name": "axis line: true length on paper", "params": { "scaleMode": "drawing", "gridSpacing": 10, "drawing": "0,0,0 3,0,0" }, "run": "static",
    "expect": { "lineCount": { "value": 1, "absTol": 1e-12 }, "trueLength": { "value": 30, "relTol": 1e-12 }, "drawnLength": { "value": 30, "relTol": 1e-12 }, "nonIsometricLines": { "value": 0, "absTol": 1e-12 }, "scaleFactor": { "value": 1, "absTol": 1e-12 } } },
  { "name": "sloping line is not true length", "params": { "scaleMode": "drawing", "gridSpacing": 10, "drawing": "0,0,0 3,0,4" }, "run": "static",
    "expect": { "trueLength": { "value": 50, "relTol": 1e-12 }, "drawnLength": { "value": 60.8276253, "relTol": 1e-9 }, "nonIsometricLines": { "value": 1, "absTol": 1e-12 } } },
  { "name": "isometric projection scales the axes by 0.816", "params": { "scaleMode": "projection", "gridSpacing": 10, "drawing": "0,0,0 3,0,0" }, "run": "static",
    "expect": { "drawnLength": { "value": 24.49489743, "relTol": 1e-9 }, "scaleFactor": { "value": 0.8164965809, "relTol": 1e-9 }, "trueLength": { "value": 30, "relTol": 1e-12 } } },
  { "name": "box corner: three isometric lines", "params": { "scaleMode": "drawing", "gridSpacing": 10, "drawing": "0,0,0 4,0,0;0,0,0 0,3,0;0,0,0 0,0,2" }, "run": "static",
    "expect": { "lineCount": { "value": 3, "absTol": 1e-12 }, "trueLength": { "value": 90, "relTol": 1e-12 }, "drawnLength": { "value": 90, "relTol": 1e-12 }, "nonIsometricLines": { "value": 0, "absTol": 1e-12 } } },
  { "name": "top-face diagonal looks vertical and short", "params": { "scaleMode": "drawing", "gridSpacing": 10, "drawing": "0,0,0 2,2,0" }, "run": "static",
    "expect": { "trueLength": { "value": 28.28427125, "relTol": 1e-9 }, "drawnLength": { "value": 20, "relTol": 1e-12 } } },
  { "name": "isometric ellipse, drawing scale", "params": { "scaleMode": "drawing", "circleGuide": true, "circleDiameter": 40 }, "run": "static",
    "expect": { "ellipseMajor": { "value": 48.98979486, "relTol": 1e-9 }, "ellipseMinor": { "value": 28.28427125, "relTol": 1e-9 }, "fourCentreMajor": { "value": 46.18802154, "relTol": 1e-9 }, "fourCentreMinor": { "value": 29.2820323, "relTol": 1e-9 } } },
  { "name": "isometric ellipse, projection scale", "params": { "scaleMode": "projection", "circleGuide": true, "circleDiameter": 40 }, "run": "static",
    "expect": { "ellipseMajor": { "value": 40, "relTol": 1e-12 }, "ellipseMinor": { "value": 23.09401077, "relTol": 1e-9 }, "fourCentreMajor": { "value": 37.71236166, "relTol": 1e-9 }, "fourCentreMinor": { "value": 23.90867926, "relTol": 1e-9 } } }
]
```
