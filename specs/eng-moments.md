---
id: eng-moments
title: "Moments and equilibrium"
subject: eng
engine: statics
setup: moments
priority: P1
status: draft            # stub → draft → approved (Gate B)
page: /interactives/engineering/moments.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Engineering Studies","version":"2011","area":"Engineering Fundamentals","outcomes":[],"verified":false}
  - {"course":"Engineering Studies","version":"2026","focusArea":"Applied engineering analysis","year":11,"outcomes":[],"verified":false,"subtopic":"Equilibrium in mechanics"}
---
# Moments and equilibrium

> Backlog summary: Clockwise-positive moments and beam reactions.

## Learning goal
Students calculate the moment of a force as force × perpendicular distance, with the engineering convention that clockwise moments are positive, and use the two conditions of equilibrium (ΣM = 0 about any point and ΣFy = 0) to find the reactions of a beam on two supports, including beams that overhang a support. They see that once the beam is in equilibrium the moments balance about every point, not just the support they chose.

Syllabus fit: 2011 Engineering Fundamentals (moments, equilibrium, beam reactions); 2026 Applied engineering analysis, Year 11, equilibrium in mechanics. Pitched at Stage 6: point loads, two supports, clockwise-positive sign convention.

## What the student sees
Default view at 1920×1080, light projector theme:

