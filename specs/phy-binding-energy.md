---
id: phy-binding-energy
title: "Binding energy curve"
subject: phy
engine: custom
setup: none
priority: P2
status: draft           # stub → draft → approved (Gate B)
page: /interactives/physics/binding-energy.html
syllabus:            # copied from the catalog fragment; verified by W1-SYL
  - {"course":"Physics","version":"2017","area":"Module 8: From the Universe to the Atom","outcomes":[],"verified":false}
  - {"course":"Physics","version":"2025","focusArea":"Matter, energy and the cosmos","year":12,"outcomes":[],"verified":false}
---
# Binding energy curve

> Backlog summary: Binding energy per nucleon with fission and fusion regions.

## Learning goal
Students calculate a nucleus's mass defect and binding energy (E = Δmc², with 1 u = 931.5 MeV/c²), plot binding energy per nucleon against mass number, and use the curve to explain why fusing light nuclei and splitting heavy nuclei both release energy: the products sit higher on the curve, and the gain in total binding energy appears as the reaction's Q value.

Syllabus tags: 2017 Module 8 (From the Universe to the Atom: properties of the nucleus, mass defect, fission and fusion); 2025 Year 12 focus area Matter, energy and the cosmos.

## What the student sees
Default view at 1920×1080 (light projector stage):

- **Main panel (about 65% of the width), the curve.** Binding energy per nucleon (MeV, 0 to 9.5) against mass number A (0 to 250, or log scale with `massAxis` = `log`). Each nuclide in the data table is a dot labelled with its symbol (for example ⁵⁶Fe); radioactive fission products are hollow dots. A thin line joins the stable nuclides in order of A as a guide to the eye. The peak region (A ≈ 56–62) is marked with a bracket labelled "most tightly bound". With `showRegions` on, the region left of the peak is lightly hatched and labelled "Fusion releases energy" with an arrow pointing up the curve to the right, and the region right of the peak is hatched the other way and labelled "Fission releases energy" with an arrow pointing up the curve to the left.
- **Selected nuclide.** The chosen nuclide's dot is enlarged and outlined in orange, with a leader to a card showing Z, N, A and BE/A.
- **Right panel, the working** (with `showWorking`): the mass-defect calculation set out line by line with the table values: Z × m(¹H) + N × m_n − M(atom) = Δm (u); Δm × 931.494 = BE (MeV); BE / A = BE per nucleon. The constants are listed under it.
- **Reaction overlay** (when `reaction` is not `none`): reactant dots and product dots are ringed and joined by arrows on the curve, and an equation strip under the plot shows the reaction, the mass before and after (u), Δm and Q (MeV), and the same Q from binding energies, BE(products) − BE(reactants).

## Model (custom engine)
Engine folder `site/assets/engines/custom/phy-binding-energy/`, `meta.name: 'phy-binding-energy'`, one setup `curve`, listed in `staticSetups` (nothing evolves, so no `timeScale`; Play, Step and Reset are hidden). Data lives in `site/assets/engines/custom/phy-binding-energy/data.json`; every row carries `source`.

Constants (shown on stage): 1 u = 931.494 102 42 MeV/c² = 1.660 539 066 60 × 10⁻²⁷ kg (CODATA 2018); 1 MeV = 1.602 176 634 × 10⁻¹³ J.

**Data the engine must carry.** Neutral-atom masses from the AME2020 atomic mass evaluation (M. Wang, W. J. Huang, F. G. Kondev, G. Audi and S. Naimi, *Chinese Physics C* 45, 030003, 2021), **rounded to 6 decimal places (1 µu)**. The engine uses these rounded values exactly, so the acceptance numbers below are reproducible. The builder confirms each value against the AME2020 table and records the source per row. (A 1 µu change moves BE/A by at most 0.000 02 MeV, far below the displayed precision; if a value is corrected, update this table and the affected checks together.)

