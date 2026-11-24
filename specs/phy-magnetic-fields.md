---
id: phy-magnetic-fields
title: "Magnetic fields"
subject: phy
engine: field2d
setup: magnetic
priority: P2
status: draft           # stub → draft → approved (Gate B)
page: /interactives/physics/magnetic-fields.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Physics","version":"2017","area":"Module 4: Electricity and Magnetism","outcomes":[],"verified":false}
  - {"course":"Physics","version":"2025","focusArea":"Electricity and magnetism","year":11,"outcomes":[],"verified":false}
---
# Magnetic fields

> Backlog summary: Field of a wire, loop and solenoid with a compass grid.

## Learning goal
Students map the magnetic field around current-carrying conductors and use the right-hand grip rule to predict its direction: circles around a straight wire with B = μ₀I/(2πr), a field through the centre of a loop, and a nearly uniform field inside a solenoid with B ≈ μ₀NI/L. They see fields from two wires superpose, and connect this to the force between parallel currents.

Syllabus tags: 2017 Module 4 (Electricity and Magnetism: magnetism, fields of wires, loops and solenoids); 2025 Year 11 focus area Electricity and magnetism. The force between parallel wires also supports 2017 Module 6 and 2025 Electromagnetism.

## What the student sees
Default view at 1920×1080 (light projector stage), a cross-section in the plane of the screen, 0.6 m wide and 0.4 m high, with a 5 cm grid:

- **Conductors.** Wires perpendicular to the screen are circles of radius 2 mm (drawn larger, at least 24 px) marked ⊙ (current out of the screen) or ⊗ (into the screen), each labelled with its current. A loop is shown in cross-section as two such circles at (0, ±R), joined by a thin dashed ellipse to suggest the loop; a solenoid is two rows of ⊙ along the top and ⊗ along the bottom, with a dashed outline of the coil.
- **Field lines** (with `showFieldLines`): streamlines of B traced in both directions, with direction arrows every few centimetres. Line spacing, not line thickness, suggests strength.
- **Compass grid** (with `showCompasses`): a grid of small compass needles every 4 cm, each a thin diamond with a filled north half and an open south half pointing along B. Needles where |B| is below 1% of the view's maximum are drawn faint.
- **Probe** (always shown): a draggable crosshair. A label beside it shows |B| in µT or mT and an arrow shows the direction. A dashed line joins it to the nearest wire with the distance r labelled (wire scenes).
- **Formula card** (top left): the textbook formula for the chosen source with the current values substituted, for example "B = μ₀I / 2πr = 50.0 µT".
- **Two wires:** force arrows on each wire (towards each other for currents in the same direction) and the force per metre.

## Parameters
Keys proposed for the `field2d` engine's `magnetic` setup: no `field2d` branch existed when this was written (25 November). See "Engine change requests".

| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| source | Source | | | | | wire | enum: `wire` (Straight wire), `two-wires` (Two parallel wires), `loop` (Circular loop), `solenoid` (Solenoid); `widget: 'select'` |
| current | Current I | A | −20 | 20 | 0.5 | 5 | positive: out of the screen (wire 1, and the top side of a loop or solenoid) |
| current2 | Current in wire 2 | A | −20 | 20 | 0.5 | 5 | `visibleWhen: { source: 'two-wires' }` |
| separation | Wire separation d | m | 0.02 | 0.4 | 0.01 | 0.1 | `visibleWhen: { source: 'two-wires' }` |
| turns | Turns N | | 1 | 1000 | 1 | 200 | `integer: true`, `visibleWhen: { source: ['loop', 'solenoid'] }` |
| coilRadius | Coil radius R | m | 0.01 | 0.1 | 0.005 | 0.03 | `visibleWhen: { source: ['loop', 'solenoid'] }` |
| solenoidLength | Solenoid length L | m | 0.05 | 0.5 | 0.01 | 0.25 | `visibleWhen: { source: 'solenoid' }` |
| probeX | Probe x | m | −0.3 | 0.3 | 0.005 | 0.05 | also set by dragging the probe |
| probeY | Probe y | m | −0.2 | 0.2 | 0.005 | 0 | also set by dragging the probe |
| showFieldLines | Field lines | | | | | on | boolean |
| showCompasses | Compass grid | | | | | on | boolean |

