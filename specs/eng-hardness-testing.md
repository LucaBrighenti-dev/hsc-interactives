---
id: eng-hardness-testing
title: "Hardness testing"
subject: eng
engine: materials
setup: hardness
priority: P2
status: draft            # stub → draft → approved (Gate B)
page: /interactives/engineering/hardness-testing.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Engineering Studies","version":"2011","area":"Personal and public transport","subtopic":"Engineering materials","year":12,"outcomes":["H1.2"],"url":"https://www.nsw.gov.au/education-and-training/nesa/curriculum/tas/engineering-studies-stage-6-2011","verified":true}
  - {"course":"Engineering Studies","version":"2026","focusArea":"Transport engineering and automation","subtopic":"Testing of engineering materials","year":12,"outcomes":["ES-12-02"],"url":"https://curriculum.nsw.edu.au/learning-areas/tas/engineering-studies-11-12-2026/content/year-12/fab1f95ed9","verified":true}
---
# Hardness testing

> Backlog summary: Rockwell, Brinell and Vickers indenters compared.

## Learning goal
Students compare the three common hardness tests: Brinell (a hard ball; hardness from the load and the indent's diameter), Vickers (a square diamond pyramid; from the load and the indent's diagonals) and Rockwell (a cone or ball; from the extra depth the indenter is pushed in). They calculate hardness numbers from measured indents, see that a smaller indent under the same load means a harder material, and choose a suitable test for a soft alloy, a hardened steel or a thin part.

Syllabus fit: 2011 Personal and Public Transport (testing of materials: hardness); 2026 Transport engineering and automation, Year 12, testing of engineering materials. Pitched at Stage 6: applying the Brinell and Vickers formulas, the Rockwell depth idea, choosing a test; no derivation of the formulas.

## What the student sees
Default view at 1920×1080, light projector theme:

- **Left half, the test in section:** the indenter (ball, pyramid or cone, drawn to scale) pressing into a test piece, with the load arrow labelled in kgf and N. A "Press" animation lowers the indenter, holds, and lifts it, leaving the impression. For Rockwell, the minor-load and major-load stages are shown with the depth gauge, and the permanent depth h is dimensioned.
- **Right half, the impression seen from above under a measuring microscope:** a circle (Brinell) or a square with its diagonals (Vickers), with a scale bar and the measured size dimensioned. A validity check for Brinell shows whether the impression lies between 0.24D and 0.6D, in words ("Valid impression" or "Too small: use a larger load").
- **Readouts** below, with the formula for the chosen method written out with the numbers substituted.
- **Footer:** assumptions.

Static setup: play, step and reset are hidden (the press animation is decoration).

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| method | Test | | | | | brinell | enum: `brinell`, `vickers`, `rockwell` |
| load | Test load F | kgf | 1 | 3000 | 1 | 3000 | Brinell and Vickers; 1 kgf = 9.80665 N |
| ballDiameter | Ball diameter D | mm | 1 | 10 | 0.5 | 10 | Brinell |
| indentDiameter | Impression diameter d | mm | 0.1 | 9 | 0.01 | 4 | Brinell |
| diagonal | Mean diagonal d | mm | 0.01 | 2 | 0.001 | 0.5 | Vickers |
| rockwellScale | Rockwell scale | | | | | C | enum: `C` (diamond cone, 150 kgf total), `B` (1/16 in ball, 100 kgf total) |
| depth | Permanent depth increase h | mm | 0 | 0.26 | 0.002 | 0.08 | Rockwell |

The materials engine has not published its `meta` yet; keys are listed under "Engine change requests" to reconcile. The formulas follow the engine's in-progress `model.js` (`brinellHardness`, `brinellDepth`, `brinellCheck`, `vickersHardness`, `vickersDepth`, `rockwellHardness`, `ROCKWELL_SCALES`).

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | Brinell, 3000 kgf, D = 10 mm, d = 4 mm | a medium-strength steel: about 229 HB |
| soft-alloy | Brinell, 500 kgf, D = 10 mm, d = 2.5 mm | an aluminium alloy needs a smaller load |
| too-small | Brinell, 3000 kgf, D = 10 mm, d = 2 mm | an invalid impression: the material is too hard for this test |
| vickers | Vickers, 30 kgf, d = 0.5 mm | a tiny impression: thin parts and hard surfaces |
| rockwell-c | Rockwell C, h = 0.08 mm | a hardened steel gear: 60 HRC |
| rockwell-b | Rockwell B, h = 0.10 mm | a softer steel or brass: 80 HRB |