| `nuclide` value | Nuclide | Z | N | A | Atomic mass (u) | Stable? |
| --- | --- | --- | --- | --- | --- | --- |
| h1 | ¹H | 1 | 0 | 1 | 1.007825 | yes |
| h2 | ²H | 1 | 1 | 2 | 2.014102 | yes |
| h3 | ³H | 1 | 2 | 3 | 3.016049 | no |
| he3 | ³He | 2 | 1 | 3 | 3.016029 | yes |
| he4 | ⁴He | 2 | 2 | 4 | 4.002603 | yes |
| li6 | ⁶Li | 3 | 3 | 6 | 6.015123 | yes |
| li7 | ⁷Li | 3 | 4 | 7 | 7.016003 | yes |
| be9 | ⁹Be | 4 | 5 | 9 | 9.012183 | yes |
| c12 | ¹²C | 6 | 6 | 12 | 12.000000 | yes |
| n14 | ¹⁴N | 7 | 7 | 14 | 14.003074 | yes |
| o16 | ¹⁶O | 8 | 8 | 16 | 15.994915 | yes |
| ne20 | ²⁰Ne | 10 | 10 | 20 | 19.992440 | yes |
| mg24 | ²⁴Mg | 12 | 12 | 24 | 23.985042 | yes |
| si28 | ²⁸Si | 14 | 14 | 28 | 27.976927 | yes |
| s32 | ³²S | 16 | 16 | 32 | 31.972071 | yes |
| ca40 | ⁴⁰Ca | 20 | 20 | 40 | 39.962591 | yes |
| fe56 | ⁵⁶Fe | 26 | 30 | 56 | 55.934936 | yes |
| ni62 | ⁶²Ni | 28 | 34 | 62 | 61.928345 | yes |
| zr90 | ⁹⁰Zr | 40 | 50 | 90 | 89.904698 | yes |
| kr92 | ⁹²Kr | 36 | 56 | 92 | 91.926173 | no (fission product) |
| sn120 | ¹²⁰Sn | 50 | 70 | 120 | 119.902202 | yes |
| ba138 | ¹³⁸Ba | 56 | 82 | 138 | 137.905247 | yes |
| ba141 | ¹⁴¹Ba | 56 | 85 | 141 | 140.914403 | no (fission product) |
| au197 | ¹⁹⁷Au | 79 | 118 | 197 | 196.966570 | yes |
| pb208 | ²⁰⁸Pb | 82 | 126 | 208 | 207.976652 | yes |
| u235 | ²³⁵U | 92 | 143 | 235 | 235.043930 | no (very long-lived) |
| u238 | ²³⁸U | 92 | 146 | 238 | 238.050788 | no (very long-lived) |

Particle mass also needed: neutron m_n = 1.008665 u (AME2020, rounded the same way).

Formulas:

- Mass defect with atomic masses: Δm = Z × M(¹H) + N × m_n − M(atom), where M(¹H) = 1.007825 u. The electrons' masses cancel; their binding energies (eV to keV) are ignored.
- Binding energy: BE = Δm × 931.494 102 42 MeV; also in joules (× 1.602 176 634 × 10⁻¹³) and Δm in kg (× 1.660 539 066 60 × 10⁻²⁷).
- Binding energy per nucleon: BE/A. For ¹H, Δm = 0 and BE = 0.
- Reaction Q value: Q = (Σ M(reactants) − Σ M(products)) × 931.494 MeV, using atomic masses (electron counts balance in each reaction below). Equivalently Q = Σ BE(products) − Σ BE(reactants); the stage shows both.

Reactions (`reaction` param):

| Value | Reaction |
| --- | --- |
| none | no overlay |
| dt-fusion | ²H + ³H → ⁴He + n |
| dd-fusion | ²H + ²H → ³He + n |
| u235-fission | n + ²³⁵U → ¹⁴¹Ba + ⁹²Kr + 3n |

## Parameters
| Key | Label | Unit | Min | Max | Step | Default | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| nuclide | Nuclide | | | | | fe56 | enum, values from the table, labels such as "Iron-56 (⁵⁶Fe)"; `widget: 'select'` |
| reaction | Reaction | | | | | none | enum: `none` (None), `dt-fusion` (D–T fusion), `dd-fusion` (D–D fusion), `u235-fission` (U-235 fission); `widget: 'select'` |
| showRegions | Fusion and fission regions | | | | | on | boolean |
| showWorking | Show the working | | | | | on | boolean |
| massAxis | Mass number axis | | | | | linear | enum: `linear` (Linear), `log` (Log) |

## Presets
| Name | Values | Why |
| --- | --- | --- |
| default | nuclide fe56, reaction none, showRegions on, showWorking on, massAxis linear | the curve and the famous peak region |
| helium | nuclide he4, showWorking on | ⁴He sits well above its neighbours |
| fusion | nuclide he4, reaction dt-fusion, massAxis log | D–T fusion climbs the steep left side |
| fission | nuclide u235, reaction u235-fission | fission climbs from the right |
| peak | nuclide ni62, showWorking on | ⁶²Ni, not ⁵⁶Fe, has the highest BE/A |

No catalogue listing reuses this page.

## Readouts
| Output | Label | Unit | Sig figs |
| --- | --- | --- | --- |
| massNumber | Mass number A | | 3 |
| protonNumber | Protons Z | | 3 |
| neutronNumber | Neutrons N | | 3 |
| atomicMass | Atomic mass | u | 8 |
| massDefect | Mass defect Δm | u | 5 |
| massDefectKg | Mass defect Δm | kg | 4 |
| bindingEnergy | Binding energy | MeV | 5 |
| bindingEnergyJ | Binding energy | J | 4 |
| bePerNucleon | Binding energy per nucleon | MeV | 4 |
| qValue | Energy released Q | MeV | 4 |

