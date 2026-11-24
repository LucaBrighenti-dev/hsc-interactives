---
id: eng-orthographic-trainer
title: "Orthogonal projection trainer"
subject: eng
engine: space3d
setup: orthographic
priority: P1
status: draft            # stub → draft → approved (Gate B)
page: /interactives/engineering/orthographic-trainer.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Engineering Studies","version":"2011","area":"Engineering Fundamentals","outcomes":[],"verified":false}
  - {"course":"Engineering Studies","version":"2026","focusArea":"Technical graphics and communication","year":11,"outcomes":[],"verified":false}
---
# Orthogonal projection trainer

> Backlog summary: Rotate a 3D part and build third-angle views to AS 1100.

## Learning goal
Students connect a 3D part with its orthogonal views: the front view shows width and height, the top view width and depth, and the right side view depth and height. They place the views correctly for third-angle projection (the Australian Standard AS 1100 preferred method: top view above the front view, right view to its right), contrast this with first-angle projection, and use hidden (dashed) lines for edges they cannot see.

Syllabus fit: 2011 Engineering Fundamentals (orthogonal projection, third-angle, AS 1100 conventions); 2026 Technical graphics and communication, Year 11. Pitched at Stage 6: three principal views of simple prismatic parts with steps, slots, chamfers and holes; projection symbol and line types.

## What the student sees
Default view at 1920×1080, light projector theme:

- **Left half, 3D view:** the part as a matte solid with crisp black edges, inside a faint transparent "glass box". The student orbits it by dragging (or with arrow keys). Arrows labelled FRONT, TOP and RIGHT show each viewing direction. The x (width), y (depth) and z (height) axes are labelled.
- **Right half, drawing sheet:** the three orthogonal views on a white sheet with a thin border, laid out for the chosen projection method, each titled (FRONT VIEW, TOP VIEW, RIGHT VIEW). Visible edges are thick continuous lines, hidden edges thin dashed lines, centre lines thin chain lines (long dash, short dash), and projectors thin and light. Overall dimensions are shown in millimetres when **Show dimensions** is on. The projection symbol (the truncated cone in its third-angle or first-angle form) sits in the title block with the words "THIRD-ANGLE PROJECTION" or "FIRST-ANGLE PROJECTION".
- **View from:** snaps the 3D camera to the front, top or side so students can match each view with the sheet; **Camera** switches between perspective and orthographic.
- **Challenge mode:** the three views are hidden behind blank panels; students sketch them on paper, then reveal each panel to check.

Static setup: play, step and reset are hidden.

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| part | Part | | | | | stepBlock | enum: `stepBlock`, `slottedBlock`, `chamferBlock`, `holeBlock` (dimensions in the table below) |
| projection | Projection method | | | | | third | enum: `third` (AS 1100 preferred), `first` |
| showHidden | Show hidden lines | | | | | on | boolean |
| showProjectors | Show projectors | | | | | on | boolean |
| showDimensions | Show dimensions | | | | | on | boolean |
| showLabels | Labels | | | | | on | boolean |
| camera | Camera | | | | | perspective | enum: `perspective`, `orthographic` (keeps parallel lines parallel) |
| viewFrom | View from | | | | | iso | enum: `iso` (3D), `top`, `front`, `side`; snaps the camera |
| challenge | Challenge mode | | | | | off | boolean; hides the views until revealed |

### Parts (x = width, y = depth front to back, z = height; all in mm)
| Key | Outer block W × D × H | Feature removed |
| --- | --- | --- |
| stepBlock | 60 × 30 × 40 | a step 30 wide × 20 high off the top right, through the full depth (x 30–60, z 20–40) |
| slottedBlock | 60 × 40 × 30 | a slot 20 wide × 10 deep across the top, front to back (x 20–40, z 20–30) |
| chamferBlock | 60 × 30 × 40 | a chamfer off the top-right edge from (x 30, z 40) to (x 60, z 20), through the full depth |
| holeBlock | 60 × 40 × 20 | a vertical Ø20 through-hole at the centre (x 30, y 20) |

