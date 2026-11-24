---
id: eng-beam-lab
title: "Beam lab"
subject: eng
engine: statics
setup: beam
priority: P1
status: draft            # stub → draft → approved (Gate B)
page: /interactives/engineering/beam-lab.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Engineering Studies","version":"2011","area":"Civil Structures","outcomes":[],"verified":false}
  - {"course":"Engineering Studies","version":"2026","focusArea":"Civil and structural engineering","year":12,"outcomes":[],"verified":false}
---
# Beam lab

> Backlog summary: Support reactions, shear force and bending moment diagrams, bending stress.

## Learning goal
Students find the support reactions of a simply supported or cantilever beam, then build its shear force and bending moment diagrams and see how they connect: the shear force jumps at a point load, slopes under a uniformly distributed load (UDL), and the bending moment is greatest where the shear force crosses zero. They use σ = My/I to turn the largest bending moment into the largest bending stress and see how much a deeper section helps.

Syllabus fit: 2011 Civil Structures (bending, shear force and bending moment diagrams, bending stress); 2026 Civil and structural engineering, Year 12. Pitched at Stage 6: point loads and UDLs on statically determinate beams; I for a rectangular section is given as bd³/12, not derived.

## What the student sees
Default view at 1920×1080, light projector theme, three panels stacked and sharing one x-axis (metres):

1. **Beam:** a 6 m beam drawn to scale with a pin at A (left) and a roller at B (right), a 20 kN point-load arrow at 3 m, and any UDL drawn as a row of small arrows with its intensity ("10 kN/m"). Reactions are hollow arrows labelled with their values. A cantilever is drawn built into a hatched wall at the left, with the wall's moment shown as a curved arrow labelled with its value and sense. The section position x is a vertical dashed line through all three panels.
2. **Shear force diagram (SFD):** V(x) in kN, filled above and below the axis with hatching (positive hatched one way, negative the other), with values at every jump and end.
3. **Bending moment diagram (BMD):** M(x) in kN·m, sagging positive, drawn above the axis and labelled "sagging +", with the largest value marked by a dot and its value and position ("62.5 kN·m at 3.00 m").

A small inset at the right shows the rectangular cross-section b × d to scale with the neutral axis, and the stress distribution beside it (compression at the top for sagging, tension at the bottom, each labelled with "C" and "T").

Static setup: play, step and reset are hidden. Dragging a load arrow along the beam or the section line updates everything at once.

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| beamType | Beam | | | | | simple | enum: `simple` (pin at A, roller at B), `cantilever` (fixed at the left end) |
| length | Span L | m | 1 | 20 | 0.5 | 6 | |
| p1 | Point load P₁ | kN | 0 | 100 | 0.5 | 10 | downward |
| p1At | P₁ distance from A | m | 0 | 20 | 0.1 | 3 | clamped to the span |
| p2 | Point load P₂ | kN | 0 | 100 | 0.5 | 0 | downward |
| p2At | P₂ distance from A | m | 0 | 20 | 0.1 | 4.5 | clamped to the span |
| udl | UDL w | kN/m | 0 | 50 | 0.5 | 0 | downward |
| udlExtent | UDL covers | | | | | full | enum: `full` (whole span), `part` |
| udlFrom | UDL starts at | m | 0 | 20 | 0.1 | 0 | visible when udlExtent = part |
| udlTo | UDL ends at | m | 0 | 20 | 0.1 | 3 | visible when udlExtent = part |
| sectionB | Section width b | mm | 10 | 1000 | 5 | 100 | rectangular section |
| sectionD | Section depth d | mm | 10 | 1500 | 5 | 200 | |
| probeX | Section at x | m | 0 | 20 | 0.1 | 1.5 | clamped to the span |

These keys, ranges and engine defaults match the statics engine's `meta` on `origin/w1/engine-statics` (checked 25 November 2026).

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | simple, L = 6 m, P₁ = 20 kN at 3 m, no UDL, 100 × 300 mm, section at 2 m | the classic central point load: M_max = PL/4 |
| udl | simple, L = 6 m, P₁ = 0, w = 10 kN/m over the whole span | M_max = wL²/8; the BMD is a parabola |
| off-centre | simple, L = 6 m, P₁ = 30 kN at 2 m | unequal reactions |
| cantilever | cantilever, L = 3 m, P₁ = 10 kN at 3 m | hogging moment, largest at the wall |
| combined | simple, L = 8 m, P₁ = 20 kN at 2 m, w = 5 kN/m over the whole span, section at 5 m | M_max is where V = 0, not under the point load |

