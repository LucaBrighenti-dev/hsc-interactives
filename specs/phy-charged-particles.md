---
id: phy-charged-particles
title: "Charged particles in fields"
subject: phy
engine: particle2d
setup: charged
priority: P1
status: approved            # stub → draft → approved (Gate B)
page: /interactives/physics/charged-particles.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Physics","version":"2017","area":"Module 6: Electromagnetism","outcomes":[],"verified":false}
  - {"course":"Physics","version":"2025","focusArea":"Electromagnetism","year":12,"outcomes":[],"verified":false}
---
# Charged particles in fields

> Backlog summary: Parallel plates, circular paths in B fields, velocity selector.

## Learning goal
Students predict and explain the paths of charged particles: a parabola between charged parallel plates (constant force qE, with E = V/d), a circle in a uniform magnetic field (force qvB always perpendicular to the velocity, radius r = mv/(qB)), and a straight line through crossed fields when v = E/B. They link each path to the direction and size of the force and to the particle's charge and mass, and see that the electric field does work on the particle while the magnetic field does none.

Syllabus fit: 2017 Module 6 Electromagnetism (charged particles, conductors and electric and magnetic fields); 2025 Year 12 focus area Electromagnetism. Calculations use E = V/d, F = qE, W = qEd-style work, F = qvB sin θ (θ = 90° here), r = mv/(qB) and the kinematics of uniform acceleration.