No preset uses g (the test loads are given in kgf, as hardness formulas use).

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| hardness | Hardness number (HB, HV or HRC/HRB) | | 4 |
| indentDepth | Depth of the impression | mm | 3 |
| validIndent | Brinell impression valid (1 yes, 0 no) | | 1 |
| loadNewtons | Test load | N | 4 |

## Assumptions shown on stage
- Ideal indenters (rigid ball, perfect pyramid and cone); flat, smooth test surface
- Brinell and Vickers numbers in kgf/mm², as the standards define them
- Rockwell number = N − h/0.002 mm (N = 100 for C, 130 for B)
- Brinell valid when the impression is 0.24D to 0.6D across

## Try this (3–5 predict, observe, explain prompts)
1. Predict: with the same load, will a harder material leave a bigger or smaller impression? Observe by changing d in the default preset.
2. Observe: in **too-small**, the hardness number is very high. Why is the test not trusted here, and what would you change?
3. Predict, then observe: double the Vickers load and adjust the diagonal so the hardness stays the same. By what factor does the diagonal grow?
4. Explain: why is a Rockwell test faster in a factory than a Brinell test?
5. Observe: which test leaves the smallest mark on a finished part, and why does that matter for a car's crankshaft?

## Teacher notes outline
- Misconceptions to target: a bigger hardness number means a bigger dent (the opposite); all hardness scales can be compared directly (conversions are empirical and approximate); hardness and toughness are the same; the Brinell test suits every material (too hard a material makes too small an impression, and the ball can deform).
- 10-minute lesson flow: (1) Brinell by hand for the default; (2) the validity window; (3) Vickers for a small, hard part; (4) Rockwell as a depth test; (5) choosing a test for a soft alloy wheel, a hardened gear and a thin sheet; (6) for steels, tensile strength is roughly 3.45 × HB (Callister and Rethwisch), so a 229 HB steel has a UTS of about 790 MPa.
- Original HSC-style question idea: a Brinell test on a brake caliper casting uses a 10 mm ball and 3000 kgf and leaves a 4.5 mm impression; a Vickers test on a hardened bolt uses 30 kgf and gives a mean diagonal of 0.40 mm. Find both hardness numbers and say which part is harder. Worked solution: HB = 6000/(π × 10 × (10 − √(100 − 20.25))) = 6000/(31.416 × 1.06971) = 178.5 HB; HV = 1.8544 × 30/0.16 = 347.7 HV; the bolt is harder.

## Accessibility notes
Each indenter has its shape drawn and named in text; the measured size is a dimension line with its value; the validity verdict is written in words, not only coloured. All controls are keyboard operable. Stage label: "Brinell test: 3000 kilogram-force on a 10 millimetre ball leaves a 4 millimetre impression. Hardness 229 HB; impression valid."

## Engine change requests
- Keys to reconcile with the materials engine's `meta` (not yet published): params `method`, `load`, `ballDiameter`, `indentDiameter`, `diagonal`, `rockwellScale`, `depth`; outputs `hardness`, `indentDepth`, `validIndent`, `loadNewtons`. The engine's model already has every formula.
- Optional: a material picker that places a typical impression for a chosen alloy (it would need hardness values with sources in the data rows), and an estimated UTS for steels (3.45 × HB).

## Acceptance
Every number below comes from the formula and hand calculation shown here (guide §9.1 checks: Vickers 30 kgf, 0.5 mm → 222.5 HV; Brinell 3000 kgf, 10 mm, 4 mm → 228.8 HB). Formulas: HB = 2F/(πD(D − √(D² − d²))); impression depth h = (D − √(D² − d²))/2; HV = 1.8544F/d² (1.8544 = 2 sin 68°); Vickers depth = d/(2√2 tan 68°) = d/7.0006; HR = N − h/0.002 with N = 100 (C) or 130 (B); 1 kgf = 9.80665 N.

