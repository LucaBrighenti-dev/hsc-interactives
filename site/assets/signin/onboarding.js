// Onboarding (guide §6.4): the subjects you teach, a display name, an optional school and an optional
// access code (the shared event code adds the Founding Educator badge). Resolves when saved or skipped.
// Access-code (class) sessions never see it.
//
// A native modal <dialog>: focus stays inside, Esc skips, and the page behind is inert.
// Validation is inline; focus moves to the first field that needs attention.
import { saveProfile, redeemAccessCode } from '../auth.js';
import { SUBJECTS } from '../config.js';
import { el, nextId } from '../ui/dom.js';

const CODES = { me1: 'ME1', me2: 'ME2', phy: 'PHY', eng: 'ENG' };
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const pause = (ms) => new Promise((r) => setTimeout(r, reducedMotion() ? 0 : ms));

function field({ label, id, input, help, error }) {
  const describedBy = [help?.id, error.id].filter(Boolean).join(' ');
  input.setAttribute('aria-describedby', describedBy);
  return el('div', { class: 'field onboard__field' }, el('label', { class: 'field__label', for: id, text: label }), input, help, error);
}

/**
 * @param {{ displayName?: string, school?: string, subjects?: string[] }} [profile]
 * @returns {Promise<void>}
 */
export function openOnboarding(profile = {}) {
  return new Promise((resolve) => {
    const chosen = new Set(profile.subjects || []);
    const ids = { title: nextId('ob-title'), intro: nextId('ob-intro'), name: nextId('ob-name'), school: nextId('ob-school'), code: nextId('ob-code') };
    const err = {
      subjects: el('p', { class: 'msg msg--error onboard__error', id: nextId('ob-err'), hidden: true }),
      name: el('p', { class: 'msg msg--error onboard__error', id: nextId('ob-err'), hidden: true }),
      code: el('p', { class: 'msg msg--error onboard__error', id: nextId('ob-err'), hidden: true }),
    };
    const status = el('p', { class: 'msg onboard__status', role: 'status', aria: { live: 'polite' }, hidden: true });

    const tiles = SUBJECTS.map((s) =>
      el(
        'button',
        {
          class: 'onboard__subject',
          type: 'button',
          aria: { pressed: String(chosen.has(s.id)) },
          data: { subject: s.id },
          on: {
            click: (e) => {
              const btn = e.currentTarget;
              const on = btn.getAttribute('aria-pressed') !== 'true';
              btn.setAttribute('aria-pressed', String(on));
              if (on) chosen.add(s.id);
              else chosen.delete(s.id);
              if (chosen.size) hideError('subjects');
            },
          },
        },
        el('span', { class: 'onboard__box', aria: { hidden: 'true' } }),
        el('span', { class: 'onboard__subject-name', text: s.label }),
        el('span', { class: 'onboard__subject-code', aria: { hidden: 'true' }, text: CODES[s.id] || '' }),
      ),
    );

    const nameInput = el('input', { class: 'input', id: ids.name, type: 'text', autocomplete: 'name', maxlength: 80, required: true, spellcheck: 'false' });
    nameInput.value = profile.displayName || '';
    const schoolInput = el('input', { class: 'input', id: ids.school, type: 'text', autocomplete: 'organization', maxlength: 120 });
    schoolInput.value = profile.school || '';
    const codeInput = el('input', { class: 'input input--code', id: ids.code, type: 'text', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', maxlength: 40, placeholder: 'ACCESS CODE' });
    const codeHelp = el('p', { class: 'control-help', id: nextId('ob-help'), text: 'Have the Teach the Teachers code? Enter it for the Founding Educator badge.' });

    const skip = el('button', { class: 'btn btn--ghost', type: 'button', text: 'Skip for now' });
    const save = el('button', { class: 'btn btn--primary onboard__continue', type: 'submit' }, el('span', { text: 'Continue' }));

    const subjectsGroup = el(
      'fieldset',
      { class: 'onboard__group', aria: { describedby: err.subjects.id } },
      el('legend', { class: 'field__label onboard__legend', text: 'Subjects you teach' }),
      el('div', { class: 'onboard__subjects' }, tiles),
      err.subjects,
    );

    const form = el(
      'form',
      { class: 'onboard__form', novalidate: true, method: 'dialog' },
      el(
        'header',
        { class: 'onboard__head' },
        el('p', { class: 'onboard__kicker', text: 'Set up your dashboard' }),
        el('h2', { class: 'onboard__title', id: ids.title, text: 'Welcome' }),
        el('p', { class: 'onboard__intro', id: ids.intro, text: 'Choose the subjects you teach and your dashboard opens on them. You can change this any time.' }),
      ),
      el(
        'div',
        { class: 'onboard__body' },
        subjectsGroup,
        el(
          'div',
          { class: 'onboard__row' },
          field({ label: 'Display name', id: ids.name, input: nameInput, error: err.name }),
          field({ label: 'School (optional)', id: ids.school, input: schoolInput, error: el('p', { id: nextId('ob-err'), hidden: true }) }),
        ),
        field({ label: 'Access code (optional)', id: ids.code, input: codeInput, help: codeHelp, error: err.code }),
        status,
      ),
      el('footer', { class: 'onboard__foot' }, skip, save),
    );

    const dialog = el('dialog', { class: 'onboard', aria: { labelledby: ids.title, describedby: ids.intro } }, form);

    let done = false;
    let working = false;
    const finish = () => {
      if (done) return;
      done = true;
      if (dialog.open) dialog.close();
      dialog.remove();
      resolve();
    };

    function showError(key, text, input) {
      err[key].textContent = text;
      err[key].hidden = false;
      input?.setAttribute('aria-invalid', 'true');
    }
    function hideError(key) {
      err[key].textContent = '';
      err[key].hidden = true;
      ({ name: nameInput, code: codeInput })[key]?.removeAttribute('aria-invalid');
    }
    function setStatus(text, kind) {
      status.textContent = text;
      status.className = `msg onboard__status${kind ? ` msg--${kind}` : ''}`;
      status.hidden = !text;
    }
    function setWorking(on) {
      working = on;
      save.classList.toggle('is-busy', on);
      save.setAttribute('aria-busy', String(on));
      save.disabled = on;
      skip.disabled = on;
    }

    nameInput.addEventListener('input', () => nameInput.value.trim() && hideError('name'));
    codeInput.addEventListener('input', () => hideError('code'));
    skip.addEventListener('click', finish);
    // Esc skips, except while saving.
    dialog.addEventListener('cancel', (e) => {
      if (working) e.preventDefault();
    });
    dialog.addEventListener('close', finish);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (working) return;
      setStatus('');
      if (!chosen.size) {
        showError('subjects', 'Choose at least one subject, or skip for now.');
        tiles[0].focus();
        return;
      }
      const displayName = nameInput.value.trim();
      if (!displayName) {
        showError('name', 'Add a display name. It is how your dashboard greets you.', nameInput);
        nameInput.focus();
        return;
      }
      setWorking(true);
      try {
        await saveProfile({ displayName, school: schoolInput.value, subjects: SUBJECTS.map((s) => s.id).filter((id) => chosen.has(id)) });
        const code = codeInput.value.trim();
        if (code) {
          const ok = await redeemAccessCode(code);
          if (!ok) {
            setWorking(false);
            showError('code', 'That code did not work. Check it, or clear the box to carry on without it.', codeInput);
            codeInput.focus();
            codeInput.select();
            return;
          }
          setStatus('Founding Educator badge added. Taking you in…', 'ok');
          await pause(700);
        }
        finish();
      } catch (error) {
        setWorking(false);
        setStatus(error.message, 'error');
      }
    });

    document.body.append(dialog);
    dialog.showModal();
    tiles[0].focus();
  });
}
