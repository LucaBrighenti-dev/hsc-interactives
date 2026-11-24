# HSC Interactives Hub

A premium, sign-in web hub of interactive simulations for NSW Stage 6 Mathematics Extension 1 and 2, Physics, and Engineering Studies teachers. It was first shown at UNSW Teach the Teachers 2026. The owner is Luca Brighenti.

## Start here

When asked to "read the docs and begin development", "continue", or similar:

1. Read `docs/MASTER_PLAN.md` (scope and why), then `docs/IMPLEMENTATION_GUIDE.md` (contracts, design, tasks, playbook).
2. Read `docs/STATUS.md`. Find the current wave: the first one with unchecked tasks whose gate is approved.
3. **Wave 0 open:** you are the lead. Do the W0 tasks in order yourself (guide §7). They define the contracts, so don't parallelise them. Finish by writing `docs/gates/gate-a.md`, update STATUS, then stop and ask Luca to review Gate A.
4. **Wave 1 or later:** you are the orchestrator (guide §13). Spawn subagents from `.claude/agents/` in parallel, one task each, each in its own git worktree and branch. Spawn a fresh reviewer for every PR. Keep STATUS current.
5. **A gate is waiting on Luca:** say exactly what he needs to check (from `docs/gates/`) and stop.
6. Before ending any session: update `docs/STATUS.md` (boxes, PR links, a dated log line).

## Rules (full list in guide §2)

- Contracts in guide §5 are locked after Gate A. Change them only through a lead task that updates the guide and every affected file.
- One agent, one task, one branch, one worktree, one PR. Nobody pushes to `main` except the orchestrator's `status:` commits.
- Only edit the paths you own (guide §13.3). Otherwise write a change request in the PR description.
- Engine physics lives in pure `model.js` files with unit tests against analytic answers. Correctness beats polish.
- Vanilla HTML/ES modules/Canvas/SVG; Three.js only in `space3d`; all libraries self-hosted; no `eval`/`new Function`; no runtime CDNs; no analytics.
- Design language: graphite near-black, international orange `#FF4F00`, Archivo Expanded display, Inter body, JetBrains Mono data, matte and flat, sharp frames. No shadows, gradients or glows; no cyan/blue glowing HUD look. Simulations default to the light projector theme.
- Show assumptions on stage. g = 9.8 for Physics/Maths presets, 10 for Engineering presets.
- Never copy NESA syllabus text, HSC exam questions or textbook content into the site. Write original questions.
- Sign-in is for a premium feel, not security. Sharing logins is fine. Never store student personal details; classes use access codes.
- **Human-only:** never create accounts, handle secrets, or change GitHub/Render/Supabase settings. Ask Luca (guide §14, tasks H1–H8).
- Use Australian English.

## Commands

```bash
npm run dev            # http://localhost:5173 (build + watch + serve)
npm run build          # dist/ with merged catalog.json and vendor libs
npm test               # engine unit tests (node --test)
npm run test:e2e       # Playwright smoke + acceptance
npm run shots -- <id>  # screenshots at desktop/tablet/phone
npm run generate       # catalog fragments, spec + notes stubs from docs/backlog.json
npm run check          # build + test + e2e
```

## Where things are

- Pages: `site/interactives/<maths-ext1|maths-ext2|physics|engineering>/<slug>.html`
- Engines: `site/assets/engines/<name>/{model,view,index}.js`; custom: `site/assets/engines/custom/<id>/`
- Catalog: `site/catalog/<id>.json` (merged at build) · Specs: `specs/<id>.md` · Notes: `site/content/notes/<id>.md`
- Backlog (source of truth for what to build): `docs/backlog.json`
- Gate reports for Luca: `docs/gates/`
