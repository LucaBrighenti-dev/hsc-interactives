---
id: phy-hr-diagram
title: "HR diagram explorer"
subject: phy
engine: custom
setup: none
priority: P2
status: draft           # stub → draft → approved (Gate B)
page: /interactives/physics/hr-diagram.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Physics","version":"2017","area":"Module 8: From the Universe to the Atom","outcomes":[],"verified":false}
  - {"course":"Physics","version":"2025","focusArea":"Matter, energy and the cosmos","year":12,"outcomes":[],"verified":false}
---
# HR diagram explorer

> Backlog summary: Stars by temperature and luminosity; main sequence, giants, white dwarfs.

## Learning goal
Students read a Hertzsprung–Russell diagram: surface temperature (hotter to the left) against luminosity, both on log scales. They locate the main sequence, giants, supergiants and white dwarfs, link a star's position to its size through L = 4πR²σT⁴ (so stars of the same temperature but greater luminosity must be larger), link temperature to colour and spectral class through Wien's law, and trace the Sun's schematic evolution from the main sequence to a white dwarf.

Syllabus tags: 2017 Module 8 (From the Universe to the Atom: origins of the elements, stellar spectra and the HR diagram, stellar evolution); 2025 Year 12 focus area Matter, energy and the cosmos.

## What the student sees
Default view at 1920×1080 (light projector stage):

- **Main panel (about 70% of the width), the HR diagram.** Horizontal axis: surface temperature from 40 000 K on the left to 2 000 K on the right, log scale, with ticks at 40 000, 20 000, 10 000, 5 000, 3 000 and 2 000 K. Along the top, the spectral classes O B A F G K M as labelled bands at their approximate temperature ranges. Vertical axis: luminosity in solar units, log scale from 10⁻⁵ to 10⁶, with ticks at each power of ten.
- **Stars.** Each catalogue star is a dot whose size grows with log(radius) and whose fill is a flat approximation of its colour (from temperature), with a dark outline so pale and yellow stars stay visible on the light stage. Each dot has its name beside it (labels avoid overlaps; the builder may drop labels on crowded points until hovered or selected). Stars flagged approximate carry "≈" before the name.
- **Regions** (with `showRegions`): schematic shaded bands labelled "Main sequence", "Giants", "Supergiants" and "White dwarfs".
- **Radius lines** (with `showRadiusLines`): dashed diagonal lines of constant radius at 0.001, 0.01, 0.1, 1, 10, 100 and 1000 R☉, labelled at their upper ends.
- **Schematic Sun track** (with `showTrack`): an arrowed path from the Sun's position through subgiant, red giant, horizontal branch and asymptotic giant branch stages to the white-dwarf cooling track, labelled "schematic".
- **Selected star.** The selected star (or the custom star placed by the temperature and luminosity sliders) is ringed in orange with crosshairs to both axes. A side card shows its name, spectral type, T, L, radius, peak wavelength and a small black-body curve (relative intensity against wavelength 0–2000 nm, with the visible band marked) whose peak moves with temperature.

## Model (custom engine)
Engine folder `site/assets/engines/custom/phy-hr-diagram/`, `meta.name: 'phy-hr-diagram'`, one setup `explorer`, listed in `staticSetups` (no `timeScale`). Data lives in `site/assets/engines/custom/phy-hr-diagram/data.json`; every row carries `source` and an `approx` flag.

Constants (shown on stage): T☉ = 5772 K and L☉ = 3.828 × 10²⁶ W (IAU 2015 Resolution B3 nominal values); σ = 5.670 374 419 × 10⁻⁸ W m⁻² K⁻⁴ and Wien's constant b = 2.897 771 955 × 10⁻³ m K (CODATA 2018).

Formulas for the selected or custom star (T in K, L in L☉):