These keys and the four parts match the space3d engine's in-progress `meta` and model (read on 25 November 2026; not yet pushed), so they are listed under "Engine change requests" to confirm at merge.

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | stepBlock, third angle, hidden lines on, dimensions on | the simplest stepped part |
| slot | slottedBlock, third angle | a hidden line in the right view |
| chamfer | chamferBlock, third angle | an inclined face: a line in the front view, a face in the others |
| hole | holeBlock, third angle | hidden lines and centre lines for a hole |
| first-angle | stepBlock, first angle | compare the layout with third angle |
| challenge | stepBlock, challenge on | sketch first, then reveal |

g is not used on this page.

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| width | Overall width (x) | mm | 3 |
| depth | Overall depth (y) | mm | 3 |
| height | Overall height (z) | mm | 3 |
| partVolume | Volume of the part | mm³ | 5 |
| frontArea | Area covered by the front view | mm² | 5 |
| topArea | Area covered by the top view | mm² | 5 |
| sideArea | Area covered by the right view | mm² | 5 |
| topViewPlacement | Top view position (+1 above the front view, −1 below) | | exact |
| sideViewPlacement | Right view position (+1 right of the front view, −1 left) | | exact |

"Area covered" is the area of the region the part covers in that view (its silhouette); a through-hole seen end-on is a gap in it.

## Assumptions shown on stage
- Orthogonal (parallel) projection; views to AS 1100 line conventions
- Third-angle projection unless first angle is chosen
- Dimensions in millimetres

## Try this (3–5 predict, observe, explain prompts)
1. Predict: which two dimensions does the top view show? Check against the dimensions on the sheet.
2. Observe: in the **slot** preset, find the slot floor in the right view. Why is it dashed?
3. Predict, then observe: switch to first-angle projection. Where does the top view go, and where does the right view go?
4. Explain: in the **chamfer** preset, the inclined face is a single line in one view. Which view, and why?
5. Observe: in the **hole** preset, why does the top view show a circle while the front view shows two dashed lines and a centre line?

## Teacher notes outline
- Misconceptions to target: the right view goes on the right in every projection method (only in third angle); hidden lines are optional decoration (they define internal and far-side features); the top view is drawn looking up from below; an inclined face appears at its true size in every view (only in a view perpendicular to it).
- 10-minute lesson flow: (1) orbit the step block and name each face; (2) snap the camera to the front, top and side views in turn and match each with the sheet; (3) read W, D and H from the views; (4) slot and hole: hidden lines and centre lines; (5) first angle against third angle and the projection symbol; (6) challenge mode on a new part.
- Original HSC-style question idea: a block 80 W × 50 D × 40 H has a notch 30 deep (front to back) × 20 high cut from its top front edge along the full width. A Ø16 hole runs vertically through the full 40 mm height, centred 40 mm from the left end and 10 mm in front of the back face. Draw the front, top and right views in third-angle projection to AS 1100 at 1:1, with hidden lines and centre lines, and state the part's volume. Worked solution: volume = 80 × 50 × 40 − 80 × 30 × 20 − π × 8² × 40 = 160 000 − 48 000 − 8042.5 = 103 957.5 mm³; the hole is a circle in the top view and two dashed lines with a centre line in the front and right views.

## Accessibility notes
Line types carry the meaning (thick continuous visible edges, thin dashed hidden edges, chain centre lines), and each view has a text title, so nothing relies on colour. The projection method is stated in words beside the symbol. The 3D view can be rotated with arrow keys (15° per press) and reset with Home; the unfold slider and every toggle are keyboard operable. Stage label: "Step block, 60 by 30 by 40 millimetres, shown in third-angle projection: front view with the top view above it and the right view to its right."

## Engine change requests
- Confirm at merge: every param and output used here is in the space3d engine's in-progress `meta` for `orthographic` (read from the engine builder's working copy on 25 November 2026; not yet pushed): params `part`, `projection`, `showHidden`, `showProjectors`, `showDimensions`, `showLabels`, `camera`, `viewFrom`, `challenge`; outputs `width`, `depth`, `height`, `partVolume`, `frontArea`, `topArea`, `sideArea`, `topViewPlacement`, `sideViewPlacement`. Its model builds the four parts above exactly (profile extruded through the depth, with a cylinder cut), and computes volumes and view areas exactly, not by sampling.
- The page relies on hidden edges drawn dashed, centre lines for holes, the first-angle layout and the AS 1100 projection symbol in the view.
- Optional, for a later engine version: an "unfold the glass box" slider that animates each view swinging into place.

## Acceptance
Every number below comes from the formula and hand calculation shown here. Volume = outer block − removed feature. View areas: the front view projects onto x–z, the top view onto x–y, the right view onto y–z.

