---
id: phy-charged-particles
title: "Charged particles in fields"
subject: phy
engine: particle2d
setup: charged
priority: P1
status: draft            # stub → draft → approved (Gate B)
page: /interactives/physics/charged-particles.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Physics","version":"2017","area":"Module 6: Electromagnetism","outcomes":[],"verified":false}
  - {"course":"Physics","version":"2025","focusArea":"Electromagnetism","year":12,"outcomes":[],"verified":false}
---
# Charged particles in fields

> Backlog summary: Parallel plates, circular paths in B fields, velocity selector.

## Learning goal
Students predict and explain the paths of charged particles: a parabola between charged parallel plates (constant force qE, with E = V/d), a circle in a uniform magnetic field (force qvB always perpendicular to the velocity, radius r = mv/(qB)), and a straight line through crossed fields when v = E/B. They link each path to the direction and size of the force and to the particle's charge and mass.

Syllabus fit: 2017 Module 6 Electromagnetism (charged particles, conductors and electric and magnetic fields); 2025 Year 12 focus area Electromagnetism. Calculations use E = V/d, F = qE, F = qvB sin θ (θ = 90° here), r = mv/(qB) and the kinematics of uniform acceleration.

## What the student sees
Default view at 1920×1080, projector theme, side view in centimetres:

- **Electric mode:** two horizontal plates of length L, separated by d, labelled `+ 50 V` (top) and `0 V` (bottom), with downward field arrows between them labelled `E = 1250 V/m`. The particle enters from the left, midway between the plates, travelling right. Its path is traced in orange; it leaves the plates and continues in a straight line for a short distance so the exit angle is visible.
- **Magnetic mode:** no plates; the whole stage is filled with a uniform B field drawn as a grid of × symbols (into the page) or • symbols (out of the page), labelled `B = 100 mT into page`. The particle enters at the origin moving right and traces a semicircle back to the entry line, where a detector strip records where it lands (as in a mass spectrometer). The radius is drawn as a dashed line labelled `r = 10.4 cm`.
- **Velocity selector mode:** plates and the B-field symbols between the plates only.
- **Vectors:** the velocity (orange, labelled v) and the force on the particle (blue, labelled F_E, or F_B, or both in the selector) drawn at the particle.
- **Clock:** elapsed time in nanoseconds in the corner, with the note "slow motion".

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| field | Field | | | | | electric | enum: `electric` (Plates: E field), `magnetic` (Uniform B field), `crossed` (Velocity selector: E and B); segmented |
| particle | Particle | | | | | electron | enum: `electron`, `proton`, `alpha` (alpha particle) |
| speed | Speed v | 10⁶ m/s | 0.1 | 20 | 0.1 | 10 | entry speed, horizontal |
| voltage | Plate voltage V | V | 0 | 1000 | 5 | 50 | top plate positive; `visibleWhen: { field: ['electric', 'crossed'] }` |
| plateGap | Plate separation d | cm | 1 | 10 | 0.5 | 4 | `visibleWhen: { field: ['electric', 'crossed'] }` |
| plateLength | Plate length L | cm | 4 | 20 | 1 | 10 | `visibleWhen: { field: ['electric', 'crossed'] }` |
| fieldB | Magnetic field B | mT | 0 | 200 | 0.1 | 1 | `visibleWhen: { field: ['magnetic', 'crossed'] }` |
| bDirection | B direction | | | | | into | enum: `into` (Into the page ×), `out` (Out of the page •); `visibleWhen: { field: ['magnetic', 'crossed'] }` |
| showForce | Force vector | | | | | on | |
| showVelocity | Velocity vector | | | | | on | |
| trail | Show path | | | | | on | |
| timeScale | Playback speed | × | 0.25 | 2 | 0.25 | 1 | |

Particle constants (HSC data values): e = 1.602 × 10⁻¹⁹ C; electron m = 9.109 × 10⁻³¹ kg, q = −e; proton m = 1.673 × 10⁻²⁷ kg, q = +e; alpha particle m = 6.645 × 10⁻²⁷ kg, q = +2e.

