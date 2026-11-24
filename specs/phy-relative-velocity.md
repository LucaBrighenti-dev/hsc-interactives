---
id: phy-relative-velocity
title: "Relative velocity"
subject: phy
engine: particle2d
setup: relative-velocity
priority: P1
status: approved            # stub → draft → approved (Gate B)
page: /interactives/physics/relative-velocity.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Physics","version":"2017","area":"Module 1: Kinematics","outcomes":[],"verified":false}
  - {"course":"Physics","version":"2025","focusArea":"Fundamentals of mechanics","year":11,"outcomes":[],"verified":false}
---
# Relative velocity

> Backlog summary: Boat crossing a river, plane in a crosswind.

## Learning goal
Students add velocity vectors to find a velocity relative to the ground (v_boat,ground = v_boat,water + v_water,ground), resolve it into components, and use the vector triangle to answer two classic questions: where a boat lands if it points straight across, and which way it must point to land directly opposite; and the same ideas for an aircraft's heading, airspeed, wind, ground speed and track.

Syllabus fit: 2017 Module 1 Kinematics (motion on a plane: vector addition and components, relative velocity); 2025 Year 11 focus area Fundamentals of mechanics.

## What the student sees
Default view at 1920×1080, projector theme (the `particle2d` engine's relative-velocity view):

- **Boat and river:** a top view of a straight river flowing left to right between two banks, with current arrows. A boat starts on the near (bottom) bank pointing along its heading and moves across, leaving a trail; the run ends when it reaches the far bank, and the landing point and downstream distance are marked.
- **Plane and wind:** a top-down map with a north arrow. The aircraft points along its heading (a bearing), the wind arrow shows where the wind blows towards, and the trail shows the actual track over the ground for the chosen flight time.
- **Vector triangle (optional):** the velocity relative to the water (or air), the water (or wind) velocity placed head to tail, and the resultant ground velocity, each labelled with its size, with the angle between heading and path marked.

## Parameters
Keys and ranges are the `particle2d` engine's `meta.params` for `relative-velocity` (branch `w1/engine-particle2d`).

| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| scenario | Scenario | | | | | boat | enum: `boat` (Boat and river), `plane` (Plane and wind) |
| boatSpeed | Boat speed (in still water) | m/s | 0.5 | 10 | 0.1 | 3 | boat |
| heading | Heading | ° | −80 | 80 | 1 | 0 | boat: 0° points straight across; positive points upstream |
| current | River current | m/s | 0 | 8 | 0.1 | 1.5 | boat; flows left to right |
| riverWidth | River width | m | 10 | 500 | 5 | 100 | boat |
| airspeed | Airspeed | km/h | 50 | 1000 | 5 | 300 | plane |
| bearing | Heading (bearing) | ° | 0 | 359 | 1 | 0 | plane: true bearing the nose points along |
| windSpeed | Wind speed | km/h | 0 | 200 | 1 | 60 | plane |
| windBearing | Wind blows toward (bearing) | ° | 0 | 359 | 1 | 90 | plane: a westerly wind (from 270°) blows toward 090° |
| flightTime | Flight time | h | 0.25 | 5 | 0.25 | 1 | plane: the run's length |
| showTriangle | Vector triangle | | | | | on | |
| trail | Show trail | | | | | on | |
| timeScale | Playback speed | × | 0.25 | 2 | 0.25 | 1 | |

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | boat, 4 m/s, current 3 m/s, heading 0°, width 100 m | the 3-4-5 triangle: 5 m/s at 36.9° downstream, lands 75 m downstream |
| aim-upstream | boat, 4 m/s, current 2 m/s, heading 30°, width 100 m | sin 30° = 2/4, so the boat lands directly opposite |
| crosswind | plane, 400 km/h, heading 000°, wind 80 km/h toward 090°, 1 h | a westerly pushes a north-pointing plane east of north |
| crab | plane, 400 km/h, heading 060°, wind 200 km/h toward 180°, 1 h | pointing into the wind to track due east |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| groundSpeed | Speed over the ground | m/s | 3 |
| groundSpeedKmh | Speed over the ground | km/h | 3 |
| groundDirection | Direction over the ground | ° | 3 |
| crossingTime | Crossing time | s | 3 |
| drift | Distance downstream | m | 3 |
| driftAngle | Drift angle | ° | 3 |

Definitions (the engine's outputs). Boat (x downstream, y across): ground velocity = (u − v sin α, v cos α) for heading α; `groundDirection` = the path's angle from straight across (positive downstream); `crossingTime` and `drift` (the landing point's distance downstream) appear on reaching the far bank; `headingForStraight` = asin(u/v), the heading that lands directly opposite (— if the current is faster than the boat); `driftAngle` is — for the boat. Plane (x east, y north): air velocity = airspeed × (sin b, cos b) for bearing b; wind velocity = windSpeed × (sin w, cos w) for "blows toward" bearing w; `groundDirection` = the track bearing in [0°, 360°); `driftAngle` = track − heading in (−180°, 180°] (positive: pushed clockwise). `distance` is the distance from the start; `t` (s) and `tHours` elapsed.

## Assumptions shown on stage
- Uniform current across the whole river (real rivers flow faster in the middle)
- Steady, uniform wind; constant airspeed and heading
- Velocities constant relative to the water or air; turning ignored
- Angles from straight across (boat) or as true bearings (plane)

## Try this (3–5 predict, observe, explain prompts)
1. Predict: the boat points straight across at 4 m/s in a 3 m/s current. How fast does it really move, and how far downstream will it land? Run it.
2. Observe: increase the current. Does the time to cross change? Explain using the components of the boat's velocity.
3. Explain: in `aim-upstream`, the boat points 30° upstream and lands directly opposite. Why is sin 30° = current ÷ boat speed the condition?
4. Predict: with a 4 m/s boat, can you land directly opposite in a 5 m/s current? Try it and explain.
5. Observe: in `crosswind`, the plane points north but drifts. Find a heading that makes it track due north, and compare its ground speed with its airspeed.

## Teacher notes outline
- **Misconceptions to target:** pointing upstream always gets you across faster; the current changes the time to cross when the boat points straight across; velocities add like numbers (4 + 3 = 7); heading and track are the same thing; a "westerly" wind blows towards the west (it blows from the west).
- **10-minute lesson flow:** (1) default: predict, then draw the triangle (3 m/s, 4 m/s, 5 m/s) (3 min); (2) change the current: time to cross unchanged when pointing straight across (2 min); (3) `aim-upstream`: find the heading for a straight crossing; impossible when the current is faster (2 min); (4) `crosswind` and `crab`: the same vector sum with bearings (3 min).
- **Original HSC-style question idea:** A swimmer can swim at 1.2 m/s in still water. She crosses a river 40 m wide that flows at 0.90 m/s. (a) If she swims straight across, how long does she take and how far downstream does she land (33 s, 30 m)? (b) At what angle upstream from straight across must she swim to land directly opposite (48.6°), and how long does that crossing take (50 s)? (c) Explain why the second crossing takes longer. (Write the full question and worked solution in the notes file.)

## Accessibility notes
- The three vectors in the triangle are distinguished by label (v_bw, v_wg, v_bg or v_pa, v_ag, v_pg) and line weight, as well as colour; angles and lengths are written on the diagram. The landing point and drift are labelled in text.
- Keyboard: every parameter is a slider with number entry, a segmented control or a toggle; Space, `.` and R run, step and reset.
- Stage `aria-label`: the engine's `describe()` sentence giving the boat's (or plane's) velocity relative to the water (or air), the current (or wind), and the resulting ground speed and direction.

## Engine change requests
- None: every key used here exists in the `particle2d` engine's meta on `w1/engine-particle2d`.

## Acceptance
Every number below comes from the formula and hand calculation shown here. Velocities are constant, so the simulation is exact apart from rounding and the far-bank event. Plane speeds are converted with 1 m/s = 3.6 km/h.

- **Check 1, straight across (default).** v = 4, u = 3, heading 0°, width 100 m. Ground velocity (3, 4): speed √(9 + 16) = **5 m/s**; direction atan(3/4) = **36.8699°** downstream; time = 100/4 = **25 s**; landing 3 × 25 = **75 m** downstream; distance from the start √(75² + 100²) = **125 m**. To land opposite, head asin(3/4) = **48.5904°** upstream.
- **Check 2, aiming upstream (`aim-upstream`).** v = 4, u = 2, heading 30°: ground velocity (2 − 4 sin 30°, 4 cos 30°) = (0, 3.46410); speed **3.46410 m/s**; direction **0°**; time = 100/3.46410 = **28.8675 s**; drift **0 m**; heading for a straight crossing asin(2/4) = **30°**.
- **Check 3, a general crossing.** v = 3, u = 2, heading 20°, width 60 m: ground velocity (2 − 3 × 0.342020, 3 × 0.939693) = (0.973940, 2.819078); speed √(0.948559 + 7.947201) = **2.98258 m/s**; direction atan(0.973940/2.819078) = **19.0591°**; time = 60/2.819078 = **21.2836 s**; drift = 0.973940 × 21.2836 = **20.7289 m**.
- **Check 4, crosswind (`crosswind`).** Air velocity (east, north) = (0, 400) km/h; wind toward 090°: (80, 0) km/h. Ground (80, 400): speed √(6400 + 160 000) = √166 400 = **407.922 km/h** = 407.922/3.6 = **113.312 m/s**; track atan(80/400) = **11.3099°**; drift angle **11.3099°**. After the 1 h flight the plane is **407 922 m** from the start, at t = **1 h**.
- **Check 5, crabbing into the wind (`crab`).** Air velocity = 400 (sin 60°, cos 60°) = (346.410, 200) km/h; wind toward 180°: (0, −200). Ground (346.410, 0): speed **346.410 km/h**, track **90°** (due east), drift angle 90° − 60° = **30°**.
- **Check 6, wind from behind and to the right.** Airspeed 300 km/h heading 045°, wind 50 km/h toward 000° (from the south): air (212.132, 212.132) + wind (0, 50) = (212.132, 262.132) km/h; speed √(45 000 + 68 713.3) = **337.214 km/h**; track atan(212.132/262.132) = **38.9817°**; drift angle 38.9817° − 45° = **−6.01826°** (pushed anticlockwise, to the left).

```acceptance
[
  { "name": "straight across a 3 m/s current", "preset": "default", "params": { "scenario": "boat", "boatSpeed": 4, "current": 3, "heading": 0, "riverWidth": 100 }, "run": "complete",
    "expect": { "groundSpeed": { "value": 5, "relTol": 1e-6 }, "groundDirection": { "value": 36.8699, "absTol": 1e-4 }, "crossingTime": { "value": 25, "relTol": 1e-6 }, "drift": { "value": 75, "relTol": 1e-6 }, "distance": { "value": 125, "relTol": 1e-6 }, "headingForStraight": { "value": 48.5904, "absTol": 1e-4 } } },
  { "name": "aim upstream to land opposite", "preset": "aim-upstream", "params": { "scenario": "boat", "boatSpeed": 4, "current": 2, "heading": 30, "riverWidth": 100 }, "run": "complete",
    "expect": { "groundSpeed": { "value": 3.46410, "relTol": 1e-5 }, "groundDirection": { "value": 0, "absTol": 1e-6 }, "crossingTime": { "value": 28.8675, "relTol": 1e-5 }, "drift": { "value": 0, "absTol": 1e-6 }, "headingForStraight": { "value": 30, "absTol": 1e-6 } } },
  { "name": "general crossing", "params": { "scenario": "boat", "boatSpeed": 3, "current": 2, "heading": 20, "riverWidth": 60 }, "run": "complete",
    "expect": { "groundSpeed": { "value": 2.98258, "relTol": 1e-5 }, "groundDirection": { "value": 19.0591, "absTol": 1e-4 }, "crossingTime": { "value": 21.2836, "relTol": 1e-5 }, "drift": { "value": 20.7289, "relTol": 1e-5 } } },
  { "name": "plane in a crosswind", "preset": "crosswind", "params": { "scenario": "plane", "airspeed": 400, "bearing": 0, "windSpeed": 80, "windBearing": 90, "flightTime": 1 }, "run": "complete",
    "expect": { "groundSpeedKmh": { "value": 407.922, "relTol": 1e-5 }, "groundSpeed": { "value": 113.312, "relTol": 1e-5 }, "groundDirection": { "value": 11.3099, "absTol": 1e-4 }, "driftAngle": { "value": 11.3099, "absTol": 1e-4 }, "distance": { "value": 407922, "relTol": 1e-5 }, "tHours": { "value": 1, "relTol": 1e-9 } } },
  { "name": "crabbing to track due east", "preset": "crab", "params": { "scenario": "plane", "airspeed": 400, "bearing": 60, "windSpeed": 200, "windBearing": 180, "flightTime": 1 }, "run": "complete",
    "expect": { "groundSpeedKmh": { "value": 346.410, "relTol": 1e-5 }, "groundDirection": { "value": 90, "absTol": 1e-4 }, "driftAngle": { "value": 30, "absTol": 1e-4 } } },
  { "name": "wind from behind and to the right", "params": { "scenario": "plane", "airspeed": 300, "bearing": 45, "windSpeed": 50, "windBearing": 0, "flightTime": 1 }, "run": "complete",
    "expect": { "groundSpeedKmh": { "value": 337.214, "relTol": 1e-5 }, "groundDirection": { "value": 38.9817, "absTol": 1e-4 }, "driftAngle": { "value": -6.01826, "absTol": 1e-4 } } }
]
```
