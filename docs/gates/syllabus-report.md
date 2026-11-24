# Syllabus report (W1-SYL)

Written by the syllabus tagger on 25 November 2026. It covers all 76 catalogue fragments (71 pages, 5 listings) against six syllabuses. Everything below is paraphrased. No NESA text is copied here or into the site. The scraped reference text stays in the git-ignored `docs/syllabus-reference/`, and `node scripts/scrape-syllabus.mjs` rebuilds it.

## 1. Entries verified

**125 of 126 syllabus tags are verified** (76 of 76 fragments checked). The one unverified tag is `me1-normal-approx` (section 2).

Each tag now has the NESA area or module, focus area, subtopic (where NESA has one), year, outcome codes and a `url`. For the 2024–2026 syllabuses the `url` is the focus-area page on curriculum.nsw.edu.au. For Physics 2017 and Engineering Studies 2011 it is the course page on nsw.gov.au, because those syllabuses are now published only as Word downloads with no per-module pages.

| Syllabus | Source read | Tags |
| --- | --- | --- |
| Mathematics Extension 1 11–12 (2024) | 11 focus-area pages, outcomes page | 19 |
| Mathematics Extension 2 11–12 (2024) | 5 focus-area pages, outcomes page | 10 |
| Physics 11–12 (2025) | 7 focus-area pages (plus Working scientifically), outcomes page | 25 |
| Physics Stage 6 (2017) | official DOCX from the course page, split into Modules 1–8 | 26 |
| Engineering Studies 11–12 (2026) | 7 focus-area pages with their outcome lists, outcomes page | 25 |
| Engineering Studies Stage 6 (2011) | official DOC from the course page, split into 8 modules | 21 |

### Corrections worth knowing

- **ME1 statistics focus area name:** NESA's title is "The binomial distribution and sampling distribution of the mean". We had an extra "the".
- **ME1 auxiliary angle:** NESA places the R sin(x ± α) and R cos(x ± α) forms under *Further trigonometric equations*, not identities.
- **Engineering 2011 modules corrected:**
  - Force sandbox and Moments move to *Engineered products*, the module where resultants, equilibrants, moments and concurrent forces sit. They were tagged *Engineering Fundamentals*.
  - Simple machines moves to *Engineering fundamentals*, which lists levers, pulleys, gears and screws. It was tagged *Engineered Products*.
  - Tensile test moves to *Braking systems*, which has load–extension, stress–strain and the tensile test. It was tagged *Engineered Products*.
- **Engineering 2011 module names** now use the syllabus's own sentence case, for example "Civil structures".
- **New 2011 tag:** `eng-circuits-as1102` now has one. *Biomedical engineering* covers Ohm's law and series and parallel circuits, so the master plan's "no 2011 match" was wrong.
- **Second tags added** where a new syllabus states the content outright:
  - `me1-inverse-trig`: *Further calculus skills*, which holds the derivatives of the inverse trig functions.
  - `eng-simple-machines`: Transport, *Simple machines*. This Year 12 subtopic has the velocity ratios for pulleys, gears, screws, and wheel and axle.
  - `eng-pascal-hydraulics`: Environmental, *Hydraulics and pneumatics*, which has the hydraulic press relationship.
  - `eng-tensile-test`: Engineering materials, *Material stress-strain behaviour*.

### Outcome-code policy

Tags carry codes only, never outcome text.

- **Maths 2024 and Physics 2025:** each focus area has exactly one content outcome, for example `ME1-12-06` or `PY-12-01`. I tagged that one and left out the outcomes that every focus area shares (`MAO-WM-01`, Working scientifically).
- **Physics 2017:** I tagged each module's knowledge outcome (`PH11-8` to `PH12-15`). The skills outcomes are written `PH11/12-n`. The schema's code pattern rejects the slash, and those outcomes apply to every module anyway.
- **Engineering 2026:** the Year 12 focus areas list all eight ES-12 outcomes and the Year 11 focus areas list five or six. I tagged the one or two that fit the interactive:
  - `-04` for mechanics problem solving;
  - `-02` or `-03` for materials;
  - `-06` for drawing;
  - `ES-12-01` for the satellite and modulation pages;
  - `ES-12-05` for energy systems.
- **Engineering 2011:** each module lists 7 to 11 outcomes. I picked the one or two from that module's list that fit, usually `P3.1` or `H3.1` (mathematical and graphical methods), `H1.2` (materials) or `P3.3` or `H3.3` (graphics).

