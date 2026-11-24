# HSC Interactives Hub: Implementation Guide

This is the "how". `docs/MASTER_PLAN.md` is the "why and what". If they disagree, this guide wins on code and the master plan wins on scope. `docs/backlog.json` is the source of truth for the list of interactives. `docs/STATUS.md` is the source of truth for progress.

---

## 0. How to use this guide (Claude Code)

1. Read `CLAUDE.md`, then `docs/MASTER_PLAN.md` once for context, then this guide.
2. Open `docs/STATUS.md`. The current wave is the first wave with unchecked tasks whose gate is approved.
3. **Wave 0 is sequential and done by one lead session.** It defines the contracts every other agent builds against. Do the W0 tasks in order (§7), then write the Gate A report and stop.
4. **From Wave 1 on, act as the orchestrator** (§13): spawn subagents from `.claude/agents/` in parallel, one task each, each in its own git worktree and branch.
5. Before ending any session, update `docs/STATUS.md` (tick boxes, add PR links, add a line to the log).
6. Anything needing accounts, keys, or settings in GitHub, Render or Supabase is a human task for Luca (§14). Never create accounts, paste secrets, or change those settings yourself.

---

## 1. What we are building

A premium web hub of high-quality interactive simulations for NSW Stage 6 **Mathematics Extension 1 and 2, Physics, and Engineering Studies** teachers. The first audience is teachers at UNSW's Teach the Teachers day. The site sits behind a polished sign-in for the feel; logins and access codes may be shared freely with students. It holds 71 interactive pages and 5 extra catalogue listings that reuse a page with a preset (76 catalogue entries). They are built from 12 shared simulation engines plus a handful of custom pages.

Priority counts (pages): P0 7, P1 43, P2 21. P0 pages are the flagships and go first in every wave.

---

## 2. Non-negotiable rules

1. **Contracts are locked after Gate A.** §5 may only change through a lead task that updates this guide and every affected file in one PR.
2. **One agent, one task, one branch, one worktree, one PR.** No agent pushes to `main`. Only the orchestrator writes `docs/STATUS.md`.
3. **Stay inside your owned paths** (§13.3). Need a change elsewhere? Write a "Contract/engine change request" in your PR description and stop.
4. **Physics before polish.** Every engine's `model.js` is pure (no DOM), deterministic, and unit-tested against analytic answers (§9.1). A wrong number on screen is the worst failure this project can have.
5. **No `eval`, no `new Function`, no remote code.** All libraries are self-hosted under `/vendor`; no CDNs at runtime.
6. **Vanilla only:** plain HTML + ES modules + Canvas 2D / SVG; Three.js only inside the `space3d` engine; KaTeX for maths text. No frameworks, no TypeScript build, no CSS frameworks.
7. **Design system only** (§6): tokens from `tokens.css`; no shadows, gradients, glows or rounded "bubbly" UI; sharp frames. No cyan or blue glowing HUD look anywhere.
8. **Projector-first canvases:** the light projector theme is the default inside simulations; text in canvases is at least 18 CSS px at 1920×1080.
9. **Honesty on screen:** show assumptions ("no air resistance", "g = 10 m/s²", "simplified lift model") in the stage footer.
10. **Copyright:** never copy NESA syllabus text, HSC exam questions or textbook content into the site. Link to NESA; write original questions. Scraped syllabus text stays in the git-ignored `docs/syllabus-reference/`.
11. **No builder reviews its own work.** Reviews are done by a fresh reviewer agent (§12).
12. **Privacy:** no analytics, no tracking, no third-party requests except Supabase. Never store student personal details; classes use access codes.

---

## 3. Stack, dependencies and commands

| Layer | Choice |
| --- | --- |
| Pages | Static HTML, ES modules, Canvas 2D / SVG |
| Maths text | KaTeX (self-hosted) |
| 3D | three.js + OrbitControls + CSS2DRenderer (only in `space3d`) |
| Markdown (teacher notes) | marked (self-hosted ESM) |
| QR codes | qrcode-generator (bundled to ESM with esbuild) |
| Accounts and saved data | Supabase Auth + Postgres (Sydney region), `@supabase/supabase-js` bundled to one ESM file |
| Fonts | Archivo (variable, with width axis, used at 125% width = "Archivo Expanded"), Inter, JetBrains Mono, all self-hosted |
| Tests | `node --test` for engine models; Playwright (Chromium) for e2e, acceptance checks and screenshots |
| Hosting | Render static site, publishing `dist/`; config in `render.yaml` |
| CI | GitHub Actions |

Node 22 LTS. Dependencies: `katex`, `three`, `@supabase/supabase-js`, `marked`, `qrcode-generator`, font packages; devDependencies: `esbuild`, `@playwright/test`. Prefer `@fontsource-variable/*` packages for Inter and JetBrains Mono. For Archivo, check that the package you use includes the `wdth` axis. If it does not, vendor `Archivo[wdth,wght].ttf` from the `google/fonts` GitHub repo (OFL) and convert to woff2.

Commands (defined in W0-01/W0-02):

| Command | Does |
| --- | --- |
| `npm run dev` | Build to `dist/`, watch `site/`, serve on http://localhost:5173 |
| `npm run build` | Clean `dist/`, copy `site/`, merge + validate catalog fragments into `dist/catalog.json`, copy/bundle vendor libs and fonts |
| `npm test` | `node --test tests/engines` |
| `npm run test:e2e` | Playwright smoke + acceptance tests against a built `dist/` |
| `npm run shots [-- <id or page path>] [-- --thumbs]` | Screenshots of every non-planned page (or one id, or a page path such as `dev/engines/particle2d.html#projectile`), plus the sign-in, dashboard, privacy, styleguide and template pages, at 1920×1080, 1180×820, 390×844 into `test-results/shots/<id>/`. `--thumbs` also writes `site/assets/thumbs/<id>.png` |
| `npm run generate [-- --check]` | Create missing catalog fragments, spec stubs and notes stubs from `docs/backlog.json` (idempotent). `--check` exits 1 if anything is out of date (`npm test` runs the same check) |
| `npm run create-issues [-- --apply]` | One GitHub issue per backlog page via `gh` (dry run unless `--apply`) |
| `npm run check` | build + test + test:e2e |

---

## 4. Repository layout

```text
hsc-interactives/
├─ CLAUDE.md
├─ docs/
│  ├─ MASTER_PLAN.md            # exported from the master Claude Doc
│  ├─ IMPLEMENTATION_GUIDE.md   # this file
│  ├─ STATUS.md                 # progress; orchestrator is the only writer
│  ├─ backlog.json              # every page and listing (source of truth)
│  ├─ gates/                    # gate-a.md, gate-b-<subject>.md, gate-c-queue.md
│  └─ syllabus-reference/       # git-ignored scraped NESA text (never deployed)
├─ .claude/agents/              # engine-builder, spec-writer, interactive-builder, reviewer, syllabus-tagger
├─ site/                        # deployed source
│  ├─ index.html                # dashboard (requires session)
│  ├─ signin.html               # premium sign-in (public)
│  ├─ privacy.html              # short privacy statement (public)
│  ├─ assets/
│  │  ├─ tokens.css  base.css
│  │  ├─ config.js  auth.js  shell.js  state.js  csv.js  format.js
│  │  ├─ ui/                    # DOM component factories
│  │  ├─ signin/                # sign-in page scripts and background animation
│  │  ├─ hub/                   # dashboard scripts
│  │  ├─ engines/<name>/        # model.js, view.js, index.js (+ data.json where needed)
│  │  ├─ engines/custom/<id>/   # engines for custom pages, same contract
│  │  └─ thumbs/<id>.png        # card thumbnails (from npm run shots)
│  ├─ interactives/<folder>/<slug>.html   # folder: maths-ext1 | maths-ext2 | physics | engineering
│  ├─ catalog/<id>.json         # one fragment per page or listing; _schema.json
│  ├─ content/notes/<id>.md     # teacher notes
│  ├─ dev/                      # styleguide.html, engines/<name>.html demo pages (deployed, unlinked)
│  └─ vendor/                   # generated by build, git-ignored
├─ specs/_TEMPLATE.md  specs/<id>.md
├─ supabase/migrations/0001_init.sql
├─ scripts/                     # build.mjs dev.mjs vendor.mjs generate-from-backlog.mjs create-issues.mjs shots.mjs
├─ tests/engines/<name>.test.mjs  tests/e2e/*.spec.mjs
├─ render.yaml
└─ .github/workflows/ci.yml  .github/pull_request_template.md
```

Page path rule: id `phy-projectile-lab` → `/interactives/physics/projectile-lab.html` (prefix `me1` → `maths-ext1`, `me2` → `maths-ext2`, `phy` → `physics`, `eng` → `engineering`). All site URLs are root-absolute (`/assets/...`).

---

## 5. Contracts (locked at Gate A)

### 5.1 Engine module

Every engine, including custom ones, lives in `site/assets/engines/<name>/` with three files:

- `model.js`: pure maths and physics. No DOM, no timers, no randomness except a seeded PRNG passed in. Importable by Node for tests.
- `view.js`: drawing only (Canvas 2D or SVG; Three.js for `space3d`). Reads model state; never changes physics.
- `index.js`: wires them together and exports the public API below.