No preset uses g: loads are given in kN and the beam's self-weight is neglected.

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| reactionA | Reaction R_A (up +) | kN | 3 |
| reactionB | Reaction R_B (up +) | kN | 3 |
| fixingMoment | Wall moment M_A (cantilever, anticlockwise on the beam +) | kN·m | 3 |
| maxShear | Largest shear force (size) | kN | 3 |
| maxMoment | Largest moment M (sagging +) | kN·m | 3 |
| maxMomentAt | Largest moment at x | m | 3 |
| secondMoment | Second moment of area I | mm⁴ | 3 |
| maxStress | Largest bending stress | MPa | 3 |
| shearAtX | Shear V at the section (just right of x) | kN | 3 |
| momentAtX | Moment M at the section | kN·m | 3 |
| stressAtX | Bending stress at the section | MPa | 3 |

For a simply supported beam `fixingMoment` shows "—"; for a cantilever `reactionB` shows "—".

## Assumptions shown on stage
- Beam weight neglected
- Loads act downward; supports are ideal (pin, roller or fully fixed)
- Linear elastic, rectangular section: σ = My/I with I = bd³/12
- Sagging bending moment positive; shear force positive when the left part is pushed up

## Try this (3–5 predict, observe, explain prompts)
1. Predict: for a central point load, where is the bending moment largest? Then move the load towards A. Where does the maximum go, and what happens to its size?
2. Observe: in the **combined** preset, read V on each side of the point load. Where does V cross zero, and what does the BMD do there?
3. Predict, then observe: double the section depth from 300 mm to 600 mm. By what factor does the largest stress change? Now double the width instead.
4. Explain: in the **cantilever** preset, why is the bending moment largest at the wall and zero at the free end?
5. Observe: compare a 20 kN point load at mid-span with a UDL that adds up to the same 20 kN. Which gives the larger maximum moment, and by how much?

## Teacher notes outline
- Misconceptions to target: the maximum bending moment is always under the biggest load (it is where V = 0); a beam fails where the shear force is largest (bending usually governs for long beams); doubling the width and doubling the depth help equally (depth enters as d², through I/y = bd²/6); a cantilever's reaction is only a force (there is also a fixing moment).
- 10-minute lesson flow: (1) default: reactions by moments about A; (2) slide the section along the beam and read V and M; (3) add a UDL and see the SFD slope and the BMD curve; (4) the **combined** preset: find x where V = 0, then M there; (5) σ = My/I and the depth experiment; (6) compare the largest stress with a yield stress (for example 250 MPa for Grade 250 structural steel) to get a factor of safety.
- Original HSC-style question idea: a 5 m simply supported timber beam (b = 75 mm, d = 250 mm) carries a 12 kN point load 2 m from A. Find both reactions, the maximum bending moment and the maximum bending stress. Worked solution: R_B = 12 × 2/5 = 4.8 kN, R_A = 7.2 kN; M_max = 7.2 × 2 = 14.4 kN·m; I = 75 × 250³/12 = 97.66 × 10⁶ mm⁴; σ = 14.4 × 10⁶ × 125/(97.66 × 10⁶) = 18.4 MPa.

## Accessibility notes
The SFD and BMD use hatching that differs for positive and negative regions, plus "+" and "−" labels, so sign is never shown by colour alone. Every jump and maximum carries a text value. The stress inset labels the compressive and tensile faces "C" and "T". Load arrows and the section line can be moved with arrow keys after Tab-selecting them (0.1 m per press). Stage label: "Simply supported beam, span … metres, with … loads. Reactions … and … kilonewtons. Largest bending moment … kilonewton metres at … metres; largest bending stress … megapascals."

