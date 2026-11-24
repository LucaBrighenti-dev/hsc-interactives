---
id: eng-flight-forces
title: "Flight forces and stall"
subject: eng
engine: aero
setup: flight-forces
priority: P0
status: draft            # stub → draft → approved (Gate B)
page: /interactives/engineering/flight-forces.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Engineering Studies","version":"2011","area":"Aeronautical Engineering","outcomes":[],"verified":false}
  - {"course":"Engineering Studies","version":"2026","focusArea":"Aeronautical and aerospace engineering","year":12,"outcomes":[],"verified":false,"subtopic":"Flight mechanics"}
---
# Flight forces and stall

> Backlog summary: Lift, drag, thrust and weight in level flight, climb and descent; angle of attack to stall; L/D.

## Learning goal
Students see that in steady flight the four forces balance along and across the flight path (L = W cos γ, T = D + W sin γ), that lift depends on airspeed squared and on angle of attack, and that once the wing passes its critical angle the lift falls away (the stall), so there is a lowest speed at which the aeroplane can hold its weight. They connect the lift-to-drag ratio to how efficiently an aircraft flies and glides.

Syllabus fit: 2011 Aeronautical Engineering (flight forces, stall, lift and drag); 2026 Aeronautical and aerospace engineering, Year 12, flight mechanics. Pitched at Stage 6 Engineering Studies: force balance with resolution of forces, the lift equation as a relationship to explore (not to derive), and stall as a change of airflow over the wing. Pairs with Luca's VR wind-tunnel station.

## What the student sees
Default view at 1920×1080, light projector theme:

- **Left two-thirds:** a side view of a generic light aeroplane flying along a dashed flight path inclined at γ to a faint horizon line. Four force arrows start at the centre of gravity, drawn to one shared scale (N per pixel shown in a scale bar): lift (perpendicular to the flight path, up), weight (straight down), thrust (along the path, forward) and drag (along the path, backward). Each arrow carries a text label with its value, for example "L = 10 000 N". The relative wind arrow and the angle of attack α are marked between the wing chord line and the flight path. With **Show components** on, weight is split into W cos γ (across the path, dashed) and W sin γ (along the path, dashed). Streamlines over the aerofoil stay attached below the stall and break into a turbulent wake once α passes α_stall; a "STALL" tag (text, not only colour) appears, and "Stall warning" shows within 2° of it.
- **Right third, upper:** a graph chosen with the **Graph** control. "C_L against α" shows the straight line C_L = C_L0 + 2πα up to the stall, the smooth post-stall fall (drawn dashed and labelled "illustrative"), and a dot at the current α. "Drag polar" plots C_L against C_D with the tangent from the origin that marks (L/D)max. "Thrust needed against airspeed" shows the drag curve split into parasite and induced parts, its minimum (the (L/D)max speed) and a dot at the current airspeed; the curve starts at the stall boundary.
- **Right third, lower:** the readouts.
- **Stage footer:** the assumptions below, including "g = 10 m/s²".

Nothing moves on its own: this is a static setup. Changing a slider redraws instantly.

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| alphaMode | How α is set | | | | | trim | enum: `trim` (found for steady flight), `manual` (set by hand, as in a wind tunnel) |
| alpha | Angle of attack α | ° | −5 | 25 | 0.5 | 4 | visible when alphaMode = manual |
| airspeed | Airspeed V | m/s | 5 | 100 | 0.5 | 40 | true airspeed |
| gamma | Flight path angle γ | ° | −15 | 15 | 0.5 | 0 | + climb, − descent |
| mass | Mass m | kg | 100 | 5000 | 10 | 1000 | |
| wingArea | Wing area S | m² | 2 | 60 | 0.5 | 16 | |
| altitude | Altitude h | m | 0 | 11000 | 100 | 0 | sets the air density from the ISA |
| cl0 | Lift coefficient at α = 0, C_L0 | | 0 | 0.6 | 0.01 | 0.2 | 0 for a symmetric aerofoil |
| alphaStall | Critical (stall) angle | ° | 8 | 20 | 0.5 | 15 | |
| cd0 | Zero-lift drag coefficient C_D0 | | 0.01 | 0.1 | 0.001 | 0.03 | |
| k | Induced drag factor k | | 0.01 | 0.15 | 0.001 | 0.05 | |
| g | Gravitational acceleration g | m/s² | 9.7 | 10 | 0.01 | 10 | Engineering presets use 10 |
| graph | Graph | | | | | cl-alpha | enum: `cl-alpha` (lift curve), `polar` (drag polar), `thrust-speed` (thrust needed) |
| showComponents | Show weight components | | | | | on | boolean |
| zoomThrustDrag | Draw thrust and drag 5× longer | | | | | off | boolean; thrust and drag are small beside lift and weight |