## Model
Static (no time evolution): `magnetic` belongs in the engine's `staticSetups`. μ₀ = 4π × 10⁻⁷ T m A⁻¹ (shown on stage). Positions in metres; x to the right, y up, z out of the screen.

- **Wire** at the origin, current I along +z (out of the screen) when I > 0: B = (μ₀I/2πr) φ̂, anticlockwise for I > 0 (right-hand grip). Inside the 2 mm wire radius the current is uniform, so B = μ₀I r/(2πa²), which avoids an infinity at the centre (the general rule is under "Finite conductors").
- **Two wires** at (−d/2, 0) carrying I₁ = `current` and (+d/2, 0) carrying I₂ = `current2`; fields superpose. Force per metre on each: F/l = μ₀I₁I₂/(2πd); output positive for attraction (currents in the same direction).
- **Loop**: N turns of radius R in the plane x = 0, axis along x, current such that B at the centre points along +x when I > 0 (so the top side, at (0, +R), carries current out of the screen). Field from Biot–Savart for a circular loop (the exact off-axis result with complete elliptic integrals K and E; on the axis it reduces to B = μ₀NIR² / (2(R² + x²)^{3/2})).
- **Solenoid**: N turns, length L, radius R, centred on the origin with its axis along x, same current sense as the loop. Modelled as M = min(N, 200) equally spaced circular loops at x_k = −L/2 + (k − ½)L/M, each carrying NI/M. At the centre this agrees with the finite current-sheet result B = μ₀(N/L)I × L/√(L² + 4R²) to better than 1 × 10⁻⁶ for the defaults.
- **Finite conductors (every source).** A filament field is infinite on the filament, so every conductor has radius a = 2 mm in the cross-section: each straight wire, each side of the loop, and each of the solenoid's modelled windings. For each winding w (a straight wire, or one circular loop) let W be its cross-section centre nearest the point P, r = |P − W|, I_w its current (NI for the loop, NI/M for a solenoid winding), B_f,w the filament field of the whole winding (straight-wire or exact loop formula) and B_s,w the field of an infinite straight wire through W perpendicular to the screen carrying I_w.
  - If r ≥ a: the winding contributes B_f,w(P), unchanged.
  - If r < a: it contributes B_f,w(P_a) − B_s,w(P_a) + B_int,w(P), where P_a = W + a·(P − W)/r is the point on the conductor's surface in the direction of P (P_a = W + a·ŷ when P = W), and B_int,w is the uniform-current interior field μ₀I_w r/(2πa²) circling W by the right-hand rule. The first two terms are the rest of the winding's field, taken at the surface; the last is the conductor's own field, which falls to zero at its centre.
  - This is continuous at r = a, finite everywhere, and for a straight wire it is exactly the uniform-current interior field. Contributions from all windings are summed, so a probe in an overlapping solenoid winding is also finite.
  - On stage, when the probe is inside a conductor its label adds "inside the conductor (radius 2 mm)"; compass needles whose centres fall inside a conductor are not drawn; field lines stop at conductor surfaces. Nothing shows Infinity or NaN.
- **Formula card output** `bFormula`: wire μ₀I/(2πr) at the probe distance; loop μ₀NI/(2R); solenoid μ₀NI/L (the ideal long-solenoid value); two wires `null`.

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | source wire, current 5, probeX 0.05, probeY 0, showFieldLines on, showCompasses on | circles around a wire; 20 µT at 5 cm |
| two-wires-same | source two-wires, current 5, current2 5, separation 0.1, probeX 0, probeY 0 | fields cancel midway; the wires attract |
| two-wires-opposite | source two-wires, current 5, current2 −5, separation 0.1, probeX 0, probeY 0 | fields add midway; the wires repel |
| loop | source loop, current 2, turns 10, coilRadius 0.05, probeX 0, probeY 0 | field through the centre of a loop |
| solenoid | source solenoid, current 2, turns 500, coilRadius 0.02, solenoidLength 0.25, probeX 0, probeY 0 | nearly uniform inside, weak outside |

