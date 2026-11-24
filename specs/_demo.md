---
id: _template
title: "Reference template"
subject: none
engine: demo
setup: wave
priority: none
status: approved        # the reference spec: proves the acceptance runner (guide W0-13)
page: /interactives/_template.html
---
# Reference template

> The spec for `site/interactives/_template.html`, which runs the reference engine `demo`. It shows spec writers what a finished acceptance section looks like.

## Learning goal
Students see that the displacement of a sinusoid is the vertical projection of a rotating phasor, and that the period depends only on the frequency.

## What the student sees
A rotating phasor of length A on the left and the y–t graph on the right, drawn on the same vertical scale, with a dashed line joining the phasor tip to the current point on the graph. The equation with the current values sits above.

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| amplitude | Amplitude A | m | 0.1 | 5 | 0.1 | 2 | |
| frequency | Frequency f | Hz | 0.1 | 3 | 0.05 | 0.5 | |
| phase | Phase φ | ° | −180 | 180 | 5 | 0 | |
| phaseUnit | Show φ in | | | | | deg | deg or rad (shown as a multiple of π) |
| duration | Run time | s | 1 | 30 | 1 | 10 | the run completes at this time |
| showPhasor | Rotating phasor | | | | | on | |
| phasorLabels | Label the phasor | | | | | on | visible only when the phasor is on |
| timeScale | Playback speed | × | 0.25 | 2 | 0.25 | 1 | |

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | A = 2, f = 0.5, φ = 0, run 10 s | five full periods |
| phase-shift | A = 2, f = 0.5, φ = 90°, run 10 s | starts at the crest |
| fast-small | A = 1, f = 2, φ = 0, run 4 s, 0.5× speed | shows the period halving |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| period | Period T | s | 3 |
| y | Displacement y | m | 3 |
| v | Velocity v | m/s | 3 |
| t | Time t | s | 3 |

## Assumptions shown on stage
- Ideal sinusoid, no damping
- φ measured anticlockwise from the positive x-axis

## Try this (3–5 predict, observe, explain prompts)
1. Predict: if you double the frequency, what happens to the period?
2. Observe: set φ = 90°. Where does the graph start, and where is the phasor at t = 0?
3. Explain: why does the dashed line from the phasor tip always meet the graph at the same height?

## Teacher notes outline
- Misconceptions to target: amplitude changes the period; phase moves the graph up.
- 10-minute lesson flow: predict, observe, change one thing, explain.
- Original HSC-style question idea: period and first maximum of y = 3 sin(4πt + π/6).

## Accessibility notes
The traced curve is orange and the untraced curve is light grey, so they also differ in lightness and thickness. All controls are keyboard operable. Stage label: "Sine wave with amplitude … metres and frequency … hertz, shown as a rotating phasor and a displacement–time graph."

## Engine change requests
None.

## Acceptance
Every number below comes from the formula and hand calculation shown here. The model is y = A sin(2πft + φ) and v = 2πfA cos(2πft + φ), with φ in degrees.

- **Check 1, period.** T = 1/f = 1/0.5 = **2 s**. No stepping needed.
- **Check 2, end of a 1 s run.** A = 2, f = 0.5, φ = 30°, run time 1 s. At t = 1: 2πft + φ = π + π/6 = 7π/6, and sin(7π/6) = −1/2, so y = 2 × (−1/2) = **−1 m**. The run ends at **t = 1 s**.
- **Check 3, after 240 steps.** A = 2, f = 0.5, φ = 0. Each step is 1/240 s, so 240 steps reach t = **1 s**. 2πft = π, so y = 2 sin π = **0 m** and v = 2π × 0.5 × 2 × cos π = **−2π = −6.2832 m/s**.
- **Check 4, the phase-shift preset.** A = 2, φ = 90°, at t = 0: y = 2 sin 90° = **2 m**; v = 2π × 0.5 × 2 × cos 90° = **0 m/s**.

```acceptance
[
  { "name": "period is 1/f", "params": { "frequency": 0.5 }, "run": "static",
    "expect": { "period": { "value": 2, "absTol": 1e-12 } } },
  { "name": "end of a 1 s run with φ = 30°", "params": { "amplitude": 2, "frequency": 0.5, "phase": 30, "duration": 1 }, "run": "complete",
    "expect": { "y": { "value": -1, "absTol": 1e-9 }, "t": { "value": 1, "absTol": 1e-9 } } },
  { "name": "after 240 steps", "params": { "amplitude": 2, "frequency": 0.5, "phase": 0, "duration": 10 }, "run": { "steps": 240 },
    "expect": { "t": { "value": 1, "absTol": 1e-9 }, "y": { "value": 0, "absTol": 1e-9 }, "v": { "value": -6.283185307, "relTol": 1e-9 } } },
  { "name": "phase-shift preset starts at the crest", "preset": "phase-shift", "params": {}, "run": "static",
    "expect": { "y": { "value": 2, "absTol": 1e-12 }, "v": { "value": 0, "absTol": 1e-12 } } }
]
```