- Luminosity: L = 10^`logLuminosity` for the custom star; L_W = L × 3.828 × 10²⁶ W.
- Radius in solar units, from L = 4πR²σT⁴ taken as a ratio to the Sun: R/R☉ = √L × (5772/T)².
- Radius in metres, directly from Stefan–Boltzmann: R = √(L_W / (4πσT⁴)). (For the Sun this gives 6.957 × 10⁸ m, the IAU nominal radius.)
- Peak wavelength (Wien): λ_max = b/T, output in nm.
- Constant-radius lines: log L = 2 log(R/R☉) + 4 log(T/5772).
- Spectral class from T (approximate, for labelling only): O ≥ 30 000 K; B 10 000–30 000; A 7 500–10 000; F 6 000–7 500; G 5 200–6 000; K 3 700–5 200; M below 3 700 K. The side card shows the table's spectral type for a catalogue star (so Canopus reads A9 II and Sirius B reads DA2) and this T-based class only for the custom star, labelled "class from temperature (approx.)".
- Colour for dots: a black-body colour approximation from T, drawn flat (no glow).
- Main-sequence band (schematic, for shading): centre line through (T, log L) = (3 000, −2.8), (3 800, −1.3), (5 000, −0.5), (5 772, 0), (7 500, 0.8), (10 000, 1.6), (20 000, 3.3), (30 000, 4.7), (40 000, 5.4), band ±0.5 in log L. Giants: 3 500–5 500 K, log L 1 to 3.5. Supergiants: log L above 4, all temperatures. White dwarfs: log L −4.5 to −1, 5 000–40 000 K, below the main sequence.
- Schematic Sun track (labelled "schematic, not a computed model"): (5 772, 0) → (5 000, 0.4) → (4 500, 1.5) → (3 300, 3.4) red-giant tip → (4 800, 1.7) horizontal branch → (3 200, 3.7) AGB → (40 000, 3.7) and an arrow off the left edge "planetary nebula, hotter than 40 000 K" → re-enters at (40 000, 0) → (20 000, −1.5) → (8 000, −3.5) white-dwarf cooling.

