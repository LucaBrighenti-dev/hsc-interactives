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

- **Left third, machine:** a universal testing machine drawn in outline with grips, a round test specimen with its gauge length L₀ and diameter d₀ marked, and an extensometer. As the test runs the crosshead moves up, the specimen stretches, a neck forms in ductile materials (the waist narrows visibly), and the specimen snaps at fracture with a "FRACTURE" tag. A brittle ceramic snaps with no visible neck.
- **Right two-thirds, graph:** the curve drawn live, either load (kN) against extension (mm) or stress (MPa) against strain (%), chosen with **Plot**. Labelled markers appear as the curve passes them: "limit of proportionality", "0.2% proof" (with the dashed offset line when **Show offset line** is on), "UTS", "necking begins" and "fracture". When the test ends, the area under the curve is hatched and labelled "toughness".
- **Readouts** for the properties as they are measured.
- **Footer:** assumptions and the data source of the selected material.

The run completes at fracture.

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| material | Material | | | | | steel1020 | enum: `steel1020`, `copper`, `al6061`, `polycarbonate`, `alumina` |
| gaugeLength | Gauge length L₀ | mm | 25 | 100 | 5 | 50 | |
| diameter | Specimen diameter d₀ | mm | 4 | 20 | 0.5 | 10 | |
| plot | Plot | | | | | stress-strain | enum: `load-extension`, `stress-strain` |
| showOffset | Show 0.2% offset line | | | | | on | boolean |
| timeScale | Playback speed | × | 0.25 | 2 | 0.25 | 1 | |

The materials engine has not published its `meta` yet; keys are listed under "Engine change requests" to reconcile.

### Material data (typical values; each row must carry its source in the engine's `data.json`)
| Key | Material | E (GPa) | Yield or 0.2% proof (MPa) | UTS (MPa) | Elongation at fracture (%) | Source |
| --- | --- | --- | --- | --- | --- | --- |
| steel1020 | Mild steel, AISI 1020, hot rolled | 207 | 210 | 380 | 25 | Callister and Rethwisch, *Materials Science and Engineering: An Introduction*, Appendix B (Tables B.2 and B.4) |
| copper | Copper C11000, annealed | 115 | 69 | 220 | 45 | Callister and Rethwisch, Appendix B |
| al6061 | Aluminium 6061-T6 | 69 | 276 | 310 | 12 | Callister and Rethwisch, Appendix B |
| polycarbonate | Polycarbonate | 2.38 | 62.1 | 66 | 110 | Callister and Rethwisch, Appendix B (UTS 62.8–72.4 MPa and elongation 110–150% listed as ranges; values chosen within them) |
| alumina | Alumina, 99.5% Al₂O₃ (brittle) | 370 | none | 262 (fracture) | 0.071 (elastic only) | CoorsTek AD-995 alumina, typical properties data sheet |

Typical values for teaching, not specification minimums. If the materials engine's `data.json` uses different sourced values, the acceptance numbers below must be recomputed with the same formulas.

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | mild steel, L₀ = 50 mm, d₀ = 10 mm, stress–strain | the textbook ductile curve |
| load-extension | default with plot = load-extension | the raw data before converting |
| thick-specimen | mild steel, d₀ = 20 mm | four times the load, same stress–strain curve |
| copper | copper | low yield, very ductile |
| aluminium | 6061-T6 | no sharp yield point: use the 0.2% offset |
| polymer | polycarbonate | low modulus, large strains |
| ceramic | alumina | brittle: linear to fracture, tiny toughness |

No preset uses g.

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| area | Original area A₀ = πd₀²/4 | mm² | 4 |
| youngsModulus | Young's modulus E (elastic slope) | GPa | 3 |
| yieldStrength | Yield (0.2% proof) strength | MPa | 3 |
| uts | Ultimate tensile strength | MPa | 3 |
| elongation | Elongation at fracture | % | 3 |
| toughness | Toughness (area under σ–ε) | MJ/m³ | 3 |
| yieldLoad | Load at yield | kN | 4 |
| maxLoad | Maximum load | kN | 4 |
| fractureExtension | Extension at fracture | mm | 3 |

