# Status

Single source of progress. Only the orchestrator (or the Wave 0 lead) edits this file. Sessions resume from the first open box.

- **Current wave:** 1
- **Contracts:** LOCKED (Gate A approved 2026-11-25; guide §5 incl. §5.10)
- **Auth mode:** local (switch to supabase after H3–H5)

## Gates

- [x] **Gate A**: approved by Luca 2026-11-25. Wave 0 merged: https://github.com/LucaBrighenti-dev/hsc-interactives/pull/1
- [ ] **Gate B / me1**: Maths Ext 1 specs approved | P0+P1 approved by orchestrator 2026-11-25 (PR #16, reviewer + re-check); P2 PR #31 fixing
- [x] **Gate B / me2** | Maths Ext 2 specs approved | all approved 2026-11-25 by the orchestrator under overnight authority: P0+P1 #7, P2 #21 (review, 2 re-reviews, re-check)
- [x] **Gate B / phy** | Physics specs approved | all approved 2026-11-25: A #17 + #32, B #9 + #20 (reviews, re-reviews, orchestrator re-checks)
- [ ] **Gate B / eng** | Engineering specs approved | #25 + #33 fixed (10 + 10) → re-review running
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

- [ ] W1-E-particle2d | PR: https://github.com/LucaBrighenti-dev/hsc-interactives/pull/24 (12 setups) | review: FAIL (6) → fixed + 9 CRs (orbit escape by energy, GEO radius, GPS clamp, cart distance, SHM Maths form, ...) → re-review running
- [x] W1-E-statics | PR: https://github.com/LucaBrighenti-dev/hsc-interactives/pull/18 | review: FAIL (5) → fixed → PASS | merged
- [x] W1-E-statsim | PR: https://github.com/LucaBrighenti-dev/hsc-interactives/pull/6 merged | polish #30 merged | overlap CR https://github.com/LucaBrighenti-dev/hsc-interactives/pull/50 in progress
- [x] W1-E-argand | PR: https://github.com/LucaBrighenti-dev/hsc-interactives/pull/13 | review: FAIL (3) → fixed → PASS | merged
- [ ] W1-E-aero | PR: https://github.com/LucaBrighenti-dev/hsc-interactives/pull/10 | FAIL (5) → FAIL (3 labels) → fixed with a label-overlap regression test → round-3 re-review running
- [x] W1-E-wave | PR: https://github.com/LucaBrighenti-dev/hsc-interactives/pull/12 | review: FAIL (3) → fixed → PASS | merged
- [ ] W1-E-fnplot | parser MERGED #5 | engine PR https://github.com/LucaBrighenti-dev/hsc-interactives/pull/28 FAIL (11 + spec keys) → builder fixing
- [ ] W1-E-field2d | building on the merged parser
- [ ] W1-E-space3d | PR: https://github.com/LucaBrighenti-dev/hsc-interactives/pull/44 | review running (lead #45 allow-listed headless Chromium's benign WebGL ReadPixels warning)
- [x] W1-E-rays | PR: https://github.com/LucaBrighenti-dev/hsc-interactives/pull/29 | review: FAIL (2) → fixed → orchestrator re-check PASS | merged
- [ ] W1-E-circuit | PR: https://github.com/LucaBrighenti-dev/hsc-interactives/pull/40 | review: FAIL (3: unpolarised parts show signed readings, label overlaps, 40 px inputs) → builder fixing
- [ ] W1-E-materials | PR: https://github.com/LucaBrighenti-dev/hsc-interactives/pull/41 | review: FAIL (9: stage overlaps, alumina flexural vs UTS, 2024-T3 source, hardness validity, phone layout) → builder fixing

### Platform

- [x] W1-AUTH | Premium sign-in + accounts | PR: https://github.com/LucaBrighenti-dev/hsc-interactives/pull/37 | review: FAIL (2) → fixed (+ lead #47 security) → orchestrator re-check PASS | merged
- [ ] W1-HUB | Dashboard | PR: https://github.com/LucaBrighenti-dev/hsc-interactives/pull/34 | review: FAIL (1) → fixed; needs rebase (its live-card test assumes no real live pages) → builder fixing

### Syllabus (`syllabus-tagger`)

- [x] W1-SYL Verify tags + outcome codes for every catalog entry | PR: https://github.com/LucaBrighenti-dev/hsc-interactives/pull/14 | review: FAIL (report only) → fixed, re-checked | merged (125/126 tags verified; 37 gaps in docs/gates/syllabus-report.md)

### Specs (`spec-writer`, P0 first)

- [ ] W1-SPEC-me1 | P0+P1 MERGED (#16) | P2: https://github.com/LucaBrighenti-dev/hsc-interactives/pull/31 re-review FAIL 1 (inequality method) → writer fixing
- [x] W1-SPEC-me2 | P0+P1 MERGED (#7) | P2 MERGED (#21)
- [x] W1-SPEC-phy | A: MERGED #17, #32 | B: MERGED #9, #20
- [ ] W1-SPEC-eng | P0+P1: https://github.com/LucaBrighenti-dev/hsc-interactives/pull/25 + P2: https://github.com/LucaBrighenti-dev/hsc-interactives/pull/33, both fixed (10 + 10) → re-review running

## Wave 2: interactives (`interactive-builder`; start when the subject's Gate B is approved and the engine has merged)

Format: `id | title | engine | spec approved | PR | review`

### P0

- [ ] `eng-flight-forces` | Flight forces and stall | engine: aero | spec: [ ] | PR: | review: 
- [ ] `eng-truss-solver` | Truss solver | engine: statics | spec: [ ] | PR: | review: 
- [x] `me1-sampling-simulator` | Sampling simulator | engine: statsim | spec: [x] | PR: https://github.com/LucaBrighenti-dev/hsc-interactives/pull/38 | review: PASS (0) | LIVE
- [ ] `me1-slope-fields` | Slope fields | engine: field2d | spec: [ ] | PR: | review: 
- [ ] `me2-argand-explorer` | Argand explorer | engine: argand | spec: [x] | PR: https://github.com/LucaBrighenti-dev/hsc-interactives/pull/46 | review: in progress
- [ ] `phy-double-slit` | Double slit and diffraction grating | engine: wave | spec: [x] | PR: building | review:
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
- [x] `me1-normal-approx` | Normal approximation to the binomial (enrichment) | engine: statsim | spec: [x] | PR: https://github.com/LucaBrighenti-dev/hsc-interactives/pull/42 | review: PASS (0) | LIVE
- [ ] `me1-parametric-tracer` | Parametric tracer | engine: fnplot | spec: [ ] | PR: | review: 
- [ ] `me1-roots-coefficients` | Roots and coefficients | engine: fnplot | spec: [ ] | PR: | review: 
- [ ] `me1-solids-revolution` | Solids of revolution | engine: space3d | spec: [ ] | PR: | review: 
- [ ] `me1-vector-playground` | Vector playground | engine: space3d | spec: [ ] | PR: | review: 
- [ ] `me2-3d-lines-spheres` | 3D lines and spheres | engine: space3d | spec: [ ] | PR: | review: 
- [ ] `me2-loci-painter` | Loci painter | engine: argand | spec: [x] | PR: https://github.com/LucaBrighenti-dev/hsc-interactives/pull/48 | review: in progress
- [ ] `me2-resisted-motion` | Resisted motion | engine: particle2d | spec: [ ] | PR: | review: 
- [ ] `me2-shm` | Simple harmonic motion | engine: particle2d | spec: [ ] | PR: | review: 
- [ ] `phy-blackbody` | Black-body radiation | engine: fnplot | spec: [ ] | PR: | review: 
- [ ] `phy-bohr-spectra` | Bohr atom and hydrogen spectrum | engine: custom | spec: [x] (#9) | PR: building (after photoelectric) | review:
- [ ] `phy-charged-particles` | Charged particles in fields | engine: particle2d | spec: [ ] | PR: | review: 
- [ ] `phy-circuit-builder` | Circuit builder | engine: circuit | spec: [ ] | PR: | review: 
- [ ] `phy-circular-motion` | Circular motion and banked tracks | engine: particle2d | spec: [ ] | PR: | review: 
- [ ] `phy-collisions` | Collisions | engine: particle2d | spec: [ ] | PR: | review: 
- [ ] `phy-field-sketcher` | Electric field sketcher | engine: field2d | spec: [ ] | PR: | review: 
- [ ] `phy-inclined-plane` | Inclined plane and friction | engine: statics | spec: [x] | PR: building | review:
- [ ] `phy-induction` | Faraday and Lenz | engine: custom | spec: [x] (#9) | PR: building (after motor) | review:
- [ ] `phy-motion-graphs` | Motion graphs lab | engine: particle2d | spec: [ ] | PR: | review: 
- [ ] `phy-motor-effect` | Motor effect and DC motor | engine: custom | spec: [x] (#9) | PR: building | review:
- [ ] `phy-orbit-lab` | Orbit lab | engine: particle2d | spec: [ ] | PR: | review: 
- [ ] `phy-photoelectric` | Photoelectric effect | engine: custom | spec: [x] (#9) | PR: building | review:
- [ ] `phy-radioactive-decay` | Radioactive decay | engine: statsim | spec: [x] | PR: building (after Doppler) | review:
- [ ] `phy-ray-box` | Ray box | engine: rays | spec: [x] | PR: building (after inclined plane) | review:
- [ ] `phy-relative-velocity` | Relative velocity | engine: particle2d | spec: [ ] | PR: | review: 
- [ ] `phy-relativity` | Special relativity | engine: custom | spec: [x] (#9) | PR: building (after Bohr) | review:
- [ ] `phy-wave-machine` | Wave machine | engine: wave | spec: [x] | PR: building (after double slit) | review:

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
- [ ] `me2-conjugate-roots` | Conjugate roots | engine: argand | spec: [x] | PR: building | review:
- [ ] `me2-integration-by-parts` | Integration by parts | engine: fnplot | spec: [ ] | PR: | review: 
- [ ] `me2-partial-fractions` | Partial fractions decomposer | engine: fnplot | spec: [ ] | PR: | review: 
- [ ] `me2-proof-pictures` | Proof pictures | engine: custom | spec: [x] | PR: building (after conjugate roots) | review:
- [ ] `phy-binding-energy` | Binding energy | engine: custom | spec: [x] | PR: building | review:
- [ ] `phy-doppler-beats` | Doppler effect and beats | engine: wave | spec: [x] | PR: building | review:
- [ ] `phy-heating-curves` | Heating curves | engine: fnplot | spec: [ ] | PR: | review: 
- [ ] `phy-hr-diagram` | HR diagram | engine: custom | spec: [x] | PR: building (after binding energy) | review:
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
- 2026-11-25 (overnight): lead PRs #8 (integer outputs, axis placement), #11 (readout labels keep their case, so α stays α), #15 (engine 'params' event, SI-prefixed readouts, control help) merged; #19 (stage role=group) merging. Reviews running for engines statsim, aero, wave, argand and statics, the syllabus PR #14, and specs me2 #7 and me1 #16. Parser #5 FAILED review (invalid KaTeX labels, a misleading label for 2(−3x), nested |..| bars, prototype lookups); its builder is fixing it before part 2. Subagent cap of 20 reached; W1-AUTH and field2d queued.
- 2026-11-25 (overnight): statsim engine merged (#6, reviewer PASS). Lead #19 (stage role=group) merged. Physics B specs done (#9 P1 custom, #20 P2). W1-AUTH started; Physics A specs under review.
- 2026-11-25 (overnight): syllabus tags merged (#14). Lead PRs merged: #23 (spec keys checked only once a page is in review), #26 (e2e smoke test of every engine demo page and setup); #27 (drawAxes titles outside the plot) merging. Reviews found real defects in aero, wave, argand, the parser and me2 specs; all are being fixed by their builders and will be re-reviewed. No engine merges without an independent PASS.
- 2026-11-25 (overnight, 18:22 UTC): merged parser #5, specs me1 P0/P1 #16 and me2 P0/P1 #7 (Gate B), lead #35 (danger-text token, playlist notes, units ruling), #36 (number formatting robust over the whole double range; long readouts fit), #39 (44 px small buttons on touch). Lesson: retarget stacked PRs to main before merging their base (#22 was auto-closed; replaced by #31). Wave 2 started: statsim pages (sampling simulator P0, normal approx).
- 2026-11-25 (overnight, about 18:40 UTC): engines merged: statsim (+ polish #30), wave #12, argand #13, statics #18, parser #5. Lead #43 merged (fixed 'null' shown in the header for non-founding users; readout unit reset; shots --steps). Wave 2 page PRs: sampling simulator #38 (P0), normal approx #42. Argand pages building. Merge script no longer switches branches in the main folder (it once left a lead commit on local main; recovered without loss).
- 2026-11-25 (overnight, 18:45 UTC): merged rays engine #29, Physics A specs #17 + #32 (Gate B / phy part A approved), lead #45 (allow-list for one benign headless-WebGL warning) and **lead #47 (security: open redirect in safeNext; dot segments like /.//evil.example normalised to //evil.example; found by the #37 reviewer, fixed with regression tests; nothing was deployed)**. Merge script now confirms the merge on GitHub (it once reported a conflicted merge as merged; #32 was rebased and merged). Wave 2 builders started: double slit (P0) + wave machine, inclined plane + ray box, photoelectric + Bohr + relativity, motor + induction.
- 2026-11-25 (overnight, 18:55 UTC): **first pages LIVE**: Sampling simulator (P0, #38) and Normal approximation (#42), both PASS with 0 fixes. Sign-in #37 merged. Gate B complete for Ext 2 (#21) and Physics (#9, #20). Lead #49: smoke test counts live entries (my status push for the live pages piped Playwright into grep, so a failing run didn't stop it; fixed within minutes, and status pushes now check the exit code). Builders started: conjugate roots + proof pictures, Doppler + decay, binding energy + HR diagram.
