# Status

Single source of progress. Only the orchestrator (or the Wave 0 lead) edits this file. Sessions resume from the first open box.

- **Current wave:** 1
- **Contracts:** LOCKED (Gate A approved 2026-11-25; guide §5 incl. §5.10)
- **Auth mode:** local (switch to supabase after H3–H5)

## Gates

- [x] **Gate A**: approved by Luca 2026-11-25. Wave 0 merged: https://github.com/LucaBrighenti-dev/hsc-interactives/pull/1
- [ ] **Gate B / me1**: Maths Ext 1 specs approved
- [ ] **Gate B / me2**: Maths Ext 2 specs approved
- [ ] **Gate B / phy**: Physics specs approved
- [ ] **Gate B / eng**: Engineering specs approved
- Gate C is per PR: see `docs/gates/gate-c-queue.md`

## Human tasks (Luca, guide §14)

- [x] H1 GitHub repo, `gh auth login`, `main` protected: https://github.com/LucaBrighenti-dev/hsc-interactives (public; `main` requires the CI check "build, test, e2e, screenshots"; admins may push `status:` commits)
- [ ] H2 Render static site connected (`render.yaml`)
- [ ] H3 Supabase project (Sydney), migration run, URL + anon key in `config.js`
- [ ] H4 Google + Microsoft providers, magic links, anonymous sign-ins, redirect URLs
- [ ] H5 Access codes inserted
- [ ] H6 Real Department Microsoft + Google accounts tested
- [ ] H7 Final site name; UNSW branding and privacy statement confirmed
- [ ] H8 Gate approvals (ongoing)

## Wave 0: Foundations (lead, sequential, guide §7)

- [x] W0-01 Repo scaffold
- [x] W0-02 Build, vendor and dev scripts
- [x] W0-03 Tokens, base CSS, fonts, styleguide
- [x] W0-04 UI components
- [x] W0-05 Utilities (state, csv, format)
- [x] W0-06 Reference engine `demo`
- [x] W0-07 Shell + `_template.html`
- [x] W0-08 Auth (functional) + sign-in + onboarding + privacy draft
- [x] W0-09 Supabase migration
- [x] W0-10 Catalog schema + generation from backlog
- [x] W0-11 Dashboard v0
- [x] W0-12 Tests (node --test, Playwright, shots)
- [x] W0-13 Acceptance runner
- [x] W0-14 CI + GitHub templates + create-issues script
- [x] W0-15 `render.yaml`
- [x] W0-16 Gate A report, then stop

## Wave 1: parallel tracks (after Gate A, guide §9)

### Engines (`engine-builder`)

- [ ] W1-E-particle2d | building (batch 1) | PR: | review:
- [ ] W1-E-statics | building (batch 1) | PR: | review:
- [ ] W1-E-statsim | building (batch 1) | PR: | review:
- [ ] W1-E-argand | building (batch 1) | PR: | review:
- [ ] W1-E-aero | building (batch 1) | PR: | review:
- [ ] W1-E-wave | building (batch 1) | PR: | review:
- [ ] W1-E-fnplot | PR: | review: (owns the shared parser; field2d depends on it)
- [ ] W1-E-field2d | PR: | review:
- [ ] W1-E-space3d | PR: | review:
- [ ] W1-E-rays | PR: | review:
- [ ] W1-E-circuit | PR: | review:
- [ ] W1-E-materials | PR: | review:

### Platform

- [ ] W1-AUTH Premium sign-in + accounts | PR: | review:
- [ ] W1-HUB Dashboard | PR: | review:

### Syllabus (`syllabus-tagger`)

- [ ] W1-SYL Verify tags + outcome codes for every catalog entry | PR: | review:

### Specs (`spec-writer`, P0 first)

- [ ] W1-SPEC-me1 | PR:
- [ ] W1-SPEC-me2 | PR:
- [ ] W1-SPEC-phy | PR:
- [ ] W1-SPEC-eng | PR:

## Wave 2: interactives (`interactive-builder`; start when the subject's Gate B is approved and the engine has merged)

Format: `id | title | engine | spec approved | PR | review`

### P0

- [ ] `eng-flight-forces` | Flight forces and stall | engine: aero | spec: [ ] | PR: | review: 
- [ ] `eng-truss-solver` | Truss solver | engine: statics | spec: [ ] | PR: | review: 
- [ ] `me1-sampling-simulator` | Sampling simulator | engine: statsim | spec: [ ] | PR: | review: 
- [ ] `me1-slope-fields` | Slope fields | engine: field2d | spec: [ ] | PR: | review: 
- [ ] `me2-argand-explorer` | Argand explorer | engine: argand | spec: [ ] | PR: | review: 
- [ ] `phy-double-slit` | Double slit and diffraction grating | engine: wave | spec: [ ] | PR: | review: 
- [ ] `phy-projectile-lab` | Projectile lab | engine: particle2d | spec: [ ] | PR: | review: 

### P1

