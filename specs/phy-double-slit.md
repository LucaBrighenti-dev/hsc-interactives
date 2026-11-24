---
id: phy-double-slit
title: "Double slit and diffraction grating"
subject: phy
engine: wave
setup: interference
priority: P0
status: draft            # stub → draft → approved (Gate B)
page: /interactives/physics/double-slit.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Physics","version":"2017","area":"Module 7: The Nature of Light","outcomes":[],"verified":false}
  - {"course":"Physics","version":"2025","focusArea":"Nature of light","year":12,"outcomes":[],"verified":false}
---
# Double slit and diffraction grating

> Backlog summary: Wavelength, slit spacing and screen distance sliders with a live intensity pattern.

## Learning goal
Students explain bright and dark fringes by the path difference from neighbouring slits (a whole number of wavelengths for bright, an odd number of half wavelengths for dark), use d sin θ = mλ and the small-angle fringe spacing Δy ≈ λL/d to predict a pattern, and see why a diffraction grating gives sharper, more widely spread maxima. The pattern is presented as evidence for the wave model of light.

Syllabus fit: 2017 Module 7 The Nature of Light (wave model: diffraction and interference, Young's experiment, gratings); 2025 Year 12 focus area Nature of light. Year 12 level: quantitative use of d sin θ = mλ; the single-slit envelope and the single-slit option are qualitative extensions.

## What the student sees
Default view at 1920×1080, projector theme (the `wave` engine's interference view):

- **Set-up diagram (not to scale):** the light source, the slits and the screen at distance L, with the light drawn in the wavelength's colour (grey outside 380–750 nm).
- **The screen, face on:** a dark strip (a screen in a darkened room) with the fringe pattern in the light's colour, brightness proportional to intensity.
- **Intensity graph:** relative intensity I/I₀ (0 to 1) against position on the screen y, using the exact mapping y = L tan θ. The default window is ±50 mm for slits and ±3L for a grating, so changes in λ, d and L show up as visible changes in spacing. Bright fringes are labelled with their order m; orders that fall on a zero of the single-slit envelope are marked as missing.
- **Envelope and small-angle marks (optional):** the single-slit envelope as a dashed curve, and tick marks where the small-angle formula y = mλL/d would put each fringe, so students can see where the approximation holds.
- Readouts underneath: first-order angle and position, the small-angle estimate, fringe spacing, central fringe width and (for a grating) the highest order.

Nothing animates: `interference` is a static setup, so play, step and reset are hidden.

## Parameters
Keys and ranges are the `wave` engine's `meta.params` for `interference` (branch `w1/engine-wave`).

| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| aperture | Aperture | | | | | double | enum: `single` (Single slit), `double` (Double slit), `grating` (Grating) |
| wavelength | Wavelength λ | nm | 350 | 800 | 1 | 600 | drawn in grey outside 380–750 nm |
| slitSeparation | Slit separation d | mm | 0.05 | 2 | 0.01 | 0.25 | double slit only |
| slitWidth | Slit width a | mm | 0.01 | 0.5 | 0.005 | 0.05 | single and double slit; capped at d for a double slit |
| linesPerMm | Lines per mm | lines/mm | 50 | 1200 | 10 | 600 | grating only; d = 1/(lines per mm) |
| illuminatedLines | Slits lit N | | 2 | 1000 | 1 | 100 | integer; grating only; more slits narrow each maximum without moving it |
| slitFraction | Slit width ÷ spacing a/d | | 0.05 | 0.9 | 0.05 | 0.2 | grating only; sets its envelope |
| screenDistance | Screen distance L | m | 0.2 | 5 | 0.05 | 2 | |
| screenView | Screen shown | | | | | auto | select: auto (±50 mm for slits, ±3L for a grating) or a fixed window from ±5 mm to ±10 m |
| showEnvelope | Single-slit envelope | | | | | on | double slit and grating |
| showSmallAngle | Small-angle prediction | | | | | on | ticks at y = mλL/d (or mλL/a) |

Page controls, in order: `aperture`, `wavelength`, `slitSeparation`, `slitWidth`, `linesPerMm`, `illuminatedLines`, `slitFraction`, `screenDistance`, `screenView`, `showEnvelope`, `showSmallAngle`.

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | double, λ 600 nm, d 0.25 mm, a 0.05 mm, L 2 m, screen auto | Young's experiment with 4.80 mm fringes; d/a = 5, so the m = ±5 fringes are missing |
| red-laser | double, λ 650 nm, d 0.50 mm, a 0.05 mm, L 3 m | a school laser pointer and slide: 3.90 mm fringes |
| grating | grating, λ 500 nm, 600 lines/mm, N 100, a/d 0.2, L 2 m | first order at 17.5°, three orders each side |
| sharp-grating | grating, λ 500 nm, 600 lines/mm, N 1000, a/d 0.2, L 2 m | ten times as many slits: each maximum is ten times narrower, in the same place |
| single-slit | single, λ 600 nm, a 0.05 mm, L 2 m | the diffraction pattern of one slit, for comparison |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| firstOrderAngle | First-order angle θ₁ | ° | 4 |
| firstOrderPosition | First-order position y₁ | m | 3 |
| smallAnglePosition | Small-angle estimate of y₁ | m | 3 |
| fringeSpacing | Fringe spacing Δy | m | 3 |
| centralWidth | Central bright fringe width | m | 3 |
| maxOrder | Highest order m | | 2 |

Definitions (from the engine's `interferenceOutputs`, SI units, angles in degrees). For slits and gratings: θ₁ = asin(λ/d); y₁ = L tan θ₁ (exact); small-angle estimate λL/d; fringe spacing = y₁ (exact); central width = 2L tan(asin(s₀)) with s₀ = min(λ/(Nd), λ/a), the first zero either side of the centre; highest order = the largest m with mλ < d (grating only, — otherwise). For a single slit, "first order" is the first dark fringe, asin(λ/a); fringe spacing and highest order show —.

## Assumptions shown on stage
- Monochromatic, coherent light; slits lit equally
- Screen far from the slits (L ≫ d); far-field pattern
- Positions use y = L tan θ; the ticks show the small-angle estimate
- Intensity relative to the central maximum; set-up diagram not to scale

## Try this (3–5 predict, observe, explain prompts)
1. Predict: if you halve the slit separation d, what happens to the fringe spacing? Then try it.
2. Observe: compare the first-order position y₁ with its small-angle estimate as you shrink d towards 0.05 mm. When does the small-angle formula start to be noticeably wrong?
3. Explain: in the default pattern the 5th bright fringe on each side is missing. Turn on the envelope and explain why, using d = 5a.
4. Predict, then observe: in the `grating` preset, raise the number of slits lit from 100 to 1000. Do the bright lines move, or only get narrower? Read the central width.
5. Explain: at 600 lines/mm, why are there exactly three orders each side for 500 nm light but only two for 700 nm? Which colour is deviated most, and why does a grating spread white light into a spectrum with red furthest out?

## Teacher notes outline
- **Misconceptions to target:** increasing d spreads the fringes (it squeezes them); bright fringes are images of the slits; the central fringe is bright because the slits "point" at it, rather than because the path difference is zero; red light is diffracted less than blue (in a grating red is deviated most); dark fringes mean light is destroyed rather than redistributed.
- **10-minute lesson flow:** (1) default: read Δy and check λL/d by hand; explain bright and dark with path difference (3 min); (2) change λ, d and L one at a time and say how Δy changes each time (2 min); (3) `grating`: d sin θ = mλ, count orders, change λ (3 min); (4) `sharp-grating`: why real spectrometers use gratings (2 min).
- **Original HSC-style question idea:** A student shines a 532 nm green laser through two slits 0.30 mm apart onto a wall 2.5 m away. (a) Calculate the fringe spacing (4.43 mm). (b) The slits are replaced by a grating with 500 lines per mm. Calculate the angle of the first-order maximum (15.4°) and the highest order visible (m = 3, since d/λ = 3.76). (c) Explain why the grating's maxima are much narrower than the double-slit fringes. (Write the full question and worked solution in the notes file.)

## Accessibility notes
- Fringe brightness is shown three ways: the screen's brightness, the height of the intensity graph, and the m labels on bright fringes; missing orders are marked in text. The wavelength is always printed, so colour is never the only cue (and wavelengths outside the visible range are drawn grey and labelled).
- The envelope is dashed; the pattern is solid; small-angle predictions are tick marks.
- Keyboard: every parameter is a slider with number entry, a segmented control, a select or a toggle.
- Stage `aria-label` (the engine's `describe()`): "Double slit with 600 nanometre light and a screen 2 metres away, showing the pattern on the screen and its intensity graph. The first-order maximum is at 0.138 degrees, 4.80 mm from the centre."

## Engine change requests
- None required: every key used here exists in the `wave` engine's meta on `w1/engine-wave`.
- Optional, for a later engine version: a draggable probe on the intensity graph with readouts of the path difference (in wavelengths) and I/I₀ at that point, so students can test the bright and dark conditions directly.

## Acceptance
Every number below comes from the formula and hand calculation shown here, using the engine's definitions above. All checks are static. Lengths in metres.

- **Check 1, default double slit.** λ = 600 nm, d = 0.25 mm, a = 0.05 mm, L = 2 m.
  sin θ₁ = λ/d = 600 × 10⁻⁹/0.25 × 10⁻³ = 0.0024, θ₁ = **0.137510°**.
  Small-angle estimate λL/d = 600 × 10⁻⁹ × 2/0.25 × 10⁻³ = **0.00480 m** (4.80 mm).
  Exact y₁ = L tan θ₁ = 2 × tan(0.137510°) = **0.00480001 m**, which is also the fringe spacing.
  Central width: s₀ = min(λ/(2d), λ/a) = min(0.0012, 0.012) = 0.0012, so 2 × 2 × tan(asin 0.0012) = **0.00480000 m** (the central bright fringe spans from the first dark fringe on one side to the first on the other, one fringe spacing).
- **Check 2, shorter wavelength.** λ = 450 nm: λL/d = 450 × 10⁻⁹ × 2/0.25 × 10⁻³ = **0.00360 m**; exact y₁ = 2 tan(asin 0.0018) = **0.00360001 m**.
- **Check 3, `red-laser`.** λ = 650 nm, d = 0.50 mm, L = 3 m: λL/d = 650 × 10⁻⁹ × 3/0.50 × 10⁻³ = **0.00390 m**; θ₁ = asin(0.0013) = **0.0744845°**.
- **Check 4, `grating` (600 lines/mm, 500 nm, N = 100).** d = 1/600 mm = 1.66667 × 10⁻⁶ m. sin θ₁ = 500 × 10⁻⁹/1.66667 × 10⁻⁶ = 0.3, θ₁ = asin 0.3 = **17.4576°**. y₁ = 2 × tan 17.4576° = 2 × 0.314485 = **0.628971 m** (the small-angle estimate would say 0.600 m: 5% out). d/λ = 3.33, so the highest order is **3**. Central width: s₀ = λ/(Nd) = 500 × 10⁻⁹/(100 × 1.66667 × 10⁻⁶) = 0.003, so 2 × 2 × tan(asin 0.003) = **0.0120001 m** (the envelope zero, λ/a = λ/(0.2d) = 1.5, does not exist).
- **Check 5, `sharp-grating` (N = 1000).** s₀ = 0.0003, central width = 4 tan(asin 0.0003) = **0.00120000 m**: ten times narrower, with θ₁ unchanged at **17.4576°**.
- **Check 6, grating at 700 nm.** sin θ₁ = 700 × 10⁻⁹ × 600 000 = 0.42, θ₁ = **24.8346°**; d/λ = 2.38, highest order **2**.
- **Check 7, `single-slit`.** a = 0.05 mm, λ = 600 nm, L = 2 m: first dark fringe at sin θ = λ/a = 0.012, θ = **0.687566°**, y = 2 tan(0.687566°) = **0.0240017 m**; central width = 2 × 0.0240017 = **0.0480035 m**, ten times the double-slit fringe spacing because a = d/5 and the central maximum spans two first minima.

```acceptance
[
  { "name": "default double slit", "params": { "aperture": "double", "wavelength": 600, "slitSeparation": 0.25, "slitWidth": 0.05, "screenDistance": 2 }, "run": "static",
    "expect": { "firstOrderAngle": { "value": 0.137510, "relTol": 1e-5 }, "smallAnglePosition": { "value": 0.0048, "relTol": 1e-9 }, "firstOrderPosition": { "value": 0.00480001, "relTol": 1e-5 }, "fringeSpacing": { "value": 0.00480001, "relTol": 1e-5 }, "centralWidth": { "value": 0.00480000, "relTol": 1e-5 } } },
  { "name": "450 nm narrows the fringes", "params": { "aperture": "double", "wavelength": 450, "slitSeparation": 0.25, "slitWidth": 0.05, "screenDistance": 2 }, "run": "static",
    "expect": { "smallAnglePosition": { "value": 0.0036, "relTol": 1e-9 }, "fringeSpacing": { "value": 0.00360001, "relTol": 1e-5 } } },
  { "name": "red-laser preset", "preset": "red-laser", "params": { "aperture": "double", "wavelength": 650, "slitSeparation": 0.5, "slitWidth": 0.05, "screenDistance": 3 }, "run": "static",
    "expect": { "smallAnglePosition": { "value": 0.0039, "relTol": 1e-9 }, "firstOrderAngle": { "value": 0.0744845, "relTol": 1e-5 } } },
  { "name": "grating 600 lines/mm at 500 nm", "preset": "grating", "params": { "aperture": "grating", "wavelength": 500, "linesPerMm": 600, "illuminatedLines": 100, "slitFraction": 0.2, "screenDistance": 2 }, "run": "static",
    "expect": { "firstOrderAngle": { "value": 17.4576, "absTol": 0.001 }, "firstOrderPosition": { "value": 0.628971, "relTol": 1e-5 }, "maxOrder": { "value": 3, "absTol": 1e-9 }, "centralWidth": { "value": 0.0120001, "relTol": 1e-5 } } },
  { "name": "1000 slits: same angle, narrower maximum", "preset": "sharp-grating", "params": { "aperture": "grating", "wavelength": 500, "linesPerMm": 600, "illuminatedLines": 1000, "slitFraction": 0.2, "screenDistance": 2 }, "run": "static",
    "expect": { "firstOrderAngle": { "value": 17.4576, "absTol": 0.001 }, "centralWidth": { "value": 0.00120000, "relTol": 1e-5 } } },
  { "name": "grating at 700 nm", "params": { "aperture": "grating", "wavelength": 700, "linesPerMm": 600, "screenDistance": 2 }, "run": "static",
    "expect": { "firstOrderAngle": { "value": 24.8346, "absTol": 0.001 }, "maxOrder": { "value": 2, "absTol": 1e-9 } } },
  { "name": "single slit", "preset": "single-slit", "params": { "aperture": "single", "wavelength": 600, "slitWidth": 0.05, "screenDistance": 2 }, "run": "static",
    "expect": { "firstOrderAngle": { "value": 0.687566, "relTol": 1e-5 }, "firstOrderPosition": { "value": 0.0240017, "relTol": 1e-5 }, "centralWidth": { "value": 0.0480035, "relTol": 1e-5 } } }
]
```
