---
id: eng-truss-solver
title: "Truss solver"
subject: eng
engine: statics
setup: truss
priority: P0
status: draft            # stub → draft → approved (Gate B)
page: /interactives/engineering/truss-solver.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Engineering Studies","version":"2011","area":"Civil structures","subtopic":"Engineering mechanics","year":12,"outcomes":["H3.1"],"url":"https://www.nsw.gov.au/education-and-training/nesa/curriculum/tas/engineering-studies-stage-6-2011","verified":true}
  - {"course":"Engineering Studies","version":"2026","focusArea":"Civil and structural engineering","subtopic":"Engineering mechanics – truss analysis","year":12,"outcomes":["ES-12-04"],"url":"https://curriculum.nsw.edu.au/learning-areas/tas/engineering-studies-11-12-2026/content/year-12/fab35fb465","verified":true}
---
# Truss solver

> Backlog summary: Place joints, members, supports and loads; method of joints; tension and compression by colour plus label.

## Learning goal
Students analyse a pin-jointed plane truss by the method of joints: find the support reactions from equilibrium of the whole truss, then solve ΣFx = 0 and ΣFy = 0 joint by joint to find each member force and say whether it is in tension or compression. They use m + r = 2j to decide whether a truss can be solved by statics alone, and see that the chords of a loaded truss carry the bending (top in compression, bottom in tension) while the diagonals carry the shear.

Syllabus fit: 2011 Civil Structures (truss analysis, method of joints, tension and compression); 2026 Civil and structural engineering, Year 12 (structural analysis of trusses). Pitched at Stage 6: equilibrium of concurrent forces at a joint, reactions by moments, no matrix methods asked of students (the matrix solver is hidden).

## What the student sees
Default view at 1920×1080, light projector theme: a four-panel Warren truss (12 m span, 3 m deep) drawn to scale on a faint 0.5 m grid, with a pin support (triangle with hatched ground) at A and a roller support (triangle on circles) at E. A 20 kN load arrow points down at joint C with the label "20 kN".

- **Joints** are labelled A, B, C … (bottom chord left to right, then top chord left to right).
- **Members** are drawn by state, always with two cues besides colour: **tension** is a solid orange line with a "T" tag and its force ("15.0 kN T"); **compression** is a dashed graphite line, drawn thicker, with a "C" tag ("20.0 kN C"); a **zero-force** member is a thin grey dotted line tagged "0". A legend in the corner shows all three line styles.
- **Reactions** are drawn as hollow arrows at each support with their components labelled ("10.0 kN").
- **Joint free-body diagram:** clicking a joint (or the support chosen in **Support to read**) rings it, and an inset shows its free-body diagram: every member force drawn as an arrow along its member (pulling away from the joint for tension, pushing in for compression), any load and reaction, and the two equations ΣFx = 0 and ΣFy = 0 with the numbers substituted.
- **Status bar** above the truss: "m + r = 15 + 3 = 18 = 2j: statically determinate". For a mechanism or an indeterminate truss it says so in words, and no forces are shown.
- **Editing:** a tool strip (Select, Joint, Member, Support, Load) lets students add joints on the grid, join them with members, cycle a joint's support (pin → roller → side roller → none) and move joints by dragging. Any edit switches the structure to "Custom" and stores it in the `truss` text, so the URL shares the exact truss.

Static setup: there is no time evolution, so play, step and reset are hidden.

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| structure | Structure | | | | | warren | enum: `equilateral`, `warren`, `pratt`, `howe`, `bracket`, `mechanism`, `braced`, `custom` (editing a preset on the stage makes it custom) |
| span | Span | m | 1 | 40 | 0.5 | 12 | preset structures; the side of the equilateral truss; the reach of the bracket |
| height | Height | m | 0.5 | 15 | 0.25 | 3 | not used by `equilateral` (its height is L√3/2) |
| panels | Panels | | 2 | 10 | 1 | 4 | integer; Warren, Pratt and Howe only |
| truss | Structure text | | | | | the default Warren truss | string, printable characters, max 1500; used when structure = custom. Format `j:x,y …;m:AB …;s:Ap Er;l:C0,-10` (joints in m; supports p pin, r roller, h side roller; extra loads fx,fy in kN, y up) |
| load | Load P | kN | 0 | 200 | 1 | 20 | |
| loadAt | Load P at joint | | | | | C | enum: A–Z |
| loadAngle | Load angle from vertical | ° | −90 | 90 | 5 | 0 | 0 = straight down; + leans to the right |
| editTool | Stage tool | | | | | move | enum: `move`, `joint`, `member`, `support`, `load`, `delete` |
| probeMember | Member to read | | | | | AB | string, two joint letters |
| probeJoint | Support to read | | | | | A | string, one joint letter |
| showForces | Show forces | | | | | on | boolean |

