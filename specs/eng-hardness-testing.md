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
Students compare the three common hardness tests: Brinell (a hard ball; hardness from the load and the indent's diameter), Vickers (a square diamond pyramid; from the load and the indent's diagonals) and Rockwell (a cone or ball; from the extra depth the indenter is pushed in). They calculate hardness numbers from measured indents, see that a smaller indent under the same load means a harder material, learn that each test is only valid within set limits, and choose a suitable test for a soft alloy, a hardened steel or a thin part.

Syllabus fit: 2011 Personal and Public Transport (testing of materials: hardness); 2026 Transport engineering and automation, Year 12, testing of engineering materials. Pitched at Stage 6: applying the Brinell and Vickers formulas, the Rockwell depth idea, test validity, choosing a test; no derivation of the formulas.

## What the student sees
Default view at 1920×1080, light projector theme:

- **Left half, the test in section:** the indenter (ball, pyramid or cone, drawn to scale) pressing into a test piece, with the test force labelled in kgf and N. A "Press" animation lowers the indenter, holds, and lifts it, leaving the impression. For Rockwell, the preliminary (10 kgf) and total force stages are shown with the depth gauge, and the permanent depth increase h is dimensioned.
- **Right half, the impression seen from above under a measuring microscope:** a circle (Brinell) or a square with its diagonals (Vickers), with a scale bar and the measured size dimensioned.
- **Validity panel:** each rule for the chosen test with a tick or a cross and a sentence in words, for example "Impression 4.00 mm: inside 0.24D–0.6D (2.40–6.00 mm)", "Force–diameter ratio 30: standard", or "60 HRC: inside the C scale's range (20–70 HRC)". When a rule fails, the hardness readout shows "—" and the panel says what to change (see the model).
- **Readouts** below, with the formula for the chosen method written out with the numbers substituted.
- **Footer:** assumptions, including the standards the formulas come from.

Static setup: play, step and reset are hidden (the press animation is decoration).

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| method | Test | | | | | brinell | enum: `brinell`, `vickers`, `rockwell` |
| ballDiameter | Brinell ball diameter D | mm | | | | 10 | enum: `10`, `5`, `2.5`, `1` (the standard ball sizes) |
| brinellRatio | Brinell force–diameter ratio F/D² | kgf/mm² | | | | 30 | enum: `30` (steels, cast iron), `10` (copper alloys, aluminium alloys), `5` (aluminium, softer alloys), `2.5` (very soft metals); the test force is F = ratio × D² kgf (3000 kgf for a 10 mm ball at 30) |
| indentDiameter | Impression diameter d | mm | 0.1 | 9 | 0.01 | 4 | Brinell |
| vickersLoad | Vickers test force | kgf | 1 | 100 | 1 | 30 | Vickers (HV1 to HV100) |
| diagonal | Mean diagonal d | mm | 0.02 | 2 | 0.001 | 0.5 | Vickers |
| rockwellScale | Rockwell scale | | | | | C | enum: `C` (120° diamond cone, 150 kgf total), `B` (1/16 in ball, 100 kgf total) |
| depth | Permanent depth increase h | mm | 0.02 | 0.26 | 0.002 | 0.08 | Rockwell |

Each method has its own force, so switching the method never carries a 3000 kgf Brinell force into a Vickers test. The materials engine has not published its `meta` yet; keys are listed under "Engine change requests" to reconcile. The formulas follow the engine's in-progress `model.js` (`brinellHardness`, `brinellDepth`, `brinellCheck`, `vickersHardness`, `vickersDepth`, `rockwellHardness`, `ROCKWELL_SCALES`).

