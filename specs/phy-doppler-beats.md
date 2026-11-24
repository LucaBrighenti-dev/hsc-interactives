---
id: phy-doppler-beats
title: "Doppler and beats"
subject: phy
engine: wave
setup: doppler-beats
priority: P2
status: approved           # stub → draft → approved (Gate B)
page: /interactives/physics/doppler-beats.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Physics","version":"2017","area":"Module 3: Waves and Thermodynamics","outcomes":[],"verified":false}
  - {"course":"Physics","version":"2025","focusArea":"Waves","year":11,"outcomes":[],"verified":false}
---
# Doppler and beats

> Backlog summary: Moving source and observer; beats from two close frequencies; optional audio.

## Learning goal
Students see why relative motion between a sound source and an observer changes the frequency heard: a moving source bunches the wavefronts ahead of it and spreads them behind, while a moving observer meets wavefronts more or less often, giving f′ = f(v + v_o)/(v − v_s). They also see and hear that two tones of close frequency superpose to give a loudness that rises and falls at the beat frequency |f₁ − f₂|, at a pitch equal to the average frequency.

Syllabus tags: 2017 Module 3 (Waves and Thermodynamics: wave behaviour, sound waves, the Doppler effect and beats); 2025 Year 11 focus area Waves.

## What the student sees
Default view at 1920×1080 (light projector stage), `dopplerMode` = `doppler`:

- **Upper two thirds, the air seen from above.** A source (a filled circle with a speaker icon and a velocity arrow labelled "v_s = 20 m/s") moves along a horizontal line through still air, emitting circular wavefronts that expand from where the source was when each was emitted, so they crowd ahead of it and spread out behind. An observer (an ear icon in a square frame, with its own velocity arrow when it moves) sits on the same line. Every few crests are drawn (thin grey circles), with one crest highlighted in orange so its expansion can be followed. Dimension lines mark the wavelength in front of the source and behind it, labelled with their values. Motion is in slow motion (footer: "Slow motion: 0.1 s of real time per second").
- **Lower third, the heard signal.** A strip shows the pressure wave arriving at the observer against time, with the heard frequency in large mono text, and the source frequency beside it for comparison. When the source passes the observer, the heard frequency drops from the approaching value to the receding value, and the strip shows the change.

`dopplerMode` = `beats` replaces this with three stacked traces against time over a window of `beatWindow` seconds: tone 1, tone 2, and their sum, with the envelope ±2|cos(πΔf t)| drawn dashed over the sum and the beat period marked with a dimension line. The equation y₁ + y₂ = 2 cos(πΔf t) cos(π(f₁ + f₂)t) sits above.

With `playSound` on, the browser plays the heard frequency (Doppler) or both tones (beats) at a modest volume. Sound only starts from a click on the toggle and never by itself.

## Parameters
Keys follow the `wave` engine's `doppler-beats` setup as built on the in-progress branch `w1/engine-wave` (read on 25 November; not yet on `origin`). See "Engine change requests".

| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| dopplerMode | Show | | | | | doppler | enum: `doppler` (Doppler effect), `beats` (Beats) |
| sourceFrequency | Source frequency f | Hz | 100 | 1000 | 10 | 500 | `visibleWhen: { dopplerMode: 'doppler' }` |
| sourceSpeed | Source speed v_s | m/s | −150 | 150 | 1 | 20 | positive: towards the observer |
| observerSpeed | Observer speed v_o | m/s | −150 | 150 | 1 | 0 | positive: towards the source |
| soundSpeed | Speed of sound v | m/s | 250 | 1500 | 1 | 340 | always faster than the source, so no sonic boom |
| toneFrequency1 | Frequency f₁ | Hz | 100 | 1000 | 1 | 440 | `visibleWhen: { dopplerMode: 'beats' }` |
| toneFrequency2 | Frequency f₂ | Hz | 100 | 1000 | 1 | 444 | `visibleWhen: { dopplerMode: 'beats' }` |
| beatWindow | Time shown | s | 0.25 | 4 | 0.25 | 1 | `visibleWhen: { dopplerMode: 'beats' }` |
| playSound | Play sound | | | | | off | boolean; starts only from a click |
| timeScale | Playback speed | × | 0.25 | 2 | 0.25 | 1 | |

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | dopplerMode doppler, sourceFrequency 500, sourceSpeed 20, observerSpeed 0, soundSpeed 340 | a source approaching a still listener: 531 Hz, then 472 Hz after it passes |
| observer-moves | dopplerMode doppler, sourceFrequency 500, sourceSpeed 0, observerSpeed 20, soundSpeed 340 | same speed, different shift (529 Hz): the formula is not symmetric |
| ambulance | dopplerMode doppler, sourceFrequency 700, sourceSpeed 25, observerSpeed 0, soundSpeed 340 | a siren passing a pedestrian |
| beats | dopplerMode beats, toneFrequency1 440, toneFrequency2 444, beatWindow 1 | 4 beats per second |
| tuning | dopplerMode beats, toneFrequency1 440, toneFrequency2 441, beatWindow 2 | tuning an instrument: beats slow as the pitches match |

