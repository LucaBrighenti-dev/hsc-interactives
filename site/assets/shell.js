// The interactive page shell (guide §5.2). Every page calls mountInteractive(config) from an inline module.
// Locked after Gate A (lead-owned). Pages never touch the DOM themselves.
//
// mountInteractive does, in order:
//  1. requireSession() unless ?embed=1
//  2. builds the layout (§6.3): header, tag strip (from /catalog.json), stage, controls, readouts,
//     toolbar, try-this panel, notes drawer
//  3. loads the engine; params = setup defaults ← presets.default ← presets[?preset] ← URL params
//  4. generates controls from meta.params and readouts from meta.outputs
//  5. wires the toolbar: play/pause, step, reset, share (link + QR), save scenario, CSV, theme,
//     presenter mode, fullscreen, shortcuts
//  6. keyboard: Space play/pause, . step, R reset, F fullscreen, P presenter, T theme, N notes, ? shortcuts
//  7. syncs params to the URL (debounced 300 ms, history.replaceState)
//  8. error boundary: an engine error shows a calm in-stage message with a reset button
//  9. with ?test=1, exposes window.__hsc (§5.8)
import { requireSession, signOut, saveScenario, listPlaylists } from './auth.js';
import { SITE_NAME, SUBJECTS } from './config.js';
import { parseQuery, resolveParams, paramsFor, isVisible, createUrlSync, toQuery, clampParams, genericQuery, withQuery } from './state.js';
import { downloadCSV } from './csv.js';
import { ensureFonts } from './engine-kit.js';
import { renderMarkdown, stripFrontmatter } from './markdown.js';
import { formatInteger, siPrefix, NNBSP } from './format.js';
import { el, clear, icon, button, slider, toggle, segmented, select, textField, chip, readout, panel, drawer, modal, toast, qrModal } from './ui/index.js';

/** Course-level NESA links for the tag strip when a tag has no `url` of its own. Links only; never copy syllabus text. */
const COURSE_URLS = {
  'Mathematics Extension 1|2024': 'https://curriculum.nsw.edu.au/learning-areas/mathematics/mathematics-extension-1-11-12-2024/overview',
  'Mathematics Extension 2|2024': 'https://education.nsw.gov.au/teaching-and-learning/curriculum/mathematics/leading-mathematics-k-12/leading-mathematics-7-12/mathematics-extension-2-11-12-syllabus-information.html',
  'Physics|2017': 'https://www.nsw.gov.au/education-and-training/nesa/curriculum/science/physics-stage-6-2017',
  'Physics|2025': 'https://curriculum.nsw.edu.au/learning-areas/science/physics-11-12-2025/overview/course',
  'Engineering Studies|2011': 'https://www.nsw.gov.au/education-and-training/nesa/curriculum/tas/engineering-studies-stage-6-2011',
  'Engineering Studies|2026': 'https://curriculum.nsw.edu.au/learning-areas/tas/engineering-studies-11-12-2026/overview/course',
};

const PROMPT_LABELS = { predict: 'Predict', observe: 'Observe', explain: 'Explain' };
const SHORTCUTS = [
  ['Space', 'Play or pause'],
  ['.', 'Step forward'],
  ['R', 'Reset the run'],
  ['F', 'Full screen'],
  ['P', 'Presenter mode'],
  ['T', 'Projector or dark stage'],
  ['N', 'Teacher notes'],
  ['?', 'This list'],
];

let catalogPromise = null;
/** The merged catalog (cached). Resolves to { entries: [] } if it cannot be loaded. */
export function loadCatalog() {
  catalogPromise ??= fetch('/catalog.json')
    .then((r) => (r.ok ? r.json() : { entries: [] }))
    .catch(() => ({ entries: [] }));
  return catalogPromise;
}

function humanise(name) {
  return name === 'default' ? 'Standard' : name.replace(/^(me1|me2|phy|eng)-/, '').replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
}