## Model and validity rules
- Brinell (ISO 6506-1, ASTM E10): F = ratio × D² (kgf); HBW = 2F/(πD(D − √(D² − d²))); impression depth h = (D − √(D² − d²))/2. The test is valid only when 0.24D ≤ d ≤ 0.6D and HBW ≤ 650 (the limit for a tungsten-carbide ball). If d ≥ D there is no answer: the stage says "The impression can't be as wide as the ball" and the hardness and depth readouts show "—". A failed rule sets `validIndent` to 0 and the panel names the fix ("Use a lower force–diameter ratio", "Use a larger ball").
- Vickers (ISO 6507-1, ASTM E92): HV = 1.8544F/d², where 1.8544 = 2 sin 68° from the 136° pyramid; depth = d/(2√2 tan 68°) ≈ d/7.0006. A result above 2000 HV is flagged in words as "harder than common engineering materials: check the diagonal".
- Rockwell (ISO 6508-1, ASTM E18): HR = N − h/0.002 mm, with N = 100 for the C scale and 130 for the B scale; preliminary force 10 kgf, total force 150 kgf (C) or 100 kgf (B). A result outside the scale's range (20–70 HRC; 10–100 HRB) shows "—" and the words "outside the range of the C scale: use another test".
- Forces in newtons: F (N) = F (kgf) × 9.80665. For Rockwell, `loadNewtons` is the total force and `indentDepth` is h.

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | Brinell, 10 mm ball, ratio 30 (3000 kgf), d = 4 mm | a medium-strength steel: about 229 HB |
| same-ratio | Brinell, 5 mm ball, ratio 30 (750 kgf), d = 2 mm | the same F/D² and d/D give the same hardness |
| soft-alloy | Brinell, 10 mm ball, ratio 5 (500 kgf), d = 2.5 mm | an aluminium alloy needs a lower ratio |
| too-small | Brinell, 10 mm ball, ratio 30, d = 2 mm | invalid: the impression is under 0.24D and the number (945) is above the 650 HBW limit |
| vickers | Vickers, 30 kgf, d = 0.5 mm | a tiny impression: thin parts and hard surfaces |
| rockwell-c | Rockwell C, h = 0.08 mm | a hardened steel gear: 60 HRC |
| rockwell-b | Rockwell B, h = 0.10 mm | a softer steel or brass: 80 HRB |

No preset uses g (the test forces are given in kgf, as the hardness formulas use).

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| hardness | Hardness number (HBW, HV or HRC/HRB) | | 4 |
| indentDepth | Depth of the impression (Rockwell: h) | mm | 3 |
| validIndent | Test valid (1 yes, 0 no) | | integer |
| loadNewtons | Test force (Rockwell: total force) | N | 4 |

## Assumptions shown on stage
- Formulas and limits from ISO 6506-1 (Brinell), ISO 6507-1 (Vickers) and ISO 6508-1 (Rockwell); ASTM E10, E92 and E18 are equivalent
- Ideal indenters (carbide ball, 136° diamond pyramid, 120° diamond cone); flat, smooth test surface
- Brinell and Vickers numbers in kgf/mm², as the standards define them
- Rockwell number = N − h/0.002 mm (N = 100 for C, 130 for B)

## Try this (3–5 predict, observe, explain prompts)
1. Predict: with the same force, will a harder material leave a bigger or smaller impression? Observe by changing d in the default preset.
2. Observe: in **too-small**, which validity rules fail, and what would you change to make the test valid?
3. Predict, then observe: in **same-ratio**, the ball and force are both smaller. Will the hardness number change?
4. Explain: why is a Rockwell test faster in a factory than a Brinell test?
5. Observe: which test leaves the smallest mark on a finished part, and why does that matter for a car's crankshaft?

## Teacher notes outline
- Misconceptions to target: a bigger hardness number means a bigger dent (the opposite); all hardness scales can be compared directly (conversions are empirical and approximate); hardness and toughness are the same; any force and ball will do (the force–diameter ratio and the impression size must fall in the standard's window, or the number can't be trusted).
- 10-minute lesson flow: (1) Brinell by hand for the default; (2) the validity window and the force–diameter ratio; (3) geometric similarity (**same-ratio**); (4) Vickers for a small, hard part; (5) Rockwell as a depth test and its scale ranges; (6) choosing a test for a soft alloy wheel, a hardened gear and a thin sheet; for steels, tensile strength is roughly 3.45 × HB (Callister and Rethwisch, *Materials Science and Engineering: An Introduction*), so a 229 HB steel has a UTS of about 790 MPa.
- Original HSC-style question idea: a Brinell test on a brake caliper casting uses a 10 mm ball and 3000 kgf and leaves a 4.5 mm impression; a Vickers test on a hardened bolt uses 30 kgf and gives a mean diagonal of 0.40 mm. Find both hardness numbers, check the Brinell impression is valid, and say which part is harder. Worked solution: HB = 6000/(π × 10 × (10 − √(100 − 20.25))) = 6000/(31.416 × 1.06971) = 178.5 HB (4.5 mm lies within 2.4–6.0 mm, so valid); HV = 1.8544 × 30/0.16 = 347.7 HV; the bolt is harder.