```js
// site/assets/engines/<name>/index.js
export const meta = {
  name: 'particle2d',
  version: '1.0.0',
  setups: ['projectile', 'shm', /* ... */],      // scenario names this engine supports
  params: {                                       // every tunable input, per setup where needed
    speed: { type: 'number', label: 'Launch speed', unit: 'm/s', min: 0, max: 60, step: 0.5, default: 20, setups: ['projectile'] },
    drag:  { type: 'enum', label: 'Air resistance', options: [['none','None'],['linear','kv'],['quadratic','kv²']], default: 'none' },
    trail: { type: 'boolean', label: 'Show trail', default: true },
  },
  outputs: {                                      // live readouts
    range: { label: 'Range', unit: 'm', sigfigs: 3, setups: ['projectile'] },
  },
};

/**
 * @param {HTMLElement} stage  element the engine owns; it creates its own canvas/svg inside
 * @param {{ setup: string, params: object, theme: 'projector'|'dark', onEvent: (type, payload) => void }} opts
 */
export function create(stage, opts) {
  return {
    setParams(partial) {},   // merge, clamp/validate against meta.params, redraw; never auto-plays
    getParams() {},          // full current params (plain JSON)
    play() {}, pause() {}, isPlaying() {},
    step(n = 1) {},          // advance n fixed simulation steps, then redraw
    reset() {},              // back to t = 0 with current params
    isComplete() {},         // true when the scenario has ended (landed, stopped, finished sampling)
    getOutputs() {},         // { range: 40.8, ... } in SI units, unrounded
    getData() {},            // { columns: ['t (s)', 'x (m)', ...], rows: [[...], ...] } for CSV
    setTheme(theme) {},
    resize() {},             // called by the shell on container resize
    destroy() {},            // stop loops, remove listeners and DOM
  };
}
```

Events through `onEvent`: `'tick'` (each frame, payload `{ t }`), `'outputs'` (throttled to 10 Hz), `'complete'`, `'error'` (payload `{ message }`).

Rules: fixed simulation timestep with an accumulator (simulation speed independent of frame rate); a `timeScale` param (0.25–2) on time-based engines; cap devicePixelRatio at 2; pause the loop when `document.hidden`; static engines (no time evolution) treat `play/pause/step` as no-ops and `isComplete()` as `true`.

### 5.2 Interactive page

Every page is a thin HTML file that mounts the shell. Copy `site/interactives/_template.html`.

```html
<!doctype html>
<html lang="en-AU" data-theme="projector">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Projectile lab · HSC Interactives Hub</title>
  <link rel="stylesheet" href="/assets/base.css">
</head>
<body>
  <script type="module">
    import { mountInteractive } from '/assets/shell.js';
    mountInteractive({
      id: 'phy-projectile-lab',                                  // = catalog fragment id
      engine: () => import('/assets/engines/particle2d/index.js'),
      setup: 'projectile',
      presets: {                                                 // 'default' is required
        default:       { speed: 20, angle: 45, drag: 'none', g: 9.8 },
        'me1-vectors': { speed: 20, angle: 30, drag: 'none', g: 9.8, showComponents: true },
        'me2-drag':    { speed: 30, angle: 45, drag: 'quadratic', k: 0.02, g: 9.8 },
      },
      controls: ['speed', 'angle', 'drag', 'g'],                 // param keys, in display order
      readouts: ['range', 'maxHeight', 'flightTime'],
      assumptions: ['Point mass', 'Flat ground'],                // shown in the stage footer
      prompts: [                                                 // 3 to 5, predict-observe-explain
        { kind: 'predict', text: 'Which launch angle gives the greatest range with no air resistance?' },
        { kind: 'observe', text: 'Set 30° and 60°. Compare the ranges.' },
        { kind: 'explain', text: 'Why are complementary angles paired?' },
      ],
      notes: '/content/notes/phy-projectile-lab.md',
    });
  </script>
</body>
</html>
```

`mountInteractive` (in `shell.js`) does, in order:
1. `requireSession()` unless `?embed=1`.
2. Build the layout (§6.3): header, tag strip (from `/catalog.json`), stage, control panel, readouts, toolbar, try-this panel, notes drawer.
3. Load the engine; resolve params as `presets.default` ← `presets[?preset]` ← URL params (§5.5); create the engine.
4. Generate controls from `meta.params` for the listed keys; generate readouts from `meta.outputs`.
5. Wire the toolbar: play/pause, step, reset, fullscreen/presenter (`P`), theme toggle, share (copy link + QR modal), save scenario (signed-in data API), export CSV.
6. Keyboard: Space = play/pause, `.` = step, `R` = reset, `F` = fullscreen, `P` = presenter mode, `?` = shortcuts.
7. Sync params to the URL (debounced 300 ms, `history.replaceState`).
8. Error boundary: an engine error shows a calm in-stage message with a reset button, never a blank stage.
9. With `?test=1`, expose test hooks (§5.8).

### 5.3 Catalog fragment

`site/catalog/<id>.json`, validated against `site/catalog/_schema.json` at build. The build fails on an invalid fragment or a duplicate id.

```json
{
  "id": "phy-projectile-lab",
  "kind": "page",
  "title": "Projectile lab",
  "summary": "Launch angle and speed, max height, range, velocity components, optional air resistance.",
  "subject": "phy",
  "engine": "particle2d",
  "setup": "projectile",
  "priority": "P0",
  "status": "planned",
  "path": "/interactives/physics/projectile-lab.html",
  "syllabus": [
    { "course": "Physics", "version": "2017", "area": "Module 5: Advanced Mechanics", "outcomes": [], "verified": false },
    { "course": "Physics", "version": "2025", "focusArea": "Advanced mechanics", "year": 12, "outcomes": [], "verified": false }
  ],
  "thumbnail": "/assets/thumbs/phy-projectile-lab.png"
}
```

- `kind`: `page` or `listing`. A listing adds `listingOf` (page id) and `preset`, and its `path` carries `?preset=`.
- `status`: `planned` → `building` → `review` → `live`. The dashboard shows `planned`/`building`/`review` as "Coming soon"; only `live` cards open.
- `subject`: `me1` | `me2` | `phy` | `eng`. Syllabus tag fields: `course`, `version`, `area` (old-syllabus module or new area of study), `focusArea`, `subtopic`, `year`, `outcomes` (codes only, e.g. `"ME1-12-05"`), `verified`.

### 5.4 Spec file

`specs/<id>.md`, from `specs/_TEMPLATE.md`. Specs are written in Wave 1 and approved at Gate B. Each spec ends with a fenced `acceptance` block (JSON) that the e2e acceptance runner executes:

````markdown
```acceptance
[
  { "name": "45° range, no drag", "params": { "speed": 20, "angle": 45, "drag": "none", "g": 9.8 },
    "run": "complete", "expect": { "range": { "value": 40.816, "relTol": 0.001 } } },
  { "name": "max height", "params": { "speed": 20, "angle": 45, "drag": "none", "g": 9.8 },
    "run": "complete", "expect": { "maxHeight": { "value": 10.204, "relTol": 0.001 } } }
]
```
````

`run` is `"complete"` (step until `isComplete()`, max 200 000 steps), `{ "steps": N }`, or `"static"`. `expect` keys are output names; use `relTol` or `absTol`. Every expected number must come from an analytic formula or a hand calculation shown in the spec.

### 5.5 URL state

`?preset=<name>&<param>=<value>&...` plus optional `embed=1`, `theme=dark|projector`, `test=1`, `present=1`. Numbers are plain decimals; booleans `1`/`0`; enums by value; arrays (rare) as comma lists. Unknown keys are ignored. Invalid values are clamped to `meta.params` ranges, and a quiet toast says so.

### 5.6 Auth and data API (`site/assets/auth.js`)

```js
export async function getSession()          // → { user: { id, kind: 'oauth'|'email'|'code'|'local', email, name }, founding } | null
export async function requireSession()      // no session → location = '/signin.html?next=' + encodeURIComponent(path+query); no-op when ?embed=1
export async function signInWithProvider(p) // 'azure' | 'google'
export async function signInWithEmail(email)// magic link
export async function signInWithCode(code)  // anonymous session + redeem_access_code; false if invalid
export async function signOut()
export async function getProfile()          // { displayName, school, subjects: ['me1','phy'], founding }
export async function saveProfile(p)
export async function listScenarios(interactiveId?)  // [{ id, interactiveId, title, params, createdAt }]
export async function saveScenario({ interactiveId, title, params })
export async function deleteScenario(id)
export async function listPlaylists(); export async function savePlaylist(p); export async function deletePlaylist(id)
export async function listRequests();  export async function createRequest({ subject, topic, details }); export async function toggleVote(requestId)
```

`site/assets/config.js`:

```js
export const SITE_NAME = 'HSC Interactives Hub';      // placeholder until Luca names it
export const AUTH_MODE = 'local';                     // 'local' until Supabase is configured (human task H3)
export const SUPABASE_URL = '';
export const SUPABASE_ANON_KEY = '';                  // public anon key only; never the service_role key
export const LOCAL_ACCESS_CODES = [{ code: 'TTT2026', kind: 'event' }];   // one shared code (see §5.10)
```

**Local mode** stores the session and all data in `localStorage` under `hsc:*` keys, accepts any provider click as a signed-in local user, accepts `LOCAL_ACCESS_CODES`, and simulates email by signing in immediately. Every feature must work end to end in local mode, so agents never need credentials.

### 5.7 Supabase schema (starting point for `supabase/migrations/0001_init.sql`)