function syllabusChips(entry) {
  const chips = [];
  const subject = SUBJECTS.find((s) => s.id === entry.subject);
  if (subject) chips.push(chip({ label: subject.label, variant: 'accent' }));
  for (const tag of entry.syllabus ?? []) {
    const name = [tag.area && tag.version !== '2024' ? tag.area : null, tag.focusArea].filter(Boolean).join(' · ') || tag.course;
    const outcomes = tag.verified && tag.outcomes?.length ? ` · ${tag.outcomes.join(' ')}` : '';
    const href = tag.url || COURSE_URLS[`${tag.course}|${tag.version}`];
    const text = `${tag.version} ${name}${outcomes}`;
    chips.push(href ? chip({ label: text, href, external: true, title: `${tag.course} (${tag.version}) on the NESA website` }) : chip({ label: text }));
  }
  return chips;
}

/**
 * @param {{ id: string, engine: () => Promise<any>, setup?: string, presets: Record<string, object>,
 *   presetLabels?: Record<string, string>, controls: string[], readouts: string[], assumptions?: string[],
 *   prompts?: { kind: 'predict'|'observe'|'explain', text: string }[], notes?: string, title?: string }} config
 */
export async function mountInteractive(config) {
  const flags = parseQuery(location.search, {}, null).flags;
  const errors = [];
  let resolveReady;
  let rejectReady;
  const ready = new Promise((res, rej) => {
    resolveReady = res;
    rejectReady = rej;
  });
  ready.catch(() => {});

  let engine = null;
  let meta = null;
  let setup = config.setup ?? null;
  let params = {};
  let presetName = null;
  let ariaTimer = 0;

  if (flags.test) {
    window.__hsc = {
      ready,
      errors,
      setParams(p) {
        engine.setParams(p);
        afterParamsChange({ fromEngine: true });
        return engine.getParams();
      },
      getParams: () => engine.getParams(),
      step(n = 1) {
        engine.step(n);
      },
      runUntilComplete(maxSteps = 200000) {
        engine.pause();
        let steps = 0;
        while (!engine.isComplete() && steps < maxSteps) {
          const k = Math.min(1000, maxSteps - steps);
          engine.step(k);
          steps += k;
        }
        return { steps, complete: engine.isComplete() };
      },
      getOutputs: () => engine.getOutputs(),
      getData: () => engine.getData(),
      get meta() {
        return meta && { name: meta.name, version: meta.version, setup };
      },
    };
  }

  // 1. Session (embed mode skips the gate).
  const session = flags.embed ? null : await requireSession();

  // Theme: URL, then the teacher's last choice, then the projector default.
  let theme = flags.theme || (localStorage.getItem('hsc:theme') === 'dark' ? 'dark' : 'projector');
  document.documentElement.dataset.theme = theme;
  document.documentElement.lang = 'en-AU';

  // 2. Layout.
  const fallbackTitle = config.title || document.title.split(' · ')[0] || config.id;
  const titleEl = el('h1', { class: 'hsc-title', text: fallbackTitle });
  const crumbs = el('nav', { class: 'hsc-crumbs', aria: { label: 'Breadcrumb' } });
  const userArea = el('div', { class: 'hsc-user' });
  const playlistNav = el('div', { class: 'hsc-playlist', hidden: true });
  const header = el(
    'header',
    { class: 'hsc-header' },
    el('a', { class: 'wordmark', href: '/', text: SITE_NAME, title: 'Back to the hub' }),
    crumbs,
    playlistNav,
    userArea,
  );
  const tagstrip = el('div', { class: 'hsc-tagstrip', aria: { label: 'Syllabus links' } });
  const fullUrl = () => {
    const u = new URL(location.href);
    u.searchParams.delete('embed');
    return u.toString();
  };
  const embedbar = el(
    'div',
    { class: 'hsc-embedbar', hidden: !flags.embed },
    el('a', { class: 'wordmark', href: '/', target: '_blank', rel: 'noopener', text: SITE_NAME }),
    el('a', { href: fullUrl(), target: '_blank', rel: 'noopener', text: 'Open full page ↗' }),
  );

  // role=group (not img) so interactive stage content (editors, draggable handles, in-stage buttons) stays accessible.
  const stage = el('div', { id: 'hsc-stage', class: 'hsc-stage', role: 'group', aria: { roledescription: 'simulation', label: `${fallbackTitle} simulation` }, tabindex: '-1' });
  const loading = el('div', { class: 'hsc-stage-loading', text: 'Loading simulation…' });
  stage.append(loading);
  const stageMsg = el('div', { class: 'hsc-stage-msg', hidden: true, role: 'alert' });
  const footer = el('p', { class: 'hsc-stage-footer' });
  const readoutsEl = el('div', { class: 'hsc-readouts', aria: { label: 'Readouts' } });
  const liveSummary = el('div', { class: 'sr-only', aria: { live: 'polite' } });
  const toolbar = el('div', { class: 'hsc-toolbar', role: 'toolbar', aria: { label: 'Simulation tools' } });
  const stageCol = el(
    'section',
    { class: 'hsc-stage-col', aria: { label: 'Simulation' } },
    el('div', { class: 'hsc-stage-head' }, titleEl, toolbar),
    el('div', { class: 'hsc-stage-frame' }, stage, stageMsg, footer),
    readoutsEl,
    liveSummary,
  );

  const controlsPanel = panel({ title: 'Controls', className: 'hsc-controls' });
  const tryPanel = panel({ title: 'Try this', collapsible: true, className: 'hsc-trythis' });
  const sideActions = el('div', { class: 'hsc-side__actions' });
  const side = el('aside', { class: 'hsc-side', aria: { label: 'Controls and prompts' } }, controlsPanel, tryPanel, sideActions);
  const main = el('main', { class: 'hsc-main', id: 'hsc-main' }, stageCol, side);

  document.body.classList.add('hsc-page');
  document.body.classList.toggle('is-embed', flags.embed);
  document.body.classList.toggle('is-presenter', flags.present);
  document.body.prepend(el('a', { class: 'skip-link', href: '#hsc-stage', text: 'Skip to the simulation' }), header, embedbar, tagstrip, main);

  // Header: user menu.
  if (session) {
    userArea.append(
      session.founding ? el('span', { class: 'badge-founding', text: 'Founding Educator' }) : null,
      el('span', { class: 'hsc-user__name', text: session.user.name || (session.user.kind === 'code' ? 'Class session' : 'Signed in') }),
      button({
        label: 'Sign out',
        variant: 'ghost',
        size: 'sm',
        icon: 'logout',
        onClick: async () => {
          await signOut();
          location.href = '/signin.html';
        },
      }),
    );
  }

  // Assumptions and prompts come from the page config.
  const assumptions = config.assumptions ?? [];
  footer.append(el('span', { class: 'hsc-stage-footer__label', text: 'Assumptions' }), ...(assumptions.length ? assumptions.map((a) => el('span', { text: a })) : [el('span', { text: 'None stated' })]));
  const prompts = config.prompts ?? [];
  tryPanel.body.append(
    el(
      'ol',
      {},
      prompts.map((p) => el('li', {}, el('span', { class: 'hsc-trythis__kind', text: PROMPT_LABELS[p.kind] ?? p.kind }), el('span', { text: p.text }))),
    ),
  );
  if (!prompts.length) tryPanel.hidden = true;

  // Catalog: title, breadcrumb, tag strip.
  const catalog = await loadCatalog();
  const entry = catalog.entries.find((e) => e.id === config.id);
  const title = entry?.title || fallbackTitle;
  titleEl.textContent = title;
  document.title = `${title} · ${SITE_NAME}`;
  const subject = SUBJECTS.find((s) => s.id === entry?.subject);
  crumbs.append(
    subject ? el('a', { href: `/?subject=${subject.id}`, text: subject.short }) : el('a', { href: '/', text: 'Hub' }),
    el('span', { 'aria-hidden': 'true', text: '/' }),
    el('span', { aria: { current: 'page' }, text: title }),
  );
  if (entry) tagstrip.append(...syllabusChips(entry));
  else tagstrip.append(chip({ label: 'Reference template', variant: 'accent' }), chip({ label: config.id }));

  // 3. Engine.
  let mod;
  try {
    mod = await config.engine();
    meta = mod.meta;
    setup ??= meta.setups[0];
    if (!meta.setups.includes(setup)) throw new Error(`The engine "${meta.name}" has no setup called "${setup}".`);
    if (!config.presets?.default) throw new Error('The page config needs presets.default.');
  } catch (err) {
    console.error(err);
    loading.remove();
    showError('This simulation could not load.', err.message, false);
    rejectReady(err);
    return;
  }
  const isStatic = (meta.staticSetups ?? []).includes(setup);
  const q = parseQuery(location.search, meta.params, setup);
  presetName = q.preset && config.presets[q.preset] ? q.preset : null;
  if (q.preset && !presetName) toast(`There is no "${q.preset}" scenario here, so the standard one is shown.`);
  if (q.invalid.length) toast('Some values in the link were outside their ranges and have been adjusted.');
  params = resolveParams({ metaParams: meta.params, setup, presets: config.presets, presetName, urlParams: q.params });

  const applicable = new Map(paramsFor(meta.params, setup));
  const controlKeys = (config.controls ?? []).filter((k) => {
    if (applicable.has(k)) return true;
    console.error(`mountInteractive: control "${k}" is not a param of ${meta.name}/${setup}`);
    return false;
  });
  const readoutKeys = (config.readouts ?? []).filter((k) => {
    const out = meta.outputs?.[k];
    if (out && (!out.setups || out.setups.includes(setup))) return true;
    console.error(`mountInteractive: readout "${k}" is not an output of ${meta.name}/${setup}`);
    return false;
  });

  // 4. Controls and readouts.
  const controls = new Map();
  const controlWraps = new Map();
  const setParam = (key, value) => {
    if (!engine) return;
    guard(() => engine.setParams({ [key]: value }));
    afterParamsChange({ fromEngine: false, changedKey: key });
  };
  for (const key of controlKeys) {
    const spec = applicable.get(key);
    let control;
    if (spec.type === 'number') {
      control = slider({ label: spec.label, unit: spec.unit, min: spec.min, max: spec.max, step: spec.step, integer: spec.integer, value: params[key], onInput: (v) => setParam(key, v) });
    } else if (spec.type === 'boolean') {
      control = toggle({ label: spec.label, checked: params[key], onChange: (v) => setParam(key, v) });
    } else if (spec.type === 'enum') {
      const useSegmented = spec.widget ? spec.widget === 'segmented' : spec.options.length <= 3;
      control = useSegmented
        ? segmented({ label: spec.label, options: spec.options, value: params[key], onChange: (v) => setParam(key, v) })
        : select({ label: spec.label, options: spec.options, value: params[key], onChange: (v) => setParam(key, v) });
    } else if (spec.type === 'string') {
      control = textField({ label: spec.label, value: params[key], mono: true, maxLength: spec.maxLength ?? 200, onChange: (v) => setParam(key, v) });
    } else if (spec.type === 'list') {
      control = textField({
        label: `${spec.label}${spec.unit ? ` (${spec.unit})` : ''}`,
        value: (params[key] || []).join(', '),
        mono: true,
        onChange: (v) => {
          const { params: p, invalid } = clampParams(meta.params, setup, { [key]: v.replace(/\s+/g, '') });
          if (invalid.length) toast(`${spec.label}: enter numbers separated by commas.`);
          setParam(key, p[key]);
        },
      });
      control.setValue = ((orig) => (v) => orig((v || []).join(', ')))(control.setValue);
    }
    const wrap = el('div', { data: { key } }, control);
    if (spec.help) {
      const helpId = `help-${key}`;
      wrap.append(el('p', { id: helpId, class: 'control-help', text: spec.help }));
      const target = control.matches?.('[role="switch"]') ? control : control.querySelector('input[type="number"], select, [role="radiogroup"], input');
      target?.setAttribute('aria-describedby', helpId);
    }
    controls.set(key, control);
    controlWraps.set(key, wrap);
    controlsPanel.body.append(wrap);
  }

  const presetNames = Object.keys(config.presets);
  if (presetNames.length > 1) {
    const presetSelect = select({
      label: 'Scenario',
      options: presetNames.map((n) => [n, config.presetLabels?.[n] ?? humanise(n)]),
      value: presetName ?? 'default',
      onChange: (name) => applyPreset(name),
    });
    controls.set('__preset', presetSelect);
    controlsPanel.body.prepend(presetSelect);
  }
  controlsPanel.body.append(
    el('div', { class: 'cluster' }, button({ label: 'Reset values', variant: 'ghost', size: 'sm', icon: 'reset', onClick: () => applyPreset(presetName ?? 'default') })),
  );
  if (!controlKeys.length) controlsPanel.body.prepend(el('p', { class: 'muted', text: 'Nothing to adjust in this view.' }));

  const readouts = new Map();
  for (const key of readoutKeys) {
    const out = meta.outputs[key];
    const sigfigs = out.sigfigs ?? 3;
    const prefixed = (v) => {
      // "4.80 mm" from 0.0048 m: split the number from the prefixed unit so the unit span updates too.
      const s = siPrefix(v, out.unit, { sigfigs });
      const i = s.lastIndexOf(NNBSP);
      return i < 0 ? { number: s, unit: '' } : { number: s.slice(0, i), unit: s.slice(i + 1) };
    };
    const r = readout({ label: out.label, unit: out.unit, sigfigs, format: out.integer ? formatInteger : out.siPrefix ? prefixed : undefined });
    readouts.set(key, r);
    readoutsEl.append(r);
  }

  // Live summary for screen readers, at most once a second.
  let summaryDirty = false;
  const summaryTimer = setInterval(() => {
    if (!summaryDirty) return;
    summaryDirty = false;
    liveSummary.textContent = [...readouts.values()].map((r) => r.text()).join('. ');
  }, 1000);

  const updateReadouts = (values) => {
    for (const [key, r] of readouts) r.update(values?.[key]);
    summaryDirty = true;
  };

  // 5. Toolbar.
  const playBtn = button({ label: 'Play', icon: 'play', iconOnly: true, shortcut: 'Space', onClick: () => togglePlay() });
  const stepBtn = button({ label: 'Step', icon: 'step', iconOnly: true, shortcut: '.', onClick: () => stepOnce() });
  const resetBtn = button({ label: 'Reset the run', icon: 'reset', iconOnly: true, shortcut: 'R', onClick: () => resetRun() });
  const shareBtn = button({ label: 'Share link and QR code', icon: 'share', iconOnly: true, onClick: () => share() });
  const saveBtn = button({ label: 'Save scenario', icon: 'save', iconOnly: true, onClick: () => save() });
  const csvBtn = button({ label: 'Download data (CSV)', icon: 'download', iconOnly: true, onClick: () => exportCsv() });
  const themeBtn = button({ label: 'Dark stage', icon: 'theme', iconOnly: true, shortcut: 'T', pressed: theme === 'dark', onClick: () => toggleTheme() });
  const presentBtn = button({ label: 'Presenter mode', icon: 'presenter', iconOnly: true, shortcut: 'P', pressed: flags.present, onClick: () => togglePresenter() });
  const fullBtn = button({ label: 'Full screen', icon: 'fullscreen', iconOnly: true, shortcut: 'F', pressed: false, onClick: () => toggleFullscreen() });
  const helpBtn = button({ label: 'Keyboard shortcuts', icon: 'keyboard', iconOnly: true, shortcut: '?', onClick: () => showShortcuts() });
  const sep = () => el('span', { class: 'hsc-toolbar__sep', 'aria-hidden': 'true' });
  toolbar.append(
    ...(isStatic ? [] : [playBtn, stepBtn, resetBtn, sep()]),
    ...(flags.embed ? [] : [shareBtn]),
    ...(session ? [saveBtn] : []),
    csvBtn,
    sep(),
    themeBtn,
    presentBtn,
    fullBtn,
    helpBtn,
  );

  const notesBtn = button({ label: 'Teacher notes', icon: 'notes', block: true, shortcut: 'N', onClick: () => openNotes() });
  if (!flags.embed && config.notes) sideActions.append(notesBtn);

  // Engine events.
  const onEvent = (type, payload) => {
    if (type === 'outputs') updateReadouts(payload);
    else if (type === 'params') {
      // The engine changed params itself (e.g. a dragged point): resync controls, URL and share link.
      if (engine) afterParamsChange({ fromEngine: true });
    }
    else if (type === 'complete') syncPlayButton();
    else if (type === 'error') {
      errors.push(payload);
      showError('The simulation stopped.', payload?.message);
    }
  };

  function guard(fn) {
    try {
      return fn();
    } catch (err) {
      console.error(err);
      errors.push({ message: err.message });
      showError('The simulation stopped.', err.message);
      return undefined;
    }
  }

  function createEngine(initialParams) {
    clear(stage);
    stageMsg.hidden = true;
    engine = mod.create(stage, { setup, params: initialParams, theme, onEvent });
    params = engine.getParams();
    updateReadouts(engine.getOutputs());
    updateAria();
  }

  function showError(titleText, detail, canReset = true) {
    try {
      engine?.pause();
    } catch {
      /* already broken */
    }
    clear(stageMsg);
    stageMsg.append(
      el('p', { class: 'hsc-stage-msg__title', text: titleText }),
      el('p', { class: 'hsc-stage-msg__detail', text: canReset ? 'Something in this scenario went wrong. Resetting usually fixes it, and the rest of the page still works.' : 'Try reloading the page.' }),
      detail ? el('p', { class: 'hsc-stage-msg__detail mono', style: { fontSize: '13px' }, text: detail }) : null,
      canReset
        ? button({
            label: 'Reset the simulation',
            icon: 'reset',
            onClick: () => {
              try {
                engine?.destroy();
              } catch {
                /* ignore */
              }
              try {
                createEngine(resolveParams({ metaParams: meta.params, setup, presets: config.presets, presetName }));
                syncControls();
                syncPlayButton();
                urlSync();
              } catch (err) {
                console.error(err);
                showError('This simulation could not restart.', err.message, false);
              }
            },
          })
        : null,
    );
    stageMsg.hidden = false;
    syncPlayButton();
  }

  // 7. URL sync (debounced; created before the engine so every handler can call it).
  const urlSync = createUrlSync({
    metaParams: meta.params,
    setup,
    getState: () => ({ params, preset: presetName, flags: { embed: flags.embed, theme: theme === 'dark' ? 'dark' : null, present: flags.present, test: flags.test, playlist: flags.playlist, i: flags.i } }),
  });

  // Create the engine once fonts are ready (canvas text must not flash a fallback font).
  await ensureFonts();
  try {
    createEngine(params);
  } catch (err) {
    console.error(err);
    errors.push({ message: err.message });
    showError('This simulation could not start.', err.message, false);
    rejectReady(err);
    return;
  }

  function syncControls() {
    for (const [key, control] of controls) {
      if (key === '__preset') control.setValue(presetName ?? 'default');
      else control.setValue(params[key]);
    }
    for (const [key, wrap] of controlWraps) wrap.hidden = !isVisible(applicable.get(key), params);
  }

  function updateAria() {
    clearTimeout(ariaTimer);
    ariaTimer = setTimeout(() => {
      const text = (typeof engine?.describe === 'function' && guard(() => engine.describe())) || `${title} simulation`;
      stage.setAttribute('aria-label', text);
    }, 250);
  }

  function afterParamsChange({ fromEngine, changedKey } = {}) {
    params = engine.getParams();
    // Keep the moved control as the user left it; update the rest (the engine may have clamped or derived values).
    for (const [key, control] of controls) {
      if (key === '__preset' || (!fromEngine && key === changedKey && params[key] === control.getValue?.())) continue;
      control.setValue(params[key]);
    }
    for (const [key, wrap] of controlWraps) wrap.hidden = !isVisible(applicable.get(key), params);
    updateAria();
    urlSync();
  }

  function applyPreset(name) {
    presetName = name === 'default' ? null : name;
    const next = resolveParams({ metaParams: meta.params, setup, presets: config.presets, presetName });
    guard(() => {
      engine.pause();
      engine.setParams(next);
      engine.reset();
    });
    params = engine.getParams();
    syncControls();
    syncPlayButton();
    updateAria();
    urlSync();
  }

  function syncPlayButton() {
    const playing = Boolean(engine && guard(() => engine.isPlaying()));
    playBtn.setIcon(playing ? 'pause' : 'play');
    playBtn.setLabel(playing ? 'Pause' : 'Play');
    playBtn.setPressed(playing);
  }

  function togglePlay() {
    if (!engine || isStatic) return;
    guard(() => {
      if (engine.isPlaying()) engine.pause();
      else {
        if (engine.isComplete()) engine.reset();
        engine.play();
      }
    });
    syncPlayButton();
  }

  function stepOnce() {
    if (!engine || isStatic) return;
    guard(() => {
      engine.pause();
      engine.step(meta.stepSize ?? 1);
    });
    syncPlayButton();
  }

  function resetRun() {
    if (!engine) return;
    guard(() => engine.reset());
    syncPlayButton();
  }

  function shareUrls() {
    const query = toQuery(params, meta.params, setup, { preset: presetName, flags: { theme: theme === 'dark' ? 'dark' : null } });
    const base = `${location.origin}${location.pathname}`;
    const url = query ? `${base}?${query}` : base;
    return { url, embedUrl: withQuery(url, 'embed=1') };
  }

  async function share() {
    const { url, embedUrl } = shareUrls();
    await qrModal({ title: 'Share this scenario', url, embedUrl, note: 'The link opens this exact scenario. The embed code works in Google Classroom, Canvas and OneNote without signing in.' });
  }

  function save() {
    if (!session) return;
    const date = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
    const field = textField({ label: 'Name this scenario', value: `${title}, ${date}` });
    const saveAction = button({
      label: 'Save',
      variant: 'primary',
      icon: 'save',
      onClick: async () => {
        saveAction.setBusy(true);
        try {
          await saveScenario({ interactiveId: config.id, title: field.getValue(), params: engine.getParams() });
          dlg.close();
          toast('Saved. Find it on your dashboard.', { kind: 'ok' });
        } catch (err) {
          saveAction.setBusy(false);
          toast(err.message, { kind: 'error' });
        }
      },
    });
    const dlg = modal({ title: 'Save scenario', content: el('div', { class: 'stack' }, field, el('p', { class: 'muted', style: { fontSize: '14px' }, text: 'Saves every current value. Only you can see your saved scenarios.' })), actions: [button({ label: 'Cancel', variant: 'ghost', onClick: () => dlg.close() }), saveAction] }).open();
    field.input.select();
  }

  function exportCsv() {
    const data = guard(() => engine.getData());
    if (!data) return;
    if (!data.rows?.length) {
      toast('No data yet. Run the simulation first.');
      return;
    }
    const name = downloadCSV(config.id, data);
    toast(`Downloaded ${name}`, { kind: 'ok' });
  }

  function toggleTheme() {
    theme = theme === 'dark' ? 'projector' : 'dark';
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('hsc:theme', theme);
    themeBtn.setPressed(theme === 'dark');
    guard(() => engine.setTheme(theme));
    urlSync();
  }

  function togglePresenter() {
    flags.present = !flags.present;
    document.body.classList.toggle('is-presenter', flags.present);
    presentBtn.setPressed(flags.present);
    urlSync();
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else stageCol.requestFullscreen?.().catch(() => toast('Full screen is not available here.'));
  }
  document.addEventListener('fullscreenchange', () => fullBtn.setPressed(Boolean(document.fullscreenElement)));

  function showShortcuts() {
    modal({
      title: 'Keyboard shortcuts',
      content: el(
        'dl',
        { class: 'stack', style: { '--stack-gap': '10px' } },
        SHORTCUTS.map(([key, what]) => el('div', { class: 'spread' }, el('dt', {}, el('kbd', { text: key })), el('dd', { class: 'muted', text: what }))),
      ),
    }).open();
  }

  let notesDrawer = null;
  async function openNotes() {
    if (!config.notes || flags.embed) return;
    if (!notesDrawer) {
      const body = el('div', { class: 'prose', text: 'Loading notes…' });
      notesDrawer = drawer({ title: 'Teacher notes', content: body });
      try {
        const res = await fetch(config.notes);
        if (!res.ok) throw new Error(String(res.status));
        const md = stripFrontmatter(await res.text());
        body.innerHTML = await renderMarkdown(md);
      } catch {
        body.textContent = 'Teacher notes for this interactive are on the way.';
      }
    }
    notesDrawer.open();
  }

  // 6. Keyboard shortcuts.
  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    if (document.querySelector('dialog[open]')) return;
    const t = e.target;
    const typing = t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) && !(t instanceof HTMLInputElement && t.type === 'range');
    if (typing) return;
    const onButton = t instanceof HTMLElement && ['BUTTON', 'A'].includes(t.tagName);
    const key = e.key;
    if (key === ' ' && !onButton) {
      e.preventDefault();
      togglePlay();
    } else if (key === '.') stepOnce();
    else if (key === 'r' || key === 'R') resetRun();
    else if (key === 'f' || key === 'F') toggleFullscreen();
    else if (key === 'p' || key === 'P') togglePresenter();
    else if (key === 't' || key === 'T') toggleTheme();
    else if (key === 'n' || key === 'N') openNotes();
    else if (key === '?') showShortcuts();
  });


  // Resize: one engine.resize() per frame at most.
  let resizeRaf = 0;
  const ro = new ResizeObserver(() => {
    if (resizeRaf) return;
    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = 0;
      guard(() => engine?.resize());
    });
  });
  ro.observe(stage);

  // Playlist navigation (?playlist=<id>&i=<n>), used by the dashboard's "open in sequence".
  if (flags.playlist && session) {
    listPlaylists()
      .then((lists) => {
        const list = lists.find((p) => p.id === flags.playlist);
        if (!list || !list.items.length) return;
        const link = (i) => {
          const item = list.items[i];
          const target = catalog.entries.find((e) => e.id === item.interactiveId);
          if (!target) return null;
          return withQuery(target.path, genericQuery(item.params || {}, { extra: { playlist: list.id, i } }));
        };
        const prev = flags.i > 0 ? link(flags.i - 1) : null;
        const next = flags.i < list.items.length - 1 ? link(flags.i + 1) : null;
        playlistNav.append(
          prev ? button({ label: 'Previous in playlist', icon: 'arrowLeft', iconOnly: true, href: prev }) : null,
          el('span', { text: `${list.title} · ${flags.i + 1} of ${list.items.length}` }),
          list.items[flags.i]?.note ? el('span', { class: 'hsc-playlist__note', text: list.items[flags.i].note, title: list.items[flags.i].note }) : null,
          next ? button({ label: 'Next in playlist', icon: 'arrowRight', iconOnly: true, href: next }) : null,
        );
        playlistNav.hidden = false;
      })
      .catch(() => {});
  }

  syncControls();
  syncPlayButton();
  urlSync();
  window.addEventListener('pagehide', () => {
    clearInterval(summaryTimer);
    ro.disconnect();
    try {
      engine?.destroy();
    } catch {
      /* ignore */
    }
  });
  resolveReady({ id: config.id, engine: meta.name, setup });
  return { get engine() { return engine; }, meta, setup };
}
