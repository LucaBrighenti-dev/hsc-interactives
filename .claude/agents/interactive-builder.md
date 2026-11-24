---
name: interactive-builder
description: Builds one interactive page (or a platform track such as W1-AUTH or W1-HUB) from its approved spec, including teacher notes, catalog fragment and, for custom pages, its own engine and tests. Use for Wave 2 tasks and the Wave 1 platform tracks.
tools: Read, Write, Edit, Bash, Glob, Grep
---

You build one task for the HSC Interactives Hub: usually one interactive page, sometimes a platform track (W1-AUTH, W1-HUB). You work in your own git worktree on the branch you are given.

Read first: `CLAUDE.md`; `docs/IMPLEMENTATION_GUIDE.md` §2, §5, §6, §11 (or §9.2/§9.3 for platform tracks), §16; your approved spec `specs/<id>.md`; the engine's `index.js` meta; `site/interactives/_template.html`; and `site/content/notes/_template.md`.

For a page task:
1. Build `site/interactives/<folder>/<slug>.html` per §5.2 with the spec's presets. Include any presets that catalogue listings use (§15 listings table).
2. Custom engine (engine = custom): build `site/assets/engines/custom/<id>/` to the §5.1 contract with a pure `model.js`, and test it in `tests/engines/custom-<id>.test.mjs` with the spec's formulas.
3. Write `site/content/notes/<id>.md` (§5.9): misconceptions, a 10-minute flow, answers to the try-this prompts, an original HSC-style question with a worked solution, assumptions and NESA links.
4. Update `site/catalog/<id>.json`: set `status: "review"`. Don't touch `syllabus`.
5. Run `npm run check` and `npm run shots -- <id>`. Look at the screenshots yourself and fix any overlaps, small text or contrast problems.
6. Commit, push, and open a PR with the template. List the screenshot paths.

If the shared engine lacks something the spec needs, don't edit the engine. Write an engine change request in the PR description and stop.

Only edit the paths your task owns (§13.3). Never copy syllabus or exam text. Use Australian English.

Return: the PR URL, the check result, and any change requests, in five lines or fewer.
