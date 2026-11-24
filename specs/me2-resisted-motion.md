---
id: me2-resisted-motion
title: "Resisted motion"
subject: me2
engine: particle2d
setup: resisted-1d
priority: P1
status: draft            # stub → draft → approved (Gate B)
page: /interactives/maths-ext2/resisted-motion.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Mathematics Extension 2","version":"2024","area":"Mechanics","focusArea":"Applications of calculus to mechanics","year":12,"outcomes":[],"verified":false}
---
# Resisted motion

> Backlog summary: Horizontal and vertical motion with kv and kv^2 resistance; terminal velocity.

## Learning goal
Students write the equation of motion for a particle moving in a straight line against a resistance proportional to v or to v², horizontally or vertically, and see what its solutions mean: a falling particle approaches a terminal velocity where the resistance balances the weight; a particle thrown upwards reaches a lower maximum height, sooner, than without resistance, and its equation of motion changes form at the top when the resistance changes direction; and a horizontally coasting particle with kv resistance never stops but approaches a finite limiting distance.

## What the student sees
The stage at 1920×1080 is split into two panels.

- **Left, the motion (about 30% of the width):** a vertical track (or a horizontal track for horizontal motion) with the particle as a filled orange disc. Arrows on the particle show the weight mg (vertical motion only) and the resistance R, each labelled with its size in newtons, and a thinner velocity arrow labelled v. The track scrolls with the particle and has a scale bar in metres; the start position is marked "x = 0". With **Compare with no resistance** on, a hollow grey ring shows where the particle would be without resistance.
- **Right, the graph:** the selected graph (v–t by default) drawn live in orange as the motion runs, with labelled axes and units. With the comparison on, the no-resistance graph is a dashed grey line. For vertical motion with resistance, a dotted horizontal line marks the terminal velocity −v_T, labelled "−v_T = −19.6 m/s".
- **Above the graph:** the equation of motion with numbers substituted, for example "m dv/dt = −mg − kv → 1 × dv/dt = −9.8 − 0.5v". For vertical kv² motion two equations are shown, "rising: m dv/dt = −mg − kv²" and "falling: m dv/dt = −mg + kv²", and the one in use is highlighted.

Sign convention: for vertical motion, upward is positive and x is the height above the start. For horizontal motion, the initial direction of motion is positive. The run ends at the chosen run time (there is no ground).

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| direction | Motion | | | | | vertical | enum: `horizontal`, `vertical` |
| drag | Resistance | | | | | linear | enum: `none`, `linear` (R = kv), `quadratic` (R = kv²); same values as the projectile setup |
| mass | Mass m | kg | 0.1 | 10 | 0.1 | 1 | |
| k | Resistance constant k | kg/s (kv) or kg/m (kv²) | 0 | 2 | 0.01 | 0.5 | visible when drag is not none; R = k\|v\| or kv², always opposing the velocity |
| v0 | Initial velocity | m/s | −30 | 60 | 0.5 | 0 | vertical: upward positive |
| g | g | m/s² | 1 | 20 | 0.1 | 9.8 | visible when direction is vertical |
| duration | Run time | s | 1 | 60 | 1 | 10 | the run completes at this time |
| graph | Graph | | | | | vt | enum, segmented: `vt` (v–t), `xt` (x–t), `at` (a–t), `vx` (v against x) |
| showNoDrag | Compare with no resistance | | | | | on | boolean |
| showForces | Force arrows | | | | | on | boolean |
| timeScale | Playback speed | × | 0.25 | 2 | 0.25 | 1 | |

Changing any parameter except `graph`, `showNoDrag`, `showForces` and `timeScale` resets the run to t = 0.

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | vertical, linear, m = 1, k = 0.5, v0 = 0, g = 9.8, run 10 s, graph v–t, comparison on, forces on | falls from rest towards v_T = mg/k = 19.6 m/s |
| fall-kv2 | vertical, quadratic, m = 1, k = 0.1, v0 = 0, run 5 s | v_T = √(mg/k) = √98 ≈ 9.90 m/s, reached much sooner |
| up-kv | vertical, linear, m = 1, k = 0.5, v0 = 20, run 6 s | rises to 12.4 m (not 20.4 m) in 1.41 s, then falls towards −19.6 m/s |
| up-kv2 | vertical, quadratic, m = 1, k = 0.1, v0 = 20, run 5 s | rises to 8.13 m in 1.12 s; the equation of motion switches at the top |
| up-and-back | vertical, quadratic, m = 0.2, k = 0.02, v0 = 14, run 3 s, graph v against x | matches the notes question: height 5 ln 3 m, returns with speed 14/√3 ≈ 8.08 m/s |
| coast-kv | horizontal, linear, m = 2, k = 0.5, v0 = 10, run 20 s, graph x–t | never stops, but x approaches mv₀/k = 40 m |
| coast-kv2 | horizontal, quadratic, m = 1, k = 0.1, v0 = 20, run 20 s, graph x–t | x = 10 ln(1 + 2t) grows without bound |
| no-resistance | vertical, none, v0 = 19.6, run 4 s | the baseline: height v₀²/(2g) = 19.6 m at t = 2 s |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| t | Time t | s | 3 |
| x | Displacement x | m | 3 |
| v | Velocity v | m/s | 3 |
| a | Acceleration a | m/s² | 3 |
| terminalSpeed | Terminal speed v_T | m/s | 3 |
| maxHeight | Greatest height so far | m | 3 |
| timeToTop | Time to greatest height | s | 3 |
| limitDistance | Limiting distance mv₀/k | m | 3 |