The Engineering choices are my judgement. Every code is on the relevant NESA list.

## 2. Interactives whose content isn't (fully) in a new syllabus

Twelve findings. The first two matter most.

| Interactive | Finding | Suggestion |
| --- | --- | --- |
| `phy-heating-curves` | **No home in Physics 2025.** The 2025 syllabus has no thermodynamics: no specific heat, latent heat or heating curves. It keeps only the 2017 tag (Module 3, Thermodynamics). Newton's law of cooling isn't in Physics 2017 either. The same model, a rate proportional to Q − P, is in **ME1 2024, Further applications of calculus, Further rates of change**. | Keep it as a 2017 page (P2). Consider an ME1 listing for the cooling model. Its summary still says "until checked against 2025"; the page builder can update it. |
| `me1-normal-approx` | **Excluded by ME1 2024.** The binomial focus area says binomial problems are solved without the normal approximation. Continuity correction isn't in the syllabus. **This tag is left `verified: false`.** | Repurpose it as a binomial distribution explorer (mean np, variance np(1−p), shape as n and p change), which is in the syllabus. Or drop it from the backlog. |
| `me1-arrangements` | The pigeonhole principle isn't in ME1 2024. It was in 2017. Restrictions, together/apart arrangements and circular arrangements are all in. | Drop the pigeonhole demo or label it enrichment. |
| `me1-inequality-line` | The summary says quadratic inequalities. ME1 2024 asks for cubic inequalities (product of linear factors), rational inequalities with the variable in the denominator, and absolute-value inequalities. | Spec writer: build cubic, rational and absolute-value cases. |
| `phy-doppler-beats` | Physics 2025 has the Doppler shift only qualitatively, for a moving source (sound, plus light redshift and blueshift). Beats aren't in 2025. Physics 2017 has both. | Keep the 2025 tag; frame beats and the moving observer as 2017 or extension. Add a light redshift and blueshift view. |
| `phy-wave-machine` | Physics 2025 has standing waves on strings fixed at both ends only. Pipes aren't in 2025. | Keep pipes as a 2017 preset. |
| `phy-circular-motion` | Banked tracks aren't in Physics 2025. Torque moved to Electromagnetism (torque on a current loop in a motor). 2025 has horizontal bends and a mass on a string moving in a horizontal circle. | Add flat-bend and conical-pendulum presets; keep the banked track as 2017. |
| `phy-field-sketcher` | Equipotential lines aren't named in Physics 2025. They were in 2017. Field-line diagrams for point charges and parallel plates are in. | Keep equipotentials as an optional overlay. |
| `phy-blackbody` | Wien's law isn't named in Physics 2025. Black-body curves at different temperatures and Planck's quantised energy are in. | Keep Wien's law, but lead with comparing curves against the classical prediction. |
| `phy-charged-particles` | The velocity selector isn't named in Physics 2025. Crossed E and B fields do appear, in the Thomson e/m content under Matter, energy and the cosmos, *Modelling the atom*, along with mass spectrometers and electron guns. | Add a Thomson e/m preset; it also helps the atom focus area. |
| `eng-fibre-optics` | Engineering 2026 mentions fibre-optic systems only as an aerospace material choice. The physics of total internal reflection isn't in Engineering 2026. It is in Physics 2025 Waves. | A light-touch fit. Keep it as a listing. |
| `eng-modulation-lab` | Engineering 2026 compares frequency and phase modulation. AM appears only in the 2011 syllabus. | Lead with FM against PM. Keep AM for 2011. |

Old-syllabus notes (not counted above):

- `eng-energy-systems` has no 2011 match.
- `eng-descriptive-geometry`: the 2011 syllabus has transition-piece developments but not true length or true shape. Those are new in 2026.

## 3. New-syllabus topics no interactive covers (backlog candidates)

Twenty-four candidates. The first column says whether each needs a new page (**new**) or only a preset or listing on an existing page.

