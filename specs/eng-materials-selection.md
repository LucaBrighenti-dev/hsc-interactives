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
  - {"course":"Engineering Studies","version":"2011","area":"Aeronautical Engineering","outcomes":[],"verified":false}
  - {"course":"Engineering Studies","version":"2026","focusArea":"Aeronautical and aerospace engineering","year":12,"outcomes":[],"verified":false,"subtopic":"Properties of engineering materials"}
---
# Materials selection chart

> Backlog summary: Strength vs density for Ti-6Al-4V, 2024 Al, high-tensile steel and CFRP; strength-to-weight calculator.

## Learning goal
Students compare aerospace materials by specific strength (strength ÷ density) rather than strength alone, and see why the lightest tie for a given load is made from the material with the highest specific strength: the mass of a tension member is m = nFLρ/σ. They read a log–log strength–density chart, where lines of equal specific strength are parallel diagonals.

Syllabus fit: 2011 Aeronautical Engineering (materials used in aircraft: aluminium alloys, titanium, steels, composites; properties and selection); 2026 Aeronautical and aerospace engineering, Year 12, properties of engineering materials. Pitched at Stage 6: specific strength and a simple sizing calculation; no buckling or stiffness-limited design.

## What the student sees
Default view at 1920×1080, light projector theme:

- **Left 60%, selection chart:** log–log axes, density ρ (kg/m³, 1000 to 10 000) across and strength σ (MPa, 100 to 3000) up, with decade gridlines. Each material is a labelled marker with a distinct shape (Ti-6Al-4V ▲, 2024-T3 aluminium ●, AISI 4340 steel ■, CFRP ◆, custom ✚). With **Show guidelines** on, dashed diagonal lines of constant σ/ρ pass through the selected material, labelled with their specific strength ("124 kN·m/kg"); materials above and left of the line beat it. The selected material's marker is ringed.
- **Right 40%, tie calculator:** a drawing of a vertical tie rod of length L carrying the design load F, its cross-section drawn to scale for the selected material, and a bar chart of the tie's mass for all four materials side by side (bars labelled with mass in kg and filled with the marker's pattern).
- **Below the chart:** a data table (material, ρ, yield, UTS, E, source) for the four rows, the source of each row in small text.
- **Footer:** assumptions.

Static setup: play, step and reset are hidden.

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| material | Material | | | | | al2024t3 | enum: `ti6al4v`, `al2024t3`, `steel4340`, `cfrp`, `custom` |
| strengthBasis | Design strength | | | | | yield | enum: `yield` (0.2% proof for metals), `uts`; CFRP has no yield point, so it uses its tensile strength for both |
| designLoad | Design load F | kN | 1 | 200 | 1 | 50 | axial tension |
| memberLength | Tie length L | m | 0.1 | 5 | 0.1 | 2 | |
| safetyFactor | Factor of safety n | | 1 | 4 | 0.1 | 1.5 | |
| customStrength | Custom strength | MPa | 10 | 3000 | 10 | 500 | visible when material = custom |
| customDensity | Custom density | kg/m³ | 500 | 20000 | 10 | 2500 | visible when material = custom |
| showGuidelines | Show σ/ρ guidelines | | | | | on | boolean |

The materials engine has not published its `meta` yet; keys are listed under "Engine change requests" to reconcile.

### Material data (typical values; each row must carry its source in the engine's `data.json`)
| Key | Material | ρ (kg/m³) | Yield or 0.2% proof (MPa) | UTS (MPa) | E (GPa) | Source |
| --- | --- | --- | --- | --- | --- | --- |
| ti6al4v | Ti-6Al-4V (Grade 5), annealed | 4430 | 880 | 950 | 113.8 | ASM Aerospace Specification Metals data sheet "Titanium Ti-6Al-4V (Grade 5), Annealed" (as listed on MatWeb) |
| al2024t3 | Aluminium 2024-T3 | 2780 | 345 | 483 | 73.1 | ASM Aerospace Specification Metals data sheet "Aluminum 2024-T3" (as listed on MatWeb) |
| steel4340 | High-tensile steel, AISI 4340, normalised | 7850 | 710 | 1110 | 205 | MatWeb data sheet "AISI 4340 Steel, normalized" |
| cfrp | CFRP, unidirectional carbon/epoxy (T300/5208), loaded along the fibres | 1600 | none (brittle) | 1500 | 181 | Tsai and Hahn, *Introduction to Composite Materials* (1980), typical T300/5208 lamina properties |