These keys, ranges and engine defaults match the statics engine's `meta` on `origin/w1/engine-statics` (checked 25 November 2026). Joints snap to a 0.25 m grid when placed or dragged.

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | warren, L = 12 m, h = 3 m, 4 panels, P = 20 kN at C, angle 0°, read member GH and support A | the chord forces read like a beam: top chord in compression, bottom in tension |
| equilateral | equilateral, L = 6 m, P = 10 kN at C, read member AC and support A | the simplest truss; matches the engine's analytic test |
| pratt | pratt, L = 12 m, h = 3 m, 4 panels, P = 20 kN at C | diagonals in tension |
| howe | howe, L = 12 m, h = 3 m, 4 panels, P = 20 kN at C | same span, diagonals reversed: now in compression |
| bracket | bracket, L = 4 m, h = 3 m, P = 12 kN at C, read member BC and support B | a 3-4-5 wall bracket with whole-number answers |
| mechanism | mechanism, L = 4 m, h = 3 m, P = 10 kN at C | a square frame with no diagonal: m + r < 2j |
| braced | braced, L = 4 m, h = 3 m, P = 10 kN at C | two diagonals: m + r > 2j, indeterminate |
| sandbox | custom, `j:0,0 4,0 4,3;m:AB BC AC;s:Ap Br;l:C6,0`, P = 0 | a horizontal load and a zero-force member |

No preset uses g: loads are given directly in kN and the members are weightless.

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| memberForce | Member force (+T, −C) | kN | 3 |
| reactionX | Support reaction, horizontal | kN | 3 |
| reactionY | Support reaction, vertical | kN | 3 |
| maxTension | Largest tension | kN | 3 |
| maxCompression | Largest compression (a size, so positive) | kN | 3 |
| determinacy | m + r − 2j | | 2 |

The member readout also shows "T" or "C" as text, and the status bar gives m, r and j. A joint without a support, or a mechanism or indeterminate truss, shows "—" for the force readouts.

## Assumptions shown on stage
- Pin-jointed members carry axial force only
- Loads act only at joints; members are weightless
- Small deflections: geometry does not change under load
- Tension positive (T), compression negative (C)

## Try this (3–5 predict, observe, explain prompts)
1. Predict: in the default Warren truss, which chord (top or bottom) is in compression? Observe, then explain using a beam that sags under the load.
2. Observe: move the load from C to B. How do the two reactions change, and does the largest member force go up or down?
3. Predict, then observe: switch from Pratt to Howe. Which members change from tension to compression?
4. Explain: open the **mechanism** preset. Why does the solver refuse to give forces? Add one member so that m + r = 2j and solve it.
5. Observe: in the **sandbox** preset, member AB carries no force. Explain using joint B's free-body diagram.

## Teacher notes outline
- Misconceptions to target: every member of a loaded truss carries force (zero-force members exist); a member's sign depends on which end you look from (tension pulls on both joints); the top chord of a simply supported truss is in tension; more members always make a truss stronger and still solvable (indeterminate trusses need more than statics).
- 10-minute lesson flow: (1) equilateral preset: reactions by symmetry, then joint C's free-body diagram; (2) default Warren: joint A, then F, B and G in order, checking each against the inset; (3) compare the top chord force with M/h from the beam analogy (PL/4 ÷ h = 20 kN); (4) Pratt against Howe; (5) mechanism and braced: m + r against 2j.
- Original HSC-style question idea: a symmetric roof truss with joints A(0, 0), B(8, 0) and C(4, 3) m, pin at A, roller at B, and a 24 kN load at C. Find the reactions and the force in AC and AB, stating tension or compression. Worked solution: R_A = R_B = 12 kN up; at A, F_AC × 3/5 = −12 so F_AC = −20 kN (C); F_AB = −F_AC × 4/5 = +16 kN (T).

