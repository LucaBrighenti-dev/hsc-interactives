// HTTP response headers shared by the dev server and render.yaml.
// Keep CSP identical to the value in render.yaml (tests/engines/_repo.test.mjs checks this).
//
// - script-src has no 'unsafe-eval', so eval and new Function throw (guide §2 rule 5).
//   'unsafe-inline' is needed because each page mounts the shell from an inline module script (§5.2).
// - connect-src allows only this site and Supabase (guide §2 rule 12: no other third-party requests).
// - frame-ancestors * lets ?embed=1 pages sit inside Google Classroom, Canvas and OneNote.
export const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "frame-ancestors *",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

export const SECURITY_HEADERS = {
  'Content-Security-Policy': CSP,
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
};