Definitions:
- t = n·dt after n fixed steps of dt = 1/240 s; the run completes after round(duration/dt) steps.
- terminalSpeed is analytic: mg/k (linear) or √(mg/k) (quadratic) for vertical motion with k > 0; NaN for horizontal motion, no resistance or k = 0.
- maxHeight (vertical only) is the greatest x reached so far in the run; it is 0 for a particle released from rest or thrown downwards.
- timeToTop (vertical only) is the time when v first changes from positive to zero or negative, found by linear interpolation between steps; NaN until that happens, and NaN when v0 ≤ 0.
- limitDistance is analytic, mv₀/k, for horizontal kv motion with k > 0; NaN otherwise.
- a is the acceleration at the current state, from the equation of motion.

## Assumptions shown on stage
- Point particle moving in a straight line; g = 9.8 m/s² (as set), uniform
- Resistance R = kv or kv², always opposite to the velocity
- Vertical: upward positive, no ground. Horizontal: no other forces

## Try this (3–5 predict, observe, explain prompts)
1. Predict: with kv resistance, a particle falls from rest. Sketch v against t before pressing play. What happens to the acceleration as the speed grows?
2. Observe: in "Up with kv²", compare the greatest height and the time to reach it with the dashed no-resistance motion. Then watch the equation of motion when the particle turns around.
3. Predict: does a particle thrown upwards take longer to rise or to fall back to its start when there is resistance? Use "Up with kv" to check.
4. Observe: in "Coast with kv" and "Coast with kv²", watch x for 20 s. Which particle travels a finite total distance, and what is it?
5. Explain: double the mass in the default scenario. Why does the terminal speed double for kv resistance but only rise by a factor of √2 for kv²?

## Teacher notes outline
- Misconceptions to target: resistance acts downwards only (it opposes the velocity, so it acts upwards when falling); the same equation of motion holds on the way up and down for kv² (it does not: kv² must be written as −kv|v| or split into two cases); terminal velocity is reached in finite time; a heavier particle falls faster only because of gravity (it is because the resistance is a smaller fraction of its weight); with resistance the particle must take the same time to rise and fall.
- 10-minute lesson flow: (1) default fall: predict the v–t sketch, run, introduce v_T from a = 0 (3 min); (2) kv² fall: compare the approach to v_T, derive v_T = √(mg/k) (2 min); (3) up-kv2: the change of equation at the top; compare maximum heights with and without resistance (3 min); (4) coasting: x as t → ∞ for kv and kv², using v dv/dx (2 min).
- Original HSC-style question idea: a ball of mass 0.2 kg is thrown vertically upwards at 14 m/s. Air resistance has magnitude 0.02v² newtons, and g = 9.8 m/s². (a) Show that while the ball rises, v dv/dx = −(98 + v²)/10. (b) Show that its greatest height is 5 ln 3 metres. (c) Show that it returns to its starting point with speed 14/√3 m/s. (d) State its terminal speed. (Answers: (b) x = 5 ln((98 + 196)/98); (c) falling, v² = 98(1 − e^(−x/5)) with x = 5 ln 3 gives v² = 196/3; (d) √98 = 7√2 m/s.) Write the full question and worked solution in the notes file.

## Accessibility notes
- Second cues beyond colour: the simulated graph is a solid orange line, the no-resistance comparison is dashed grey, and the terminal velocity is a dotted line with a text label. Force arrows carry text labels ("mg = 9.8 N", "R = 4.90 N"); the comparison particle is a hollow ring and the real particle a filled disc.
- Keyboard: all controls are sliders, segmented controls or toggles; the shell shortcuts apply (Space play/pause, . step, R reset).
- Stage aria-label (from `describe()`), for example: "Particle of mass 1 kilogram falling from rest against resistance 0.5 v newtons. At t = 10 s its velocity is −19.5 m/s; its terminal speed is 19.6 m/s."