- **Upper half:** a horizontal beam drawn to scale with a ruler (0.5 m ticks) along it, two supports A and B (A a pin, B a roller), and up to three downward load arrows labelled "10 kN" with their positions. The reactions are hollow upward arrows labelled with their values. The chosen pivot is a large ringed point labelled "pivot".
- Each force's moment about the pivot is drawn as a curved arrow around the pivot, clockwise or anticlockwise, with its value in kN·m and a lever-arm dimension line from the pivot to the force's line of action ("2.0 m").
- **Lower half, moment table:** one row per force (name, F, lever arm, sense, moment with the convention's sign), then Σ clockwise, Σ anticlockwise and the net moment. A balance bar shows Σ clockwise against Σ anticlockwise side by side, with the word "Balanced" when they agree.
- A convention badge reads "Clockwise +" (or "Anticlockwise +").

Static setup: play, step and reset are hidden. Dragging a load, a support or the pivot updates everything.

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| length | Beam length L | m | 1 | 20 | 0.5 | 6 | |
| supportA | Support A at | m | 0 | 20 | 0.1 | 0 | from the left end; clamped to the beam |
| supportB | Support B at | m | 0 | 20 | 0.1 | 6 | clamped to the beam |
| load1 | Load F₁ | kN | 0 | 100 | 0.5 | 10 | downward |
| load1At | F₁ at | m | 0 | 20 | 0.1 | 1.5 | from the left end |
| load2 | Load F₂ | kN | 0 | 100 | 0.5 | 6 | |
| load2At | F₂ at | m | 0 | 20 | 0.1 | 4 | |
| load3 | Load F₃ | kN | 0 | 100 | 0.5 | 0 | |
| load3At | F₃ at | m | 0 | 20 | 0.1 | 5 | |
| momentSign | Sign convention | | | | | cw | enum: `cw` (clockwise +, engineering default), `acw` |
| momentsAbout | Take moments about | | | | | A | enum: `A` (support A), `B` (support B), `point` (another point) |
| pivotX | Point at x | m | 0 | 20 | 0.1 | 3 | visible when momentsAbout = point |
| showReactions | Show the reactions | | | | | on | boolean; off hides them so students can find them first |

These keys, ranges and engine defaults match the statics engine's `meta` on `origin/w1/engine-statics` (checked 25 November 2026).

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | beam 6 m, A at 0, B at 6, 10 kN at 2 m, 20 kN at 4.5 m, pivot A, clockwise + | the standard two-load beam |
| any-point | default with momentsAbout = point at 3 m | moments balance about any point |
| overhang | beam 7 m, A at 1, B at 5, 8 kN at 0, 12 kN at 3, 6 kN at 7, pivot A | loads outside the supports turn the other way |
| see-saw | beam 4 m, A at 2, B at 3, 3 kN at 0, 6 kN at 3.5, pivot A | a lever: small force, long arm |
| anticlockwise | default with momentSign = acw | the same physics with the other sign convention |

No preset uses g: loads are given in kN.

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| reactionA | Reaction R_A (up +) | kN | 3 |
| reactionB | Reaction R_B (up +) | kN | 3 |
| sumCw | Σ clockwise moments about the pivot | kN·m | 3 |
| sumAcw | Σ anticlockwise moments about the pivot | kN·m | 3 |
| loadMoment | Moment of the loads about the pivot (with the chosen sign) | kN·m | 3 |
| netMoment | Net moment of all forces about the pivot | kN·m | 3 |

With **Show the reactions** off, the reaction and sum readouts show "—" until it is turned on (the loads' moment stays visible).

## Assumptions shown on stage
- Beam weight neglected; loads are vertical point loads
- Supports at A and B give vertical reactions only
- Clockwise moments positive (engineering convention), unless changed
- Moment = force × perpendicular distance from the pivot

## Try this (3–5 predict, observe, explain prompts)
1. Predict: which support carries more of the load in the default beam? Observe the reactions, then explain using moments about A.
2. Observe: switch the pivot to a point at 3 m. Do Σ clockwise and Σ anticlockwise still balance? Try three other pivot positions.
3. Predict, then observe: in the **overhang** preset, what sense is the moment of the 8 kN load about A? Why?
4. Explain: in the **see-saw** preset, how can 3 kN balance 6 kN? Move the 6 kN load until the reaction at B is zero.
5. Observe: switch to the anticlockwise convention. Which numbers change sign, and which stay the same?

## Teacher notes outline
- Misconceptions to target: moment = force × distance along the beam even when the force is not perpendicular (here it always is, but warn for later); a reaction at the pivot has a moment about it (it has zero arm); the reactions always share the load equally; changing the sign convention changes the answer (only the signs change).
- 10-minute lesson flow: (1) default beam: moments about A by hand to find R_B, then ΣFy for R_A; (2) check about B; (3) the any-point preset; (4) overhang: loads outside the supports; (5) the convention switch.
- Original HSC-style question idea: a 5 m beam rests on supports 1 m from each end and carries 4 kN at the left end, 10 kN at 2.5 m and 6 kN at the right end. Taking clockwise as positive, find both reactions. Worked solution: supports at 1 m and 4 m; ΣM_A = 0: 4 × (−1) + 10 × 1.5 + 6 × 4 − 3R_B = 0, so R_B = 35/3 = 11.67 kN; R_A = 20 − 11.67 = 8.33 kN.

## Accessibility notes
Each moment arrow is labelled with its value and "CW" or "ACW" in text, and clockwise arrows are solid while anticlockwise arrows are dashed. Lever arms are dimension lines with values. The balance bar labels both sides in words. Loads, supports and the pivot can be selected with Tab and moved with arrow keys (0.1 m per press). Stage label: "Beam … metres long on supports at … and … metres with … loads. Reactions … and … kilonewtons. About the pivot at … metres, clockwise moments total … and anticlockwise … kilonewton metres."

## Engine change requests
- None for the keys: every param and output used here is in the statics engine's `meta` for `moments` on `origin/w1/engine-statics` (checked 25 November 2026): params `length`, `supportA`, `supportB`, `load1`, `load1At`, `load2`, `load2At`, `load3`, `load3At`, `momentSign`, `momentsAbout`, `pivotX`, `showReactions`; outputs `reactionA`, `reactionB`, `sumCw`, `sumAcw`, `loadMoment`, `netMoment`.

## Acceptance
Every number below comes from the formula and hand calculation shown here. Moments about A (clockwise +): a downward load P at x gives +P(x − x_A); the reaction R_B gives −R_B(x_B − x_A). Setting the sum to zero gives R_B; then R_A = ΣP − R_B. About any pivot, a downward load to the right of the pivot turns clockwise and to the left anticlockwise; an upward reaction does the opposite.

- **Check 1, default beam, moments about A.** ΣM_A = 10 × 2 + 20 × 4.5 − 6R_B = 20 + 90 − 6R_B = 0, so R_B = 110/6 = **18.333 kN** and R_A = 30 − 18.333 = **11.667 kN**. About A: Σ clockwise = 20 + 90 = **110 kN·m**; Σ anticlockwise = 18.333 × 6 = **110 kN·m**; net **0**; the loads' moment is **+110 kN·m**.
- **Check 2, anticlockwise convention.** The same beam with anticlockwise positive: the loads' moment about A is **−110 kN·m**; the reactions and the net (0) are unchanged.
- **Check 3, about a point at 3 m.** Clockwise: 20 kN at 1.5 m to the right (30 kN·m) and R_A = 11.667 kN at 3 m to the left (35 kN·m), total **65 kN·m**. Anticlockwise: 10 kN at 1 m to the left (10 kN·m) and R_B = 18.333 kN at 3 m to the right (55 kN·m), total **65 kN·m**. Net **0**.
- **Check 4, overhanging beam.** A at 1 m, B at 5 m; 8 kN at 0, 12 kN at 3 m, 6 kN at 7 m. ΣM_A = 8 × (0 − 1) + 12 × (3 − 1) + 6 × (7 − 1) − 4R_B = −8 + 24 + 36 − 4R_B = 0, so R_B = 52/4 = **13 kN** and R_A = 26 − 13 = **13 kN**. About A: clockwise 24 + 36 = **60 kN·m**; anticlockwise 8 + 13 × 4 = **60 kN·m**.
- **Check 5, see-saw.** A at 2 m, B at 3 m; 3 kN at 0, 6 kN at 3.5 m. ΣM_A = 3 × (−2) + 6 × 1.5 − 1 × R_B = −6 + 9 − R_B = 0, so R_B = **3 kN** and R_A = 9 − 3 = **6 kN**.
- **Question idea check.** Supports at 1 and 4 m: R_B = (−4 + 15 + 24)/3 = 35/3 = 11.667 kN; R_A = 8.333 kN.

```acceptance
[
  { "name": "default beam: reactions and moments about A", "params": { "length": 6, "supportA": 0, "supportB": 6, "load1": 10, "load1At": 2, "load2": 20, "load2At": 4.5, "load3": 0, "momentsAbout": "A", "momentSign": "cw" }, "run": "static",
    "expect": { "reactionA": { "value": 11.6666667, "relTol": 1e-8 }, "reactionB": { "value": 18.3333333, "relTol": 1e-8 }, "sumCw": { "value": 110, "relTol": 1e-9 }, "sumAcw": { "value": 110, "relTol": 1e-9 }, "netMoment": { "value": 0, "absTol": 1e-9 }, "loadMoment": { "value": 110, "relTol": 1e-9 } } },
  { "name": "anticlockwise convention flips the sign only", "params": { "length": 6, "supportA": 0, "supportB": 6, "load1": 10, "load1At": 2, "load2": 20, "load2At": 4.5, "load3": 0, "momentsAbout": "A", "momentSign": "acw" }, "run": "static",
    "expect": { "loadMoment": { "value": -110, "relTol": 1e-9 }, "reactionB": { "value": 18.3333333, "relTol": 1e-8 }, "netMoment": { "value": 0, "absTol": 1e-9 } } },
  { "name": "moments balance about any point", "params": { "length": 6, "supportA": 0, "supportB": 6, "load1": 10, "load1At": 2, "load2": 20, "load2At": 4.5, "load3": 0, "momentsAbout": "point", "pivotX": 3, "momentSign": "cw" }, "run": "static",
    "expect": { "sumCw": { "value": 65, "relTol": 1e-9 }, "sumAcw": { "value": 65, "relTol": 1e-9 }, "netMoment": { "value": 0, "absTol": 1e-9 } } },
  { "name": "overhanging beam", "params": { "length": 7, "supportA": 1, "supportB": 5, "load1": 8, "load1At": 0, "load2": 12, "load2At": 3, "load3": 6, "load3At": 7, "momentsAbout": "A", "momentSign": "cw" }, "run": "static",
    "expect": { "reactionA": { "value": 13, "absTol": 1e-9 }, "reactionB": { "value": 13, "absTol": 1e-9 }, "sumCw": { "value": 60, "relTol": 1e-9 }, "sumAcw": { "value": 60, "relTol": 1e-9 } } },
  { "name": "see-saw lever", "params": { "length": 4, "supportA": 2, "supportB": 3, "load1": 3, "load1At": 0, "load2": 6, "load2At": 3.5, "load3": 0, "momentsAbout": "A", "momentSign": "cw" }, "run": "static",
    "expect": { "reactionA": { "value": 6, "absTol": 1e-9 }, "reactionB": { "value": 3, "absTol": 1e-9 } } },
  { "name": "question idea: 5 m beam with overhangs", "params": { "length": 5, "supportA": 1, "supportB": 4, "load1": 4, "load1At": 0, "load2": 10, "load2At": 2.5, "load3": 6, "load3At": 5, "momentsAbout": "A", "momentSign": "cw" }, "run": "static",
    "expect": { "reactionA": { "value": 8.3333333, "relTol": 1e-8 }, "reactionB": { "value": 11.6666667, "relTol": 1e-8 } } }
]
```
