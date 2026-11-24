---
id: eng-energy-systems
title: "Energy systems calculator"
subject: eng
engine: custom
setup: none
priority: P2
status: draft            # stub → draft → approved (Gate B)
page: /interactives/engineering/energy-systems.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Engineering Studies","version":"2026","focusArea":"Environmental engineering and energy systems","subtopic":"Energy systems and storage","year":12,"outcomes":["ES-12-05"],"url":"https://curriculum.nsw.edu.au/learning-areas/tas/engineering-studies-11-12-2026/content/year-12/fa4b243f12","verified":true}
---
# Energy systems calculator

> Backlog summary: Solar, wind and storage efficiency chains.

## Learning goal
Students follow energy through a renewable energy system as a chain of conversions (sunlight or wind → electricity → storage → load), multiply the stage efficiencies to get the overall efficiency, and see where the losses are on a Sankey diagram. They use P = GAη for solar panels and P = ½ρAv³C_p for wind turbines, notice that wind power grows with the cube of wind speed and can never exceed the Betz limit (C_p ≤ 16/27), and compare battery and pumped-hydro storage (E = mgh).

Syllabus fit: 2026 Environmental engineering and energy systems, Year 12 (no 2011 module matches this focus area). Pitched at Stage 6: power, energy in kWh, efficiency chains and simple storage calculations; no grid dynamics or economics.

## What the student sees
Default view at 1920×1080, light projector theme:

- **Top, system diagram:** icons for the source (a solar array or a wind turbine), the converter (inverter or generator), the storage (none, a battery or a pumped-hydro pair of reservoirs) and the load, joined by arrows. Each stage shows its efficiency as a percentage.
- **Centre, Sankey diagram:** a band whose width is proportional to power, starting at the source power (sunlight on the panels, or wind through the rotor disc) and narrowing at each stage, with the losses peeling off as hatched side bands labelled with their size in kW and what they are ("panel losses: heat and reflection", "inverter", "storage round trip").
- **Bottom, energy per day:** a bar for energy generated and a bar for energy delivered to the load, in kWh, with the storage loss hatched between them. For pumped hydro, a reservoir drawing shows the head h and the stored energy.
- **Footer:** assumptions, including "g = 10 m/s²" (used for pumped hydro) and "ρ_air = 1.225 kg/m³".

Static custom page: play, step and reset are hidden.

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| source | Energy source | | | | | solar | enum: `solar`, `wind` |
| irradiance | Solar irradiance G | W/m² | 0 | 1200 | 10 | 1000 | solar; 1000 W/m² is the standard test condition |
| panelArea | Panel area A | m² | 1 | 200 | 0.1 | 20 | solar |
| panelEfficiency | Panel efficiency | % | 5 | 25 | 0.5 | 20 | solar |
| inverterEfficiency | Inverter efficiency | % | 80 | 100 | 0.5 | 96 | solar |
| sunHours | Hours a day at this irradiance | h | 0 | 12 | 0.5 | 5 | solar ("peak sun hours" when G = 1000 W/m²) |
| windSpeed | Wind speed v | m/s | 0 | 25 | 0.5 | 10 | wind |
| rotorDiameter | Rotor diameter D | m | 1 | 150 | 1 | 40 | wind |
| powerCoefficient | Power coefficient C_p | | 0 | 0.59 | 0.01 | 0.4 | wind; the Betz limit is 16/27 = 0.593 |
| generatorEfficiency | Generator and gearbox efficiency | % | 70 | 100 | 0.5 | 90 | wind |
| runHours | Hours a day at this wind speed | h | 0 | 24 | 0.5 | 8 | wind |
| storage | Storage | | | | | none | enum: `none`, `battery`, `pumped-hydro` |
| storageShare | Share of energy that goes through storage | % | 0 | 100 | 5 | 50 | |
| batteryEfficiency | Battery round-trip efficiency | % | 60 | 100 | 1 | 90 | battery |
| pumpedEfficiency | Pumped-hydro round-trip efficiency | % | 50 | 95 | 1 | 80 | pumped hydro |
| reservoirVolume | Upper reservoir volume | m³ | 100 | 100000 | 100 | 10000 | pumped hydro |
| head | Height between reservoirs h | m | 10 | 500 | 5 | 100 | pumped hydro |
| g | Gravitational field g | m/s² | 9.8 | 10 | 0.2 | 10 | pumped hydro |

## Model (custom engine `site/assets/engines/custom/eng-energy-systems/`)
Pure functions in `model.js`; powers in kW, energies in kWh:

