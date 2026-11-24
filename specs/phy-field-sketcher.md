---
id: phy-field-sketcher
title: "Electric field sketcher"
subject: phy
engine: field2d
setup: charges
priority: P1
status: approved            # stub → draft → approved (Gate B)
page: /interactives/physics/field-sketcher.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Physics","version":"2017","area":"Module 4: Electricity and Magnetism","outcomes":[],"verified":false}
  - {"course":"Physics","version":"2025","focusArea":"Electricity and magnetism","year":11,"outcomes":[],"verified":false}
---
# Electric field sketcher

> Backlog summary: Drag point charges and see field lines and equipotentials.

## Learning goal
Students draw and interpret electric field diagrams for one or more point charges: field lines start on positive charges and end on negative ones, never cross, are denser where the field is stronger, and are perpendicular to equipotential lines. They calculate the field of a point charge with E = kq/r² and add field vectors from two charges, finding where the field is zero.

Syllabus fit: 2017 Module 4 Electricity and Magnetism (electrostatics: electric fields, field-line diagrams, Coulomb's law, E = kq/r²); 2025 Year 11 focus area Electricity and magnetism. Field strength and vector addition are quantitative; potential and equipotentials are shown as an extension.

## What the student sees
Default view at 1920×1080, projector theme:

- A plane 80 cm wide and 40 cm tall with a light 10 cm grid and a scale bar. Up to three point charges drawn as circles with a `+` or `−` glyph and their value (`+2.0 µC`); circle size grows with |q|.
- **Field lines** in dark ink with arrowheads showing direction, starting on positive charges and ending on negative charges (or leaving the view). The number of lines from each charge is proportional to |q|.
- **Equipotentials** as thin dashed grey curves at equal steps of potential, each labelled with its value in kV at the edge of the view.
- **Field vectors (optional):** a grid of small arrows whose length shows the field direction and (log-scaled) strength.
- **Probe:** a small orange crosshair that can be dragged anywhere. An arrow from it shows E there, labelled `E = 2.00 × 10⁵ N/C`.
- Charges are draggable; lines and equipotentials redraw live.

The setup is static (no time evolution).

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| q1 | Charge 1, q₁ | µC | −5 | 5 | 0.5 | 2 | 0 hides the charge |
| x1 | Charge 1, x | cm | −40 | 40 | 1 | 0 | set by dragging; not a panel control |
| y1 | Charge 1, y | cm | −20 | 20 | 1 | 0 | set by dragging; not a panel control |
| q2 | Charge 2, q₂ | µC | −5 | 5 | 0.5 | 0 | 0 hides the charge |
| x2 | Charge 2, x | cm | −40 | 40 | 1 | 10 | dragging |
| y2 | Charge 2, y | cm | −20 | 20 | 1 | 0 | dragging |
| q3 | Charge 3, q₃ | µC | −5 | 5 | 0.5 | 0 | 0 hides the charge |
| x3 | Charge 3, x | cm | −40 | 40 | 1 | 0 | dragging |
| y3 | Charge 3, y | cm | −20 | 20 | 1 | 10 | dragging |
| probeX | Probe x | cm | −40 | 40 | 0.5 | 30 | dragging, or number entry |
| probeY | Probe y | cm | −20 | 20 | 0.5 | 0 | dragging, or number entry |
| showLines | Field lines | | | | | on | |
| linesPerMicrocoulomb | Lines per µC | | 2 | 12 | 1 | 4 | integer |
| showEquipotentials | Equipotential lines | | | | | on | |
| showVectors | Field vector grid | | | | | off | |
| showProbe | Probe | | | | | on | |

Panel controls (in order): `q1`, `q2`, `q3`, `probeX`, `probeY`, `showLines`, `linesPerMicrocoulomb`, `showEquipotentials`, `showVectors`, `showProbe`. Positions come from dragging and from the presets, and travel in share links.

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | q₁ +2 µC at (0, 0); q₂ = q₃ = 0; probe (30, 0) | a single positive charge: radial field, circular equipotentials |
| dipole | q₁ +1 µC at (−10, 0), q₂ −1 µC at (10, 0), q₃ 0; probe (0, 10) | lines from + to −; the field on the bisector is parallel to the axis |
| like-pair | q₁ +1 µC at (−10, 0), q₂ +1 µC at (10, 0), q₃ 0; probe (0, 0) | lines repel; a neutral point at the midpoint |
| unequal | q₁ +4 µC at (−10, 0), q₂ −1 µC at (10, 0), q₃ 0; probe (30, 0) | the neutral point sits outside, beyond the smaller charge |
| triangle | q₁ +2 µC at (−15, −10), q₂ +2 µC at (15, −10), q₃ −2 µC at (0, 15); probe (0, 0) | three charges for free exploration |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| fieldStrength | Field strength \|E\| at probe | N/C | 3 |
| fieldDirection | Field direction at probe | ° | 3 |
| potential | Potential V at probe | V (siPrefix) | 3 |

Definitions: E = Σ kqᵢ r̂ᵢ/rᵢ² summed over the charges present, with k = 8.99 × 10⁹ N m² C⁻², distances in metres and charges in coulombs. `fieldDirection` is the angle of E anticlockwise from +x in (−180°, 180°] (NaN when |E| = 0). `potential` = Σ kqᵢ/rᵢ, relative to zero at infinity. Also outputs `fieldX` and `fieldY` (N/C). If the probe sits on a charge the outputs are NaN and the stage says "Move the probe off the charge".

## Assumptions shown on stage
- Point charges in a vacuum (or air); k = 8.99 × 10⁹ N m² C⁻²
- Charges held fixed while you look; the probe is a tiny positive test charge
- Line density shows field strength qualitatively; lines per charge ∝ |q|
- Potential measured from zero at infinity

## Try this (3–5 predict, observe, explain prompts)
1. Predict: with a single +2 µC charge, how will the field strength at the probe change if you move it from 30 cm to 15 cm away? Then move it and check.
2. Observe: in the `dipole` preset, where are the field lines closest together? Move the probe there and compare the readout with a point far away.
3. Explain: in the `like-pair` preset the field at the midpoint is zero, but the potential is not. How can both be true?
4. Predict, then observe: in the `unequal` preset (+4 µC and −1 µC), is the neutral point between the charges or outside them? Find it with the probe.
5. Explain: why can two field lines never cross, and why do field lines always meet equipotentials at right angles?

## Teacher notes outline
- **Misconceptions to target:** field lines are paths that charges must follow; field lines can cross; the field is zero wherever there are no lines drawn; a negative charge has "negative field strength"; the neutral point of two unlike charges lies between them; zero potential means zero field.
- **10-minute lesson flow:** (1) default: check E = kq/r² at 30 cm by hand, then halve r (3 min); (2) `dipole` and `like-pair`: sketch first, then compare (3 min); (3) `unequal`: hunt for the neutral point and verify with E₁ = E₂ (2 min); (4) drag charges freely; rules for good field diagrams (2 min).
- **Original HSC-style question idea:** Charges of +3.0 µC and −3.0 µC are placed 20 cm apart. (a) Sketch the field, including at least eight lines. (b) Calculate the field strength at the midpoint and state its direction (5.39 × 10⁶ N/C, towards the negative charge). (c) Calculate the force on an electron placed at the midpoint (8.64 × 10⁻¹³ N, towards the positive charge). (Write the full question and worked solution in the notes file.)

## Accessibility notes
- Charges show a `+` or `−` glyph and their value in text; colour is secondary. Field lines are solid with arrowheads; equipotentials are dashed and labelled with values.
- Keyboard: Tab cycles through the charges and the probe on the stage; arrow keys move the focused item by 1 cm (Shift: 5 cm); `+` and `−` change the focused charge by 0.5 µC. All charge values and the probe position are also sliders in the panel.
- Stage `aria-label` (from `describe()`): "One charge of plus 2.0 microcoulombs at the centre. Probe 30 centimetres to the right: field 2.00 times 10 to the 5 newtons per coulomb pointing right, away from the charge; potential 59.9 kilovolts."

## Engine change requests
- **Keys to reconcile with engine meta** (the `field2d` engine had not started when this spec was written): params `q1`, `x1`, `y1`, `q2`, `x2`, `y2`, `q3`, `x3`, `y3`, `probeX`, `probeY`, `showLines`, `linesPerMicrocoulomb`, `showEquipotentials`, `showVectors`, `showProbe`; outputs `fieldStrength`, `fieldDirection`, `potential`, `fieldX`, `fieldY`.
- Fixed charge slots (three charges, q = 0 hides one) keep every value a plain number param, so share links and presets need no new param type. Dragging a charge or the probe on the stage updates its params and emits the `'params'` event (guide §5.10), so the shell resyncs the controls, the URL and the share link.
- `charges` is a static setup (`meta.staticSetups`).
- A `describe()` method for the stage label above.

## Acceptance
Every number below comes from the formula and hand calculation shown here. E = kq/r² for each charge, added as vectors; V = kq/r added as scalars; k = 8.99 × 10⁹ N m² C⁻². The exact constant 8.988 × 10⁹ differs by 0.03%, inside the 0.1% tolerances. All checks are static.

- **Check 1, single charge (default).** q = +2 µC, probe 30 cm to the right. E = 8.99 × 10⁹ × 2 × 10⁻⁶/0.30² = 17 980/0.09 = **1.99778 × 10⁵ N/C**, direction **0°** (away from a positive charge). V = 8.99 × 10⁹ × 2 × 10⁻⁶/0.30 = **59 933.3 V**.
- **Check 2, dipole midpoint.** +1 µC at (−10, 0) cm, −1 µC at (10, 0) cm, probe at (0, 0). Each charge gives E = 8.99 × 10⁹ × 10⁻⁶/0.10² = 8.99 × 10⁵ N/C, both pointing +x (away from +, towards −). Total **1.798 × 10⁶ N/C** at **0°**. V = k(10⁻⁶)/0.1 − k(10⁻⁶)/0.1 = **0 V**.
- **Check 3, dipole bisector (`dipole` preset).** Probe at (0, 10) cm: each distance r = √(0.1² + 0.1²) = 0.141421 m, each |E| = 8.99 × 10⁹ × 10⁻⁶/0.02 = 4.495 × 10⁵ N/C. From +: direction (1, 1)/√2; towards −: direction (1, −1)/√2. The y-parts cancel; the x-parts add: 2 × 4.495 × 10⁵ × 0.707107 = **6.35689 × 10⁵ N/C** at **0°**. V = **0 V** (equal distances, opposite charges).
- **Check 4, like charges (`like-pair`).** +1 µC at (±10, 0) cm, probe at (0, 0): equal and opposite fields, E = **0**. V = 2 × 8.99 × 10⁹ × 10⁻⁶/0.10 = **179 800 V**.
- **Check 5, like charges on the bisector.** Probe at (0, 10) cm: the x-parts cancel and the y-parts add: **6.35689 × 10⁵ N/C** at **90°**. V = 2 × 8.99 × 10⁹ × 10⁻⁶/0.141421 = **127 138 V**.
- **Check 6, neutral point (`unequal`).** +4 µC at (−10, 0), −1 µC at (10, 0), probe at (30, 0): distances 0.40 m and 0.20 m. E from +4 µC: 8.99 × 10⁹ × 4 × 10⁻⁶/0.16 = 2.2475 × 10⁵ N/C (+x); from −1 µC: 8.99 × 10⁹ × 10⁻⁶/0.04 = 2.2475 × 10⁵ N/C (−x, towards it). Sum **0**. V = 8.99 × 10⁹ × (4 × 10⁻⁶/0.40 − 10⁻⁶/0.20) = 8.99 × 10⁹ × 5 × 10⁻⁶ = **44 950 V**.

```acceptance
[
  { "name": "single +2 µC charge at 30 cm", "params": { "q1": 2, "x1": 0, "y1": 0, "q2": 0, "q3": 0, "probeX": 30, "probeY": 0 }, "run": "static",
    "expect": { "fieldStrength": { "value": 199777.8, "relTol": 0.001 }, "fieldDirection": { "value": 0, "absTol": 1e-6 }, "potential": { "value": 59933.3, "relTol": 0.001 } } },
  { "name": "dipole midpoint", "params": { "q1": 1, "x1": -10, "y1": 0, "q2": -1, "x2": 10, "y2": 0, "q3": 0, "probeX": 0, "probeY": 0 }, "run": "static",
    "expect": { "fieldStrength": { "value": 1798000, "relTol": 0.001 }, "fieldDirection": { "value": 0, "absTol": 1e-6 }, "potential": { "value": 0, "absTol": 1e-6 } } },
  { "name": "dipole perpendicular bisector", "preset": "dipole", "params": { "q1": 1, "x1": -10, "y1": 0, "q2": -1, "x2": 10, "y2": 0, "q3": 0, "probeX": 0, "probeY": 10 }, "run": "static",
    "expect": { "fieldStrength": { "value": 635689, "relTol": 0.001 }, "fieldDirection": { "value": 0, "absTol": 1e-6 }, "potential": { "value": 0, "absTol": 1e-6 } } },
  { "name": "like charges: zero field at the midpoint", "preset": "like-pair", "params": { "q1": 1, "x1": -10, "y1": 0, "q2": 1, "x2": 10, "y2": 0, "q3": 0, "probeX": 0, "probeY": 0 }, "run": "static",
    "expect": { "fieldStrength": { "value": 0, "absTol": 1e-6 }, "potential": { "value": 179800, "relTol": 0.001 } } },
  { "name": "like charges on the bisector", "params": { "q1": 1, "x1": -10, "y1": 0, "q2": 1, "x2": 10, "y2": 0, "q3": 0, "probeX": 0, "probeY": 10 }, "run": "static",
    "expect": { "fieldStrength": { "value": 635689, "relTol": 0.001 }, "fieldDirection": { "value": 90, "absTol": 1e-6 }, "potential": { "value": 127138, "relTol": 0.001 } } },
  { "name": "unequal charges: neutral point outside", "preset": "unequal", "params": { "q1": 4, "x1": -10, "y1": 0, "q2": -1, "x2": 10, "y2": 0, "q3": 0, "probeX": 30, "probeY": 0 }, "run": "static",
    "expect": { "fieldStrength": { "value": 0, "absTol": 1e-6 }, "potential": { "value": 44950, "relTol": 0.001 } } }
]
```