These are typical values for teaching, not design allowables. If the materials engine's `data.json` uses different sourced values, the acceptance numbers below must be recomputed from the same formulas.

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | 2024-T3, yield, F = 50 kN, L = 2 m, n = 1.5 | the aluminium baseline for an airframe tie |
| titanium | default with Ti-6Al-4V | stronger and denser: lighter overall |
| steel | default with AISI 4340 | strongest metal here, but the heaviest tie |
| cfrp | default with CFRP | the lightest by far, along the fibres |
| custom | custom, 500 MPa, 2500 kg/m³, F = 10 kN, L = 1 m, n = 2 | students enter their own material |

No preset uses g: the design load is given in kN.

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| strength | Design strength σ | MPa | 3 |
| density | Density ρ | kg/m³ | 4 |
| specificStrength | Specific strength σ/ρ | kN·m/kg | 3 |
| requiredArea | Required area A = nF/σ | mm² | 3 |
| memberMass | Tie mass m = ρAL | kg | 3 |
| massVsSteel | Mass relative to the steel tie | | 3 |

## Assumptions shown on stage
- Typical property values from the sources listed; not design allowables
- Tie in pure axial tension; buckling, stiffness, fatigue and joints ignored
- CFRP loaded along its fibres (it is much weaker across them)
- Factor of safety applied to the design strength

## Try this (3–5 predict, observe, explain prompts)
1. Predict: steel is the strongest metal here. Will it give the lightest tie? Observe the mass bars.
2. Observe: switch on the guidelines through 2024-T3. Which materials sit above the line, and what does that mean for their tie mass?
3. Predict, then observe: double the design load. What happens to each tie's mass, and does the ranking change?
4. Explain: why does the mass of the tie depend only on σ/ρ, and not on σ or ρ separately?
5. Observe: switch to UTS as the design strength. Which material gains the most, and why might a designer still use yield?

## Teacher notes outline
- Misconceptions to target: the strongest material is the best for aircraft (specific strength decides); a lighter material always gives a lighter part (only if its strength per unit mass is higher); CFRP is equally strong in every direction (it is strongly directional); strength and stiffness are the same property.
- 10-minute lesson flow: (1) read the four markers on the chart; (2) the guideline through aluminium and the regions above and below it; (3) the tie calculation for aluminium by hand: A = nF/σ, m = ρAL; (4) compare the mass bars; (5) discuss why airframes still use aluminium and titanium (cost, toughness, fatigue, joining, damage tolerance).
- Original HSC-style question idea: a 1.2 m tie must carry 30 kN with a factor of safety of 2. Compare the mass of a 2024-T3 tie (σ_y = 345 MPa, ρ = 2780 kg/m³) with a Ti-6Al-4V tie (σ_y = 880 MPa, ρ = 4430 kg/m³). Worked solution: aluminium A = 60 000/345 = 173.9 mm², m = 2780 × 173.9 × 10⁻⁶ × 1.2 = 0.580 kg; titanium A = 68.18 mm², m = 0.362 kg; titanium saves 0.218 kg (38%).

## Accessibility notes
Each material marker has its own shape and a text label, so materials are never told apart by colour alone; the bars repeat the marker's pattern and carry the material's name and mass. Guidelines are dashed and labelled with their value. The data table gives every plotted number in text. All controls are keyboard operable. Stage label: "Strength against density chart for four aerospace materials. Selected: … with specific strength … kilonewton metres per kilogram. A … metre tie for … kilonewtons with a factor of safety of … weighs … kilograms."

## Engine change requests
- Keys to reconcile with the materials engine's `meta` (not yet published): params `material`, `strengthBasis`, `designLoad`, `memberLength`, `safetyFactor`, `customStrength`, `customDensity`, `showGuidelines`; outputs `strength`, `density`, `specificStrength`, `requiredArea`, `memberMass`, `massVsSteel`.
- `data.json` rows needed, with sources: `ti6al4v`, `al2024t3`, `steel4340`, `cfrp` as in the table above. The CFRP row has no yield value; the selection setup uses its tensile strength for both bases.
- A tie calculator in the `selection` setup: A = nF/σ, m = ρAL, and the mass relative to the steel row.

## Acceptance
Every number below comes from the formula and hand calculation shown here, using the material data table above. Formulas: specific strength σ/ρ in kN·m/kg = σ (MPa) × 10⁶/ρ ÷ 1000 = 1000σ/ρ; A = nF/σ with F in N and σ in MPa gives mm²; m = ρ × A × 10⁻⁶ × L (kg); the mass relative to steel = (σ/ρ)_steel ÷ (σ/ρ)_material.