No catalogue listing reuses this page.

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| observedFrequency | Heard frequency f′ | Hz | 4 |
| frequencyShift | Shift f′ − f | Hz | 3 |
| wavelengthAhead | λ in front of the source | m | 3 |
| wavelengthBehind | λ behind the source | m | 3 |
| beatFrequency | Beat frequency | Hz | 3 |
| beatPeriod | Beat period | s | 3 |
| averageFrequency | Average frequency | Hz | 4 |
| time | Time t | s | 3 |

The Doppler outputs are `null` in beats mode and vice versa.

## Assumptions shown on stage
- Still air; source and observer move along the same straight line
- Both speeds less than the speed of sound
- f′ = f(v + v_o)/(v − v_s); v_s > 0 towards the observer, v_o > 0 towards the source
- Heard frequency uses the sound arriving now (emitted earlier)
- Beats: equal amplitudes; Doppler motion shown in slow motion

## Try this (3–5 predict, observe, explain prompts)
1. **Predict:** a 500 Hz source moves towards you at 20 m/s. Higher or lower, and by roughly how much? Play and read f′, then watch what happens as it passes.
2. **Observe:** compare the wavelength in front of the moving source with the wavelength behind it. Which one changes when the observer moves instead?
3. **Explain:** use the observer-moves preset. The relative speed is the same 20 m/s, so why is f′ (529 Hz) different from the moving-source value (531 Hz)?
4. **Predict, then observe:** two tones of 440 Hz and 444 Hz are played together. How many times per second will the loudness rise and fall? Turn on the sound to check.
5. **Explain:** in the tuning preset, why do the beats slow down as the two frequencies get closer, and what does a musician listen for?

## Teacher notes outline
- **Misconceptions to target:** the source's own frequency changes; the pitch keeps rising as the source gets closer (it is constant while approaching at steady speed, then drops as it passes); moving source and moving observer at the same speed give the same shift; the wave speed changes when the source moves; beats are a separate sound at the beat frequency (they are a loudness variation of a tone at the average frequency).
- **10-minute lesson flow:** 2 min prompt 1 predictions; 3 min default and observer-moves presets with the wavelength labels; 2 min work the formula on the board with both sign conventions; 3 min beats presets with sound on.
- **Original HSC-style question idea:** a drone emitting a steady 600 Hz tone flies straight towards a stationary student at 15 m/s, passes overhead and flies away (v = 340 m/s). (a) Calculate the frequencies heard on approach and after it passes. (b) A second, stationary speaker plays 620 Hz. Calculate the beat frequency the student hears while the drone approaches, and explain how it changes as the drone passes. Worked solution in the notes file (627.7 Hz, 574.6 Hz; beats 7.7 Hz, then 45 Hz, which is too fast to count and is heard as roughness rather than as separate beats).

## Accessibility notes
- Source and observer differ by icon and shape, not colour; velocity arrows carry text labels; the highlighted crest is thicker as well as orange.
- Every frequency is shown as a number; sound is optional and never needed to complete a prompt.
- Keyboard: all controls through the shell; the sound toggle is a standard switch.
- Stage `aria-label` from `describe()`: "Doppler effect: a 500 hertz source approaches a still observer at 20 metres per second; the observer hears 531 hertz. Wavelength 0.64 metres in front of the source and 0.72 metres behind." Beats: "Two tones of 440 and 444 hertz give 4 beats per second at an average pitch of 442 hertz."