- Solar: source power P_in = G × A/1000; electrical power P_e = P_in × (panel %/100) × (inverter %/100).
- Wind: rotor area A = πD²/4; power in the wind P_in = ½ × 1.225 × A × v³/1000; electrical power P_e = P_in × C_p × (generator %/100).
- Energy generated per day E_gen = P_e × hours (sunHours or runHours).
- Storage with round-trip efficiency η_s and share s: energy delivered E_del = E_gen × [(1 − s) + s × η_s]; storage loss = E_gen − E_del; with no storage E_del = E_gen.
- Overall chain efficiency = E_del/(P_in × hours) × 100%.
- Pumped-hydro capacity (shown when chosen): E = ρ_water × V × g × h/3.6 × 10⁶ kWh, with ρ_water = 1000 kg/m³.
- A wind speed of 0 or an irradiance of 0 gives zero power and an efficiency readout of "—", never NaN.

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | solar, 1000 W/m², 20 m², 20%, inverter 96%, 5 h, no storage | a household-scale array: 3.84 kW |
| solar-battery | default with battery, 50% through storage at 90% | storage costs a little energy |
| wind | wind, 10 m/s, D = 40 m, C_p = 0.4, generator 90%, 8 h | a mid-size turbine: 277 kW |
| gusty | wind preset with v = 5 m/s | half the speed, an eighth of the power |
| wind-hydro | wind preset with pumped hydro, 50% through storage at 80%, 10 000 m³, 100 m | storing wind energy as water height |

Every preset uses g = 10 m/s² (shown on stage).

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| sourcePower | Power in the sunlight or wind | kW | 3 |
| electricalPower | Electrical power generated | kW | 3 |
| energyGenerated | Energy generated per day | kWh | 3 |
| energyDelivered | Energy delivered per day | kWh | 3 |
| storageLoss | Storage loss per day | kWh | 3 |
| chainEfficiency | Overall efficiency | % | 3 |
| storageCapacity | Pumped-hydro energy stored when full | kWh | 3 |

## Assumptions shown on stage
- Steady conditions for the hours given; no cloud or gust variation
- Air density 1.225 kg/m³ (sea level, 15 °C); water density 1000 kg/m³
- Each stage's losses are one constant efficiency; storage round trip applies to the share stored
- g = 10 m/s²

## Try this (3–5 predict, observe, explain prompts)
1. Predict: if the wind speed halves, what fraction of the power is left? Observe with the **gusty** preset.
2. Observe: in the **default** solar preset, which stage loses the most power? Find it on the Sankey diagram.
3. Predict, then observe: send all the solar energy through a 90% battery. How much does the overall efficiency drop?
4. Explain: why can no wind turbine have C_p above 0.593, even with perfect blades?
5. Observe: in **wind-hydro**, how high would the reservoir need to be to store twice the energy with the same water?

## Teacher notes outline
- Misconceptions to target: a 20% efficient panel wastes 80% "of the electricity" (it is 80% of the sunlight that never became electricity); doubling the wind speed doubles the power (it is eight times); storage creates energy or is lossless; a higher efficiency stage late in the chain matters as much as an early one (all stages multiply, so each matters equally in proportion).
- 10-minute lesson flow: (1) solar chain by hand: 20 kW of sunlight × 0.20 × 0.96 = 3.84 kW; (2) the Sankey diagram; (3) add a battery and multiply the efficiencies; (4) wind: v³ and the Betz limit; (5) pumped hydro: E = mgh in kWh.
- Original HSC-style question idea: a farm installs 12 panels of 1.8 m² each with 21% efficiency and a 97% inverter. On a day with 950 W/m² for 5.5 hours, find the electrical power, the daily energy, and the energy delivered if 40% of it passes through a battery with 90% round-trip efficiency. Worked solution: P_in = 12 × 1.8 × 0.95 = 20.52 kW; P_e = 20.52 × 0.21 × 0.97 = 4.180 kW; E = 22.99 kWh; delivered = 22.99 × (0.6 + 0.4 × 0.9) = 22.07 kWh.

## Accessibility notes
Sankey bands carry text labels with their power and the name of each loss; loss bands are hatched as well as shaded. Every stage efficiency is written as a percentage beside its icon. The energy bars are labelled in kWh. All controls are keyboard operable. Stage label: "Solar array: … kilowatts of sunlight becomes … kilowatts of electricity; … kilowatt hours a day generated and … delivered; overall efficiency … percent."

## Engine change requests
None for shared engines. This page builds its own custom engine (`site/assets/engines/custom/eng-energy-systems/`, with `tests/engines/custom-eng-energy-systems.test.mjs`) to the model above, with every key above in its `meta.params`, every readout in its `meta.outputs`, and the page as a static setup.

## Acceptance
Every number below comes from the formula and hand calculation shown here.