```sql
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text, school text,
  subjects text[] not null default '{}',
  founding boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.saved_scenarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  interactive_id text not null, title text not null, params jsonb not null,
  created_at timestamptz not null default now()
);
create table public.playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null, items jsonb not null default '[]',   -- [{ interactiveId, params?, note? }]
  created_at timestamptz not null default now()
);
create table public.requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  subject text not null, topic text not null, details text,
  created_at timestamptz not null default now()
);
create table public.votes (
  request_id uuid not null references public.requests on delete cascade,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  primary key (request_id, user_id)
);
create table public.access_codes (
  code text primary key,
  kind text not null check (kind in ('event', 'class')),
  active boolean not null default true
);

alter table public.profiles        enable row level security;
alter table public.saved_scenarios enable row level security;
alter table public.playlists       enable row level security;
alter table public.requests        enable row level security;
alter table public.votes           enable row level security;
alter table public.access_codes    enable row level security;   -- no policies: only the function reads it

create policy "own profile"   on public.profiles        for all using (id = auth.uid())      with check (id = auth.uid());
create policy "own scenarios" on public.saved_scenarios for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own playlists" on public.playlists       for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "read requests" on public.requests for select to authenticated using (true);
create policy "add request"   on public.requests for insert to authenticated with check (user_id = auth.uid());
create policy "drop own request" on public.requests for delete using (user_id = auth.uid());
create policy "read votes"    on public.votes for select to authenticated using (true);
create policy "own votes"     on public.votes for insert to authenticated with check (user_id = auth.uid());
create policy "unvote"        on public.votes for delete using (user_id = auth.uid());

create function public.redeem_access_code(p_code text) returns boolean
language plpgsql security definer set search_path = public as $$
declare k text;
begin
  select kind into k from access_codes where code = upper(trim(p_code)) and active;
  if k is null then return false; end if;
  insert into profiles (id, founding) values (auth.uid(), k = 'event')
  on conflict (id) do update set founding = profiles.founding or excluded.founding;
  return true;
end $$;
revoke all on function public.redeem_access_code(text) from public;
grant execute on function public.redeem_access_code(text) to authenticated;
```

Verify against current Supabase docs when implementing (anonymous sign-ins, provider names `azure` and `google`, and that anonymous users carry the `authenticated` role).

### 5.8 Test hooks

With `?test=1`, the shell sets:

```js
window.__hsc = {
  ready,                     // Promise resolved after the engine is created
  setParams(p), getParams(),
  step(n), runUntilComplete(maxSteps = 200000),
  getOutputs(), getData(),
  errors: [],                // engine 'error' events
};
```

### 5.9 Teacher notes (`site/content/notes/<id>.md`)

Fixed headings, in this order: `## Misconceptions`, `## 10-minute lesson flow`, `## Try this: answers`, `## Original HSC-style question` (with `### Worked solution`), `## Assumptions and limits`, `## Syllabus links` (links to NESA pages, never quoted text).

Maths in notes: `$...$` inline and `$$...$$` display (KaTeX); `\$` for a literal dollar. `npm test` checks the headings of every notes file that is not a stub.

### 5.10 Wave 0 additions (part of the contract from Gate A)

Wave 0 made these additions and clarifications while building §5.1–§5.9. Each is backwards compatible with the text above; `docs/gates/gate-a.md` lists them with reasons.

**Engines (§5.1)**
- **Engine kit.** `site/assets/engine-kit.js` (lead-owned) gives every engine the §5.1 rules: `createLoop` (fixed step + accumulator, `timeScale` clamped 0.25–2, pauses while `document.hidden`), `createEmitter` (`outputs` throttled to 10 Hz, plus `outputsNow`), `createSurface` (canvas, DPR capped at 2), `readPalette`, `font`, `stageFontPx`, `label`, `arrow`, `niceTicks`, `viewport`, `axisMargins`, `drawAxes` (with `layer: 'under' | 'over'`), `pointerDrag`, `ensureFonts`. Engines must use the loop and emitter rather than their own.
- Engine files import shared modules by **relative** path (`'../../engine-kit.js'`, `'../../state.js'`) so Node can import `index.js` for contract tests. Nothing may touch the DOM at import time.
- `meta.staticSetups` (optional): setups with no time evolution; the shell hides play, step and reset for them.
- `meta.stepSize` (optional, default 1): fixed steps per press of the shell's Step button.
- Param types: `number` (`min`, `max`, `step`, optional `integer`), `boolean`, `enum` (`options: [[value, label], …]`, values are strings), `string` (`maxLength`, default 200; optional `pattern`), `list` (numbers; optional `min`, `max`, `minItems`, `maxItems`). Any param may have `setups`, `visibleWhen: { key: value | [values] }`, `help`, and for enums `widget: 'segmented' | 'select'` (default: segmented for up to three options). Param keys are camelCase and must not be a reserved URL key (`preset`, `embed`, `theme`, `test`, `present`, `playlist`, `i`).
- Outputs may have `setups`, `integer: true` (counts: shown as whole numbers with grouping, never "369.0") or `siPrefix: true` (the readout scales the unit, e.g. 0.0048 m shows as "4.80 mm"). `unit` is required (`''` when dimensionless).
- Any param's `help` text is shown under its control and linked with `aria-describedby`.
- The stage element is `role="group"` with `aria-roledescription="simulation"` and the `aria-label` (§6.7 said `role="img"`, which hides interactive children such as editors and in-stage buttons). Engines may put focusable controls inside the stage.
- Event `'params'` (no payload needed): an engine that changes its own params (a dragged point or handle) emits it after `setParams`-equivalent changes, and the shell resyncs the controls, the URL and the share link.
- `drawAxes` options `xAxisAt: 'zero' | 'bottom'` and `yAxisAt: 'zero' | 'left'` pin an axis to the plot edge (histograms, time series); the default places each axis at zero when zero is in range.
- `step(n)` stops early when the scenario completes. Optional `describe()` returns a sentence for the stage's `aria-label`.
- `setTheme(theme)`: the shell sets `data-theme` on `<html>` first; engines re-read colours with `readPalette`.
- `tests/engines/_contract.test.mjs` checks every engine automatically: files and exports, meta shape, valid defaults, `timeScale` on time-based engines, a pure `model.js`, and no `eval`/`Function`/remote imports.

**Pages (§5.2)**
- Optional config: `title` (used only when the id has no catalog entry) and `presetLabels: { name: 'Label' }` for the Scenario menu (shown when there is more than one preset).
- Extra keys: `T` toggles the stage theme, `N` opens teacher notes. The panel's **Reset values** button restores the current preset.
- Embed mode hides share, save and teacher notes (the embed view is for students); CSV stays.
- `?playlist=<id>&i=<n>` navigation is implemented in the shell header, using `listPlaylists()` and the catalog.
- Saved scenarios store `engine.getParams()` only. `state.js` exports `genericQuery(params)` and `withQuery(path, query)` for building links when the engine's meta isn't loaded (dashboard).

**Catalog (§5.3)**
- `dist/catalog.json` is `{ generated, count, entries }`, sorted by subject, priority, then title.
- `setup` is `null` for custom pages. A syllabus tag may carry `url` (a NESA page); otherwise the tag strip links to the course page. `thumbnail` is added by the page's task once `npm run shots -- <id> --thumbs` has written it.
- Files whose names start with `_` in `site/catalog/` are not fragments.

**Specs and acceptance (§5.4)**
- A check may set `"preset": "<name>"` to load that preset first. Every param in `params` must be accepted unchanged by the engine (a clamp fails the check), and `"run": "complete"` must actually complete.
- Spec frontmatter from `npm run generate` also lists `page` and the `listings` whose presets the page must define.
- `specs/_demo.md` is the reference spec for `_template.html`; the runner always includes it.

**Auth (§5.6, §5.7)**
- `LOCAL_ACCESS_CODES` is `[{ code, kind }]`, mirroring the `access_codes` table. There is **one shared access code, `TTT2026`**, for teachers and their classes (Luca, 25 Nov). It also gives the Founding Educator badge. The `kind` column stays so more codes could be added later without a schema change.
- Extra exports: `redeemAccessCode(code)` (a teacher signed in with Microsoft or Google enters the access code for the Founding Educator badge), `deleteAccount()`, `safeNext(path)`, `onAuthChange(fn)`, `authMode`.
- `signInWithProvider(p, { next })` resolves `{ signedIn }` (local) or `{ redirecting }` (Supabase). `signInWithEmail(email, { next })` resolves `{ signedIn }` (local) or `{ sent }` (Supabase). Errors are thrown with messages safe to show a teacher.
- Session kinds in local mode match Supabase (`oauth`, `email`, `code`).
- Any signed-in session, including an access-code session, can create requests and vote.
- The migration adds explicit grants (no `anon` access), column-level grants so `founding` is never writable from the browser, length and value checks, indexes, `(select auth.uid())` in policies, `search_path = ''` on security-definer functions, and `delete_my_account()`.

**Test hooks (§5.8)**: `runUntilComplete` returns `{ steps, complete }`; `window.__hsc.meta` gives `{ name, version, setup }`.

---

## 6. Design system

### 6.1 Tokens (`site/assets/tokens.css`)

```css
:root {
  /* chrome: graphite, matte, flat */
  --c-bg: #0F1012;  --c-surface: #17181B;  --c-surface-2: #1F2024;  --c-line: #2C2E33;
  --c-text: #ECEDEE; --c-muted: #9DA1A8;  --c-accent: #FF4F00;   --c-on-accent: #0F1012;
  --c-danger: #E5484D; --c-ok: #3DD68C;
  /* projector canvas (light) */
  --k-bg: #F6F6F4;  --k-ink: #121316;  --k-grid: #DADAD6;  --k-axis: #6B6E74;
  --k-accent: #FF4F00; --k-accent-text: #B83A00;            /* use accent-text for small text on light */
  /* data series, colour-blind aware; accent first */
  --s1: #FF4F00; --s2: #0072B2; --s3: #009E73; --s4: #CC79A7; --s5: #121316; --s6: #E69F00;
  /* type */
  --f-display: 'Archivo', system-ui, sans-serif;   /* use with font-stretch: 125% */
  --f-body: 'Inter', system-ui, sans-serif;
  --f-mono: 'JetBrains Mono', ui-monospace, monospace;
  --t-12: 12px; --t-14: 14px; --t-16: 16px; --t-18: 18px; --t-24: 24px; --t-32: 32px; --t-48: 48px; --t-72: 72px;
  /* space (4 px base) */
  --sp-1: 4px; --sp-2: 8px; --sp-3: 12px; --sp-4: 16px; --sp-6: 24px; --sp-8: 32px; --sp-12: 48px; --sp-16: 64px;
  /* frames */
  --radius: 0; --radius-input: 2px; --border: 1px solid var(--c-line);
  --ease: cubic-bezier(.2,.8,.2,1); --dur: 180ms;
}
[data-theme="dark"]  { /* canvas uses chrome colours: --k-bg: var(--c-surface) etc. */ }
```

