---
id: eng-materials-selection
title: "Materials selection chart"
subject: eng
engine: materials
setup: selection
priority: P1
status: draft            # stub → draft → approved (Gate B)
page: /interactives/engineering/materials-selection.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Engineering Studies","version":"2011","area":"Aeronautical engineering","subtopic":"Engineering materials","year":12,"outcomes":["H1.2"],"url":"https://www.nsw.gov.au/education-and-training/nesa/curriculum/tas/engineering-studies-stage-6-2011","verified":true}
  - {"course":"Engineering Studies","version":"2026","focusArea":"Aeronautical and aerospace engineering","subtopic":"Properties of engineering materials","year":12,"outcomes":["ES-12-02"],"url":"https://curriculum.nsw.edu.au/learning-areas/tas/engineering-studies-11-12-2026/content/year-12/fa66e557c0","verified":true}
---
# Materials selection chart

> Backlog summary: Strength vs density for Ti-6Al-4V, 2024 Al, high-tensile steel and CFRP; strength-to-weight calculator.

## Learning goal
Students compare aerospace materials by specific strength (strength ÷ density) rather than strength alone, and see why the lightest tie for a given load is made from the material with the highest specific strength: the mass of a tension member is m = nFLρ/σ. They read a log–log strength–density chart, where lines of equal specific strength are parallel diagonals.

Syllabus fit: 2011 Aeronautical Engineering (materials used in aircraft: aluminium alloys, titanium, steels, composites; properties and selection); 2026 Aeronautical and aerospace engineering, Year 12, properties of engineering materials. Pitched at Stage 6: specific strength and a simple sizing calculation; no buckling or stiffness-limited design.

## What the student sees
Default view at 1920×1080, light projector theme:

- **Left 60%, selection chart:** log–log axes, density ρ (kg/m³, 500 to 10 000) across and strength σ (MPa, 10 to 3000) up, with decade gridlines. Every material in the engine's data is a labelled marker; the four aerospace materials of this page (Ti-6Al-4V, 2024-T3 aluminium, high-tensile steel, CFRP) are drawn larger, each with its own shape (▲, ●, ■, ◆). With **Show guidelines** on, dashed diagonal lines of constant σ/ρ pass through the selected material, labelled with their specific strength ("124 kN·m/kg"); materials above and left of the line beat it. The selected material's marker is ringed.
- **Right 40%, tie calculator:** a drawing of a vertical tie rod of length L carrying the design load F, its cross-section drawn to scale for the selected material, and a bar chart of the tie's mass for the four aerospace materials side by side (bars labelled with mass in kg and filled with the marker's pattern).
- **Below the chart:** a data table (material, ρ, yield, UTS, E, source) for the plotted rows, with each row's source in small text.
- **Footer:** assumptions.

Static setup: play, step and reset are hidden.

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| material | Material | | | | | aluminium-2024 | enum of the engine's data-row ids: `aluminium-2024`, `titanium-6al-4v`, `high-tensile-steel`, `cfrp`, and the others plotted (`structural-steel`, `copper`, `hdpe`, `alumina`, `grey-cast-iron`) |
| strengthBasis | Design strength | | | | | yield | enum: `yield` (0.2% proof for metals), `uts`; brittle materials (CFRP, alumina, cast iron) use their fracture strength for both |
| designLoad | Design load F | kN | 1 | 200 | 1 | 50 | axial tension |
| memberLength | Tie length L | m | 0.1 | 5 | 0.1 | 2 | |
| safetyFactor | Factor of safety n | | 1 | 4 | 0.1 | 1.5 | |
| showGuidelines | Show σ/ρ guidelines | | | | | on | boolean |

The materials engine has not published its `meta` yet; keys are listed under "Engine change requests" to reconcile. The material ids and the formulas follow the engine's in-progress `data.js` and `model.js` (`strengthOf`, `specificStrength`, `tieArea`, `tieMass`).

