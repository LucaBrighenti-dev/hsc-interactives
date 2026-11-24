---
id: phy-work-energy-track
title: "Work-energy track"
subject: phy
engine: particle2d
setup: track
priority: P2
status: draft           # stub → draft → approved (Gate B)
page: /interactives/physics/work-energy-track.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Physics","version":"2017","area":"Module 2: Dynamics","outcomes":[],"verified":false}
  - {"course":"Physics","version":"2025","focusArea":"Fundamentals of mechanics","year":11,"outcomes":[],"verified":false}
---
# Work-energy track

> Backlog summary: KE, GPE and work against friction as stacked bars on a roller track.

## Learning goal
Students track energy as a cart rolls on a curved track: with no friction, kinetic and gravitational potential energy trade off while their sum stays constant, so the speed at any height follows from mgh₀ + ½mv₀² = mgh + ½mv²; with friction, the work done against friction grows steadily and accounts exactly for the mechanical energy lost. They use the work–energy theorem to predict speeds and stopping distances, and see that the track's shape changes how fast energy is lost but not the energy accounting.

Syllabus tags: 2017 Module 2 (Dynamics: forces, work, kinetic and potential energy, conservation of energy); 2025 Year 11 focus area Fundamentals of mechanics.

## What the student sees
Default view at 1920×1080 (light projector stage):

- **Left (about 70% of the width), the track.** A side view of the track profile drawn as a thick line on a light grid in metres, with a height scale on the left. A small cart (a flat rectangle with two wheels) rides along it; it is locked to the track and cannot leave it. A velocity arrow on the cart, labelled with the speed, and a dashed horizontal line at the starting height labelled "start height h₀" so students can compare heights. With friction, the track is drawn with a fine hatch underneath to show it is rough.
- **Right (about 30%), stacked energy bars** for the current instant: one column whose segments are KE (orange), GPE (dark grey) and work done against friction (light grey, hatched), each labelled with its value in J, inside an outline of the starting total energy. Because KE + GPE + W stays equal to the starting total, the column always fills the outline exactly. Beside it, separate single bars for each quantity so changes are easy to read.
- **Below, an energy–time graph** (KE, GPE and W against t, with the total as a dashed line).

Track shapes (as built in the engine): `valley` is a symmetric U, y = h₀(2x/L − 1)² with L = 20 m; `hills` has two valleys at h₀/3 separated by a hump at h₀/2; `ramp` is a curved ramp, y = h₀(1 − sin(πx/2L)) for 0 ≤ x ≤ 20 m, meeting a flat runway that runs to x = 60 m. The cart starts at the left rim (x = 0, height h₀).

## Parameters
Keys follow the `particle2d` engine's `track` setup as built on the in-progress branch `w1/engine-particle2d` (read on 25 November; not yet on `origin`). See "Engine change requests".

| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| shape | Track | | | | | valley | enum: `valley` (Valley), `hills` (Two valleys), `ramp` (Ramp and runway) |
| trackHeight | Start height h₀ | m | 1 | 20 | 0.5 | 5 | |
| mass | Mass m | kg | 0.1 | 10 | 0.1 | 2 | page default 2 kg (engine default 1) |
| friction | Friction coefficient μ | | 0 | 0.5 | 0.01 | 0.05 | kinetic friction everywhere on the track |
| startSpeed | Starting speed v₀ | m/s | 0 | 15 | 0.5 | 0 | along the track, to the right |
| g | Gravitational field g | m/s² | 1 | 25 | 0.1 | 9.8 | Physics preset value; shown on stage |
| duration | Run time | s | 1 | 60 | 1 | 20 | the run also ends if the cart stops or leaves an end |
| timeScale | Playback speed | × | 0.25 | 2 | 0.25 | 1 | |

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | shape valley, trackHeight 5, mass 2, friction 0.05, startSpeed 0, g 9.8, duration 20 | swings that die away; W grows as KE + GPE shrinks |
| frictionless | shape valley, trackHeight 5, mass 2, friction 0, g 9.8, duration 20 | KE and GPE trade; the total is constant; it reaches the same height on the far side |
| ramp-runway | shape ramp, trackHeight 5, mass 2, friction 0.1, g 9.8, duration 30 | the cart stops on the runway with all 98 J turned into work against friction |
| hills | shape hills, trackHeight 5, mass 2, friction 0.02, g 9.8, duration 30 | does it make it over the hump? |
| push-start | shape ramp, trackHeight 5, mass 2, friction 0, startSpeed 4, g 9.8, duration 30 | initial KE adds to the total |