## Accessibility notes
Tension and compression are never shown by colour alone: tension is a solid line tagged "T", compression a thicker dashed line tagged "C", zero-force a thin dotted line tagged "0", and the legend repeats this. Each force label includes its value and letter. Supports are drawn as distinct shapes (pin: hatched triangle; roller: triangle on circles; side roller: rotated), each with a text tag. All editing tools have keyboard equivalents: arrow keys move the selected joint by one grid step, Tab cycles joints, Enter applies the active tool, and the `truss` text box accepts the whole structure as text. Stage label: "Truss with … joints and … members, pin at …, roller at …, … kilonewton load at joint …. Statically determinate. Largest tension … kilonewtons in member …; largest compression … kilonewtons in member …."

## Engine change requests
- None for the keys: every param and output used here is in the statics engine's `meta` for `truss` on `origin/w1/engine-statics` (checked 25 November 2026): params `structure`, `span`, `height`, `panels`, `truss`, `load`, `loadAt`, `loadAngle`, `editTool`, `probeMember`, `probeJoint`, `showForces`; outputs `memberForce`, `reactionX`, `reactionY`, `maxTension`, `maxCompression`, `determinacy`. The `probeMember` and `probeJoint` selectors are what let a fixed list of outputs report any member or support.
- The joint free-body-diagram inset (with substituted equations) is a view feature this page relies on; if the engine does not draw it, the page needs it added before Gate C.
- Joint lettering for presets must be as in the engine's `presetTruss`: bottom chord left to right, then top chord left to right; bracket A = top wall joint, B = bottom wall joint, C = tip.

