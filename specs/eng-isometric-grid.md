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

- **Most of the stage, the sketching grid:** an isometric grid (lines or dots) with the three axis directions marked at the origin (x at 30° to the right, y at 30° to the left, z vertical, each labelled). The student clicks or taps grid points to draw straight lines; with **Snap** on, each end snaps to the nearest grid point. Lines parallel to an axis are drawn solid; any other line is drawn solid but tagged "non-isometric" with its drawn length beside its true length, so the difference is visible. A cursor readout shows the 3D grid coordinates (x, y, z) of the point under the pointer.
- **Exercise panel (optional):** the three orthogonal views of a simple part (the same parts as the orthogonal projection trainer) for students to sketch in isometric; a reveal button overlays the correct isometric outline in a dashed line.
- **Circle guide:** when on, an isometric ellipse for a circle of the chosen diameter on the chosen face (top, left or right), with its four-centre construction lines and its major and minor axes dimensioned.
- **Toolbar:** undo, clear, and a toggle between isometric drawing and isometric projection (which rescales the drawing by 0.816).

Static custom page: play, step and reset are hidden. The drawing is stored in the `drawing` text, so the URL shares the sketch.

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| scaleMode | Scale | | | | | drawing | enum: `drawing` (isometric drawing: true lengths along the axes), `projection` (isometric projection: × 0.816) |
| gridSpacing | Grid step (true length) | mm | 5 | 20 | 1 | 10 | the true length of one grid step |
| snap | Snap to grid | | | | | on | boolean |
| gridStyle | Grid | | | | | lines | enum: `lines`, `dots` |
| drawing | Sketch | | | | | (empty) | string, max 2000 characters: lines as `x,y,z x,y,z` in grid steps (integers −30 to 30), separated by `;` |
| exercise | Exercise | | | | | free | enum: `free`, `stepBlock`, `slottedBlock`, `chamferBlock`, `holeBlock` |
| circleGuide | Show circle guide | | | | | off | boolean |
| circleDiameter | Circle diameter | mm | 10 | 100 | 5 | 40 | |
| circleFace | Circle on face | | | | | top | enum: `top`, `left`, `right` |

## Model (custom engine `site/assets/engines/custom/eng-isometric-grid/`)
Pure functions in `model.js`:

- Grid point (x, y, z) in grid steps maps to the paper at (X, Y) = s × ((x − y) cos 30°, (x + y) sin 30° + z), where s = gridSpacing × k, and k = 1 for an isometric drawing or √(2/3) = 0.816497 for an isometric projection.
- A line from P₁ to P₂ with Δ = (Δx, Δy, Δz): true length = gridSpacing × √(Δx² + Δy² + Δz²); drawn length = s × √(((Δx − Δy) cos 30°)² + ((Δx + Δy) sin 30° + Δz)²).
- A line is isometric when exactly one of Δx, Δy, Δz is non-zero; then its drawn length is k × its true length.
- Isometric ellipse for a circle of diameter D on any face: in a projection, major axis D and minor axis D/√3; in a drawing (scaled by 1/0.816497), major D√(3/2) and minor D/√2.
- The `drawing` text is parsed without `eval`; a malformed entry gives a calm message and is ignored, never NaN.

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | drawing scale, 10 mm grid, lines, snap on, empty sketch | free sketching |
| corner | default with the sketch `0,0,0 4,0,0;0,0,0 0,3,0;0,0,0 0,0,2` | three edges of a box from one corner |
| diagonal | default with the sketch `0,0,0 2,2,0` | a top-face diagonal looks vertical and short |
| step-block | exercise = stepBlock | sketch the step block from its three views |
| circles | circle guide on, D = 40 mm, top face | ellipse axes for a 40 mm hole |

g is not used on this page.

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| lineCount | Lines drawn | | exact |
| nonIsometricLines | Non-isometric lines | | exact |
| trueLength | Total true length of the lines | mm | 4 |
| drawnLength | Total length on the paper | mm | 4 |
| scaleFactor | Scale along the axes | | 4 |
| ellipseMajor | Ellipse major axis | mm | 4 |
| ellipseMinor | Ellipse minor axis | mm | 4 |

## Assumptions shown on stage
- Isometric axes at 30° to the horizontal and vertical
- Isometric drawing uses true lengths along the axes; isometric projection scales them by √(2/3) = 0.816
- Hidden edges are normally left out of isometric sketches

