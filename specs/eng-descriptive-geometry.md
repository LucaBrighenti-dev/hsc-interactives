---
id: eng-descriptive-geometry
title: "Descriptive geometry"
subject: eng
engine: space3d
setup: descriptive
priority: P2
status: draft            # stub → draft → approved (Gate B)
page: /interactives/engineering/descriptive-geometry.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Engineering Studies","version":"2011","area":"Aeronautical engineering","subtopic":"Communication","year":12,"outcomes":["H3.3"],"url":"https://www.nsw.gov.au/education-and-training/nesa/curriculum/tas/engineering-studies-stage-6-2011","verified":true}
  - {"course":"Engineering Studies","version":"2026","focusArea":"Aeronautical and aerospace engineering","subtopic":"Descriptive geometry","year":12,"outcomes":["ES-12-06"],"url":"https://curriculum.nsw.edu.au/learning-areas/tas/engineering-studies-11-12-2026/content/year-12/fa66e557c0","verified":true}
---
# Descriptive geometry

> Backlog summary: True length and true shape by auxiliary views; transition-piece developments.

## Learning goal
Students find the true length of an oblique line and the true shape of an inclined face using an auxiliary view: a view projected onto a plane parallel to the line (or face), built from the principal views by transferring distances across fold lines. They see that a line is foreshortened in any view not parallel to it, and that its true angle to the horizontal plane appears only in the auxiliary view, unless the line happens to be parallel to the frontal plane (then the front view shows it). This is the drawing skill behind developing sheet-metal parts such as aircraft ducts and transition pieces.

Syllabus fit: 2011 Aeronautical Engineering (descriptive geometry: true length, true shape, auxiliary views, developments); 2026 Aeronautical and aerospace engineering, Year 12, descriptive geometry. Pitched at Stage 6: first auxiliary views from third-angle principal views; developments introduced through true lengths.

## What the student sees
Default view at 1920×1080, light projector theme:

- **Left half, 3D view:** a transparent box with labelled axes (x width, y depth, z height), the line AB (or the chamfered block and its sloping face) drawn solid, and its projections onto the top and front planes drawn as thin dashed lines. The student orbits the scene; **View from** snaps to top, front or side.
- **Right half, drawing sheet (third-angle):** the top view above the H/F fold line and the front view below it, with projectors. For a line, an auxiliary fold line H/1 is drawn parallel to the top view of AB, projectors run perpendicular to it, and each point's height is transferred from the front view (shown with matching tick marks and the distance labelled), giving A₁B₁ in **true length** with its true angle to the horizontal plane marked. For the face, the front view shows the sloping face edge-on; an auxiliary view projected from it, with depths transferred from the top view, shows the face's **true shape** (hatched).
- **Readouts** for the apparent and true lengths, the angles and the areas.

Static setup: play, step and reset are hidden. Moving A or B (or the chamfer sliders) redraws the construction at once.

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| feature | Find | | | | | line | enum: `line` (true length of a line), `face` (true shape of a sloping face) |
| pointA | Point A (x, y, z) | mm | 0 | 100 | | [10, 10, 10] | list of three numbers; line only |
| pointB | Point B (x, y, z) | mm | 0 | 100 | | [70, 30, 40] | list of three numbers; line only |
| chamferRun | Chamfer run (x) | mm | 5 | 55 | 1 | 30 | face only; on a 60 × 30 × 40 mm block |
| chamferDrop | Chamfer drop (z) | mm | 5 | 35 | 1 | 20 | face only |
| showProjectors | Show projectors | | | | | on | boolean |
| showLabels | Labels | | | | | on | boolean |
| camera | Camera | | | | | perspective | enum: `perspective`, `orthographic` |
| viewFrom | View from | | | | | iso | enum: `iso` (3D), `top`, `front`, `side` |

These keys match the space3d engine's in-progress `meta` and model (`descriptiveLine`, `descriptiveFace`; read on 25 November 2026, not yet pushed), so they are listed under "Engine change requests" to confirm at merge.

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | line, A (10, 10, 10), B (70, 30, 40) | Δ = (60, 20, 30): a whole-number true length of 70 mm |
| steep-line | line, A (10, 10, 10), B (46, 58, 55) | Δ = (36, 48, 45): true length 75 mm, every view foreshortened |
| face | face, run 30 mm, drop 20 mm | true shape of a chamfer |
| face-345 | face, run 40 mm, drop 30 mm | a 3-4-5 slope: true width 50 mm |