## Acceptance
Every number below comes from the formula and hand calculation shown here. Method: reactions from equilibrium of the whole truss, then ΣFx = 0 and ΣFy = 0 at each joint, with every unknown member force assumed in tension (pulling the joint towards the member's other end). A negative answer means compression. x is to the right, y up; forces in kN.

**Check 1 and 2, equilateral truss.** A(0, 0) pin, B(6, 0) roller, C(3, 3√3) = (3, 5.196); P = 10 kN down at C. m = 3, r = 3, j = 3, so m + r = 6 = 2j.
- Whole truss: no horizontal load, so R_Ax = 0. Moments about A: R_By × 6 − 10 × 3 = 0, so R_By = **5 kN**; R_Ay = 10 − 5 = **5 kN**.
- Joint C: the unit vector from C to A is (−½, −√3/2) and from C to B is (½, −√3/2). ΣFx: −½F_CA + ½F_CB = 0, so F_CA = F_CB. ΣFy: −(√3/2)(F_CA + F_CB) − 10 = 0, so F_CA = −10/√3 = **−5.7735 kN (C)**, and F_CB is the same.
- Joint A: ΣFx: F_AB + ½F_AC + R_Ax = 0, so F_AB = −½ × (−5.7735) = **+2.88675 kN (T)**. ΣFy: (√3/2)F_AC + R_Ay = −5 + 5 = 0 ✓.

**Check 3 and 4, Warren truss (default).** Bottom joints A(0, 0), B(3, 0), C(6, 0), D(9, 0), E(12, 0); top joints F(1.5, 3), G(4.5, 3), H(7.5, 3), I(10.5, 3). Members AB, BC, CD, DE, FG, GH, HI, AF, FB, BG, GC, CH, HD, DI, IE. Pin at A, roller at E, P = 20 kN down at C. m = 15, r = 3, j = 9: m + r = 18 = 2j, so the index is **0**. Every diagonal has length √(1.5² + 3²) = 3.3541 m, so sin θ = 3/3.3541 = 0.894427 and cos θ = 1.5/3.3541 = 0.447214.
- Whole truss: by symmetry (or moments about A: R_Ey × 12 = 20 × 6), R_Ay = R_Ey = **10 kN**, R_Ax = 0.
- Joint A: ΣFy: 0.894427 F_AF + 10 = 0, so F_AF = **−11.1803 kN (C)**. ΣFx: F_AB + 0.447214 F_AF = 0, so F_AB = +5 kN (T).
- Joint F: ΣFy: −0.894427 F_FA − 0.894427 F_FB = 0, so F_FB = +11.1803 kN (T). ΣFx: −0.447214 F_FA + 0.447214 F_FB + F_FG = 0, so 5 + 5 + F_FG = 0 and F_FG = −10 kN (C).
- Joint B: ΣFy: 0.894427 F_BF + 0.894427 F_BG = 0, so F_BG = −11.1803 kN (C). ΣFx: −F_BA − 0.447214 F_BF + 0.447214 F_BG + F_BC = 0, so −5 − 5 − 5 + F_BC = 0 and F_BC = **+15 kN (T)**.
- Joint G: ΣFy: −0.894427 F_GB − 0.894427 F_GC = 0, so F_GC = +11.1803 kN (T). ΣFx: −F_GF − 0.447214 F_GB + 0.447214 F_GC + F_GH = 0, so 10 + 5 + 5 + F_GH = 0 and F_GH = **−20 kN (C)**.
- Check at C: 2 × 11.1803 × 0.894427 − 20 = 0 ✓. The right half mirrors the left, so the largest tension is BC = CD = **15 kN** and the largest compression is GH, **20 kN** in size (the readout reports compression as a positive size; the member force itself is −20 kN). Beam analogy: M at mid-span = PL/4 = 60 kN·m, and 60/h = 60/3 = 20 kN in the top chord ✓.

**Check 5 and 6, wall bracket.** A(0, 3) pin, B(0, 0) pin, C(4, 3); members AC (horizontal, 4 m) and BC (a 3-4-5 diagonal, 5 m); P = 12 kN down at C. m = 2, r = 4, j = 3: 6 = 2j.
- Joint C: unit vectors C→A = (−1, 0) and C→B = (−0.8, −0.6). ΣFy: −0.6 F_CB − 12 = 0, so F_CB = **−20 kN (C)**. ΣFx: −F_CA − 0.8 F_CB = 0, so F_CA = **+16 kN (T)**.
- Joint A: the member pulls A towards C with 16 kN, so R_Ax = **−16 kN** and R_Ay = **0**.
- Joint B: the member pushes B with F_BC × (0.8, 0.6) = (−16, −12), so R_Bx = **+16 kN** and R_By = **+12 kN**. Check: R_Ay + R_By = 12 = P ✓.

**Check 7 and 8, determinacy.** Mechanism: a 4 m × 3 m square frame AB, BC, CD, DA with a pin at A and a roller at B: m + r − 2j = 4 + 3 − 8 = **−1** (a mechanism). Braced: add both diagonals AC and BD: 6 + 3 − 8 = **+1** (indeterminate).

**Check 9 and 10, sandbox (custom text, horizontal load).** A(0, 0) pin, B(4, 0) roller, C(4, 3); members AB, BC, AC; 6 kN to the right at C; P = 0.
- Whole truss: ΣFx: R_Ax + 6 = 0, so R_Ax = **−6 kN**. Moments about A (anticlockwise +): 4R_By − 3 × 6 = 0, so R_By = **4.5 kN**; ΣFy: R_Ay = **−4.5 kN** (the pin pulls down).
- Joint C: unit vectors C→B = (0, −1) and C→A = (−0.8, −0.6). ΣFx: −0.8 F_CA + 6 = 0, so F_CA = **+7.5 kN (T)**. ΣFy: −F_CB − 0.6 × 7.5 = 0, so F_CB = **−4.5 kN (C)**.
- Joint B: ΣFx: −F_BA = 0, so F_AB = **0** (a zero-force member). ΣFy: F_BC + R_By = −4.5 + 4.5 = 0 ✓.

```acceptance
[
  { "name": "equilateral: inclined member and reaction at A", "params": { "structure": "equilateral", "span": 6, "load": 10, "loadAt": "C", "loadAngle": 0, "probeMember": "AC", "probeJoint": "A" }, "run": "static",
    "expect": { "memberForce": { "value": -5.773502692, "absTol": 1e-9 }, "reactionY": { "value": 5, "absTol": 1e-9 }, "reactionX": { "value": 0, "absTol": 1e-9 } } },
  { "name": "equilateral: base member and reaction at B", "params": { "structure": "equilateral", "span": 6, "load": 10, "loadAt": "C", "loadAngle": 0, "probeMember": "AB", "probeJoint": "B" }, "run": "static",
    "expect": { "memberForce": { "value": 2.886751346, "absTol": 1e-9 }, "reactionY": { "value": 5, "absTol": 1e-9 } } },
  { "name": "Warren: top chord GH, extremes and determinacy", "params": { "structure": "warren", "span": 12, "height": 3, "panels": 4, "load": 20, "loadAt": "C", "loadAngle": 0, "probeMember": "GH", "probeJoint": "A" }, "run": "static",
    "expect": { "memberForce": { "value": -20, "absTol": 1e-9 }, "reactionY": { "value": 10, "absTol": 1e-9 }, "maxTension": { "value": 15, "absTol": 1e-9 }, "maxCompression": { "value": 20, "absTol": 1e-9 }, "determinacy": { "value": 0, "absTol": 1e-12 } } },
  { "name": "Warren: end diagonal AF and reaction at E", "params": { "structure": "warren", "span": 12, "height": 3, "panels": 4, "load": 20, "loadAt": "C", "loadAngle": 0, "probeMember": "AF", "probeJoint": "E" }, "run": "static",
    "expect": { "memberForce": { "value": -11.18033989, "absTol": 1e-8 }, "reactionY": { "value": 10, "absTol": 1e-9 } } },
  { "name": "Warren: bottom chord BC", "params": { "structure": "warren", "span": 12, "height": 3, "panels": 4, "load": 20, "loadAt": "C", "loadAngle": 0, "probeMember": "BC", "probeJoint": "A" }, "run": "static",
    "expect": { "memberForce": { "value": 15, "absTol": 1e-9 } } },
  { "name": "bracket: tie AC and reaction at A", "params": { "structure": "bracket", "span": 4, "height": 3, "load": 12, "loadAt": "C", "loadAngle": 0, "probeMember": "AC", "probeJoint": "A" }, "run": "static",
    "expect": { "memberForce": { "value": 16, "absTol": 1e-9 }, "reactionX": { "value": -16, "absTol": 1e-9 }, "reactionY": { "value": 0, "absTol": 1e-9 } } },
  { "name": "bracket: strut BC and reaction at B", "params": { "structure": "bracket", "span": 4, "height": 3, "load": 12, "loadAt": "C", "loadAngle": 0, "probeMember": "BC", "probeJoint": "B" }, "run": "static",
    "expect": { "memberForce": { "value": -20, "absTol": 1e-9 }, "reactionX": { "value": 16, "absTol": 1e-9 }, "reactionY": { "value": 12, "absTol": 1e-9 } } },
  { "name": "square frame without a diagonal is a mechanism", "params": { "structure": "mechanism", "span": 4, "height": 3, "load": 10, "loadAt": "C" }, "run": "static",
    "expect": { "determinacy": { "value": -1, "absTol": 1e-12 } } },
  { "name": "frame with two diagonals is indeterminate", "params": { "structure": "braced", "span": 4, "height": 3, "load": 10, "loadAt": "C" }, "run": "static",
    "expect": { "determinacy": { "value": 1, "absTol": 1e-12 } } },
  { "name": "custom truss: zero-force member and pin reaction", "params": { "structure": "custom", "truss": "j:0,0 4,0 4,3;m:AB BC AC;s:Ap Br;l:C6,0", "load": 0, "probeMember": "AB", "probeJoint": "A" }, "run": "static",
    "expect": { "memberForce": { "value": 0, "absTol": 1e-9 }, "reactionX": { "value": -6, "absTol": 1e-9 }, "reactionY": { "value": -4.5, "absTol": 1e-9 } } },
  { "name": "custom truss: member BC and roller reaction", "params": { "structure": "custom", "truss": "j:0,0 4,0 4,3;m:AB BC AC;s:Ap Br;l:C6,0", "load": 0, "probeMember": "BC", "probeJoint": "B" }, "run": "static",
    "expect": { "memberForce": { "value": -4.5, "absTol": 1e-9 }, "reactionY": { "value": 4.5, "absTol": 1e-9 } } }
]
```