Geometry: the particle enters at (0, 0) moving in +x. Up (+y) is positive. In `electric` and `crossed` modes the plates run from x = 0 to x = L at y = ±d/2 and both fields exist only between the plates. In `magnetic` mode B fills the stage.

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | field electric, electron, v 10 × 10⁶ m/s, V 50 V, d 4 cm, L 10 cm | an electron bends towards the positive plate by 1.10 cm |
| magnetic | field magnetic, proton, v 1 × 10⁶ m/s, B 100 mT, into | a 10.4 cm radius semicircle, like a mass spectrometer |
| selector | field crossed, electron, v 10 × 10⁶ m/s, V 200 V, d 4 cm, L 10 cm, B 0.5 mT, into | E/B = 1.0 × 10⁷ m/s: the electron goes straight through |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| eField | Electric field E = V/d | V/m | 3 |
| force | Net force at entry | N | 3 |
| radius | Radius r = mv/(\|q\|B) | m (siPrefix) | 3 |
| deflection | Deflection y | m (siPrefix) | 3 |
| selectorSpeed | Selected speed E/B | m/s | 3 |
| t | Time | s (siPrefix) | 3 |

Outputs are in SI units (guide §5.1); "siPrefix" means the output sets `siPrefix: true`, so 0.104 m reads "104 mm" and 3.28 × 10⁻⁷ s reads "328 ns". The params keep teaching units (cm, mT, 10⁶ m/s), as the `wave` engine does with nm and mm.

Definitions:
- `eField` = V/d in V/m (NaN in `magnetic` mode).
- `force` = magnitude of the net electric plus magnetic force on the particle at entry, in N.
- `radius` = mv/(|q|B) in m, in `magnetic` mode only (NaN otherwise, and when B = 0).
- `deflection` = the particle's y (m, up positive) when the run ends: at the end of the plates (x = L) in `electric` and `crossed` modes, or back at the entry line (x = 0) after a half-turn in `magnetic` mode. While the particle moves it shows the current y.
- `selectorSpeed` = E/B in m/s, in `crossed` mode only (NaN otherwise).
- `t` = elapsed time in s. Also an output `exitAngle` (°, direction of the velocity above the +x axis when the run ends) for the stage label.

The run completes when the particle reaches x = L (electric, crossed), strikes a plate (|y| = d/2), returns to x = 0 (magnetic), or leaves the stage. The end point is interpolated within the final step.

## Assumptions shown on stage
- Uniform fields between the plates; no edge effects
- Gravity negligible; particle in a vacuum
- Non-relativistic speeds (v ≪ c)
- Slow motion: the time readout is real time in nanoseconds

## Try this (3–5 predict, observe, explain prompts)
1. Predict: an electron and a proton enter the same plates at the same speed. Which way does each bend, and which bends more? Switch the particle and check.
2. Observe: in the electric field, double the plate voltage. What happens to the deflection? Now double the speed instead. Why does the deflection fall to a quarter?
3. Explain: in the magnetic field the particle's speed never changes, even though a force acts on it the whole time. Why?
4. Predict: in the `magnetic` preset, what radius will an alpha particle have at the same speed? (Mass about 4 times, charge 2 times.) Check your prediction.
5. Explain: in the `selector` preset, switch from an electron to a proton. Why does the proton also go straight through, even though both forces now point the other way?

## Teacher notes outline
- **Misconceptions to target:** a magnetic force speeds a charge up (it does no work); the force on a charge in a magnetic field is along the field lines; heavier particles bend more; the path between plates is a circular arc (it is a parabola: constant force); electrons and protons bend the same way.
- **10-minute lesson flow:** (1) default: predict the bend direction, then compute E = V/d and the deflection (3 min); (2) `magnetic` preset: why a circle; check r = mv/(qB); change particle (3 min); (3) `selector`: find the speed that goes straight, show it does not depend on the particle (2 min); (4) link to mass spectrometers and CRTs (2 min).
- **Original HSC-style question idea:** An alpha particle travelling at 2.0 × 10⁶ m/s enters a uniform 0.25 T magnetic field at right angles. (a) Calculate the magnetic force on it (1.6 × 10⁻¹³ N) and the radius of its path (0.166 m). (b) The particle is now sent through a velocity selector whose plates are 5.0 mm apart, in the same 0.25 T field. Calculate the plate voltage needed for it to pass undeflected (2500 V). (c) Explain why the selector also passes protons of the same speed. (Write the full question and worked solution in the notes file.)

