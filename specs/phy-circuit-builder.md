---
id: phy-circuit-builder
title: "Circuit builder"
subject: phy
engine: circuit
setup: builder
priority: P1
status: draft            # stub → draft → approved (Gate B)
page: /interactives/physics/circuit-builder.html
listings:            # catalogue listings that open this page with a preset; define these presets
  - {"id":"eng-circuits-as1102","preset":"eng-as1102","title":"Circuits with AS 1102 symbols"}
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Physics","version":"2017","area":"Module 4: Electricity and Magnetism","outcomes":[],"verified":false}
  - {"course":"Physics","version":"2025","focusArea":"Electricity and magnetism","year":11,"outcomes":[],"verified":false}
---
# Circuit builder

> Backlog summary: Series and parallel circuits, Ohm's law, Kirchhoff's laws, power.

## Learning goal
Students build and analyse DC circuits: they apply V = IR to each resistor, find equivalent resistance for series and parallel combinations, use Kirchhoff's current law (currents into a junction equal currents out) and voltage law (the potential differences round any loop sum to the EMF), and calculate power with P = VI = I²R. They also see how internal resistance makes the terminal voltage fall as the current rises.

Syllabus fit: 2017 Module 4 Electricity and Magnetism (electric circuits: Ohm's law, series and parallel, Kirchhoff's laws, power); 2025 Year 11 focus area Electricity and magnetism. Engineering Studies uses the same page through the `eng-as1102` preset (2026 Applied engineering analysis: electrical circuits drawn with Australian Standard AS 1102 symbols).

## What the student sees
Default view at 1920×1080, projector theme:

- A dotted grid (snap points) with a circuit drawn in black: a cell or battery labelled `ε = 12 V` (and `r = 0 Ω` when internal resistance is on), a switch, an ammeter in the main line and resistors R₁, R₂ (and R₃), each labelled with its value (`R₁ = 10 Ω`).
- Moving dots along the wires show the current: dot speed is proportional to the current, and the direction follows conventional current (+ to −) or electron flow, as chosen. A small legend states which.
- Each resistor shows its voltage and current in a mono label beside it (`4.00 V · 0.400 A`). Hovering or focusing a wire node shows its potential relative to the negative terminal (`6.00 V`).
- A component tray on the left: wire, resistor, lamp, switch, cell, ammeter, voltmeter. Drag to place on the grid; drag ends to connect; select and press Delete to remove. Editing a starting circuit turns it into "Custom".
- Friendly in-stage messages instead of NaN: "Short circuit: the cell is connected straight across by a wire" or "This part of the circuit is not connected".
- Symbols switch between the physics textbook set and the AS 1102 set (for example, the resistor as a zigzag or as a rectangle).

The setup is static: the circuit is solved on every change; only the current dots animate.

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| layout | Starting circuit | | | | | series | enum: `series` (R₁ and R₂ in series), `parallel` (R₁ ∥ R₂), `mixed` (R₁ then R₂ ∥ R₃), `blank` (empty grid), `custom` (set by editing); select |
| emf | Cell EMF ε | V | 0 | 24 | 0.5 | 12 | |
| internalResistance | Internal resistance r | Ω | 0 | 5 | 0.1 | 0 | |
| r1 | Resistance R₁ | Ω | 1 | 100 | 1 | 10 | |
| r2 | Resistance R₂ | Ω | 1 | 100 | 1 | 20 | |
| r3 | Resistance R₃ | Ω | 1 | 100 | 1 | 30 | used by `mixed` and custom circuits |
| switchClosed | Switch closed | | | | | on | the main switch, in series with the cell |
| symbols | Symbols | | | | | physics | enum: `physics` (Physics textbook), `as1102` (AS 1102) |
| flow | Moving dots show | | | | | conventional | enum: `conventional` (Conventional current), `electron` (Electron flow) |
| showLabels | Voltage and current labels | | | | | on | |
| netlist | (not a control) | | | | | "" | string; the edited circuit, encoded by the engine so custom circuits survive share links; empty for the starting layouts |

Starting layouts (all include the cell, the main switch and an ammeter in series with the cell):
- `series`: cell → R₁ → R₂ → back to the cell.
- `parallel`: R₁ and R₂ connected across the same two nodes.
- `mixed`: R₁ in series with the parallel pair R₂ ∥ R₃.

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | layout series, ε 12 V, r 0 Ω, R₁ 10 Ω, R₂ 20 Ω, switch closed, physics symbols, conventional | a 0.4 A series circuit with a 1 : 2 voltage split |
| parallel | layout parallel, ε 12 V, r 0, R₁ 10 Ω, R₂ 20 Ω | branch currents 1.2 A and 0.6 A add to 1.8 A |
| mixed | layout mixed, ε 12 V, r 0, R₁ 10 Ω, R₂ 20 Ω, R₃ 30 Ω | a series-parallel network for Kirchhoff's laws |
| internal | layout series, ε 12 V, r 2 Ω, R₁ 10 Ω, R₂ 20 Ω | terminal voltage below the EMF |
| eng-as1102 | layout series, ε 12 V, r 0, R₁ 10 Ω, R₂ 20 Ω, symbols as1102, conventional | Engineering Studies listing: the same circuit in AS 1102 symbols |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| current | Cell current I | A | 3 |
| terminalVoltage | Terminal voltage V | V | 3 |
| totalResistance | External resistance R | Ω | 3 |
| power | Power in the resistors P | W | 3 |
| v1 | Voltage across R₁ | V | 3 |
| v2 | Voltage across R₂ | V | 3 |