No catalogue listing reuses this page.

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| kineticEnergy | Kinetic energy | J | 3 |
| potentialEnergy | Gravitational potential energy | J | 3 |
| frictionWork | Work done by friction | J | 3 |
| totalEnergy | Total energy | J | 3 |
| v | Velocity v | m/s | 3 |
| height | Height | m | 3 |
| x | Position x | m | 3 |
| normalForce | Normal force | N | 3 |
| t | Time t | s | 3 |

`totalEnergy` is KE + GPE + W, the energy accounted for, which stays equal to the starting value.

## Assumptions shown on stage
- Cart treated as a particle locked to the track (it cannot leave it)
- Kinetic friction μN everywhere, with N including the curvature term m v²κ
- No air resistance; rolling wheels' rotational energy ignored
- GPE measured from the lowest point of the track (height 0)
- g = 9.8 m/s²

## Try this (3–5 predict, observe, explain prompts)
1. **Predict:** on the frictionless valley, how high will the cart rise on the far side? Play and check with the dashed start-height line.
2. **Observe:** watch the stacked bars on the frictionless valley. At the lowest point, what fraction of the energy is kinetic? Calculate the speed there from mgh₀ = ½mv², then check the readout.
3. **Predict, then observe:** double the mass. What happens to the speed at the bottom, and to each energy value?
4. **Explain:** on the ramp and runway with μ = 0.1, where does the 98 J go by the time the cart stops? Why does the total bar never shrink?
5. **Explain:** set the valley with μ = 0.1 and a 30 s run. The cart stops about a centimetre above the lowest point, not exactly at it, and the bars show a sliver of GPE left. Why can friction hold it on a gentle slope?

## Teacher notes outline
- **Misconceptions to target:** heavier carts go faster down the same track; energy is "used up" by friction (it is transferred to internal energy of the surfaces); GPE depends on the path taken; friction does the same work regardless of speed on a curved track (the normal force, and so friction, is larger in the dips); KE and GPE always swap equally (only without friction).
- **10-minute lesson flow:** 2 min prompt 1; 3 min frictionless valley with the bars and the speed calculation; 2 min mass doubling; 3 min ramp-runway: account for every joule, then hand-calculate the speed at the foot of a frictionless ramp.
- **Original HSC-style question idea:** a 60 kg skateboarder starts from rest at the top of a 3.2 m high curved ramp and reaches the bottom at 7.0 m/s. (a) Calculate the work done against friction on the ramp. (b) The skateboarder then rolls onto level ground where the average resistive force is 45 N. Calculate how far they travel before stopping. (c) Explain why the work done against friction on the curved ramp would be greater for a faster rider. Worked solution in the notes file (W = 60 × 9.8 × 3.2 − ½ × 60 × 7.0² = 1881.6 − 1470 = 411.6 J; d = 1470/45 = 32.7 m).

## Accessibility notes
- The energy segments differ by fill pattern (solid, dark, hatched) and carry text labels, not colour alone; the graph lines are solid, dashed and dotted.
- The cart's speed is a number on its arrow as well as the arrow's length.
- Keyboard: all controls through the shell; Step advances 0.1 s.
- Stage `aria-label` (engine `describe()`): "A cart on a roller track starting 5 metres high with friction coefficient 0.05, with stacked energy bars." The page adds the live readout summary through the shell.