- **Check 1, 2024-T3 (yield).** σ/ρ = 1000 × 345/2780 = **124.10 kN·m/kg**. A = 1.5 × 50 000/345 = **217.39 mm²**. m = 2780 × 217.39 × 10⁻⁶ × 2 = **1.2087 kg**. Steel's σ/ρ = 1000 × 710/7850 = 90.446, so the mass relative to steel = 90.446/124.10 = **0.72881**.
- **Check 2, Ti-6Al-4V (yield).** σ/ρ = 1000 × 880/4430 = **198.65 kN·m/kg**. A = 75 000/880 = **85.227 mm²**. m = 4430 × 85.227 × 10⁻⁶ × 2 = **0.75511 kg**. Relative to steel: 90.446/198.65 = **0.45531**.
- **Check 3, AISI 4340 (yield).** σ/ρ = **90.446 kN·m/kg**; A = 75 000/710 = 105.63 mm²; m = 7850 × 105.63 × 10⁻⁶ × 2 = **1.6585 kg**; relative to steel **1**.
- **Check 4, CFRP.** σ/ρ = 1000 × 1500/1600 = **937.5 kN·m/kg**; A = 75 000/1500 = **50 mm²**; m = 1600 × 50 × 10⁻⁶ × 2 = **0.16 kg**.
- **Check 5, custom.** 500 MPa, 2500 kg/m³, F = 10 kN, n = 2, L = 1 m: σ/ρ = **200 kN·m/kg**; A = 2 × 10 000/500 = **40 mm²**; m = 2500 × 40 × 10⁻⁶ × 1 = **0.1 kg**.
- **Check 6, 2024-T3 on UTS.** σ/ρ = 1000 × 483/2780 = **173.74 kN·m/kg**; m = 1.5 × 50 000 × 2 × 2780/(483 × 10⁶) = **0.86335 kg**.

```acceptance
[
  { "name": "2024-T3 on yield: specific strength and tie mass", "params": { "material": "al2024t3", "strengthBasis": "yield", "designLoad": 50, "memberLength": 2, "safetyFactor": 1.5 }, "run": "static",
    "expect": { "strength": { "value": 345, "relTol": 1e-12 }, "density": { "value": 2780, "relTol": 1e-12 }, "specificStrength": { "value": 124.1007194, "relTol": 1e-9 }, "requiredArea": { "value": 217.3913043, "relTol": 1e-9 }, "memberMass": { "value": 1.208695652, "relTol": 1e-9 }, "massVsSteel": { "value": 0.7288101172, "relTol": 1e-9 } } },
  { "name": "Ti-6Al-4V on yield", "params": { "material": "ti6al4v", "strengthBasis": "yield", "designLoad": 50, "memberLength": 2, "safetyFactor": 1.5 }, "run": "static",
    "expect": { "specificStrength": { "value": 198.6455982, "relTol": 1e-9 }, "requiredArea": { "value": 85.22727273, "relTol": 1e-9 }, "memberMass": { "value": 0.7551136364, "relTol": 1e-9 }, "massVsSteel": { "value": 0.4553126809, "relTol": 1e-9 } } },
  { "name": "AISI 4340 on yield", "params": { "material": "steel4340", "strengthBasis": "yield", "designLoad": 50, "memberLength": 2, "safetyFactor": 1.5 }, "run": "static",
    "expect": { "specificStrength": { "value": 90.44585987, "relTol": 1e-9 }, "memberMass": { "value": 1.658450704, "relTol": 1e-9 }, "massVsSteel": { "value": 1, "relTol": 1e-12 } } },
  { "name": "CFRP along the fibres", "params": { "material": "cfrp", "strengthBasis": "yield", "designLoad": 50, "memberLength": 2, "safetyFactor": 1.5 }, "run": "static",
    "expect": { "specificStrength": { "value": 937.5, "relTol": 1e-12 }, "requiredArea": { "value": 50, "relTol": 1e-12 }, "memberMass": { "value": 0.16, "relTol": 1e-12 } } },
  { "name": "custom material", "params": { "material": "custom", "customStrength": 500, "customDensity": 2500, "designLoad": 10, "memberLength": 1, "safetyFactor": 2 }, "run": "static",
    "expect": { "specificStrength": { "value": 200, "relTol": 1e-12 }, "requiredArea": { "value": 40, "relTol": 1e-12 }, "memberMass": { "value": 0.1, "relTol": 1e-12 } } },
  { "name": "2024-T3 on UTS", "params": { "material": "al2024t3", "strengthBasis": "uts", "designLoad": 50, "memberLength": 2, "safetyFactor": 1.5 }, "run": "static",
    "expect": { "strength": { "value": 483, "relTol": 1e-12 }, "specificStrength": { "value": 173.7410072, "relTol": 1e-9 }, "memberMass": { "value": 0.8633540373, "relTol": 1e-9 } } }
]
```
