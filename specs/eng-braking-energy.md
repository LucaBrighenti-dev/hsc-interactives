---
id: eng-braking-energy
title: "Braking energy"
subject: eng
engine: particle2d
setup: braking
priority: P1
status: draft            # stub → draft → approved (Gate B)
page: /interactives/engineering/braking-energy.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Engineering Studies","version":"2011","area":"Braking Systems","outcomes":[],"verified":false}
  - {"course":"Engineering Studies","version":"2026","focusArea":"Transport engineering and automation","year":12,"outcomes":[],"verified":false}
---
# Braking energy

> Backlog summary: Stopping distance, work done by friction, heat into rotors.

## Learning goal
Students see that a braking vehicle's kinetic energy ½mv² is all turned into heat by the work done against friction, so the braking distance is v²/(2μg) and grows with the square of the speed, while the reaction distance grows only in proportion to it. They estimate how hot the brake rotors get from Q = mcΔT and relate this to brake design (rotor mass, material, ventilation).

Syllabus fit: 2011 Braking Systems (friction, energy conversion in brakes, stopping distances); 2026 Transport engineering and automation, Year 12. Pitched at Stage 6: uniform deceleration, work–energy, specific heat; no tyre slip models.

## What the student sees
Default view at 1920×1080, light projector theme:

- **Upper half:** a side view of a car on a flat road with distance markers every 5 m. The car moves right. During the reaction time a "Reacting" tag shows and the car keeps its speed; then a "Braking" tag shows and a friction arrow (labelled "F = μmg = … N") points backwards at the tyres. Bands under the road mark the reaction distance (hatched, labelled "reaction … m") and the braking distance (solid, labelled "braking … m"). A speed label above the car gives m/s and km/h.
- **Lower left:** the velocity–time graph (flat during the reaction time, then a straight line of slope −μg to zero), drawn live.
- **Lower right:** energy bars (kinetic energy now, work done by friction so far) and a rotor thermometer showing the rotors' temperature rise in K.
- **Footer:** the assumptions, including "g = 10 m/s²".

The run ends when the car stops (the scenario completes).

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| speed | Speed before the hazard v₀ | m/s | 0 | 60 | 0.5 | 20 | 20 m/s = 72 km/h; the stage also shows km/h |
| reactionTime | Reaction time t_r | s | 0 | 3 | 0.1 | 1 | |
| mu | Tyre–road friction μ | | 0.1 | 1.2 | 0.01 | 0.7 | dry bitumen about 0.7; wet about 0.4; ice about 0.1 |
| carMass | Car mass m | kg | 500 | 3000 | 50 | 1500 | |
| rotorMass | Brake rotor mass (all rotors) | kg | 2 | 60 | 1 | 30 | |
| rotorHeat | Rotor specific heat c | J/(kg·K) | 100 | 1000 | 1 | 449 | 449 J/(kg·K): iron at 25 °C (CRC Handbook of Chemistry and Physics); grey cast iron rotors are similar |
| g | Gravitational field g | m/s² | 1 | 25 | 0.1 | 9.8 | every preset on this page sets 10 |
| timeScale | Playback speed | × | 0.25 | 2 | 0.25 | 1 | |

These keys, ranges and engine defaults match the particle2d engine's `meta` on `origin/w1/engine-particle2d` (checked 25 November 2026).

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | v₀ = 20 m/s, t_r = 1 s, μ = 0.7, m = 1500 kg, rotors 30 kg, c = 449, g = 10 | a typical urban stop: 48.6 m |
| brakes-only | default with t_r = 0 | braking alone: 28.6 m |
| tired-driver | default with t_r = 1.5 s | the reaction distance grows in proportion to speed |
| wet-road | default with μ = 0.4 | 50 m of braking instead of 28.6 m |
| highway | default with v₀ = 30 m/s (108 km/h) | the squared speed term dominates |
| heavy-vehicle | default with m = 3000 kg | the same distance, twice the heat |

Every preset sets g = 10 m/s² (shown on stage).

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| v | Velocity v | m/s | 3 |
| t | Time t | s | 3 |
| x | Distance travelled x | m | 3 |
| deceleration | Braking deceleration μg | m/s² | 3 |
| brakingForce | Friction force μmg | N | 3 |
| reactionDistance | Reaction distance | m | 3 |
| brakingDistance | Braking distance | m | 3 |
| stoppingDistance | Stopping distance (reaction + braking) | m | 3 |
| stoppingTime | Time to stop | s | 3 |
| kineticEnergy | Kinetic energy now | J | 3 |
| frictionWork | Work done by friction so far | J | 3 |
| rotorTempRise | Rotor temperature rise | K | 3 |