## Engine change requests
No `particle2d` engine meta had been pushed when this spec was written (origin had no `w1/engine-particle2d` branch on 25 Nov). **Keys to reconcile with engine meta:**
- Params for setup `resisted-1d`: `direction`, `drag`, `mass`, `k`, `v0`, `g`, `duration`, `graph`, `showNoDrag`, `showForces`, `timeScale`. `drag` and `k` use the same values and meaning as the projectile setup (§5.2 example: `drag: 'quadratic', k: 0.02`), with k a force coefficient so that R = kv or kv² newtons.
- Outputs: `t`, `x`, `v`, `a`, `terminalSpeed`, `maxHeight`, `timeToTop`, `limitDistance`.
- A v-against-x graph (`graph: 'vx'`), beyond the s–t, v–t and a–t graphs in guide §9.1, because Ext 2 resisted motion is often solved with v dv/dx.
- Behaviour needed: time is n·dt with dt = 1/240 s and the run completes after round(duration/dt) steps (as in the demo engine), and a parameter change resets the run to t = 0, so the step counts below land on exact times.

## Acceptance
Every number below comes from the formula and hand calculation shown here. Each step is 1/240 s, so 240 steps is 1 s. Expected values for the motion come from the closed-form solutions; the engine integrates numerically (RK4), so those checks use a relative tolerance of 1e-4 (1e-3 for the sampled greatest height and its time). Analytic outputs use 1e-9. An independent RK4 run at dt = 1/240 s agrees with every value below to better than 2e-6 relative.

- **Check 1, falling with kv (default scenario), 2400 steps = 10 s.** m = 1, k = 0.5, g = 9.8, v₀ = 0. Taking downwards as positive for the derivation, dv/dt = g − (k/m)v gives a speed of v_T(1 − e^(−kt/m)) with v_T = mg/k = 9.8/0.5 = **19.6 m/s**. With kt/m = 5, e^(−5) = 0.006737947, so the speed is 19.6 × 0.993262053 = 19.4679362, and with upward positive **v = −19.4679362 m/s**. Distance fallen = v_T t − (m v_T/k)(1 − e^(−kt/m)) = 196 − 39.2 × 0.993262053 = 196 − 38.9358725 = 157.0641275, so **x = −157.064128 m**. a = −g e^(−kt/m) = −9.8 × 0.006737947 = **−0.0660318806 m/s²**. **t = 10 s**.
- **Check 2, falling with kv², 1200 steps = 5 s.** m = 1, k = 0.1, g = 9.8, v₀ = 0. v_T = √(mg/k) = √98 = **9.89949494 m/s**. Downwards dv/dt = g − (k/m)v² gives a speed of v_T tanh(gt/v_T); gt/v_T = 49/9.89949494 = 4.94974747 and tanh(4.94974747) = 0.999899605, so **v = −9.89850108 m/s**. Distance fallen = (v_T²/g) ln cosh(gt/v_T) = (m/k) ln cosh(4.94974747) = 10 × ln(70.5732012) = 10 × 4.25665049 = 42.5665049, so **x = −42.5665049 m**.
- **Check 3, thrown up with kv², 1200 steps = 5 s.** m = 1, k = 0.1, g = 9.8, v₀ = 20. Rising, dv/dt = −g − (k/m)v². Time to the top: t = (v_T/g) tan⁻¹(v₀/v_T) = 1.01015254 × tan⁻¹(2.02030509) = 1.01015254 × 1.11117700 = **1.12245827 s**. Using v dv/dx = −g − (k/m)v², the greatest height is H = (m/(2k)) ln(1 + kv₀²/(mg)) = 5 ln(1 + 40/9.8) = 5 ln 5.08163265 = 5 × 1.62563260 = **8.12816299 m** (without resistance, v₀²/(2g) = 20.4 m). terminalSpeed = **9.89949494 m/s**.
- **Check 4, thrown up with kv, 1200 steps = 5 s.** m = 1, k = 0.5, g = 9.8, v₀ = 20, v_T = 19.6. Rising, dv/dt = −g − (k/m)v, so t = (m/k) ln(1 + v₀/v_T) = 2 ln(2.02040816) = 2 × 0.703299552 = **1.40659910 s**, and H = (m/k)(v₀ − v_T ln(1 + v₀/v_T)) = 2(20 − 19.6 × 0.703299552) = 2(20 − 13.7846712) = **12.4306576 m**.
- **Check 5, coasting with kv, run to completion at 4 s.** Horizontal, m = 2, k = 0.5, v₀ = 10, run time 4 s (960 steps). dv/dt = −(k/m)v gives v = v₀e^(−kt/m) and x = (mv₀/k)(1 − e^(−kt/m)). kt/m = 1, e^(−1) = 0.367879441, so **v = 3.67879441 m/s**, **x = 40 × 0.632120559 = 25.2848224 m**, **t = 4 s**. limitDistance = mv₀/k = 20/0.5 = **40 m**.
- **Check 6, coasting with kv², 480 steps = 2 s.** Horizontal, m = 1, k = 0.1, v₀ = 20. dv/dt = −(k/m)v² gives 1/v = 1/v₀ + kt/m, so v = 20/(1 + 2t) = **4 m/s** at t = 2, and x = (m/k) ln(1 + kv₀t/m) = 10 ln 5 = **16.0943791 m**. a = −(k/m)v² = −0.1 × 16 = **−1.6 m/s²**. terminalSpeed and limitDistance are NaN here and are not checked.
- **Check 7, no resistance (preset), 960 steps = 4 s.** v₀ = 19.6, g = 9.8: time to top v₀/g = **2 s**, greatest height v₀²/(2g) = 384.16/19.6 = **19.6 m**.

