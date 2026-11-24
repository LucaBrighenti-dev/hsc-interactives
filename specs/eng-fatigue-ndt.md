---
id: eng-fatigue-ndt
title: "Fatigue and NDT methods"
subject: eng
engine: materials
setup: fatigue-ndt
priority: P2
status: draft            # stub → draft → approved (Gate B)
page: /interactives/engineering/fatigue-ndt.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Engineering Studies","version":"2011","area":"Aeronautical engineering","subtopic":"Engineering materials","year":12,"outcomes":["H1.2"],"url":"https://www.nsw.gov.au/education-and-training/nesa/curriculum/tas/engineering-studies-stage-6-2011","verified":true}
  - {"course":"Engineering Studies","version":"2026","focusArea":"Aeronautical and aerospace engineering","subtopic":"Degradation of materials","year":12,"outcomes":["ES-12-03"],"url":"https://curriculum.nsw.edu.au/learning-areas/tas/engineering-studies-11-12-2026/content/year-12/fa66e557c0","verified":true}
---
# Fatigue and NDT methods

> Backlog summary: Crack growth to failure; visual, dye penetrant, X-ray, ultrasonic and magnetic particle testing compared.

## Learning goal
Students see fatigue as the growth of a crack under repeated loading: a crack starts at a stress raiser, grows slowly for most of the component's life, then rapidly, and the part fractures suddenly when the crack reaches a critical length. They read S–N curves (steels have an endurance limit; aluminium alloys do not) and compare the five non-destructive testing methods by what flaws they find and in which materials, which is why aircraft are inspected on a schedule that catches cracks while they are still small.

Syllabus fit: 2011 Aeronautical Engineering (fatigue, crack propagation, non-destructive testing); 2026 Aeronautical and aerospace engineering, Year 12, degradation of materials. Pitched at Stage 6: qualitative crack growth with a schematic curve, reading S–N curves, choosing an NDT method; no fracture mechanics calculations asked of students. Pairs with Luca's VR NDT hangar station.

## What the student sees
Default view at 1920×1080, light projector theme, three panels chosen with **View** (all three fit side by side on wide screens):

- **Crack growth:** a plate with a hole (a rivet hole as the stress raiser) under a cyclic load drawn as a small oscillating arrow pair. Pressing play runs a time-lapse of the component's life: a crack grows from the edge of the hole, slowly at first and then rapidly, until the plate fractures with a "FRACTURE" tag. Beside it, a graph of crack length (as a fraction of the critical length) against life used (%) draws live, with stage labels "initiation", "growth" and "fracture", and a dashed line at the smallest crack the chosen NDT method could find.
- **S–N curves:** stress amplitude ÷ UTS against cycles to failure on a logarithmic axis from 10³ to 10⁹. The steel curve levels off at its endurance limit (labelled); the aluminium curve keeps falling (labelled "no endurance limit"). A movable marker reads the curve at a chosen number of cycles. Both curves are labelled "schematic".
- **NDT methods:** a matrix of the five methods against four flaw types (surface crack, crack just below the surface, internal void, delamination) for the chosen material (steel, aluminium alloy, carbon fibre composite). Each cell shows "Yes", "Partly" or "No" in words with a symbol (✓, ~, ✕) and a one-line reason; the selected method and flaw are ringed, and a short card explains how the method works and its limits.
- **Footer:** assumptions, including "schematic curves, not data for a specific alloy".

The crack-growth time-lapse completes at fracture.

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| view | View | | | | | crack | enum: `crack`, `sn`, `ndt` |
| initialCrack | Starting crack length a₀ | mm | 0.1 | 5 | 0.1 | 0.5 | crack growth |
| criticalCrack | Critical crack length a_c | mm | 5 | 50 | 1 | 20 | crack growth |
| runTime | Time-lapse length | s | 5 | 30 | 1 | 10 | crack growth; the plate fractures at this time |
| snMaterial | S–N curve | | | | | steel | enum: `steel`, `aluminium` |
| snLogCycles | Cycles to failure, log₁₀ N | | 3 | 9 | 0.1 | 6 | S–N marker |
| ndtMethod | NDT method | | | | | dye | enum: `visual`, `dye`, `magnetic`, `ultrasonic`, `xray` |
| ndtFlaw | Flaw | | | | | surface-crack | enum: `surface-crack`, `subsurface-crack`, `internal-void`, `delamination` |
| ndtMaterial | Material | | | | | steel | enum: `steel`, `aluminium`, `cfrp` |
| timeScale | Playback speed | × | 0.25 | 2 | 0.25 | 1 | |

The materials engine has not published its `meta` yet; keys are listed under "Engine change requests" to reconcile. The method, flaw and material ids and the formulas follow the engine's in-progress `model.js` (`crackLength`, `createFatigueRun`, `snSchematic`, `ndtResult`).

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | crack view, a₀ = 0.5 mm, a_c = 20 mm, 10 s | most of the life is spent while the crack is tiny |
| sn-steel | S–N view, steel, log N = 6 | the endurance limit at about 10⁶ cycles |
| sn-aluminium | S–N view, aluminium, log N = 7 | no endurance limit: aircraft parts have a finite life |
| ndt-steel-crack | NDT view, magnetic particle, crack just below the surface, steel | the classic landing-gear check |
| ndt-composite | NDT view, ultrasonic, delamination, CFRP | how composite skins are inspected |

