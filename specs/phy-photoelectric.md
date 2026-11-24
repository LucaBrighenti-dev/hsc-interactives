---
id: phy-photoelectric
title: "Photoelectric effect"
subject: phy
engine: custom
setup: none
priority: P1
status: draft           # stub → draft → approved (Gate B)
page: /interactives/physics/photoelectric.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Physics","version":"2017","area":"Module 7: The Nature of Light","outcomes":[],"verified":false}
  - {"course":"Physics","version":"2025","focusArea":"Nature of light","year":12,"outcomes":[],"verified":false}
---
# Photoelectric effect

> Backlog summary: Frequency, intensity, work function and stopping voltage.

## Learning goal
Students see that whether electrons are emitted depends on the light's frequency, not its intensity: each photon gives one electron energy hf, which must exceed the metal's work function φ, so KE_max = hf − φ. They measure the stopping voltage (eV_s = KE_max), see that intensity changes only the current, and read Planck's constant from the gradient and φ from the intercept of the KE_max–frequency graph, which is evidence for the particle model of light.

Syllabus tags: 2017 Module 7 (The Nature of Light: light and quantum theory); 2025 Year 12 focus area Nature of light.

## What the student sees
Default view at 1920×1080 (light projector stage):

- **Left (about 55% of the width), the apparatus.** An evacuated glass tube drawn as a flat outline. A curved metal cathode on the left (labelled with the metal and φ) and an anode plate on the right. A lamp outside the tube sends a beam onto the cathode; the beam's colour follows the wavelength (UV is drawn as a grey hatched beam labelled "UV"), and its width or hatch density shows intensity. Photoelectrons are small orange dots that leave the cathode and cross the gap. Under a retarding voltage the slower ones slow, stop and return. Below the tube: a variable DC supply with its voltage in large mono digits (sign shown: "anode −0.50 V") and a microammeter with a needle and digits.
- **Right (about 45%), one graph** chosen by `graph`:
  - **Current–voltage** (default): photocurrent (µA, 0–10) against anode voltage (V, −8 to 4). The live curve for the current settings, with a dot at the present voltage and a dashed vertical marker at −V_s labelled "V_s = … V". Previous curves can be kept as faint grey traces with the shell's reset clearing them (engine keeps the last 3 traces).
  - **KE_max–frequency**: KE_max (eV, −6 to 8) against frequency (×10¹⁴ Hz, 0 to 20). The line KE_max = hf − φ for the selected metal, extended below the axis as a dashed line to the intercept −φ; threshold f₀ marked on the axis; a dot at the present frequency (hollow when below threshold). With `compareMetals` on, every metal's line is drawn and labelled, so the parallel lines show the common gradient h.

A no-emission state says "No photoelectrons: hf < φ" in the tube, and the beam still hits the cathode.

## Model (custom engine)
Engine folder `site/assets/engines/custom/phy-photoelectric/`, `meta.name: 'phy-photoelectric'`, one setup `tube`. **Time-based and open-ended**: the electron stream animates while playing, but nothing ends, so `isComplete()` stays false and every output is a closed form of the params (independent of t). It has `timeScale`. Fixed step 1/240 s. The page's acceptance checks are all `static`.

Constants (shown on stage): h = 6.626 070 15 × 10⁻³⁴ J s, c = 299 792 458 m/s, e = 1.602 176 634 × 10⁻¹⁹ C (SI exact values); mₑ = 9.109 383 701 5 × 10⁻³¹ kg (CODATA 2018). Derived: hc/e = 1239.842 eV nm, h/e = 4.135 668 × 10⁻¹⁵ eV s.

Work functions carried by the engine (eV), the recommended polycrystalline values of H. B. Michaelson, *J. Appl. Phys.* 48, 4729 (1977), as reproduced in the CRC Handbook of Chemistry and Physics. The builder confirms each value against that table; real surfaces vary by about ±0.2 eV, and the notes say so.

| `metal` value | Label | φ (eV) |
| --- | --- | --- |
| caesium | Caesium | 2.14 |
| potassium | Potassium | 2.30 |
| sodium | Sodium | 2.75 |
| calcium | Calcium | 2.87 |
| magnesium | Magnesium | 3.66 |
| zinc | Zinc | 4.33 |
| copper | Copper | 4.65 |
| platinum | Platinum | 5.65 |
| custom | Custom | `workFunction` param |