## Try this (3–5 predict, observe, explain prompts)
1. Predict: draw a line 3 steps along x, then one 3 steps along x and 4 up. Which is drawn at its true length? Compare the readouts.
2. Observe: in **diagonal**, the 2 × 2 square's diagonal is drawn vertical. Is it shorter or longer on paper than its true length?
3. Predict, then observe: switch to isometric projection. By what factor does every axis line shrink, and does the shape change?
4. Explain: why must the ends of a sloping (non-isometric) edge be located by measuring along the axes, not by measuring the slope itself?
5. Observe: with the circle guide, how do the ellipse's axes compare with the circle's diameter in an isometric drawing?

## Teacher notes outline
- Misconceptions to target: every line in an isometric drawing is true length (only lines parallel to the axes); isometric drawing and isometric projection are the same (projection is 0.816 of drawing size); a circle on an isometric face is drawn as a circle (it is an ellipse); the 30° lines are measured at 30° to the vertical (they are at 30° to the horizontal).
- 10-minute lesson flow: (1) draw a box from its overall sizes along the three axes; (2) add a sloping face by locating its ends along axes; (3) compare true and drawn lengths of the slope; (4) isometric circles with the four-centre method; (5) sketch the step block from its three views and reveal the answer.
- Original HSC-style question idea: a block 60 × 40 × 30 mm has a 20 mm diameter vertical hole through its centre. Sketch it in isometric drawing at full size and state the lengths of the major and minor axes of the hole's ellipse on the top face; then state how long the block's 60 mm edge would be in an isometric projection. Worked solution: major = 20 × √1.5 = 24.5 mm, minor = 20/√2 = 14.1 mm; in projection the 60 mm edge is 60 × 0.816 = 49.0 mm.

## Accessibility notes
Non-isometric lines carry a text tag as well as their length labels; the axes are labelled x, y and z in text; the ellipse's axes are dimension lines with values. Drawing works with a mouse, a finger or a pen; for keyboard use, arrow keys move a grid cursor along the three axes (left/right for x, Shift+left/right for y, up/down for z) and Enter starts or ends a line; the sketch can also be typed into the `drawing` text box. Stage label: "Isometric grid with … lines drawn, total true length … millimetres; … non-isometric lines."

## Engine change requests
None for shared engines. This page builds its own custom engine (`site/assets/engines/custom/eng-isometric-grid/`, with `tests/engines/custom-eng-isometric-grid.test.mjs`) to the model above, with every key above in its `meta.params`, every readout in its `meta.outputs`, and the page as a static setup. The exercise parts should reuse the orthogonal projection trainer's part dimensions (step block 60 × 30 × 40 and so on).

## Acceptance
Every number below comes from the formula and hand calculation shown here. cos 30° = 0.866025, sin 30° = 0.5; grid step 10 mm.

- **Check 1, an axis line.** `0,0,0 3,0,0`: Δ = (3, 0, 0). True length = 10 × 3 = **30 mm**. Drawn = 10 × √((3 × 0.866025)² + (3 × 0.5)²) = 10 × √(6.75 + 2.25) = 10 × 3 = **30 mm** (true length). Non-isometric lines: **0**.
- **Check 2, a sloping line.** `0,0,0 3,0,4`: Δ = (3, 0, 4). True length = 10 × √(9 + 16) = **50 mm**. Drawn = 10 × √(6.75 + (1.5 + 4)²) = 10 × √(6.75 + 30.25) = 10√37 = **60.828 mm**, longer than true. Non-isometric lines: **1**.
- **Check 3, isometric projection.** The axis line in check 1 is drawn 30 × 0.816497 = **24.495 mm**; scale factor **0.816497**; its true length is still **30 mm**.
- **Check 4, a box corner.** Three lines of 4, 3 and 2 steps along x, y and z: **3** lines, all isometric, true and drawn totals both 10 × (4 + 3 + 2) = **90 mm**.
- **Check 5, a top-face diagonal.** `0,0,0 2,2,0`: true length 10 × √8 = **28.284 mm**; drawn = 10 × √(0² + (1 + 1)²) = **20 mm** (vertical, shorter than true).
- **Check 6, isometric ellipses.** D = 40 mm. Drawing: major 40 × √1.5 = **48.990 mm**, minor 40/√2 = **28.284 mm**. Projection: major **40 mm**, minor 40/√3 = **23.094 mm**.
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
    "expect": { "ellipseMajor": { "value": 48.98979486, "relTol": 1e-9 }, "ellipseMinor": { "value": 28.28427125, "relTol": 1e-9 } } },
  { "name": "isometric ellipse, projection scale", "params": { "scaleMode": "projection", "circleGuide": true, "circleDiameter": 40 }, "run": "static",
    "expect": { "ellipseMajor": { "value": 40, "relTol": 1e-12 }, "ellipseMinor": { "value": 23.09401077, "relTol": 1e-9 } } }
]
```