## Engine change requests
Keys to reconcile with engine meta: every param and output key above was read from the in-progress `w1/engine-wave` branch on 25 November (its `index.js` and `model.js` in the engine-builder's worktree, not yet pushed). If the merged engine differs, the Wave 2 builder updates this spec's keys and presets to match before building. Behaviour this spec relies on, as implemented there:
- Doppler runs start with the source at x = −10 m and the observer at x = +10 m; physical time is 0.1 × animation time; the run completes when the source or observer leaves the ±25 m view.
- The heard frequency uses the emission (retarded) time, so it switches from the approaching to the receding value after the source passes.

No new features are requested.

## Acceptance
Every number below comes from the formula and hand calculation shown here: f′ = f(v + v_o)/(v − v_s), wavelengths λ_ahead = (v − |v_s|)/f and λ_behind = (v + |v_s|)/f, and f_beat = |f₁ − f₂|.

- **Check 1, source approaching (the guide's check).** f = 500 Hz, v_s = 20 m/s, v_o = 0, v = 340 m/s: f′ = 500 × 340/320 = **531.25 Hz**; shift = **+31.25 Hz**. λ_ahead = 320/500 = **0.64 m**; λ_behind = 360/500 = **0.72 m**.
- **Check 2, observer approaching.** v_s = 0, v_o = 20 m/s: f′ = 500 × 360/340 = **529.4118 Hz**.
- **Check 3, source receding.** v_s = −20 m/s: f′ = 500 × 340/360 = **472.2222 Hz**; shift = **−27.7778 Hz**.
- **Check 4, both approaching.** v_s = 20, v_o = 20: f′ = 500 × 360/320 = **562.5 Hz**.
- **Check 5, after the source passes.** Default run to completion: the source starts 20 m from the observer and passes it at t = 20/20 = 1.0 s; the run ends when the source leaves the view at x = +25 m, t = 35/20 = **1.75 s**. The sound arriving then was emitted at t_e where t_e + 20(t_e − 1)/340 = 1.75, so t_e = 30.75/18 = 1.708 s, after the pass. So the observer hears the receding value **472.2222 Hz**.
- **Check 6, beats.** f₁ = 440 Hz, f₂ = 444 Hz: f_beat = **4 Hz**; beat period = 1/4 = **0.25 s**; average = (440 + 444)/2 = **442 Hz**.
- **Check 7, beats with the higher tone first.** f₁ = 512 Hz, f₂ = 509 Hz: f_beat = |512 − 509| = **3 Hz**; period **0.333 333 s**.

Tolerances: 1 × 10⁻⁹ relative for closed forms, except check 5 at 1 × 10⁻⁶.

```acceptance
[
  { "name": "source approaching a still observer", "params": { "dopplerMode": "doppler", "sourceFrequency": 500, "sourceSpeed": 20, "observerSpeed": 0, "soundSpeed": 340 }, "run": "static",
    "expect": { "observedFrequency": { "value": 531.25, "relTol": 1e-9 }, "frequencyShift": { "value": 31.25, "relTol": 1e-9 },
                "wavelengthAhead": { "value": 0.64, "relTol": 1e-9 }, "wavelengthBehind": { "value": 0.72, "relTol": 1e-9 } } },
  { "name": "observer approaching a still source", "params": { "dopplerMode": "doppler", "sourceFrequency": 500, "sourceSpeed": 0, "observerSpeed": 20, "soundSpeed": 340 }, "run": "static",
    "expect": { "observedFrequency": { "value": 529.4117647, "relTol": 1e-9 } } },
  { "name": "source receding", "params": { "dopplerMode": "doppler", "sourceFrequency": 500, "sourceSpeed": -20, "observerSpeed": 0, "soundSpeed": 340 }, "run": "static",
    "expect": { "observedFrequency": { "value": 472.2222222, "relTol": 1e-9 }, "frequencyShift": { "value": -27.77777778, "relTol": 1e-8 } } },
  { "name": "both approaching", "params": { "dopplerMode": "doppler", "sourceFrequency": 500, "sourceSpeed": 20, "observerSpeed": 20, "soundSpeed": 340 }, "run": "static",
    "expect": { "observedFrequency": { "value": 562.5, "relTol": 1e-9 } } },
  { "name": "pitch drops after the source passes", "params": { "dopplerMode": "doppler", "sourceFrequency": 500, "sourceSpeed": 20, "observerSpeed": 0, "soundSpeed": 340 }, "run": "complete",
    "expect": { "observedFrequency": { "value": 472.2222222, "relTol": 1e-6 }, "time": { "value": 1.75, "relTol": 1e-6 } } },
  { "name": "beats 440 and 444 Hz", "params": { "dopplerMode": "beats", "toneFrequency1": 440, "toneFrequency2": 444 }, "run": "static",
    "expect": { "beatFrequency": { "value": 4, "relTol": 1e-9 }, "beatPeriod": { "value": 0.25, "relTol": 1e-9 }, "averageFrequency": { "value": 442, "relTol": 1e-9 } } },
  { "name": "beats 512 and 509 Hz", "params": { "dopplerMode": "beats", "toneFrequency1": 512, "toneFrequency2": 509 }, "run": "static",
    "expect": { "beatFrequency": { "value": 3, "relTol": 1e-9 }, "beatPeriod": { "value": 0.3333333333, "relTol": 1e-9 } } }
]
```