Formulas (λ = `wavelength` in nm, V = `voltage`, anode relative to cathode):

- f = c/λ; E_photon = hf (J) and hf/e (eV).
- Threshold: f₀ = φe/h; λ₀ = hc/(φe).
- Emission happens only when hf > φ (strictly). Then KE_max = hf − φ (eV), KE_max(J) = KE_max × e, stopping voltage V_s = KE_max/e (V, numerically equal to KE_max in eV), v_max = √(2 KE_max(J) / mₑ).
- No emission (hf ≤ φ): KE_max, V_s and v_max are `null` (readouts show "—") and the current is 0.
- Saturation current: I_sat = 10.0 µA × (intensity / 100). Intensity sets the photon arrival rate; every photon above threshold has the same chance of freeing one electron.
- Teaching model for the electron energy spread: photoelectron kinetic energies are spread evenly from 0 to KE_max. So for V ≥ 0, I = I_sat (all electrons collected); for −V_s < V < 0, I = I_sat × (1 − |V|/V_s); for V ≤ −V_s, I = 0. (Real curves have a rounded knee; the stopping voltage is the same.)
- Electron animation: emission rate on screen proportional to I (builder's scale, at most 40 electrons on screen). Each electron's starting energy is u × KE_max with u from a seeded mulberry32 stream (fixed seed 1), so the animation matches the evenly spread model. With anode voltage V, an electron's kinetic energy at fraction s of the gap is u·KE_max + V·s (eV); it reaches the anode only if u·KE_max > −V, otherwise it turns round at s = u·KE_max/|V| and returns to the cathode. Drawn speed ∝ √(kinetic energy), slowed enormously for display ("electron motion slowed for display" in the footer). Every param change applies live; electrons already in flight continue under the new voltage.

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| wavelength | Wavelength λ | nm | 150 | 750 | 1 | 400 | UV to red. Frequency is a readout |
| intensity | Intensity (photon rate) | % | 0 | 100 | 5 | 50 | |
| metal | Cathode metal | | | | | caesium | enum (table above), `widget: 'select'` |
| workFunction | Work function φ | eV | 1 | 6 | 0.01 | 2.5 | `visibleWhen: { metal: 'custom' }` |
| voltage | Anode voltage V | V | −8 | 4 | 0.01 | 0 | negative = retarding |
| graph | Graph | | | | | iv | enum: `iv` (Current–voltage), `kef` (KE_max–frequency) |
| compareMetals | Show every metal | | | | | off | boolean, `visibleWhen: { graph: 'kef' }` |
| timeScale | Playback speed | × | 0.25 | 2 | 0.25 | 1 | |

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | wavelength 400, intensity 50, metal caesium, voltage 0, graph iv | electrons flow; stopping voltage is about 0.96 V |
| below-threshold | wavelength 650, intensity 100, metal zinc, voltage 0, graph iv | bright red light, no electrons |
| stopping-voltage | wavelength 400, intensity 100, metal caesium, voltage −0.90, graph iv | current nearly zero; find V_s |
| millikan | wavelength 300, intensity 50, metal sodium, voltage 0, graph kef, compareMetals on | parallel lines, gradient h |

No catalogue listing reuses this page.

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| frequency | Frequency f | Hz | 3 |
| photonEnergyEv | Photon energy hf | eV | 3 |
| workFunctionEv | Work function φ | eV | 3 |
| keMaxEv | Max kinetic energy KE_max | eV | 3 |
| stoppingVoltage | Stopping voltage V_s | V | 3 |
| current | Photocurrent I | µA | 3 |
| thresholdFrequency | Threshold frequency f₀ | Hz | 3 |
| thresholdWavelength | Threshold wavelength λ₀ | nm | 3 |
| photonEnergy | Photon energy hf | J | 3 |
| keMax | Max kinetic energy KE_max | J | 3 |
| maxSpeed | Max electron speed v_max | m/s | 3 |

The page shows the first eight; the J values and v_max are in meta for CSV and for teachers who switch them on in the page config.

## Assumptions shown on stage
- Intensity sets the number of photons per second
- One photon frees at most one electron
- Electron energies spread evenly from 0 to KE_max (teaching model)
- Typical work functions (Michaelson 1977); real surfaces vary
- h, c, e exact SI values; contact potentials ignored
- Electron motion slowed for display

## Try this (3–5 predict, observe, explain prompts)
1. **Predict:** zinc is lit by bright red light (650 nm, 100%). Will turning the intensity up make electrons come out? Try it, then try dim 250 nm light.
2. **Observe:** with caesium and 400 nm light, make the anode voltage more negative until the current just reaches zero. Record V_s. Now halve the intensity. Does V_s change?
3. **Predict, then observe:** at V = +2 V, what will doubling the intensity do to the current? What will halving the wavelength do?
4. **Explain:** open the KE_max–frequency graph and show every metal. Why are the lines parallel, what is their gradient, and what does each intercept tell you?
5. **Explain:** a wave model says brighter light carries more energy, so it should eventually free electrons at any frequency. Which two observations here contradict that?

## Teacher notes outline
- **Misconceptions to target:** brighter light gives faster electrons; any frequency works if you wait long enough or the light is bright enough; stopping voltage depends on intensity; the stopping voltage is the voltage that "stops the light"; KE_max is proportional to frequency (it is linear with a negative intercept, not proportional).
- **10-minute lesson flow:** 2 min prompt 1 (threshold) as a class vote; 3 min measure V_s for four wavelengths on caesium and record a table; 3 min switch to the KE_max–f graph, check the four points lie on the line, read the gradient as h in eV s; 2 min compare metals and link to the wave–particle argument.
- **Original HSC-style question idea:** a student measures stopping voltages of 1.46 V and 0.72 V for light of 330 nm and 410 nm on an unknown metal. (a) Calculate a value of Planck's constant from the two points. (b) Determine the work function and threshold frequency. (c) Explain, with reference to photons, why the stopping voltage does not change when the lamp is moved closer. Worked solution in the notes file.

## Accessibility notes
- The beam colour is backed up by the wavelength printed beside the lamp and a "UV" label where invisible. Emission state is stated in words ("No photoelectrons: hf < φ").
- The current is shown three ways: needle, digits and graph dot. Retarding voltage is shown by sign and by the word "retarding" beside the supply.
- The graph uses solid lines for the selected metal, dashed for extrapolation, and labelled lines for other metals, not colour alone.
- Keyboard: all controls through the shell; the voltage slider steps 0.01 V (Page Up/Down 0.1 V).
- Stage `aria-label` from `describe()`: "Photoelectric tube: 400 nanometre light on caesium. Photon energy 3.10 electronvolts, work function 2.14. Electrons emitted with up to 0.96 electronvolts; anode at 0 volts; current 5.0 microamps."

## Engine change requests
None. This spec defines the custom engine, built in Wave 2 under `site/assets/engines/custom/phy-photoelectric/` with tests in `tests/engines/custom-phy-photoelectric.test.mjs` covering every check below.

## Acceptance
Every number below comes from the formula and hand calculation shown here. hc/e = 6.626 070 15 × 10⁻³⁴ × 299 792 458 / 1.602 176 634 × 10⁻¹⁹ = 1.239 842 × 10⁻⁶ V m = 1239.842 eV nm. Most checks use `metal: custom` so they test the physics independently of the work-function table.

- **Check 1, caesium-like surface, 400 nm, V = 0, 50%.** f = 299 792 458 / 400 × 10⁻⁹ = **7.494 811 × 10¹⁴ Hz**. hf = 1239.842/400 = **3.099 605 eV**. KE_max = 3.099 605 − 2.14 = **0.959 605 eV**, so V_s = **0.959 605 V**. V ≥ 0, so I = I_sat = 10.0 × 50/100 = **5.00 µA**.
- **Check 2, retarding voltage.** Same light at 100%, V = −0.50 V: I = 10.0 × (1 − 0.50/0.959 605) = 10.0 × 0.478 952 = **4.789 523 µA**.
- **Check 3, below threshold (zinc-like, φ = 4.33 eV).** hf = 3.10 eV < 4.33 eV, so **I = 0** even at 100%. f₀ = 4.33 × 1.602 176 634 × 10⁻¹⁹ / 6.626 070 15 × 10⁻³⁴ = **1.046 989 × 10¹⁵ Hz**; λ₀ = 1239.842/4.33 = **286.3376 nm**.
- **Check 4, beyond the stopping voltage.** φ = 4.33 eV, λ = 250 nm: hf = 1239.842/250 = 4.959 368 eV, KE_max = **0.629 368 eV**. V = −1.00 V is beyond −V_s = −0.629 V, so **I = 0**.
- **Check 5, energy in joules and the fastest electron.** From check 1: KE_max = 0.959 605 × 1.602 176 634 × 10⁻¹⁹ = **1.537 457 × 10⁻¹⁹ J**; v_max = √(2 × 1.537 457 × 10⁻¹⁹ / 9.109 384 × 10⁻³¹) = √(3.375 545 × 10¹¹) = **5.809 944 × 10⁵ m/s**.
- **Check 6, the work-function table.** `metal: caesium` gives φ = **2.14 eV**, and at 400 nm KE_max = **0.959 605 eV** (same as check 1).
- **Check 7, zero intensity.** Caesium-like surface, 400 nm, intensity 0: **I = 0**, but KE_max is still **0.959 605 eV** (a single photon would still free an electron with that energy).

Tolerances: 1 × 10⁻⁶ relative for closed forms; currents that should be zero use absolute 1 × 10⁻¹².

```acceptance
[
  { "name": "400 nm on phi = 2.14 eV, V = 0, 50%", "params": { "metal": "custom", "workFunction": 2.14, "wavelength": 400, "voltage": 0, "intensity": 50 }, "run": "static",
    "expect": { "frequency": { "value": 7.49481145e14, "relTol": 1e-6 }, "photonEnergyEv": { "value": 3.099604961, "relTol": 1e-6 },
                "keMaxEv": { "value": 0.9596049608, "relTol": 1e-6 }, "stoppingVoltage": { "value": 0.9596049608, "relTol": 1e-6 },
                "current": { "value": 5, "relTol": 1e-9 } } },
  { "name": "retarding voltage -0.5 V at 100%", "params": { "metal": "custom", "workFunction": 2.14, "wavelength": 400, "voltage": -0.5, "intensity": 100 }, "run": "static",
    "expect": { "current": { "value": 4.78952256, "relTol": 1e-6 } } },
  { "name": "below threshold, phi = 4.33 eV", "params": { "metal": "custom", "workFunction": 4.33, "wavelength": 400, "voltage": 0, "intensity": 100 }, "run": "static",
    "expect": { "current": { "value": 0, "absTol": 1e-12 }, "thresholdFrequency": { "value": 1.046989342e15, "relTol": 1e-6 },
                "thresholdWavelength": { "value": 286.3376407, "relTol": 1e-6 } } },
  { "name": "beyond the stopping voltage", "params": { "metal": "custom", "workFunction": 4.33, "wavelength": 250, "voltage": -1, "intensity": 100 }, "run": "static",
    "expect": { "keMaxEv": { "value": 0.6293679373, "relTol": 1e-6 }, "current": { "value": 0, "absTol": 1e-12 } } },
  { "name": "KE in joules and max speed", "params": { "metal": "custom", "workFunction": 2.14, "wavelength": 400, "voltage": 0, "intensity": 50 }, "run": "static",
    "expect": { "keMax": { "value": 1.537456646e-19, "relTol": 1e-6 }, "maxSpeed": { "value": 580994.3903, "relTol": 1e-6 } } },
  { "name": "caesium from the table", "params": { "metal": "caesium", "wavelength": 400, "voltage": 0, "intensity": 50 }, "run": "static",
    "expect": { "workFunctionEv": { "value": 2.14, "relTol": 1e-9 }, "keMaxEv": { "value": 0.9596049608, "relTol": 1e-6 } } },
  { "name": "zero intensity, zero current", "params": { "metal": "custom", "workFunction": 2.14, "wavelength": 400, "voltage": 0, "intensity": 0 }, "run": "static",
    "expect": { "current": { "value": 0, "absTol": 1e-12 }, "keMaxEv": { "value": 0.9596049608, "relTol": 1e-6 } } }
]
```