- **Check 1, solar chain.** P_in = 1000 × 20/1000 = **20 kW**. P_e = 20 × 0.20 × 0.96 = **3.84 kW**. E_gen = 3.84 × 5 = **19.2 kWh**; no storage, so E_del = **19.2 kWh**; efficiency = 19.2/(20 × 5) = **19.2%**.
- **Check 2, solar with a battery.** Half through a 90% battery: E_del = 19.2 × (0.5 + 0.5 × 0.9) = 19.2 × 0.95 = **18.24 kWh**; loss = **0.96 kWh**; efficiency = 18.24/100 = **18.24%**.
- **Check 3, wind.** A = π × 20² = 1256.64 m². P_in = ½ × 1.225 × 1256.64 × 10³/1000 = **769.69 kW**. P_e = 769.69 × 0.4 × 0.9 = **277.09 kW**. E_gen = 277.09 × 8 = **2216.7 kWh**; efficiency = 0.4 × 0.9 = **36%**.
- **Check 4, half the wind speed.** v = 5 m/s: P_in = 769.69/8 = **96.211 kW** (the cube law).
- **Check 5, wind with pumped hydro.** Half through an 80% round trip: E_del = 2216.7 × (0.5 + 0.5 × 0.8) = 2216.7 × 0.9 = **1995.0 kWh**; loss **221.67 kWh**; efficiency = 36 × 0.9 = **32.4%**. Capacity of 10 000 m³ at 100 m: E = 1000 × 10 000 × 10 × 100 = 10¹⁰ J = 10¹⁰/3.6 × 10⁶ = **2777.8 kWh**.
- **Check 6, question idea.** P_in = 12 × 1.8 × 950/1000 = 20.52 kW; P_e = 20.52 × 0.21 × 0.97 = **4.17992 kW**; E_gen = 4.17992 × 5.5 = **22.990 kWh**; with 40% through a 90% battery, E_del = 22.990 × 0.96 = **22.070 kWh**.

```acceptance
[
  { "name": "solar chain: 20 kW of sunlight to 3.84 kW", "params": { "source": "solar", "irradiance": 1000, "panelArea": 20, "panelEfficiency": 20, "inverterEfficiency": 96, "sunHours": 5, "storage": "none" }, "run": "static",
    "expect": { "sourcePower": { "value": 20, "relTol": 1e-12 }, "electricalPower": { "value": 3.84, "relTol": 1e-12 }, "energyGenerated": { "value": 19.2, "relTol": 1e-12 }, "energyDelivered": { "value": 19.2, "relTol": 1e-12 }, "chainEfficiency": { "value": 19.2, "relTol": 1e-12 } } },
  { "name": "solar with half through a 90% battery", "params": { "source": "solar", "irradiance": 1000, "panelArea": 20, "panelEfficiency": 20, "inverterEfficiency": 96, "sunHours": 5, "storage": "battery", "storageShare": 50, "batteryEfficiency": 90 }, "run": "static",
    "expect": { "energyDelivered": { "value": 18.24, "relTol": 1e-12 }, "storageLoss": { "value": 0.96, "relTol": 1e-9 }, "chainEfficiency": { "value": 18.24, "relTol": 1e-12 } } },
  { "name": "wind turbine: ½ρAv³C_p", "params": { "source": "wind", "windSpeed": 10, "rotorDiameter": 40, "powerCoefficient": 0.4, "generatorEfficiency": 90, "runHours": 8, "storage": "none" }, "run": "static",
    "expect": { "sourcePower": { "value": 769.6902001, "relTol": 1e-9 }, "electricalPower": { "value": 277.0884720, "relTol": 1e-9 }, "energyGenerated": { "value": 2216.707776, "relTol": 1e-9 }, "chainEfficiency": { "value": 36, "relTol": 1e-12 } } },
  { "name": "half the wind speed, an eighth of the power", "params": { "source": "wind", "windSpeed": 5, "rotorDiameter": 40, "powerCoefficient": 0.4, "generatorEfficiency": 90, "runHours": 8, "storage": "none" }, "run": "static",
    "expect": { "sourcePower": { "value": 96.21127502, "relTol": 1e-9 } } },
  { "name": "wind with pumped hydro", "params": { "source": "wind", "windSpeed": 10, "rotorDiameter": 40, "powerCoefficient": 0.4, "generatorEfficiency": 90, "runHours": 8, "storage": "pumped-hydro", "storageShare": 50, "pumpedEfficiency": 80, "reservoirVolume": 10000, "head": 100, "g": 10 }, "run": "static",
    "expect": { "energyDelivered": { "value": 1995.036999, "relTol": 1e-9 }, "storageLoss": { "value": 221.6707776, "relTol": 1e-9 }, "chainEfficiency": { "value": 32.4, "relTol": 1e-12 }, "storageCapacity": { "value": 2777.777778, "relTol": 1e-9 } } },
  { "name": "question idea: 12 panels on a 950 W/m² day", "params": { "source": "solar", "irradiance": 950, "panelArea": 21.6, "panelEfficiency": 21, "inverterEfficiency": 97, "sunHours": 5.5, "storage": "battery", "storageShare": 40, "batteryEfficiency": 90 }, "run": "static",
    "expect": { "electricalPower": { "value": 4.179924, "relTol": 1e-9 }, "energyGenerated": { "value": 22.989582, "relTol": 1e-9 }, "energyDelivered": { "value": 22.06999872, "relTol": 1e-9 } } }
]
```