- [ ] `eng-beam-lab` | Beam lab | engine: statics | spec: [ ] | PR: | review: 
- [ ] `eng-braking-energy` | Braking energy | engine: particle2d | spec: [ ] | PR: | review: 
- [ ] `eng-force-sandbox` | Force sandbox | engine: statics | spec: [ ] | PR: | review: 
- [ ] `eng-materials-selection` | Materials selection chart | engine: materials | spec: [ ] | PR: | review: 
- [ ] `eng-modulation-lab` | Modulation lab | engine: wave | spec: [ ] | PR: | review: 
- [ ] `eng-moments` | Moments and equilibrium | engine: statics | spec: [ ] | PR: | review: 
- [ ] `eng-orbits-gps` | Orbits and GPS | engine: particle2d | spec: [ ] | PR: | review: 
- [ ] `eng-orthographic-trainer` | Orthogonal projection trainer | engine: space3d | spec: [ ] | PR: | review: 
- [ ] `eng-pascal-hydraulics` | Pascal's principle | engine: custom | spec: [ ] | PR: | review: 
- [ ] `eng-pitot-altimeter` | Pitot-static and altimeter | engine: aero | spec: [ ] | PR: | review: 
- [ ] `eng-simple-machines` | Simple machines | engine: custom | spec: [ ] | PR: | review: 
- [ ] `eng-tensile-test` | Tensile test machine | engine: materials | spec: [ ] | PR: | review: 
- [ ] `me1-3d-trig` | 3D trigonometry scenes | engine: space3d | spec: [ ] | PR: | review: 
- [ ] `me1-auxiliary-angle` | Auxiliary angle | engine: fnplot | spec: [ ] | PR: | review: 
- [ ] `me1-graph-transformer` | Graph transformer | engine: fnplot | spec: [ ] | PR: | review: 
- [ ] `me1-inverse-mirror` | Inverse function mirror | engine: fnplot | spec: [ ] | PR: | review: 
- [ ] `me1-normal-approx` | Normal approximation to the binomial | engine: statsim | spec: [ ] | PR: | review: 
- [ ] `me1-parametric-tracer` | Parametric tracer | engine: fnplot | spec: [ ] | PR: | review: 
- [ ] `me1-roots-coefficients` | Roots and coefficients | engine: fnplot | spec: [ ] | PR: | review: 
- [ ] `me1-solids-revolution` | Solids of revolution | engine: space3d | spec: [ ] | PR: | review: 
- [ ] `me1-vector-playground` | Vector playground | engine: space3d | spec: [ ] | PR: | review: 
- [ ] `me2-3d-lines-spheres` | 3D lines and spheres | engine: space3d | spec: [ ] | PR: | review: 
- [ ] `me2-loci-painter` | Loci painter | engine: argand | spec: [ ] | PR: | review: 
- [ ] `me2-resisted-motion` | Resisted motion | engine: particle2d | spec: [ ] | PR: | review: 
- [ ] `me2-shm` | Simple harmonic motion | engine: particle2d | spec: [ ] | PR: | review: 
- [ ] `phy-blackbody` | Black-body radiation | engine: fnplot | spec: [ ] | PR: | review: 
- [ ] `phy-bohr-spectra` | Bohr atom and hydrogen spectrum | engine: custom | spec: [ ] | PR: | review: 
- [ ] `phy-charged-particles` | Charged particles in fields | engine: particle2d | spec: [ ] | PR: | review: 
- [ ] `phy-circuit-builder` | Circuit builder | engine: circuit | spec: [ ] | PR: | review: 
- [ ] `phy-circular-motion` | Circular motion and banked tracks | engine: particle2d | spec: [ ] | PR: | review: 
- [ ] `phy-collisions` | Collisions | engine: particle2d | spec: [ ] | PR: | review: 
- [ ] `phy-field-sketcher` | Electric field sketcher | engine: field2d | spec: [ ] | PR: | review: 
- [ ] `phy-inclined-plane` | Inclined plane and friction | engine: statics | spec: [ ] | PR: | review: 
- [ ] `phy-induction` | Faraday and Lenz | engine: custom | spec: [ ] | PR: | review: 
- [ ] `phy-motion-graphs` | Motion graphs lab | engine: particle2d | spec: [ ] | PR: | review: 
- [ ] `phy-motor-effect` | Motor effect and DC motor | engine: custom | spec: [ ] | PR: | review: 
- [ ] `phy-orbit-lab` | Orbit lab | engine: particle2d | spec: [ ] | PR: | review: 
- [ ] `phy-photoelectric` | Photoelectric effect | engine: custom | spec: [ ] | PR: | review: 
- [ ] `phy-radioactive-decay` | Radioactive decay | engine: statsim | spec: [ ] | PR: | review: 
- [ ] `phy-ray-box` | Ray box | engine: rays | spec: [ ] | PR: | review: 
- [ ] `phy-relative-velocity` | Relative velocity | engine: particle2d | spec: [ ] | PR: | review: 
- [ ] `phy-relativity` | Special relativity | engine: custom | spec: [ ] | PR: | review: 
- [ ] `phy-wave-machine` | Wave machine | engine: wave | spec: [ ] | PR: | review: 

