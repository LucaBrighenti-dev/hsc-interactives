# Gate A: Wave 0 foundations

**For:** Luca · **Written:** 25 November 2026 · **Branch:** `w0/foundations` (local git; see H1 below)

Wave 0 is built. Everything runs locally in local auth mode with no accounts or keys. Approving this gate locks the contracts (guide §5, including the new §5.10) so Wave 1 can start 12 engine agents, the sign-in and dashboard tracks, the syllabus tagger and the four spec writers in parallel.

## Check it in about 10 minutes

First time only: `npm ci` then `npx playwright install chromium`.

1. **Sign-in → dashboard.** Run `npm run dev` and open http://localhost:5173. You land on the sign-in page. Enter access code `TTT2026`.
   - You reach the dashboard with a **Founding Educator** badge.
   - All **76 entries** show **Coming soon**, grouped under Maths Ext 1, Maths Ext 2, Physics and Engineering.
   - Type `projectile` in search (3 cards), then click the subject chips to filter.
   - Optional: sign out, choose **Continue with Google**, and you get the onboarding (subjects, name, school, event code).
2. **Reference template.** Open http://localhost:5173/interactives/_template.html. It runs the `demo` engine (y = A sin(2πft + φ)).
   - **Space** plays and pauses, **.** steps 0.1 s, **R** resets. The readouts update.
   - Drag a slider or type a value. The URL updates. Copy the URL into a new tab and you get the same scenario.
   - Try the **Scenario** menu, **Share** (link, QR code, embed code), **Save**, the **CSV** download, **T** (dark stage), **P** (presenter mode), **F** (full screen), **N** (teacher notes drawer with maths), and the **Try this** panel.
   - Add `?embed=1` to the URL: there's no sign-in and a slim bar replaces the header.
3. **Styleguide.** Open http://localhost:5173/dev/styleguide.html. Check it reads as your design language: graphite, `#FF4F00`, Archivo Expanded, Inter, JetBrains Mono, flat and sharp, with the light projector stage and the dark stage side by side.
4. **Screenshots.** Run `npm run shots`, then look in `test-results/shots/`. There are desktop, tablet and phone images for `signin`, `dashboard`, `privacy`, `styleguide` and `_template`.
5. **Everything at once.** `npm run check` should end with 34 unit tests passing and 27 browser tests passing (16 are desktop-only flows, skipped on tablet and phone).

## Gate A checklist (guide §8)

| Item | State |
| --- | --- |
| `/signin.html` works with `TTT2026` and lands on the dashboard | Done (also covered by an automated test) |
| Dashboard lists all 76 entries as Coming soon, grouped by subject, with search and filter | Done |
| Template page: controls, readouts, URL state, share + QR, CSV, theme, presenter, notes drawer, try-this | Done (automated test covers each) |
| Styleguide looks like the design language | Ready for your eye |
| CI green on the Wave 0 PR with screenshots as an artifact | **Blocked on H1.** There's no GitHub repo yet. `npm run check` passes locally, and `.github/workflows/ci.yml` runs the same steps and uploads `test-results/shots`. |
| Contract deviations below are acceptable | Your call |

## What exists

