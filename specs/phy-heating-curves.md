---
id: phy-heating-curves
title: "Heating curves"
subject: phy
engine: fnplot
setup: heating
priority: P2
status: approved           # stub → draft → approved (Gate B)
page: /interactives/physics/heating-curves.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Physics","version":"2017","area":"Module 3: Waves and Thermodynamics","outcomes":[],"verified":false}
---
# Heating curves

> Backlog summary: Specific and latent heat; Newton's law of cooling. 2017 syllabus only until checked against 2025.

## Learning goal
Students read a heating curve for water heated at constant power: the sloping sections follow Q = mcΔT (steeper where the specific heat capacity is smaller), and the flat sections follow Q = mL, where energy goes into changing state at constant temperature. They also see that an object cooling to its surroundings follows Newton's law of cooling, losing a fixed fraction of its temperature excess in each equal time interval.

Syllabus tags: 2017 Module 3 (Waves and Thermodynamics: thermodynamics, specific heat capacity, latent heat, Newton's law of cooling). No 2025 focus-area tag yet: the backlog notes this content is unconfirmed in the 2025 Waves focus area, for W1-SYL to check.

## What the student sees
Default view at 1920×1080 (light projector stage), `heatingMode` = `curve`:

- **Main panel (about 70% of the width), the heating curve.** Temperature (°C, from the start temperature minus a margin to the end temperature plus a margin) against time (s) or, with `xAxis` = `energy`, against energy supplied (kJ). The curve draws itself during the run with an orange dot at the present point. Each section is labelled with its state and its equation, for example "ice warming: Q = m c_ice ΔT", "melting: Q = m L_f", and the plateaus at 0 °C and 100 °C are marked with dashed horizontal lines. Dimension lines under the time axis show each section's duration once the run reaches it.
- **Right (about 30%), the beaker.** A flat beaker on a heater plate showing the present state: ice blocks, a mix of ice and water during melting (the ice fraction shrinks), water, water with bubbles during boiling (the water level falls), and steam. A thermometer beside it reads the temperature. Below it, an energy counter "Q supplied = … kJ" and a stage card naming the current section.

`heatingMode` = `cooling` replaces this with a cooling curve: temperature against time for a body starting at `coolStart` in surroundings at `ambient`, with the ambient temperature as a dashed horizontal asymptote and the excess-temperature half-times marked at t½, 2t½ and 3t½ (each halving the gap to ambient).

## Parameters
Keys proposed for the `fnplot` engine's `heating` setup. The param names match the in-progress `w1/engine-fnplot` model (read on 25 November; its `index.js` did not exist yet); the ranges and the output keys are proposals. See "Engine change requests".

| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| heatingMode | Graph | | | | | curve | enum: `curve` (Heating curve), `cooling` (Newton's law of cooling) |
| mass | Mass of water m | kg | 0.05 | 5 | 0.05 | 0.5 | `visibleWhen: { heatingMode: 'curve' }` |
| power | Heater power P | W | 50 | 3000 | 50 | 500 | `visibleWhen: { heatingMode: 'curve' }` |
| startTemp | Start temperature | °C | −50 | 100 | 1 | −20 | 0 °C means ice at 0 °C |
| endTemp | Final temperature | °C | −49 | 150 | 1 | 120 | must exceed the start temperature |
| xAxis | Horizontal axis | | | | | time | enum: `time` (Time), `energy` (Energy supplied); `visibleWhen: { heatingMode: 'curve' }` |
| cIce | Specific heat of ice | J kg⁻¹ K⁻¹ | 1000 | 3000 | 10 | 2100 | advanced |
| cWater | Specific heat of water | J kg⁻¹ K⁻¹ | 3000 | 5000 | 10 | 4190 | advanced; set 4180 or 4200 to match a question |
| cSteam | Specific heat of steam | J kg⁻¹ K⁻¹ | 1000 | 3000 | 10 | 2010 | advanced |
| latentFusion | Latent heat of fusion L_f | J/kg | 100000 | 500000 | 1000 | 334000 | advanced |
| latentVaporisation | Latent heat of vaporisation L_v | J/kg | 1000000 | 3000000 | 1000 | 2256000 | advanced |
| coolStart | Starting temperature T₀ | °C | 30 | 100 | 1 | 90 | `visibleWhen: { heatingMode: 'cooling' }` |
| ambient | Surroundings T_env | °C | 0 | 40 | 1 | 20 | `visibleWhen: { heatingMode: 'cooling' }` |
| coolingK | Cooling constant k | s⁻¹ | 0.0005 | 0.02 | 0.0005 | 0.002 | `visibleWhen: { heatingMode: 'cooling' }` |
| timeScale | Playback speed | × | 0.25 | 2 | 0.25 | 1 | |

The material constants default to the sourced values carried by the in-progress engine (Young and Freedman, *University Physics*, 15th ed., Tables 17.3 and 17.4, and Serway and Jewett for steam), at standard atmospheric pressure.

## Model
- **Heating curve** (constant power P, no losses). Sections in order, each only if the temperature range covers it: ice warming to 0 °C, Q = m c_ice ΔT; melting at 0 °C, Q = m L_f (included when the start is at or below 0 °C and the end is above 0 °C); water warming, Q = m c_water ΔT; boiling at 100 °C, Q = m L_v (when the end is above 100 °C); steam warming, Q = m c_steam ΔT. Each section lasts Q/P. Temperature is linear in time within a section.
- **Cooling** (Newton's law): T(t) = T_env + (T₀ − T_env)e^{−kt}; the excess-temperature half-time is t½ = ln 2/k. A run lasts five time constants, 5/k, by which time the excess has fallen below 1%.
- **Time-based:** each run advances in fixed steps from t = 0 to its total time (the in-progress engine uses 600 steps per run, about 10 s at 1×), then completes with t exactly equal to the total.
- endTemp ≤ startTemp: no curve; the stage says "Choose a final temperature above the start" and the outputs are `null`.

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | heatingMode curve, mass 0.5, power 500, startTemp −20, endTemp 120, xAxis time | the full curve: two plateaus, boiling far longer than melting |
| energy-axis | as default with xAxis energy | section widths are now Q, so ice warms in 21 kJ but boils in 1128 kJ |
| ice-to-water | heatingMode curve, mass 1, power 1000, startTemp −10, endTemp 50, xAxis time | a shorter run for a single lesson calculation |
| kettle | heatingMode curve, mass 0.2, power 100, startTemp 20, endTemp 100, cWater 4200 | a single warming section with a textbook c value |
| cooling | heatingMode cooling, coolStart 90, ambient 20, coolingK 0.002 | Newton's law, half-time 347 s |

No catalogue listing reuses this page.

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| time | Time t | s | 4 |
| temperature | Temperature | °C | 3 |
| heatSupplied | Energy supplied Q | J | 4 |
| meltTime | Time to melt | s | 4 |
| boilTime | Time to boil away | s | 4 |
| totalTime | Total time | s | 4 |
| totalEnergy | Total energy | J | 4 |
| halfTime | Half-time of the excess t½ | s | 3 |

`meltTime`, `boilTime`, `totalEnergy` and `heatSupplied` are `null` in cooling mode; `halfTime` is `null` on the heating curve.

## Assumptions shown on stage
- Constant heater power; all of it heats the water (no losses)
- Water at standard atmospheric pressure: melts at 0 °C, boils at 100 °C
- Uniform temperature throughout the sample
- Material constants: typical values (editable)
- Cooling: Newton's law, constant surroundings temperature

## Try this (3–5 predict, observe, explain prompts)
1. **Predict:** which plateau will be longer, melting or boiling? By roughly what factor? Play the default and check.
2. **Observe:** compare the slope of the ice-warming section with the water-warming section. Which is steeper, and which quantity explains it?
3. **Explain:** during melting the heater is still supplying 500 W, but the temperature does not rise. Where is the energy going?
4. **Predict, then observe:** double the mass. What happens to each section's duration? What happens if you double the power instead?
5. **Explain:** in cooling mode, the temperature excess halves every 347 s. Why does the body cool quickly at first and then more and more slowly?

## Teacher notes outline
- **Misconceptions to target:** temperature and heat are the same thing; temperature must rise whenever energy is supplied (not during a change of state); boiling water gets hotter if you turn the heater up (it boils faster at 100 °C); melting and boiling take similar energy (L_v is about 6.8 times L_f); a cooling body loses temperature at a constant rate (the rate is proportional to the excess).
- **10-minute lesson flow:** 2 min prompt 1 predictions; 3 min the default curve with the beaker and section labels; 2 min the energy-axis preset to compare Q for each section; 2 min calculate the melting time by hand and check; 1 min the cooling preset.
- **Original HSC-style question idea:** a 750 W heater warms 0.40 kg of ice from −15 °C until all of it has turned to water at 40 °C (c_ice = 2100, c_water = 4190 J kg⁻¹ K⁻¹, L_f = 3.34 × 10⁵ J kg⁻¹). (a) Sketch the temperature–time graph with times marked. (b) Calculate the total time taken. (c) Explain why the graph is flat during melting. Worked solution in the notes file (12 600 + 133 600 + 67 040 = 213 240 J; 284.3 s).

## Accessibility notes
- Sections are labelled in words on the graph and the stage card names the current section; plateaus are dashed lines with temperature labels. Colour is never the only cue.
- The thermometer and energy counter give the values in text.
- Keyboard: all controls through the shell; the advanced constants are number inputs.
- Stage `aria-label` (engine `describe()`): "Heating curve for 0.5 kilograms of water from −20 to 120 degrees Celsius at 500 watts. Now melting at 0 degrees, 230 seconds in; melting takes 334 seconds."

## Engine change requests
Keys to reconcile with engine meta: the `fnplot` engine's `index.js` was not written when this spec was drafted. The param names above match the in-progress `w1/engine-fnplot` model's `solveHeating` (25 November); the ranges, `xAxis` and every output key are **proposals** for the `fnplot` builder to adopt or rename (then this spec is updated to match). Features this page needs from the `heating` setup:
1. Outputs `time`, `temperature`, `heatSupplied`, `meltTime`, `boilTime`, `totalTime`, `totalEnergy` and `halfTime` as defined above.
2. An `xAxis` option to plot against energy supplied as well as time.
3. Completion at exactly the total time (heating) or 5/k (cooling).

## Acceptance
Every number below comes from the formula and hand calculation shown here, with c_ice = 2100, c_water = 4190, c_steam = 2010 J kg⁻¹ K⁻¹, L_f = 3.34 × 10⁵ and L_v = 2.256 × 10⁶ J kg⁻¹ unless stated.

- **Check 1, the full curve.** m = 0.5 kg, P = 500 W, −20 °C to 120 °C:
  - ice warming: 0.5 × 2100 × 20 = 21 000 J → 42 s;
  - melting: 0.5 × 334 000 = 167 000 J → **334 s** (from 42 s to 376 s);
  - water warming: 0.5 × 4190 × 100 = 209 500 J → 419 s (to 795 s);
  - boiling: 0.5 × 2 256 000 = 1 128 000 J → **2256 s** (to 3051 s);
  - steam warming: 0.5 × 2010 × 20 = 20 100 J → 40.2 s (to **3091.2 s**).
  Total energy = 21 000 + 167 000 + 209 500 + 1 128 000 + 20 100 = **1 545 600 J**. At the end of the run, t = **3091.2 s** and T = **120 °C**.
- **Check 2, ice to warm water.** m = 1 kg, P = 1000 W, −10 °C to 50 °C: 21 000 J (21 s) + 334 000 J (334 s) + 1 × 4190 × 50 = 209 500 J (209.5 s). Total **564 500 J**, **564.5 s**; no boiling, so boilTime = **0**.
- **Check 3, flat during melting.** Same run as check 2, after 300 steps: with 600 steps per run, t = 300/600 × 564.5 = 282.25 s, inside the melting section (21 s to 355 s), so **T = 0 °C**. (Step 300 falls inside melting for any run length from 478 to 8 064 steps, since 21 < 300/N × 564.5 < 355.)
- **Check 4, a textbook c value.** m = 0.2 kg, P = 100 W, 20 °C to 100 °C with c_water = 4200: Q = 0.2 × 4200 × 80 = **67 200 J**, t = **672 s**.
- **Check 5, Newton's law of cooling.** T₀ = 90 °C, T_env = 20 °C, k = 0.002 s⁻¹: t½ = ln 2/0.002 = **346.5736 s**. At the start, **T = 90 °C**. The run ends at 5/k = **2500 s**, where T = 20 + 70e⁻⁵ = 20 + 70 × 0.006 738 = **20.471 66 °C**.

Tolerances: 1 × 10⁻⁹ relative for sums of closed forms; 1 × 10⁻⁶ for the cooling exponentials; zero values use absolute tolerances.

```acceptance
[
  { "name": "full heating curve for 0.5 kg at 500 W", "params": { "heatingMode": "curve", "mass": 0.5, "power": 500, "startTemp": -20, "endTemp": 120 }, "run": "complete",
    "expect": { "meltTime": { "value": 334, "relTol": 1e-9 }, "boilTime": { "value": 2256, "relTol": 1e-9 }, "totalTime": { "value": 3091.2, "relTol": 1e-9 },
                "totalEnergy": { "value": 1545600, "relTol": 1e-9 }, "time": { "value": 3091.2, "relTol": 1e-9 }, "temperature": { "value": 120, "relTol": 1e-9 } } },
  { "name": "ice to water at 50 C", "params": { "heatingMode": "curve", "mass": 1, "power": 1000, "startTemp": -10, "endTemp": 50 }, "run": "static",
    "expect": { "totalEnergy": { "value": 564500, "relTol": 1e-9 }, "totalTime": { "value": 564.5, "relTol": 1e-9 }, "boilTime": { "value": 0, "absTol": 1e-9 } } },
  { "name": "temperature flat during melting", "params": { "heatingMode": "curve", "mass": 1, "power": 1000, "startTemp": -10, "endTemp": 50 }, "run": { "steps": 300 },
    "expect": { "temperature": { "value": 0, "absTol": 1e-9 } } },
  { "name": "kettle with c = 4200", "params": { "heatingMode": "curve", "mass": 0.2, "power": 100, "startTemp": 20, "endTemp": 100, "cWater": 4200 }, "run": "static",
    "expect": { "totalEnergy": { "value": 67200, "relTol": 1e-9 }, "totalTime": { "value": 672, "relTol": 1e-9 } } },
  { "name": "Newton cooling half-time and start", "params": { "heatingMode": "cooling", "coolStart": 90, "ambient": 20, "coolingK": 0.002 }, "run": "static",
    "expect": { "halfTime": { "value": 346.5735903, "relTol": 1e-6 }, "temperature": { "value": 90, "relTol": 1e-9 } } },
  { "name": "Newton cooling after five time constants", "params": { "heatingMode": "cooling", "coolStart": 90, "ambient": 20, "coolingK": 0.002 }, "run": "complete",
    "expect": { "time": { "value": 2500, "relTol": 1e-9 }, "temperature": { "value": 20.47165629, "relTol": 1e-6 } } }
]
```