## What the student sees
Default view at 1920×1080, projector theme (the `particle2d` engine's charged-particle view), side view in centimetres:

- **Electric field:** two horizontal plates of length L, separated by d, the top plate at V and the bottom at 0 V, with field arrows between them. The particle enters from the left, midway between the plates, travelling right, and its path is traced; the run ends as it leaves the plates (or strikes one).
- **Magnetic field:** a region of uniform B, 0 ≤ x ≤ L, drawn with × symbols (into the page) or • symbols (out of the page). The particle enters at the left edge moving right, turns in a circular arc and, if the semicircle fits inside the region, comes back out through the entry edge a distance 2r from where it went in (as in a mass spectrometer).
- **Crossed fields (velocity selector):** plates and the B-field symbols together.
- **Vectors and clock:** the velocity and the force on the particle drawn at the particle; elapsed time in nanoseconds (the motion is shown in slow motion).

## Parameters
Keys and ranges are the `particle2d` engine's `meta.params` for `charged` (branch `w1/engine-particle2d`).

| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| field | Field | | | | | electric | enum: `electric`, `magnetic`, `selector` (crossed E and B) |
| particle | Particle | | | | | electron | enum: `electron`, `proton`, `alpha` |
| entrySpeed | Entry speed | × 10⁶ m/s | 0.1 | 30 | 0.1 | 20 | horizontal, at the left edge |
| voltage | Top plate voltage V | V | −2000 | 2000 | 10 | 200 | the bottom plate is at 0 V; electric and selector |
| plateGap | Plate separation d | cm | 1 | 10 | 0.5 | 4 | electric and selector |
| plateLength | Field length L | cm | 2 | 30 | 1 | 10 | length of the plates, or of the B region |
| bField | Magnetic field B | mT | 0 | 500 | 0.05 | 2 | magnetic and selector |
| bDirection | B direction | | | | | into | enum: `into` (into the page), `out` (out of the page) |
| trail | Show trail | | | | | on | |
| timeScale | Playback speed | × | 0.25 | 2 | 0.25 | 1 | |

Particle data (the engine's constants, CODATA 2018): e = 1.602176634 × 10⁻¹⁹ C; electron m = 9.1093837015 × 10⁻³¹ kg, q = −e; proton m = 1.67262192369 × 10⁻²⁷ kg, q = +e; alpha particle m = 6.6446573357 × 10⁻²⁷ kg, q = +2e. The HSC data-sheet values (1.602 × 10⁻¹⁹ C, 9.109 × 10⁻³¹ kg, 1.673 × 10⁻²⁷ kg) give the same answers to 3 significant figures.

Geometry: the particle enters at (0, 0) moving in +x; up (+y) is positive. Between plates the field is E = V/d pointing down when V > 0.

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | electric, electron, v 10 × 10⁶ m/s, V 50 V, d 4 cm, L 10 cm | an electron bends towards the positive plate by 1.10 cm |
| magnetic | magnetic, proton, v 1 × 10⁶ m/s, B 100 mT into, L 20 cm | a 10.4 cm radius semicircle, back out 20.9 cm from the entry point |
| selector | selector, electron, v 10 × 10⁶ m/s, V 200 V, d 4 cm, L 10 cm, B 0.5 mT into | E/B = 1.0 × 10⁷ m/s: the electron goes straight through |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| fieldE | Electric field E | V/m | 3 |
| force | Force on the particle | N | 3 |
| radius | Radius r = mv/qB | m | 3 |
| deflection | Deflection at exit | m | 3 |
| selectorSpeed | Selected speed E/B | m/s | 3 |
| timeInField | Time in field | s | 3 |

Definitions (the engine's outputs, SI): `fieldE` = V/d (0 in magnetic mode); `force` = |q(E + v × B)| at the current position; `radius` and `cyclotronPeriod` (2πm/qB) in magnetic mode only; `deflection` = y when the particle leaves the plates or strikes one (— otherwise); `selectorSpeed` = E/B in selector mode; `timeInField` = the time from entry to exit; `exitSeparation` = |y| when the particle comes back out through the entry edge (magnetic mode); `exitAngle` = the direction of the velocity at exit; `workDone` = change in kinetic energy; `x`, `y`, `vx`, `vy`, `speed`, `t` are current values. Exit events are located inside the step and computed exactly there.

## Assumptions shown on stage
- Uniform fields inside the region; no edge effects
- Gravity negligible; particle in a vacuum
- Non-relativistic speeds (v ≪ c)
- Slow motion: the time readout is real time in nanoseconds

## Try this (3–5 predict, observe, explain prompts)
1. Predict: an electron and a proton enter the same plates at the same speed. Which way does each bend, and which bends more? Switch the particle and check.
2. Observe: in the default plates, set the voltage to 20 V and read the deflection (0.440 cm). Double it to 40 V: what happens to the deflection? Now go back to 20 V and double the speed instead, from 10 to 20 × 10⁶ m/s. Why does the deflection fall to a quarter (0.110 cm)? (Doubling 50 V to 100 V would need 2.20 cm, more than the 2 cm to the plate, so the electron would hit it.)
3. Explain: in the magnetic field the particle's speed never changes, even though a force acts on it the whole time. Check the work-done readout, then explain why.
4. Predict: in the `magnetic` preset, what radius will an alpha particle have at the same speed? (Mass about 4 times, charge 2 times.) Check your prediction.
5. Explain: in the `selector` preset, switch from an electron to a proton. Why does the proton also go straight through, even though both forces now point the other way?

## Teacher notes outline
- **Misconceptions to target:** a magnetic force speeds a charge up (it does no work); the force on a charge in a magnetic field is along the field lines; heavier particles bend more; the path between plates is a circular arc (it is a parabola: constant force); electrons and protons bend the same way.
- **10-minute lesson flow:** (1) default: predict the bend direction, then compute E = V/d and the deflection (3 min); (2) `magnetic` preset: why a circle; check r = mv/(qB); change particle (3 min); (3) `selector`: find the speed that goes straight, show it does not depend on the particle (2 min); (4) link to mass spectrometers and CRTs (2 min).
- **Original HSC-style question idea:** An alpha particle travelling at 2.0 × 10⁶ m/s enters a uniform 0.25 T magnetic field at right angles. (a) Calculate the magnetic force on it (1.6 × 10⁻¹³ N) and the radius of its path (0.166 m). (b) The particle is now sent through a velocity selector whose plates are 5.0 mm apart, in the same 0.25 T field. Calculate the plate voltage needed for it to pass undeflected (2500 V). (c) Explain why the selector also passes protons of the same speed. (Write the full question and worked solution in the notes file.)

## Accessibility notes
- Field direction uses symbols (× into the page, • out of the page) and a text label, not colour. Plate voltages are written on the plates. The force and velocity arrows are labelled.
- The path is a solid line; construction lines are dashed.
- Keyboard: every parameter is a slider with number entry, a segmented control or a toggle; Space, `.` and R run, step and reset.
- Stage `aria-label`: the engine's `describe()` sentence for the particle, field and outcome (for example, that an electron entering the plates bends towards the positive plate and leaves 1.10 cm above its starting line).

## Engine change requests
- None: every key used here exists in the `particle2d` engine's meta on `w1/engine-particle2d`.

## Acceptance
Every number below comes from the formula and hand calculation shown here, using the particle data above. Expected values are SI. Between the plates the force is constant, so RK4 is exact apart from the exit event; in the magnetic field the engine takes about 1000 steps per half-turn, far better than the 0.1% tolerance.

- **Check 1, electron between plates (default).** E = V/d = 50/0.04 = **1250 V/m**. F = eE = 1.602177 × 10⁻¹⁹ × 1250 = **2.00272 × 10⁻¹⁶ N**, upwards (the electron is negative and E points down). a = F/m = 2.00272 × 10⁻¹⁶/9.10938 × 10⁻³¹ = 2.19853 × 10¹⁴ m/s². Time between the plates t = L/v = 0.10/1.0 × 10⁷ = **1.0 × 10⁻⁸ s**. y = ½at² = 0.5 × 2.19853 × 10¹⁴ × 10⁻¹⁶ = **+0.0109926 m** (1.10 cm, less than d/2 = 2 cm, so it clears the plate). Exit angle: tan φ = at/v = 2.19853 × 10⁶/10⁷ = 0.219853, φ = **12.3994°**. Work done by the field = F × y = 2.00272 × 10⁻¹⁶ × 0.0109926 = **2.20152 × 10⁻¹⁸ J** (the gain in kinetic energy).
- **Check 2, proton between plates.** v = 1.0 × 10⁶ m/s, V = 500 V, d = 4 cm, L = 10 cm. E = 12 500 V/m; F = 1.602177 × 10⁻¹⁹ × 12 500 = **2.00272 × 10⁻¹⁵ N**, downwards. a = 2.00272 × 10⁻¹⁵/1.672622 × 10⁻²⁷ = 1.19735 × 10¹² m/s²; t = 0.10/10⁶ = **1.0 × 10⁻⁷ s**; y = −½ × 1.19735 × 10¹² × 10⁻¹⁴ = **−0.00598677 m**.
- **Check 3, proton in a magnetic field (`magnetic`).** v = 1.0 × 10⁶ m/s, B = 0.100 T into the page, L = 20 cm. F = qvB = 1.602177 × 10⁻¹⁹ × 10⁶ × 0.1 = **1.60218 × 10⁻¹⁴ N**. r = mv/(qB) = 1.672622 × 10⁻²⁷ × 10⁶/(1.602177 × 10⁻²⁰) = **0.104397 m**, which fits inside L = 0.20 m, so the proton makes a semicircle and comes back out through the entry edge 2r = **0.208794 m** from its entry point. Direction: F = qv × B with v = +x and B = −z gives v × B = +y, so a proton curves upwards. Time = half a period = πm/(qB) = π × 1.672622 × 10⁻²⁷/(1.602177 × 10⁻²⁰) = **3.27972 × 10⁻⁷ s**; full period 2πm/(qB) = **6.55945 × 10⁻⁷ s**. Work done **0** (speed unchanged).
- **Check 4, electron in a magnetic field.** v = 1.0 × 10⁷ m/s, B = 1.0 mT into the page, L = 10 cm. r = 9.109384 × 10⁻³¹ × 10⁷/(1.602177 × 10⁻¹⁹ × 10⁻³) = **0.0568563 m** (< L). The charge is negative, so it curves downwards and comes out at y = −2r = **−0.113713 m**. Time = πm/(eB) = π × 9.109384 × 10⁻³¹/(1.602177 × 10⁻²²) = **1.78619 × 10⁻⁸ s**.
- **Check 5, velocity selector (`selector`).** E = 200/0.04 = **5000 V/m**; E/B = 5000/(0.5 × 10⁻³) = **1.0 × 10⁷ m/s**. With v = 1.0 × 10⁷ m/s, eE = 8.01088 × 10⁻¹⁶ N (up, on the electron) and evB = 1.602177 × 10⁻¹⁹ × 10⁷ × 5 × 10⁻⁴ = 8.01088 × 10⁻¹⁶ N (down), so the net force is **0**, the deflection at the exit is **0 m**, and the time in the field is 0.10/10⁷ = **1.0 × 10⁻⁸ s**.
- **Check 6, the selector passes a proton too.** Same settings with a proton: both forces reverse and still cancel, because v = E/B does not depend on q or m. Deflection **0 m**.

```acceptance
[
  { "name": "electron between plates", "preset": "default", "params": { "field": "electric", "particle": "electron", "entrySpeed": 10, "voltage": 50, "plateGap": 4, "plateLength": 10 }, "run": "complete",
    "expect": { "fieldE": { "value": 1250, "relTol": 1e-9 }, "force": { "value": 2.00272e-16, "relTol": 1e-5 }, "deflection": { "value": 0.0109926, "relTol": 0.001 }, "timeInField": { "value": 1e-8, "relTol": 0.001 }, "exitAngle": { "value": 12.3994, "relTol": 0.001 }, "workDone": { "value": 2.20152e-18, "relTol": 0.001 } } },
  { "name": "proton between plates", "params": { "field": "electric", "particle": "proton", "entrySpeed": 1, "voltage": 500, "plateGap": 4, "plateLength": 10 }, "run": "complete",
    "expect": { "force": { "value": 2.00272e-15, "relTol": 1e-5 }, "deflection": { "value": -0.00598677, "relTol": 0.001 }, "timeInField": { "value": 1e-7, "relTol": 0.001 } } },
  { "name": "proton semicircle (magnetic preset)", "preset": "magnetic", "params": { "field": "magnetic", "particle": "proton", "entrySpeed": 1, "bField": 100, "bDirection": "into", "plateLength": 20 }, "run": "complete",
    "expect": { "force": { "value": 1.60218e-14, "relTol": 1e-5 }, "radius": { "value": 0.104397, "relTol": 1e-5 }, "cyclotronPeriod": { "value": 6.55945e-7, "relTol": 1e-5 }, "exitSeparation": { "value": 0.208794, "relTol": 0.001 }, "timeInField": { "value": 3.27972e-7, "relTol": 0.001 }, "workDone": { "value": 0, "absTol": 1e-24 } } },
  { "name": "electron semicircle bends the other way", "params": { "field": "magnetic", "particle": "electron", "entrySpeed": 10, "bField": 1, "bDirection": "into", "plateLength": 10 }, "run": "complete",
    "expect": { "radius": { "value": 0.0568563, "relTol": 1e-5 }, "exitSeparation": { "value": 0.113713, "relTol": 0.001 }, "y": { "value": -0.113713, "relTol": 0.001 }, "timeInField": { "value": 1.78619e-8, "relTol": 0.001 } } },
  { "name": "velocity selector passes the electron", "preset": "selector", "params": { "field": "selector", "particle": "electron", "entrySpeed": 10, "voltage": 200, "plateGap": 4, "plateLength": 10, "bField": 0.5, "bDirection": "into" }, "run": "complete",
    "expect": { "fieldE": { "value": 5000, "relTol": 1e-9 }, "selectorSpeed": { "value": 1e7, "relTol": 1e-9 }, "force": { "value": 0, "absTol": 1e-20 }, "deflection": { "value": 0, "absTol": 1e-9 }, "timeInField": { "value": 1e-8, "relTol": 0.001 } } },
  { "name": "velocity selector passes a proton too", "params": { "field": "selector", "particle": "proton", "entrySpeed": 10, "voltage": 200, "plateGap": 4, "plateLength": 10, "bField": 0.5, "bDirection": "into" }, "run": "complete",
    "expect": { "selectorSpeed": { "value": 1e7, "relTol": 1e-9 }, "deflection": { "value": 0, "absTol": 1e-9 } } }
]
```
