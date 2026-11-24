<!-- Exported from the master Claude Doc "HSC Interactives Hub — Build Plan (Teach the Teachers 2026)" on 2026-11-25. Re-export after editing the doc. If this file and docs/IMPLEMENTATION_GUIDE.md disagree, the guide wins on code and this plan wins on scope. -->

# HSC Interactives Hub — Build Plan (Teach the Teachers 2026)

Nov 25, 2026 · @Luca

## Reality check and key decisions

The hub is a premium sign-in experience built by parallel agents on 12 shared engines. Sign-in is there for the feel, not for security, so teachers are free to share their login or the access code with students. Flagships land first so the event shows the best work, and the rest of the roughly 70 interactives keep arriving at the same URL.

- **Breadth through parallel agents, quality through gates.** Shared engines let many agents build interactives at once. Three review gates stop a plausible but wrong simulation from shipping.
- **Tag every interactive against the old and new syllabus.** Maths Ext 1/2 teachers are on the 2024 syllabuses now. Physics stays on 2017 until 2027, and Engineering Studies stays on 2011 until 2028. Dual tags mean nothing expires.
- **Let the room write the backlog.** Signed-in users request and vote on new interactives from day one.
- **A premium front door, not a lock.** Every page sits behind a polished sign-in. Sharing a login or the access code with a class is fine, because nothing behind it is private except each user's own saved items.

| Decision | Recommendation | Why |
| --- | --- | --- |
| Scope | The full map of about 70 interactives, built in parallel waves, with the P0 flagships first | The event shows the best work; the library keeps growing at the same URL |
| Accounts | One sign-in in front of the whole site: Microsoft, Google, email magic link, or a shared access code, through Supabase; logins can be shared freely | The premium feel and personal features, with no effort spent on security the content doesn't need |
| Build method | Parallel Claude Code agents in isolated git worktrees, coordinated through GitHub issues, CI and three review gates | Throughput limited by your review time, not by build time |
| Handoff | A repo starter kit: CLAUDE.md, this plan as docs/MASTER\_PLAN.md, docs/IMPLEMENTATION\_GUIDE.md, docs/STATUS.md and agent definitions | Start Claude Code, say "read the docs and begin development", and it knows the next task |
| Hosting | Render static site for the pages, Supabase (Sydney region) for accounts and saved data | Public pages, real accounts, and you already run Render |
| Stack | Plain HTML + vanilla JS modules, Canvas/SVG, KaTeX, Three.js only for 3D; all libraries self-hosted | Pages stay simple for agents to build |
| Visual style | Your graphite / #FF4F00 / Archivo-Inter-JetBrains system for the site chrome and sign-in; a light "projector" canvas inside each sim | Premium chrome, but dark canvases wash out on classroom projectors |
| Branding | "Built by Luca Brighenti for UNSW Teach the Teachers"; no NESA or Department of Education logos; check UNSW logo use with the organisers | Avoids implying official endorsement |

## Sign-in: the premium front door

Every page sits behind one sign-in, purely for the experience. Teachers can share their login or the access code with students. Nothing behind the door is private except each user's own saved scenarios and playlists.

What signing in adds:

- A dashboard filtered to the subjects you teach
- Saved scenarios, each with a share link and a QR code
- Lesson playlists: a sequence of interactives for one lesson
- Request and vote on new interactives
- A Founding Educator badge for accounts that redeem the event code

The sign-in flow:

1. **Sign-in page:** full-bleed graphite, with a live engine animating behind the card (orange slope-field streamlines or a projectile arc). Archivo Expanded wordmark, one line on what's inside, and "Built by Luca Brighenti for UNSW Teach the Teachers 2026" in the footer.
2. **Four ways in:** Continue with Microsoft, Continue with Google, an email magic link, or an access code. The access code opens an anonymous session, so a whole class can use it without giving personal details.
3. **Onboarding:** pick the subjects you teach. Access-code users can skip it.
4. **Back where you were going:** a shared link survives sign-in, because the page you asked for travels through as a next parameter.

Build notes:

- **The gate:** every page calls requireSession() from auth.js and redirects to the sign-in page when there is no session. An embed mode skips the gate so pages still work inside Google Classroom, Canvas and OneNote frames.
- **Local auth mode:** until the Supabase keys exist, auth.js keeps a stand-in session in the browser, so agents can build and test everything without credentials.
- **Supabase:** Auth with Microsoft, Google, email one-time links and anonymous sessions, plus Postgres in the Sydney region. Row-level security only keeps each user's saved items their own.
- **Students:** point students to the access code rather than personal Google sign-in, so the site never holds students' personal details. A short privacy statement covers the teacher emails it does hold.

## Syllabus landscape (as of November 2026)

The four subjects are at different points in NSW's syllabus changeover. Maths maps to the 2024 syllabuses only. Physics and Engineering Studies need tags for both the syllabus in classrooms now and the new one teachers are planning for.