These keys, ranges and defaults match the aero engine's `meta` on `origin/w1/engine-aero` (checked 25 November 2026).

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | trim, V = 40 m/s, γ = 0°, sea level, m = 1000 kg, S = 16 m², C_L0 = 0.2, α_stall = 15°, C_D0 = 0.03, k = 0.05, g = 10 | straight and level: L = W, T = D |
| climb | default with V = 45 m/s, γ = 5° | thrust must now carry part of the weight |
| descent | default with γ = −3° | thrust drops; gravity helps |
| slow-flight | default with V = 25 m/s | α ≈ 13°: the stall warning shows |
| stall | default with alphaMode = manual, α = 18° | past the critical angle: lift falls, drag rises |
| altitude | default with altitude = 3000 m | thinner air: higher α at the same speed and a higher stall speed |

All presets use g = 10 m/s² (shown on stage).

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| lift | Lift L | N | 3 |
| weight | Weight W | N | 3 |
| drag | Drag D | N | 3 |
| thrust | Thrust needed T | N | 3 |
| alpha | Angle of attack α | ° | 3 |
| cl | Lift coefficient C_L | | 3 |
| cd | Drag coefficient C_D | | 3 |
| liftToDrag | Lift-to-drag ratio L/D | | 3 |
| stallSpeed | Stall speed, level | m/s | 3 |
| maxLiftToDrag | Best L/D, (L/D)max | | 3 |
| minDragSpeed | Speed for (L/D)max, level | m/s | 3 |
| bestGlideAngle | Best glide angle | ° | 3 |
| loadFactor | Load factor n = L/W | | 3 |
| liftSurplus | Unbalanced lift L − W cos γ | N | 3 |
| stalled | Stalled (1 = yes) | | 1 |
| density | Air density ρ | kg/m³ | 4 |

The engine also reports `clAtMaxLD`, `dynamicPressure` and `temperature`; the page may leave them out of the readout panel.

## Assumptions shown on stage
- Simplified lift model: C_L = C_L0 + 2πα up to the stall; the post-stall curve is illustrative
- Drag polar C_D = C_D0 + kC_L² (post-stall drag rise is illustrative)
- Steady flight: forces balance; thrust acts along the flight path
- International Standard Atmosphere (ISA) for air density
- g = 10 m/s²

## Try this (3–5 predict, observe, explain prompts)
1. Predict: if the airspeed halves in level flight, what must happen to the lift coefficient to keep L = W? Observe it by moving from 40 m/s to 20 m/s.
2. Observe: start a climb at γ = 5° without changing speed. Which force changes most, and by how much compared with W sin γ?
3. Predict, then observe: in the **stall** preset, set α to 15°, then 18°. What happens to lift, and what happens to drag?
4. Explain: why does the stall speed rise at 3000 m even though the wing and the weight are the same?
5. Observe: on the thrust-needed graph, find the speed that needs the least thrust. Compare L/D there with (L/D)max.

## Teacher notes outline
- Misconceptions to target: lift is always equal to weight (only in level, unaccelerated flight; in a climb L = W cos γ is slightly less); a stall is the engine stopping (it is the wing exceeding its critical angle); thrust is what holds the aeroplane up; flying faster always needs more thrust (below the minimum-drag speed, flying slower needs more).
- 10-minute lesson flow: (1) level flight at 40 m/s: read L = W and T = D; (2) slow down to 25 m/s and watch α climb towards the stall; (3) climb at 5°: resolve the weight along and across the path; (4) the stall preset: the wing past its critical angle; (5) the thrust-needed graph: parasite and induced drag trade off.
- Original HSC-style question idea: a 1200 kg light aircraft (g = 10 m/s²) climbs steadily at 4° with L/D = 11. Find the lift, the drag (D = L/(L/D)) and the thrust needed, then explain why the thrust exceeds the drag. Worked solution: L = 12 000 cos 4° = 11 970.8 N; D = 1088.3 N; W sin 4° = 837.1 N; T = 1925.3 N.