## Accessibility notes
- Field direction uses symbols (× into the page, • out of the page) and a text label, not colour. Plate polarity is written as `+ 50 V` and `0 V`. The force arrow is labelled F_E or F_B; the velocity arrow is labelled v.
- The path is a solid line; the radius construction is dashed.
- Keyboard: every parameter is a slider with number entry, a segmented control or a toggle; Space, `.` and R run, step and reset.
- Stage `aria-label` (from `describe()`): "An electron enters parallel plates at 1.0 times 10 to the 7 metres per second. Field 1250 volts per metre, downward. It bends upward, towards the positive plate, and leaves 1.10 centimetres above its starting line." Magnetic: "A proton moves in a semicircle of radius 10.4 centimetres in a 100 millitesla field into the page, landing 20.9 centimetres above the entry point."

## Engine change requests
- **Keys to reconcile with engine meta** (the `particle2d` meta was not published when this spec was written): params `field`, `particle`, `speed`, `voltage`, `plateGap`, `plateLength`, `fieldB`, `bDirection`, `showForce`, `showVelocity`, `trail`, `timeScale`; outputs `eField`, `force`, `radius`, `deflection`, `selectorSpeed`, `t`, `exitAngle`.
- **SI time scaling for `charged`.** Real transit times are nanoseconds, so a fixed 1/240 s step cannot be used directly. The `charged` setup should integrate in SI with a step chosen from the scenario (for example, 1/2000 of the plate transit time or of the cyclotron period), play back in slow motion, and report `t` in seconds (shown in ns through `siPrefix`). The run end is interpolated within the final step.
- `radius`, `deflection` and `t` set `siPrefix: true` in `meta.outputs`.
- A `describe()` method for the stage label above.

## Acceptance
Every number below comes from the formula and hand calculation shown here. Constants as listed under Parameters. Expected values are in SI units (m, s, m/s), as the outputs report them. Between the plates the force is constant, so RK4 is exact apart from the interpolated end point; in the magnetic field RK4 with about 1000 steps per half-turn is accurate to far better than 0.1%.

- **Check 1, electron between plates (default).** E = V/d = 50/0.04 = **1250 V/m**. F = eE = 1.602 × 10⁻¹⁹ × 1250 = **2.0025 × 10⁻¹⁶ N**, upwards (the electron is negative and E points down). a = F/m = 2.0025 × 10⁻¹⁶/9.109 × 10⁻³¹ = 2.19838 × 10¹⁴ m/s². Time between the plates t = L/v = 0.10/1.0 × 10⁷ = **1.0 × 10⁻⁸ s** (10.0 ns). y = ½at² = 0.5 × 2.19838 × 10¹⁴ × 10⁻¹⁶ = **+0.0109919 m** (1.10 cm, less than d/2 = 2 cm, so it clears the plate). Exit angle: tan φ = at/v = 2.19838 × 10⁶/10⁷ = 0.219838, φ = **12.3985°**.
- **Check 2, proton between plates.** v = 1.0 × 10⁶ m/s, V = 500 V, d = 4 cm, L = 10 cm. E = 12 500 V/m; F = 1.602 × 10⁻¹⁹ × 12 500 = **2.0025 × 10⁻¹⁵ N**, downwards. a = 2.0025 × 10⁻¹⁵/1.673 × 10⁻²⁷ = 1.19695 × 10¹² m/s²; t = 0.10/10⁶ = **1.0 × 10⁻⁷ s**; y = −½ × 1.19695 × 10¹² × 10⁻¹⁴ = **−0.00598476 m** (−5.98 mm).
- **Check 3, proton in a magnetic field (`magnetic` preset).** v = 1.0 × 10⁶ m/s, B = 0.100 T into the page. F = qvB = 1.602 × 10⁻¹⁹ × 10⁶ × 0.1 = **1.602 × 10⁻¹⁴ N**. r = mv/(qB) = 1.673 × 10⁻²⁷ × 10⁶/(1.602 × 10⁻¹⁹ × 0.1) = **0.104432 m**. Direction: F = qv × B with v = +x and B = −z gives v × B = +y, so a proton curves upwards and lands at y = +2r = **+0.208864 m**. Half a period: t = πm/(qB) = π × 1.673 × 10⁻²⁷/(1.602 × 10⁻²⁰) = **3.28083 × 10⁻⁷ s** (328 ns).
- **Check 4, electron in a magnetic field.** v = 1.0 × 10⁷ m/s, B = 1.0 mT into the page. r = 9.109 × 10⁻³¹ × 10⁷/(1.602 × 10⁻¹⁹ × 10⁻³) = **0.0568602 m**. The charge is negative, so it curves downwards: y = −2r = **−0.113720 m**. t = πm/(eB) = π × 9.109 × 10⁻³¹/(1.602 × 10⁻²²) = **1.78632 × 10⁻⁸ s** (17.9 ns).
- **Check 5, velocity selector (`selector` preset).** E = 200/0.04 = **5000 V/m**; E/B = 5000/(0.5 × 10⁻³) = **1.0 × 10⁷ m/s**. With v = 1.0 × 10⁷ m/s, eE = 8.010 × 10⁻¹⁶ N (up, on the electron) and evB = 1.602 × 10⁻¹⁹ × 10⁷ × 5 × 10⁻⁴ = 8.010 × 10⁻¹⁶ N (down), so the net force is **0** and the deflection at the exit is **0 m**. t = 0.10/10⁷ = **1.0 × 10⁻⁸ s**.
- **Check 6, the selector passes a proton too.** Same settings with a proton: both forces reverse and still cancel, because v = E/B does not depend on q or m. Deflection **0 m**.