### Material data (typical values from the engine's data rows; each row carries its source)
| Id | Material | ρ (kg/m³) | Yield or 0.2% proof (MPa) | UTS (MPa) | E (GPa) | Source (as recorded in the engine's `data.js`) |
| --- | --- | --- | --- | --- | --- | --- |
| titanium-6al-4v | Ti-6Al-4V (Grade 5), annealed | 4420 | 910 | 1000 | 114 | U.S. Titanium Industry Inc., "Titanium Alloys – Ti6Al4V Grade 5" (AZoM), typical values |
| aluminium-2024 | Aluminium 2024-T3 | 2780 | 345 | 483 | 73 | ASM Handbook Vol. 2 (1990), typical properties of 2024-T3 sheet |
| high-tensile-steel | High-tensile steel, AISI 4340, normalised | 7850 | 862 | 1279 | 200 | ASM Handbook Vol. 1 (1990), AISI 4340 normalised at 870 °C; density and E from AZoM |
| cfrp | CFRP, woven carbon/epoxy fabric, 0/90°, along a fibre direction | 1600 | none (brittle) | 600 (fracture) | 70 | Performance Composites Ltd, "Mechanical properties of carbon fibre composite materials" |
| structural-steel | Structural steel, AS/NZS 3679.1 Grade 300 (for comparison) | 7850 | 300 | 440 | 200 | AS/NZS 3679.1:2016 minimum values; E and density from AS 4100:2020 |

These are typical values for teaching, not design allowables. If the engine's data rows change, the acceptance numbers below must be recomputed with the same formulas.

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | aluminium-2024, yield, F = 50 kN, L = 2 m, n = 1.5 | the aluminium baseline for an airframe tie |
| titanium | default with titanium-6al-4v | stronger and denser: lighter overall |
| steel | default with high-tensile-steel | the strongest metal here, but a heavier tie than titanium |
| cfrp | default with cfrp | the lightest of the four |
| building-steel | default with structural-steel | why airframes do not use building steel |

No preset uses g: the design load is given in kN.

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| strength | Design strength σ | MPa | 3 |
| density | Density ρ | kg/m³ | 4 |
| specificStrength | Specific strength σ/ρ | kN·m/kg | 3 |
| requiredArea | Required area A = nF/σ | mm² | 3 |
| memberMass | Tie mass m = ρAL | kg | 3 |
| massVsSteel | Mass relative to the high-tensile steel tie | | 3 |

## Assumptions shown on stage
- Typical property values from the sources listed; not design allowables
- Tie in pure axial tension; buckling, stiffness, fatigue and joints ignored
- CFRP loaded along one of its fibre directions (it is weaker at 45° to them)
- Factor of safety applied to the design strength

## Try this (3–5 predict, observe, explain prompts)
1. Predict: high-tensile steel is the strongest metal here. Will it give the lightest tie? Observe the mass bars.
2. Observe: switch on the guidelines through 2024-T3. Which materials sit above the line, and what does that mean for their tie mass?
3. Predict, then observe: double the design load. What happens to each tie's mass, and does the ranking change?
4. Explain: why does the mass of the tie depend only on σ/ρ, and not on σ or ρ separately?
5. Observe: switch to UTS as the design strength. Which material gains the most, and why might a designer still use yield?

## Teacher notes outline
- Misconceptions to target: the strongest material is the best for aircraft (specific strength decides); a lighter material always gives a lighter part (only if its strength per unit mass is higher); CFRP is equally strong in every direction (it is directional); strength and stiffness are the same property.
- 10-minute lesson flow: (1) read the four markers on the chart; (2) the guideline through aluminium and the regions above and below it; (3) the tie calculation for aluminium by hand: A = nF/σ, m = ρAL; (4) compare the mass bars; (5) discuss why airframes still use aluminium and titanium (cost, toughness, fatigue, joining, damage tolerance).
- Original HSC-style question idea: a 1.2 m tie must carry 30 kN with a factor of safety of 2. Compare the mass of a 2024-T3 tie (σ_y = 345 MPa, ρ = 2780 kg/m³) with a Ti-6Al-4V tie (σ_y = 910 MPa, ρ = 4420 kg/m³). Worked solution: aluminium A = 60 000/345 = 173.9 mm², m = 2780 × 173.9 × 10⁻⁶ × 1.2 = 0.580 kg; titanium A = 65.93 mm², m = 0.350 kg; titanium saves 0.230 kg (40%).

## Accessibility notes
Each aerospace material's marker has its own shape and a text label, so materials are never told apart by colour alone; the bars repeat the marker's pattern and carry the material's name and mass. Guidelines are dashed and labelled with their value. The data table gives every plotted number in text. All controls are keyboard operable. Stage label: "Strength against density chart. Selected: … with specific strength … kilonewton metres per kilogram. A … metre tie for … kilonewtons with a factor of safety of … weighs … kilograms."

## Engine change requests
- Keys to reconcile with the materials engine's `meta` (not yet published): params `material`, `strengthBasis`, `designLoad`, `memberLength`, `safetyFactor`, `showGuidelines`; outputs `strength`, `density`, `specificStrength`, `requiredArea`, `memberMass`, `massVsSteel`. The engine's model already has the formulas (`strengthOf`, `specificStrength`, `tieArea`, `tieMass`).
- `massVsSteel`: the tie mass relative to the `high-tensile-steel` row on the same strength basis.
- Optional: a custom material (strength and density entered by hand) for students' own comparisons.

## Acceptance
Every number below comes from the formula and hand calculation shown here, using the material data above. Formulas: specific strength σ/ρ in kN·m/kg = σ (MPa) × 10⁶/ρ ÷ 1000 = 1000σ/ρ; A = nF/σ with F in N and σ in MPa gives mm²; m = ρ × A × 10⁻⁶ × L (kg) = nFLρ/σ; the mass relative to steel = (σ/ρ)_steel ÷ (σ/ρ)_material with the high-tensile steel's σ/ρ = 1000 × 862/7850 = 109.809 kN·m/kg.

- **Check 1, 2024-T3 (yield).** σ/ρ = 1000 × 345/2780 = **124.10 kN·m/kg**. A = 1.5 × 50 000/345 = **217.39 mm²**. m = 2780 × 217.39 × 10⁻⁶ × 2 = **1.2087 kg**. Relative to steel: 109.809/124.10 = **0.88484**.
- **Check 2, Ti-6Al-4V (yield).** σ/ρ = 1000 × 910/4420 = **205.88 kN·m/kg**. A = 75 000/910 = **82.418 mm²**. m = 4420 × 82.418 × 10⁻⁶ × 2 = **0.72857 kg**. Relative to steel: 109.809/205.88 = **0.53336**.
- **Check 3, high-tensile steel (yield).** σ/ρ = **109.81 kN·m/kg**; A = 75 000/862 = 87.007 mm²; m = 7850 × 87.007 × 10⁻⁶ × 2 = **1.3660 kg**; relative to steel **1**.
- **Check 4, CFRP (brittle: fracture strength on either basis).** σ/ρ = 1000 × 600/1600 = **375 kN·m/kg**; A = 75 000/600 = **125 mm²**; m = 1600 × 125 × 10⁻⁶ × 2 = **0.4 kg**.
- **Check 5, structural steel.** σ/ρ = 1000 × 300/7850 = **38.217 kN·m/kg**; A = 75 000/300 = **250 mm²**; m = 7850 × 250 × 10⁻⁶ × 2 = **3.925 kg**, almost three times the high-tensile steel tie.
- **Check 6, 2024-T3 on UTS.** σ/ρ = 1000 × 483/2780 = **173.74 kN·m/kg**; m = 1.5 × 50 000 × 2 × 2780/(483 × 10⁶) = **0.86335 kg**.
- **Question idea check.** Aluminium A = 173.913 mm², m = 0.58017 kg; titanium A = 65.934 mm², m = 0.34971 kg; saving 0.23046 kg (39.7%).

```acceptance
[
  { "name": "2024-T3 on yield: specific strength and tie mass", "params": { "material": "aluminium-2024", "strengthBasis": "yield", "designLoad": 50, "memberLength": 2, "safetyFactor": 1.5 }, "run": "static",
    "expect": { "strength": { "value": 345, "relTol": 1e-12 }, "density": { "value": 2780, "relTol": 1e-12 }, "specificStrength": { "value": 124.1007194, "relTol": 1e-9 }, "requiredArea": { "value": 217.3913043, "relTol": 1e-9 }, "memberMass": { "value": 1.208695652, "relTol": 1e-9 }, "massVsSteel": { "value": 0.8848370719, "relTol": 1e-9 } } },
  { "name": "Ti-6Al-4V on yield", "params": { "material": "titanium-6al-4v", "strengthBasis": "yield", "designLoad": 50, "memberLength": 2, "safetyFactor": 1.5 }, "run": "static",
    "expect": { "specificStrength": { "value": 205.8823529, "relTol": 1e-9 }, "requiredArea": { "value": 82.41758242, "relTol": 1e-9 }, "memberMass": { "value": 0.7285714286, "relTol": 1e-9 }, "massVsSteel": { "value": 0.5333575978, "relTol": 1e-9 } } },
  { "name": "high-tensile steel on yield", "params": { "material": "high-tensile-steel", "strengthBasis": "yield", "designLoad": 50, "memberLength": 2, "safetyFactor": 1.5 }, "run": "static",
    "expect": { "specificStrength": { "value": 109.8089172, "relTol": 1e-9 }, "memberMass": { "value": 1.366009281, "relTol": 1e-9 }, "massVsSteel": { "value": 1, "relTol": 1e-12 } } },
  { "name": "CFRP uses its fracture strength", "params": { "material": "cfrp", "strengthBasis": "yield", "designLoad": 50, "memberLength": 2, "safetyFactor": 1.5 }, "run": "static",
    "expect": { "strength": { "value": 600, "relTol": 1e-12 }, "specificStrength": { "value": 375, "relTol": 1e-12 }, "requiredArea": { "value": 125, "relTol": 1e-12 }, "memberMass": { "value": 0.4, "relTol": 1e-12 } } },
  { "name": "structural steel for comparison", "params": { "material": "structural-steel", "strengthBasis": "yield", "designLoad": 50, "memberLength": 2, "safetyFactor": 1.5 }, "run": "static",
    "expect": { "specificStrength": { "value": 38.21656051, "relTol": 1e-9 }, "requiredArea": { "value": 250, "relTol": 1e-12 }, "memberMass": { "value": 3.925, "relTol": 1e-12 } } },
  { "name": "2024-T3 on UTS", "params": { "material": "aluminium-2024", "strengthBasis": "uts", "designLoad": 50, "memberLength": 2, "safetyFactor": 1.5 }, "run": "static",
    "expect": { "strength": { "value": 483, "relTol": 1e-12 }, "specificStrength": { "value": 173.7410072, "relTol": 1e-9 }, "memberMass": { "value": 0.863354037, "relTol": 1e-9 } } },
  { "name": "question idea: 30 kN tie, n = 2, 1.2 m, titanium", "params": { "material": "titanium-6al-4v", "strengthBasis": "yield", "designLoad": 30, "memberLength": 1.2, "safetyFactor": 2 }, "run": "static",
    "expect": { "requiredArea": { "value": 65.93406593, "relTol": 1e-9 }, "memberMass": { "value": 0.3497142857, "relTol": 1e-9 } } }
]
```
