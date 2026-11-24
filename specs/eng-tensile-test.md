---
id: eng-tensile-test
title: "Tensile test machine"
subject: eng
engine: materials
setup: tensile
priority: P1
status: draft            # stub → draft → approved (Gate B)
page: /interactives/engineering/tensile-test.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Engineering Studies","version":"2011","area":"Engineered Products","outcomes":[],"verified":false}
  - {"course":"Engineering Studies","version":"2026","focusArea":"Applied engineering analysis","year":11,"outcomes":[],"verified":false,"subtopic":"Mechanical strength of materials"}
---
# Tensile test machine

> Backlog summary: Load-extension to stress-strain for steel, copper, aluminium, polymer and ceramic; E, yield, UTS, toughness.

## Learning goal
Students run a virtual tensile test and turn the load–extension graph into a stress–strain graph (σ = F/A₀, ε = ΔL/L₀), then read off Young's modulus (the elastic slope), the yield strength (with the 0.2% offset where there is no sharp yield point), the ultimate tensile strength, the percentage elongation and the toughness (the area under the curve). They compare ductile metals, a polymer and a brittle ceramic, and see that specimen size changes the loads but not the material's stress–strain curve.

Syllabus fit: 2011 Engineered Products (tensile testing, stress–strain, properties of materials); 2026 Applied engineering analysis, Year 11, mechanical strength of materials (and Engineering materials). Pitched at Stage 6: reading properties from a graph, σ = F/A, ε = ΔL/L, E = σ/ε, toughness as an area.

## What the student sees
Default view at 1920×1080, light projector theme:

- **Left third, machine:** a universal testing machine drawn in outline with grips, the test specimen (round or rectangular) with its gauge length L₀ and cross-section marked, and an extensometer. As the test runs the crosshead moves up, the specimen stretches, a neck forms in ductile materials and draws along a polymer, and the specimen snaps at fracture with a "FRACTURE" tag. A brittle ceramic snaps with no visible neck.
- **Right two-thirds, graph:** the curve drawn live, either load (kN) against extension (mm) or stress (MPa) against strain (%), chosen with **Plot**. Labelled markers appear as the curve passes them: "yield" (the plateau for structural steel) or "0.2% proof" (with the dashed offset line when **Show offset line** is on), "UTS", "necking begins" and "fracture". When the test ends, the area under the curve is hatched and labelled "toughness".
- **Readouts** for the properties as they are measured, and the selected material's data source in small text.
- **Footer:** assumptions.

The test is a time-lapse: every material breaks after the same run time. The run completes at fracture.

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| material | Material | | | | | structural-steel | enum of the engine's data-row ids: `structural-steel`, `copper`, `aluminium-2024`, `hdpe`, `alumina` (this page's five), plus `high-tensile-steel`, `titanium-6al-4v`, `cfrp`, `grey-cast-iron` and `custom` |
| gaugeLength | Gauge length L₀ | mm | 25 | 100 | 5 | 50 | |
| section | Specimen section | | | | | round | enum: `round`, `rect` |
| diameter | Diameter d₀ | mm | 4 | 20 | 0.5 | 10 | round section |
| width | Width b | mm | 5 | 25 | 0.5 | 12.5 | rectangular section |
| thickness | Thickness t | mm | 1 | 10 | 0.5 | 3 | rectangular section |
| plot | Plot | | | | | stress-strain | enum: `load-extension`, `stress-strain` |
| showOffset | Show 0.2% offset line | | | | | on | boolean |
| runTime | Test time on screen | s | 5 | 30 | 1 | 10 | the specimen breaks at this time |
| timeScale | Playback speed | × | 0.25 | 2 | 0.25 | 1 | |

The materials engine has not published its `meta` yet; keys are listed under "Engine change requests" to reconcile. The material ids, the section and run-time inputs and the output names follow the engine's in-progress `data.js` and `model.js` (`createTensileRun`).