```acceptance
[
  { "name": "electron between plates", "params": { "field": "electric", "particle": "electron", "speed": 10, "voltage": 50, "plateGap": 4, "plateLength": 10 }, "run": "complete",
    "expect": { "eField": { "value": 1250, "relTol": 1e-9 }, "force": { "value": 2.0025e-16, "relTol": 1e-6 }, "deflection": { "value": 0.0109919, "relTol": 0.001 }, "t": { "value": 1e-8, "relTol": 0.001 }, "exitAngle": { "value": 12.3985, "relTol": 0.001 } } },
  { "name": "proton between plates", "params": { "field": "electric", "particle": "proton", "speed": 1, "voltage": 500, "plateGap": 4, "plateLength": 10 }, "run": "complete",
    "expect": { "force": { "value": 2.0025e-15, "relTol": 1e-6 }, "deflection": { "value": -0.00598476, "relTol": 0.001 }, "t": { "value": 1e-7, "relTol": 0.001 } } },
  { "name": "proton semicircle (magnetic preset)", "preset": "magnetic", "params": { "field": "magnetic", "particle": "proton", "speed": 1, "fieldB": 100, "bDirection": "into" }, "run": "complete",
    "expect": { "force": { "value": 1.602e-14, "relTol": 1e-6 }, "radius": { "value": 0.104432, "relTol": 1e-4 }, "deflection": { "value": 0.208864, "relTol": 0.001 }, "t": { "value": 3.28083e-7, "relTol": 0.001 } } },
  { "name": "electron semicircle bends the other way", "params": { "field": "magnetic", "particle": "electron", "speed": 10, "fieldB": 1, "bDirection": "into" }, "run": "complete",
    "expect": { "radius": { "value": 0.0568602, "relTol": 1e-4 }, "deflection": { "value": -0.113720, "relTol": 0.001 }, "t": { "value": 1.78632e-8, "relTol": 0.001 } } },
  { "name": "velocity selector passes the electron", "preset": "selector", "params": { "field": "crossed", "particle": "electron", "speed": 10, "voltage": 200, "plateGap": 4, "plateLength": 10, "fieldB": 0.5, "bDirection": "into" }, "run": "complete",
    "expect": { "eField": { "value": 5000, "relTol": 1e-9 }, "selectorSpeed": { "value": 1e7, "relTol": 1e-9 }, "force": { "value": 0, "absTol": 1e-20 }, "deflection": { "value": 0, "absTol": 1e-8 }, "t": { "value": 1e-8, "relTol": 0.001 } } },
  { "name": "velocity selector passes a proton too", "params": { "field": "crossed", "particle": "proton", "speed": 10, "voltage": 200, "plateGap": 4, "plateLength": 10, "fieldB": 0.5, "bDirection": "into" }, "run": "complete",
    "expect": { "selectorSpeed": { "value": 1e7, "relTol": 1e-9 }, "deflection": { "value": 0, "absTol": 1e-8 } } }
]
```