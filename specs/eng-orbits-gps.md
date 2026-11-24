---
id: eng-orbits-gps
title: "Orbits and GPS"
subject: eng
engine: particle2d
setup: orbit-gps
priority: P1
status: draft            # stub → draft → approved (Gate B)
page: /interactives/engineering/orbits-gps.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Engineering Studies","version":"2011","area":"Telecommunications engineering","subtopic":"Engineering electricity/electronics","year":12,"outcomes":["H3.1"],"url":"https://www.nsw.gov.au/education-and-training/nesa/curriculum/tas/engineering-studies-stage-6-2011","verified":true}
  - {"course":"Engineering Studies","version":"2026","focusArea":"Aeronautical and aerospace engineering","subtopic":"Aerospace positioning systems","year":12,"outcomes":["ES-12-01"],"url":"https://curriculum.nsw.edu.au/learning-areas/tas/engineering-studies-11-12-2026/content/year-12/fa66e557c0","verified":true}
---
# Orbits and GPS

> Backlog summary: LEO, MEO and GEO orbits; GPS trilateration from three satellites.

## Learning goal
Students compare low, medium and geostationary Earth orbits (LEO, MEO, GEO) by altitude, period and speed, and see that higher orbits are slower and take longer, which is why a satellite about 35 800 km up keeps pace with the Earth's rotation. They then see how a GPS receiver finds its position from signal travel times (trilateration), why a timing error of 1 μs moves each range by about 300 m, and so why receivers need very accurate time (in practice, one more satellite than they have position unknowns, so they can solve for their own clock error).

Syllabus fit: 2011 Telecommunications Engineering (satellite communication, orbits, GPS); 2026 Aeronautical and aerospace engineering, Year 12, aerospace positioning systems. Pitched at Stage 6 Engineering: orbital period and speed from given formulas, range = c × time; no derivation of Kepler's laws. Shares the particle2d engine with Physics' orbit lab.

## What the student sees
Default view at 1920×1080, light projector theme. The **View** control switches between two scenes.

- **Orbits view:** the Earth (a matte disc to scale) turning once per sidereal day, with a receiver dot on its surface, and three satellites on circular orbits drawn to scale with trails: a low satellite at the chosen altitude (LEO), a GPS satellite in medium orbit (MEO, half a sidereal day) and a geostationary satellite (GEO, one sidereal day). Each orbit has a text label with its band, altitude and period. Velocity arrows are labelled in km/s, and a clock reads hours. The run lasts one sidereal day, so students see the low satellite lap many times, the GPS satellite twice and the geostationary satellite once while staying above the same point.
- **GPS fix view:** a 2D slice with eight GPS satellites spaced around one orbit. The three highest above the receiver's horizon are numbered 1–3, each with a range circle of radius c × (measured travel time). With no clock error the three circles meet at the receiver. With a clock error every range grows by c × Δt, the circles no longer meet, and the trilaterated position (a ring) moves away from the true position (a cross), with the gap labelled in metres.
- **Footer:** the assumptions.

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| altitude | Satellite altitude (low orbit) | km | 100 | 40000 | 10 | 400 | above the mean Earth radius 6371 km |
| gpsView | View | | | | | orbits | enum: `orbits`, `gps` (GPS fix) |
| receiverAngle | Receiver position | ° | −180 | 180 | 1 | 30 | angle around the equator at t = 0; the receiver turns with the Earth |
| clockError | Receiver clock error | ns | −1000 | 1000 | 1 | 0 | 1000 ns = 1 μs |
| timeScale | Playback speed | × | 0.25 | 2 | 0.25 | 1 | |

These keys, ranges and engine defaults match the particle2d engine's `meta` on `origin/w1/engine-particle2d` (checked 25 November 2026).

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | orbits view, low orbit 400 km, receiver at 30°, no clock error | about the height of a crewed space station |
| starlink-height | orbits view, low orbit 550 km | a typical broadband constellation height |
| gps-fix | GPS view, receiver at 10° (a satellite directly overhead), no clock error | the three range circles meet |
| clock-error | GPS view, receiver at 10°, clock error 1000 ns | the circles miss: hundreds of metres of error |

