---
id: phy-radioactive-decay
title: "Radioactive decay"
subject: phy
engine: statsim
setup: decay
priority: P1
status: draft            # stub → draft → approved (Gate B)
page: /interactives/physics/radioactive-decay.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Physics","version":"2017","area":"Module 8: From the Universe to the Atom","outcomes":[],"verified":false}
  - {"course":"Physics","version":"2025","focusArea":"Matter, energy and the cosmos","year":12,"outcomes":[],"verified":false}
---
# Radioactive decay

> Backlog summary: Random-decay grid; the half-life curve emerging from the noise.

## Learning goal
Students see that the decay of an individual nucleus is random and cannot be predicted, yet a large sample decays in a predictable way: the number remaining halves every half-life, N = N₀(½)^(t/t½) = N₀e^(−λt) with λ = ln 2/t½. They measure a half-life from simulated data and explain why small samples follow the curve less closely than large ones.

Syllabus fit: 2017 Module 8 From the Universe to the Atom (properties of the nucleus: spontaneous decay, half-life, decay constant, N = N₀e^(−λt)); 2025 Year 12 focus area Matter, energy and the cosmos.

## What the student sees
Default view at 1920×1080, projector theme (the `statsim` engine's decay view):

- **Left: a grid of nuclei,** one square per nucleus. Undecayed nuclei are filled; each decayed nucleus turns into an outlined square (colour plus a shape change), so the grid thins out at random as time runs.
- **Right: a graph of the number remaining N against time t (s),** plotted point by point as the run proceeds, with the theoretical curve N₀(½)^(t/H) drawn as a dashed line when "Theoretical curve" is on. Horizontal guide lines at N₀/2, N₀/4 and N₀/8 meet the curve at H, 2H and 3H.
- Readouts for time, number remaining, the theoretical value, the measured half-life (once half have decayed), the decay probability per step and the activity in the last step.

Each step is 1 s of model time, and every undecayed nucleus decays in that step with probability p = 1 − 2^(−1/H). Playback is paced so a run takes about 15 s.

## Parameters
Keys and ranges are the `statsim` engine's `meta.params` for `decay` (branch `w1/engine-statsim`).

| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| nuclei | Nuclei N₀ | | 100 | 10000 | 100 | 1000 | integer |
| halfLife | Half-life H | s | 1 | 60 | 0.5 | 10 | |
| duration | Run time | s | 10 | 600 | 10 | 60 | integer; one step per second |
| showCurve | Theoretical curve | | | | | on | |
| seed | Random seed | | 1 | 99999 | 1 | 2026 | integer; the same seed gives exactly the same run |
| timeScale | Playback speed | × | 0.25 | 2 | 0.25 | 1 | |

Page controls, in order: `nuclei`, `halfLife`, `duration`, `showCurve`, `seed`, `timeScale`.

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | N₀ 1000, H 10 s, run 60 s, curve on, seed 2026 | six half-lives; the data hug the curve with visible scatter |
| small-sample | N₀ 100, H 10 s, run 60 s, curve on, seed 2026 | big random scatter: why we need many nuclei |
| large-sample | N₀ 10 000, H 10 s, run 60 s, curve on, seed 2026 | the curve emerges almost exactly |
| short-half-life | N₀ 1000, H 5 s, run 30 s, curve on, seed 2026 | same shape, twice as fast |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| t | Time t | s | 3 |
| remaining | Remaining N | | 4 (integer) |
| theoryRemaining | Theory N₀(½)^(t/H) | | 4 |
| measuredHalfLife | Measured half-life | s | 3 |
| probability | Decay probability per step | | 3 |
| lastDecays | Activity (last step) | Bq | 4 |

Definitions (the engine's `decayOutputs`): `t` = steps × 1 s; `theoryRemaining` = N₀ × 2^(−t/H); `probability` = 1 − 2^(−1/H); `measuredHalfLife` = the time at which N first falls to N₀/2, by linear interpolation between the two steps either side (— until then); `lastDecays` = decays in the last 1 s step; `decayed` = N₀ − N is also available. The run completes at the run time or when no nuclei are left.

## Assumptions shown on stage
- Each nucleus decays independently, with the same probability in every 1 s step
- p = 1 − 2^(−1/H), so on average half remain after H seconds
- No daughter decays counted; the grid only tracks the parent nuclei
- The random seed makes each run repeatable

## Try this (3–5 predict, observe, explain prompts)
1. Predict: with 1000 nuclei and a half-life of 10 s, how many will be left after 30 s? Run it and compare the count with your prediction and with the theory readout.
2. Observe: watch one square in the grid. Can you predict when it will decay? Now look at the whole graph. Which is predictable: one nucleus, or the sample?
3. Explain: run the `small-sample` preset, then `large-sample`. Why does the larger sample follow the dashed curve so much more closely?
4. Observe: read the measured half-life for several seeds. How close is it to H each time? Does it get closer with more nuclei?
5. Explain: the activity readout falls as time goes on even though the half-life never changes. Why? (Hint: activity is proportional to N.)

## Teacher notes outline
- **Misconceptions to target:** after two half-lives everything has decayed; a nucleus that has survived a long time is "due" to decay; half-life depends on how many nuclei there are; the activity stays constant; decay is caused by nuclei bumping into each other.
- **10-minute lesson flow:** (1) default: predict N at 10, 20, 30 s, then run (3 min); (2) watch single squares vs the whole graph: random vs predictable (2 min); (3) `small-sample` vs `large-sample`, several seeds: scatter falls with N (3 min); (4) λ = ln 2/H and N = N₀e^(−λt) checked against a reading (2 min).
- **Original HSC-style question idea:** Iodine-131, used in medicine, has a half-life of 8.0 days. A sample has an activity of 4.0 MBq. (a) Calculate its decay constant (0.0866 per day). (b) Calculate its activity after 24 days (0.50 MBq). (c) Calculate how long it takes for the activity to fall to 10% of its starting value (26.6 days). (d) Explain why the decay of a single iodine nucleus cannot be predicted even though the half-life is known precisely. (Write the full question and worked solution in the notes file.)

## Accessibility notes
- Decayed nuclei change shape (filled to outlined), not just colour. The simulated data are plotted as points and the theory as a dashed line, with a legend in text. The half-life guide lines are labelled N₀/2, N₀/4, N₀/8.
- Keyboard: every parameter is a slider with number entry or a toggle; Space, `.` (one 1 s step) and R run, step and reset.
- Stage `aria-label` (the engine's `describe()`): "Grid of 1000 nuclei, each decaying in a 1 second step with probability 1 − 2^(−1/H) for half-life H = 10 s. 487 remain at t = 10 s, graphed against the curve N₀(1/2)^(t/H)."

## Engine change requests
- None: every key used here exists in the `statsim` engine's meta on `w1/engine-statsim`.

## Acceptance
Every number below comes from the formula and hand calculation shown here. One engine step is one 1 s decay step, so `{ "steps": N }` reaches t = N s. Random checks use a fixed seed (2026), so each run is exactly repeatable; their tolerances are set at about four standard deviations of the binomial scatter, so any correct engine passes with near certainty.

- **Check 1, theory and probability after 30 steps (default).** N₀ = 1000, H = 10 s, t = 30 s: theory N = 1000 × 2^(−3) = **125**. p = 1 − 2^(−1/10) = 1 − 0.933033 = **0.0669670**.
- **Check 2, half remain after one half-life (large sample).** N₀ = 10 000, H = 10, after 10 steps. Each nucleus survives a step with probability 2^(−1/10), so it survives 10 steps with probability (2^(−1/10))¹⁰ = ½. N is binomial with mean 10 000 × ½ = **5000** and SD √(10 000 × ½ × ½) = 50 (1.0%). Tolerance 4% (4 SD). Theory **5000**.
- **Check 3, a quarter remain after two half-lives.** Same, after 20 steps: survival probability ¼, mean **2500**, SD √(10 000 × ¼ × ¾) = 43.3 (1.7%). Tolerance 7% (4 SD).
- **Check 4, measured half-life (large sample, full run).** N₀ = 10 000, H = 10, run 60 s. Near t = 10 s, N is 5000 ± 50 and falls by about 5000 × p = 5000 × 0.0670 = 335 per step, so the interpolated crossing time has SD ≈ 50/335 = 0.15 s (1.5% of H). Expected **10 s**, tolerance 6% (4 SD). At the end t = **60 s** and theory = 10 000 × 2^(−6) = **156.25**.
- **Check 5, shorter half-life.** N₀ = 10 000, H = 5, run 30 s: p = 1 − 2^(−1/5) = 1 − 0.870551 = **0.129449**. Near t = 5 s N falls by about 5000 × 0.1294 = 647 per step, so the SD of the crossing time ≈ 50/647 = 0.077 s (1.5% of H). Expected **5 s**, tolerance 6%.

(Run against the engine's own model on `w1/engine-statsim` with seed 2026: Check 2 gives 4968, Check 3 gives 2474, Check 4 gives 9.91 s and Check 5 gives 4.99 s, all inside the tolerances.)

```acceptance
[
  { "name": "theory and probability after 30 s", "params": { "nuclei": 1000, "halfLife": 10, "duration": 60, "seed": 2026 }, "run": { "steps": 30 },
    "expect": { "t": { "value": 30, "absTol": 1e-9 }, "theoryRemaining": { "value": 125, "relTol": 1e-9 }, "probability": { "value": 0.0669670, "relTol": 1e-5 } } },
  { "name": "half remain after one half-life", "preset": "large-sample", "params": { "nuclei": 10000, "halfLife": 10, "duration": 60, "seed": 2026 }, "run": { "steps": 10 },
    "expect": { "remaining": { "value": 5000, "relTol": 0.04 }, "theoryRemaining": { "value": 5000, "relTol": 1e-9 } } },
  { "name": "a quarter remain after two half-lives", "params": { "nuclei": 10000, "halfLife": 10, "duration": 60, "seed": 2026 }, "run": { "steps": 20 },
    "expect": { "remaining": { "value": 2500, "relTol": 0.07 } } },
  { "name": "measured half-life from a full run", "params": { "nuclei": 10000, "halfLife": 10, "duration": 60, "seed": 2026 }, "run": "complete",
    "expect": { "measuredHalfLife": { "value": 10, "relTol": 0.06 }, "t": { "value": 60, "absTol": 1e-9 }, "theoryRemaining": { "value": 156.25, "relTol": 1e-9 } } },
  { "name": "shorter half-life", "params": { "nuclei": 10000, "halfLife": 5, "duration": 30, "seed": 2026 }, "run": "complete",
    "expect": { "probability": { "value": 0.129449, "relTol": 1e-5 }, "measuredHalfLife": { "value": 5, "relTol": 0.06 } } }
]
```
