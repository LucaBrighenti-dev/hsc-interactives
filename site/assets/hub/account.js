// Account: display name, school and subjects (edit, save), the event code for the Founding Educator badge,
// and Delete account (confirmed in a modal, then back to the sign-in page). The privacy page promises this.
import { saveProfile, redeemAccessCode, deleteAccount } from '../auth.js';
import { SUBJECTS } from '../config.js';
import { el, nextId, button, chip, textField, modal, toast } from '../ui/index.js';
import { confirmDialog } from './common.js';

/**
 * @param {{ session: object, profile: { displayName: string, school: string, subjects: string[] },
 *   founding: boolean, onProfileSaved: (profile: object, founding: boolean) => void }} ctx
 */
export function openAccount(ctx) {
  const p = ctx.profile;
  const isCodeSession = ctx.session?.user?.kind === 'code';
  const name = textField({ label: 'Display name', value: p.displayName ?? '', autocomplete: 'name', maxLength: 80 });
  const school = textField({ label: 'School (optional)', value: p.school ?? '', autocomplete: 'organization', maxLength: 120 });

  const chosen = new Set(p.subjects ?? []);
  const subjectsId = nextId('hub-account-subjects');
  const chips = SUBJECTS.map((s) =>
    chip({
      label: s.label,
      pressed: chosen.has(s.id),
      onToggle: (on) => {
        if (on) chosen.add(s.id);
        else chosen.delete(s.id);
      },
    }),
  );
  const subjects = el(
    'div',
    { class: 'field' },
    el('span', { class: 'field__label', id: subjectsId, text: 'Subjects you teach' }),
    el('div', { class: 'hub-account__subjects', role: 'group', aria: { labelledby: subjectsId } }, chips),
    el('p', { class: 'hub-dialog__note', text: 'Your dashboard opens on these.' }),
  );

  let code = null;
  if (!ctx.founding) {
    code = textField({ label: 'Event access code (optional)', placeholder: 'ACCESS CODE', maxLength: 40 });
    code.input.classList.add('input--code');
  }

  const error = el('p', { class: 'msg msg--error', role: 'alert' });
  const save = button({
    label: 'Save changes',
    icon: 'check',
    variant: 'primary',
    onClick: async () => {
      save.setBusy(true);
      error.textContent = '';
      try {
        const saved = await saveProfile({ displayName: name.getValue(), school: school.getValue(), subjects: SUBJECTS.map((s) => s.id).filter((id) => chosen.has(id)) });
        let founding = ctx.founding;
        if (code?.getValue().trim()) {
          founding = await redeemAccessCode(code.getValue());
          if (!founding) {
            ctx.onProfileSaved(saved, false);
            save.setBusy(false);
            code.input.setAttribute('aria-invalid', 'true');
            error.textContent = 'Your profile is saved, but that access code did not work. Check it on the event card.';
            return;
          }
        }
        ctx.onProfileSaved(saved, founding);
        dlg.close();
        toast(founding && !ctx.founding ? 'Saved. Welcome, Founding Educator.' : 'Profile saved.', { kind: 'ok' });
      } catch (err) {
        save.setBusy(false);
        error.textContent = err.message;
      }
    },
  });

  const dangerId = nextId('hub-danger');
  const del = button({ label: 'Delete account', icon: 'trash', onClick: () => confirmDelete() });
  del.classList.add('hub-btn--danger');
  const danger = el(
    'section',
    { class: 'hub-danger', aria: { labelledby: dangerId } },
    el('h3', { class: 'hub-danger__title', id: dangerId, text: 'Delete your account' }),
    el('p', { class: 'hub-dialog__note', text: 'Removes your profile, saved scenarios, playlists, requests and votes for good. Links you have shared keep working: they carry settings, never your account.' }),
    del,
  );

  const dlg = modal({
    title: 'Your account',
    content: el(
      'div',
      { class: 'stack hub-account' },
      isCodeSession ? el('p', { class: 'hub-dialog__note hub-dialog__note--box', text: 'You signed in with an access code. If you are a student, leave your name and school blank: nothing here needs them.' }) : null,
      name,
      school,
      subjects,
      code,
      code ? el('p', { class: 'hub-dialog__note', text: 'Got the card from Teach the Teachers? Its code adds the Founding Educator badge.' }) : null,
      error,
      danger,
    ),
    actions: [button({ label: 'Cancel', variant: 'ghost', onClick: () => dlg.close() }), save],
  }).open();
  dlg.el.classList.add('hub-account-dialog');
  name.input.focus();

  function confirmDelete() {
    confirmDialog({
      title: 'Delete your account?',
      message: 'This permanently removes your profile, saved scenarios, playlists, requests and votes. It cannot be undone.',
      confirmLabel: 'Delete my account',
      cancelLabel: 'Keep my account',
      onConfirm: async () => {
        await deleteAccount();
        location.href = '/signin.html';
        await new Promise(() => {}); // stay busy until the sign-in page loads
      },
    });
  }
}