Each property readout shows "—" until the test has passed that point. A ceramic has no yield readout.

## Assumptions shown on stage
- Engineering stress and strain (on the original area and length)
- Smooth model curve fitted to typical data: linear, then hardening, necking and fracture
- Room temperature, slow (quasi-static) loading
- Toughness from the area under the engineering stress–strain curve

## Try this (3–5 predict, observe, explain prompts)
1. Predict: if the specimen's diameter doubles, what happens to the maximum load? And to the UTS? Observe with the **thick-specimen** preset.
2. Observe: run 6061-T6. Where is the yield point? Use the 0.2% offset line to find it.
3. Predict, then observe: which material will have the steepest elastic line, and which the shallowest?
4. Explain: alumina is much stiffer and nearly as strong as mild steel, so why is its toughness so small?
5. Observe: after the UTS, the load falls but the specimen keeps stretching. What is happening to the specimen?

## Teacher notes outline
- Misconceptions to target: the stress falls after the UTS because the material gets weaker (the cross-section necks; true stress keeps rising); a stiff material is a strong material (E and strength are different properties); a thicker specimen gives a higher UTS (it gives a higher load); toughness and hardness are the same.
- 10-minute lesson flow: (1) default run; read E, yield, UTS, elongation; (2) load–extension against stress–strain for the same test; (3) thick specimen: loads scale with area, properties do not; (4) aluminium and the 0.2% offset; (5) ceramic against steel: strength and toughness; (6) polymer: low E, large strain.
- Original HSC-style question idea: a 12 mm diameter aluminium alloy specimen with a 60 mm gauge length extends 0.135 mm elastically under 18 kN and reaches a maximum load of 33 kN. Find the stress at 18 kN, the strain, Young's modulus and the UTS, then explain why the maximum load is not the load at fracture. Worked solution: A = 113.1 mm²; σ = 159.2 MPa; ε = 0.135/60 = 0.00225; E = 70.7 GPa; UTS = 33 000/113.1 = 291.8 MPa; after the UTS the specimen necks, so the load it can carry falls before it breaks.

## Accessibility notes
Curve markers carry text labels (not only coloured dots); the offset line is dashed and labelled "0.2% offset"; the toughness area is hatched and labelled. The fracture event shows a text tag. When comparing materials, each curve is labelled at its end with the material's name and uses its own dash pattern. All controls are keyboard operable; Space plays and pauses. Stage label: "Tensile test of a … millimetre … specimen. Young's modulus … gigapascals, yield … megapascals, UTS … megapascals, elongation … percent, toughness … megajoules per cubic metre."

## Engine change requests
- Keys to reconcile with the materials engine's `meta` (not yet published): params `material`, `gaugeLength`, `diameter`, `plot`, `showOffset`, `timeScale`; outputs `area`, `youngsModulus`, `yieldStrength`, `uts`, `elongation`, `toughness`, `yieldLoad`, `maxLoad`, `fractureExtension`.
- `data.json` rows needed, with sources: `steel1020`, `copper`, `al6061`, `polycarbonate`, `alumina`, as in the table above.
- `elongation` is the plastic (permanent) elongation at fracture, as quoted in data tables, so it matches the data row; `fractureExtension` is the total extension at the moment of fracture (elastic plus plastic).
- Measured properties come from the generated curve (E from the elastic slope, yield from the 0.2% offset intersection, UTS from the maximum), as in the engine's §9.1 tests.

## Acceptance
Every number below comes from the formula and hand calculation shown here, using the material data above. A₀ = πd₀²/4; load = σA₀; toughness for a linear-to-fracture material = ½σ_f ε_f = σ_f²/(2E). Measured properties use the engine's §9.1 tolerance (E to 1%); loads and toughness use 0.5–1%.