- **Check 1, step block in third angle.** W 60, D 30, H 40. Volume = 60 × 30 × 40 − 30 × 20 × 30 = 72 000 − 18 000 = **54 000 mm³**. Front view: an L-shape, 60 × 40 − 30 × 20 = **1800 mm²**. Top view: the full 60 × 30 outline = **1800 mm²** (the step edge shows as a line at x = 30). Right view: 30 × 40 = **1200 mm²**. Third angle: top view above (**+1**), right view to the right (**+1**).
- **Check 2, step block in first angle.** The views are the same, but the top view goes below the front view (**−1**) and the right view to its left (**−1**).
- **Check 3, slotted block.** W 60, D 40, H 30. Volume = 60 × 40 × 30 − 20 × 10 × 40 = 72 000 − 8000 = **64 000 mm³**. Front view: 60 × 30 − 20 × 10 = **1600 mm²** (the slot is a notch). Top view: 60 × 40 = **2400 mm²** (the slot's sides are lines). Right view: 40 × 30 = **1200 mm²** (the slot floor at z = 20 is a hidden line).
- **Check 4, chamfer block.** W 60, D 30, H 40; the chamfer removes a right triangle with legs 30 (x) and 20 (z) through the 30 mm depth. Volume = 72 000 − ½ × 30 × 20 × 30 = 72 000 − 9000 = **63 000 mm³**. Front view: 2400 − ½ × 30 × 20 = **2100 mm²**. Top view: **1800 mm²**. Right view: **1200 mm²**.
- **Check 5, block with a hole.** W 60, D 40, H 20, Ø20 hole: volume = 60 × 40 × 20 − π × 10² × 20 = 48 000 − 6283.19 = **41 716.8 mm³**. Front view: 60 × 20 = **1200 mm²** (the hole is two hidden lines). Top view: 60 × 40 − π × 10² = 2400 − 314.16 = **2085.84 mm²** (the hole is a gap). Right view: 40 × 20 = **800 mm²**.

```acceptance
[
  { "name": "step block, third angle", "params": { "part": "stepBlock", "projection": "third" }, "run": "static",
    "expect": { "width": { "value": 60, "absTol": 1e-9 }, "depth": { "value": 30, "absTol": 1e-9 }, "height": { "value": 40, "absTol": 1e-9 }, "partVolume": { "value": 54000, "relTol": 1e-9 }, "frontArea": { "value": 1800, "relTol": 1e-9 }, "topArea": { "value": 1800, "relTol": 1e-9 }, "sideArea": { "value": 1200, "relTol": 1e-9 }, "topViewPlacement": { "value": 1, "absTol": 1e-12 }, "sideViewPlacement": { "value": 1, "absTol": 1e-12 } } },
  { "name": "step block, first angle", "params": { "part": "stepBlock", "projection": "first" }, "run": "static",
    "expect": { "topViewPlacement": { "value": -1, "absTol": 1e-12 }, "sideViewPlacement": { "value": -1, "absTol": 1e-12 }, "frontArea": { "value": 1800, "relTol": 1e-9 } } },
  { "name": "slotted block", "params": { "part": "slottedBlock", "projection": "third" }, "run": "static",
    "expect": { "partVolume": { "value": 64000, "relTol": 1e-9 }, "frontArea": { "value": 1600, "relTol": 1e-9 }, "topArea": { "value": 2400, "relTol": 1e-9 }, "sideArea": { "value": 1200, "relTol": 1e-9 } } },
  { "name": "chamfer block", "params": { "part": "chamferBlock", "projection": "third" }, "run": "static",
    "expect": { "partVolume": { "value": 63000, "relTol": 1e-9 }, "frontArea": { "value": 2100, "relTol": 1e-9 }, "topArea": { "value": 1800, "relTol": 1e-9 }, "sideArea": { "value": 1200, "relTol": 1e-9 } } },
  { "name": "block with a through-hole", "params": { "part": "holeBlock", "projection": "third" }, "run": "static",
    "expect": { "partVolume": { "value": 41716.8146928, "relTol": 1e-9 }, "frontArea": { "value": 1200, "relTol": 1e-9 }, "topArea": { "value": 2085.8407346, "relTol": 1e-9 }, "sideArea": { "value": 800, "relTol": 1e-9 } } }
]
```