**Star data the engine must carry** (rounded literature values). The builder confirms each value against a current published reference (the primary paper for the star's effective temperature and luminosity, found through the SIMBAD bibliography, or a named catalogue) and records it in the row's `source`. A row the builder cannot source is dropped, not guessed. Values flagged ≈ are uncertain by 20–50% (distant or variable stars) and are labelled that way on stage.

| `star` value | Name | Type | T (K) | L (L☉) | ≈ |
| --- | --- | --- | --- | --- | --- |
| sun | Sun | G2 V | 5772 | 1 | no (IAU nominal) |
| proxima | Proxima Centauri | M5.5 V | 3040 | 0.0016 | |
| alphacena | α Centauri A | G2 V | 5790 | 1.5 | |
| alphacenb | α Centauri B | K1 V | 5260 | 0.50 | |
| barnard | Barnard's Star | M4 V | 3200 | 0.0035 | |
| siriusa | Sirius A | A1 V | 9900 | 25 | |
| vega | Vega | A0 V | 9600 | 40 | |
| altair | Altair | A7 V | 7700 | 11 | |
| procyona | Procyon A | F5 IV–V | 6500 | 7 | |
| regulus | Regulus | B8 IV | 12 000 | 300 | ≈ |
| spica | Spica A | B1 III–IV | 25 000 | 20 000 | ≈ |
| arcturus | Arcturus | K1.5 III | 4300 | 170 | |
| aldebaran | Aldebaran | K5 III | 3900 | 440 | |
| pollux | Pollux | K0 III | 4600 | 43 | |
| canopus | Canopus | A9 II | 7400 | 11 000 | ≈ |
| polaris | Polaris | F7 Ib | 6000 | 1300 | ≈ |
| betelgeuse | Betelgeuse | M1–2 Ia | 3600 | 100 000 | ≈ |
| antares | Antares | M1.5 Iab | 3600 | 75 000 | ≈ |
| rigel | Rigel | B8 Ia | 12 000 | 120 000 | ≈ |
| deneb | Deneb | A2 Ia | 8500 | 200 000 | ≈ |
| siriusb | Sirius B | DA2 white dwarf | 25 400 | 0.0245 | |
| eridanib | 40 Eridani B | DA white dwarf | 16 500 | 0.013 | |
| procyonb | Procyon B | white dwarf | 7700 | 0.0005 | ≈ |

Sirius B's values come from Bond et al. 2017, *ApJ* 840, 70 (T = 25 369 K and R = 0.008 098 R☉, so L = R²(T/5772)⁴ = 0.0245 L☉); its `source` field records this.

When `star` is a catalogue star, the outputs use that row's T and L; the temperature and luminosity sliders are hidden.

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| star | Star | | | | | sun | enum: `custom` (Custom star) plus every `star` value in the table, labelled by name; `widget: 'select'` |
| temperature | Surface temperature T | K | 2000 | 40000 | 1 | 5772 | `visibleWhen: { star: 'custom' }`; step 1 K so the Sun's 5772 K and the check values are reachable on the slider |
| logLuminosity | Luminosity, log₁₀(L/L☉) | | −5 | 6 | 0.01 | 0 | `visibleWhen: { star: 'custom' }` |
| showRegions | Label the regions | | | | | on | boolean |
| showRadiusLines | Lines of constant radius | | | | | off | boolean |
| showTrack | Sun's future (schematic) | | | | | off | boolean |
| showLabels | Star names | | | | | on | boolean |

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | star sun, showRegions on, showRadiusLines off, showTrack off, showLabels on | start from the Sun |
| same-temperature | star custom, temperature 3600, logLuminosity −1.5, showRadiusLines on | a red dwarf beside Betelgeuse: same colour, very different size |
| white-dwarf | star siriusb, showRadiusLines on | hot but tiny |
| sun-future | star sun, showTrack on | from main sequence to white dwarf |
| build-a-star | star custom, temperature 10000, logLuminosity 2, showRadiusLines on | students place a star and classify it |

No catalogue listing reuses this page.

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| temperature | Surface temperature T | K | 4 |
| luminosity | Luminosity L | L☉ | 3 |
| luminosityW | Luminosity L | W | 3 |
| radius | Radius R | R☉ | 3 |
| radiusM | Radius R | m | 3 |
| peakWavelength | Peak wavelength λ_max | nm | 3 |

## Assumptions shown on stage
- Stars treated as black bodies: L = 4πR²σT⁴, λ_max = b/T
- T☉ = 5772 K, L☉ = 3.828 × 10²⁶ W (IAU nominal values)
- Star values rounded from published measurements; ≈ marks uncertain values
- Regions and the Sun's track are schematic
- Spectral class boundaries are approximate

## Try this (3–5 predict, observe, explain prompts)
1. **Predict:** Betelgeuse and Proxima Centauri have similar surface temperatures. Which is larger, and by roughly what factor? Turn on the radius lines and check.
2. **Observe:** select Sirius A and Sirius B. Sirius B is hotter, yet far fainter. What must be true about its size?
3. **Explain:** using L = 4πR²σT⁴, explain why lines of constant radius slope down to the right on this diagram.
4. **Predict, then observe:** where will the Sun be when it becomes a red giant? Turn on the Sun's track.
5. **Observe, then explain:** make a custom star at 10 000 K and 100 L☉. Which region is it in, what colour is it, and where does its spectrum peak?

## Teacher notes outline
- **Misconceptions to target:** the temperature axis increases to the right (it decreases); stars move along the main sequence as they age (they stay nearly in place, then leave it); red stars are always cool and small (red supergiants are huge); white dwarfs are named for their colour, so they all have the same temperature (they range from well over 25 000 K down to a few thousand kelvin as they cool); brightness on the diagram is apparent brightness (it is luminosity, independent of distance).
- **10-minute lesson flow:** 2 min read the axes together (log scales, reversed temperature); 3 min prompts 1 and 2 with the radius lines; 2 min spectral classes and Wien's law using the side card; 3 min the Sun's track and the build-a-star preset.
- **Original HSC-style question idea:** a star has a surface temperature of 4000 K and a luminosity of 300 L☉. (a) Calculate its peak wavelength. (b) Calculate its radius in solar radii. (c) Identify its region on the HR diagram and describe the nuclear processes likely to be occurring in it. Worked solution in the notes file (λ_max = 724 nm; R = √300 × (5772/4000)² = 36.1 R☉; giant branch).

## Accessibility notes
- Dot colour is backed by dot size (radius), a text label and the spectral class letters on the top axis. The selected star is ringed and crosshaired, not only recoloured. Regions are labelled in words, and radius lines are dashed with text labels.
- Keyboard: the star menu is a standard select; arrow keys move through stars in order of temperature.
- Stage `aria-label` from `describe()`: "HR diagram. Selected: Sirius B, white dwarf, surface temperature 25 400 kelvin, luminosity 0.025 solar, radius 0.0081 solar radii (about the size of Earth), below and left of the main sequence."

## Engine change requests
None. This spec defines the custom engine, built in Wave 2 under `site/assets/engines/custom/phy-hr-diagram/` (with `data.json`) and tests in `tests/engines/custom-phy-hr-diagram.test.mjs` covering every check below.

## Acceptance
Every number below comes from the formula and hand calculation shown here. Only the Sun's catalogue row is checked (its values are defined, not measured); every other check uses the custom star so it does not depend on the star table.

- **Check 1, the Sun.** T = 5772 K, L = 1: R/R☉ = √1 × (5772/5772)² = **1**. λ_max = 2.897 771 955 × 10⁻³ / 5772 = 5.020 395 × 10⁻⁷ m = **502.0395 nm**. L_W = **3.828 × 10²⁶ W**.
- **Check 2, the Sun's radius in metres.** R = √(3.828 × 10²⁶ / (4π × 5.670 374 419 × 10⁻⁸ × 5772⁴)). 5772⁴ = 1.109 955 × 10¹⁵ K⁴, so 4πσT⁴ = 7.909 097 × 10⁸ W m⁻², and R = √(3.828 × 10²⁶ / 7.909 097 × 10⁸) = √(4.839 996 × 10¹⁷) = **6.957 008 × 10⁸ m**.
- **Check 3, same luminosity, half the temperature.** Custom T = 2886 K, log L = 0: R/R☉ = 1 × (5772/2886)² = 2² = **4**. λ_max = 2.897 771 955 × 10⁻³/2886 = **1004.079 nm**.
- **Check 4, hotter and brighter.** T = 11 544 K, log L = 2: R/R☉ = √100 × (0.5)² = 10 × 0.25 = **2.5**; λ_max = **251.0197 nm**; L = **100 L☉**.
- **Check 5, a red giant or supergiant.** T = 3000 K, log L = 4: R/R☉ = 100 × (5772/3000)² = 100 × 1.924² = 100 × 3.701 776 = **370.1776**.
- **Check 6, a white-dwarf-sized star.** T = 25 000 K, log L = −2: R/R☉ = 0.1 × (5772/25 000)² = 0.1 × 0.230 88² = 0.1 × 0.053 306 = **0.005 330 557**; λ_max = **115.9109 nm** (ultraviolet).

Tolerances: 1 × 10⁻⁶ relative (closed forms).

```acceptance
[
  { "name": "the Sun from the table", "params": { "star": "sun" }, "run": "static",
    "expect": { "temperature": { "value": 5772, "relTol": 1e-9 }, "luminosity": { "value": 1, "relTol": 1e-9 }, "radius": { "value": 1, "relTol": 1e-9 },
                "peakWavelength": { "value": 502.0394932, "relTol": 1e-6 }, "luminosityW": { "value": 3.828e26, "relTol": 1e-9 } } },
  { "name": "the Sun's radius from Stefan-Boltzmann", "params": { "star": "custom", "temperature": 5772, "logLuminosity": 0 }, "run": "static",
    "expect": { "radiusM": { "value": 695700826.6, "relTol": 1e-6 }, "radius": { "value": 1, "relTol": 1e-9 } } },
  { "name": "half the temperature, four times the radius", "params": { "star": "custom", "temperature": 2886, "logLuminosity": 0 }, "run": "static",
    "expect": { "radius": { "value": 4, "relTol": 1e-9 }, "peakWavelength": { "value": 1004.078986, "relTol": 1e-6 } } },
  { "name": "hotter and brighter", "params": { "star": "custom", "temperature": 11544, "logLuminosity": 2 }, "run": "static",
    "expect": { "radius": { "value": 2.5, "relTol": 1e-9 }, "peakWavelength": { "value": 251.0197466, "relTol": 1e-6 }, "luminosity": { "value": 100, "relTol": 1e-9 } } },
  { "name": "giant-sized star", "params": { "star": "custom", "temperature": 3000, "logLuminosity": 4 }, "run": "static",
    "expect": { "radius": { "value": 370.1776, "relTol": 1e-6 } } },
  { "name": "white-dwarf-sized star", "params": { "star": "custom", "temperature": 25000, "logLuminosity": -2 }, "run": "static",
    "expect": { "radius": { "value": 0.00533055744, "relTol": 1e-6 }, "peakWavelength": { "value": 115.9108782, "relTol": 1e-6 } } }
]
```