## Engine change requests
- None for the keys: every param and output used here is in the statics engine's `meta` for `beam` on `origin/w1/engine-statics` (checked 25 November 2026): params `beamType`, `length`, `p1`, `p1At`, `p2`, `p2At`, `udl`, `udlExtent`, `udlFrom`, `udlTo`, `sectionB`, `sectionD`, `probeX`; outputs `reactionA`, `reactionB`, `fixingMoment`, `maxShear`, `maxMoment`, `maxMomentAt`, `secondMoment`, `maxStress`, `shearAtX`, `momentAtX`, `stressAtX`.
- `fixingMoment` is the wall's moment on the beam, positive when anticlockwise (the engine model's `MA`); the stage labels its sense in words. `maxMoment` is signed (sagging +), so a cantilever with downward loads gives a negative value.
- Optional, for a later engine version (not used below): a yield-stress param and a factor-of-safety output, so the design check in the lesson flow appears as a readout.

## Acceptance
Every number below comes from the formula and hand calculation shown here. Reactions come from ΣM_A = 0 and ΣFy = 0; V(x) is the sum of upward forces left of the section; M(x) is the moment of those forces about the section (sagging +). Section 100 × 300 mm: I = bd³/12 = 100 × 300³/12 = **225 × 10⁶ mm⁴**, y = d/2 = 150 mm, so σ = M × 10⁶ × 150/(225 × 10⁶) = M/1.5 MPa with M in kN·m.

- **Check 1, central point load.** L = 6 m, P = 20 kN at 3 m. R_A = R_B = **10 kN** by symmetry. M_max = R_A × 3 = PL/4 = 20 × 6/4 = **30 kN·m** at **x = 3 m**. Largest |V| = **10 kN**. σ_max = 30/1.5 = **20 MPa**.
- **Check 2, full-span UDL.** w = 10 kN/m over 0–6 m: total 60 kN, so R_A = R_B = **30 kN**. V(x) = 30 − 10x is zero at x = 3 m, where M = wL²/8 = 10 × 36/8 = **45 kN·m**. Largest |V| = **30 kN** (at the supports). σ_max = 45/1.5 = **30 MPa**.
- **Check 3, off-centre load.** P = 30 kN at a = 2 m, b = 4 m. ΣM_A: R_B × 6 = 30 × 2, so R_B = **10 kN** and R_A = **20 kN**. M_max = R_A × a = Pab/L = 30 × 2 × 4/6 = **40 kN·m** at **x = 2 m**. σ_max = 40/1.5 = **26.667 MPa**.
- **Check 4, cantilever.** L = 3 m, P = 10 kN at the free end. ΣFy: R_A = **10 kN**. The wall must supply an anticlockwise moment PL = **30 kN·m**. M(x) = −P(L − x), so M(0) = **−30 kN·m** (hogging, largest at the wall). σ_max = 30/1.5 = **20 MPa**; |V| = **10 kN** everywhere.
- **Check 5, point load plus UDL.** L = 8 m, P = 20 kN at 2 m, w = 5 kN/m over 0–8 m (40 kN acting at 4 m). ΣM_A: 8R_B = 20 × 2 + 40 × 4 = 200, so R_B = **25 kN**, R_A = 60 − 25 = **35 kN**. Shear: V = 35 − 5x up to 2 m (25 kN just left of the load), 5 kN just right of it, then V = 5 − 5(x − 2), which is zero at **x = 3 m**. M(3) = 35 × 3 − 20 × 1 − 5 × 3²/2 = 105 − 20 − 22.5 = **62.5 kN·m** (larger than M(2) = 70 − 10 = 60 kN·m under the point load). σ_max = 62.5/1.5 = **41.667 MPa**. Section at x = 5 m: V = 35 − 20 − 5 × 5 = **−10 kN**; M = 35 × 5 − 20 × 3 − 5 × 5²/2 = 175 − 60 − 62.5 = **52.5 kN·m**; σ = 52.5/1.5 = **35 MPa**.
- **Check 6, question idea.** L = 5 m, 12 kN at 2 m, 75 × 250 mm: R_B = 12 × 2/5 = **4.8 kN**, R_A = **7.2 kN**, M = 7.2 × 2 = **14.4 kN·m**, I = 75 × 250³/12 = 97.656 × 10⁶ mm⁴, σ = 14.4 × 10⁶ × 125/97.656 × 10⁶ = **18.432 MPa**.