- **Check 1, mild steel, 10 mm × 50 mm.** A₀ = π × 10²/4 = **78.540 mm²**. E = **207 GPa** (from the slope, 1%). Yield = **210 MPa**, so the load at yield = 210 × 78.540 = 16 493 N = **16.493 kN**. UTS = **380 MPa**, so the maximum load = 380 × 78.540 = 29 845 N = **29.845 kN**. Elongation = **25%**.
- **Check 2, thick specimen.** d₀ = 20 mm: A₀ = π × 20²/4 = **314.16 mm²** (four times). Load at yield = 210 × 314.16 = **65.973 kN** (four times 16.493 kN), but E = **207 GPa** and yield = **210 MPa** are unchanged.
- **Check 3, alumina (brittle).** Linear to fracture at σ_f = 262 MPa with E = 370 GPa: ε_f = 262/370 000 = 0.000708 = **0.0708%**. Toughness = ½ × 262 × 0.000708 = 262²/(2 × 370 000) = **0.092762 MJ/m³** (the §9.1 test: ½σε to 0.5%). Fracture load on a 10 mm specimen = 262 × 78.540 = **20.577 kN**.
- **Check 4, mild steel toughness (a range).** The area under a curve that rises from yield to UTS and then necks lies between the rectangles σ_y × ε_f = 210 × 0.25 = 52.5 MJ/m³ and UTS × ε_f = 380 × 0.25 = 95 MJ/m³ (the small elastic triangle is negligible). The check accepts **73.75 ± 21.25 MJ/m³**, exactly that range.
- **Check 5, copper.** E = **115 GPa** (1%); load at yield = 69 × 78.540 = **5.4192 kN**.
- **Question idea check.** A = 113.097 mm²; σ = 159.15 MPa; ε = 0.00225; E = 70.736 GPa; UTS = 291.78 MPa.

```acceptance
[
  { "name": "mild steel 10 mm: E, yield, UTS, loads, elongation", "params": { "material": "steel1020", "gaugeLength": 50, "diameter": 10 }, "run": "complete",
    "expect": { "area": { "value": 78.53981634, "relTol": 1e-9 }, "youngsModulus": { "value": 207, "relTol": 0.01 }, "yieldStrength": { "value": 210, "relTol": 0.01 }, "uts": { "value": 380, "relTol": 0.005 }, "yieldLoad": { "value": 16.49336143, "relTol": 0.01 }, "maxLoad": { "value": 29.84513021, "relTol": 0.005 }, "elongation": { "value": 25, "relTol": 0.01 } } },
  { "name": "thick specimen: four times the load, same properties", "params": { "material": "steel1020", "gaugeLength": 50, "diameter": 20 }, "run": "complete",
    "expect": { "area": { "value": 314.1592654, "relTol": 1e-9 }, "yieldLoad": { "value": 65.97344573, "relTol": 0.01 }, "youngsModulus": { "value": 207, "relTol": 0.01 }, "yieldStrength": { "value": 210, "relTol": 0.01 } } },
  { "name": "alumina: linear to fracture, toughness ½σε", "params": { "material": "alumina", "gaugeLength": 50, "diameter": 10 }, "run": "complete",
    "expect": { "youngsModulus": { "value": 370, "relTol": 0.01 }, "uts": { "value": 262, "relTol": 0.005 }, "toughness": { "value": 0.0927621622, "relTol": 0.005 }, "maxLoad": { "value": 20.57743188, "relTol": 0.005 } } },
  { "name": "mild steel toughness lies between σ_y·ε_f and UTS·ε_f", "params": { "material": "steel1020", "gaugeLength": 50, "diameter": 10 }, "run": "complete",
    "expect": { "toughness": { "value": 73.75, "absTol": 21.25 } } },
  { "name": "copper: modulus and yield load", "params": { "material": "copper", "gaugeLength": 50, "diameter": 10 }, "run": "complete",
    "expect": { "youngsModulus": { "value": 115, "relTol": 0.01 }, "yieldLoad": { "value": 5.419247327, "relTol": 0.01 } } }
]
```