No catalogue listing reuses this page.

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| bProbe | Field at probe \|B\| | T | 3 |
| bxProbe | Field at probe, x component | T | 3 |
| byProbe | Field at probe, y component | T | 3 |
| bFormula | Textbook formula value | T | 3 |
| probeDistance | Probe distance from wire r | m | 3 |
| forcePerLength | Force per metre between wires | N/m | 3 |

`probeDistance` is measured from wire 1 (or the origin for loop and solenoid). `forcePerLength` is `null` except for two wires. The four field outputs, `probeDistance` and `forcePerLength` set `siPrefix: true` (guide §5.10), so they read as "50.0 µT", "5.03 mT", "20.0 mm" or "50.0 µN/m"; the values returned stay in T, m and N/m.

## Assumptions shown on stage
- Straight wires are infinitely long and perpendicular to the screen
- Steady currents; no magnetic materials nearby; Earth's field ignored
- Loop and solenoid fields from Biot–Savart (solenoid as up to 200 loops)
- μ₀ = 4π × 10⁻⁷ T m A⁻¹
- Field-line spacing shows strength only roughly
- Conductors are 2 mm thick; the field inside a conductor is approximate

## Try this (3–5 predict, observe, explain prompts)
1. **Predict:** current comes out of the screen. Which way will the compass needles point above the wire? Check with the right-hand grip rule, then reverse the current.
2. **Observe:** drag the probe from 2 cm to 4 cm to 8 cm from the wire. What happens to B each time the distance doubles?
3. **Predict, then observe:** two wires carry equal currents in the same direction. What is the field exactly halfway between them? What if one current is reversed?
4. **Explain:** in the solenoid, compare the field at the centre with the field just outside the coil. Why is the field inside nearly uniform, and why is μ₀NI/L only approximately right for this coil?
5. **Explain:** use the field of one wire at the position of the other, and F = BIl, to explain why parallel currents in the same direction attract.

## Teacher notes outline
- **Misconceptions to target:** field lines point along the wire or radially out of it (they circle it); B falls off as 1/r² like a point charge's field (it is 1/r for a long wire); the field inside a solenoid is strongest near the windings (it is nearly uniform across the inside); field lines are real paths that something travels along; like currents repel as like charges do (they attract).
- **10-minute lesson flow:** 2 min prompt 1 with the compass grid; 2 min the 1/r probe experiment, students tabulate B and r; 2 min two-wire presets and superposition; 2 min loop and solenoid; 2 min the force between wires and the link to the definition of the ampere.
- **Original HSC-style question idea:** two long parallel wires 6.0 cm apart carry 8.0 A and 3.0 A in opposite directions. (a) Calculate the magnetic field at the midpoint and state its direction relative to the wires. (b) Find the point on the line joining the wires (outside them) where the field is zero. (c) Calculate the force per metre on each wire and state whether they attract or repel. Worked solution in the notes file (midpoint 7.33 × 10⁻⁵ T; zero point 3.6 cm beyond the 3.0 A wire; 8.0 × 10⁻⁵ N/m, repel).

## Accessibility notes
- Current direction uses ⊙ and ⊗ symbols with text labels, never colour alone. Compass needles have filled and open halves (shape, not colour) for north and south.
- The probe readout is text with units and a direction arrow; the probe can be moved with the probe x and y sliders as well as by dragging (keyboard and touch).
- Stage `aria-label` (engine `describe()`): "Magnetic field of a straight wire carrying 5.0 amps out of the screen. Field lines are anticlockwise circles. At the probe, 5.0 centimetres away, the field is 20 microtesla pointing up the screen."

## Engine change requests
Keys to reconcile with engine meta: the `field2d` engine had no branch when this spec was written, so every param and output key above is a **proposal** (guide §9.1 lists wire, loop and solenoid presets for `field2d`). The `field2d` builder adopts these keys or tells the orchestrator which to rename, and this spec is updated to match. Features this page needs from the `magnetic` setup:
1. Sources `wire`, `two-wires`, `loop` and `solenoid` with the geometry and current conventions in "Model", fields from Biot–Savart (exact loop field with elliptic integrals; solenoid as up to 200 loops), and the finite-conductor rule (radius 2 mm for every wire and winding) so no output or needle is ever infinite or NaN.
2. A draggable probe bound to `probeX` and `probeY`, and the outputs in "Readouts", including `forcePerLength` for two wires.
3. A compass-needle grid as well as field lines.
4. `magnetic` listed in `staticSetups`.