## Accessibility notes
Every force arrow has a text label with its name and value, so the forces are never told apart by colour alone. The stall state uses the word "STALL" and a hatched wake behind the wing, not only a colour change; the stall warning is a text tag. Weight components are dashed, the full weight solid. The graph's post-stall segment is dashed and labelled "illustrative". All controls are sliders, selects or toggles reachable by keyboard. Stage label: "Aeroplane in steady flight at … metres per second on a flight path of … degrees. Lift … newtons, weight … newtons, drag … newtons, thrust … newtons. Angle of attack … degrees; stalled: yes or no."

## Engine change requests
None. Every param and output used here exists in the aero engine's `meta` on `origin/w1/engine-aero` (checked 25 November 2026), and `flight-forces` is a static setup there.

## Acceptance
Every number below comes from the formula and hand calculation shown here. The aircraft in every check is the default: m = 1000 kg, g = 10 m/s², so W = mg = **10 000 N**; S = 16 m²; C_L0 = 0.2; α_stall = 15°; C_D0 = 0.03; k = 0.05. At sea level the ISA density is ρ = p₀/(RT₀) = 101 325/(287.053 × 288.15) = 1.225 kg/m³ (the engine's value is 1.22500002, a relative difference of 1.5 × 10⁻⁸, well inside every tolerance below).

Model: q = ½ρV²; steady flight needs L = W cos γ, so C_L = W cos γ/(qS); α = (C_L − C_L0)/(2π) in radians; C_D = C_D0 + kC_L²; D = qS·C_D; T = D + W sin γ.

- **Check 1, level flight at 40 m/s.** q = ½ × 1.225 × 40² = 980 Pa, so qS = 980 × 16 = 15 680 N. L = W = **10 000 N**. C_L = 10 000/15 680 = **0.637755**. α = (0.637755 − 0.2)/(2π) = 0.0696709 rad = **3.99185°**. C_D = 0.03 + 0.05 × 0.637755² = 0.0503366. D = 15 680 × 0.0503366 = **789.278 N**, and T = D (γ = 0) = **789.278 N**. L/D = 0.637755/0.0503366 = **12.6698**.
- **Check 2, steady climb at γ = 5°, V = 45 m/s.** q = ½ × 1.225 × 45² = 1240.31 Pa; qS = 19 845 N. L = 10 000 cos 5° = **9961.95 N**. C_L = 9961.95/19 845 = 0.501988; C_D = 0.03 + 0.05 × 0.501988² = 0.0425996; D = 19 845 × 0.0425996 = 845.389 N. W sin 5° = 10 000 × 0.0871557 = 871.557 N, so T = 845.389 + 871.557 = **1716.95 N**. The climb roughly doubles the thrust needed.
- **Check 3, stall speed and (L/D)max (any flight state).** C_Lmax = C_L0 + 2π × (15π/180) = 0.2 + π²/6 = 1.844934. V_s = √(2W/(ρS·C_Lmax)) = √(20 000/(1.225 × 16 × 1.844934)) = √(20 000/36.1607) = √553.087 = **23.5178 m/s**. (L/D)max = 1/(2√(kC_D0)) = 1/(2√0.0015) = **12.9099**, at C_L* = √(C_D0/k) = √0.6 = 0.774597. Level speed for (L/D)max = √(20 000/(1.225 × 16 × 0.774597)) = √(20 000/15.1821) = **36.2952 m/s**. Best glide angle = atan(1/12.9099) = atan(0.0774597) = **4.42927°**. In check 1 the aircraft is not stalled (**stalled = 0**) and the lift balances exactly (**liftSurplus = 0**).
- **Check 4, trimmed below the stall speed (V = 20 m/s).** The C_L needed is 10 000/(½ × 1.225 × 400 × 16) = 10 000/3920 = 2.551, more than C_Lmax, so the wing sits at α_stall and can only give L = 3920 × 1.844934 = **7232.14 N**, less than W. Load factor L/W = **0.723214**; α = **15°**; **stalled = 1**.
- **Check 5, α set by hand to 8° at 40 m/s.** C_L = 0.2 + 2π × (8π/180) = 0.2 + 0.877298 = **1.077298**. L = 15 680 × 1.077298 = **16 892.0 N**, so L/W = **1.68920**: more lift than weight, so the aeroplane would curve upwards.
- **Check 6, altitude 3000 m (ISA).** T = 288.15 − 0.0065 × 3000 = 268.65 K. p = 101 325 × (268.65/288.15)^5.25588 = 70 108.5 Pa. ρ = p/(RT) = 70 108.5/(287.053 × 268.65) = **0.909122 kg/m³**. V_s = √(20 000/(0.909122 × 16 × 1.844934)) = **27.2994 m/s**, higher than at sea level by the factor √(1.225/0.909122) = 1.1608.

```acceptance
[
  { "name": "level flight at 40 m/s: L = W, T = D", "params": { "alphaMode": "trim", "airspeed": 40, "gamma": 0, "altitude": 0, "mass": 1000, "wingArea": 16, "cl0": 0.2, "alphaStall": 15, "cd0": 0.03, "k": 0.05, "g": 10 }, "run": "static",
    "expect": { "lift": { "value": 10000, "absTol": 1e-6 }, "weight": { "value": 10000, "absTol": 1e-9 }, "cl": { "value": 0.637755102, "relTol": 1e-6 }, "alpha": { "value": 3.991848, "relTol": 1e-5 }, "drag": { "value": 789.2776, "relTol": 1e-5 }, "thrust": { "value": 789.2776, "relTol": 1e-5 }, "liftToDrag": { "value": 12.66981, "relTol": 1e-5 }, "liftSurplus": { "value": 0, "absTol": 1e-6 }, "stalled": { "value": 0, "absTol": 1e-12 } } },
  { "name": "steady 5° climb at 45 m/s: L = W cos γ, T = D + W sin γ", "params": { "alphaMode": "trim", "airspeed": 45, "gamma": 5, "altitude": 0, "mass": 1000, "wingArea": 16, "cl0": 0.2, "alphaStall": 15, "cd0": 0.03, "k": 0.05, "g": 10 }, "run": "static",
    "expect": { "lift": { "value": 9961.94698, "relTol": 1e-9 }, "thrust": { "value": 1716.9462, "relTol": 1e-5 } } },
  { "name": "stall speed and (L/D)max", "params": { "alphaMode": "trim", "airspeed": 40, "gamma": 0, "altitude": 0, "mass": 1000, "wingArea": 16, "cl0": 0.2, "alphaStall": 15, "cd0": 0.03, "k": 0.05, "g": 10 }, "run": "static",
    "expect": { "stallSpeed": { "value": 23.51779, "relTol": 1e-5 }, "maxLiftToDrag": { "value": 12.909944, "relTol": 1e-6 }, "minDragSpeed": { "value": 36.295196, "relTol": 1e-6 }, "bestGlideAngle": { "value": 4.4292676, "relTol": 1e-6 } } },
  { "name": "trimmed at 20 m/s is a stall: lift short of weight", "params": { "alphaMode": "trim", "airspeed": 20, "gamma": 0, "altitude": 0, "mass": 1000, "wingArea": 16, "cl0": 0.2, "alphaStall": 15, "cd0": 0.03, "k": 0.05, "g": 10 }, "run": "static",
    "expect": { "lift": { "value": 7232.1415, "relTol": 1e-5 }, "loadFactor": { "value": 0.72321415, "relTol": 1e-5 }, "alpha": { "value": 15, "absTol": 1e-9 }, "stalled": { "value": 1, "absTol": 1e-12 } } },
  { "name": "α set by hand to 8° at 40 m/s", "params": { "alphaMode": "manual", "alpha": 8, "airspeed": 40, "gamma": 0, "altitude": 0, "mass": 1000, "wingArea": 16, "cl0": 0.2, "alphaStall": 15, "cd0": 0.03, "k": 0.05, "g": 10 }, "run": "static",
    "expect": { "cl": { "value": 1.0772982, "relTol": 1e-6 }, "lift": { "value": 16892.035, "relTol": 1e-5 }, "loadFactor": { "value": 1.6892035, "relTol": 1e-5 } } },
  { "name": "ISA 3000 m: density and stall speed", "params": { "alphaMode": "trim", "airspeed": 40, "gamma": 0, "altitude": 3000, "mass": 1000, "wingArea": 16, "cl0": 0.2, "alphaStall": 15, "cd0": 0.03, "k": 0.05, "g": 10 }, "run": "static",
    "expect": { "density": { "value": 0.9091219, "relTol": 1e-5 }, "stallSpeed": { "value": 27.29943, "relTol": 1e-5 } } }
]
```