```acceptance
[
  { "name": "central point load: PL/4 and σ = My/I", "params": { "beamType": "simple", "length": 6, "p1": 20, "p1At": 3, "p2": 0, "udl": 0, "sectionB": 100, "sectionD": 300 }, "run": "static",
    "expect": { "reactionA": { "value": 10, "absTol": 1e-9 }, "reactionB": { "value": 10, "absTol": 1e-9 }, "maxMoment": { "value": 30, "absTol": 1e-9 }, "maxMomentAt": { "value": 3, "absTol": 1e-9 }, "maxShear": { "value": 10, "absTol": 1e-9 }, "secondMoment": { "value": 225000000, "relTol": 1e-12 }, "maxStress": { "value": 20, "relTol": 1e-9 } } },
  { "name": "full-span UDL: wL²/8", "params": { "beamType": "simple", "length": 6, "p1": 0, "p2": 0, "udl": 10, "udlExtent": "full", "sectionB": 100, "sectionD": 300 }, "run": "static",
    "expect": { "reactionA": { "value": 30, "absTol": 1e-9 }, "reactionB": { "value": 30, "absTol": 1e-9 }, "maxMoment": { "value": 45, "absTol": 1e-9 }, "maxMomentAt": { "value": 3, "absTol": 1e-9 }, "maxShear": { "value": 30, "absTol": 1e-9 }, "maxStress": { "value": 30, "relTol": 1e-9 } } },
  { "name": "off-centre load: Pab/L", "params": { "beamType": "simple", "length": 6, "p1": 30, "p1At": 2, "p2": 0, "udl": 0, "sectionB": 100, "sectionD": 300 }, "run": "static",
    "expect": { "reactionA": { "value": 20, "absTol": 1e-9 }, "reactionB": { "value": 10, "absTol": 1e-9 }, "maxMoment": { "value": 40, "absTol": 1e-9 }, "maxMomentAt": { "value": 2, "absTol": 1e-9 }, "maxStress": { "value": 26.6666667, "relTol": 1e-8 } } },
  { "name": "cantilever end load: root moment PL", "params": { "beamType": "cantilever", "length": 3, "p1": 10, "p1At": 3, "p2": 0, "udl": 0, "sectionB": 100, "sectionD": 300 }, "run": "static",
    "expect": { "reactionA": { "value": 10, "absTol": 1e-9 }, "fixingMoment": { "value": 30, "absTol": 1e-9 }, "maxMoment": { "value": -30, "absTol": 1e-9 }, "maxShear": { "value": 10, "absTol": 1e-9 }, "maxStress": { "value": 20, "relTol": 1e-9 } } },
  { "name": "point load plus UDL: maximum where V = 0", "params": { "beamType": "simple", "length": 8, "p1": 20, "p1At": 2, "p2": 0, "udl": 5, "udlExtent": "full", "sectionB": 100, "sectionD": 300, "probeX": 5 }, "run": "static",
    "expect": { "reactionA": { "value": 35, "absTol": 1e-9 }, "reactionB": { "value": 25, "absTol": 1e-9 }, "maxMoment": { "value": 62.5, "absTol": 1e-9 }, "maxMomentAt": { "value": 3, "absTol": 1e-9 }, "maxStress": { "value": 41.6666667, "relTol": 1e-8 }, "shearAtX": { "value": -10, "absTol": 1e-9 }, "momentAtX": { "value": 52.5, "absTol": 1e-9 }, "stressAtX": { "value": 35, "relTol": 1e-9 } } },
  { "name": "question idea: timber beam 75 × 250", "params": { "beamType": "simple", "length": 5, "p1": 12, "p1At": 2, "p2": 0, "udl": 0, "sectionB": 75, "sectionD": 250 }, "run": "static",
    "expect": { "reactionA": { "value": 7.2, "absTol": 1e-9 }, "reactionB": { "value": 4.8, "absTol": 1e-9 }, "maxMoment": { "value": 14.4, "absTol": 1e-9 }, "maxStress": { "value": 18.432, "relTol": 1e-9 } } }
]
```
