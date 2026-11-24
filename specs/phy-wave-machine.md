---
id: phy-wave-machine
title: "Wave machine"
subject: phy
engine: wave
setup: wave-machine
priority: P1
status: draft            # stub → draft → approved (Gate B)
page: /interactives/physics/wave-machine.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Physics","version":"2017","area":"Module 3: Waves and Thermodynamics","outcomes":[],"verified":false}
  - {"course":"Physics","version":"2025","focusArea":"Waves","year":11,"outcomes":[],"verified":false}
---
# Wave machine

> Backlog summary: Transverse and longitudinal waves, superposition, standing waves on strings and in pipes.

## Learning goal
Students describe transverse and longitudinal waves as energy transfer through oscillating particles, use v = fλ and T = 1/f, apply the principle of superposition to pulses and continuous waves, and explain standing waves as the superposition of two opposite travelling waves, with harmonics fₙ = nv/2L on strings and in open pipes and only odd harmonics, fₙ = nv/4L, in pipes closed at one end.

Syllabus fit: 2017 Module 3 Waves and Thermodynamics (wave properties, the wave equation, superposition, standing waves and resonance in strings and air columns); 2025 Year 11 focus area Waves.

## What the student sees
Default view at 1920×1080, projector theme (the `wave` engine's wave-machine view):

- **Transverse:** a 12 m rope of beads (particles optional) carrying a sinusoidal wave travelling right. One bead is highlighted to show it only moves up and down while the wave moves along. λ and A are marked with dimension lines.
- **Longitudinal:** a row of particles (like a slinky) pushed back and forth along the direction of travel, showing compressions and rarefactions, with the same displacement graph drawn underneath so the two pictures can be compared.
- **Superposition:** two pulses travelling towards each other (or two continuous waves), each drawn thin and dashed, with their sum drawn thick. A negative second amplitude gives an inverted pulse, so constructive and destructive interference both appear.
- **Standing waves:** a string fixed at both ends, a pipe open at both ends, or a pipe closed at the left end, vibrating in mode n, with nodes (N) and antinodes (A) labelled. Pipes show the air's displacement envelope. The animation is slowed by the same factor for every harmonic, so higher harmonics visibly vibrate faster; the readouts give the real frequency.
- A clock shows elapsed time (real time for travelling waves; real, very short times for standing waves because they are slowed).

## Parameters
Keys and ranges are the `wave` engine's `meta.params` for `wave-machine` (branch `w1/engine-wave`).

| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| waveType | Wave | | | | | transverse | select: `transverse`, `longitudinal`, `superposition`, `standing` |
| superShape | Waves | | | | | pulses | enum: `pulses` (Two pulses), `continuous` (Two waves); superposition only |
| amplitude | Amplitude A | m | 0.05 | 1 | 0.05 | 0.4 | transverse, longitudinal, superposition (wave 1) |
| frequency | Frequency f | Hz | 0.1 | 2 | 0.05 | 0.5 | transverse and longitudinal |
| frequency1 | Wave 1 frequency f₁ | Hz | 0.1 | 2 | 0.05 | 0.5 | superposition, two waves |
| waveSpeed | Wave speed v | m/s | 0.5 | 5 | 0.1 | 2 | transverse, longitudinal, superposition |
| amplitude2 | Wave 2 amplitude A₂ | m | −1 | 1 | 0.05 | 0.4 | superposition; negative inverts wave 2 |
| frequency2 | Wave 2 frequency f₂ | Hz | 0.1 | 2 | 0.05 | 0.5 | superposition, two waves |
| direction2 | Wave 2 travels | | | | | left | enum: `left`, `right`; superposition, two waves |
| boundary | Medium | | | | | string | enum: `string` (String), `open` (Open pipe), `closed` (Closed pipe, closed at the left end); standing only |
| harmonic | Mode n | | 1 | 8 | 1 | 1 | integer; standing only; for a closed pipe mode n is the (2n − 1)th harmonic |
| mediumLength | Length L | m | 0.1 | 3 | 0.01 | 0.5 | standing only |
| standingSpeed | Wave speed v | m/s | 10 | 1500 | 1 | 340 | standing only; for a pipe, the speed of sound |
| showParticles | Show particles | | | | | on | transverse and standing |
| timeScale | Playback speed | × | 0.25 | 2 | 0.25 | 1 | |

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | transverse, A 0.4 m, f 0.5 Hz, v 2 m/s | λ = 4 m: three wavelengths on the 12 m rope |
| longitudinal | longitudinal, A 0.4 m, f 0.5 Hz, v 2 m/s | the same wave as compressions and rarefactions |
| pulses | superposition, pulses, A 0.4 m, A₂ −0.4 m, v 2 m/s | an upright and an inverted pulse cancel as they pass |
| standing-from-two | superposition, two waves, A 0.4 m, f₁ 0.5 Hz, A₂ 0.4 m, f₂ 0.5 Hz, wave 2 travels left, v 2 m/s | two opposite waves make a standing wave |
| guitar-string | standing, string, L 0.65 m, v 260 m/s, mode 1 | a guitar-like string: fundamental 200 Hz |
| closed-pipe | standing, closed, L 0.5 m, v 340 m/s, mode 1 | 170 Hz; only odd harmonics exist |
| open-pipe | standing, open, L 0.5 m, v 340 m/s, mode 1 | 340 Hz; every harmonic exists |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| waveFrequency | Frequency f | Hz | 3 |
| wavelength | Wavelength λ | m | 3 |
| period | Period T | s | 3 |
| fundamental | Fundamental f₁ | Hz | 3 |
| time | Time t | s | 3 |

Definitions (the engine's `outputs`): travelling waves and two continuous waves: f is the (wave 1) frequency, λ = v/f, T = 1/f, fundamental —. Two pulses: f, λ, T and fundamental are —. Standing waves: f = nv/2L (string, open pipe) or (2n − 1)v/4L (closed pipe), λ = 2L/n or 4L/(2n − 1), T = 1/f, fundamental = the mode-1 frequency. `time` is real time for travelling waves and pulses; for standing waves the animation runs at 0.4 Hz × harmonic number, so `time` = (animation time × 0.4 × harmonic number)/f. A run of two pulses completes when pulse 1 has passed the far end of the 12 m rope; other runs are endless.

## Assumptions shown on stage
- Ideal medium: no damping, wave speed independent of frequency
- Small amplitudes; displacement drawn exaggerated where needed
- Pipes: closed pipe closed at the left end; no end correction
- Standing waves shown in slow motion (readouts give the real frequency)

## Try this (3–5 predict, observe, explain prompts)
1. Predict: if you double the frequency on the rope, what happens to the wavelength and to the speed? Try it and check v = fλ.
2. Observe: follow the highlighted bead. Does it travel along the rope with the wave? Switch to longitudinal: which way do the particles move now?
3. Predict, then observe: in `pulses`, an upright and an inverted pulse of equal size meet. What does the rope look like at the instant they overlap exactly, and what happens afterwards?
4. Explain: in `standing-from-two`, two waves travel in opposite directions. Why do some points never move?
5. Explain: step through the modes of `closed-pipe` and `open-pipe`. Why does the closed pipe skip the even harmonics, and why is its fundamental half that of an open pipe of the same length?

## Teacher notes outline
- **Misconceptions to target:** the medium travels with the wave; a higher frequency means a faster wave; amplitude affects wave speed; waves bounce off each other when they meet (they pass through); nodes in a standing wave are places where there is no wave; a closed pipe has a node at its open end.
- **10-minute lesson flow:** (1) default: measure λ and T, check v = fλ; change f (3 min); (2) longitudinal: compressions and rarefactions (1 min); (3) `pulses`: superposition, then pass-through (2 min); (4) `standing-from-two`, then `guitar-string` modes 1–3, then the two pipes (4 min).
- **Original HSC-style question idea:** (a) A pipe 0.85 m long is closed at one end. Taking the speed of sound as 340 m/s, calculate its fundamental frequency (100 Hz) and the next resonant frequency (300 Hz), and sketch the displacement pattern for each. (b) A guitar string 0.64 m long has a fundamental of 196 Hz. Calculate the speed of waves on the string (251 m/s) and the frequency of its third harmonic (588 Hz). (Write the full question and worked solution in the notes file.)

## Accessibility notes
- Nodes and antinodes are labelled N and A in text; superposed waves are thin dashed lines with the sum thick and solid; the highlighted bead is larger and outlined as well as coloured. Wavelength and amplitude dimension lines carry text labels.
- Keyboard: every parameter is a slider with number entry, a segmented control, a select or a toggle; Space, `.` (0.1 s of animation) and R run, step and reset.
- Stage `aria-label` (the engine's `describe()`): "Transverse wave travelling right at 2 metres per second with frequency 0.5 hertz." Standing: "Standing wave on a string fixed at both ends, length 0.65 metres, harmonic 3 at 600 hertz, with nodes and antinodes labelled."

## Engine change requests
- None: every key used here exists in the `wave` engine's meta on `w1/engine-wave`.

## Acceptance
Every number below comes from the formula and hand calculation shown here, using the engine's definitions above. The animation step is 1/240 s, so 240 steps are 1 s of animation time. Values are closed forms, so tolerances are tight.

- **Check 1, default travelling wave after 240 steps.** v = 2 m/s, f = 0.5 Hz: λ = v/f = 2/0.5 = **4 m**; T = 1/f = **2 s**; f = **0.5 Hz**; after 240 steps t = 240/240 = **1 s** (real time).
- **Check 2, doubling the frequency.** f = 1 Hz, v = 2 m/s: λ = **2 m**, T = **1 s** (the speed is unchanged; λ halves).
- **Check 3, a longitudinal wave.** f = 2 Hz, v = 5 m/s: λ = 5/2 = **2.5 m**, T = **0.5 s**.
- **Check 4, two continuous waves.** Wave 1 has f₁ = 0.5 Hz and v = 2 m/s, so the readouts give λ = **4 m** and T = **2 s** (wave 1).
- **Check 5, two pulses run to the end.** Pulse 1 starts at x = 2 m on the 12 m rope and the run ends when its centre is 4σ = 1.6 m past the far end: distance 12 − 2 + 1.6 = 11.6 m at 2 m/s, so t = **5.8 s** (1392 steps).
- **Check 6, guitar string, mode 3 (`guitar-string`).** L = 0.65 m, v = 260 m/s: f₁ = 260/(2 × 0.65) = **200 Hz**; mode 3: f = 3 × 200 = **600 Hz**; λ = 2 × 0.65/3 = **0.433333 m**; T = 1/600 = **0.00166667 s**. After 240 steps (1 s of animation at 0.4 × 3 = 1.2 Hz) the real time is 1.2/600 = **0.002 s**.
- **Check 7, closed pipe, modes 1 and 2 (`closed-pipe`).** L = 0.5 m, v = 340 m/s: mode 1 (1st harmonic): f = 340/(4 × 0.5) = **170 Hz**, λ = 4 × 0.5 = **2 m**. Mode 2 is the 3rd harmonic: f = 3 × 340/(4 × 0.5) = **510 Hz**, λ = 4 × 0.5/3 = **0.666667 m**, fundamental still **170 Hz**.
- **Check 8, open pipe, mode 2 (`open-pipe`).** L = 0.5 m, v = 340 m/s: f₁ = 340/(2 × 0.5) = **340 Hz**; mode 2: f = **680 Hz**, λ = 2 × 0.5/2 = **0.5 m**.

```acceptance
[
  { "name": "default travelling wave after 1 s", "params": { "waveType": "transverse", "frequency": 0.5, "waveSpeed": 2 }, "run": { "steps": 240 },
    "expect": { "wavelength": { "value": 4, "relTol": 1e-9 }, "period": { "value": 2, "relTol": 1e-9 }, "waveFrequency": { "value": 0.5, "relTol": 1e-9 }, "time": { "value": 1, "absTol": 1e-9 } } },
  { "name": "doubling the frequency halves the wavelength", "params": { "waveType": "transverse", "frequency": 1, "waveSpeed": 2 }, "run": { "steps": 1 },
    "expect": { "wavelength": { "value": 2, "relTol": 1e-9 }, "period": { "value": 1, "relTol": 1e-9 } } },
  { "name": "longitudinal wave", "preset": "longitudinal", "params": { "waveType": "longitudinal", "frequency": 2, "waveSpeed": 5 }, "run": { "steps": 1 },
    "expect": { "wavelength": { "value": 2.5, "relTol": 1e-9 }, "period": { "value": 0.5, "relTol": 1e-9 } } },
  { "name": "two continuous waves report wave 1", "preset": "standing-from-two", "params": { "waveType": "superposition", "superShape": "continuous", "frequency1": 0.5, "waveSpeed": 2 }, "run": { "steps": 1 },
    "expect": { "wavelength": { "value": 4, "relTol": 1e-9 }, "period": { "value": 2, "relTol": 1e-9 } } },
  { "name": "two pulses run to the end", "preset": "pulses", "params": { "waveType": "superposition", "superShape": "pulses", "waveSpeed": 2 }, "run": "complete",
    "expect": { "time": { "value": 5.8, "absTol": 1e-6 } } },
  { "name": "guitar string, mode 3", "preset": "guitar-string", "params": { "waveType": "standing", "boundary": "string", "mediumLength": 0.65, "standingSpeed": 260, "harmonic": 3 }, "run": { "steps": 240 },
    "expect": { "fundamental": { "value": 200, "relTol": 1e-9 }, "waveFrequency": { "value": 600, "relTol": 1e-9 }, "wavelength": { "value": 0.433333, "relTol": 1e-6 }, "period": { "value": 0.00166667, "relTol": 1e-5 }, "time": { "value": 0.002, "relTol": 1e-9 } } },
  { "name": "closed pipe, mode 1", "preset": "closed-pipe", "params": { "waveType": "standing", "boundary": "closed", "mediumLength": 0.5, "standingSpeed": 340, "harmonic": 1 }, "run": { "steps": 1 },
    "expect": { "waveFrequency": { "value": 170, "relTol": 1e-9 }, "wavelength": { "value": 2, "relTol": 1e-9 } } },
  { "name": "closed pipe, mode 2 is the third harmonic", "preset": "closed-pipe", "params": { "waveType": "standing", "boundary": "closed", "mediumLength": 0.5, "standingSpeed": 340, "harmonic": 2 }, "run": { "steps": 1 },
    "expect": { "waveFrequency": { "value": 510, "relTol": 1e-9 }, "wavelength": { "value": 0.666667, "relTol": 1e-6 }, "fundamental": { "value": 170, "relTol": 1e-9 } } },
  { "name": "open pipe, mode 2", "preset": "open-pipe", "params": { "waveType": "standing", "boundary": "open", "mediumLength": 0.5, "standingSpeed": 340, "harmonic": 2 }, "run": { "steps": 1 },
    "expect": { "fundamental": { "value": 340, "relTol": 1e-9 }, "waveFrequency": { "value": 680, "relTol": 1e-9 }, "wavelength": { "value": 0.5, "relTol": 1e-9 } } }
]
```
