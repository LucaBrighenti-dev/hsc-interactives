---
id: eng-modulation-lab
title: "Modulation lab"
subject: eng
engine: wave
setup: modulation
priority: P1
status: draft            # stub → draft → approved (Gate B)
page: /interactives/engineering/modulation-lab.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Engineering Studies","version":"2011","area":"Telecommunications Engineering","outcomes":[],"verified":false}
  - {"course":"Engineering Studies","version":"2026","focusArea":"Aeronautical and aerospace engineering","year":12,"outcomes":[],"verified":false,"subtopic":"Aerospace positioning systems"}
---
# Modulation lab

> Backlog summary: AM, FM and phase modulation waveforms.

## Learning goal
Students see how a low-frequency message is carried on a high-frequency carrier by changing its amplitude (AM), its frequency (FM) or its phase (PM). They read the modulation index from the waveform, relate the side frequencies at f_c ± f_m to bandwidth, and explain why FM needs more bandwidth than AM but resists amplitude noise, and why AM spends most of its power on the carrier.

Syllabus fit: 2011 Telecommunications Engineering (analogue modulation: AM, FM, bandwidth); 2026 Aeronautical and aerospace engineering, Year 12, aerospace positioning and communication systems. Pitched at Stage 6: waveforms, modulation index, side frequencies and bandwidth as rules to apply (Carson's rule for FM); no Fourier analysis or Bessel functions asked of students.

## What the student sees
Default view at 1920×1080, light projector theme. Frequencies are scaled down to tens of hertz so every cycle is visible; a footer note says so.

- **Top strip, message:** m(t), a sine (or square) wave at f_m, labelled "message".
- **Middle strip, carrier:** the unmodulated carrier at f_c, labelled "carrier", drawn thin and grey.
- **Main strip, modulated signal:** the transmitted waveform over the chosen time window, scrolling as time runs. In AM the envelope 1 + m·m(t) is drawn as a dashed outline with its highest and lowest values marked and labelled (in units of the carrier amplitude); in FM and PM a trace below shows the instantaneous frequency swinging around f_c, labelled with its limits.
- **Right panel, spectrum** (when **Frequency spectrum** is on): vertical lines at each frequency component with their relative amplitudes, the carrier labelled f_c and the side frequencies f_c ± f_m (and f_c ± nf_m for FM and PM), with the bandwidth marked by a bracket ("B = 2 Hz").
- **Footer:** assumptions and "frequencies scaled for viewing".

Play scrolls the waveform; pause freezes it.

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| modulation | Modulation | | | | | am | enum: `am`, `fm`, `pm` |
| messageShape | Message | | | | | sine | enum: `sine` (analogue), `square` (digital) |
| carrierFrequency | Carrier frequency | Hz | 10 | 50 | 1 | 20 | |
| messageFrequency | Message frequency | Hz | 0.2 | 5 | 0.1 | 1 | |
| amIndex | Modulation index m | | 0 | 1.5 | 0.05 | 0.5 | visible for AM; above 1 is over-modulation |
| fmDeviation | Frequency deviation Δf | Hz | 0 | 10 | 0.5 | 5 | visible for FM |
| pmDeviation | Phase deviation Δφ | rad | 0 | 2 | 0.05 | 1.5 | visible for PM |
| traceWindow | Time shown | s | 0.5 | 5 | 0.5 | 2 | |
| showSpectrum | Frequency spectrum | | | | | on | boolean |
| timeScale | Playback speed | × | 0.25 | 2 | 0.25 | 1 | |

These keys, ranges and defaults match the wave engine's `meta` on `origin/w1/engine-wave` (checked 25 November 2026).

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | AM, sine, f_c = 20 Hz, f_m = 1 Hz, m = 0.5 | side frequencies at 19 and 21 Hz |
| full-am | AM, m = 1 | the envelope just touches zero; the most AM can do without distortion |
| over-modulated | AM, m = 1.3 | the envelope crosses zero: distortion |
| fm | FM, sine, f_c = 20 Hz, f_m = 1 Hz, Δf = 3 Hz | frequency swings 17–23 Hz; Carson bandwidth 8 Hz |
| pm | PM, sine, f_c = 20 Hz, f_m = 2 Hz, Δφ = 1.5 rad | compare with FM: the frequency peaks where the message rises fastest |
| data | FM, square, f_c = 20 Hz, f_m = 1 Hz, Δf = 4 Hz | frequency-shift keying: one tone for 1, another for 0 |

g is not used on this page.

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| modIndex | Modulation index (m, β = Δf/f_m, or Δφ) | | 3 |
| upperSideband | Upper side frequency f_c + f_m | Hz | 3 |
| lowerSideband | Lower side frequency f_c − f_m | Hz | 3 |
| bandwidth | Bandwidth (AM 2f_m; FM and PM by Carson's rule) | Hz | 3 |
| instantaneousFrequency | Instantaneous frequency | Hz | 3 |
| time | Time t | s | 3 |

A square message has no finite bandwidth, so `bandwidth` shows "—" for it.

## Assumptions shown on stage
- Frequencies scaled down to tens of hertz so each cycle can be seen
- Ideal modulator; no noise or channel losses
- Bandwidth: AM 2f_m; FM and PM by Carson's rule, 2(Δf_peak + f_m)
- Amplitudes shown relative to the unmodulated carrier

## Try this (3–5 predict, observe, explain prompts)
1. Predict: in AM, if the message frequency doubles, what happens to the bandwidth? Observe the side frequencies move.
2. Observe: raise the AM index from 0.5 to 1, then 1.3. What happens to the envelope, and why would a receiver distort the 1.3 signal?
3. Predict, then observe: in FM, double the deviation Δf. How does the waveform change, and what happens to the bandwidth?
4. Explain: switch between the **fm** and **pm** presets and watch the instantaneous frequency. Where in the message cycle is the frequency highest for each?
5. Observe: in the **data** preset, how many different frequencies does the signal use, and how does that carry ones and zeros?

## Teacher notes outline
- Misconceptions to target: in FM the amplitude carries the message (it is constant); the carrier holds the information in AM (it carries none; the side frequencies do); a larger AM index is always better (above 1 distorts); bandwidth depends on the carrier frequency (it depends on the message and the deviation).
- 10-minute lesson flow: (1) default AM: read the envelope's highest and lowest values and find m = (V_max − V_min)/(V_max + V_min); (2) the spectrum: carrier and two side frequencies, B = 2f_m; (3) over-modulation; (4) FM: constant amplitude, changing spacing; Carson's rule; (5) power: with a sine message, the side frequencies carry m²/(2 + m²) of the AM power (11% at m = 0.5, a third at m = 1); (6) a real-world link: aircraft VHF voice radio still uses AM, and FM broadcast radio uses wide deviation for quality.
- Original HSC-style question idea: an AM signal on an oscilloscope has V_max = 7.5 V and V_min = 2.5 V. Find the modulation index and the carrier amplitude; a 4 kHz tone modulates a 1.2 MHz carrier, so find the side frequencies and the bandwidth. Then find the Carson bandwidth of an FM broadcast with Δf = 75 kHz and audio up to 15 kHz. Worked solution: m = 5/10 = 0.5; A_c = (7.5 + 2.5)/2 = 5 V; side frequencies 1.196 MHz and 1.204 MHz; B = 8 kHz; FM B = 2(75 + 15) = 180 kHz.

## Accessibility notes
The message, carrier and modulated traces are on separate labelled strips; the envelope is dashed and its highest and lowest values are labelled in text. Spectral lines carry frequency labels; the carrier line is solid and the side frequencies dashed. The instantaneous-frequency trace is labelled with its limits. All controls are keyboard operable; Space plays and pauses. Stage label: "… modulation of a … hertz carrier by a … hertz message. Modulation index …; side frequencies at … and … hertz; bandwidth … hertz."

## Engine change requests
None needed for the acceptance checks: every param and output used exists in the wave engine's `meta` on `origin/w1/engine-wave` (checked 25 November 2026).

Optional, for a later engine version (not used below): outputs `envelopeMax` and `envelopeMin` (1 ± m, in carrier amplitudes) and `sidebandPower` (m²/(2 + m²) as a percentage, sine message) would let the AM power and oscilloscope ideas in the teacher notes appear as readouts.

## Acceptance
Every number below comes from the formula and hand calculation shown here. The engine steps time by 1/240 s, so 60 steps reach t = 0.25 s and 180 steps reach t = 0.75 s.

Formulas. AM: s(t) = [1 + m·m(t)] cos(2πf_c t); side frequencies f_c ± f_m; B = 2f_m; index m. FM: f(t) = f_c + Δf·m(t); β = Δf/f_m; Carson B = 2(Δf + f_m). PM: φ(t) = Δφ·m(t), so f(t) = f_c + Δφ·f_m cos(2πf_m t); index Δφ; B = 2(Δφ·f_m + f_m). A sine message is m(t) = sin(2πf_m t); a square message is +1 for the first half of each cycle and −1 for the second.

- **Check 1, AM default.** f_c = 20 Hz, f_m = 1 Hz, m = 0.5: side frequencies 20 − 1 = **19 Hz** and 20 + 1 = **21 Hz**; B = 2 × 1 = **2 Hz**; index **0.5**; the frequency stays at f_c = **20 Hz**.
- **Check 2, AM with a faster message.** f_c = 30 Hz, f_m = 2.5 Hz: side frequencies **27.5 Hz** and **32.5 Hz**; B = **5 Hz**.
- **Check 3, FM index and bandwidth.** f_c = 20, f_m = 1, Δf = 3: β = 3/1 = **3**; B = 2(3 + 1) = **8 Hz**.
- **Check 4, FM frequency swing.** After 60 steps, t = 0.25 s and m(t) = sin(π/2) = 1, so f = 20 + 3 = **23 Hz**. After 180 steps, t = 0.75 s and m(t) = sin(3π/2) = −1, so f = **17 Hz**.
- **Check 5, PM.** f_c = 20, f_m = 2, Δφ = 1.5 rad: index **1.5**; B = 2(1.5 × 2 + 2) = **10 Hz**. At t = 0, f = 20 + 1.5 × 2 × cos 0 = **23 Hz** (PM peaks where the message rises fastest). After 60 steps, t = 0.25 s and cos(2π × 2 × 0.25) = cos π = −1, so f = **17 Hz**.
- **Check 6, frequency-shift keying.** FM with a square message, Δf = 4 Hz, f_m = 1 Hz: after 48 steps, t = 0.2 s (first half-cycle, m = +1), f = **24 Hz**; after 168 steps, t = 0.7 s (second half, m = −1), f = **16 Hz**.

```acceptance
[
  { "name": "AM: side frequencies, bandwidth and index", "params": { "modulation": "am", "messageShape": "sine", "carrierFrequency": 20, "messageFrequency": 1, "amIndex": 0.5 }, "run": "static",
    "expect": { "lowerSideband": { "value": 19, "absTol": 1e-9 }, "upperSideband": { "value": 21, "absTol": 1e-9 }, "bandwidth": { "value": 2, "absTol": 1e-9 }, "modIndex": { "value": 0.5, "absTol": 1e-12 }, "instantaneousFrequency": { "value": 20, "absTol": 1e-9 } } },
  { "name": "AM with a 2.5 Hz message", "params": { "modulation": "am", "messageShape": "sine", "carrierFrequency": 30, "messageFrequency": 2.5, "amIndex": 0.5 }, "run": "static",
    "expect": { "lowerSideband": { "value": 27.5, "absTol": 1e-9 }, "upperSideband": { "value": 32.5, "absTol": 1e-9 }, "bandwidth": { "value": 5, "absTol": 1e-9 } } },
  { "name": "FM: β = Δf/f_m and Carson bandwidth", "params": { "modulation": "fm", "messageShape": "sine", "carrierFrequency": 20, "messageFrequency": 1, "fmDeviation": 3 }, "run": "static",
    "expect": { "modIndex": { "value": 3, "absTol": 1e-12 }, "bandwidth": { "value": 8, "absTol": 1e-9 } } },
  { "name": "FM: frequency at the message peak", "params": { "modulation": "fm", "messageShape": "sine", "carrierFrequency": 20, "messageFrequency": 1, "fmDeviation": 3 }, "run": { "steps": 60 },
    "expect": { "time": { "value": 0.25, "absTol": 1e-9 }, "instantaneousFrequency": { "value": 23, "absTol": 1e-9 } } },
  { "name": "FM: frequency at the message trough", "params": { "modulation": "fm", "messageShape": "sine", "carrierFrequency": 20, "messageFrequency": 1, "fmDeviation": 3 }, "run": { "steps": 180 },
    "expect": { "time": { "value": 0.75, "absTol": 1e-9 }, "instantaneousFrequency": { "value": 17, "absTol": 1e-9 } } },
  { "name": "PM: index, bandwidth and frequency at t = 0", "params": { "modulation": "pm", "messageShape": "sine", "carrierFrequency": 20, "messageFrequency": 2, "pmDeviation": 1.5 }, "run": "static",
    "expect": { "modIndex": { "value": 1.5, "absTol": 1e-12 }, "bandwidth": { "value": 10, "absTol": 1e-9 }, "instantaneousFrequency": { "value": 23, "absTol": 1e-9 } } },
  { "name": "PM: frequency a quarter-second later", "params": { "modulation": "pm", "messageShape": "sine", "carrierFrequency": 20, "messageFrequency": 2, "pmDeviation": 1.5 }, "run": { "steps": 60 },
    "expect": { "instantaneousFrequency": { "value": 17, "absTol": 1e-9 } } },
  { "name": "FSK: the 1 tone", "params": { "modulation": "fm", "messageShape": "square", "carrierFrequency": 20, "messageFrequency": 1, "fmDeviation": 4 }, "run": { "steps": 48 },
    "expect": { "instantaneousFrequency": { "value": 24, "absTol": 1e-9 } } },
  { "name": "FSK: the 0 tone", "params": { "modulation": "fm", "messageShape": "square", "carrierFrequency": 20, "messageFrequency": 1, "fmDeviation": 4 }, "run": { "steps": 168 },
    "expect": { "instantaneousFrequency": { "value": 16, "absTol": 1e-9 } } }
]
```