Further outputs (shown in the stage labels, used by the checks): `v3` (V), `i1`, `i2`, `i3` (A): the voltage across and current through each labelled resistor (NaN if that resistor is absent). `totalResistance` is the equivalent resistance of everything outside the cell; `power` is the total power dissipated in the external resistors (I²R summed, equal to V × I).

## Assumptions shown on stage
- Ideal wires, switch and ammeter (zero resistance); ideal voltmeter (infinite resistance)
- Resistors and lamps are ohmic (constant resistance)
- Cell: EMF ε with internal resistance r (shown when r > 0)
- Dots show conventional current (or electron flow, as selected)

## Try this (3–5 predict, observe, explain prompts)
1. Predict: in the default series circuit, which resistor has the larger voltage across it? Check the labels, then explain using V = IR and the fact that the current is the same everywhere.
2. Observe: switch to the `parallel` preset. Compare the current through each branch with the cell current. What rule connects them?
3. Predict, then observe: in the `parallel` circuit, will adding a third resistor in parallel increase or decrease the cell current? Build it and see.
4. Explain: in the `mixed` circuit, add up the voltages around each loop. Why do they always come to 12 V?
5. Explain: in the `internal` preset, the terminal voltage is 11.25 V, not 12 V. Where did the rest go, and what happens to it if you lower R₂?

## Teacher notes outline
- **Misconceptions to target:** current is used up by each resistor; the battery supplies a fixed current; adding resistors in parallel increases total resistance; the first resistor "gets" more voltage; electrons flow from + to − (conventional current is the convention; electrons go the other way); voltage flows through a circuit.
- **10-minute lesson flow:** (1) default: read I, check V = IR on each resistor and V₁ + V₂ = ε (3 min); (2) `parallel`: currents split and add (2 min); (3) `mixed`: Kirchhoff's laws at the junction and round both loops (3 min); (4) `internal`: terminal voltage and "lost volts" (2 min).
- **Original HSC-style question idea:** A 9.0 V battery with internal resistance 1.0 Ω is connected to a 10 Ω resistor in series with a parallel pair of 20 Ω and 30 Ω resistors. (a) Calculate the current from the battery (0.391 A). (b) Calculate the terminal voltage (8.61 V). (c) Calculate the power dissipated in the 30 Ω resistor (0.735 W). (d) Explain what happens to the terminal voltage if the 10 Ω resistor is replaced by a wire. (Write the full question and worked solution in the notes file.)

## Accessibility notes
- Components are identified by symbol and text label (R₁ 10 Ω), never by colour. Current direction is shown by moving dots and by a static arrowhead on each wire (for reduced motion). A short circuit is flagged in text.
- With `prefers-reduced-motion`, the dots are replaced by static arrows whose spacing shows the current.
- Keyboard: Tab moves through components on the grid; Enter selects; arrow keys move the selection by one grid cell; Delete removes; the tray items can be placed with Enter at the cursor. All values are also sliders in the panel.
- Stage `aria-label` (from `describe()`): "Series circuit: 12 volt cell, 10 ohm and 20 ohm resistors. Current 0.400 amperes. 4.00 volts across R1 and 8.00 volts across R2."