`qValue` is `null` ("—") when `reaction` is `none`.

## Assumptions shown on stage
- Atomic masses from AME2020, rounded to 1 µu
- 1 u = 931.494 MeV/c² = 1.661 × 10⁻²⁷ kg
- Atomic masses used: electron masses cancel; electron binding energies ignored
- Reactants assumed at rest; Q is the total energy released
- The line joining the dots is a guide to the eye, not a model

## Try this (3–5 predict, observe, explain prompts)
1. **Predict:** which nucleus do you think is the most tightly bound per nucleon? Choose it, then compare ⁵⁶Fe and ⁶²Ni.
2. **Observe:** step through ¹H, ²H, ³He, ⁴He and ⁶Li. Which one breaks the smooth rise, and by how much?
3. **Explain:** turn on D–T fusion. The total number of nucleons does not change, so where does the 17.6 MeV come from? Use the curve.
4. **Predict, then observe:** would fusing two ⁵⁶Fe nuclei release energy? Use the curve to decide, then explain why stars cannot make energy by fusing beyond iron.
5. **Explain:** turn on U-235 fission. The products have a higher BE/A but a smaller total mass. Explain how both facts describe the same energy release.

## Teacher notes outline
- **Misconceptions to target:** binding energy is energy stored in the nucleus that comes out when it is formed in a reaction (it is the energy needed to pull it apart); a higher BE/A means a heavier or less stable nucleus (it means more tightly bound); mass is destroyed and turned into energy (the system's rest mass falls by Q/c², and that energy is carried away as kinetic energy of the products and as radiation); ⁵⁶Fe is the peak (⁶²Ni is slightly higher; ⁵⁶Fe has the lowest mass per nucleon, which is why it is often quoted); fission and fusion release energy for different reasons (both move towards the peak).
- **10-minute lesson flow:** 2 min prompt 1 vote; 3 min work through ⁴He's mass defect with the working panel, then students do ⁵⁶Fe by hand and check; 2 min shape of the curve and the peak; 3 min fusion and fission presets, computing Q both ways.
- **Original HSC-style question idea:** using given atomic masses, (a) calculate the binding energy per nucleon of ⁷Li, (b) calculate the energy released when a proton fuses with ⁷Li to make two ⁴He nuclei, and (c) use the binding energy per nucleon curve to explain why this reaction releases energy. Worked solution in the notes file (p + ⁷Li → 2 ⁴He: Q = (1.007825 + 7.016003 − 2 × 4.002603) × 931.494 = 17.35 MeV).

## Accessibility notes
- Stable and radioactive nuclides differ by filled and hollow dots; fusion and fission regions differ by hatch direction and are labelled in words; the selected nuclide is enlarged and outlined, not only recoloured.
- Every dot has a text label; the working panel is real text, so screen readers can read it.
- Keyboard: the nuclide and reaction menus are standard selects; arrow keys step through nuclides in order of A.
- Stage `aria-label` from `describe()`: "Binding energy per nucleon against mass number for 27 nuclides. Selected: iron-56, 26 protons and 30 neutrons, binding energy 492.3 MeV, 8.790 MeV per nucleon, near the peak of the curve."

## Engine change requests
None. This spec defines the custom engine, built in Wave 2 under `site/assets/engines/custom/phy-binding-energy/` (with `data.json`) and tests in `tests/engines/custom-phy-binding-energy.test.mjs` covering every check below.

## Acceptance
Every number below comes from the formula and hand calculation shown here, using the table above. Z × M(¹H) + N × m_n uses M(¹H) = 1.007825 u and m_n = 1.008665 u; 1 u = 931.494 102 MeV.

- **Check 1, ⁴He.** Δm = 2(1.007825) + 2(1.008665) − 4.002603 = 2.015650 + 2.017330 − 4.002603 = **0.030377 u**. BE = 0.030377 × 931.494 102 = **28.295 996 MeV**; BE/A = 28.295 996/4 = **7.073 999 MeV**. In kg: 0.030377 × 1.660 539 067 × 10⁻²⁷ = **5.044 220 × 10⁻²⁹ kg**; in J: 28.295 996 × 1.602 176 634 × 10⁻¹³ = **4.533 518 × 10⁻¹² J**.
- **Check 2, ⁵⁶Fe.** Δm = 26(1.007825) + 30(1.008665) − 55.934936 = 26.203450 + 30.259950 − 55.934936 = **0.528464 u**; BE = **492.261 10 MeV**; BE/A = 492.261 10/56 = **8.790 377 MeV**.
- **Check 3, ⁶²Ni is the peak.** Δm = 28(1.007825) + 34(1.008665) − 61.928345 = 28.219100 + 34.294610 − 61.928345 = **0.585365 u**; BE = **545.264 05 MeV**; BE/A = 545.264 05/62 = **8.794 581 MeV** (greater than ⁵⁶Fe's 8.790 377).
- **Check 4, ²³⁵U.** Δm = 92(1.007825) + 143(1.008665) − 235.043930 = 92.719900 + 144.239095 − 235.043930 = **1.915065 u**; BE = **1783.8718 MeV**; BE/A = **7.590 944 MeV**. Z = 92, N = 143, A = 235.
- **Check 5, ¹H.** Δm = 1.007825 − 1.007825 = **0**, so BE = **0**.
- **Check 6, D–T fusion.** Before: 2.014102 + 3.016049 = 5.030151 u. After: 4.002603 + 1.008665 = 5.011268 u. Δm = **0.018883 u**; Q = 0.018883 × 931.494 102 = **17.589 403 MeV**.
- **Check 7, D–D fusion (neutron branch).** Before: 2 × 2.014102 = 4.028204 u. After: 3.016029 + 1.008665 = 4.024694 u. Δm = 0.003510 u; Q = **3.269 544 MeV**.
- **Check 8, U-235 fission.** Before: 1.008665 + 235.043930 = 236.052595 u. After: 140.914403 + 91.926173 + 3(1.008665) = 235.866571 u. Δm = 0.186024 u; Q = 0.186024 × 931.494 102 = **173.280 26 MeV**.

Tolerances: 1 × 10⁻⁶ relative (the engine uses the table values exactly), except the fission Q at 1 × 10⁻⁵ because it is a small difference of large numbers.

```acceptance
[
  { "name": "helium-4 mass defect and binding energy", "params": { "nuclide": "he4", "reaction": "none" }, "run": "static",
    "expect": { "massDefect": { "value": 0.030377, "relTol": 1e-6 }, "bindingEnergy": { "value": 28.29599635, "relTol": 1e-6 },
                "bePerNucleon": { "value": 7.073999087, "relTol": 1e-6 }, "massDefectKg": { "value": 5.044219523e-29, "relTol": 1e-6 },
                "bindingEnergyJ": { "value": 4.533518419e-12, "relTol": 1e-6 } } },
  { "name": "iron-56", "params": { "nuclide": "fe56", "reaction": "none" }, "run": "static",
    "expect": { "massDefect": { "value": 0.528464, "relTol": 1e-6 }, "bindingEnergy": { "value": 492.2610993, "relTol": 1e-6 },
                "bePerNucleon": { "value": 8.790376774, "relTol": 1e-6 } } },
  { "name": "nickel-62 is the peak", "params": { "nuclide": "ni62", "reaction": "none" }, "run": "static",
    "expect": { "bePerNucleon": { "value": 8.794581375, "relTol": 1e-6 }, "bindingEnergy": { "value": 545.2640453, "relTol": 1e-6 } } },
  { "name": "uranium-235", "params": { "nuclide": "u235", "reaction": "none" }, "run": "static",
    "expect": { "massDefect": { "value": 1.915065, "relTol": 1e-6 }, "bindingEnergy": { "value": 1783.871753, "relTol": 1e-6 },
                "bePerNucleon": { "value": 7.590943631, "relTol": 1e-6 }, "protonNumber": { "value": 92, "absTol": 1e-9 },
                "neutronNumber": { "value": 143, "absTol": 1e-9 }, "massNumber": { "value": 235, "absTol": 1e-9 } } },
  { "name": "hydrogen-1 has no binding energy", "params": { "nuclide": "h1", "reaction": "none" }, "run": "static",
    "expect": { "massDefect": { "value": 0, "absTol": 1e-12 }, "bindingEnergy": { "value": 0, "absTol": 1e-9 } } },
  { "name": "D-T fusion Q value", "params": { "nuclide": "he4", "reaction": "dt-fusion" }, "run": "static",
    "expect": { "qValue": { "value": 17.58940314, "relTol": 1e-6 } } },
  { "name": "D-D fusion Q value", "params": { "nuclide": "he3", "reaction": "dd-fusion" }, "run": "static",
    "expect": { "qValue": { "value": 3.269544299, "relTol": 1e-6 } } },
  { "name": "U-235 fission Q value", "params": { "nuclide": "u235", "reaction": "u235-fission" }, "run": "static",
    "expect": { "qValue": { "value": 173.2802589, "relTol": 1e-5 } } }
]
```
