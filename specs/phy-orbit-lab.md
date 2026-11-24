---
id: phy-orbit-lab
title: "Orbit lab"
subject: phy
engine: particle2d
setup: orbit
priority: P1
status: approved            # stub → draft → approved (Gate B)
page: /interactives/physics/orbit-lab.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Physics","version":"2017","area":"Module 5: Advanced Mechanics","outcomes":[],"verified":false}
  - {"course":"Physics","version":"2025","focusArea":"Advanced mechanics","year":12,"outcomes":[],"verified":false}
---
# Orbit lab

> Backlog summary: Kepler's laws, orbital energy, escape velocity.

## Learning goal
Students explain an orbit as projectile motion in which gravity provides the centripetal force, calculate circular orbital speed v = √(GM/r), period (Kepler's third law, r³/T² = GM/4π²) and escape speed v = √(2GM/r), and interpret the kinetic, potential and total energy of a satellite: total energy is negative for a bound orbit, stays constant round an ellipse, and is positive for an escape path. They see Kepler's second law as equal areas swept in equal times.

Syllabus fit: 2017 Module 5 Advanced Mechanics (motion in gravitational fields: orbital velocity, period, Kepler's laws, energy of satellites, escape velocity); 2025 Year 12 focus area Advanced mechanics.

## What the student sees
Default view at 1920×1080, projector theme (the `particle2d` engine's orbit view):

- **Space view:** Earth to scale at the centre and a satellite launched from altitude h at the chosen speed and angle above the local horizontal. The orbit is traced; the view fits the predicted orbit (or the escape path) at launch, with a scale bar in km.
- **Vectors (optional):** velocity (tangential at launch) and gravitational force (towards Earth's centre), each labelled.
- **Kepler's second law (optional):** the area swept by the radius line is shaded in equal time slices, with the area swept per second shown.
- **Status:** the run ends after one full revolution, a crash into Earth, or when the satellite passes 8 launch radii (it leaves the view). Whether the satellite escapes is decided by energy, not by leaving the view: it escapes only if its total energy is zero or positive (v ≥ v_esc). A clock shows elapsed time in minutes (time sped up).

## Parameters
Keys and ranges are the `particle2d` engine's `meta.params` for `orbit` (branch `w1/engine-particle2d`).

| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| altitude | Satellite altitude | km | 100 | 40000 | 10 | 400 | above Earth's surface |
| orbitSpeed | Launch speed | km/s | 0 | 15 | 0.01 | 7.67 | |
| launchAngle | Launch angle above horizontal | ° | −60 | 60 | 1 | 0 | 0 is perpendicular to the radius |
| satMass | Satellite mass | kg | 1 | 10000 | 1 | 1000 | affects the energies, not the path |
| showAreas | Equal areas (Kepler's second law) | | | | | off | |
| showVectors | Force and velocity vectors | | | | | on | |
| trail | Show trail | | | | | on | |
| timeScale | Playback speed | × | 0.25 | 2 | 0.25 | 1 | |

Constants (the engine's, from IERS/WGS 84): Earth GM = 3.986004418 × 10¹⁴ m³ s⁻², mean radius R = 6371.0 km. With the HSC data values (G = 6.67 × 10⁻¹¹, M = 6.0 × 10²⁴ kg) GM = 4.002 × 10¹⁴, 0.4% larger, so speeds differ by 0.2%; the notes point this out.

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | h 400 km, v 7.67 km/s, angle 0°, m 1000 kg | very nearly circular low Earth orbit (like the ISS): about 92 minutes |
| ellipse | h 400 km, v 8.50 km/s, angle 0°, m 1000 kg, areas on | an ellipse with apogee near 4380 km: equal areas and energy exchange |
| geostationary | h 35 790 km, v 3.07 km/s, angle 0°, m 1000 kg | period close to a day |
| escape | h 400 km, v 11.0 km/s, angle 0°, m 1000 kg | just above the escape speed (10.85 km/s): total energy positive |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| periodMinutes | Period | min | 3 |
| circularSpeed | Circular orbit speed | m/s | 3 |
| escapeSpeed | Escape speed | m/s | 3 |
| kineticEnergy | Kinetic energy | J | 3 |
| potentialEnergy | Gravitational potential energy | J | 3 |
| totalEnergy | Total energy | J | 3 |

Definitions (the engine's outputs): `circularSpeed` = √(GM/r₀) and `escapeSpeed` = √(2GM/r₀) at the launch radius r₀ = R + h; `period` (s) and `periodMinutes` from the current orbital elements, 2π√(a³/GM) with 1/a = 2/r − v²/GM (— if unbound); `semiMajorAxis`, `eccentricity`, `perigeeAltitude` and `apogeeAltitude` (m) likewise; `kineticEnergy` = ½mv², `potentialEnergy` = −GMm/r and `totalEnergy` at the current position; `keplerRatio` = T²/a³; `t` (s) and `tMinutes` elapsed; `altitudeKm`, `speed`, `arealVelocity`, `sweptArea` current values. One revolution is detected inside the step (the swept angle reaches 2π), so `tMinutes` at the end of a closed orbit is the measured period. Escape criterion: the orbit is unbound, and the satellite escapes, when `totalEnergy` ≥ 0 (equivalently v ≥ `escapeSpeed`, or `eccentricity` ≥ 1); a bound orbit whose far point is beyond 8 launch radii (from 400 km, launch speeds of about 10.23–10.85 km/s) also ends the run when it leaves the view, but it has not escaped: its total energy is still negative and its `period` is still defined.

## Assumptions shown on stage
- Earth is a uniform sphere and does not move (m ≪ M)
- Only Earth's gravity; no air resistance, no Moon or Sun
- GM = 3.986 × 10¹⁴ m³ s⁻², R = 6371 km
- Potential energy zero at infinity; time sped up

## Try this (3–5 predict, observe, explain prompts)
1. Predict: the default satellite orbits at 400 km. If you launch it from 800 km instead, will it need a higher or lower speed for a circular orbit? Check the circular-speed readout, then set the speed to match.
2. Observe: in the `ellipse` preset, turn on the equal areas. Where does the satellite move fastest, and what happens to the kinetic and potential energy as it climbs?
3. Explain: why is the total energy negative for every closed orbit, and why does it not change as the satellite goes round the ellipse?
4. Predict: at 400 km the escape speed is 10.85 km/s. Launch at 10.00 km/s, then at 11.00 km/s, and read the total energy each time. Which satellite comes back, and how does the sign of the total energy tell you before you watch?
5. Explain: launch at 7.00 km/s from 400 km. Why does the satellite hit Earth even though it was moving sideways quickly?

## Teacher notes outline
- **Misconceptions to target:** there is no gravity in orbit (astronauts are in free fall); a satellite needs a forward thrust to keep moving; heavier satellites need to go faster; escape speed means "going straight up fast enough" rather than an energy condition; potential energy is mgh at orbital heights; a satellite in a higher orbit moves faster.
- **10-minute lesson flow:** (1) default: compute √(GM/r) and T by hand (3 min); (2) `ellipse`: equal areas, kinetic and potential energy trading, constant total (3 min); (3) `geostationary`: Kepler's third law gives about a day; T²/a³ is the same for every orbit (2 min); (4) `escape`: total energy becomes positive (2 min).
- **Original HSC-style question idea:** A 500 kg satellite is in a circular orbit 2000 km above Earth's surface. (a) Calculate its orbital speed (6.91 × 10³ m/s) and period (2.11 h) using the data-sheet values. (b) Calculate its total mechanical energy (−1.20 × 10¹⁰ J). (c) Explain why the satellite's speed would increase if it were moved to a lower circular orbit, even though energy must be removed to do it. (Write the full question and worked solution in the notes file.)

## Accessibility notes
- Vectors carry symbol and value labels; the equal-area slices alternate two shadings and the area swept per second is written as text; energies are numeric readouts with signs. The end of the run (one orbit, crash, or leaving the view) is stated in words, and an escape is described by its positive total energy.
- Keyboard: all parameters are sliders with number entry or toggles; Space, `.` and R run, step and reset.
- Stage `aria-label`: the engine's `describe()` sentence with the launch altitude and speed and the orbit's period, or that it crashes or leaves the view (and, for total energy ≥ 0, that it escapes).

## Engine change requests
- Every key used here exists in the `particle2d` engine's meta on `w1/engine-particle2d`.
- **Escape status (particle2d / orbit):** the engine currently ends a run at 8 launch radii and labels it "Escaped", so bound launches from 400 km at about 10.23–10.85 km/s (total energy down to −0.55 GJ) are called escapes. Decide "escaped" by specific energy ≥ 0, and label bound orbits that pass 8 r₀ "left the view". The orchestrator has requested this from the particle2d builder; Try this #4 uses 10.00 km/s (an orbit that returns, apogee 5.64 r₀) and 11.00 km/s (escapes), so it works either way.
- Optional, for a later version: a central-body choice (Moon, Mars) for comparing orbits round other bodies.

## Acceptance
Every number below comes from the formula and hand calculation shown here, with GM = 3.986004418 × 10¹⁴ m³ s⁻² and R = 6.371 × 10⁶ m. Launch is horizontal, so the launch point is the perigee (v above circular speed) or the apogee (v below). Vis-viva: 1/a = 2/r − v²/GM; Kepler's third law: T = 2π√(a³/GM); the other apsis is at 2a − r. After one revolution the satellite is back at the launch point, so its kinetic and potential energies equal the launch values. The engine takes about 2900 steps per orbit (a twelfth of the circular period per 240 steps), so 0.1% tolerances are generous.

- **Check 1, default (near-circular low orbit).** r₀ = 6.371 × 10⁶ + 4.00 × 10⁵ = 6.771 × 10⁶ m. GM/r₀ = 5.88688 × 10⁷, so v_c = **7672.60 m/s** and v_esc = √2 × 7672.60 = **10 850.7 m/s**. With v = 7670 m/s: 1/a = 2.953773 × 10⁻⁷ − 7670²/3.986004 × 10¹⁴ = 2.953773 × 10⁻⁷ − 1.475886 × 10⁻⁷ = 1.477887 × 10⁻⁷, a = 6.766417 × 10⁶ m, T = 2π√(a³/GM) = 5539.23 s = **92.3204 min**. Energies at launch and after one orbit: KE = ½ × 1000 × 7670² = **2.94145 × 10¹⁰ J**; PE = −GMm/r₀ = **−5.88688 × 10¹⁰ J**; total **−2.94543 × 10¹⁰ J**. T²/a³ = 4π²/GM = **9.90426 × 10⁻¹⁴ s² m⁻³**.
- **Check 2, `ellipse`.** v = 8500 m/s: 1/a = 2.953773 × 10⁻⁷ − 1.812592 × 10⁻⁷ = 1.141181 × 10⁻⁷, a = 8.762849 × 10⁶ m. T = 8163.55 s = **136.059 min**. Apogee radius 2a − r₀ = 1.0754698 × 10⁷ m, altitude **4.383698 × 10⁶ m** (4384 km); eccentricity (r_a − r_p)/(r_a + r_p) = 3.983698 × 10⁶/1.7525698 × 10⁷ = **0.227306**. KE = ½ × 1000 × 8500² = **3.6125 × 10¹⁰ J**, PE = **−5.88688 × 10¹⁰ J**, total **−2.27438 × 10¹⁰ J**. T²/a³ is again **9.90426 × 10⁻¹⁴ s² m⁻³** (Kepler's third law).
- **Check 3, `geostationary`.** r₀ = 6.371 × 10⁶ + 3.579 × 10⁷ = 4.2161 × 10⁷ m. v_c = √(3.986004 × 10¹⁴/4.2161 × 10⁷) = **3074.78 m/s**. With v = 3070 m/s (just below v_c, so launch is the apogee): 1/a = 4.743720 × 10⁻⁸ − 3070²/3.986004 × 10¹⁴ = 4.743720 × 10⁻⁸ − 2.364498 × 10⁻⁸ = 2.379222 × 10⁻⁸, a = 4.203054 × 10⁷ m, T = 85 754.8 s = **1429.25 min** (23.82 h, close to the 23.93 h sidereal day).
- **Check 4, `escape`.** v = 11 000 m/s: KE = ½ × 1000 × 11 000² = 6.05 × 10¹⁰ J, PE = −5.88688 × 10¹⁰ J, total = **+1.63123 × 10⁹ J** (positive: unbound), conserved along the path. Eccentricity e = √(1 + 2εh²/(GM)²) with ε = 1.63123 × 10⁶ J/kg and h = r₀v = 7.4481 × 10¹⁰ m²/s gives **1.05542** (> 1, a hyperbola). Escape speed **10 850.7 m/s**.

```acceptance
[
  { "name": "default near-circular orbit", "preset": "default", "params": { "altitude": 400, "orbitSpeed": 7.67, "launchAngle": 0, "satMass": 1000 }, "run": "complete",
    "expect": { "circularSpeed": { "value": 7672.60, "relTol": 1e-5 }, "escapeSpeed": { "value": 10850.7, "relTol": 1e-5 }, "periodMinutes": { "value": 92.3204, "relTol": 1e-4 }, "tMinutes": { "value": 92.3204, "relTol": 0.001 }, "kineticEnergy": { "value": 2.94145e10, "relTol": 0.001 }, "potentialEnergy": { "value": -5.88688e10, "relTol": 0.001 }, "totalEnergy": { "value": -2.94543e10, "relTol": 0.001 }, "keplerRatio": { "value": 9.90426e-14, "relTol": 1e-4 } } },
  { "name": "ellipse: period, apogee and energies", "preset": "ellipse", "params": { "altitude": 400, "orbitSpeed": 8.5, "launchAngle": 0, "satMass": 1000 }, "run": "complete",
    "expect": { "periodMinutes": { "value": 136.059, "relTol": 1e-4 }, "tMinutes": { "value": 136.059, "relTol": 0.001 }, "apogeeAltitude": { "value": 4.383698e6, "relTol": 0.001 }, "eccentricity": { "value": 0.227306, "relTol": 0.001 }, "kineticEnergy": { "value": 3.6125e10, "relTol": 0.001 }, "potentialEnergy": { "value": -5.88688e10, "relTol": 0.001 }, "totalEnergy": { "value": -2.27438e10, "relTol": 0.001 }, "keplerRatio": { "value": 9.90426e-14, "relTol": 1e-4 } } },
  { "name": "geostationary height", "preset": "geostationary", "params": { "altitude": 35790, "orbitSpeed": 3.07, "launchAngle": 0, "satMass": 1000 }, "run": "complete",
    "expect": { "circularSpeed": { "value": 3074.78, "relTol": 1e-5 }, "periodMinutes": { "value": 1429.25, "relTol": 1e-4 }, "tMinutes": { "value": 1429.25, "relTol": 0.001 } } },
  { "name": "escape: positive total energy", "preset": "escape", "params": { "altitude": 400, "orbitSpeed": 11, "launchAngle": 0, "satMass": 1000 }, "run": "complete",
    "expect": { "totalEnergy": { "value": 1.63123e9, "relTol": 0.001 }, "eccentricity": { "value": 1.05542, "relTol": 0.001 }, "escapeSpeed": { "value": 10850.7, "relTol": 1e-5 } } }
]
```