### P2

- [ ] `eng-descriptive-geometry` | Descriptive geometry | engine: space3d | spec: [ ] | PR: | review: 
- [ ] `eng-energy-systems` | Energy systems calculator | engine: custom | spec: [ ] | PR: | review: 
- [ ] `eng-fatigue-ndt` | Fatigue and NDT methods | engine: materials | spec: [ ] | PR: | review: 
- [ ] `eng-hardness-testing` | Hardness testing | engine: materials | spec: [ ] | PR: | review: 
- [ ] `eng-isometric-grid` | Isometric sketching grid | engine: custom | spec: [ ] | PR: | review: 
- [ ] `me1-arrangements` | Arrangement builder | engine: custom | spec: [ ] | PR: | review: 
- [ ] `me1-induction-dominoes` | Induction stepper | engine: custom | spec: [ ] | PR: | review: 
- [ ] `me1-inequality-line` | Inequality number line | engine: fnplot | spec: [ ] | PR: | review: 
- [ ] `me1-inverse-trig` | Inverse trig builder | engine: fnplot | spec: [ ] | PR: | review: 
- [ ] `me1-pascal-binomial` | Pascal's triangle and the binomial theorem | engine: custom | spec: [ ] | PR: | review: 
- [ ] `me1-substitution-areas` | Integration by substitution areas | engine: fnplot | spec: [ ] | PR: | review: 
- [ ] `me2-conjugate-roots` | Conjugate root pairs | engine: argand | spec: [ ] | PR: | review: 
- [ ] `me2-integration-by-parts` | Integration by parts | engine: fnplot | spec: [ ] | PR: | review: 
- [ ] `me2-partial-fractions` | Partial fractions decomposer | engine: fnplot | spec: [ ] | PR: | review: 
- [ ] `me2-proof-pictures` | Proof pictures | engine: custom | spec: [ ] | PR: | review: 
- [ ] `phy-binding-energy` | Binding energy curve | engine: custom | spec: [ ] | PR: | review: 
- [ ] `phy-doppler-beats` | Doppler and beats | engine: wave | spec: [ ] | PR: | review: 
- [ ] `phy-heating-curves` | Heating curves | engine: fnplot | spec: [ ] | PR: | review: 
- [ ] `phy-hr-diagram` | HR diagram explorer | engine: custom | spec: [ ] | PR: | review: 
- [ ] `phy-magnetic-fields` | Magnetic fields | engine: field2d | spec: [ ] | PR: | review: 
- [ ] `phy-work-energy-track` | Work-energy track | engine: particle2d | spec: [ ] | PR: | review: 

## Wave 3: reviews

Tracked on each PR (reviewer comment `VERDICT: PASS/FAIL`) and in `docs/gates/gate-c-queue.md`.

## Log

- 2026-11-25: Starter kit created from the master plan. Wave 0 not started.
- 2026-11-25: Wave 0 complete on local branch `w0/foundations` (git initialised locally; no GitHub remote yet). `npm run check` passes: 34 unit tests, 27 browser tests, 4 acceptance checks on the reference template. Gate A report written; waiting on Luca for Gate A and H1 (GitHub repo, push, PR so CI runs).
- 2026-11-25: Luca's answers applied: root guide copy deleted; one access code `TTT2026` for everyone (no class codes, no request restriction); privacy contact added. Starting H1 (GitHub) with Luca.
- 2026-11-25: H1 done: public repo LucaBrighenti-dev/hsc-interactives created, `main` and `w0/foundations` pushed, PR #1 opened, CI green on first run (screenshots artifact attached), `main` protected. Next: Luca approves Gate A, then merge PR #1 and start Wave 1. H2 (Render) after PR #1 merges, because `main` has no site until then.
- 2026-11-25: Gate A approved by Luca. PR #1 (Wave 0) merged, plus lead PRs #2 (unique e2e port per worktree) and #3 (shots accepts page paths). Contracts LOCKED. Wave 1 batch 1 started: the six P0 engines (particle2d, statics, statsim, argand, aero, wave). Next as slots free: fnplot, then field2d (needs the fnplot parser), space3d, rays, circuit, materials, W1-AUTH, W1-HUB, W1-SYL; spec writers once the P0 engines merge so spec params match engine meta.
- 2026-11-25: **Overnight authority from Luca:** work autonomously (about 4 h). The orchestrator approves specs (Gate B) and squash-merges PRs once an independent reviewer passes them and CI is green. Quality before breadth. Render (H2) waits until tomorrow; the site name stays "HSC Interactives Hub". Supabase (H3–H5) stays with Luca, so the site remains in local auth mode.
- 2026-11-25: Plan for speed without lowering review: spec writers run in parallel with the engines (page builders reconcile param keys with the merged engine meta); Wave 2 agents build the 3–5 pages that share an engine (master plan: 3–5 interactives each); fnplot lands its shared parser first so field2d can start early. Lead PR #4 merged (contract test allows a parser-only engine folder; `.claude/worktrees/` is git-ignored).