- **Check 1, Brinell default.** √(100 − 16) = √84 = 9.165151. D − √(D² − d²) = 0.834849. HB = 6000/(π × 10 × 0.834849) = 6000/26.22755 = **228.767 HB**. Depth = 0.834849/2 = **0.417424 mm**. 0.24D = 2.4 mm ≤ 4 mm ≤ 0.6D = 6 mm, so **valid (1)**. Load = 3000 × 9.80665 = **29 419.95 N**.
- **Check 2, soft alloy.** 500 kgf, D = 10 mm, d = 2.5 mm: √(100 − 6.25) = 9.682458; D − √ = 0.317542; HB = 1000/(π × 10 × 0.317542) = 1000/9.975876 = **100.242 HB**; valid (2.4 ≤ 2.5 ≤ 6): **1**.
- **Check 3, too small.** d = 2 mm: √96 = 9.797959; D − √ = 0.202041; HB = 6000/(π × 10 × 0.202041) = **945.28 HB**, but 2 mm < 2.4 mm, so **not valid (0)**.
- **Check 4, Vickers.** HV = 1.8544 × 30/0.5² = 55.632/0.25 = **222.528 HV**; depth = 0.5/7.000603 = **0.0714224 mm**.
- **Check 5, Rockwell C and B.** HRC = 100 − 0.08/0.002 = 100 − 40 = **60 HRC**. HRB = 130 − 0.10/0.002 = 130 − 50 = **80 HRB**.
- **Check 6, question idea.** HB: √(100 − 20.25) = 8.930286; D − √ = 1.069714; HB = 6000/(π × 10 × 1.069714) = **178.539 HB**. HV = 1.8544 × 30/0.16 = **347.70 HV**.

```acceptance
[
  { "name": "Brinell 3000 kgf, 10 mm ball, 4 mm impression", "params": { "method": "brinell", "load": 3000, "ballDiameter": 10, "indentDiameter": 4 }, "run": "static",
    "expect": { "hardness": { "value": 228.7671434, "relTol": 1e-8 }, "indentDepth": { "value": 0.417424305, "relTol": 1e-8 }, "validIndent": { "value": 1, "absTol": 1e-12 }, "loadNewtons": { "value": 29419.95, "relTol": 1e-9 } } },
  { "name": "Brinell soft alloy at 500 kgf", "params": { "method": "brinell", "load": 500, "ballDiameter": 10, "indentDiameter": 2.5 }, "run": "static",
    "expect": { "hardness": { "value": 100.2419373, "relTol": 1e-8 }, "validIndent": { "value": 1, "absTol": 1e-12 } } },
  { "name": "Brinell impression too small", "params": { "method": "brinell", "load": 3000, "ballDiameter": 10, "indentDiameter": 2 }, "run": "static",
    "expect": { "hardness": { "value": 945.28291, "relTol": 1e-7 }, "validIndent": { "value": 0, "absTol": 1e-12 } } },
  { "name": "Vickers 30 kgf, 0.5 mm diagonal", "params": { "method": "vickers", "load": 30, "diagonal": 0.5 }, "run": "static",
    "expect": { "hardness": { "value": 222.528, "relTol": 1e-4 }, "indentDepth": { "value": 0.07142242, "relTol": 1e-6 } } },
  { "name": "Rockwell C: h = 0.08 mm", "params": { "method": "rockwell", "rockwellScale": "C", "depth": 0.08 }, "run": "static",
    "expect": { "hardness": { "value": 60, "absTol": 1e-9 } } },
  { "name": "Rockwell B: h = 0.10 mm", "params": { "method": "rockwell", "rockwellScale": "B", "depth": 0.1 }, "run": "static",
    "expect": { "hardness": { "value": 80, "absTol": 1e-9 } } },
  { "name": "question idea: caliper casting", "params": { "method": "brinell", "load": 3000, "ballDiameter": 10, "indentDiameter": 4.5 }, "run": "static",
    "expect": { "hardness": { "value": 178.5391715, "relTol": 1e-8 } } },
  { "name": "question idea: hardened bolt", "params": { "method": "vickers", "load": 30, "diagonal": 0.4 }, "run": "static",
    "expect": { "hardness": { "value": 347.7, "relTol": 1e-4 } } }
]
```
