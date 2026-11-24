---
id: eng-simple-machines
title: "Simple machines"
subject: eng
engine: custom
setup: none
priority: P1
status: draft            # stub → draft → approved (Gate B)
page: /interactives/engineering/simple-machines.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Engineering Studies","version":"2011","area":"Engineering fundamentals","subtopic":"Engineering mechanics","year":11,"outcomes":["P3.1"],"url":"https://www.nsw.gov.au/education-and-training/nesa/curriculum/tas/engineering-studies-stage-6-2011","verified":true}
  - {"course":"Engineering Studies","version":"2026","focusArea":"Applied engineering analysis","subtopic":"Mechanics of simple machines","year":11,"outcomes":["ES-11-04"],"url":"https://curriculum.nsw.edu.au/learning-areas/tas/engineering-studies-11-12-2026/content/year-11/faa305594d","verified":true}
  - {"course":"Engineering Studies","version":"2026","focusArea":"Transport engineering and automation","subtopic":"Simple machines","year":12,"outcomes":["ES-12-04"],"url":"https://curriculum.nsw.edu.au/learning-areas/tas/engineering-studies-11-12-2026/content/year-12/fab1f95ed9","verified":true}
---
# Simple machines

> Backlog summary: Lever classes, pulleys, gears, screw threads; MA, VR and efficiency.

## Learning goal
Students calculate the velocity ratio (VR, from the geometry: effort distance ÷ load distance), the mechanical advantage (MA = load ÷ effort) and the efficiency η = MA/VR for levers of each class, pulley blocks, gear trains and screw jacks. They see that a machine trades force for distance, that friction makes MA less than VR, and that work out is always less than work in for a real machine.

Syllabus fit: 2011 Engineering fundamentals (engineering mechanics: levers, pulleys, gears, screws; MA, VR, efficiency); 2026 Applied engineering analysis, Year 11, mechanics of simple machines, revisited in Transport engineering and automation, Year 12. Pitched at Stage 6: MA, VR, η and work for single machines; gear trains as speed and torque ratios.

## What the student sees
Default view at 1920×1080, light projector theme, one machine at a time chosen with **Machine**:

- **Lever:** a beam on a triangular fulcrum, with the load (a block labelled with its mass and weight) and an effort arrow placed for the chosen class (class 1: fulcrum between; class 2: load between; class 3: effort between). The effort and load arms are dimension lines with values. The **Lift** slider (`lift`) tilts the lever about the fulcrum: the load end rises by up to the chosen load distance and the effort end moves VR times as far, both dimensioned as vertical distances.
- **Pulley:** a block and tackle with the chosen number of supporting strands, each strand numbered, the effort pulling the free rope end. Lifting the load by d pulls n × d of rope, shown with a rope-length counter.
- **Gears:** two meshing spur gears drawn with their tooth counts, the driver turning at the input speed and the driven gear at the output speed (direction arrows show they turn opposite ways). Torque labels on each shaft.
- **Screw jack:** a screw thread in section with its pitch dimensioned, a handle of the chosen radius, and the load on top. One handle turn raises the load by one pitch.
- **Results panel (every machine):** VR, MA and η, plus a work bar (work in against work out, with the lost work hatched).
- **Footer:** the assumptions, including "g = 10 m/s²".

