// Shared e2e helpers.

/** Collect console errors and warnings, page errors and failed requests. Assert it is empty at the end. */
export function watchConsole(page) {
  const problems = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') problems.push(`${msg.type()}: ${msg.text()}`);
  });
  page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`));
  page.on('requestfailed', (req) => {
    const why = req.failure()?.errorText ?? '';
    // Navigations away (sign-in redirects, downloads) abort in-flight requests; those are not faults.
    if (!/ERR_ABORTED/.test(why)) problems.push(`requestfailed: ${req.url()} ${why}`);
  });
  page.on('response', (res) => {
    if (res.status() >= 400) problems.push(`http ${res.status()}: ${res.url()}`);
  });
  return problems;
}

/** Start every page signed in as a local-mode teacher (no UI needed). */
export async function signInLocal(page, { subjects = [], founding = false, name = 'Test Teacher' } = {}) {
  await page.addInitScript(
    ({ subjects, founding, name }) => {
      if (localStorage.getItem('hsc:session')) return;
      localStorage.setItem('hsc:session', JSON.stringify({ user: { id: 'local-google', kind: 'oauth', provider: 'google', email: null, name } }));
      localStorage.setItem('hsc:profile:local-google', JSON.stringify({ displayName: name, school: '', subjects, founding }));
    },
    { subjects, founding, name },
  );
}

/** Wait for the shell's test hooks (page opened with ?test=1). */
export async function hscReady(page) {
  await page.waitForFunction(() => window.__hsc);
  return page.evaluate(() => window.__hsc.ready);
}

/** True when the page scrolls sideways (a layout bug at that width). */
export async function overflowsX(page) {
  return page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
}