| Subject | In classrooms now | New syllabus | New Year 11 starts | New Year 12 starts | First HSC exam |
| --- | --- | --- | --- | --- | --- |
| [Mathematics Extension 1](https://curriculum.nsw.edu.au/learning-areas/mathematics/mathematics-extension-1-11-12-2024/overview) | 2024 syllabus (Year 11 since T1 2026, Year 12 since T4 2026) | Mathematics Extension 1 11–12 (2024) | T1 2026 | T4 2026 | 2027 |
| [Mathematics Extension 2](https://education.nsw.gov.au/teaching-and-learning/curriculum/mathematics/leading-mathematics-k-12/leading-mathematics-7-12/mathematics-extension-2-11-12-syllabus-information.html) | 2024 syllabus (Year 12 only) | Mathematics Extension 2 11–12 (2024) | n/a (Year 12 course) | T4 2026 | 2027 |
| [Physics](https://curriculum.nsw.edu.au/learning-areas/science/physics-11-12-2025/overview/course) | 2017 syllabus, Modules 1–8 | Physics 11–12 (2025) | T1 2027 | T4 2027 | 2028 |
| [Engineering Studies](https://curriculum.nsw.edu.au/learning-areas/tas/engineering-studies-11-12-2026/overview/course) | 2011 syllabus, 8 modules | Engineering Studies 11–12 (2026) | T1 2028 | T4 2028 | 2029 |

What this means for the build:

- **Maths teachers are mid-changeover right now.** Content that is new in 2024 (sampling distribution of the mean, 3D trigonometry, explicit 3D vectors) has the fewest existing resources, so it is the highest-value target.
- **Physics teachers need resources for today and for 2027.** The 2025 syllabus regroups the content into 3 Year 11 focus areas and 4 Year 12 focus areas.
- **Engineering Studies has the biggest gap.** The 2026 syllabus is brand new, adds an explicit aerospace focus area, and teachers will have almost no interactive resources for it.

## Mathematics Extension 1 (2024): 7 areas, 11 focus areas, 18 interactives

Priority key: **P0** = before the event, **P1** = by mid-December, **P2** = Term 1 2027 onwards. The focus areas come from NESA's overview page. The sub-content in each row comes from the 2017 syllabus plus a tutoring provider's summary of the 2024 changes, so check it against NESA's content pages before the outcome codes go in.

| Area of study | Focus area (year) | Interactive | Engine | Priority |
| --- | --- | --- | --- | --- |
| Functions | Further work with functions (Y11) | Graph transformer: y = 1/f(x), absolute-value graphs, f of absolute x, side by side with f(x) | FnPlot | P1 |
| Functions | Further work with functions (Y11) | Inverse function mirror: reflect in y = x, drag the domain restriction until the inverse is a function | FnPlot | P1 |
| Functions | Further work with functions (Y11) | Parametric tracer: a t slider traces lines, parabolas and circles; eliminate t step by step | FnPlot | P1 |
| Functions | Further work with functions (Y11) | Inequality number line: quadratic and rational inequalities, critical points and test regions | FnPlot | P2 |
| Functions | Polynomials (Y11) | Roots and coefficients: drag roots and watch the sum, pairwise sum and product update; multiplicity shapes at the x-axis | FnPlot | P1 |
| Trigonometric functions | Further trigonometry (Y11) | Auxiliary angle: two waves a sin x + b cos x collapse into R sin(x + α), with the triangle shown | FnPlot | P1 |
| Trigonometric functions | Further trigonometry (Y11) | 3D trigonometry scenes: rotatable towers, ramps and prisms with angle-of-elevation problems | Space3D | P1 |
| Trigonometric functions | Inverse trigonometric functions (Y12) | Restrict-and-invert builder for sin, cos, tan, plus their derivatives | FnPlot | P2 |
| Combinatorics | Permutations and combinations (Y11) | Arrangement builder: restrictions, people kept together or apart, circular tables, pigeonhole demo | custom | P2 |
| Combinatorics | The binomial theorem (Y11) | Pascal's triangle linked to expansion coefficients; general-term finder | custom | P2 |
| Proof | Proof by mathematical induction (Y12) | Domino stepper: base case, assumption, k + 1 step revealed line by line | custom | P2 |
| Vectors | Introduction to vectors (Y12) | 2D/3D vector playground: add, scale, dot product, projection | Space3D | P1 |
| Vectors | Introduction to vectors (Y12) | **Projectile lab** (shared with Physics M5 and Ext 2 Mechanics) | Particle2D | **P0** |
| Calculus | Further calculus skills (Y12) | Integration by substitution: equal areas under f(g(x))g′(x) and under f(u) | FnPlot | P2 |
| Calculus | Further applications of calculus (Y12) | **Slope fields**: draw dy/dx = f(x, y), click to launch solution curves; logistic and cooling presets | Field2D | **P0** |
| Calculus | Further applications of calculus (Y12) | Solids of revolution: spin a region about either axis, show disc slices, volume integral alongside | Space3D | P1 |
| Statistical analysis | Binomial distribution and sampling distribution of the mean (Y12) | **Sampling simulator**: Bernoulli trials to a binomial histogram, then sample means converging to normal as n grows | StatSim | **P0** |
| Statistical analysis | Binomial distribution and sampling distribution of the mean (Y12) | Normal approximation to the binomial: overlay, continuity correction toggle | StatSim | P1 |

## Mathematics Extension 2 (2024): 5 areas, 5 focus areas, 10 interactives

Ext 2 is Year 12 only. Its 2024 changes are described as minor consolidation, so the 2017 sub-content below should still hold, but check it against NESA before tagging. Complex numbers and mechanics benefit most from motion and are the obvious first builds.

| Area of study | Focus area | Interactive | Engine | Priority |
| --- | --- | --- | --- | --- |
| Complex numbers | Introduction to complex numbers | **Argand explorer**: multiplication as rotate-and-scale, de Moivre power spirals, nth roots of unity as a regular polygon | Argand | **P0** |
| Complex numbers | Introduction to complex numbers | Loci painter: circles, rays and perpendicular bisectors shaded for modulus and argument conditions | Argand | P1 |
| Complex numbers | Introduction to complex numbers | Conjugate root pairs: drag polynomial coefficients and watch the complex roots stay mirrored across the real axis | Argand | P2 |
| Mechanics | Applications of calculus to mechanics | SHM: point on a rotating circle drives x(t); v² against x and phase plots | Particle2D | P1 |
| Mechanics | Applications of calculus to mechanics | Resisted motion: horizontal and vertical, kv and kv² drag, terminal velocity line | Particle2D | P1 |
| Mechanics | Applications of calculus to mechanics | Projectile with air resistance (same Projectile lab, drag toggle on) | Particle2D | **P0** |
| Vectors | Further work with vectors | 3D lines and spheres: vector equation of a line, intersecting, parallel and skew pairs, sphere-line intersections | Space3D | P1 |
| Calculus | Further integration | Partial fractions decomposer with a graph of each piece | FnPlot | P2 |
| Calculus | Further integration | Integration by parts as an area picture; reduction formula stepper | FnPlot | P2 |
| Proof | The nature of proof | AM–GM and inequality proofs as geometric pictures; contrapositive and contradiction toggler | custom | P2 |

## Physics: 2017 modules (now) and 2025 focus areas (from 2027), 24 interactives

Every 2017 module maps cleanly onto a 2025 focus area, so one interactive gets both tags. The 2025 Year 11 course is Fundamentals of mechanics (50 h), Waves (35 h) and Electricity and magnetism (35 h). Year 12 is Advanced mechanics, Electromagnetism, Nature of light, and Matter, energy and the cosmos (30 h each). NESA's site would not give up the 2025 content points for automated reading, so the topic detail below is from the 2017 syllabus. Check each row against the 2025 content pages before release.

| 2017 module | 2025 focus area | Interactive | Engine | Priority |
| --- | --- | --- | --- | --- |
| M1 Kinematics | Fundamentals of mechanics | Motion graphs lab: drive a cart, watch s–t, v–t and a–t live; graph-matching challenge | Particle2D | P1 |
| M1 Kinematics | Fundamentals of mechanics | Relative velocity: boat crossing a river, plane in a crosswind | Particle2D | P1 |
| M2 Dynamics | Fundamentals of mechanics | Inclined plane with friction: free body diagram, components, static vs kinetic (shared with Engineering) | Statics | P1 |
| M2 Dynamics | Fundamentals of mechanics | Collisions in 1D and 2D: momentum and kinetic energy bars, elastic to perfectly inelastic slider | Particle2D | P1 |
| M2 Dynamics | Fundamentals of mechanics | Work–energy roller track: KE, GPE and work against friction as stacked bars | Particle2D | P2 |
| M3 Waves and thermodynamics | Waves | Wave machine: transverse and longitudinal, superposition, standing waves on strings and in pipes | Wave | P1 |
| M3 Waves and thermodynamics | Waves | Doppler and beats, with optional audio | Wave | P2 |
| M3 Waves and thermodynamics | Waves | Ray box: Snell's law, critical angle, total internal reflection into an optical fibre (shared with Engineering) | Rays | P1 |
| M3 Waves and thermodynamics | none found in 2025 focus-area names; check | Heating curves, latent heat, specific heat; Newton's law of cooling | FnPlot | P2 |
| M4 Electricity and magnetism | Electricity and magnetism | Field sketcher: drag point charges and see field lines and equipotentials | Field2D | P1 |
| M4 Electricity and magnetism | Electricity and magnetism | Circuit builder: series and parallel, Ohm's law, Kirchhoff, power (shared with Engineering) | Circuit | P1 |
| M4 Electricity and magnetism | Electricity and magnetism | Magnetic field of a wire, loop and solenoid with a compass grid | Field2D | P2 |
| M5 Advanced mechanics | Advanced mechanics | **Projectile lab**: launch angle and speed, max height, range, velocity components, optional drag | Particle2D | **P0** |
| M5 Advanced mechanics | Advanced mechanics | Circular motion and banked tracks: forces, design speed, torque | Particle2D | P1 |
| M5 Advanced mechanics | Advanced mechanics | Orbit lab: Kepler's laws, orbital energy, escape velocity (shared with Engineering satellites) | Particle2D | P1 |
| M6 Electromagnetism | Electromagnetism | Charged particles in E and B fields: parallel plates, circular paths, velocity selector | Particle2D | P1 |
| M6 Electromagnetism | Electromagnetism | Motor effect and DC motor: force on a conductor, torque against angle, commutator | custom | P1 |
| M6 Electromagnetism | Electromagnetism | Faraday and Lenz: magnet through a coil, flux and emf graphs; transformer turns ratio | custom | P1 |
| M7 The nature of light | Nature of light | **Double slit and diffraction grating**: wavelength, slit spacing and screen distance sliders, live intensity pattern | Wave | **P0** |
| M7 The nature of light | Nature of light | Black-body curves and Wien's law; photoelectric effect with stopping voltage | FnPlot | P1 |
| M7 The nature of light | Nature of light | Special relativity: light clock time dilation and length contraction | custom | P1 |
| M8 From the Universe to the Atom | Matter, energy and the cosmos | Bohr hydrogen atom: electron transitions mapped to spectral lines (Rydberg) | custom | P1 |
| M8 From the Universe to the Atom | Matter, energy and the cosmos | Radioactive decay: random-decay grid, half-life curve emerging from the noise | StatSim | P1 |
| M8 From the Universe to the Atom | Matter, energy and the cosmos | HR diagram explorer; binding energy per nucleon curve with fission and fusion | custom | P2 |

## Engineering Studies: 2011 modules (now) and 2026 focus areas (from 2028), 22 interactives

The 2026 syllabus is the opportunity: it is new, quantitative, and has an aerospace focus area that matches your VR stations. Year 11 is Engineering materials, Applied engineering analysis, and Technical graphics and communication (40 h each). Year 12 is Civil and structural, Aeronautical and aerospace, Transport engineering and automation, and Environmental engineering and energy systems (30 h each). Content points for the Applied engineering analysis and Aerospace pages were read directly. The Transport and Environmental rows are inferred from their titles.

One syllabus detail to build in: the 2026 Engineering syllabus specifies **g = 10 m/s²**, whereas Physics uses 9.8. Make g a setting whose default depends on the subject tag.

| 2011 module | 2026 focus area | Interactive | Engine | Priority |
| --- | --- | --- | --- | --- |
| Civil Structures | Civil and structural | **Truss solver**: place joints, members, supports and loads; method of joints with tension and compression shown by colour plus label | Statics | **P0** |
| Civil Structures | Civil and structural | Beam lab: support reactions, shear force and bending moment diagrams, bending stress | Statics | P1 |
| Aeronautical Engineering | Aeronautical and aerospace | **Flight forces**: lift, drag, thrust and weight in straight-and-level, climb and descent; angle of attack to stall; L/D ratio (pairs with your VR wind tunnel) | Aero | **P0** |
| Aeronautical Engineering | Aeronautical and aerospace | Pitot-static and altimeter: airspeed from total minus static pressure, altitude from static pressure | Aero | P1 |
| Aeronautical Engineering | Aeronautical and aerospace | Pascal's principle: hydraulic press and aircraft hydraulics force calculator | custom | P1 |
| Aeronautical Engineering | Aeronautical and aerospace | Materials selection chart: strength vs density for Ti-6Al-4V, 2024 Al, high-tensile steel, CFRP; strength-to-weight calculator | Materials | P1 |
| Aeronautical Engineering | Aeronautical and aerospace | Fatigue and NDT methods: crack growth to failure; visual, dye penetrant, X-ray, ultrasonic, magnetic particle compared (pairs with your VR NDT hangar) | Materials | P2 |
| Telecommunications Engineering | Aeronautical and aerospace (positioning systems) | Orbits: LEO, MEO, GEO; GPS trilateration from three satellites (shares the Physics orbit engine) | Particle2D | P1 |
| Telecommunications Engineering | Aeronautical and aerospace (positioning systems) | Modulation lab: AM, FM and phase modulation waveforms | Wave | P1 |
| Telecommunications Engineering | none (fibre optics sits under aerospace materials) | Optical fibre total internal reflection (shares the Physics ray box) | Rays | P1 |
| Aeronautical Engineering | Aeronautical and aerospace (descriptive geometry) | True length and true shape by auxiliary views; transition-piece developments | Space3D | P2 |
| Engineering Fundamentals | Applied engineering analysis | Force sandbox: resolve components, resultant and equilibrant, concurrent forces, three-force rule | Statics | P1 |
| Engineering Fundamentals | Applied engineering analysis | Moments and equilibrium: clockwise-positive convention, beam reactions | Statics | P1 |
| Braking Systems | Applied engineering analysis | Static friction on a horizontal plane; static vs dynamic coefficients | Statics | P1 |
| Engineered Products | Applied engineering analysis | Simple machines: lever classes, pulleys, gears, screw threads; MA, VR and efficiency | custom | P1 |
| Household-scale circuits (no 2011 match) | Applied engineering analysis | Ohm's law, series and parallel with AS 1102 symbols (shares the Physics circuit builder) | Circuit | P1 |
| Engineered Products / Biomedical | Engineering materials | Tensile test machine: load–extension to stress–strain; steel, copper, aluminium, polymer, ceramic; Young's modulus, yield, UTS, toughness | Materials | P1 |
| Engineering Fundamentals | Technical graphics and communication | Orthogonal projection trainer: rotate a 3D part, build third-angle views to AS 1100 | Space3D | P1 |
| Engineering Fundamentals | Technical graphics and communication | Isometric sketching grid with snap | custom | P2 |
| Personal and Public Transport | Transport engineering and automation | Hardness testing: Rockwell, Brinell and Vickers indenters compared | Materials | P2 |
| Personal and Public Transport / Braking Systems | Transport engineering and automation | Braking energy: stopping distance, work done by friction, heat into rotors | Particle2D | P1 |
| none | Environmental engineering and energy systems | Energy systems calculator: solar, wind and storage efficiency chains | custom | P2 |

## Engine architecture: 12 engines behind about 70 interactives

Breadth comes from engines, not pages. Each engine is one tested ES module. An interactive is a thin HTML page that configures an engine with a preset, controls and prompts. Once the engine works, a new interactive is about an hour of work, and a physics fix in one engine fixes every page that uses it.

| Engine | What it does | Interactives it powers | Subjects | Build first for |
| --- | --- | --- | --- | --- |
| Particle2D | RK4 integrator for point masses with pluggable forces (gravity, drag, springs, E and B fields), trails, live graphs | Projectile, resisted motion, SHM, orbits, circular motion, charged particles, collisions, motion graphs, braking | Ext 1, Ext 2, Physics, Engineering | Projectile lab (P0) |
| Statics | 2D joints, members, supports and loads; solves equilibrium by matrix; FBD renderer | Truss solver, beam reactions, moments, force sandbox, friction, inclined plane | Engineering, Physics | Truss solver (P0) |
| StatSim | Seeded random sampling, live histograms, overlaid theoretical distributions | Sampling distribution, binomial, normal approximation, radioactive decay | Ext 1, Physics | Sampling simulator (P0) |
| Argand | Complex plane with draggable points, operations, loci shading | De Moivre, roots of unity, loci, conjugate roots | Ext 2 | Argand explorer (P0) |
| Aero | Lift and drag coefficient curves with stall, force balance in level, climb and descent, standard atmosphere for pitot and altimeter | Flight forces, pitot-static, altimeter | Engineering | Flight forces (P0) |
| Wave | Superposition of sources, interference intensity, standing waves, modulation | Double slit, grating, wave machine, Doppler, beats, AM/FM/PM | Physics, Engineering | Double slit (P0) |
| Field2D | Vector and slope fields with streamlines and RK4 solution curves | Slope fields, electric field lines, magnetic fields | Ext 1, Physics | Slope fields (P0) |
| FnPlot | 2D function grapher with sliders, KaTeX labels, shaded regions | Transformations, inverses, parametric, polynomials, auxiliary angle, integration pictures, heating curves | Ext 1, Ext 2, Physics | Roots and coefficients (P1) |
| Space3D | Three.js scene, orbit controls, axes, labelled vectors, surfaces of revolution | 3D vectors, lines and spheres, solids of revolution, 3D trig, orthogonal projection, descriptive geometry | Ext 1, Ext 2, Engineering | Solids of revolution (P1) |
| Rays | 2D ray tracer with refraction and total internal reflection | Snell's law, critical angle, optical fibre | Physics, Engineering | Ray box (P1) |
| Circuit | Node-voltage solver for resistive DC circuits, AS 1102 symbols | Ohm's law, series and parallel, Kirchhoff, power | Physics, Engineering | Circuit builder (P1) |
| Materials | Stress–strain models plus a small materials database and selection chart | Tensile test, strength-to-weight, selection chart, hardness, fatigue | Engineering | Tensile test (P1) |

Rows marked "custom" in the subject tables (combinatorics, induction, motor effect, relativity, simple machines) are one-off pages. They get built only after the engines, or sooner if teachers ask for them on the day.

## Quality bar: what every interactive ships with

A teacher will decide in about 30 seconds, on a projector, whether this is usable. So every page passes the same checklist before it goes on the hub.

- **Projector-first:** a light canvas by default, text of at least 18 px, lines at least 2 px, and a dark-mode toggle. Test at 1920×1080 and on a phone.
- **Touch-first:** touch targets of at least 44 px, so it works on interactive whiteboards and iPads. Every control is also keyboard-reachable.
- **Colour-blind safe:** never red against green alone. Tension and compression get colour plus a label or a line style.
- **Syllabus tag strip:** subject, old and new syllabus names, focus area, outcome codes, and a link to the NESA page. Link to syllabus text; do not copy it.
- **"Try this" prompts:** 3–5 predict-observe-explain questions per interactive.
- **Teacher notes drawer:** common misconceptions, a 10-minute lesson flow, and one original HSC-style question. Write your own questions; past HSC papers are NESA copyright.
- **Shareable state:** every parameter lives in the URL, so a teacher can set up a scenario and share the exact link or a QR code.
- **Data export:** a CSV of the simulated data, for Working scientifically tasks and depth studies.
- **Correct and honest:** engine numerics are unit-tested against analytic answers (range formula, SHM period, truss reactions summing to the load). Assumptions are shown on screen ("no air resistance", "g = 10 m/s²").
- **Portable:** self-hosted libraries, and an embed mode that skips sign-in so the page works inside Google Classroom, Canvas or OneNote frames.
- **Controls:** play, pause, step, reset and fullscreen on every simulation.

## Tech stack, hosting and repo structure

Use a static site with no framework, a one-script build, and Supabase for accounts. Each interactive is one HTML file plus its own catalogue fragment, so twenty agents can add pages at once without touching the same file.

- **Rendering:** Canvas 2D for simulations, SVG for diagrams and graphs, KaTeX for maths labels, Three.js only for the Space3D engine.
- **Libraries:** self-host KaTeX and Three.js in /vendor. School web filters sometimes block public CDNs, and self-hosting also keeps saved pages working offline.
- **Hosting:** a Render static site auto-deployed from a GitHub repo, with GitHub Pages as a fallback. Accounts, saved scenarios, playlists and requests live in Supabase (Sydney region), which the pages call directly from the browser. Render's free static sites are served from a CDN and should not spin down the way free web services do; check this on the dashboard before the event.
- **Hub:** index.html reads catalog.json (merged at deploy from one fragment per interactive) and renders filter chips (subject, syllabus version, focus area, P-status), search, and "coming soon" cards for the unbuilt map, so teachers see the roadmap.
- **Testing:** a Node script runs engine unit tests. Playwright screenshots every page at 1920×1080 and at iPad size, so you can see layout breaks before teachers do.
- **Later:** an optional Vite step with vite-plugin-singlefile to produce one-file downloads of each interactive.
- **Analytics:** none, or privacy-friendly page counts only. These pages will be opened by students.
- **Licence:** code under MIT and teacher notes under CC BY 4.0, so teachers can fork and adapt.

```text
hsc-interactives/
├─ CLAUDE.md                     # entry point Claude Code reads first
├─ docs/
│  ├─ MASTER_PLAN.md             # this doc, exported as Markdown
│  ├─ IMPLEMENTATION_GUIDE.md    # contracts, tokens, tasks by wave, engine tests, backlog, gates
│  ├─ STATUS.md                  # progress checklist; sessions resume from the first open box
│  └─ gates/                     # gate reports written for you to review
├─ .claude/agents/               # engine-builder, spec-writer, interactive-builder, reviewer, syllabus-tagger
├─ site/                         # everything that gets deployed
│  ├─ index.html  signin.html    # dashboard + premium sign-in
│  ├─ assets/                    # tokens.css, base.css, shell.js, auth.js, state.js, csv.js, config.js
│  │  └─ engines/<name>/         # model.js (pure, tested) + view.js (drawing) + index.js (create)
│  ├─ interactives/<subject>/    # one HTML page per interactive
│  ├─ catalog/<id>.json          # one fragment per interactive (no shared-file conflicts)
│  └─ content/notes/<id>.md      # teacher notes
├─ specs/<id>.md                 # the contract each interactive is built to
├─ supabase/migrations/          # SQL + row-level security
├─ scripts/                      # build, dev server, vendor copy, scaffolding, issue creation
├─ tests/                        # engine unit tests + Playwright e2e and screenshots
├─ render.yaml                   # Render static site blueprint (publishes dist/)
└─ .github/workflows/ci.yml
```

## Parallel build: waves, agents and gates

The build runs as four waves of parallel agents with three review gates. The limit is your review time, not the number of agents. So each gate asks you to check contracts, specs or screenshots in minutes; you never have to read code.

```text
Parallel build: 4 waves, 3 gates (diagram in the master doc, as text here)

Wave 0  Foundations: one lead agent with Luca
        repo, design shell, engine API, catalog schema, spec template, Supabase schema, CI
   |
<Gate A: Luca locks the contracts>
   |
Wave 1  parallel tracks:  [12 engine agents] [accounts + hub] [syllabus agent] [4 spec agents]
   |
<Gate B: specs approved, engine merged>
   |------------------------------------------.
Wave 2  interactive fan-out                  content agents
        15-20 agents, 3-5 interactives each  (teacher notes, worksheets,
        starts engine by engine as each one   original HSC-style questions)
        merges                                       |
   |                                                 |
Wave 3  independent review agents  <-----------------'
        correctness, projector and accessibility, syllabus tags
   |
<Gate C: tests pass, Luca signs off>  --fail: fix and resubmit--> back to Wave 2
   | pass
Merge, then Render deploys the live hub
```

The four Wave 1 tracks run side by side. Each interactive then moves through fan-out, review and Gate C, looping back until it passes.

| Wave | Track | Agents | Each agent owns | Done when | Starts after |
| --- | --- | --- | --- | --- | --- |
| 0 | Foundations | 1 lead + you | Repo, design shell, engine API, catalog fragment schema, spec template, Supabase schema, CI | Gate A: you approve the contracts | Now |
| 1 | Engines | 12 | One engine module, its unit tests against analytic answers, a bare demo page | Tests pass in CI | Gate A |
| 1 | Accounts and hub | 2 | Sign-in page, Supabase and row-level security, onboarding, dashboard, saved scenarios, playlists | Sign-in works with Microsoft, Google, email and the access code | Gate A |
| 1 | Syllabus | 1, with a browser | Reads every NESA focus-area page and writes old and new tags plus outcome codes into the catalog fragments | Every fragment tagged | Gate A |
| 1 | Specs | 4, one per subject | A spec for every interactive: goal, tags, engine preset, controls, try-this prompts, acceptance checks | Gate B: you approve the specs | Gate A |
| 2 | Interactive fan-out | 15–20 | 3–5 interactives each, built from approved specs, P0 specs first | Spec acceptance checks pass | Gate B, and its engine merged |
| 2 | Content | 2–3 | Teacher notes, worksheets, original HSC-style questions | Copy review passes | Gate B |
| 3 | Independent review | 1 per subject + 1 QA | Correctness against hand calculations; projector, touch and accessibility screenshots; tag check | Gate C: tests pass and you sign off | Each pull request |

**Coordination rules**

- **Isolation:** one agent, one git worktree, one branch, one pull request. No agent pushes to main.
- **Locked shared files:** tokens.css, shell.js, the engine APIs and the schemas are read-only to builders. Changes go through an issue to the lead agent.
- **No shared catalogue edits:** each interactive writes its own catalog fragment, and a script merges them at deploy.
- **Specs are the contract:** each spec's acceptance checks become automated tests, so done means the same thing for every agent.
- **No self-review:** a review agent starts fresh with only the spec and the pull request, never the builder's reasoning.
- **Rolling fan-out:** interactives on an engine start the moment that engine merges. Nobody waits for all 12.

**Tooling**

- Claude Code subagents, each in an isolated git worktree, or several Claude Code sessions side by side.
- GitHub Issues as the task board: one issue per interactive, labelled subject, engine, priority and wave.
- GitHub Actions on every pull request: engine tests, acceptance checks, and Playwright screenshots at projector and iPad sizes attached to the pull request, so you review pictures.
- Render deploys main. If your Render plan includes pull request previews, use them to click through each interactive before merging.

## Build handoff: starting Claude Code

A starter kit turns this plan into files Claude Code can read. Claude Code can't open this doc from a link, so the repo carries a Markdown copy of it.

1. Create an empty GitHub repo, unzip the starter kit into it, and commit.
2. Open Claude Code in the repo and say: "Read the docs and begin development."
3. Claude Code reads CLAUDE.md, then MASTER\_PLAN.md, IMPLEMENTATION\_GUIDE.md and STATUS.md, and starts the first unchecked task.
4. At each gate it stops and writes a short report in docs/gates/ for you to approve.
5. Your human-only tasks are creating accounts and keys: the Supabase project, Google and Microsoft sign-in apps, the Render service and repo settings. Local auth mode means none of them block Wave 0.

| File | What it is |
| --- | --- |
| CLAUDE.md | Entry point: what the project is, the rules, the commands, where to start |
| docs/MASTER\_PLAN.md | This doc, exported: the why and the what |
| docs/IMPLEMENTATION\_GUIDE.md | The how: contracts, design tokens, every task by wave, engine test targets, the full backlog, gate checklists |
| docs/STATUS.md | The progress checklist; every session resumes from the first unchecked box and updates it before stopping |
| .claude/agents/ | Five agent roles: engine builder, spec writer, interactive builder, reviewer, syllabus tagger |

Keeping them in step: when this doc changes, export it again over docs/MASTER\_PLAN.md. If the two disagree, the implementation guide wins on code and this doc wins on scope.

## Event-day plan

The goal is a signed-in account for every teacher in the room, plus a ranked list of what they want next.

- **QR to the sign-in page:** on your opening slide, on printed cards at each VR station, and on the room's screens. The card carries the event code that makes the teacher a Founding Educator.
- **Sign in during the session, not after:** give everyone two minutes in your talk to sign in on their phone. Microsoft or Google is fastest; anyone whose school account blocks it uses the access code on the card.
- **Link VR to web:** show the Flight forces page on the screen beside the aerofoil wind-tunnel station, and the NDT methods page beside the inspection hangar. Teachers leave with the 2D version they can use in class.
- **3-minute demo:** signed in as a demo teacher, show the dashboard, filter to one subject and run a flagship. Then save a scenario, show its class QR code, and finish on request-and-vote.
- **One question to every teacher:** "Which topic do your students find hardest to picture?", asked as an in-app request so the room votes on Phase 1's order.

## Risks and open questions

The biggest risk is a physics error shown in front of a room of physics teachers. Correctness checks come before polish.

| Risk | Mitigation |
| --- | --- |
| A wrong result on screen | Engine unit tests against analytic answers; a separate correctness reviewer per subject; assumptions shown on screen; g set per subject |
| Agents produce plausible but wrong physics or maths | Builders never review their own work; review agents see only the spec and the pull request |
| Your review time becomes the bottleneck | Gates ask for specs and screenshots, not code; batch gate reviews into two fixed slots a day |
| Merge conflicts with 20 agents in one repo | One catalog fragment per interactive; shared files locked to the lead agent |
| Claude Code sessions lose track of progress | docs/STATUS.md is the single progress record; every session ends by updating it |
| Flagships not finished by the session | P0 specs go first in Wave 2; the hub shows "coming soon" cards for the rest |
| Sign-in friction at the event, or school accounts blocking third-party sign-in | Four ways in, including the access code; test a Department Microsoft account beforehand |
| Students signing in with personal accounts | Steer classes to the access code (anonymous session), so no student personal details are stored |
| Collecting teachers' personal information | Minimum fields, a privacy statement, account deletion, Sydney-region storage; check with the organisers |
| School networks block the site, CDN libraries or Supabase | Self-hosted libraries; test from a school-style network; GitHub Pages mirror for the pages |
| New-syllabus content mis-tagged | The syllabus agent reads NESA pages in a real browser; tag at focus-area level until verified |
| Copyright | Link to NESA syllabus text and HSC papers rather than copying them; write original questions |
| Implied endorsement | No NESA or Department logos; confirm UNSW branding with the event organisers |
| Single maintainer | Open-source licence and a contribution guide so teachers can add or fix interactives |

- [ ] Which sign-in methods do teachers at NSW public, Catholic and independent schools actually have?
- [ ] One shared access code for everyone, or separate codes for the event and for classes?
- [ ] Final site name? The kit uses "HSC Interactives Hub" as a placeholder in a single config value.
- [ ] Roughly how many teachers per subject are coming? This decides which flagships go first.
- [ ] Can UNSW host it on a unsw.edu.au subdomain, or does it stay under your name on Render?
- [ ] Do you want any analytics at all?

## Sources

The pages below were opened tonight. Sub-topic detail not covered by them (most Physics content points, Ext 1/Ext 2 sub-content) comes from the 2017 syllabuses and should be checked against NESA's content pages.

- [NESA: Mathematics Extension 1 11–12 (2024) overview](https://curriculum.nsw.edu.au/learning-areas/mathematics/mathematics-extension-1-11-12-2024/overview)
- [NSW Department of Education: Mathematics Extension 2 11–12 (2024) information for school leaders](https://education.nsw.gov.au/teaching-and-learning/curriculum/mathematics/leading-mathematics-k-12/leading-mathematics-7-12/mathematics-extension-2-11-12-syllabus-information.html)
- [Intuition: New NSW HSC maths syllabus 2026, what's changing](https://pub.intu.com.au/resources/new-maths-syllabus-2026) (tutoring provider, not NESA)
- [NESA: Physics 11–12 (2025) course overview](https://curriculum.nsw.edu.au/learning-areas/science/physics-11-12-2025/overview/course)
- [NESA: Physics Stage 6 (2017) and transition timeline](https://www.nsw.gov.au/education-and-training/nesa/curriculum/science/physics-stage-6-2017)
- [NESA: Engineering Studies 11–12 (2026) course overview](https://curriculum.nsw.edu.au/learning-areas/tas/engineering-studies-11-12-2026/overview/course)
- [NESA: Engineering Studies 2026, Year 11 Applied engineering analysis content](https://curriculum.nsw.edu.au/learning-areas/tas/engineering-studies-11-12-2026/content/year-11/faa305594d)
- [NESA: Engineering Studies 2026, Year 12 Aeronautical and aerospace content](https://curriculum.nsw.edu.au/learning-areas/tas/engineering-studies-11-12-2026/content/year-12/fa66e557c0)
- [NESA: Engineering Studies Stage 6 (2011) modules](https://www.nsw.gov.au/education-and-training/nesa/curriculum/tas/engineering-studies-stage-6-2011)