- **Build and dev.** `npm run dev`, `build`, `test`, `test:e2e`, `shots`, `generate`, `create-issues` (dry run by default) and `check`. The dev server has no dependencies and sends the same security headers as production. KaTeX, three.js, supabase-js, marked, the QR library and the three fonts are all self-hosted from `/vendor` (Archivo includes the width axis for Archivo Expanded).
- **Design.** `tokens.css`, `base.css`, 12 UI components and an icon set. Each component is keyboard and touch accessible, with targets of at least 44 px.
- **Engine contract.** A reference engine `demo` with analytic tests, and an engine kit that every Wave 1 engine uses. A contract test checks every engine automatically.
- **Shell.** `mountInteractive` with everything in §5.2, plus the error boundary, test hooks and playlist navigation.
- **Auth.** Local mode works end to end. Supabase mode is written to the same API but is untested until H3–H5. There's also a functional sign-in page, onboarding and a privacy statement draft.
- **Supabase.** `supabase/migrations/0001_init.sql`, with apply instructions at the top of the file.
- **Catalog.** A schema and `npm run generate`, which produced 76 catalog fragments, 71 spec stubs and 71 notes stubs from `docs/backlog.json`.
- **Tests.** Unit tests for utilities, the demo engine, the engine contract and repo consistency. Playwright smoke tests run at three sizes, and the acceptance runner is proven on the template's spec (`specs/_demo.md`, 4 checks).
- **Deploy.** CI, a PR template, `render.yaml` (Render's current Blueprint syntax, checked today) and the create-issues script.

## Contract changes and additions (full list in guide §5.10)

These are the ones worth your attention. All are additions; nothing in §5 was removed.

1. **Engine kit (`site/assets/engine-kit.js`).** One shared module provides the fixed-step loop, the 10 Hz outputs, the canvas with DPR capped at 2, theme colours, and axes and labels at 18 px or more. *Why:* 12 agents writing their own animation loops would drift on timing, projector text size and theme handling. The kit makes the §5.1 rules automatic.
2. **`LOCAL_ACCESS_CODES` is now `[{ code, kind }]`** instead of plain strings. I assumed `TTT2026` is the **event** code (Founding Educator) and `CLASS2026` is a **class** code. *Why:* local mode has to know which codes grant the badge, just as the database table does.
3. **Extra auth functions:** `redeemAccessCode` and `deleteAccount`. *Why:* teachers who sign in with Microsoft or Google can still enter the event code (in onboarding) to become Founding Educators, and the privacy statement promises account deletion.
4. **Class-code sessions can't post requests or vote**, unless they redeemed the event code. *Why:* students share class codes, and the request board is for teachers. Teachers at the event who use the code on their card can still request and vote.
5. **Database hardening.** Explicit grants, `founding` can't be set from the browser, and length and value checks are added. *Why:* Supabase is moving new projects to opt-in table exposure, and these follow its current guidance.
6. **Embed mode hides Share, Save and Teacher notes.** *Why:* embeds are what students see in Google Classroom, Canvas and OneNote, and the notes contain the answers. Students keep CSV export.
7. **Engine metadata additions:** `staticSetups`, `stepSize`, `visibleWhen`, and `string` and `list` param types. *Why:* the backlog needs expression inputs (fnplot), root lists (polynomials), and controls that only appear when relevant (drag coefficient when drag is on).

## Not verified yet (needs you or a real account)

- **Supabase mode end to end** (H3–H5): OAuth redirects, the magic-link return (supabase-js with PKCE), anonymous sign-in and `redeem_access_code`. W1-AUTH tests these with you after H3.
- **`delete_my_account()`** deletes from `auth.users` as the function owner. Supabase's docs neither confirm nor forbid this, so try it once with a throwaway account after H3.
- **Render's Node version.** `render.yaml` sets `NODE_VERSION=22` and the repo has `.node-version`. The Render docs I read didn't say which one Render uses, so check the first build log shows Node 22.
- **PR previews** need a Render plan that includes them. The Blueprint asks for them, and the setting does nothing on a plan without them.

## Open questions for you

1. **Duplicate guide.** There is a second, older copy of `IMPLEMENTATION_GUIDE.md` at the repo root (`docs/IMPLEMENTATION_GUIDE.md` is the real one and now has §5.10). OK to delete the root copy so agents don't read a stale guide?
2. **Event vs class code.** Is `TTT2026` = event and `CLASS2026` = class right?
3. **Class codes and requests.** Is it fine that students on class codes can't post requests or vote (point 4 above)?
4. **Privacy draft** (`/privacy.html`). Please read it and give me the contact address to show. Also confirm the wording with the organisers (H7).
5. The master plan's open questions still stand: site name (one value in `config.js`), the UNSW subdomain, and analytics (none are built in).

## Your next human tasks

- **H1 (needed before Wave 1):** create the GitHub repo, then add it as `origin` and push both branches: `git push -u origin main w0/foundations`. Open the PR `w0/foundations` → `main` so CI runs, install `gh` and run `gh auth login`, then protect `main` (require the CI check). Wave 1 agents open PRs, so they need this.
- H2 can happen any time after H1. H3–H5 aren't needed until W1-AUTH reaches Supabase mode.

**To approve:** tell me "Gate A approved" (with answers to the questions, or "use your defaults"). I'll mark the contracts LOCKED in STATUS and start Wave 1.
