# Gate C queue

PRs that passed independent review (`VERDICT: PASS`) with CI green. The orchestrator is the only writer.

**Overnight authority (Luca, 2026-11-25):** the orchestrator approves specs (Gate B) and squash-merges PRs on reviewer PASS + CI green. Luca reviews the merged results in the morning. Quality first: nothing merges without an independent PASS.

| PR | Task | Summary | Review | Merged |
| --- | --- | --- | --- | --- |
| [#6](https://github.com/LucaBrighenti-dev/hsc-interactives/pull/6) | W1-E-statsim | statsim engine: sampling, normal-approx, decay | PASS (0 required fixes) | 2026-11-25 |
| [#14](https://github.com/LucaBrighenti-dev/hsc-interactives/pull/14) | W1-SYL | syllabus tags and outcome codes, 125/126 verified; gap report | FAIL (report) → fixed, re-checked | 2026-11-25 |
| [#16](https://github.com/LucaBrighenti-dev/hsc-interactives/pull/16) | W1-SPEC-me1 | Maths Ext 1 P0+P1 specs (11) | FAIL 2 → fixed, re-checked | 2026-11-25 |
| [#5](https://github.com/LucaBrighenti-dev/hsc-interactives/pull/5) | W1-E-fnplot (1) | shared expression parser | FAIL 4 → FAIL 2 → fixed, re-checked | 2026-11-25 |
| [#7](https://github.com/LucaBrighenti-dev/hsc-interactives/pull/7) | W1-SPEC-me2 | Maths Ext 2 P0+P1 specs (5) | FAIL 2 → PASS | 2026-11-25 |
| [#12](https://github.com/LucaBrighenti-dev/hsc-interactives/pull/12) | W1-E-wave | wave engine (interference, modulation, wave machine, Doppler) | FAIL 3 → PASS | 2026-11-25 |
| [#13](https://github.com/LucaBrighenti-dev/hsc-interactives/pull/13) | W1-E-argand | argand engine (operations, loci, roots) | FAIL 3 → PASS | 2026-11-25 |
| [#30](https://github.com/LucaBrighenti-dev/hsc-interactives/pull/30) | statsim CR | statsim polish | PASS | 2026-11-25 |
| [#18](https://github.com/LucaBrighenti-dev/hsc-interactives/pull/18) | W1-E-statics | statics engine (truss, beam, concurrent, moments, incline) | FAIL 5 → PASS | 2026-11-25 |
| [#29](https://github.com/LucaBrighenti-dev/hsc-interactives/pull/29) | W1-E-rays | rays engine (ray box, lenses, mirrors, fibre) | FAIL 2 → orchestrator re-check PASS | 2026-11-25 |
| [#37](https://github.com/LucaBrighenti-dev/hsc-interactives/pull/37) | W1-AUTH | premium sign-in, onboarding, privacy, Supabase migration fix | FAIL 2 (incl. open redirect, fixed by lead #47) → PASS | 2026-11-25 |
| [#38](https://github.com/LucaBrighenti-dev/hsc-interactives/pull/38) | me1-sampling-simulator | page (P0), notes | PASS | 2026-11-25 |
| [#42](https://github.com/LucaBrighenti-dev/hsc-interactives/pull/42) | me1-normal-approx | page (enrichment), notes | PASS | 2026-11-25 |
