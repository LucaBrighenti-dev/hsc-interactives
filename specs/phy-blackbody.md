---
id: phy-blackbody
title: "Black-body radiation"
subject: phy
engine: fnplot
setup: blackbody
priority: P1
status: draft            # stub → draft → approved (Gate B)
page: /interactives/physics/blackbody.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Physics","version":"2017","area":"Module 7: The Nature of Light","outcomes":[],"verified":false}
  - {"course":"Physics","version":"2025","focusArea":"Nature of light","year":12,"outcomes":[],"verified":false}
---
# Black-body radiation

> Backlog summary: Planck curves by temperature; Wien's displacement law.

## Learning goal
Students describe how a black body's spectrum changes with temperature: the whole curve rises and its peak moves to shorter wavelengths. They use Wien's law λ_max T = b to find a temperature from a peak wavelength (and the reverse), relate a star's colour to its temperature, and see that the classical prediction fails at short wavelengths, the problem Planck's quantum hypothesis solved.

Syllabus fit: 2017 Module 7 The Nature of Light (black-body radiation, Wien's displacement law, Planck's contribution); 2025 Year 12 focus area Nature of light. Wien's law is quantitative; the area comparison (Stefan–Boltzmann) is shown qualitatively as an extension.

## What the student sees
Default view at 1920×1080, projector theme:

- A graph of spectral intensity (relative units, one shared scale for every curve) against wavelength λ from 0 to 3000 nm, with gridlines and labelled axes `Wavelength λ (nm)` and `Spectral intensity (relative)`. The y-axis fits the tallest Planck curve shown (the classical curve, which diverges at short wavelengths, is clipped at the top of the axis).
- The visible band (380–750 nm) is shaded with a thin rainbow strip along the λ axis, labelled `visible`, and the regions either side labelled `UV` and `IR`.
- The Planck curve for T in thick orange, with its peak marked by a dot, a dashed vertical line to the axis, and the label `λ_max = 500 nm`.
- When comparing, the second curve (T₂) is drawn in blue with a dashed peak line and its own label; the area under each curve can be lightly hatched (orange diagonal for T, blue cross-hatch for T₂).
- When "Classical prediction" is on, the Rayleigh–Jeans curve 2ckT/λ⁴ is drawn as a dashed grey line that shoots up at short wavelengths, labelled `classical prediction`.
- A small "star colour" swatch in the corner: the approximate colour of a body at that temperature, labelled with T.