No preset uses g.

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| lifeUsed | Life used | % | 3 |
| crackRatio | Crack length ÷ critical length | | 3 |
| crackLength | Crack length | mm | 3 |
| t | Time-lapse time | s | 3 |
| snRatio | Stress amplitude ÷ UTS at the marker | | 3 |
| ndtLevel | Can the method find the flaw? (2 yes, 1 partly, 0 no) | | 1 |

## Assumptions shown on stage
- Schematic curves for teaching, not data for a specific alloy
- Crack growth follows the Paris law with exponent 3 under constant-amplitude loading
- Steel S–N: 0.9 × UTS at 10³ cycles falling to an endurance limit of 0.5 × UTS at 10⁶ (a common rule of thumb)
- NDT capabilities simplified from general practice

## Try this (3–5 predict, observe, explain prompts)
1. Predict: when half the component's life has passed, how long will the crack be compared with the critical length? Observe at 50%.
2. Observe: at what percentage of life does the crack reach a quarter of the critical length?
3. Predict, then observe: in the NDT matrix, which method can find a crack just below the surface of a steel part, but not of an aluminium one?
4. Explain: aluminium has no endurance limit. What does that mean for how long an aircraft wing can be flown?
5. Observe: which single method finds a delamination in carbon fibre composite, and why does X-ray miss it?

## Teacher notes outline
- Misconceptions to target: fatigue cracks grow at a steady rate (they accelerate); a part that has passed an inspection is safe forever (the next inspection must come before the crack can grow to critical); stress below the yield strength cannot cause failure (cyclic stress well below yield can); one NDT method finds everything (each has blind spots: material, depth, orientation).
- 10-minute lesson flow: (1) run the crack time-lapse and pause at 50% and 90% of life; (2) why inspections must find small cracks; (3) S–N curves: steel against aluminium; (4) the NDT matrix: pick a method for a landing-gear leg (steel), a wing skin (aluminium) and a composite tail; (5) link to the damage-tolerant design idea in aircraft (inspect at least twice between the detectable and the critical crack size).
- Original HSC-style question idea: an aluminium wing skin and a steel landing-gear leg must be inspected for fatigue cracks. Recommend an NDT method for each, justify the choice, and explain why the wing has a finite fatigue life while the gear leg could be designed for an unlimited one. Worked answer outline: wing skin: eddy-current or dye penetrant for surface cracks at rivet holes, ultrasonic for hidden cracks (magnetic particle cannot work on aluminium); gear leg: magnetic particle for surface and near-surface cracks; aluminium alloys have no endurance limit, but steel below its endurance limit (about half its UTS) can survive indefinitely.

## Accessibility notes
NDT cells use words ("Yes", "Partly", "No") and symbols (✓, ~, ✕) as well as shading, plus a reason in text. The crack is drawn as a dark line with its length labelled; stage names are text labels on the graph. S–N curves are labelled at their ends and differ by line style (steel solid, aluminium dashed). All controls are keyboard operable; Space plays and pauses. Stage label: "Fatigue crack growing from a hole: … percent of life used, crack … millimetres of a critical … millimetres."