```acceptance
[
  { "name": "falling with kv: 10 s after release", "params": { "direction": "vertical", "drag": "linear", "mass": 1, "k": 0.5, "g": 9.8, "v0": 0, "duration": 20 }, "run": { "steps": 2400 },
    "expect": { "t": { "value": 10, "absTol": 1e-9 }, "v": { "value": -19.4679362, "relTol": 1e-4 }, "x": { "value": -157.064128, "relTol": 1e-4 },
                "a": { "value": -0.0660318806, "relTol": 1e-3 }, "terminalSpeed": { "value": 19.6, "relTol": 1e-9 } } },
  { "name": "falling with kv^2: 5 s after release", "params": { "direction": "vertical", "drag": "quadratic", "mass": 1, "k": 0.1, "g": 9.8, "v0": 0, "duration": 20 }, "run": { "steps": 1200 },
    "expect": { "t": { "value": 5, "absTol": 1e-9 }, "v": { "value": -9.89850108, "relTol": 1e-4 }, "x": { "value": -42.5665049, "relTol": 1e-4 },
                "terminalSpeed": { "value": 9.89949494, "relTol": 1e-9 } } },
  { "name": "thrown up with kv^2: greatest height and time to top", "params": { "direction": "vertical", "drag": "quadratic", "mass": 1, "k": 0.1, "g": 9.8, "v0": 20, "duration": 20 }, "run": { "steps": 1200 },
    "expect": { "maxHeight": { "value": 8.12816299, "relTol": 1e-3 }, "timeToTop": { "value": 1.12245827, "relTol": 1e-3 }, "terminalSpeed": { "value": 9.89949494, "relTol": 1e-9 } } },
  { "name": "thrown up with kv: greatest height and time to top", "params": { "direction": "vertical", "drag": "linear", "mass": 1, "k": 0.5, "g": 9.8, "v0": 20, "duration": 20 }, "run": { "steps": 1200 },
    "expect": { "maxHeight": { "value": 12.4306576, "relTol": 1e-3 }, "timeToTop": { "value": 1.4065991, "relTol": 1e-3 } } },
  { "name": "coasting with kv: run completes at 4 s", "params": { "direction": "horizontal", "drag": "linear", "mass": 2, "k": 0.5, "v0": 10, "duration": 4 }, "run": "complete",
    "expect": { "t": { "value": 4, "absTol": 1e-9 }, "v": { "value": 3.67879441, "relTol": 1e-4 }, "x": { "value": 25.2848224, "relTol": 1e-4 },
                "limitDistance": { "value": 40, "relTol": 1e-9 } } },
  { "name": "coasting with kv^2: 2 s", "params": { "direction": "horizontal", "drag": "quadratic", "mass": 1, "k": 0.1, "v0": 20, "duration": 20 }, "run": { "steps": 480 },
    "expect": { "t": { "value": 2, "absTol": 1e-9 }, "v": { "value": 4, "relTol": 1e-4 }, "x": { "value": 16.0943791, "relTol": 1e-4 }, "a": { "value": -1.6, "relTol": 1e-4 } } },
  { "name": "no resistance baseline (preset)", "preset": "no-resistance", "params": {}, "run": { "steps": 960 },
    "expect": { "timeToTop": { "value": 2, "relTol": 1e-3 }, "maxHeight": { "value": 19.6, "relTol": 1e-3 } } }
]
```
