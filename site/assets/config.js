// Site configuration (guide §5.6). Lead-owned. Luca edits the Supabase values after human task H3.
// Only the public anon key belongs here, never the service_role key.

export const SITE_NAME = 'HSC Interactives Hub'; // placeholder until Luca names it (H7)
export const SITE_TAGLINE = 'Interactive simulations for Extension Maths, Physics and Engineering Studies.';
export const SITE_CREDIT = 'Built by Luca Brighenti for UNSW Teach the Teachers 2026';

export const AUTH_MODE = 'local'; // 'local' until Supabase is configured (human task H3), then 'supabase'
export const SUPABASE_URL = '';
export const SUPABASE_ANON_KEY = ''; // public anon key only; never the service_role key

// Local mode only. Mirrors the access_codes table: 'event' codes make the account a Founding Educator.
export const LOCAL_ACCESS_CODES = [
  { code: 'TTT2026', kind: 'event' },
  { code: 'CLASS2026', kind: 'class' },
];

export const SUBJECTS = [
  { id: 'me1', label: 'Maths Extension 1', short: 'Maths Ext 1', folder: 'maths-ext1' },
  { id: 'me2', label: 'Maths Extension 2', short: 'Maths Ext 2', folder: 'maths-ext2' },
  { id: 'phy', label: 'Physics', short: 'Physics', folder: 'physics' },
  { id: 'eng', label: 'Engineering Studies', short: 'Engineering', folder: 'engineering' },
];
