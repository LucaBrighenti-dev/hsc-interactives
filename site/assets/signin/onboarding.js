// Onboarding: pick the subjects you teach, optional display name, school and access code (Founding Educator badge).
// Resolves when saved or skipped. Access-code (class) sessions never see it.
import { saveProfile, redeemAccessCode } from '../auth.js';
import { SUBJECTS } from '../config.js';
import { el, modal, button, chip, textField, toast } from '../ui/index.js';

export function openOnboarding(profile = {}) {
  return new Promise((resolve) => {
    const chosen = new Set(profile.subjects || []);
    const chips = SUBJECTS.map((s) =>
      chip({
        label: s.label,
        pressed: chosen.has(s.id),
        onToggle: (on) => {
          if (on) chosen.add(s.id);
          else chosen.delete(s.id);
          error.textContent = '';
        },
      }),
    );
    const name = textField({ label: 'Display name', value: profile.displayName || '', autocomplete: 'name' });
    const school = textField({ label: 'School (optional)', value: profile.school || '', autocomplete: 'organization' });
    const code = textField({ label: 'Access code (optional)', placeholder: 'ACCESS CODE' });
    code.input.classList.add('input--code');
    const error = el('p', { class: 'msg msg--error', role: 'status' });

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      dlg.close();
      resolve();
    };

    const save = button({
      label: 'Continue',
      variant: 'primary',
      onClick: async () => {
        if (!chosen.size) {
          error.textContent = 'Pick at least one subject, or skip for now.';
          return;
        }
        save.setBusy(true);
        try {
          await saveProfile({ displayName: name.getValue(), school: school.getValue(), subjects: [...chosen] });
          if (code.getValue().trim()) {
            const ok = await redeemAccessCode(code.getValue());
            toast(ok ? 'Welcome, Founding Educator.' : 'That access code did not work. You can add it later.', { kind: ok ? 'ok' : 'info' });
          }
          finish();
        } catch (err) {
          save.setBusy(false);
          error.textContent = err.message;
        }
      },
    });

    const content = el(
      'div',
      { class: 'stack' },
      el('p', { class: 'muted', text: 'Which subjects do you teach? Your dashboard opens on these first. You can change them any time.' }),
      el('div', { class: 'onboarding__subjects', role: 'group', aria: { label: 'Subjects' } }, chips),
      name,
      school,
      code,
      error,
    );
    const dlg = modal({
      title: 'Welcome',
      content,
      actions: [button({ label: 'Skip for now', variant: 'ghost', onClick: finish }), save],
      onClose: () => {
        if (!done) {
          done = true;
          resolve();
        }
      },
    }).open();
  });
}