## Engine change requests
Keys to reconcile with engine meta: every param and output key above was read from the in-progress `w1/engine-particle2d` branch on 25 November (the engine-builder's worktree, not yet pushed). If the merged engine differs, the Wave 2 builder updates this spec's keys and presets to match before building. Behaviour this spec relies on, as implemented there:
- Track profiles as described under "What the student sees", with the cart starting at x = 0.
- The run completes when the cart stops (speed reaches zero where μ ≥ |slope|), reaches either end of the track, or reaches `duration`.
- `totalEnergy` = KE + GPE + work done against friction.

No new features are requested.

## Acceptance
Every number below comes from the formula and hand calculation shown here. m = 2.0 kg, g = 9.8 m/s², h₀ = 5.0 m throughout, so the starting GPE is mgh₀ = 2.0 × 9.8 × 5.0 = 98 J.

- **Check 1, at the start.** v₀ = 0: KE = **0 J**, GPE = **98 J**, total = **98 J**, height = **5 m**.
- **Check 2, frictionless valley, energy conserved.** μ = 0, after 1200 steps (5.0 s): no work against friction (**W = 0**), so KE + GPE + W = **98 J** at every instant. RK4 at 1/240 s conserves this to far better than 1 × 10⁻⁶.
- **Check 3, frictionless ramp to the end of the runway.** μ = 0: all 98 J of GPE becomes KE by the foot of the ramp, and the flat runway takes none, so at the end ½mv² = 98 J, v = √(2gh₀) = √(2 × 9.8 × 5.0) = √98 = **9.899 495 m/s**, KE = **98 J**, height **0**, W = **0**. On the flat runway the normal force is mg = **19.6 N**.
- **Check 4, ramp and runway with friction: every joule accounted for.** μ = 0.1. First, show the cart stops on the runway. The ramp is concave up, so N ≥ mg cos φ and the work against friction on it is at least ∫μmg cos φ ds = μmg × (horizontal run) = 0.1 × 2.0 × 9.8 × 20 = 39.2 J. So at most 98 − 39.2 = 58.8 J reaches the runway, where friction is μmg = 1.96 N, and the cart stops within 58.8/1.96 = 30 m, inside the 40 m runway. When it stops, KE = **0** and GPE = **0** (height 0), so the work done against friction equals the starting energy: **W = 98 J**.
- **Check 5, a push start.** μ = 0, v₀ = 4.0 m/s on the ramp: starting energy = ½ × 2.0 × 4.0² + 98 = 16 + 98 = 114 J; at the end of the runway v = √(v₀² + 2gh₀) = √(16 + 98) = √114 = **10.677 078 m/s** and KE = **114 J**.

Tolerances: 1 × 10⁻⁹ relative for the static check; 1 × 10⁻⁵ for energy after integration; 1 × 10⁻⁴ for speeds after a complete run (RK4 with event location). Zero values use absolute tolerances.

```acceptance
[
  { "name": "energy at the start", "params": { "shape": "valley", "trackHeight": 5, "mass": 2, "friction": 0, "startSpeed": 0, "g": 9.8 }, "run": "static",
    "expect": { "kineticEnergy": { "value": 0, "absTol": 1e-12 }, "potentialEnergy": { "value": 98, "relTol": 1e-9 },
                "totalEnergy": { "value": 98, "relTol": 1e-9 }, "height": { "value": 5, "relTol": 1e-9 } } },
  { "name": "frictionless valley conserves energy", "params": { "shape": "valley", "trackHeight": 5, "mass": 2, "friction": 0, "startSpeed": 0, "g": 9.8, "duration": 20 }, "run": { "steps": 1200 },
    "expect": { "totalEnergy": { "value": 98, "relTol": 1e-5 }, "frictionWork": { "value": 0, "absTol": 1e-9 } } },
  { "name": "frictionless ramp: v = sqrt(2gh)", "params": { "shape": "ramp", "trackHeight": 5, "mass": 2, "friction": 0, "startSpeed": 0, "g": 9.8, "duration": 30 }, "run": "complete",
    "expect": { "v": { "value": 9.899494937, "relTol": 1e-4 }, "kineticEnergy": { "value": 98, "relTol": 1e-4 },
                "height": { "value": 0, "absTol": 1e-9 }, "frictionWork": { "value": 0, "absTol": 1e-9 }, "normalForce": { "value": 19.6, "relTol": 1e-6 } } },
  { "name": "ramp with friction: all energy becomes work against friction", "params": { "shape": "ramp", "trackHeight": 5, "mass": 2, "friction": 0.1, "startSpeed": 0, "g": 9.8, "duration": 30 }, "run": "complete",
    "expect": { "frictionWork": { "value": 98, "relTol": 1e-4 }, "kineticEnergy": { "value": 0, "absTol": 1e-6 }, "height": { "value": 0, "absTol": 1e-9 } } },
  { "name": "push start adds kinetic energy", "params": { "shape": "ramp", "trackHeight": 5, "mass": 2, "friction": 0, "startSpeed": 4, "g": 9.8, "duration": 30 }, "run": "complete",
    "expect": { "v": { "value": 10.67707825, "relTol": 1e-4 }, "kineticEnergy": { "value": 114, "relTol": 1e-4 } } }
]
```