g is not used on this page.

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| trueLength | True length (auxiliary view) | mm | 4 |
| planLength | Length in the top view (face: the chamfer's run, its slope seen from above) | mm | 4 |
| frontLength | Length in the front view (face: the face seen edge-on, which is its true width) | mm | 4 |
| angleHP | True angle to the horizontal plane | ° | 4 |
| angleVP | True angle to the frontal plane | ° | 4 |
| trueArea | True area of the face | mm² | 4 |
| planArea | Area of the face in the top view | mm² | 4 |

For a line the area readouts show "—"; for the face `angleVP` shows "—".

## Assumptions shown on stage
- Third-angle projection; dimensions in millimetres
- Auxiliary views by transferring distances from the reference (fold) lines
- The face is a flat chamfer through the full 30 mm depth of the block

## Try this (3–5 predict, observe, explain prompts)
1. Predict: in the default preset, will AB look longer in the top view or the front view? Observe, then explain using Δx, Δy and Δz.
2. Observe: drag B straight up (increase z only). Which view's length changes, and which stays the same?
3. Predict, then observe: when does the top view show AB in true length?
4. Explain: why must the auxiliary fold line be parallel to the top view of AB for the auxiliary view to show the true length?
5. Observe: in the **face** preset, the top view shows the face as 30 × 30 mm. Why does the true shape come out larger?

## Teacher notes outline
- Misconceptions to target: a line's length in any principal view is its true length; the angle a line makes in the front view is its true angle to the horizontal plane (only when it is parallel to the frontal plane); auxiliary views are drawn by eye (distances must be transferred exactly).
- 10-minute lesson flow: (1) the default line: lengths in each view from Pythagoras; (2) build the auxiliary view step by step, transferring heights; (3) compare with √(Δx² + Δy² + Δz²); (4) the face: edge view, then true shape; (5) extension: why true lengths are what a sheet-metal worker needs to develop a transition piece.
- Original HSC-style question idea: a hydraulic pipe in an aircraft wheel well runs from A (20, 10, 15) to B (80, 90, 90) mm. Find its length in the top and front views, its true length, and its true angle to the horizontal plane; then construct the auxiliary view that shows it in true length. Worked solution: Δ = (60, 80, 75); top view √(60² + 80²) = 100 mm; front view √(60² + 75²) = 96.05 mm; true length √(60² + 80² + 75²) = 125 mm; angle to HP = sin⁻¹(75/125) = 36.9°.

## Accessibility notes
The true-length line and true shape are drawn thicker than the construction and labelled "TRUE LENGTH" or "TRUE SHAPE" in text; projectors are thin and light; transferred distances carry matching tick marks and labels. The 3D scene can be turned with arrow keys and reset with Home; point coordinates can be typed. Stage label: "Line from A (…) to B (…) millimetres. Top view … millimetres, front view …, true length … millimetres at … degrees to the horizontal plane."

## Engine change requests
- Confirm at merge: every param and output used here is in the space3d engine's in-progress `meta` for `descriptive` (read from the engine builder's working copy on 25 November 2026; not yet pushed): params `feature`, `pointA`, `pointB`, `chamferRun`, `chamferDrop`, `showProjectors`, `showLabels`, `camera`, `viewFrom`; outputs `trueLength`, `planLength`, `frontLength`, `angleHP`, `angleVP`, `trueArea`, `planArea`.
- **Summary change (the card must not promise what the page lacks):** the backlog and catalog summary says "True length and true shape by auxiliary views; transition-piece developments", but this page does not build developments yet. Until it does, the summary should read "True length and true shape by auxiliary views." The page task owns the catalog fragment's summary and should make that change; `docs/backlog.json` needs the same edit from the lead or orchestrator, so `npm run generate -- --check` stays in step.
- Optional, for a later engine version (to restore the summary's promise): a square-to-round transition piece developed by triangulation. Worked numbers for a 100 mm square base, Ø60 top and 80 mm height with 12 divisions of the circle: corner triangulation lines 96.437 mm (to the circle points in line with the square's sides) and 90.564 mm (to the points 30° from them); seam line √(20² + 80²) = 82.462 mm; each developed top segment is a chord 2 × 30 × sin 15° = 15.529 mm, so the 12 chords total 186.35 mm against the true circumference π × 60 = 188.50 mm (1.14% short, which is why more divisions give a better pattern).