| # | Kind | Syllabus and subtopic | Candidate interactive (engine) |
| --- | --- | --- | --- |
| 1 | new | ME1 Polynomials, *Remainder and factor theorems* | Polynomial division and remainder visualiser (fnplot) |
| 2 | new | ME1 Further trigonometry, *Further trigonometric identities* | Compound and double angles on the unit circle (fnplot) |
| 3 | new | ME1 Further applications of calculus, *Further rates of change* | Related rates: filling cone, expanding sphere (custom) |
| 4 | preset | ME1 Introduction to vectors, *Motion in vector form in two dimensions* | Position and velocity vector tracer (particle2d preset) |
| 5 | new | ME2 Further work with vectors, *Vectors and geometry* | Vector proofs of geometric results (space3d) |
| 6 | new | ME2 Mechanics, *Forces and further motion in a straight line* and *Modelling motion without resistance* | Acceleration as v dv/dx; pulleys and smooth inclines (particle2d or statics) |
| 7 | preset | ME2 Nature of proof, *Further proof by mathematical induction* | ME2 presets for the induction stepper |
| 8 | new | Physics 2025 Waves, *Light and sound* | Inverse-square intensity, plus pitch and loudness (wave) |
| 9 | preset | Physics 2025 Waves, *Wave behaviours*: diffraction through gaps | Ripple-tank preset on the wave machine (wave) |
| 10 | new | Physics 2025 Nature of light, *The wave model of light*: polarisation | Polarisers and Malus's law (wave) |
| 11 | new | Physics 2025 Nature of light, *Electromagnetic waves* | EM wave propagation and speed-of-light measurement (wave) |
| 12 | new | Physics 2025 Electromagnetism, *Applications of electromagnetic induction* | AC and DC generators, back emf, magnetic braking (custom) |
| 13 | new | Physics 2025 Matter, energy and the cosmos, *Modelling the atom* | Rutherford gold-foil scattering; Thomson e/m (particle2d) |
| 14 | new | Physics 2025 Fundamentals of mechanics, *Forces and motion*: connected bodies | Connected bodies and rope tension (statics) |
| 15 | new | Eng 2026 Engineering materials (Y11): *Metallic phases*, *Atomic interaction and structure of materials*. Also Civil, *Phases in ferrous metals*, and Transport, *Heat treatment* | Iron–carbon phase diagram and heat-treatment explorer (materials). No Year 11 Engineering materials interactive exists apart from the tensile test. |
| 16 | new | Eng 2026 Transport, *Control technology and automation* | Logic gates, truth tables, sensors and actuators (custom) |
| 17 | listing | Eng 2026 Transport, *Friction*: limiting friction on an incline, angle of friction | Engineering listing of `phy-inclined-plane` with g = 10 |
| 18 | new | Eng 2026 Environmental, *Energy transmission infrastructure* | Cable resistance and loss: aluminium, steel, copper (circuit or custom) |
| 19 | listing | Eng 2026 Environmental, *Electrical systems*: Kirchhoff, power, efficiency, battery capacity | Engineering listing of `phy-circuit-builder` |
| 20 | preset | Eng 2026 Environmental, *Fluid mechanics*: density, hydrostatic and absolute pressure | Preset on `eng-pascal-hydraulics` |
| 21 | preset | Eng 2026 Civil, *Engineering mechanics – truss analysis*: Bow's notation, force polygons; factor of safety | Graphical-method mode on `eng-truss-solver` |
| 22 | new | Eng 2026 Aeronautical and aerospace, *Propulsion and measurement systems*: engine cycles | Four-stroke and jet engine cycle animator (custom) |
| 23 | new | Eng 2026 Civil, *Crack theory* and *Degradation of materials* | Corrosion and crack growth (materials) |
| 24 | preset | Eng 2026 Technical graphics: sectioned orthogonal views; isometric circles by the four-centre method | Presets on the orthographic trainer and isometric grid |

## 4. What I couldn't verify, and why

- **`me1-normal-approx`** (1 tag). Its core content is explicitly excluded from ME1 2024, so I left `verified: false`. The tag still records the closest placement (Binomial distributions).
- **Engineering outcome codes** are a judgement call, as section 1 explains. The area, focus area, subtopic and year are confirmed.
- **Nothing was blocked.** All six syllabuses were read: 4 rendered with Playwright from curriculum.nsw.edu.au, 2 downloaded as Word files from nsw.gov.au. No page failed, and no site blocked automated access. The scraper waits 2.5 s between requests and uses a normal browser user agent.
- **Stale copies outside my paths.** The syllabus arrays in `docs/backlog.json` are now stale. Spec-stub frontmatter copies its tags from there, so the lead should sync the backlog tags from the fragments. This is listed as a change request in the PR.