The page uses GM for the Earth, not g; the footer says so.

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| leoPeriodMinutes | Low orbit period | min | 3 |
| leoSpeed | Low orbit speed | m/s | 3 |
| gpsAltitudeKm | GPS altitude | km | 3 |
| gpsPeriodHours | GPS period | h | 3 |
| gpsSpeed | GPS speed | m/s | 3 |
| geoAltitudeKm | Geostationary altitude | km | 3 |
| geoPeriodHours | Geostationary period | h | 3 |
| geoSpeed | Geostationary speed | m/s | 3 |
| signalTime | Signal travel time from the highest satellite | s | 3 |
| rangeError | Range error c × Δt | m | 3 |
| positionError | Position error | m | 3 |
| tHours | Time | h | 3 |

The engine also reports the same quantities in seconds and metres (`leoPeriod`, `gpsPeriod`, `gpsAltitude`, `geoPeriod`, `geoAltitude`) and `t`.

## Assumptions shown on stage
- Circular orbits in one plane; Earth a uniform sphere of radius 6371 km, GM = 3.986 × 10¹⁴ m³/s²
- GPS orbit: half a sidereal day; geostationary: one sidereal day (86 164 s)
- GPS shown in a 2D slice with three satellites (real GPS works in 3D and uses at least four)
- Signals travel in straight lines at c = 299 792 458 m/s; no atmospheric delay or relativity corrections

## Try this (3–5 predict, observe, explain prompts)
1. Predict: will the GPS satellite go faster or slower than the low satellite? Observe both speeds.
2. Observe: watch the geostationary satellite and the receiver dot for the whole day. What do you notice?
3. Predict, then observe: set a clock error of 1000 ns (1 μs). How far does each range circle move, and how far is the fix from the receiver?
4. Explain: a receiver's clock is far less accurate than a satellite's atomic clock. Why does using one more satellite than the position needs fix this?
5. Observe: raise the low orbit's altitude until its period matches the GPS period. What altitude do you reach?