## Engine change requests
- **Keys to reconcile with engine meta** (the `circuit` engine had not started when this spec was written): params `layout`, `emf`, `internalResistance`, `r1`, `r2`, `r3`, `switchClosed`, `symbols`, `flow`, `showLabels`, `netlist`; outputs `current`, `terminalVoltage`, `totalResistance`, `power`, `v1`, `v2`, `v3`, `i1`, `i2`, `i3`.
- **Starting layouts as an enum, edits as a `netlist` string.** The `layout` enum gives deterministic circuits for presets and checks; any edit sets `layout` to `custom` and stores the circuit in `netlist` (a compact text encoding, within the string param's length limit) so share links keep it.
- The current-flow direction option (`flow`) and the reduced-motion static arrows are view features.
- `builder` is a static setup (`meta.staticSetups`); dots animate in the view only.
- A `describe()` method for the stage label above.

## Acceptance
Every number below comes from the formula and hand calculation shown here. Series: R = R₁ + R₂. Parallel: 1/R = 1/R₁ + 1/R₂. Cell: I = ε/(R + r), terminal voltage V = ε − Ir. Each resistor: V = IR. Power P = VI. All checks are static.

- **Check 1, default series circuit.** R = 10 + 20 = **30 Ω**; I = 12/30 = **0.400 A**; V₁ = 0.4 × 10 = **4.00 V**; V₂ = 0.4 × 20 = **8.00 V**; terminal voltage **12.0 V** (r = 0); P = 12 × 0.4 = **4.80 W**.
- **Check 2, internal resistance (`internal` preset).** r = 2 Ω: I = 12/(30 + 2) = **0.375 A**; V = 12 − 0.375 × 2 = **11.25 V**; V₁ = 0.375 × 10 = **3.75 V**; P = 0.375² × 30 = **4.21875 W**.
- **Check 3, parallel.** R = 1/(1/10 + 1/20) = 20/3 = **6.66667 Ω**; I = 12/(20/3) = **1.80 A**; I₁ = 12/10 = **1.20 A**; I₂ = 12/20 = **0.600 A** (1.2 + 0.6 = 1.8, Kirchhoff's current law); V₁ = **12.0 V**; P = 12 × 1.8 = **21.6 W**.
- **Check 4, mixed.** R₂ ∥ R₃ = 1/(1/20 + 1/30) = 600/50 = 12 Ω; R = 10 + 12 = **22 Ω**; I = 12/22 = **0.545455 A**; V₁ = 0.545455 × 10 = **5.45455 V**; V₂ = V₃ = 0.545455 × 12 = **6.54545 V** (5.45455 + 6.54545 = 12, Kirchhoff's voltage law); I₂ = 6.54545/20 = **0.327273 A**; I₃ = 6.54545/30 = **0.218182 A** (sum 0.545455 = I).
- **Check 5, switch open.** No closed loop: I = **0 A**, so V₁ = **0 V** and the terminal voltage is the EMF, **12.0 V**.
- **Check 6, equal resistors (engine test case).** R₁ = R₂ = 10 Ω in series on 12 V: I = 12/20 = **0.600 A**.
- **Check 7, `eng-as1102` preset.** Same circuit as the default with AS 1102 symbols: I = **0.400 A**, V₂ = **8.00 V**. The symbol set changes nothing in the physics.

```acceptance
[
  { "name": "default series circuit", "params": { "layout": "series", "emf": 12, "internalResistance": 0, "r1": 10, "r2": 20, "switchClosed": true }, "run": "static",
    "expect": { "totalResistance": { "value": 30, "relTol": 1e-9 }, "current": { "value": 0.4, "relTol": 1e-9 }, "v1": { "value": 4, "relTol": 1e-9 }, "v2": { "value": 8, "relTol": 1e-9 }, "terminalVoltage": { "value": 12, "relTol": 1e-9 }, "power": { "value": 4.8, "relTol": 1e-9 } } },
  { "name": "internal resistance lowers the terminal voltage", "preset": "internal", "params": { "layout": "series", "emf": 12, "internalResistance": 2, "r1": 10, "r2": 20, "switchClosed": true }, "run": "static",
    "expect": { "current": { "value": 0.375, "relTol": 1e-9 }, "terminalVoltage": { "value": 11.25, "relTol": 1e-9 }, "v1": { "value": 3.75, "relTol": 1e-9 }, "power": { "value": 4.21875, "relTol": 1e-9 } } },
  { "name": "parallel branches", "params": { "layout": "parallel", "emf": 12, "internalResistance": 0, "r1": 10, "r2": 20, "switchClosed": true }, "run": "static",
    "expect": { "totalResistance": { "value": 6.66667, "relTol": 1e-5 }, "current": { "value": 1.8, "relTol": 1e-9 }, "i1": { "value": 1.2, "relTol": 1e-9 }, "i2": { "value": 0.6, "relTol": 1e-9 }, "v1": { "value": 12, "relTol": 1e-9 }, "power": { "value": 21.6, "relTol": 1e-9 } } },
  { "name": "mixed series-parallel", "params": { "layout": "mixed", "emf": 12, "internalResistance": 0, "r1": 10, "r2": 20, "r3": 30, "switchClosed": true }, "run": "static",
    "expect": { "totalResistance": { "value": 22, "relTol": 1e-9 }, "current": { "value": 0.545455, "relTol": 1e-5 }, "v1": { "value": 5.45455, "relTol": 1e-5 }, "v2": { "value": 6.54545, "relTol": 1e-5 }, "v3": { "value": 6.54545, "relTol": 1e-5 }, "i2": { "value": 0.327273, "relTol": 1e-5 }, "i3": { "value": 0.218182, "relTol": 1e-5 } } },
  { "name": "switch open: no current", "params": { "layout": "series", "emf": 12, "internalResistance": 0, "r1": 10, "r2": 20, "switchClosed": false }, "run": "static",
    "expect": { "current": { "value": 0, "absTol": 1e-12 }, "v1": { "value": 0, "absTol": 1e-12 }, "terminalVoltage": { "value": 12, "relTol": 1e-9 } } },
  { "name": "equal resistors in series", "params": { "layout": "series", "emf": 12, "internalResistance": 0, "r1": 10, "r2": 10, "switchClosed": true }, "run": "static",
    "expect": { "current": { "value": 0.6, "relTol": 1e-9 } } },
  { "name": "eng-as1102 preset: same physics, new symbols", "preset": "eng-as1102", "params": {}, "run": "static",
    "expect": { "current": { "value": 0.4, "relTol": 1e-9 }, "v2": { "value": 8, "relTol": 1e-9 } } }
]
```