The reaction, braking and stopping readouts are measured from the run and show "—" until the car reaches each point.

## Assumptions shown on stage
- Flat road, no air resistance or rolling resistance
- Constant braking force μmg (wheels keep turning, no skid; no ABS model)
- All the braking energy goes into the rotors as heat; none is lost during the stop
- g = 10 m/s²

## Try this (3–5 predict, observe, explain prompts)
1. Predict: if you double the speed, what happens to the braking distance? Observe with 20 m/s and 40 m/s (use **brakes-only**).
2. Observe: with a 1 s reaction time, which part of the stopping distance is bigger at 20 m/s, and which at 30 m/s?
3. Predict, then observe: double the car's mass. Does the braking distance change? Does the rotor temperature rise change?
4. Explain: why does the braking distance not depend on mass in this model, when the friction force does?
5. Observe: halve the rotor mass. What happens to the temperature rise, and why do performance cars use larger, ventilated rotors?

## Teacher notes outline
- Misconceptions to target: stopping distance is proportional to speed (the braking part goes as v²); heavier vehicles take longer to stop on the same road (not when μ and g are fixed); friction "uses up" energy (it converts kinetic energy to internal energy); a locked wheel stops a car fastest (sliding friction is usually lower, and steering is lost).
- 10-minute lesson flow: (1) **brakes-only**: read 28.6 m and check v²/(2μg); (2) double the speed: four times the distance; (3) the default with reaction time: compare the two parts; (4) energy bars: kinetic energy into heat; (5) rotor temperature from Q = mcΔT, brake fade, and why the front brakes are larger (they do most of the work as weight shifts forward).
- Original HSC-style question idea: a 1800 kg utility travelling at 25 m/s brakes to rest on a road with μ = 0.6 (g = 10 m/s²). Find the braking distance, the braking force, the work done by friction, and the temperature rise of its four rotors (36 kg in total, c = 449 J/(kg·K)) if they absorb all the energy. Worked solution: s = 625/12 = 52.1 m; F = 0.6 × 1800 × 10 = 10 800 N; W = ½ × 1800 × 625 = 562 500 J; ΔT = 562 500/(36 × 449) = 34.8 K.

## Accessibility notes
The reaction and braking bands differ by fill pattern (hatched against solid) and carry text labels with their lengths. The phase is named in a text tag ("Reacting", "Braking", "Stopped"). Graph curves are labelled at their ends, and the energy bars are labelled in words. All controls are keyboard operable; Space plays and pauses. Stage label: "A … kilogram car braking from … metres per second with friction coefficient … after a … second reaction time. Reaction distance … metres, braking distance … metres, total … metres. The rotors warm by … kelvin."

## Engine change requests
- None for the keys: every param and output used here is in the particle2d engine's `meta` for `braking` on `origin/w1/engine-particle2d` (checked 25 November 2026): params `speed`, `reactionTime`, `mu`, `carMass`, `rotorMass`, `rotorHeat`, `g`, `timeScale`; outputs `v`, `t`, `x`, `deceleration`, `brakingForce`, `reactionDistance`, `brakingDistance`, `stoppingDistance`, `stoppingTime`, `kineticEnergy`, `frictionWork`, `rotorTempRise`.
- `kineticEnergy` is the kinetic energy now (½mv² at the current speed), so the initial value is checked with a static run and the final value (0) with a complete run.

## Acceptance
Every number below comes from the formula and hand calculation shown here. Model: constant speed v₀ for the reaction time, then deceleration a = μg until v = 0. Reaction distance s_r = v₀t_r; braking distance s_b = v₀²/(2μg); braking time t_b = v₀/(μg); friction force F = μmg; work done by friction = F × s_b = ½mv₀²; rotor temperature rise ΔT = work/(m_rotors × c). Distances and times measured from the run use the engine's §9.1 tolerance of 0.5%; closed forms that need no integration use tight tolerances.