Rules: no `box-shadow`, no gradients, no glow, no blur. Focus ring: 2px solid `--c-accent` with a 2px offset. Hover states change border or text colour only.

### 6.2 Typography

- Display (wordmark, page titles, hero numbers): Archivo, `font-stretch: 125%`, weight 700–800, uppercase for the wordmark and section labels with letter-spacing 0.04em.
- Body and controls: Inter 400/500/600.
- Data (readouts, tag strip, units, codes): JetBrains Mono 500, tabular numbers.
- In canvases: Inter for labels (≥ 18 px at 1920×1080), JetBrains Mono for numbers, KaTeX for formulas.

### 6.3 Interactive page layout

- **Header (56 px, graphite):** wordmark left, breadcrumb (`Physics / Projectile lab`), user menu right (name, Founding Educator badge in orange mono, sign out).
- **Tag strip (32 px):** mono chips, e.g. `PHYSICS · 2017 M5 ADVANCED MECHANICS · 2025 ADVANCED MECHANICS`, with outcome codes when verified.
- **Main (≥ 1200 px):** stage on the left (flex, aim for 16:9, projector theme), control panel on the right (340 px, graphite). 900–1199 px: controls under the stage in two columns. < 900 px: stacked.
- **Readouts row** under the stage: large mono values with units.
- **Toolbar** (top-right of the stage): play/pause, step, reset, share, save, CSV, theme, fullscreen.
- **Try this:** collapsible panel under the controls. **Teacher notes:** right slide-over drawer.
- **Stage footer:** assumptions in small text.
- **Presenter mode** (`P`): hides header and tag strip, enlarges controls, keeps readouts.
- **Embed mode** (`?embed=1`): no header, a slim 28 px bar with the wordmark linking to the full page; no sign-in.

### 6.4 Sign-in page (`signin.html`): the premium front door

- Full-bleed `--c-bg`. Behind everything, a live canvas animation drawn in `--c-accent` at about 35% opacity: slope-field streamlines drifting slowly, or a family of projectile arcs. Self-contained in `assets/signin/background.js` (no engine dependency). With `prefers-reduced-motion`, show one static frame.
- Left (desktop) / top (mobile): wordmark `SITE_NAME` in Archivo Expanded 800, 48–72 px, uppercase. A one-line promise underneath in Inter, e.g. "Interactive simulations for Extension Maths, Physics and Engineering Studies." Small mono line: `NSW STAGE 6 · 2017–2026 SYLLABUSES`.
- Right / below: a sharp-framed card (`--c-surface`, 1px `--c-line`, no radius):
  - `Continue with Microsoft` and `Continue with Google` (full-width, secondary style, provider marks as plain monochrome glyphs)
  - divider `OR`
  - email field + `Email me a sign-in link` (primary, orange)
  - divider `HAVE AN ACCESS CODE?`
  - code field (mono, uppercase) + `Enter`
  - error and success messages inline, never alerts.
- Footer: "Built by Luca Brighenti for UNSW Teach the Teachers 2026 · Privacy". No NESA or Department logos.
- After sign-in: if no profile subjects and not a code user, show onboarding (pick subjects: chips for the four subjects; optional school; display name). Then go to `next` or `/`.
- Micro-interactions: 180 ms fades; buttons show a progress state; nothing bounces.

### 6.5 Dashboard (`index.html`)

- Greeting row: `GOOD MORNING, <NAME>` (Archivo Expanded), Founding Educator badge if set.
- Subject chips (from profile, editable) filter the grid; search box; filters for syllabus version (2011, 2017, 2024, 2025, 2026), focus area, and status.
- Card grid: thumbnail (or a generated placeholder pattern in graphite and orange lines for coming-soon items), title, subject label, tag line in mono, a `LIVE` or `COMING SOON` badge, priority hidden from users.
- Side column (desktop): My saved scenarios (open, copy link, QR, delete); My playlists; Requests (list sorted by votes, vote toggle, "Request an interactive" form).
- Empty states written in a friendly voice; no lorem ipsum anywhere.

### 6.6 Drawing rules inside the stage

- Projector theme: background `--k-bg`, grid `--k-grid` 1 px, axes `--k-axis` 1.5 px, main object/curve `--s1` 3 px, secondary series `--s2…` 2.5 px.
- Vectors: arrows with filled heads, labelled with symbol and magnitude (`v = 20.0 m/s`).
- Tension/compression and +/−: colour **plus** a second cue (solid vs dashed, T/C label, +/− glyph). Never colour alone.
- Units on every axis title and readout. Default 3 significant figures (`format.js`).
- No decorative animation on the stage; motion means physics.

### 6.7 Accessibility and performance

- WCAG 2.2 AA for chrome text contrast; all controls keyboard-operable with visible focus; touch targets ≥ 44 px.
- Stage has `role="img"` and an `aria-label` describing the current scenario; readouts are text in an `aria-live="polite"` region, throttled to 1 Hz.
- Respect `prefers-reduced-motion` (no auto-play; animations only on user action).
- Budget: each page's own JS (excluding shared vendor files) under 150 KB; 60 fps on a mid-range laptop; first render under 2 s on school Wi-Fi.

---

## 7. Wave 0: Foundations (lead session, sequential)

Branch: work on `w0/foundations` and open one PR at the end (or a few stacked PRs). Each task lists what "done" means.

- **W0-01 Repo scaffold.** `package.json` (`"type": "module"`, Node ≥ 22), scripts from §3, `.gitignore` (`node_modules`, `dist`, `test-results`, `site/vendor`, `docs/syllabus-reference`), `.editorconfig`, `LICENSE` (MIT for code), a short `README.md` (points to `docs/`; states teacher notes and specs are CC BY 4.0). Done: `npm ci` succeeds.
- **W0-02 Build, vendor and dev scripts.** `scripts/build.mjs`, `scripts/vendor.mjs` (copy KaTeX ESM + CSS + fonts; three.module.js + OrbitControls + CSS2DRenderer; esbuild-bundle supabase-js and qrcode-generator to ESM; marked ESM; the three font families as woff2 + `@font-face` CSS), `scripts/dev.mjs` (Node `http` server on 5173 serving `dist/`, `fs.watch` on `site/` with incremental copy and catalog re-merge; correct MIME types; no extra dependencies). Done: `npm run dev` serves the site, and an edit in `site/` appears on refresh.
- **W0-03 Tokens, base CSS, fonts, styleguide.** `tokens.css`, `base.css` (reset, typography, layout primitives), `site/dev/styleguide.html` showing colours, type scale, every UI component, both themes. Done: styleguide matches §6.
- **W0-04 UI components** in `site/assets/ui/`: slider (with number entry and unit), toggle, segmented control, select, button (primary, secondary, ghost, icon), chip, readout, panel, drawer, modal, toast, QR modal. Plain DOM factory functions, keyboard and touch accessible. Done: all shown on the styleguide.
- **W0-05 Utilities.** `state.js` (§5.5), `csv.js` (RFC 4180, UTF-8 BOM for Excel, filename `<id>-<yyyymmdd-hhmm>.csv`), `format.js` (sig figs, SI prefixes, units, angle display). Unit tests in `tests/engines/_utils.test.mjs`.
- **W0-06 Reference engine `demo`.** A sine wave y = A sin(2πft + φ) with play/pause/step, outputs (period, current y), `getData`, both themes, `model.js` tests (period = 1/f exactly; y at known t). This is the golden example engine builders copy.
- **W0-07 Shell.** `shell.js` implementing §5.2 fully, plus `site/interactives/_template.html` using the demo engine and `site/content/notes/_template.md`. Done: template page passes every item in §5.2 by hand and via a smoke test.
- **W0-08 Auth (functional, plain styling).** `config.js`, `auth.js` with complete local mode and Supabase mode written to §5.6 (untested until H3), route guard, functional `signin.html`, onboarding modal, `privacy.html` (draft text for Luca to approve). Premium styling is W1-AUTH.
- **W0-09 Supabase migration.** `supabase/migrations/0001_init.sql` from §5.7, and a comment block at the top explaining how Luca applies it (Supabase SQL editor or CLI).
- **W0-10 Catalog and generation.** `site/catalog/_schema.json` (JSON Schema for §5.3); `scripts/generate-from-backlog.mjs` creates any missing `site/catalog/<id>.json`, `specs/<id>.md` (from `specs/_TEMPLATE.md`, frontmatter filled from the backlog) and `site/content/notes/<id>.md` stub for every backlog entry. It never overwrites an existing non-stub file. Run it and commit the output. Done: 76 fragments, 71 spec stubs.
- **W0-11 Dashboard v0.** `index.html` + `assets/hub/` reading `/catalog.json`: card grid grouped by subject, coming-soon badges, search and subject filter. Polish is W1-HUB.
- **W0-12 Tests.** `node --test` wired; Playwright config with projects `desktop` 1920×1080, `tablet` 1180×820, `phone` 390×844; `tests/e2e/smoke.spec.mjs` (sign in with a local access code → dashboard → template page runs; zero console errors); `scripts/shots.mjs` + `npm run shots`.
- **W0-13 Acceptance runner.** `tests/e2e/acceptance.spec.mjs`: for every catalog page with status `review` or `live`, parse its spec's `acceptance` block and check it through `window.__hsc` (§5.8). Add one acceptance block to the template's spec to prove it works.
- **W0-14 CI and GitHub templates.** `.github/workflows/ci.yml` (checkout, setup-node 22 with npm cache, `npm ci`, build, test, Playwright install chromium, e2e, upload `test-results/shots` as an artifact), `.github/pull_request_template.md` (§12 checklist), `scripts/create-issues.mjs` (uses `gh`; one issue per backlog page with labels `subject:*`, `engine:*`, `priority:*`, `wave:2`; `--dry-run` default).
- **W0-15 Deploy config.** `render.yaml`: one static site, build `npm ci && npm run build`, publish `./dist`, pull request previews on if the plan allows. Check the current Render Blueprint syntax before writing it.
- **W0-16 Gate A report.** `docs/gates/gate-a.md`: what exists, exactly how Luca checks it (commands, URLs, what to click), contract deviations with reasons, open questions. Tick W0 in STATUS. **Stop and ask Luca to review Gate A.**