## Accessibility notes
Each indenter has its shape drawn and named in text; the measured size is a dimension line with its value; every validity rule is a sentence with a tick or a cross, not only a colour. All controls are keyboard operable. Stage label: "Brinell test: 3000 kilogram-force on a 10 millimetre ball leaves a 4 millimetre impression. Hardness 229 HBW; test valid."

## Engine change requests
- Keys to reconcile with the materials engine's `meta` (not yet published): params `method`, `ballDiameter`, `brinellRatio`, `indentDiameter`, `vickersLoad`, `diagonal`, `rockwellScale`, `depth`; outputs `hardness`, `indentDepth`, `validIndent` (`integer: true`), `loadNewtons`. The engine's model has the formulas; the validity rules above (force–diameter ratio, the 0.24D–0.6D window, d < D, the 650 HBW limit, the Rockwell scale ranges and the Vickers plausibility flag) are new.
- Optional: a material picker that places a typical impression for a chosen alloy (it would need hardness values with sources in the data rows), and an estimated UTS for steels (3.45 × HB).

## Acceptance
Every number below comes from the formula and hand calculation shown here (guide §9.1 checks: Vickers 30 kgf, 0.5 mm → 222.5 HV; Brinell 3000 kgf, 10 mm, 4 mm → 228.8 HB). Formulas as in the model above, from ISO 6506-1, ISO 6507-1 and ISO 6508-1; 1 kgf = 9.80665 N.

- **Check 1, Brinell default.** F = 30 × 10² = 3000 kgf. √(100 − 16) = √84 = 9.165151. D − √(D² − d²) = 0.834849. HB = 6000/(π × 10 × 0.834849) = 6000/26.22755 = **228.767 HBW**. Depth = 0.834849/2 = **0.417424 mm**. 0.24D = 2.4 mm ≤ 4 mm ≤ 0.6D = 6 mm, the ratio is standard and 228.8 ≤ 650, so **valid (1)**. Force = 3000 × 9.80665 = **29 419.95 N**.
- **Check 2, geometric similarity.** 5 mm ball at ratio 30: F = 30 × 25 = 750 kgf; d = 2 mm (0.4D, as before). √(25 − 4) = 4.582576; D − √ = 0.417424; HB = 1500/(π × 5 × 0.417424) = 1500/6.556886 = **228.767 HBW**, the same as check 1; valid (1.2 ≤ 2 ≤ 3 mm): **1**.
- **Check 3, soft alloy.** 10 mm ball at ratio 5: F = 500 kgf, d = 2.5 mm: √(100 − 6.25) = 9.682458; D − √ = 0.317542; HB = 1000/(π × 10 × 0.317542) = 1000/9.975876 = **100.242 HBW**; valid (2.4 ≤ 2.5 ≤ 6): **1**.
- **Check 4, too small.** d = 2 mm with 3000 kgf on 10 mm: √96 = 9.797959; D − √ = 0.202041; HB = 6000/(π × 10 × 0.202041) = **945.28**, but 2 mm < 2.4 mm and 945 > 650, so **not valid (0)**.
- **Check 5, Vickers.** HV = 1.8544 × 30/0.5² = 55.632/0.25 = **222.528 HV**; depth = 0.5/7.000603 = **0.0714224 mm**; force 30 × 9.80665 = **294.20 N**.
- **Check 6, Rockwell C and B.** HRC = 100 − 0.08/0.002 = 100 − 40 = **60 HRC** (inside 20–70), total force 150 × 9.80665 = **1470.9975 N**, depth **0.08 mm**. HRB = 130 − 0.10/0.002 = 130 − 50 = **80 HRB** (inside 10–100), total force 100 × 9.80665 = **980.665 N**.
- **Check 7, question idea.** HB: √(100 − 20.25) = 8.930286; D − √ = 1.069714; HB = 6000/(π × 10 × 1.069714) = **178.539 HBW**, valid (2.4 ≤ 4.5 ≤ 6). HV = 1.8544 × 30/0.16 = **347.70 HV**.

