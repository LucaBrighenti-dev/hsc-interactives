---
id: eng-pascal-hydraulics
title: "Pascal's principle"
subject: eng
engine: custom
setup: none
priority: P1
status: draft            # stub → draft → approved (Gate B)
page: /interactives/engineering/pascal-hydraulics.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Engineering Studies","version":"2011","area":"Aeronautical Engineering","outcomes":[],"verified":false}
  - {"course":"Engineering Studies","version":"2026","focusArea":"Aeronautical and aerospace engineering","year":12,"outcomes":[],"verified":false,"subtopic":"Propulsion and measurement systems"}
---
# Pascal's principle

> Backlog summary: Hydraulic press and aircraft hydraulics force calculator.

## Learning goal
Students apply Pascal's principle: pressure applied to an enclosed liquid is transmitted equally throughout it, so p = F₁/A₁ and F₂ = pA₂ = F₁A₂/A₁. They see the cost of the force gain: because the liquid's volume is conserved, the output piston moves A₁/A₂ as far, so (for an ideal system) work out equals work in. In the aircraft mode they size a double-acting actuator at a typical aircraft system pressure and see why it pushes harder than it pulls (the rod takes up part of one piston face).

Syllabus fit: 2011 Aeronautical Engineering (aircraft hydraulic systems, Pascal's principle); 2026 Aeronautical and aerospace engineering, Year 12, propulsion and measurement systems. Pitched at Stage 6: pressure, area and force; work and efficiency; no fluid flow or losses beyond a single efficiency factor.

## What the student sees
Default view at 1920×1080, light projector theme.

**Press mode (default):** a U-shaped hydraulic press in section: a narrow input cylinder on the left and a wide output cylinder on the right, joined by a pipe, filled with hatched fluid (oil). The input piston carries a downward arrow labelled "F₁ = 200 N"; the output piston carries the load (a block labelled with its mass and weight, "400 kg, W = 4000 N") and an upward arrow labelled "F₂ = 5000 N". Both piston faces show their diameter and area. Pressure gauges on each cylinder read the same value, with "p = F₁/A₁ = 0.637 MPa". The **Push** slider moves the input piston down by up to s₁; the output piston rises by s₂, with both distances dimensioned. A verdict tag says "Load rises" or "Not enough force to lift the load". A small work panel shows F₁s₁ against F₂s₂.

**Aircraft mode:** a schematic aircraft hydraulic circuit (reservoir, engine-driven pump, accumulator, selector valve) feeding a double-acting actuator drawn in section, with its bore and rod labelled. Two arrows show the extend force (full bore area) and the retract force (annulus area). The system pressure is shown in MPa and psi.

Static custom page: play, step and reset are hidden; the Push slider drives the motion.

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| mode | Mode | | | | | press | enum: `press`, `aircraft` |
| inputForce | Input force F₁ | N | 10 | 1000 | 10 | 200 | press |
| inputDiameter | Input piston diameter d₁ | mm | 10 | 100 | 1 | 20 | press |
| outputDiameter | Output piston diameter d₂ | mm | 20 | 400 | 5 | 100 | press; must exceed d₁ |
| inputStroke | Input piston travel s₁ | mm | 5 | 300 | 5 | 100 | press |
| push | Push the input piston | | 0 | 1 | 0.05 | 1 | press; fraction of s₁ shown on stage |
| efficiency | Mechanical efficiency η | % | 50 | 100 | 1 | 100 | press; seal friction losses |
| loadMass | Load mass m | kg | 0 | 5000 | 10 | 400 | press |
| g | Gravitational field g | m/s² | 9.8 | 10 | 0.2 | 10 | |
| systemPressure | System pressure p | MPa | 1 | 35 | 0.1 | 20.7 | aircraft; 20.7 MPa ≈ 3000 psi, a common aircraft system pressure |
| boreDiameter | Actuator bore D | mm | 20 | 150 | 1 | 50 | aircraft |
| rodDiameter | Rod diameter d | mm | 5 | 100 | 1 | 20 | aircraft; must be less than D |
| actuatorStroke | Actuator stroke | mm | 50 | 500 | 10 | 200 | aircraft |

## Model (custom engine `site/assets/engines/custom/eng-pascal-hydraulics/`)
Pure functions in `model.js`, all inputs as above:

- Areas: A₁ = πd₁²/4, A₂ = πd₂²/4 (mm²). Pressure p = F₁/A₁ (N/mm² = MPa).
- Output force F₂ = (η/100) × p × A₂ (N). Area ratio A₂/A₁.
- Output travel s₂ = s₁ × A₁/A₂ (volume conserved: A₁s₁ = A₂s₂; friction does not change it).
- Work in = F₁s₁/1000 (J); work out = F₂s₂/1000 (J) = (η/100) × work in.
- Load weight W = mg (N). Input force needed to lift it: F₁,needed = W × A₁/((η/100) × A₂). The load rises if F₂ ≥ W.
- Aircraft: A_bore = πD²/4, A_annulus = π(D² − d²)/4. Extend force = p × A_bore/1000 (kN); retract force = p × A_annulus/1000 (kN) (ideal, no losses). Fluid to extend once = A_bore × stroke/1000 (mL).
- Invalid geometry (d₂ ≤ d₁, d ≥ D) gives a calm message on stage and `null` outputs, never NaN.

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | press, F₁ = 200 N, d₁ = 20 mm, d₂ = 100 mm, s₁ = 100 mm, η = 100%, 400 kg, g = 10 | area ratio 25: 200 N lifts up to 5000 N |
| car-hoist | press, d₁ = 25 mm, d₂ = 250 mm, 1500 kg, F₁ = 150 N | a workshop hoist: ratio 100 |
| real-press | default with η = 80% | friction: same travel, less force and work out |
| aircraft | aircraft, p = 20.7 MPa, D = 50 mm, d = 20 mm, stroke 200 mm | a landing-gear-sized actuator |
| high-pressure | aircraft, p = 34.5 MPa (5000 psi) | newer airliners use higher pressure for smaller, lighter actuators |

All presets use g = 10 m/s² (shown on stage).

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| pressure | Pressure p | MPa | 3 |
| areaRatio | Area ratio A₂/A₁ | | 3 |
| outputForce | Output force F₂ | N | 3 |
| outputStroke | Output travel s₂ | mm | 3 |
| workIn | Work in F₁s₁ | J | 3 |
| workOut | Work out F₂s₂ | J | 3 |
| loadWeight | Load weight W = mg | N | 3 |
| effortToLift | Input force needed to lift the load | N | 3 |
| extendForce | Actuator extend force | kN | 3 |
| retractForce | Actuator retract force | kN | 3 |
| fluidVolume | Fluid to extend once | mL | 3 |

## Assumptions shown on stage
- Incompressible liquid; pistons at the same height (no hydrostatic head)
- Pressure is the same everywhere in the liquid (Pascal's principle)
- Losses lumped into one efficiency η; aircraft mode is ideal
- g = 10 m/s²

## Try this (3–5 predict, observe, explain prompts)
1. Predict: if the output piston's diameter doubles, by what factor does the output force change? Observe from 100 mm to 200 mm.
2. Observe: push the input piston its full 100 mm. How far does the output piston rise? Compare the work in and the work out.
3. Predict, then observe: in **real-press**, efficiency is 80%. Does the output piston still rise 4 mm? What changes?
4. Explain: in aircraft mode, why is the retract force smaller than the extend force at the same pressure?
5. Observe: switch to **high-pressure**. How much smaller could the bore be for the same extend force?

## Teacher notes outline
- Misconceptions to target: a hydraulic press creates energy (force goes up, distance goes down); pressure is bigger in the bigger cylinder; the output force depends on the pipe's size or length; doubling the diameter doubles the force (it quadruples, because area goes as d²).
- 10-minute lesson flow: (1) default: p = F₁/A₁ and F₂ = pA₂ by hand; (2) push the piston and compare travels; (3) work in = work out; (4) efficiency; (5) aircraft mode: why aircraft use high pressure (small, light actuators and pipes) and why the rod side is weaker.
- Original HSC-style question idea: an aircraft flap actuator has a 40 mm bore and a 16 mm rod and works at 20.7 MPa. Find the extend and retract forces, and the fluid needed to extend it 150 mm. Worked solution: A_bore = 1256.6 mm², extend = 26.01 kN; A_annulus = 1055.6 mm², retract = 21.85 kN; fluid = 188.5 mL.

## Accessibility notes
Arrows carry labels with names and values; the two gauges are labelled and read the same number in text. The fluid is hatched rather than only coloured. The lift verdict is a text tag. Extend and retract arrows are labelled "extend" and "retract" in words. All sliders are keyboard operable. Stage label: "Hydraulic press: … newtons on a … millimetre piston makes … megapascals, giving … newtons on the … millimetre piston. The output moves … millimetres for … millimetres of input."

## Engine change requests
None for shared engines. This page builds its own custom engine (`site/assets/engines/custom/eng-pascal-hydraulics/`, with `tests/engines/custom-eng-pascal-hydraulics.test.mjs`) to the model above, with every key above in its `meta.params`, every readout in its `meta.outputs`, and the page as a static setup.

## Acceptance
Every number below comes from the formula and hand calculation shown here.

- **Check 1, Pascal's principle.** d₁ = 20 mm: A₁ = π × 10² = 314.159 mm². d₂ = 100 mm: A₂ = π × 50² = 7853.98 mm². p = 200/314.159 = **0.636620 MPa**. A₂/A₁ = (100/20)² = **25**. F₂ = 0.636620 × 7853.98 = **5000 N** (= 200 × 25). s₂ = 100 × 314.159/7853.98 = **4 mm**. Work in = 200 × 0.1 = **20 J**; work out = 5000 × 0.004 = **20 J**.
- **Check 2, lifting a load.** m = 400 kg, g = 10: W = **4000 N**. Input force needed = 4000/25 = **160 N** (less than 200 N, so the load rises).
- **Check 3, efficiency 80%.** F₂ = 0.8 × 5000 = **4000 N**; s₂ is still **4 mm**; work out = 4000 × 0.004 = **16 J** = 0.8 × 20 J.
- **Check 4, car hoist.** d₁ = 25 mm, d₂ = 250 mm: A₂/A₁ = (250/25)² = **100**. A 1500 kg car weighs 15 000 N, so the input force needed is 15 000/100 = **150 N**.
- **Check 5, aircraft actuator.** p = 20.7 MPa, D = 50 mm, d = 20 mm: A_bore = π × 25² = 1963.50 mm², extend = 20.7 × 1963.50 = 40 644 N = **40.644 kN**. A_annulus = π(25² − 10²) = 1649.34 mm², retract = 20.7 × 1649.34 = 34 141 N = **34.141 kN**. Fluid for a 200 mm stroke = 1963.50 × 200 = 392 699 mm³ = **392.70 mL**.
- **Question idea check.** D = 40, d = 16, 20.7 MPa: A_bore = 1256.64 mm², extend 26.012 kN; A_annulus = 1055.58 mm², retract 21.851 kN; fluid = 1256.64 × 150 = 188 496 mm³ = 188.50 mL.

```acceptance
[
  { "name": "Pascal: pressure, force ratio and travel", "params": { "mode": "press", "inputForce": 200, "inputDiameter": 20, "outputDiameter": 100, "inputStroke": 100, "efficiency": 100 }, "run": "static",
    "expect": { "pressure": { "value": 0.6366197724, "relTol": 1e-9 }, "areaRatio": { "value": 25, "relTol": 1e-12 }, "outputForce": { "value": 5000, "relTol": 1e-12 }, "outputStroke": { "value": 4, "relTol": 1e-12 }, "workIn": { "value": 20, "relTol": 1e-12 }, "workOut": { "value": 20, "relTol": 1e-12 } } },
  { "name": "input force needed to lift 400 kg", "params": { "mode": "press", "inputForce": 200, "inputDiameter": 20, "outputDiameter": 100, "efficiency": 100, "loadMass": 400, "g": 10 }, "run": "static",
    "expect": { "loadWeight": { "value": 4000, "relTol": 1e-12 }, "effortToLift": { "value": 160, "relTol": 1e-12 } } },
  { "name": "80% efficient press", "params": { "mode": "press", "inputForce": 200, "inputDiameter": 20, "outputDiameter": 100, "inputStroke": 100, "efficiency": 80 }, "run": "static",
    "expect": { "outputForce": { "value": 4000, "relTol": 1e-12 }, "outputStroke": { "value": 4, "relTol": 1e-12 }, "workOut": { "value": 16, "relTol": 1e-12 } } },
  { "name": "car hoist: area ratio 100", "params": { "mode": "press", "inputForce": 150, "inputDiameter": 25, "outputDiameter": 250, "efficiency": 100, "loadMass": 1500, "g": 10 }, "run": "static",
    "expect": { "areaRatio": { "value": 100, "relTol": 1e-12 }, "effortToLift": { "value": 150, "relTol": 1e-12 }, "outputForce": { "value": 15000, "relTol": 1e-12 } } },
  { "name": "aircraft actuator: extend, retract and fluid", "params": { "mode": "aircraft", "systemPressure": 20.7, "boreDiameter": 50, "rodDiameter": 20, "actuatorStroke": 200 }, "run": "static",
    "expect": { "extendForce": { "value": 40.64435496, "relTol": 1e-9 }, "retractForce": { "value": 34.14125816, "relTol": 1e-9 }, "fluidVolume": { "value": 392.6990817, "relTol": 1e-9 } } },
  { "name": "question idea: flap actuator 40/16 mm", "params": { "mode": "aircraft", "systemPressure": 20.7, "boreDiameter": 40, "rodDiameter": 16, "actuatorStroke": 150 }, "run": "static",
    "expect": { "extendForce": { "value": 26.01238717, "relTol": 1e-9 }, "retractForce": { "value": 21.85040522, "relTol": 1e-9 }, "fluidVolume": { "value": 188.4955592, "relTol": 1e-9 } } }
]
```