## Acceptance
Every number below comes from the formula and hand calculation shown here. μ₀/2π = 2 × 10⁻⁷ T m A⁻¹.

- **Check 1, straight wire.** I = 5.0 A out of the screen, probe at (0.020, 0) m: B = 2 × 10⁻⁷ × 5.0/0.020 = **5.0 × 10⁻⁵ T**, anticlockwise, so at a point to the right of the wire it points up: B_y = **+5.0 × 10⁻⁵ T**, B_x = **0**. The formula card gives the same **5.0 × 10⁻⁵ T** and r = **0.020 m**.
- **Check 2, current reversed.** I = −5.0 A: B_y = **−5.0 × 10⁻⁵ T**.
- **Check 3, two wires, same direction.** I₁ = I₂ = 5.0 A, d = 0.10 m, probe at the midpoint (0, 0): each wire gives 2 × 10⁻⁷ × 5.0/0.050 = 2.0 × 10⁻⁵ T, in opposite directions, so **B = 0**. Force per metre = 2 × 10⁻⁷ × 5.0 × 5.0/0.10 = **5.0 × 10⁻⁵ N/m**, attractive (positive).
- **Check 4, two wires, opposite directions.** I₂ = −5.0 A: at the midpoint both fields point up, B_y = 2 × 2.0 × 10⁻⁵ = **4.0 × 10⁻⁵ T**. Force per metre **−5.0 × 10⁻⁵ N/m** (repulsive).
- **Check 5, loop centre.** N = 10, I = 2.0 A, R = 0.050 m, probe at (0, 0): B = μ₀NI/(2R) = 4π × 10⁻⁷ × 20/0.10 = **2.513 274 × 10⁻⁴ T**, along +x.
- **Check 6, loop axis.** Same loop, probe at (0.050, 0), a distance R along the axis: B = μ₀NIR²/(2(R² + R²)^{3/2}) = μ₀NI/(2R × 2^{3/2}) = 2.513 274 × 10⁻⁴/2.828 427 = **8.885 766 × 10⁻⁵ T**, along +x.
- **Check 7, solenoid.** N = 500, I = 2.0 A, L = 0.25 m, R = 0.020 m. Ideal formula: μ₀NI/L = 4π × 10⁻⁷ × 1000/0.25 = **5.026 548 × 10⁻³ T** (`bFormula`). At the centre the finite coil gives B = 5.026 548 × 10⁻³ × 0.25/√(0.0625 + 0.0016) = 5.026 548 × 10⁻³ × 0.987 441 = **4.963 418 × 10⁻³ T** along +x (the 200-loop model agrees to 3 × 10⁻⁷).
- **Check 8, probe at the centre of a straight wire.** Two wires, 5.0 A each in the same direction, d = 0.10 m, probe at the centre of wire 1, (−0.050, 0). Wire 1's own interior field is μ₀I r/(2πa²) = 0 at r = 0, so only wire 2 contributes: B = 2 × 10⁻⁷ × 5.0/0.10 = 1.0 × 10⁻⁵ T. The probe is to the left of wire 2, whose current comes out of the screen, so B points down: B_y = **−1.0 × 10⁻⁵ T**, B_x = **0**.
- **Check 9, probe on a loop winding (finite, not infinite).** Loop preset (N = 10, I = 2.0 A, so NI = 20 A, R = 0.050 m), probe at (0, 0.050), exactly at the centre W of the top winding. r = 0, so P_a = W + a·ŷ = (0, 0.052) and the conductor's own term is 0. The exact loop field at P_a (in the loop's plane, x = 0, at distance ρ = 0.052 m from the axis): m = k² = 4Rρ/(R + ρ)² = 4 × 0.050 × 0.052/0.102² = 0.999 616, so K(m) = 5.318 535 and E(m) = 1.000 926, and B_x = (μ₀NI/(2π(R + ρ)))[K + ((R + ρ)/(R − ρ))E] = (4.0 × 10⁻⁶/0.102)[5.318 535 − 51 × 1.000 926] = 3.921 569 × 10⁻⁵ × (−45.728 707) = −1.793 283 × 10⁻³ T. The straight-wire field of the top winding at P_a is μ₀NI/(2πa) = 2 × 10⁻⁷ × 20/0.002 = 2.0 × 10⁻³ T, pointing along −x (current out of the screen, point above it), so subtracting it adds +2.0 × 10⁻³ T. B_x(W) = −1.793 283 × 10⁻³ + 2.0 × 10⁻³ = **+2.067 174 × 10⁻⁴ T** (about the field at the loop's centre, as expected for the rest of the loop), B_y = **0**, and |B| = **2.067 174 × 10⁻⁴ T**, finite.

Tolerances: 1 × 10⁻⁶ relative for closed forms (check 9 uses complete elliptic integrals, which the AGM gives to full precision); zero fields use absolute 1 × 10⁻¹²; the solenoid centre uses 1 × 10⁻⁵ relative.

```acceptance
[
  { "name": "straight wire at 2 cm", "params": { "source": "wire", "current": 5, "probeX": 0.02, "probeY": 0 }, "run": "static",
    "expect": { "bProbe": { "value": 5e-5, "relTol": 1e-6 }, "byProbe": { "value": 5e-5, "relTol": 1e-6 }, "bxProbe": { "value": 0, "absTol": 1e-12 },
                "bFormula": { "value": 5e-5, "relTol": 1e-6 }, "probeDistance": { "value": 0.02, "relTol": 1e-9 } } },
  { "name": "reversed current reverses the field", "params": { "source": "wire", "current": -5, "probeX": 0.02, "probeY": 0 }, "run": "static",
    "expect": { "byProbe": { "value": -5e-5, "relTol": 1e-6 } } },
  { "name": "two wires, same direction: zero at midpoint, attract", "params": { "source": "two-wires", "current": 5, "current2": 5, "separation": 0.1, "probeX": 0, "probeY": 0 }, "run": "static",
    "expect": { "bProbe": { "value": 0, "absTol": 1e-12 }, "forcePerLength": { "value": 5e-5, "relTol": 1e-6 } } },
  { "name": "two wires, opposite directions: fields add, repel", "params": { "source": "two-wires", "current": 5, "current2": -5, "separation": 0.1, "probeX": 0, "probeY": 0 }, "run": "static",
    "expect": { "byProbe": { "value": 4e-5, "relTol": 1e-6 }, "forcePerLength": { "value": -5e-5, "relTol": 1e-6 } } },
  { "name": "loop centre", "params": { "source": "loop", "current": 2, "turns": 10, "coilRadius": 0.05, "probeX": 0, "probeY": 0 }, "run": "static",
    "expect": { "bProbe": { "value": 2.513274123e-4, "relTol": 1e-6 }, "bxProbe": { "value": 2.513274123e-4, "relTol": 1e-6 }, "bFormula": { "value": 2.513274123e-4, "relTol": 1e-6 } } },
  { "name": "loop axis at x = R", "params": { "source": "loop", "current": 2, "turns": 10, "coilRadius": 0.05, "probeX": 0.05, "probeY": 0 }, "run": "static",
    "expect": { "bxProbe": { "value": 8.885765876e-5, "relTol": 1e-6 } } },
  { "name": "solenoid centre", "params": { "source": "solenoid", "current": 2, "turns": 500, "coilRadius": 0.02, "solenoidLength": 0.25, "probeX": 0, "probeY": 0 }, "run": "static",
    "expect": { "bFormula": { "value": 5.026548246e-3, "relTol": 1e-6 }, "bxProbe": { "value": 4.963417976e-3, "relTol": 1e-5 } } },
  { "name": "probe at the centre of wire 1", "params": { "source": "two-wires", "current": 5, "current2": 5, "separation": 0.1, "probeX": -0.05, "probeY": 0 }, "run": "static",
    "expect": { "byProbe": { "value": -1e-5, "relTol": 1e-6 }, "bxProbe": { "value": 0, "absTol": 1e-12 } } },
  { "name": "probe on a loop winding is finite", "preset": "loop", "params": { "probeX": 0, "probeY": 0.05 }, "run": "static",
    "expect": { "bxProbe": { "value": 2.067173595e-4, "relTol": 1e-6 }, "byProbe": { "value": 0, "absTol": 1e-12 }, "bProbe": { "value": 2.067173595e-4, "relTol": 1e-6 } } }
]
```