## Acceptance
Every number below comes from the formula and hand calculation shown here. For a line with Δ = B − A = (Δx, Δy, Δz): top view length √(Δx² + Δy²); front view length √(Δx² + Δz²); true length √(Δx² + Δy² + Δz²); true angle to the horizontal plane sin⁻¹(|Δz|/TL); to the frontal plane sin⁻¹(|Δy|/TL). For the chamfer on a block 30 mm deep, with run r and drop d: the face is a rectangle 30 mm by √(r² + d²), so its true area is 30√(r² + d²), its top-view area is 30r, and its slope is tan⁻¹(d/r).

- **Check 1, default line.** Δ = (60, 20, 30). Top view √(3600 + 400) = √4000 = **63.246 mm**. Front view √(3600 + 900) = √4500 = **67.082 mm**. True length √(3600 + 400 + 900) = √4900 = **70 mm**. Angle to HP = sin⁻¹(30/70) = **25.377°**; to VP = sin⁻¹(20/70) = **16.602°**.
- **Check 2, steep line.** Δ = (36, 48, 45). Top view √(1296 + 2304) = **60 mm**. Front view √(1296 + 2025) = √3321 = **57.628 mm**. True length √(1296 + 2304 + 2025) = √5625 = **75 mm**. Angle to HP = sin⁻¹(45/75) = **36.870°**; to VP = sin⁻¹(48/75) = **39.792°**.
- **Check 3, default face.** r = 30, d = 20: slope length √(900 + 400) = √1300 = **36.056 mm** (the face's edge in the front view, and its true width). True area = 30 × 36.056 = **1081.67 mm²**; top-view area = 30 × 30 = **900 mm²**; slope tan⁻¹(20/30) = **33.690°**.
- **Check 4, 3-4-5 face.** r = 40, d = 30: true width **50 mm**, true area 30 × 50 = **1500 mm²**, top-view area 30 × 40 = **1200 mm²**, slope tan⁻¹(30/40) = **36.870°**.
- **Check 5, question idea.** Δ = (60, 80, 75): top √(3600 + 6400) = **100 mm**, front √(3600 + 5625) = √9225 = **96.047 mm**, true √(3600 + 6400 + 5625) = √15 625 = **125 mm**, angle to HP sin⁻¹(75/125) = **36.870°**.

```acceptance
[
  { "name": "default line: lengths in each view and true length", "params": { "feature": "line", "pointA": [10, 10, 10], "pointB": [70, 30, 40] }, "run": "static",
    "expect": { "planLength": { "value": 63.2455532, "relTol": 1e-8 }, "frontLength": { "value": 67.0820393, "relTol": 1e-8 }, "trueLength": { "value": 70, "relTol": 1e-9 }, "angleHP": { "value": 25.37693353, "absTol": 1e-6 }, "angleVP": { "value": 16.6015496, "absTol": 1e-6 } } },
  { "name": "steep line: true length 75 mm", "params": { "feature": "line", "pointA": [10, 10, 10], "pointB": [46, 58, 55] }, "run": "static",
    "expect": { "planLength": { "value": 60, "relTol": 1e-9 }, "frontLength": { "value": 57.62811814, "relTol": 1e-8 }, "trueLength": { "value": 75, "relTol": 1e-9 }, "angleHP": { "value": 36.86989765, "absTol": 1e-6 }, "angleVP": { "value": 39.7918195, "absTol": 1e-6 } } },
  { "name": "default chamfer face: true shape", "params": { "feature": "face", "chamferRun": 30, "chamferDrop": 20 }, "run": "static",
    "expect": { "trueLength": { "value": 36.05551275, "relTol": 1e-8 }, "trueArea": { "value": 1081.665383, "relTol": 1e-8 }, "planArea": { "value": 900, "relTol": 1e-9 }, "angleHP": { "value": 33.69006753, "absTol": 1e-6 } } },
  { "name": "3-4-5 chamfer face", "params": { "feature": "face", "chamferRun": 40, "chamferDrop": 30 }, "run": "static",
    "expect": { "trueLength": { "value": 50, "relTol": 1e-9 }, "trueArea": { "value": 1500, "relTol": 1e-9 }, "planArea": { "value": 1200, "relTol": 1e-9 }, "angleHP": { "value": 36.86989765, "absTol": 1e-6 } } },
  { "name": "question idea: pipe from (20, 10, 15) to (80, 90, 90)", "params": { "feature": "line", "pointA": [20, 10, 15], "pointB": [80, 90, 90] }, "run": "static",
    "expect": { "planLength": { "value": 100, "relTol": 1e-9 }, "frontLength": { "value": 96.04686356, "relTol": 1e-8 }, "trueLength": { "value": 125, "relTol": 1e-9 }, "angleHP": { "value": 36.86989765, "absTol": 1e-6 } } }
]
```