The setup is static: changing a slider redraws immediately; there is no play or step.

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| temperature | Temperature T | K | 1000 | 12000 | 50 | 5800 | 5800 K is close to the Sun's surface |
| compare | Compare with a second temperature | | | | | off | |
| temperature2 | Second temperature T₂ | K | 1000 | 12000 | 50 | 3000 | `visibleWhen: { compare: true }` |
| showPeak | Mark the peak (Wien's law) | | | | | on | |
| showVisible | Shade the visible band | | | | | on | |
| showClassical | Classical (Rayleigh–Jeans) prediction | | | | | off | for T only |
| wavelengthMax | Wavelength axis to | nm | 1000 | 5000 | 100 | 3000 | the axis starts at 0 |

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | T 5800 K, compare off, peak on, visible on, classical off, axis to 3000 nm | the Sun: peak near 500 nm, in the visible band |
| sun-vs-red-dwarf | T 5800 K, compare on, T₂ 3000 K | a cool red star: lower curve, peak in the infrared |
| hot-star | T 10000 K, compare on, T₂ 5800 K, axis to 2000 nm | a blue-white star peaking in the ultraviolet |
| catastrophe | T 5800 K, classical on | the classical curve diverging at short wavelengths |

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| peakWavelength | Peak wavelength λ_max | m (siPrefix) | 3 |
| peakWavelength2 | Peak wavelength at T₂ | m (siPrefix) | 3 |
| peakRatio | Peak height ratio (T : T₂) | | 3 |
| areaRatio | Area ratio (T : T₂) | | 3 |

Outputs are in SI units; "siPrefix" means the output sets `siPrefix: true`, so 5.00 × 10⁻⁷ m reads "500 nm". Definitions: `peakWavelength` = b/T in metres, with b = 2.898 × 10⁻³ m K (the peak of the Planck curve; the engine may find it numerically). `peakWavelength2`, `peakRatio` and `areaRatio` are NaN (shown as —) when compare is off. `peakRatio` = B_λ(λ_max, T)/B_λ(λ_max2, T₂). `areaRatio` = ∫B_λ(λ, T) dλ / ∫B_λ(λ, T₂) dλ, integrated over all wavelengths (numerically, well beyond the visible axis range).

## Assumptions shown on stage
- Ideal black body (perfect absorber and emitter)
- Planck's law with b = 2.898 × 10⁻³ m K for Wien's law
- Intensities relative, on one shared scale
- Star colours approximate

## Try this (3–5 predict, observe, explain prompts)
1. Predict: if the temperature rises from 5800 K to 10 000 K, which way will the peak move, and will the curve get taller or shorter? Then try it.
2. Observe: find the temperature at which the peak sits at about 725 nm, the red end of the visible band. Check your answer with λ_max T = b.
3. Explain: the Sun's peak is in the green, yet the Sun does not look green. Use the shape of the curve across the visible band to explain why.
4. Observe: compare 6000 K with 3000 K. Read the area ratio. How many times more power does each square metre of the hotter body radiate?
5. Explain: turn on the classical prediction. What does it predict at very short wavelengths, and why was this called the "ultraviolet catastrophe"?

## Teacher notes outline
- **Misconceptions to target:** hotter bodies emit only shorter wavelengths (they emit more at every wavelength); the peak wavelength is the colour we see; a black body looks black at any temperature; red stars are hot because "red means hot"; Wien's law gives the hottest wavelength rather than the most intense one.
- **10-minute lesson flow:** (1) default: read λ_max, check b/T by hand (2 min); (2) slide T and describe two changes: height and peak shift (2 min); (3) `sun-vs-red-dwarf`: compare, read the area ratio (3 min); (4) `catastrophe`: what classical physics predicted and why Planck needed quantised energy (3 min).
- **Original HSC-style question idea:** Two stars are observed. Star A's spectrum peaks at 290 nm and star B's at 870 nm. (a) Calculate the surface temperature of each star (about 1.0 × 10⁴ K and 3.3 × 10³ K). (b) Sketch both curves on one set of axes and label the peaks. (c) Explain why star A appears blue-white even though its peak is in the ultraviolet. (Write the full question and worked solution in the notes file.)

## Accessibility notes
- The two curves differ by colour and by line style: T is thick and solid, T₂ is thinner and dashed at its peak line; each peak has a text label with its λ_max. Area hatching uses different patterns (diagonal vs cross-hatch), not just colour.
- The visible band is labelled in text (`visible`, `UV`, `IR`), not only by the rainbow strip.
- Keyboard: every parameter is a slider with number entry or a toggle.
- Stage `aria-label` (from `describe()`): "Black-body spectrum at 5800 kelvin. Peak at 500 nanometres, in the visible band." With compare on: "… Second curve at 3000 kelvin peaks at 966 nanometres, in the infrared. The hotter curve is higher at every wavelength."

## Engine change requests
- **Keys to reconcile with engine meta** (the `fnplot` meta for `blackbody` was not published when this spec was written): params `temperature`, `compare`, `temperature2`, `showPeak`, `showVisible`, `showClassical`, `wavelengthMax`; outputs `peakWavelength`, `peakWavelength2`, `peakRatio`, `areaRatio`.
- The `blackbody` setup needs Planck's law, Wien's peak, the Rayleigh–Jeans curve and a numerical integral for `areaRatio` (log-spaced in λ from about 10 nm to 1 mm is ample). It is a static setup (`meta.staticSetups`).
- A `describe()` method for the stage label above.

## Acceptance
Every number below comes from the formula and hand calculation shown here. Wien's law: λ_max = b/T with b = 2.898 × 10⁻³ m K. The exact constant (from h, c and k) is 2.8978 × 10⁻³ m K, 0.008% lower, which the tolerance of 0.1% covers. Planck's law: B_λ = (2hc²/λ⁵)/(e^(hc/λkT) − 1).

- **Check 1, the Sun.** T = 5800 K: λ_max = 2.898 × 10⁻³/5800 = **4.99655 × 10⁻⁷ m** (499.7 nm).
- **Check 2, a red dwarf.** T = 3000 K: λ_max = 2.898 × 10⁻³/3000 = **9.660 × 10⁻⁷ m** (966.0 nm, infrared).
- **Check 3, a hot star.** T = 10 000 K: λ_max = 2.898 × 10⁻³/10 000 = **2.898 × 10⁻⁷ m** (289.8 nm, ultraviolet).
- **Check 4, a cool body.** T = 1000 K: λ_max = **2.898 × 10⁻⁶ m** (2898 nm), inside the default 3000 nm axis.
- **Check 5, comparing 6000 K with 3000 K.** λ_max at 6000 K = 2.898 × 10⁻³/6000 = **4.830 × 10⁻⁷ m** (483.0 nm); at 3000 K, **9.660 × 10⁻⁷ m**.
  Peak heights: at the peak, hc/(λ_max kT) is the same constant x = 4.965 for every T, so B_λ(peak) = 2hc²/(λ_max⁵(e^x − 1)) is proportional to 1/λ_max⁵, which is proportional to T⁵. Ratio = (6000/3000)⁵ = 2⁵ = **32**.
  Areas: substituting x = hc/(λkT) in ∫B_λ dλ gives a constant times T⁴ (the Stefan–Boltzmann law), so the ratio = (6000/3000)⁴ = 2⁴ = **16**. A numerical check (log-spaced midpoint rule, 1 nm to 1 mm, 200 000 points) gives 16.0000.

```acceptance
[
  { "name": "the Sun at 5800 K", "params": { "temperature": 5800, "compare": false }, "run": "static",
    "expect": { "peakWavelength": { "value": 4.99655e-7, "relTol": 0.001 } } },
  { "name": "red dwarf at 3000 K", "params": { "temperature": 3000, "compare": false }, "run": "static",
    "expect": { "peakWavelength": { "value": 9.66e-7, "relTol": 0.001 } } },
  { "name": "hot star at 10 000 K", "params": { "temperature": 10000, "compare": false }, "run": "static",
    "expect": { "peakWavelength": { "value": 2.898e-7, "relTol": 0.001 } } },
  { "name": "cool body at 1000 K", "params": { "temperature": 1000, "compare": false }, "run": "static",
    "expect": { "peakWavelength": { "value": 2.898e-6, "relTol": 0.001 } } },
  { "name": "6000 K against 3000 K", "params": { "temperature": 6000, "compare": true, "temperature2": 3000 }, "run": "static",
    "expect": { "peakWavelength": { "value": 4.83e-7, "relTol": 0.001 }, "peakWavelength2": { "value": 9.66e-7, "relTol": 0.001 }, "peakRatio": { "value": 32, "relTol": 0.001 }, "areaRatio": { "value": 16, "relTol": 0.005 } } }
]
```