### Material data (typical or minimum values from the engine's data rows; each row carries its source)
| Id | Material | E (GPa) | Yield or 0.2% proof (MPa) | UTS (MPa) | Elongation after fracture (%) | Source (as recorded in the engine's `data.js`) |
| --- | --- | --- | --- | --- | --- | --- |
| structural-steel | Structural steel, AS/NZS 3679.1 Grade 300 | 200 | 300 (yield plateau) | 440 | 22 | AS/NZS 3679.1:2016 specified minimums; E from AS 4100:2020 |
| copper | Copper C11000, annealed | 117 | 69 | 221 | 45 | Copper Development Association, alloy C11000, temper OS050 |
| aluminium-2024 | Aluminium 2024-T3 | 73 | 345 | 483 | 18 | ASM Handbook Vol. 2 (1990), 2024-T3 sheet |
| hdpe | Polymer: HDPE | 1.25 | 32 (yield point) | 32 | 150 | AZoM "High Density Polyethylene – HDPE" (from PLASCAMS) |
| alumina | Ceramic: alumina, 99.5% Al₂O₃ (brittle) | 375 | none | 379 (fracture) | none | Accuratus Corporation, "Aluminum Oxide, Al2O3 Ceramic Properties" (flexural strength used as the fracture stress) |

Teaching values, not specifications. If the engine's data rows change, the acceptance numbers below must be recomputed with the same formulas.

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | structural steel, round, L₀ = 50 mm, d₀ = 10 mm, stress–strain | a ductile curve with a yield plateau |
| load-extension | default with plot = load-extension | the raw data before converting |
| thick-specimen | default with d₀ = 20 mm | four times the load, the same stress–strain curve |
| copper | copper | low yield, very ductile |
| aluminium | aluminium-2024 | no sharp yield point: use the 0.2% offset |
| polymer | hdpe | low modulus, a yield point, then a long draw |
| ceramic | alumina | brittle: linear to fracture, tiny toughness |
| flat-bar | aluminium-2024, rectangular 12.5 × 3 mm | a sheet-metal specimen |

No preset uses g.

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| area | Original area A₀ | mm² | 4 |
| modulus | Young's modulus E (elastic slope) | GPa | 3 |
| yieldStrength | Yield (0.2% proof) strength | MPa | 3 |
| uts | Ultimate tensile strength | MPa | 3 |
| maxLoad | Maximum load | kN | 4 |
| elongation | Elongation after fracture | % | 3 |
| toughness | Toughness (area under σ–ε) | MJ/m³ | 3 |
| fractureStrain | Strain at fracture (elastic + plastic) | % | 3 |
| load | Load now | kN | 3 |
| extension | Extension now | mm | 3 |

Each property readout shows "—" until the test has passed that point. A ceramic has no yield readout.

## Assumptions shown on stage
- Engineering stress and strain (on the original area and length)
- A smooth model curve through the sourced E, yield, UTS and elongation; its shape between them is schematic
- Room temperature, slow (quasi-static) loading; time-lapse playback
- Toughness from the area under the engineering stress–strain curve

## Try this (3–5 predict, observe, explain prompts)
1. Predict: if the specimen's diameter doubles, what happens to the maximum load? And to the UTS? Observe with the **thick-specimen** preset.
2. Observe: run 2024-T3 aluminium. Where is the yield point? Use the 0.2% offset line to find it.
3. Predict, then observe: which material will have the steepest elastic line, and which the shallowest?
4. Explain: alumina is stiffer than steel and its fracture strength is close to steel's UTS, so why is its toughness so small?
5. Observe: after the UTS, the load falls but the specimen keeps stretching. What is happening to the specimen?

## Teacher notes outline
- Misconceptions to target: the stress falls after the UTS because the material gets weaker (the cross-section necks; true stress keeps rising); a stiff material is a strong material (E and strength are different properties); a thicker specimen gives a higher UTS (it gives a higher load); toughness and hardness are the same.
- 10-minute lesson flow: (1) default run; read E, yield, UTS, elongation; (2) load–extension against stress–strain for the same test; (3) thick specimen: loads scale with area, properties do not; (4) aluminium and the 0.2% offset; (5) ceramic against steel: strength and toughness; (6) polymer: low E, a yield point and drawing.
- Original HSC-style question idea: a 12 mm diameter aluminium alloy specimen with a 60 mm gauge length extends 0.135 mm elastically under 18 kN and reaches a maximum load of 33 kN. Find the stress at 18 kN, the strain, Young's modulus and the UTS, then explain why the maximum load is not the load at fracture. Worked solution: A = 113.1 mm²; σ = 159.2 MPa; ε = 0.135/60 = 0.00225; E = 70.7 GPa; UTS = 33 000/113.1 = 291.8 MPa; after the UTS the specimen necks, so the load it can carry falls before it breaks.

## Accessibility notes
Curve markers carry text labels (not only coloured dots); the offset line is dashed and labelled "0.2% offset"; the toughness area is hatched and labelled. The fracture event shows a text tag. When comparing materials, each curve is labelled at its end with the material's name and uses its own dash pattern. All controls are keyboard operable; Space plays and pauses. Stage label: "Tensile test of a … specimen. Young's modulus … gigapascals, yield … megapascals, UTS … megapascals, elongation … percent, toughness … megajoules per cubic metre."

## Engine change requests
- Keys to reconcile with the materials engine's `meta` (not yet published): params `material`, `gaugeLength`, `section`, `diameter`, `width`, `thickness`, `plot`, `showOffset`, `runTime`, `timeScale`; outputs `area`, `modulus`, `yieldStrength`, `uts`, `maxLoad`, `elongation`, `toughness`, `fractureStrain`, `load`, `extension`. These are the names the engine's `createTensileRun` already uses for its inputs and outputs; `plot` and `showOffset` are view options.
- Optional: an output for the load at yield (yield strength × A₀), so the load–extension reading matches the stress–strain one.

## Acceptance
Every number below comes from the formula and hand calculation shown here, using the material data above. A₀ = πd₀²/4 (round) or bt (rectangular); load = σA₀; toughness for a linear-to-fracture material = ½σ_f ε_f = σ_f²/(2E). Properties measured from the generated curve use the engine's §9.1 tolerance (E to 1%); loads and toughness use 0.5–1%.

- **Check 1, structural steel, 10 mm × 50 mm.** A₀ = π × 10²/4 = **78.540 mm²**. E = **200 GPa** (from the slope, 1%). Yield = **300 MPa**. UTS = **440 MPa**, so the maximum load = 440 × 78.540 = 34 558 N = **34.558 kN**. Elongation after fracture = **22%**.
- **Check 2, thick specimen.** d₀ = 20 mm: A₀ = π × 20²/4 = **314.16 mm²** (four times). Maximum load = 440 × 314.16 = **138.23 kN** (four times 34.558 kN), but E = **200 GPa** and UTS = **440 MPa** are unchanged.
- **Check 3, alumina (brittle).** Linear to fracture at σ_f = 379 MPa with E = 375 GPa: ε_f = 379/375 000 = 0.001011 = 0.1011%. Toughness = ½ × 379 × 0.001011 = 379²/(2 × 375 000) = **0.19152 MJ/m³** (the §9.1 test: ½σε to 0.5%). Maximum (fracture) load on a 10 mm specimen = 379 × 78.540 = **29.767 kN**.
- **Check 4, structural steel toughness (a range).** The area under a curve that sits at or above the yield stress from yield to fracture, and never above the UTS, lies between σ_y × ε_f = 300 × 0.22 = 66 MJ/m³ and UTS × (ε_f + σ/E) = 440 × 0.2222 = 97.77 MJ/m³ (the elastic part is negligible). The check accepts **81.88 ± 15.88 MJ/m³**, exactly that range.
- **Check 5, copper.** E = **117 GPa** (1%); 0.2% proof = **69 MPa**; maximum load = 221 × 78.540 = **17.357 kN**.
- **Check 6, rectangular specimen.** 2024-T3, 12.5 × 3 mm: A₀ = **37.5 mm²**; maximum load = 483 × 37.5 = 18 112.5 N = **18.1125 kN**.
- **Question idea check.** A = 113.097 mm²; σ = 159.15 MPa; ε = 0.00225; E = 70.736 GPa; UTS = 291.78 MPa.

```acceptance
[
  { "name": "structural steel 10 mm: E, yield, UTS, maximum load, elongation", "params": { "material": "structural-steel", "gaugeLength": 50, "section": "round", "diameter": 10 }, "run": "complete",
    "expect": { "area": { "value": 78.53981634, "relTol": 1e-9 }, "modulus": { "value": 200, "relTol": 0.01 }, "yieldStrength": { "value": 300, "relTol": 0.01 }, "uts": { "value": 440, "relTol": 0.005 }, "maxLoad": { "value": 34.55751919, "relTol": 0.005 }, "elongation": { "value": 22, "relTol": 0.01 } } },
  { "name": "thick specimen: four times the load, same properties", "params": { "material": "structural-steel", "gaugeLength": 50, "section": "round", "diameter": 20 }, "run": "complete",
    "expect": { "area": { "value": 314.1592654, "relTol": 1e-9 }, "maxLoad": { "value": 138.2300768, "relTol": 0.005 }, "modulus": { "value": 200, "relTol": 0.01 }, "uts": { "value": 440, "relTol": 0.005 } } },
  { "name": "alumina: linear to fracture, toughness ½σε", "params": { "material": "alumina", "gaugeLength": 50, "section": "round", "diameter": 10 }, "run": "complete",
    "expect": { "modulus": { "value": 375, "relTol": 0.01 }, "uts": { "value": 379, "relTol": 0.005 }, "toughness": { "value": 0.1915213333, "relTol": 0.005 }, "maxLoad": { "value": 29.76659039, "relTol": 0.005 } } },
  { "name": "structural steel toughness lies between σ_y·ε_f and UTS·ε_f", "params": { "material": "structural-steel", "gaugeLength": 50, "section": "round", "diameter": 10 }, "run": "complete",
    "expect": { "toughness": { "value": 81.884, "absTol": 15.884 } } },
  { "name": "copper: modulus, proof stress and maximum load", "params": { "material": "copper", "gaugeLength": 50, "section": "round", "diameter": 10 }, "run": "complete",
    "expect": { "modulus": { "value": 117, "relTol": 0.01 }, "yieldStrength": { "value": 69, "relTol": 0.01 }, "maxLoad": { "value": 17.35729941, "relTol": 0.005 } } },
  { "name": "rectangular 2024-T3 specimen", "params": { "material": "aluminium-2024", "gaugeLength": 50, "section": "rect", "width": 12.5, "thickness": 3 }, "run": "complete",
    "expect": { "area": { "value": 37.5, "relTol": 1e-12 }, "maxLoad": { "value": 18.1125, "relTol": 0.005 } } }
]
```