Static custom page: play, step and reset are hidden; the **Lift** slider (`lift`, for the lever, pulley and screw jack) and the input speed (gears) drive the motion on stage.

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| machine | Machine | | | | | lever | enum: `lever`, `pulley`, `gears`, `screw` |
| leverClass | Lever class | | | | | 1 | enum: `1`, `2`, `3` |
| effortArm | Effort arm | m | 0.05 | 3 | 0.05 | 1.2 | lever; distance from fulcrum to effort |
| loadArm | Load arm | m | 0.05 | 3 | 0.05 | 0.3 | lever; class 2 needs load arm < effort arm, class 3 the reverse |
| strands | Supporting strands n | | 1 | 6 | 1 | 4 | pulley; integer |
| driverTeeth | Driver teeth | | 8 | 80 | 1 | 12 | gears; integer |
| drivenTeeth | Driven teeth | | 8 | 80 | 1 | 36 | gears; integer |
| inputSpeed | Input speed | rpm | 10 | 3000 | 10 | 300 | gears |
| inputTorque | Input torque | N·m | 1 | 100 | 0.5 | 10 | gears |
| pitch | Thread pitch (single start) | mm | 1 | 12 | 0.5 | 5 | screw |
| handleRadius | Handle radius | mm | 50 | 600 | 10 | 300 | screw |
| loadMass | Load mass | kg | 1 | 5000 | 1 | 100 | lever, pulley, screw |
| loadDistance | Distance the load rises | m | 0.01 | 2 | 0.01 | 0.5 | lever, pulley, screw; for a lever it is capped at 0.5 × load arm (see the model) |
| lift | Lift | | 0 | 1 | 0.05 | 1 | the fraction of the load distance shown on stage (like the Pascal page's `push`); readouts always use the full load distance |
| efficiency | Efficiency η (friction losses) | % | 10 | 100 | 1 | 100 | |
| g | Gravitational field g | m/s² | 9.8 | 10 | 0.2 | 10 | |

## Model (custom engine `site/assets/engines/custom/eng-simple-machines/`)
Pure functions in `model.js`:

- Load W = loadMass × g (N).
- VR: lever = effortArm/loadArm; pulley = n; gears = drivenTeeth/driverTeeth; screw = 2π × handleRadius/pitch.
- MA = (η/100) × VR; effort E = W/MA (lever, pulley, screw); ideal effort = W/VR.
- Reported efficiency = MA/VR × 100, where MA is recomputed as W/E (this is the check that the three quantities agree).
- Distances: effort distance = loadDistance × VR. Work out = W × loadDistance; work in = E × effort distance (J).
- Lever geometry: the lever turns through an angle θ about the fulcrum, so the load end rises loadArm × sin θ and the effort end moves effortArm × sin θ (both vertical); their ratio is still effortArm/loadArm = VR. θ is capped at 30°, so for a lever the load distance used is min(loadDistance, 0.5 × loadArm), and the stage says "Limited to a 30° swing of the lever" when the cap applies.
- Gears: output speed = inputSpeed/VR (rpm); output torque = (η/100) × VR × inputTorque; MA = output torque/input torque; power = torque × 2πN/60 (W).
- Lever class rules: class 2 requires loadArm < effortArm; class 3 requires effortArm < loadArm. A combination that breaks the class shows a message on stage and gives `null` outputs.

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | lever, class 1, effort arm 1.2 m, load arm 0.3 m, 100 kg, lift 0.1 m, η = 100%, g = 10 | VR = 4: 250 N lifts 1000 N; the effort end moves 0.4 m |
| wheelbarrow | lever, class 2, effort arm 1.5 m, load arm 0.5 m, 60 kg, lift 0.1 m, η = 100% | class 2: load between |
| forearm | lever, class 3, effort arm 0.05 m, load arm 0.3 m, 2 kg in the hand, lift 0.1 m | class 3: MA below 1, but the hand (and the load in it) moves six times as far as the muscle's attachment point |
| pulley | pulley, n = 4, 200 kg, η = 80%, lift 0.5 m | friction: MA 3.2 against VR 4 |
| gearbox | gears, 12 → 36 teeth, 300 rpm, 10 N·m, η = 95% | a 3:1 reduction |
| screw-jack | screw, pitch 5 mm, handle 300 mm, 1500 kg, η = 30%, lift 0.05 m | huge VR; most screw jacks are under 50% efficient |

All presets use g = 10 m/s² (shown on stage).

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| vr | Velocity ratio VR | | 4 |
| ma | Mechanical advantage MA | | 4 |
| efficiencyOut | Efficiency η = MA/VR | % | 3 |
| load | Load W | N | 4 |
| effort | Effort E | N | 4 |
| idealEffort | Effort with no friction, W/VR | N | 4 |
| effortDistance | Effort distance | m | 4 |
| workOut | Work out | J | 4 |
| workIn | Work in | J | 4 |
| outputSpeed | Output speed | rpm | 4 |
| outputTorque | Output torque | N·m | 4 |
| powerIn | Input power | W | 4 |
| powerOut | Output power | W | 4 |

Readouts that do not apply to the chosen machine show "—".

## Assumptions shown on stage
- Rigid parts; weightless levers, ropes and pulleys
- Friction lumped into one efficiency η (constant)
- Ropes vertical; single-start screw thread
- g = 10 m/s²

## Try this (3–5 predict, observe, explain prompts)
1. Predict: for a class 1 lever with arms of 1.2 m and 0.3 m, what effort lifts 100 kg? Observe, then halve the effort arm.
2. Observe: in the **pulley** preset, compare the effort with and without friction (η = 80% and 100%). How far must you pull the rope either way?
3. Predict, then observe: in the **forearm** preset, MA is less than 1. What does the arm gain in exchange?
4. Explain: in the **gearbox**, the output torque nearly triples. Why does the output power go down, not up?
5. Observe: the **screw jack** is only 30% efficient. Why is that useful when you let go of the handle?

## Teacher notes outline
- Misconceptions to target: a machine reduces the work you do (it reduces force, not work); MA and VR are the same thing (VR is geometric, MA is measured); efficiency can exceed 100% with a clever design; the bigger gear turns faster.
- 10-minute lesson flow: (1) lever classes with everyday examples; (2) VR from geometry and MA from forces; (3) the pulley with friction: η = MA/VR; (4) the work bar: work in = work out + work lost; (5) gears and the screw jack as rotating machines; why low efficiency makes a screw jack self-locking.
- Original HSC-style question idea: a block and tackle with five supporting strands lifts a 240 kg engine 0.8 m with an effort of 600 N (g = 10 m/s²). Find VR, MA, η, the length of rope pulled through, and the work lost. Worked solution: VR = 5; W = 2400 N; MA = 2400/600 = 4; η = 4/5 = 80%; rope = 5 × 0.8 = 4 m; work in = 600 × 4 = 2400 J; work out = 2400 × 0.8 = 1920 J; lost 480 J.

## Accessibility notes
Effort and load arrows carry text labels ("E = 250 N", "W = 1000 N"); arms and distances are dimension lines with values; pulley strands are numbered. The lost-work part of the work bar is hatched as well as shaded. Gear rotation directions are arrows with "clockwise" or "anticlockwise" text. All controls are keyboard operable. Stage label: "Class 1 lever: effort arm … metres, load arm … metres. Velocity ratio …, mechanical advantage …, efficiency … percent. An effort of … newtons lifts … newtons."

## Engine change requests
None for shared engines. This page builds its own custom engine (`site/assets/engines/custom/eng-simple-machines/`, with `tests/engines/custom-eng-simple-machines.test.mjs`) to the model above, with every key above in its `meta.params`, every readout in its `meta.outputs`, and the page as a static setup.

## Acceptance
Every number below comes from the formula and hand calculation shown here (guide §9.1 checks: MA, VR and η = MA/VR). g = 10 m/s².

- **Check 1, class 1 lever.** VR = 1.2/0.3 = **4**. η = 100%, so MA = **4**. W = 100 × 10 = **1000 N**; E = 1000/4 = **250 N**; η = (1000/250)/4 = **100%**.
- **Check 2, pulley block with friction.** n = 4: VR = **4**. η = 80%: MA = 0.8 × 4 = **3.2**. W = 200 × 10 = 2000 N; E = 2000/3.2 = **625 N**. Lifting 0.5 m pulls 4 × 0.5 = **2 m** of rope. Work out = 2000 × 0.5 = **1000 J**; work in = 625 × 2 = **1250 J**; η = 1000/1250 = 3.2/4 = **80%**.
- **Check 3, gear train.** VR = 36/12 = **3**; output speed = 300/3 = **100 rpm**; output torque = 0.95 × 3 × 10 = **28.5 N·m**; MA = 28.5/10 = **2.85**. Power in = 10 × 2π × 300/60 = 10 × 31.416 = **314.16 W**; power out = 28.5 × 2π × 100/60 = **298.45 W** (95%).
- **Check 4, screw jack.** VR = 2π × 300/5 = **376.99**. η = 30%: MA = 0.3 × 376.99 = **113.10**. W = 1500 × 10 = 15 000 N; E = 15 000/113.10 = **132.63 N**; with no friction it would be 15 000/376.99 = **39.789 N**. Lifting 0.05 m: effort distance = 0.05 × 376.99 = 18.850 m; work in = 132.63 × 18.850 = **2500 J**; work out = 15 000 × 0.05 = **750 J**.
- **Check 5, class 3 lever.** VR = 0.05/0.3 = **0.16667**. W = 2 × 10 = 20 N; E = 20/0.16667 = **120 N**: six times the load. In return the effort point (where the biceps attaches, 0.05 m from the elbow) moves only 1/6 as far as the hand and the load it holds.
- **Check 6, lever distances.** Default lever (VR = 4, W = 1000 N, η = 100%) with the load raised 0.1 m: sin θ = 0.1/0.3, θ = 19.5°, inside the 30° cap. Effort distance = 0.1 × 4 = **0.4 m**; work out = 1000 × 0.1 = **100 J** = work in = 250 × 0.4.
- **Check 7, the 30° cap.** The same lever with loadDistance = 0.5 m: a 0.3 m arm cannot lift its end 0.5 m, so the load distance used is 0.5 × 0.3 = 0.15 m (θ = 30°). Effort distance = 0.15 × 4 = **0.6 m**; work out = 1000 × 0.15 = **150 J**.
- **Question idea check.** VR 5, MA 4, η 80%, rope 4 m, work in 2400 J, work out 1920 J.

```acceptance
[
  { "name": "lever distances: effort moves VR times as far", "params": { "machine": "lever", "leverClass": "1", "effortArm": 1.2, "loadArm": 0.3, "loadMass": 100, "loadDistance": 0.1, "efficiency": 100, "g": 10 }, "run": "static",
    "expect": { "effortDistance": { "value": 0.4, "relTol": 1e-12 }, "workOut": { "value": 100, "relTol": 1e-12 }, "workIn": { "value": 100, "relTol": 1e-12 } } },
  { "name": "lever swing capped at 30°", "params": { "machine": "lever", "leverClass": "1", "effortArm": 1.2, "loadArm": 0.3, "loadMass": 100, "loadDistance": 0.5, "efficiency": 100, "g": 10 }, "run": "static",
    "expect": { "effortDistance": { "value": 0.6, "relTol": 1e-12 }, "workOut": { "value": 150, "relTol": 1e-12 } } },
  { "name": "class 1 lever: VR = MA = 4", "params": { "machine": "lever", "leverClass": "1", "effortArm": 1.2, "loadArm": 0.3, "loadMass": 100, "efficiency": 100, "g": 10 }, "run": "static",
    "expect": { "vr": { "value": 4, "relTol": 1e-12 }, "ma": { "value": 4, "relTol": 1e-12 }, "load": { "value": 1000, "relTol": 1e-12 }, "effort": { "value": 250, "relTol": 1e-12 }, "efficiencyOut": { "value": 100, "relTol": 1e-12 } } },
  { "name": "pulley block at 80%: η = MA/VR", "params": { "machine": "pulley", "strands": 4, "loadMass": 200, "loadDistance": 0.5, "efficiency": 80, "g": 10 }, "run": "static",
    "expect": { "vr": { "value": 4, "relTol": 1e-12 }, "ma": { "value": 3.2, "relTol": 1e-12 }, "effort": { "value": 625, "relTol": 1e-12 }, "effortDistance": { "value": 2, "relTol": 1e-12 }, "workOut": { "value": 1000, "relTol": 1e-12 }, "workIn": { "value": 1250, "relTol": 1e-12 }, "efficiencyOut": { "value": 80, "relTol": 1e-12 } } },
  { "name": "gear train 12 → 36 teeth", "params": { "machine": "gears", "driverTeeth": 12, "drivenTeeth": 36, "inputSpeed": 300, "inputTorque": 10, "efficiency": 95 }, "run": "static",
    "expect": { "vr": { "value": 3, "relTol": 1e-12 }, "outputSpeed": { "value": 100, "relTol": 1e-12 }, "outputTorque": { "value": 28.5, "relTol": 1e-12 }, "ma": { "value": 2.85, "relTol": 1e-12 }, "powerIn": { "value": 314.1592654, "relTol": 1e-9 }, "powerOut": { "value": 298.4513021, "relTol": 1e-9 } } },
  { "name": "screw jack at 30%", "params": { "machine": "screw", "pitch": 5, "handleRadius": 300, "loadMass": 1500, "loadDistance": 0.05, "efficiency": 30, "g": 10 }, "run": "static",
    "expect": { "vr": { "value": 376.9911184, "relTol": 1e-9 }, "ma": { "value": 113.0973355, "relTol": 1e-9 }, "effort": { "value": 132.6291192, "relTol": 1e-9 }, "idealEffort": { "value": 39.78873577, "relTol": 1e-9 }, "workIn": { "value": 2500, "relTol": 1e-9 }, "workOut": { "value": 750, "relTol": 1e-9 } } },
  { "name": "class 3 lever: MA below 1", "params": { "machine": "lever", "leverClass": "3", "effortArm": 0.05, "loadArm": 0.3, "loadMass": 2, "efficiency": 100, "g": 10 }, "run": "static",
    "expect": { "vr": { "value": 0.1666666667, "relTol": 1e-9 }, "effort": { "value": 120, "relTol": 1e-9 } } },
  { "name": "question idea: five-strand block and tackle", "params": { "machine": "pulley", "strands": 5, "loadMass": 240, "loadDistance": 0.8, "efficiency": 80, "g": 10 }, "run": "static",
    "expect": { "ma": { "value": 4, "relTol": 1e-12 }, "effort": { "value": 600, "relTol": 1e-12 }, "effortDistance": { "value": 4, "relTol": 1e-12 }, "workIn": { "value": 2400, "relTol": 1e-12 }, "workOut": { "value": 1920, "relTol": 1e-12 } } }
]
```