## Engine change requests
- Keys to reconcile with the materials engine's `meta` (not yet published): params `view`, `initialCrack`, `criticalCrack`, `runTime`, `snMaterial`, `snLogCycles`, `ndtMethod`, `ndtFlaw`, `ndtMaterial`, `timeScale`; outputs `lifeUsed`, `crackRatio`, `crackLength`, `t`, `snRatio`, `ndtLevel`. The engine's `createFatigueRun({ runTime, a0, ac })` already reports `t`, `lifeUsed` and `crackRatio`; `crackLength` (= crackRatio × a_c), `snRatio` (from `snSchematic`) and `ndtLevel` (2, 1, 0 from `ndtResult`'s yes, partial, no) are new outputs.
- The NDT method list in the engine has the five methods of this page; eddy-current testing could be added later (it is the usual check for cracks at aluminium rivet holes).

## Acceptance
Every number below comes from the formula and hand calculation shown here. The engine steps the time-lapse by 1/120 s, so a 10 s run has 1200 steps and life used = steps/1200.

Crack growth (Paris law with ΔK ∝ √a and exponent 3): da/dN = C′a^1.5, so a^−½ falls linearly with cycles: a^−½ = a₀^−½ − kN. Choosing the life so that a reaches a_c when the life fraction φ = 1 gives a(φ) = a₀/[1 − φ(1 − √(a₀/a_c))]². With a₀ = 0.5 mm and a_c = 20 mm, √(a₀/a_c) = √0.025 = 0.158114, so 1 − √(a₀/a_c) = 0.841886.

- **Check 1, half the life.** 600 steps: φ = 0.5, life used **50%**, t = **5 s**. a = 0.5/(1 − 0.5 × 0.841886)² = 0.5/0.579057² = 0.5/0.335307 = **1.49117 mm**, so a/a_c = **0.0745586**: after half the life the crack is only 7.5% of the critical length.
- **Check 2, 90% of the life.** 1080 steps: φ = 0.9: a = 0.5/(1 − 0.9 × 0.841886)² = 0.5/0.242303² = 0.5/0.0587107 = **8.51636 mm**, a/a_c = **0.425818**.
- **Check 3, fracture.** The run completes at φ = 1: a = 0.5/0.158114² = 0.5/0.025 = **20 mm**, a/a_c = **1**, life used **100%**.
- **Check 4, S–N curves (schematic).** Steel: σ/UTS = 0.9 × (0.5/0.9)^((log N − 3)/3) for 3 ≤ log N ≤ 6, then 0.5. At log N = 4.5: 0.9 × (0.5556)^0.5 = 0.9 × 0.745356 = **0.670820**; at log N = 7: **0.5** (the endurance limit). Aluminium: σ/UTS = 0.75 × 10^(−0.07(log N − 3)); at log N = 7: 0.75 × 10^(−0.28) = 0.75 × 0.524807 = **0.393606**.
- **Check 5, NDT matrix.** Magnetic particle needs a ferromagnetic part, so a surface crack in aluminium: **0** (no). Dye penetrant on a surface crack in steel: **2** (yes). Ultrasonic on a delamination in CFRP: **2** (yes, a strong echo from the gap). X-ray on a delamination in CFRP: **0** (a thin gap across the beam removes almost no material). X-ray on a surface crack in steel: **1** (partly: only if the crack lies along the beam).

```acceptance
[
  { "name": "half the life: the crack is still small", "params": { "view": "crack", "initialCrack": 0.5, "criticalCrack": 20, "runTime": 10 }, "run": { "steps": 600 },
    "expect": { "lifeUsed": { "value": 50, "absTol": 1e-9 }, "t": { "value": 5, "absTol": 1e-9 }, "crackRatio": { "value": 0.0745585519, "relTol": 1e-8 }, "crackLength": { "value": 1.491171038, "relTol": 1e-8 } } },
  { "name": "90% of the life", "params": { "view": "crack", "initialCrack": 0.5, "criticalCrack": 20, "runTime": 10 }, "run": { "steps": 1080 },
    "expect": { "lifeUsed": { "value": 90, "absTol": 1e-9 }, "crackLength": { "value": 8.516364347, "relTol": 1e-8 }, "crackRatio": { "value": 0.4258182174, "relTol": 1e-8 } } },
  { "name": "fracture at the critical length", "params": { "view": "crack", "initialCrack": 0.5, "criticalCrack": 20, "runTime": 10 }, "run": "complete",
    "expect": { "lifeUsed": { "value": 100, "absTol": 1e-9 }, "crackRatio": { "value": 1, "absTol": 1e-9 } } },
  { "name": "steel S–N at 10^4.5 cycles", "params": { "view": "sn", "snMaterial": "steel", "snLogCycles": 4.5 }, "run": "static",
    "expect": { "snRatio": { "value": 0.6708203932, "relTol": 1e-9 } } },
  { "name": "steel endurance limit beyond 10^6", "params": { "view": "sn", "snMaterial": "steel", "snLogCycles": 7 }, "run": "static",
    "expect": { "snRatio": { "value": 0.5, "relTol": 1e-12 } } },
  { "name": "aluminium keeps falling", "params": { "view": "sn", "snMaterial": "aluminium", "snLogCycles": 7 }, "run": "static",
    "expect": { "snRatio": { "value": 0.3936055952, "relTol": 1e-9 } } },
  { "name": "magnetic particle cannot test aluminium", "params": { "view": "ndt", "ndtMethod": "magnetic", "ndtFlaw": "surface-crack", "ndtMaterial": "aluminium" }, "run": "static",
    "expect": { "ndtLevel": { "value": 0, "absTol": 1e-12 } } },
  { "name": "dye penetrant finds a surface crack in steel", "params": { "view": "ndt", "ndtMethod": "dye", "ndtFlaw": "surface-crack", "ndtMaterial": "steel" }, "run": "static",
    "expect": { "ndtLevel": { "value": 2, "absTol": 1e-12 } } },
  { "name": "ultrasonic finds a delamination in CFRP", "params": { "view": "ndt", "ndtMethod": "ultrasonic", "ndtFlaw": "delamination", "ndtMaterial": "cfrp" }, "run": "static",
    "expect": { "ndtLevel": { "value": 2, "absTol": 1e-12 } } },
  { "name": "X-ray misses a delamination", "params": { "view": "ndt", "ndtMethod": "xray", "ndtFlaw": "delamination", "ndtMaterial": "cfrp" }, "run": "static",
    "expect": { "ndtLevel": { "value": 0, "absTol": 1e-12 } } },
  { "name": "X-ray only partly finds a surface crack", "params": { "view": "ndt", "ndtMethod": "xray", "ndtFlaw": "surface-crack", "ndtMaterial": "steel" }, "run": "static",
    "expect": { "ndtLevel": { "value": 1, "absTol": 1e-12 } } }
]
```