---

## 8. Gate A (Luca)

Approve when all are true:
- [ ] `npm run dev` → `/signin.html` works with access code `TTT2026` (local mode) and lands on the dashboard.
- [ ] Dashboard lists all 76 entries as Coming soon, grouped by subject, with search and filter.
- [ ] `/interactives/_template.html` runs the demo engine: controls, readouts, URL state, share + QR, CSV, theme toggle, presenter mode, notes drawer, try-this panel.
- [ ] `/dev/styleguide.html` looks like the design language (graphite, #FF4F00, Archivo Expanded, Inter, JetBrains Mono, flat, sharp).
- [ ] CI is green on the Wave 0 PR and screenshots are attached as an artifact.
- [ ] Contract deviations in `gate-a.md` are acceptable.

On approval the orchestrator marks Gate A approved and **Contracts: LOCKED** in STATUS.

---

## 9. Wave 1: parallel tracks

All Wave 1 tasks start after Gate A and run in parallel.

### 9.1 Engines (12 tasks: `W1-E-<name>`, role `engine-builder`)

Each task owns `site/assets/engines/<name>/**`, `tests/engines/<name>.test.mjs` and `site/dev/engines/<name>.html` (a bare demo page with a setup switcher). Done = every listed test passes, every setup in the coverage table runs in the demo page, and both themes look right.

| Engine | Must implement | Analytic tests (tolerance) |
| --- | --- | --- |
| `particle2d` | RK4, fixed dt (default 1/240 s), accumulator; forces: uniform gravity, linear drag −kv, quadratic drag −k\|v\|v, spring, uniform E field, uniform B field ⊥ plane (q v × B), central gravity GM/r², kinetic friction on a surface; trails; live graphs (s-t, v-t, a-t); velocity component arrows; collision resolution with coefficient of restitution | Projectile v=20, θ=45°, g=9.8: range 40.816 m, H 10.204 m, T 2.886 s (0.1%) · energy drift < 1e-4 over 10 s (no drag) · SHM m=1, k=4: period π (0.1%) · linear drag m=1, k=0.5: v_t 19.6 m/s (0.5%) · quadratic drag m=1, k=0.1: v_t 9.899 m/s (0.5%) · circular orbit GM=1, r=1, v=1: period 2π (0.5%), radius within 0.1% · charged particle m=q=1, B=2, v=4: radius 2 (0.5%) · braking v0=20, μ=0.7, g=10: 28.571 m (0.5%) · 1D elastic equal masses swap velocities (1e-9) |
| `statics` | Pin-jointed truss: joints, members, pin and roller supports, joint loads; solve 2J×2J system (Gaussian elimination, partial pivoting); determinacy check m + r vs 2j (report mechanism or indeterminate, don't solve); beams (simply supported, cantilever; point loads, UDL; reactions, SFD, BMD, σ = My/I); concurrent forces (resultant, equilibrant, force polygon, three-force rule); moments with selectable sign convention (engineering default clockwise positive); block on an incline with μs, μk, applied force | Equilateral truss, apex load P: reactions P/2; inclined members −0.5774P (compression); base +0.2887P (tension) (1e-9) · simply supported central P: M_max = PL/4; UDL w: wL²/8 · cantilever end load: root moment PL · block slips iff tan θ > μs · square frame without diagonal → mechanism |
| `statsim` | Seeded PRNG (mulberry32); Bernoulli, binomial, uniform, exponential, normal (Box–Muller) samplers; sample means of size n; fixed-bin histograms; pmf/pdf overlays; radioactive decay grid (per-step decay probability) | Same seed → identical sequence · binomial n=20, p=0.3, 1e5 draws: mean 6 (1%), variance 4.2 (3%) · exponential λ=1, n=30, 2e4 sample means: mean 1 (1%), SD 0.1826 (3%) · decay with p = 1 − 2^(−1/H): half remain after H steps (2%, N = 1e5) |
| `argand` | Complex add/mul/div/pow, modulus, principal arg (−π, π], conjugate, nth roots; draggable points; vectors from origin; de Moivre power spiral; regular polygon of roots; loci shading via per-pixel test on an offscreen grid with analytic boundary curves where possible (circle, ray, perpendicular bisector, and inequalities) | Roots of unity n=7 sum to 0 (1e-12) · arg(−1)=π, arg(−i)=−π/2 · (cos θ + i sin θ)^5 = cos 5θ + i sin 5θ (1e-12) · \|z₁z₂\| = \|z₁\|\|z₂\| |
| `aero` | Teaching lift model: C_L = 2πα (+C_L0) up to α_stall (default 15°), smooth post-stall fall, labelled as simplified; C_D = C_D0 + k·C_L² (+ post-stall rise); force balance for level, climb and descent (L = W cos γ, T = D + W sin γ); stall speed; L/D; ISA troposphere; pitot-static airspeed; altimeter from static pressure; g selectable (engineering preset 10) | ISA sea level ρ = 1.225 kg/m³ (0.1%) · ISA 11 000 m: T 216.65 K, p 22 632 Pa (0.5%) · level flight L = W (1e-9) · climb T − D − W sin γ = 0 · V_s = √(2W/(ρ S C_Lmax)) · (L/D)max = 1/(2√(k·C_D0)) at C_L = √(C_D0/k) |
| `wave` | N-slit intensity with single-slit envelope, screen mapping y = L tan θ, wavelength → colour; travelling and standing waves; superposition; open/closed pipe harmonics; beats; Doppler (moving source and observer); AM, FM and PM waveforms | Fringe spacing λL/d for λ=600 nm, d=0.25 mm, L=2 m: 4.8 mm (0.5%) · grating 600 lines/mm, 500 nm: first order 17.46° (0.01°) · beats 440 + 444 Hz → 4 Hz · closed pipe 0.5 m, v=340: 170 Hz · source 20 m/s toward still observer, 500 Hz, v=340: 531.25 Hz |
| `field2d` | Vector fields from point sources or expressions; RK4 streamlines both directions; slope-field segments; solution curves for dy/dx = f(x, y) (uses `fnplot`'s parser through a shared module `site/assets/engines/fnplot/parser.js`, owned by `fnplot`); equipotentials by marching squares; wire/loop/solenoid magnetic field presets | dy/dx = y, y(0)=1: y(1) = e (1e-4) · logistic r=1, K=10, y₀=1: y(2) = 4.508 (1e-3 rel) · single charge \|E\| = kq/r² · a dipole field line leaving + ends at − |
| `fnplot` | Safe Pratt parser → AST → evaluator (numbers, x, t, named params, + − * / ^ right-assoc, unary minus, implicit multiplication, sin cos tan asin acos atan sec csc cot exp ln log sqrt abs sign floor, pi, e); adaptive sampling; discontinuity breaks and dashed asymptotes; zoom/pan; π-multiple ticks option; shaded regions; parametric curves; draggable points; KaTeX labels; transform helpers (1/f, \|f\|, f(\|x\|), inverse with domain restriction); setups listed below | "2x^2-3x+1" at 2 → 3 · "sin(pi/6)" → 0.5 · "-2^2" → −4 · "2^3^2" → 512 · "e^(ln 5)" → 5 · "abs(-3)+sqrt(16)" → 7 · 1/x breaks at 0 · source contains no `eval(` or `Function(` · Planck peak: λmax·T = 2.898e-3 m·K (0.5%) |
| `space3d` | three.js scene, OrbitControls, perspective/orthographic toggle, labelled axes (CSS2D), arrows, lines, planes, spheres, lathe surfaces with disc-slice mode, prisms and towers for 3D trig, third-angle projection panels (front, top, right orthographic cameras), auxiliary-view projection; pure vec3 helpers in `model.js` | dot, cross, projection identities · lines (0,0,0)+t(1,0,0) and (0,0,1)+s(0,1,0) are skew, distance 1 · line–sphere intersection counts 0/1/2 · disc volume y=x on [0,1] about x-axis = π/3 (0.5%, 200 discs) · y=√x on [0,4] = 8π (0.5%) |
| `rays` | 2D tracer with rectangular and semicircular blocks and a fibre (core/cladding); Snell's law; TIR; up to 50 interactions; protractor overlay; angle readouts | n 1.00→1.50 at 30°: 19.47° (0.01°) · critical angle 1.50→1.00: 41.81° · fibre core 1.50, cladding 1.40, ray 15° to axis stays guided |
| `circuit` | Grid editor: ideal DC source (optional internal resistance), resistor, lamp (resistor), switch, ammeter, voltmeter (ideal), wire; modified nodal analysis; animated current dots (speed ∝ current); node voltages on hover; power per element; symbol set switch (physics / AS 1102). Verify AS 1102 symbol shapes before drawing them. | 10 Ω + 10 Ω series on 12 V: 0.6 A · 10 Ω ∥ 10 Ω on 12 V: 2.4 A total · balanced Wheatstone bridge current 0 (1e-12) · KCL sums 0 at every node (1e-9) · short circuit and floating node give a friendly error, not NaN |
| `materials` | `data.json` of materials (E, yield or 0.2% proof, UTS, elongation, density) where **every row carries a `source`** (typical values from a named reference; rows without one are flagged `needsSource` and listed in the PR); tensile model (linear → smooth hardening → necking → fracture; brittle linear to fracture); load–extension ↔ stress–strain conversion; toughness by trapezoid area; log–log selection chart with constant σ/ρ guidelines; hardness indenters (Brinell, Vickers formulas; Rockwell qualitative); fatigue S–N schematic and labelled crack-growth schematic | E recovered from elastic slope (1%) · ideal linear-to-fracture toughness = ½σε (0.5%) · load ↔ stress round trip exact · Vickers F=30 kgf, d=0.5 mm → 222.5 HV · Brinell F=3000 kgf, D=10 mm, d=4 mm → 228.8 HB (0.5%) |

Setup coverage generated from the backlog. Each engine must support these `setup` names:

| Engine | Setups it must support (and the pages that use them) |
| --- | --- |
| `particle2d` | `projectile` (phy-projectile-lab, P0), `braking` (eng-braking-energy, P1), `orbit-gps` (eng-orbits-gps, P1), `resisted-1d` (me2-resisted-motion, P1), `shm` (me2-shm, P1), `charged` (phy-charged-particles, P1), `circular` (phy-circular-motion, P1), `collisions` (phy-collisions, P1), `cart` (phy-motion-graphs, P1), `orbit` (phy-orbit-lab, P1), `relative-velocity` (phy-relative-velocity, P1), `track` (phy-work-energy-track, P2) |
| `statics` | `truss` (eng-truss-solver, P0), `beam` (eng-beam-lab, P1), `concurrent` (eng-force-sandbox, P1), `moments` (eng-moments, P1), `incline` (phy-inclined-plane, P1) |
| `statsim` | `sampling` (me1-sampling-simulator, P0), `normal-approx` (me1-normal-approx, P1), `decay` (phy-radioactive-decay, P1) |
| `argand` | `operations` (me2-argand-explorer, P0), `loci` (me2-loci-painter, P1), `polynomial-roots` (me2-conjugate-roots, P2) |
| `aero` | `flight-forces` (eng-flight-forces, P0), `pitot-static` (eng-pitot-altimeter, P1) |
| `wave` | `interference` (phy-double-slit, P0), `modulation` (eng-modulation-lab, P1), `wave-machine` (phy-wave-machine, P1), `doppler-beats` (phy-doppler-beats, P2) |
| `field2d` | `slope-field` (me1-slope-fields, P0), `charges` (phy-field-sketcher, P1), `magnetic` (phy-magnetic-fields, P2) |
| `fnplot` | `auxiliary` (me1-auxiliary-angle, P1), `transform` (me1-graph-transformer, P1), `inverse` (me1-inverse-mirror, P1), `parametric` (me1-parametric-tracer, P1), `polynomial` (me1-roots-coefficients, P1), `blackbody` (phy-blackbody, P1), `inequality` (me1-inequality-line, P2), `inverse-trig` (me1-inverse-trig, P2), `substitution` (me1-substitution-areas, P2), `by-parts` (me2-integration-by-parts, P2), `partial-fractions` (me2-partial-fractions, P2), `heating` (phy-heating-curves, P2) |
| `space3d` | `orthographic` (eng-orthographic-trainer, P1), `trig3d` (me1-3d-trig, P1), `revolution` (me1-solids-revolution, P1), `vectors` (me1-vector-playground, P1), `lines-spheres` (me2-3d-lines-spheres, P1), `descriptive` (eng-descriptive-geometry, P2) |
| `rays` | `ray-box` (phy-ray-box, P1) |
| `circuit` | `builder` (phy-circuit-builder, P1) |
| `materials` | `selection` (eng-materials-selection, P1), `tensile` (eng-tensile-test, P1), `fatigue-ndt` (eng-fatigue-ndt, P2), `hardness` (eng-hardness-testing, P2) |

Custom pages (engines built in Wave 2 under `site/assets/engines/custom/<id>/`, same contract and the same testing rule): `eng-pascal-hydraulics` (P1), `eng-simple-machines` (P1), `phy-bohr-spectra` (P1), `phy-induction` (P1), `phy-motor-effect` (P1), `phy-photoelectric` (P1), `phy-relativity` (P1), `eng-energy-systems` (P2), `eng-isometric-grid` (P2), `me1-arrangements` (P2), `me1-induction-dominoes` (P2), `me1-pascal-binomial` (P2), `me2-proof-pictures` (P2), `phy-binding-energy` (P2), `phy-hr-diagram` (P2).

Formula checks for custom engines go in their spec's acceptance block. Examples: photoelectric KE_max = hf − φ; Bohr Hα 1/λ = R(1/2² − 1/3²) → 656.3 nm with R = 1.097×10⁷ m⁻¹ (0.1%); γ = 1/√(1 − v²/c²); τ = nBIA cos θ for a coil in the plane convention you state; ε = −N dΦ/dt; Pascal F₂ = F₁A₂/A₁; MA, VR, η = MA/VR.

### 9.2 `W1-AUTH`: premium sign-in and accounts (role `interactive-builder`, owns `site/signin.html`, `site/privacy.html`, `site/assets/signin/**`, the internals of `site/assets/auth.js`, `supabase/**`)

Build §6.4 to a high standard; complete onboarding; account menu; sign out; a "Founding Educator" badge; Supabase mode against §5.6 and §5.7 with clear errors for each failure; email magic-link return handling; `next` redirect that refuses external URLs. Done: Playwright covers every local-mode path; Supabase mode verified by Luca after H3–H5.

### 9.3 `W1-HUB`: dashboard (owns `site/index.html`, `site/assets/hub/**`)

Build §6.5: personalised subject filter, search, filters, cards with generated placeholders, saved scenarios (open, copy link, QR, delete), playlists (create, reorder, open in sequence with next/previous in the shell header via `?playlist=<id>&i=<n>`), requests with votes. Done: works in local mode end to end; Playwright coverage.

### 9.4 `W1-SYL`: syllabus tagging (role `syllabus-tagger`, owns the `syllabus` arrays in `site/catalog/*.json` and `docs/syllabus-reference/**`)

NESA's curriculum pages are JavaScript-rendered, so use Playwright to render them (one request every 2 s or slower). Save extracted text to the git-ignored `docs/syllabus-reference/<course>/<focus-area>.md` for agents' reference. For every catalog entry, confirm the focus area and subtopic, add outcome codes (codes only), and set `verified: true`. Record anything that doesn't fit, such as content no longer in a 2025/2026 syllabus, in `docs/gates/syllabus-report.md`. Courses: Mathematics Extension 1 11–12 (2024), Mathematics Extension 2 11–12 (2024), Physics 11–12 (2025) and Stage 6 (2017), Engineering Studies 11–12 (2026) and Stage 6 (2011). Start from the URLs in MASTER_PLAN's Sources section.

### 9.5 `W1-SPEC-<subject>`: specs (4 tasks: me1, me2, phy, eng; role `spec-writer`, owns `specs/<prefix>-*.md`)

Turn every stub into a complete spec from `specs/_TEMPLATE.md`, P0 first. Each spec's parameters must exist in (or be requested from) its engine's `meta.params`; every acceptance number needs its formula and hand calculation in the spec. Write `docs/gates/gate-b-<subject>.md` listing each spec with a one-line summary for Luca.

---

## 10. Gate B (Luca, per subject)

Skim `docs/gates/gate-b-<subject>.md` and spot-check specs. For each spec: the learning goal is right for the syllabus; parameter ranges are sensible for a classroom; the acceptance numbers look right; the prompts make students think. Approve by ticking the subject in STATUS (or telling the orchestrator). A spec's Wave 2 task starts when its subject is approved **and** its engine has merged.

---

## 11. Wave 2: interactives and content

### 11.1 Interactive tasks (one per backlog page; role `interactive-builder`)

Each task owns the page HTML, its catalog fragment, its notes file and, for custom pages, `site/assets/engines/custom/<id>/**` plus `tests/engines/custom-<id>.test.mjs`. Steps:

1. Read the approved spec, the engine's `meta`, and `_template.html`.
2. Build the page (§5.2) with presets from the spec. Listings that reuse this page need their preset defined here too (see the listings table in §15).
3. Write teacher notes (§5.9) to a publishable standard: original question, worked solution, honest assumptions.
4. Set the fragment `status` to `review`.
5. Run `npm run check` and `npm run shots -- <id>`; attach the screenshot paths in the PR.
6. Open the PR using the template; return the PR URL and a 3-line summary.

If the engine lacks something the spec needs, don't patch the engine. Open an engine change request in the PR description and stop. The orchestrator assigns an `engine-builder` fix task; only one agent may hold an engine at a time.

### 11.2 Content tasks (role `spec-writer`)

Polish notes across a subject for consistency of voice, and add printable worksheet sections (`## Worksheet` in the notes file). Only touch `site/content/notes/<prefix>-*.md`, and only for pages already merged, to avoid conflicts with builders.

---

## 12. Wave 3: review and Gate C

For every PR, the orchestrator spawns a fresh `reviewer` (never the builder). The reviewer checks out the PR in its own worktree and:

1. Runs `npm run check` and `npm run shots -- <id>`.
2. **Correctness:** recomputes every acceptance number independently by hand or a short script; tries edge values (0, max, negative where allowed); looks for unit errors and sign-convention slips; confirms the assumptions shown are true.
3. **Projector and touch:** reads the three screenshots for text size, contrast and overlaps; checks keyboard and touch operation.
4. **Spec fidelity, syllabus tags, design rules (§6), rules (§2).**
5. Posts a PR comment: `VERDICT: PASS` or `VERDICT: FAIL` with a numbered list of required fixes (file and line where possible).

FAIL → the orchestrator re-spawns a builder with the comment. PASS → the orchestrator adds the PR to `docs/gates/gate-c-queue.md` (link, one-line summary, screenshot artifact link, preview URL if any).

**Gate C (Luca):** CI green, reviewer PASS, the screenshots look right, and you clicked the preview. Merge (squash), or tell the orchestrator "merge everything in the Gate C queue", which it does with `gh pr merge --squash --delete-branch`, then sets each fragment's `status` to `live` in a follow-up commit and updates STATUS.

PR template checklist (also in `.github/pull_request_template.md`):
- [ ] Task ID and spec link
- [ ] Only owned paths changed
- [ ] `npm run check` passes locally
- [ ] Screenshots attached (desktop, tablet, phone)
- [ ] Assumptions shown on stage
- [ ] Notes complete (§5.9), no copied syllabus or exam text
- [ ] Change requests (if any) listed

---

## 13. Running agents in parallel (orchestrator playbook)

### 13.1 Mode A: one orchestrator session with subagents (default)

Loop until the wave is done:
1. Read STATUS. List open tasks whose gate is approved and whose dependencies have merged (engine before its interactives).
2. Spawn up to **6 subagents at once**, raising to about 10 if rate limits and the machine cope. Use the role file from `.claude/agents/`. Give each one: the task ID, the files to read, its owned paths, and the branch name. **Spawn with worktree isolation** (the Agent tool's `isolation: "worktree"` option). If your Claude Code version lacks it, create one yourself with `git worktree add ../wt-<task> -b <branch>` and give the subagent that path.
3. As each returns a PR, spawn a reviewer for it (§12).
4. Record the PR link, review result and queue status in STATUS. Commit STATUS straight to `main` with message `status: …` (you are its only writer).
5. When nothing is runnable, write a short summary for Luca (what's in the Gate C queue, what's blocked and why) and stop.

### 13.2 Mode B: several Claude Code sessions (optional, more throughput)

Run `npm run create-issues -- --apply` once (after Gate B) so every page has a GitHub issue. Start extra sessions with: "You are a worker. Read CLAUDE.md. Claim the highest-priority open issue labelled `wave:2` with no assignee (`gh issue edit <n> --add-assignee @me --add-label building`), then do the task as the interactive-builder role." Workers never edit STATUS; the orchestrator syncs it from issues and PRs.

### 13.3 Ownership (who may edit what)

| Path | Owner |
| --- | --- |
| `CLAUDE.md`, `docs/IMPLEMENTATION_GUIDE.md`, `specs/_TEMPLATE.md`, `specs/_demo.md`, `site/catalog/_schema.json`, `site/assets/{tokens.css,base.css,shell.js,state.js,csv.js,format.js,config.js,engine-kit.js,markdown.js}`, `site/assets/ui/**`, `site/assets/engines/demo/**`, `site/interactives/_template.html`, `site/content/notes/_template.md`, `site/dev/styleguide.*`, `scripts/**`, `tests/lib/**`, `tests/e2e/**`, `tests/engines/_*.test.mjs`, `tests/engines/demo.test.mjs`, `playwright.config.mjs`, `.github/**`, `.claude/agents/**`, `render.yaml` | Lead tasks only (locked after Gate A) |
| `docs/STATUS.md`, `docs/gates/gate-c-queue.md` | Orchestrator only |
| `site/assets/engines/<name>/**`, `tests/engines/<name>.test.mjs`, `site/dev/engines/<name>.html` | That engine's task (one at a time) |
| `site/signin.html`, `site/privacy.html`, `site/assets/signin/**`, `auth.js` internals, `supabase/**` | W1-AUTH |
| `site/index.html`, `site/assets/hub/**` | W1-HUB |
| `syllabus` arrays in fragments, `scripts/scrape-syllabus.mjs`, `docs/syllabus-reference/**`, `docs/gates/syllabus-report.md` | W1-SYL |
| `specs/<prefix>-*.md`, `docs/gates/gate-b-<subject>.md` | W1-SPEC-<subject> |
| A page's HTML, fragment (except `syllabus`), notes, custom engine, its tests, its thumbnail | That page's Wave 2 task |

### 13.4 Branches and merging

Branch names: `w0/foundations`, `w1/engine-<name>`, `w1/auth`, `w1/hub`, `w1/syllabus`, `w1/specs-<subject>`, `w2/<id>`, `fix/<id>`, `engine-cr/<name>-<short>`. Always rebase on `main` before review. Squash-merge only. Engines merge before their interactives. Merge conflicts in an owned path mean someone broke ownership: stop and report it.

---

## 14. Human-only tasks (Luca)

Claude Code must not do these; it asks Luca and waits. Track them as H1–H8 in STATUS.

- **H1 GitHub:** create the repo, push the starter kit, install `gh` and run `gh auth login` on the machine running Claude Code, protect `main` (require CI).
- **H2 Render:** New → Blueprint (uses `render.yaml`), or a Static Site with build `npm ci && npm run build` and publish directory `dist`. Turn on pull request previews if your plan has them.
- **H3 Supabase project:** region Sydney (ap-southeast-2). Run `supabase/migrations/0001_init.sql` in the SQL editor. Put the Project URL and the **anon public** key into `site/assets/config.js` and set `AUTH_MODE = 'supabase'`. Never commit the service-role key.
- **H4 Sign-in providers:** Google (Google Cloud OAuth client) and Microsoft (Entra app registration, multi-tenant so any school's Microsoft 365 works). Enable email magic links and anonymous sign-ins. Set Site URL and redirect URLs (Render URL, `http://localhost:5173`).
- **H5 Access codes:** insert your codes, `insert into public.access_codes (code, kind) values ('TTT2026', 'event');` (one shared code).
- **H6 Test a real NSW Department Microsoft account** and a Google account before the event.
- **H7 Name and branding:** final `SITE_NAME`; confirm UNSW logo use and the privacy statement with the event organisers.
- **H8 Gates:** approve Gate A, Gate B per subject, and Gate C merges.

---

## 15. Backlog

`docs/backlog.json` is the source of truth; this table is generated from it. Pages, ordered by priority then subject:

| ID | Title | Subject | Engine / setup | Priority | Syllabus tags |
| --- | --- | --- | --- | --- | --- |
| `eng-flight-forces` | Flight forces and stall | Engineering | aero / flight-forces | P0 | 2011: Aeronautical Engineering; 2026: Aeronautical and aerospace engineering |
| `eng-truss-solver` | Truss solver | Engineering | statics / truss | P0 | 2011: Civil Structures; 2026: Civil and structural engineering |
| `me1-sampling-simulator` | Sampling simulator | Maths Ext 1 | statsim / sampling | P0 | 2024: The binomial distribution and the sampling distribution of the mean |
| `me1-slope-fields` | Slope fields | Maths Ext 1 | field2d / slope-field | P0 | 2024: Further applications of calculus |
| `me2-argand-explorer` | Argand explorer | Maths Ext 2 | argand / operations | P0 | 2024: Introduction to complex numbers |
| `phy-double-slit` | Double slit and diffraction grating | Physics | wave / interference | P0 | 2017: Module 7: The Nature of Light; 2025: Nature of light |
| `phy-projectile-lab` | Projectile lab | Physics | particle2d / projectile | P0 | 2017: Module 5: Advanced Mechanics; 2025: Advanced mechanics |
| `eng-beam-lab` | Beam lab | Engineering | statics / beam | P1 | 2011: Civil Structures; 2026: Civil and structural engineering |
| `eng-braking-energy` | Braking energy | Engineering | particle2d / braking | P1 | 2011: Braking Systems; 2026: Transport engineering and automation |
| `eng-force-sandbox` | Force sandbox | Engineering | statics / concurrent | P1 | 2011: Engineering Fundamentals; 2026: Applied engineering analysis |
| `eng-materials-selection` | Materials selection chart | Engineering | materials / selection | P1 | 2011: Aeronautical Engineering; 2026: Aeronautical and aerospace engineering |
| `eng-modulation-lab` | Modulation lab | Engineering | wave / modulation | P1 | 2011: Telecommunications Engineering; 2026: Aeronautical and aerospace engineering |
| `eng-moments` | Moments and equilibrium | Engineering | statics / moments | P1 | 2011: Engineering Fundamentals; 2026: Applied engineering analysis |
| `eng-orbits-gps` | Orbits and GPS | Engineering | particle2d / orbit-gps | P1 | 2011: Telecommunications Engineering; 2026: Aeronautical and aerospace engineering |
| `eng-orthographic-trainer` | Orthogonal projection trainer | Engineering | space3d / orthographic | P1 | 2011: Engineering Fundamentals; 2026: Technical graphics and communication |
| `eng-pascal-hydraulics` | Pascal's principle | Engineering | custom | P1 | 2011: Aeronautical Engineering; 2026: Aeronautical and aerospace engineering |
| `eng-pitot-altimeter` | Pitot-static and altimeter | Engineering | aero / pitot-static | P1 | 2011: Aeronautical Engineering; 2026: Aeronautical and aerospace engineering |
| `eng-simple-machines` | Simple machines | Engineering | custom | P1 | 2011: Engineered Products; 2026: Applied engineering analysis |
| `eng-tensile-test` | Tensile test machine | Engineering | materials / tensile | P1 | 2011: Engineered Products; 2026: Applied engineering analysis |
| `me1-3d-trig` | 3D trigonometry scenes | Maths Ext 1 | space3d / trig3d | P1 | 2024: Further trigonometry |
| `me1-auxiliary-angle` | Auxiliary angle | Maths Ext 1 | fnplot / auxiliary | P1 | 2024: Further trigonometry |
| `me1-graph-transformer` | Graph transformer | Maths Ext 1 | fnplot / transform | P1 | 2024: Further work with functions |
| `me1-inverse-mirror` | Inverse function mirror | Maths Ext 1 | fnplot / inverse | P1 | 2024: Further work with functions |
| `me1-normal-approx` | Normal approximation to the binomial | Maths Ext 1 | statsim / normal-approx | P1 | 2024: The binomial distribution and the sampling distribution of the mean |
| `me1-parametric-tracer` | Parametric tracer | Maths Ext 1 | fnplot / parametric | P1 | 2024: Further work with functions |
| `me1-roots-coefficients` | Roots and coefficients | Maths Ext 1 | fnplot / polynomial | P1 | 2024: Polynomials |
| `me1-solids-revolution` | Solids of revolution | Maths Ext 1 | space3d / revolution | P1 | 2024: Further applications of calculus |
| `me1-vector-playground` | Vector playground | Maths Ext 1 | space3d / vectors | P1 | 2024: Introduction to vectors |
| `me2-3d-lines-spheres` | 3D lines and spheres | Maths Ext 2 | space3d / lines-spheres | P1 | 2024: Further work with vectors |
| `me2-loci-painter` | Loci painter | Maths Ext 2 | argand / loci | P1 | 2024: Introduction to complex numbers |
| `me2-resisted-motion` | Resisted motion | Maths Ext 2 | particle2d / resisted-1d | P1 | 2024: Applications of calculus to mechanics |
| `me2-shm` | Simple harmonic motion | Maths Ext 2 | particle2d / shm | P1 | 2024: Applications of calculus to mechanics |
| `phy-blackbody` | Black-body radiation | Physics | fnplot / blackbody | P1 | 2017: Module 7: The Nature of Light; 2025: Nature of light |
| `phy-bohr-spectra` | Bohr atom and hydrogen spectrum | Physics | custom | P1 | 2017: Module 8: From the Universe to the Atom; 2025: Matter, energy and the cosmos |
| `phy-charged-particles` | Charged particles in fields | Physics | particle2d / charged | P1 | 2017: Module 6: Electromagnetism; 2025: Electromagnetism |
| `phy-circuit-builder` | Circuit builder | Physics | circuit / builder | P1 | 2017: Module 4: Electricity and Magnetism; 2025: Electricity and magnetism |
| `phy-circular-motion` | Circular motion and banked tracks | Physics | particle2d / circular | P1 | 2017: Module 5: Advanced Mechanics; 2025: Advanced mechanics |
| `phy-collisions` | Collisions | Physics | particle2d / collisions | P1 | 2017: Module 2: Dynamics; 2025: Fundamentals of mechanics |
| `phy-field-sketcher` | Electric field sketcher | Physics | field2d / charges | P1 | 2017: Module 4: Electricity and Magnetism; 2025: Electricity and magnetism |
| `phy-inclined-plane` | Inclined plane and friction | Physics | statics / incline | P1 | 2017: Module 2: Dynamics; 2025: Fundamentals of mechanics |
| `phy-induction` | Faraday and Lenz | Physics | custom | P1 | 2017: Module 6: Electromagnetism; 2025: Electromagnetism |
| `phy-motion-graphs` | Motion graphs lab | Physics | particle2d / cart | P1 | 2017: Module 1: Kinematics; 2025: Fundamentals of mechanics |
| `phy-motor-effect` | Motor effect and DC motor | Physics | custom | P1 | 2017: Module 6: Electromagnetism; 2025: Electromagnetism |
| `phy-orbit-lab` | Orbit lab | Physics | particle2d / orbit | P1 | 2017: Module 5: Advanced Mechanics; 2025: Advanced mechanics |
| `phy-photoelectric` | Photoelectric effect | Physics | custom | P1 | 2017: Module 7: The Nature of Light; 2025: Nature of light |
| `phy-radioactive-decay` | Radioactive decay | Physics | statsim / decay | P1 | 2017: Module 8: From the Universe to the Atom; 2025: Matter, energy and the cosmos |
| `phy-ray-box` | Ray box | Physics | rays / ray-box | P1 | 2017: Module 3: Waves and Thermodynamics; 2025: Waves |
| `phy-relative-velocity` | Relative velocity | Physics | particle2d / relative-velocity | P1 | 2017: Module 1: Kinematics; 2025: Fundamentals of mechanics |
| `phy-relativity` | Special relativity | Physics | custom | P1 | 2017: Module 7: The Nature of Light; 2025: Nature of light |
| `phy-wave-machine` | Wave machine | Physics | wave / wave-machine | P1 | 2017: Module 3: Waves and Thermodynamics; 2025: Waves |
| `eng-descriptive-geometry` | Descriptive geometry | Engineering | space3d / descriptive | P2 | 2011: Aeronautical Engineering; 2026: Aeronautical and aerospace engineering |
| `eng-energy-systems` | Energy systems calculator | Engineering | custom | P2 | 2026: Environmental engineering and energy systems |
| `eng-fatigue-ndt` | Fatigue and NDT methods | Engineering | materials / fatigue-ndt | P2 | 2011: Aeronautical Engineering; 2026: Aeronautical and aerospace engineering |
| `eng-hardness-testing` | Hardness testing | Engineering | materials / hardness | P2 | 2011: Personal and Public Transport; 2026: Transport engineering and automation |
| `eng-isometric-grid` | Isometric sketching grid | Engineering | custom | P2 | 2011: Engineering Fundamentals; 2026: Technical graphics and communication |
| `me1-arrangements` | Arrangement builder | Maths Ext 1 | custom | P2 | 2024: Permutations and combinations |
| `me1-induction-dominoes` | Induction stepper | Maths Ext 1 | custom | P2 | 2024: Proof by mathematical induction |
| `me1-inequality-line` | Inequality number line | Maths Ext 1 | fnplot / inequality | P2 | 2024: Further work with functions |
| `me1-inverse-trig` | Inverse trig builder | Maths Ext 1 | fnplot / inverse-trig | P2 | 2024: Inverse trigonometric functions |
| `me1-pascal-binomial` | Pascal's triangle and the binomial theorem | Maths Ext 1 | custom | P2 | 2024: The binomial theorem |
| `me1-substitution-areas` | Integration by substitution areas | Maths Ext 1 | fnplot / substitution | P2 | 2024: Further calculus skills |
| `me2-conjugate-roots` | Conjugate root pairs | Maths Ext 2 | argand / polynomial-roots | P2 | 2024: Introduction to complex numbers |
| `me2-integration-by-parts` | Integration by parts | Maths Ext 2 | fnplot / by-parts | P2 | 2024: Further integration |
| `me2-partial-fractions` | Partial fractions decomposer | Maths Ext 2 | fnplot / partial-fractions | P2 | 2024: Further integration |
| `me2-proof-pictures` | Proof pictures | Maths Ext 2 | custom | P2 | 2024: The nature of proof |
| `phy-binding-energy` | Binding energy curve | Physics | custom | P2 | 2017: Module 8: From the Universe to the Atom; 2025: Matter, energy and the cosmos |
| `phy-doppler-beats` | Doppler and beats | Physics | wave / doppler-beats | P2 | 2017: Module 3: Waves and Thermodynamics; 2025: Waves |
| `phy-heating-curves` | Heating curves | Physics | fnplot / heating | P2 | 2017: Module 3: Waves and Thermodynamics |
| `phy-hr-diagram` | HR diagram explorer | Physics | custom | P2 | 2017: Module 8: From the Universe to the Atom; 2025: Matter, energy and the cosmos |
| `phy-magnetic-fields` | Magnetic fields | Physics | field2d / magnetic | P2 | 2017: Module 4: Electricity and Magnetism; 2025: Electricity and magnetism |
| `phy-work-energy-track` | Work-energy track | Physics | particle2d / track | P2 | 2017: Module 2: Dynamics; 2025: Fundamentals of mechanics |

Catalogue listings that reuse a page through a preset (the page's builder defines the preset):

| Listing ID | Title | Reuses page | Preset | Priority |
| --- | --- | --- | --- | --- |
| `me1-projectile-vectors` | Projectile motion with vectors | `phy-projectile-lab` | `me1-vectors` | P0 |
| `me2-projectile-drag` | Projectile with air resistance | `phy-projectile-lab` | `me2-drag` | P0 |
| `eng-friction-horizontal` | Static friction on a horizontal plane | `phy-inclined-plane` | `eng-horizontal` | P1 |
| `eng-fibre-optics` | Optical fibre | `phy-ray-box` | `eng-fibre` | P1 |
| `eng-circuits-as1102` | Circuits with AS 1102 symbols | `phy-circuit-builder` | `eng-as1102` | P1 |

---

## 16. Definition of done (a page is `live` when)

- [ ] Spec approved at Gate B; acceptance block passes in CI
- [ ] Engine tests pass; no `eval`; no runtime CDN requests
- [ ] Zero console errors or warnings in the e2e run
- [ ] Projector, tablet and phone screenshots reviewed; text ≥ 18 px on the 1920×1080 stage
- [ ] Assumptions on stage; units on every readout and axis
- [ ] Notes complete per §5.9 with an original question and worked solution
- [ ] Syllabus tags verified (or explicitly flagged in the syllabus report)
- [ ] Reviewer PASS; Luca merged at Gate C; fragment `status: live`; thumbnail generated

---

## 17. Reference

| Course | In classrooms (Nov 2026) | New syllabus | New Year 11 | New Year 12 | First HSC |
| --- | --- | --- | --- | --- | --- |
| Mathematics Extension 1 | 2024 | 11–12 (2024) | T1 2026 | T4 2026 | 2027 |
| Mathematics Extension 2 | 2024 (Year 12 only) | 11–12 (2024) | n/a | T4 2026 | 2027 |
| Physics | Stage 6 (2017) | 11–12 (2025) | T1 2027 | T4 2027 | 2028 |
| Engineering Studies | Stage 6 (2011) | 11–12 (2026) | T1 2028 | T4 2028 | 2029 |

Constants and conventions: SI units everywhere; g = 9.8 m/s² for Physics and Maths presets, **g = 10 m/s² for Engineering presets** (the 2026 Engineering Studies syllabus specifies it); show g on stage. Engineering moments default clockwise positive. Display 3 significant figures unless the spec says otherwise. Australian English spelling.