```acceptance
[
  { "name": "Brinell 3000 kgf, 10 mm ball, 4 mm impression", "params": { "method": "brinell", "ballDiameter": "10", "brinellRatio": "30", "indentDiameter": 4 }, "run": "static",
    "expect": { "hardness": { "value": 228.7671434, "relTol": 1e-8 }, "indentDepth": { "value": 0.417424305, "relTol": 1e-8 }, "validIndent": { "value": 1, "absTol": 1e-12 }, "loadNewtons": { "value": 29419.95, "relTol": 1e-9 } } },
  { "name": "Brinell geometric similarity: 5 mm ball at the same ratio", "params": { "method": "brinell", "ballDiameter": "5", "brinellRatio": "30", "indentDiameter": 2 }, "run": "static",
    "expect": { "hardness": { "value": 228.7671434, "relTol": 1e-8 }, "validIndent": { "value": 1, "absTol": 1e-12 }, "loadNewtons": { "value": 7354.9875, "relTol": 1e-9 } } },
  { "name": "Brinell soft alloy at ratio 5", "params": { "method": "brinell", "ballDiameter": "10", "brinellRatio": "5", "indentDiameter": 2.5 }, "run": "static",
    "expect": { "hardness": { "value": 100.2419373, "relTol": 1e-8 }, "validIndent": { "value": 1, "absTol": 1e-12 } } },
  { "name": "Brinell impression too small and too hard", "params": { "method": "brinell", "ballDiameter": "10", "brinellRatio": "30", "indentDiameter": 2 }, "run": "static",
    "expect": { "validIndent": { "value": 0, "absTol": 1e-12 } } },
  { "name": "Vickers 30 kgf, 0.5 mm diagonal", "params": { "method": "vickers", "vickersLoad": 30, "diagonal": 0.5 }, "run": "static",
    "expect": { "hardness": { "value": 222.528, "relTol": 1e-4 }, "indentDepth": { "value": 0.07142242, "relTol": 1e-6 }, "loadNewtons": { "value": 294.1995, "relTol": 1e-9 } } },
  { "name": "Rockwell C: h = 0.08 mm", "params": { "method": "rockwell", "rockwellScale": "C", "depth": 0.08 }, "run": "static",
    "expect": { "hardness": { "value": 60, "absTol": 1e-9 }, "loadNewtons": { "value": 1470.9975, "relTol": 1e-9 }, "indentDepth": { "value": 0.08, "absTol": 1e-12 } } },
  { "name": "Rockwell B: h = 0.10 mm", "params": { "method": "rockwell", "rockwellScale": "B", "depth": 0.1 }, "run": "static",
    "expect": { "hardness": { "value": 80, "absTol": 1e-9 }, "loadNewtons": { "value": 980.665, "relTol": 1e-9 } } },
  { "name": "question idea: caliper casting", "params": { "method": "brinell", "ballDiameter": "10", "brinellRatio": "30", "indentDiameter": 4.5 }, "run": "static",
    "expect": { "hardness": { "value": 178.5391715, "relTol": 1e-8 }, "validIndent": { "value": 1, "absTol": 1e-12 } } },
  { "name": "question idea: hardened bolt", "params": { "method": "vickers", "vickersLoad": 30, "diagonal": 0.4 }, "run": "static",
    "expect": { "hardness": { "value": 347.7, "relTol": 1e-4 } } }
]
```