- **Check 1, the §9.1 braking test.** v₀ = 20 m/s, μ = 0.7, g = 10, t_r = 0. a = 0.7 × 10 = **7 m/s²**; F = 0.7 × 1500 × 10 = **10 500 N**. s_b = 20²/(2 × 7) = 400/14 = **28.571 m**. t_b = 20/7 = **2.857 s**.
- **Check 2, energy before the stop.** m = 1500 kg, v₀ = 20 m/s: KE = ½ × 1500 × 20² = **300 000 J** (static run, t = 0).
- **Check 3, energy after the stop.** Work done by friction = 10 500 × 28.571 = **300 000 J**, all of the kinetic energy, so KE = **0** at the end. Rotors 30 kg with c = 449 J/(kg·K): ΔT = 300 000/(30 × 449) = 300 000/13 470 = **22.272 K**.
- **Check 4, reaction time.** t_r = 1.5 s at 20 m/s: s_r = 20 × 1.5 = **30 m**. Stopping distance = 30 + 28.571 = **58.571 m**. Time to stop = 1.5 + 2.857 = **4.357 s**.
- **Check 5, double the speed.** v₀ = 40 m/s, t_r = 0: s_b = 1600/14 = **114.29 m**, four times 28.571 m.
- **Check 6, wet road.** μ = 0.4, v₀ = 20 m/s: s_b = 400/(2 × 0.4 × 10) = **50 m**.
- **Check 7, question idea.** m = 1800 kg, v₀ = 25 m/s, μ = 0.6, t_r = 0: s_b = 625/12 = **52.083 m**; F = **10 800 N**; work = **562 500 J**; with 36 kg of rotors at 449 J/(kg·K), ΔT = 562 500/16 164 = **34.800 K**.

```acceptance
[
  { "name": "§9.1 braking: 20 m/s, μ = 0.7, g = 10", "params": { "speed": 20, "mu": 0.7, "g": 10, "reactionTime": 0, "carMass": 1500 }, "run": "complete",
    "expect": { "deceleration": { "value": 7, "relTol": 1e-9 }, "brakingForce": { "value": 10500, "relTol": 1e-9 }, "brakingDistance": { "value": 28.5714286, "relTol": 0.005 }, "stoppingTime": { "value": 2.8571429, "relTol": 0.005 } } },
  { "name": "kinetic energy before braking", "params": { "speed": 20, "mu": 0.7, "g": 10, "reactionTime": 0, "carMass": 1500 }, "run": "static",
    "expect": { "kineticEnergy": { "value": 300000, "relTol": 1e-9 } } },
  { "name": "all the kinetic energy becomes heat in the rotors", "params": { "speed": 20, "mu": 0.7, "g": 10, "reactionTime": 0, "carMass": 1500, "rotorMass": 30, "rotorHeat": 449 }, "run": "complete",
    "expect": { "frictionWork": { "value": 300000, "relTol": 0.005 }, "kineticEnergy": { "value": 0, "absTol": 1e-6 }, "rotorTempRise": { "value": 22.2717149, "relTol": 0.005 } } },
  { "name": "reaction time adds v₀t_r", "params": { "speed": 20, "mu": 0.7, "g": 10, "reactionTime": 1.5, "carMass": 1500 }, "run": "complete",
    "expect": { "reactionDistance": { "value": 30, "relTol": 0.005 }, "stoppingDistance": { "value": 58.5714286, "relTol": 0.005 }, "stoppingTime": { "value": 4.3571429, "relTol": 0.005 } } },
  { "name": "double the speed, four times the braking distance", "params": { "speed": 40, "mu": 0.7, "g": 10, "reactionTime": 0, "carMass": 1500 }, "run": "complete",
    "expect": { "brakingDistance": { "value": 114.285714, "relTol": 0.005 } } },
  { "name": "wet road μ = 0.4", "params": { "speed": 20, "mu": 0.4, "g": 10, "reactionTime": 0, "carMass": 1500 }, "run": "complete",
    "expect": { "brakingDistance": { "value": 50, "relTol": 0.005 } } },
  { "name": "question idea: 1800 kg at 25 m/s, μ = 0.6", "params": { "speed": 25, "mu": 0.6, "g": 10, "reactionTime": 0, "carMass": 1800, "rotorMass": 36, "rotorHeat": 449 }, "run": "complete",
    "expect": { "brakingDistance": { "value": 52.0833333, "relTol": 0.005 }, "brakingForce": { "value": 10800, "relTol": 1e-9 }, "frictionWork": { "value": 562500, "relTol": 0.005 }, "rotorTempRise": { "value": 34.7995546, "relTol": 0.005 } } }
]
```