## Teacher notes outline
- Misconceptions to target: satellites need engines to keep moving in orbit; there is no gravity in orbit (at 400 km, g is still about 89% of its surface value); geostationary satellites are "stationary" in space (they orbit, matching the Earth's rotation); GPS satellites work out your position (receivers compute it from timing).
- 10-minute lesson flow: (1) read the three periods and speeds; (2) run one day and count laps; (3) the geostationary match with the sidereal day; (4) GPS view: ranges from travel times; (5) clock error and the extra satellite.
- Original HSC-style question idea: a navigation satellite orbits at an altitude of 23 222 km. Using GM = 3.986 × 10¹⁴ m³/s² and an Earth radius of 6378 km, find its period and speed. A receiver's clock is 0.5 μs fast: find the range error. Worked solution: r = 29 600 km; T = 2π√((2.96 × 10⁷)³/(3.986 × 10¹⁴)) = 50 681 s ≈ 14.08 h; v = √(GM/r) = 3.670 km/s; range error = 3 × 10⁸ × 0.5 × 10⁻⁶ = 150 m.

## Accessibility notes
Orbit bands are labelled in text (LEO, MEO, GEO), not only by colour, and each orbit's trail has its own dash pattern. In the GPS view each used satellite and its range circle share a number label (1, 2, 3) and a dash pattern; the receiver's true position is a cross and its fix a ring, each labelled. All controls are keyboard operable; Space plays and pauses. Stage label: "Three satellites orbit the Earth: a low orbit at … kilometres with period … minutes, a GPS orbit with period … hours, and a geostationary orbit with period … hours. GPS clock error … nanoseconds; position error … metres."

## Engine change requests
- None for the keys: every param and output used here is in the particle2d engine's `meta` for `orbit-gps` on `origin/w1/engine-particle2d` (checked 25 November 2026): params `altitude`, `gpsView`, `receiverAngle`, `clockError`, `timeScale`; outputs `leoPeriod`, `leoPeriodMinutes`, `leoSpeed`, `gpsPeriodHours`, `gpsAltitudeKm`, `gpsSpeed`, `geoPeriodHours`, `geoAltitudeKm`, `geoSpeed`, `signalTime`, `rangeError`, `positionError`, `tHours`.
- Geometry the checks rely on (as in the engine's model): mean Earth radius 6371 km; eight GPS satellites 45° apart on one orbit, the first starting at 10°; the fix uses the three satellites highest above the receiver's horizon.
- Optional, for a later engine version (not used below): a "solve for clock error" toggle, so the fix uses the three pseudoranges to solve for x, y and the clock error together and the position error returns to zero.

## Acceptance
Every number below comes from the formula and hand calculation shown here. Constants: GM = 3.986004418 × 10¹⁴ m³/s²; R = 6371 km; sidereal day 86 164.0905 s; c = 299 792 458 m/s. Formulas: T = 2π√(r³/GM); v = √(GM/r); for a given period, r = (GM T²/4π²)^(1/3); travel time = distance/c; range error = c × Δt.

- **Check 1, low orbit at 400 km.** r = 6371 + 400 = 6771 km. r³/GM = (6.771 × 10⁶)³/3.986004 × 10¹⁴ = 778 790.5 s², √ = 882.491 s, so T = 2π × 882.491 = **5544.86 s = 92.414 min**. v = √(3.986004 × 10¹⁴/6.771 × 10⁶) = √(5.886877 × 10⁷) = **7672.60 m/s**.
- **Check 2, GPS orbit.** T = 86 164.0905/2 = 43 082.045 s = **11.96723 h**. r = (3.986004 × 10¹⁴ × 43 082.045²/4π²)^(1/3) = 26 561.76 km, so the altitude is 26 561.76 − 6371 = **20 190.76 km**. v = √(GM/r) = **3873.83 m/s**.
- **Check 3, geostationary orbit.** T = 86 164.0905 s = **23.93447 h**. r = 42 164.17 km, altitude **35 793.17 km**, v = **3074.66 m/s**.
- **Check 4, GPS timing.** With the receiver at 10° and the first GPS satellite starting at 10°, that satellite is directly overhead at t = 0: its range is 26 561.76 − 6371 = 20 190.76 km, so the travel time is 2.019076 × 10⁷/299 792 458 = **0.0673491 s** (67.35 ms). The other two satellites used are 45° either side, well inside the 76.1° horizon limit (cos⁻¹(6371/26 561.76)). With no clock error the three true ranges meet exactly at the receiver: position error **0 m**.
- **Check 5, clock error.** 1000 ns = 10⁻⁶ s adds c × 10⁻⁶ = **299.792 m** to every range.
- **Check 6, one sidereal day.** The run ends after one sidereal day: t = **23.93447 h**.
- **Question idea check.** r = 2.96 × 10⁷ m: T = 50 681 s = 14.078 h; v = 3.6696 km/s; 150 m (with c ≈ 3 × 10⁸; 149.9 m with the exact c).

```acceptance
[
  { "name": "low orbit 400 km: period and speed", "params": { "altitude": 400 }, "run": "static",
    "expect": { "leoPeriod": { "value": 5544.8551, "relTol": 1e-6 }, "leoPeriodMinutes": { "value": 92.414252, "relTol": 1e-6 }, "leoSpeed": { "value": 7672.5986, "relTol": 1e-6 } } },
  { "name": "GPS orbit: half a sidereal day", "params": { "altitude": 400 }, "run": "static",
    "expect": { "gpsPeriodHours": { "value": 11.9672348, "relTol": 1e-6 }, "gpsAltitudeKm": { "value": 20190.762, "relTol": 1e-6 }, "gpsSpeed": { "value": 3873.829, "relTol": 1e-6 } } },
  { "name": "geostationary orbit: one sidereal day", "params": { "altitude": 400 }, "run": "static",
    "expect": { "geoPeriodHours": { "value": 23.9344696, "relTol": 1e-6 }, "geoAltitudeKm": { "value": 35793.170, "relTol": 1e-6 }, "geoSpeed": { "value": 3074.660, "relTol": 1e-6 } } },
  { "name": "GPS: overhead satellite travel time and an exact fix", "params": { "altitude": 400, "gpsView": "gps", "receiverAngle": 10, "clockError": 0 }, "run": "static",
    "expect": { "signalTime": { "value": 0.06734913, "relTol": 1e-6 }, "rangeError": { "value": 0, "absTol": 1e-9 }, "positionError": { "value": 0, "absTol": 1e-3 } } },
  { "name": "GPS: a 1 μs clock error is about 300 m of range", "params": { "altitude": 400, "gpsView": "gps", "receiverAngle": 10, "clockError": 1000 }, "run": "static",
    "expect": { "rangeError": { "value": 299.792458, "relTol": 1e-9 } } },
  { "name": "the run lasts one sidereal day", "params": { "altitude": 400 }, "run": "complete",
    "expect": { "tHours": { "value": 23.9344696, "relTol": 1e-6 } } }
]
```
