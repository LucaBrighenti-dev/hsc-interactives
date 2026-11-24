---
id: phy-bohr-spectra
title: "Bohr atom and hydrogen spectrum"
subject: phy
engine: custom
setup: none
priority: P1
status: draft           # stub → draft → approved (Gate B)
page: /interactives/physics/bohr-spectra.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Physics","version":"2017","area":"Module 8: From the Universe to the Atom","outcomes":[],"verified":false}
  - {"course":"Physics","version":"2025","focusArea":"Matter, energy and the cosmos","year":12,"outcomes":[],"verified":false}
---
# Bohr atom and hydrogen spectrum

> Backlog summary: Electron transitions mapped to spectral lines (Rydberg).

## Learning goal
Students link a jump between two Bohr energy levels of hydrogen to one spectral line: the photon carries the energy difference, so its wavelength follows from the Rydberg equation, and the lines group into series by the lower level (only the Balmer series, ending on n = 2, is visible). They also see why the Bohr model's allowed orbits fit a whole number of electron de Broglie wavelengths.

Syllabus tags: 2017 Module 8 (From the Universe to the Atom: quantum model of the atom); 2025 Year 12 focus area Matter, energy and the cosmos.

## What the student sees
Default view at 1920×1080 (light projector stage), three linked panels:

- **Left, the atom (about 40% of the stage width).** A small nucleus (labelled p⁺) with circular orbits n = 1 to 6, each labelled with its n. The electron is an orange dot on orbit n_i. When the run plays, the electron moves radially to orbit n_f over 0.6 s and a photon (a short sine-wave packet in the line's colour, or dark grey with a "UV" or "IR" tag if invisible) leaves the atom (emission) or arrives at it (absorption) over the next 1.4 s. By default orbits are drawn evenly spaced and the footer says "Orbits not to scale"; with `orbitScale` = `scaled` the radii are drawn ∝ n².
- **Centre, the energy-level diagram.** A vertical energy axis from −14 eV to 0 eV with a horizontal line per level, labelled "n = 1  −13.6 eV" and so on, plus a dashed "n = ∞  0 eV" ionisation line. Labels for n ≥ 4 sit to the right with leader lines so they never overlap. The transition is a thick orange arrow from E_i to E_f, labelled with ΔE in eV.
- **Bottom, two spectrum strips.** The upper strip is a log wavelength axis from 80 nm to 8 µm with UV, visible and IR bands labelled. The lower strip is the visible band, 380–750 nm, on a linear axis. An emission transition draws a bright line on a dark strip; an absorption transition draws a dark line on a continuous spectrum. With `showSeries` on, every other line of the same series (same lower level, upper level up to 6) appears as a thinner line labelled with its wavelength, and the series name (Lyman, Balmer, Paschen, Brackett, Pfund) is shown above the strip with its series limit as a dashed tick.

With `showDeBroglie` on, each orbit is drawn as a standing wave with exactly n wavelengths around the circumference.

## Model (custom engine)
Engine folder `site/assets/engines/custom/phy-bohr-spectra/`, `meta.name: 'phy-bohr-spectra'`, one setup `transitions` (the page may omit `setup`). It is **time-based** (the jump animation), so it has `timeScale`. Fixed step 1/240 s; `stepSize` 24 (0.1 s per Step press).

Constants carried by the engine and shown on stage:

| Symbol | Value | Source |
| --- | --- | --- |
| h | 6.626 070 15 × 10⁻³⁴ J s | SI defining constant (exact) |
| c | 299 792 458 m/s | SI defining constant (exact) |
| e | 1.602 176 634 × 10⁻¹⁹ C | SI defining constant (exact) |
| R | 1.097 × 10⁷ m⁻¹ | Rydberg constant for hydrogen as quoted on the HSC data sheet (R_H = 1.096 78 × 10⁷ m⁻¹ to 6 s.f.; R_∞ = 1.097 37 × 10⁷ m⁻¹) |
| a₀ | 5.291 772 109 03 × 10⁻¹¹ m | Bohr radius, CODATA 2018 |

Formulas (n_i = `nInitial`, n_f = `nFinal`, integers 1–6):

- Energy levels: E_n = −hcR / n². With the constants above, hcR = 2.179 131 × 10⁻¹⁸ J = **13.601 07 eV**, so E_1 = −13.60 eV. Defining E_n this way makes ΔE and λ exactly consistent (λ = hc/|ΔE|).
- Wavelength: 1/λ = R |1/n_f² − 1/n_i²|. Output in nm.
- Photon energy: E_photon = hc/λ = |E_i − E_f| (J), and E_photon / e (eV). Frequency f = c/λ.
- Energy change of the atom: ΔE = E_f − E_i (eV). Negative for emission (n_i > n_f), positive for absorption (n_i < n_f).
- Orbit radius of the initial level: r = n_i² a₀. de Broglie wavelength on that orbit: λ_dB = 2πr / n_i = 2π n_i a₀.
- Series is named by the lower level min(n_i, n_f): 1 Lyman, 2 Balmer, 3 Paschen, 4 Brackett, 5 Pfund. Series limit 1/λ = R/n_lower². Region: UV below 380 nm, visible 380–750 nm, IR above 750 nm.
- n_i = n_f: no transition. Photon outputs are `null` (readouts show "—"), the stage says "Choose two different levels", and the run is complete at t = 0.

Time evolution: t runs from 0 to 2.0 s. Electron moves radially from orbit n_i to orbit n_f for 0 ≤ t < 0.6 s (smoothstep easing), then the photon travels for 0.6 ≤ t ≤ 2.0 s. `isComplete()` is true at t = 2.0 s; the last step is clamped so t ends at exactly 2.0. Reset returns the electron to n_i. The photon outputs do not depend on t. Changing `nInitial` or `nFinal` resets the run to t = 0; the display toggles and `timeScale` apply live.

Wavelength-to-colour for visible lines: any standard piecewise approximation (380–750 nm), drawn flat with no glow. Lines outside 380–750 nm are drawn dark grey on the log strip and tagged UV or IR.

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| nInitial | Initial level n_i | | 1 | 6 | 1 | 3 | `integer: true` |
| nFinal | Final level n_f | | 1 | 6 | 1 | 2 | `integer: true`. n_f < n_i emits; n_f > n_i absorbs |
| showSeries | Show the whole series | | | | | on | boolean |
| showDeBroglie | de Broglie waves on orbits | | | | | off | boolean |
| orbitScale | Orbit spacing | | | | | spaced | enum: `spaced` (Evenly spaced), `scaled` (True scale, r ∝ n²) |
| timeScale | Playback speed | × | 0.25 | 2 | 0.25 | 1 | |

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | nInitial 3, nFinal 2, showSeries on, showDeBroglie off, orbitScale spaced | Hα, the red Balmer line at 656 nm |
| lyman-alpha | nInitial 2, nFinal 1, showSeries on | every jump to n = 1 is ultraviolet |
| absorption | nInitial 2, nFinal 3, showSeries off | the same 656 nm line, now as a dark absorption line |
| paschen | nInitial 4, nFinal 3, showSeries on | infrared series |
| de-broglie | nInitial 3, nFinal 3, showDeBroglie on, orbitScale scaled | three wavelengths fit around orbit 3; no transition |

No catalogue listing reuses this page.

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| wavelength | Wavelength λ | nm | 4 |
| frequency | Frequency f | Hz | 3 |
| photonEnergyEv | Photon energy | eV | 3 |
| photonEnergy | Photon energy | J | 3 |
| energyInitial | Initial level energy E_i | eV | 3 |
| energyFinal | Final level energy E_f | eV | 3 |
| energyChange | Atom's energy change ΔE | eV | 3 |
| orbitRadius | Orbit radius (n_i) | m | 3 |
| deBroglieWavelength | de Broglie wavelength (n_i) | m | 3 |
| t | Time t | s | 3 |

The page shows the first seven by default; the last three are in meta for the de Broglie preset and CSV.

## Assumptions shown on stage
- Bohr model of hydrogen: one electron, circular orbits, nucleus fixed
- R = 1.097 × 10⁷ m⁻¹ (HSC data sheet value); h, c, e are exact SI values
- Wavelengths in vacuum; measured lines differ by less than 0.05%
- Orbits not to scale (shown only when `orbitScale` is `spaced`)
- One photon per transition

## Try this (3–5 predict, observe, explain prompts)
1. **Predict:** an electron drops from n = 4 to n = 2, and another from n = 3 to n = 2. Which photon has the longer wavelength? Play both and check.
2. **Observe:** keep n_f = 2 and set n_i = 3, 4, 5 and 6 in turn. Watch the visible strip. What happens to the gap between neighbouring lines as n_i rises?
3. **Explain:** set n_f = 1 and try every n_i. Why does no line in this series appear in the visible strip, however big the jump?
4. **Predict, then observe:** switch from 3 → 2 to 2 → 3. What will be the same about the line, and what will look different?
5. **Explain:** turn on the de Broglie waves. Why does orbit n hold exactly n wavelengths, and what would go wrong for an orbit in between?

## Teacher notes outline
- **Misconceptions to target:** an orbiting electron radiates all the time (in Bohr's model it radiates only when it jumps); a bigger jump gives a longer wavelength (it gives a shorter one); the energy levels are equally spaced; the photon's energy depends only on the level it lands on; absorption lines come from different transitions from emission lines.
- **10-minute lesson flow:** 2 min predict prompt 1 on mini-whiteboards; 3 min play the Balmer series with the visible strip; 2 min the Lyman series and "why UV?" from the energy diagram (every gap to n = 1 is at least 10.2 eV); 2 min absorption as the reverse jump; 1 min the de Broglie preset as the bridge to quantum mechanics.
- **Original HSC-style question idea:** a line at 434 nm is seen in a hydrogen discharge tube. (a) Use the Rydberg equation to show that it comes from n = 5 → n = 2. (b) Calculate the photon energy in eV. (c) Explain why ground-state hydrogen gas does not absorb 434 nm light. Worked solution in the notes file.

## Accessibility notes
- Lines are labelled with their wavelength in text (for example "656 nm"), so colour is never the only cue; UV and IR lines are tagged in words. Emission and absorption differ by the strip background and by an "Emission" or "Absorption" label above it.
- The transition arrow's direction (down for emission, up for absorption) and its ΔE label repeat the information in the readouts.
- All controls are keyboard operable through the shell (sliders step by 1 level). No pointer-only interaction.
- Stage `aria-label` from `describe()`: "Hydrogen atom: electron moves from level 3 to level 2 and emits a photon of wavelength 656 nanometres, visible red, Balmer series." For n_i = n_f: "Hydrogen atom: electron stays in level 3; no photon."

## Engine change requests
None. This spec defines the custom engine, built in Wave 2 under `site/assets/engines/custom/phy-bohr-spectra/` with tests in `tests/engines/custom-phy-bohr-spectra.test.mjs` covering every check below.

## Acceptance
Every number below comes from the formula and hand calculation shown here. hcR = 6.626 070 15 × 10⁻³⁴ × 299 792 458 × 1.097 × 10⁷ = 2.179 131 × 10⁻¹⁸ J; dividing by e gives 13.601 07 eV. hc/e = 1239.842 eV nm.

- **Check 1, Hα (3 → 2).** 1/λ = R(1/2² − 1/3²) = R × 5/36, so λ = 36/(5 × 1.097 × 10⁷) = 6.563 355 × 10⁻⁷ m = **656.3355 nm** (the guide's 656.3 nm). f = c/λ = 299 792 458 / 6.563 355 × 10⁻⁷ = **4.567 671 × 10¹⁴ Hz**. E_photon = 13.601 07 × 5/36 = **1.889 037 eV** = 1.889 037 × 1.602 176 634 × 10⁻¹⁹ = **3.026 571 × 10⁻¹⁹ J**. ΔE = E_2 − E_3 = −3.400 267 − (−1.511 230) = **−1.889 037 eV** (emission).
- **Check 2, Lyman α (2 → 1).** λ = 4/(3R) = 4/(3.291 × 10⁷) = **121.5436 nm**. E_photon = 13.601 07 × 3/4 = **10.200 80 eV**. E_f = E_1 = **−13.601 07 eV**.
- **Check 3, absorption (1 → 3).** 1/λ = R(1 − 1/9) = 8R/9, λ = 9/(8 × 1.097 × 10⁷) = **102.5524 nm**. ΔE = E_3 − E_1 = 13.601 07 × 8/9 = **+12.089 84 eV** (positive: the atom gains energy), and the photon energy is the same **12.089 84 eV**.
- **Check 4, Paschen α (4 → 3).** 1/λ = R(1/9 − 1/16) = 7R/144, λ = 144/(7 × 1.097 × 10⁷) = **1875.244 nm**. E_i = −13.601 07/16 = **−0.850 067 eV**.
- **Check 5, orbit and de Broglie wavelength for n_i = 3.** r = 9a₀ = 9 × 5.291 772 109 × 10⁻¹¹ = **4.762 595 × 10⁻¹⁰ m**. λ_dB = 2πr/3 = 6πa₀ = **9.974 755 × 10⁻¹⁰ m**.
- **Check 6, the jump animation ends.** A full run lasts 2.0 s (480 steps of 1/240 s), so after `complete` **t = 2 s**, and the wavelength is still **656.3355 nm**.
- **Check 7, Hδ (6 → 2).** 1/λ = R(1/4 − 1/36) = 2R/9, λ = 9/(2 × 1.097 × 10⁷) = **410.2097 nm**.

Tolerances are 1 × 10⁻⁶ relative: every value is a closed form.

```acceptance
[
  { "name": "H-alpha 3 to 2", "params": { "nInitial": 3, "nFinal": 2 }, "run": "static",
    "expect": { "wavelength": { "value": 656.3354603, "relTol": 1e-6 }, "frequency": { "value": 4.567671200e14, "relTol": 1e-6 },
                "photonEnergyEv": { "value": 1.889037023, "relTol": 1e-6 }, "photonEnergy": { "value": 3.026570980e-19, "relTol": 1e-6 },
                "energyChange": { "value": -1.889037023, "relTol": 1e-6 } } },
  { "name": "Lyman alpha 2 to 1", "params": { "nInitial": 2, "nFinal": 1 }, "run": "static",
    "expect": { "wavelength": { "value": 121.5436038, "relTol": 1e-6 }, "photonEnergyEv": { "value": 10.20079993, "relTol": 1e-6 },
                "energyFinal": { "value": -13.60106657, "relTol": 1e-6 } } },
  { "name": "absorption 1 to 3", "params": { "nInitial": 1, "nFinal": 3 }, "run": "static",
    "expect": { "wavelength": { "value": 102.5524157, "relTol": 1e-6 }, "energyChange": { "value": 12.08983695, "relTol": 1e-6 },
                "photonEnergyEv": { "value": 12.08983695, "relTol": 1e-6 } } },
  { "name": "Paschen alpha 4 to 3", "params": { "nInitial": 4, "nFinal": 3 }, "run": "static",
    "expect": { "wavelength": { "value": 1875.244172, "relTol": 1e-6 }, "energyInitial": { "value": -0.8500666606, "relTol": 1e-6 } } },
  { "name": "orbit 3 radius and de Broglie wavelength", "params": { "nInitial": 3, "nFinal": 2 }, "run": "static",
    "expect": { "orbitRadius": { "value": 4.762594898e-10, "relTol": 1e-6 }, "deBroglieWavelength": { "value": 9.974755429e-10, "relTol": 1e-6 } } },
  { "name": "jump animation completes at 2 s", "params": { "nInitial": 3, "nFinal": 2 }, "run": "complete",
    "expect": { "t": { "value": 2, "absTol": 1e-9 }, "wavelength": { "value": 656.3354603, "relTol": 1e-6 } } },
  { "name": "H-delta 6 to 2", "params": { "nInitial": 6, "nFinal": 2 }, "run": "static",
    "expect": { "wavelength": { "value": 410.2096627, "relTol": 1e-6 } } }
]
```
