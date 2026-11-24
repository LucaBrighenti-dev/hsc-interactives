# Supabase setup and test plan (human tasks H3–H6)

The site runs in local mode until these are done. Nothing here needs a secret in the repo: only the
project URL and the **anon public** key go in `site/assets/config.js`. Never commit the service-role key.

## H3: project and schema

1. New project, region **Sydney (ap-southeast-2)**.
2. SQL Editor → paste `migrations/0001_init.sql` → Run.
3. In `site/assets/config.js`: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `AUTH_MODE = 'supabase'`.

## H4: sign-in settings (Authentication in the dashboard)

- **URL configuration.** Site URL: the Render URL. Redirect URLs: `https://<render-domain>/**` and
  `http://localhost:5173/**`. Every sign-in returns to `/signin.html?next=…`, so the `/**` pattern is needed.
- **Google.** A Google Cloud OAuth client (web). Authorised redirect URI:
  `https://<project-ref>.supabase.co/auth/v1/callback`. Paste the client ID and secret into the Google provider.
- **Microsoft (provider "Azure").** An Entra app registration, *Accounts in any organizational directory*
  (multi-tenant) so any school's Microsoft 365 works. Same callback URL. Leave the tenant URL blank. Follow
  Supabase's Azure guide for the email optional claims; the site already asks for the `email` scope.
- **Email.** Turn on the Email provider (magic links). Supabase's built-in mailer only sends to the project's
  team members and a few emails an hour, so set up **custom SMTP** before the event.
- **Email templates (recommended).** In *Magic Link* and *Confirm signup*, make the link
  `{{ .SiteURL }}/signin.html?token_hash={{ .TokenHash }}&type=email`.
  The default link only works in the browser that asked for it; this one also works when a teacher asks on a
  laptop and opens the email on a phone. (`{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email` keeps the
  page they were heading to, but only works once the redirect URLs above are set.)
- **Anonymous sign-ins.** Turn on (access codes use them).
- **Rate limits.** The default for anonymous sign-ins is per IP address, and a whole room at the event shares
  one. Raise *anonymous users* (and *emails sent*, once custom SMTP is on) to a few hundred an hour for the day.

## H5: the access code

```sql
insert into public.access_codes (code, kind) values ('TTT2026', 'event');
```

## Test plan (after H3–H5; each line is what the page should show)

| Try | Expect |
| --- | --- |
| Continue with Microsoft (a school account) | Microsoft consent → back to "Signing you in…" → onboarding → dashboard |
| Continue with Google | Same as Microsoft |
| Turn Google off, then Continue with Google | "Google sign-in is not switched on yet…" under the buttons; no redirect |
| Cancel on the Microsoft or Google page | "Sign-in was cancelled or not allowed…" at the top of the card |
| Email me a sign-in link | "Check your inbox" → the link opens "Signing you in…" → onboarding |
| Open the same email link a second time | "That sign-in link has expired or has already been used…" |
| Open the link in a different browser (default template) | "…Open it in the same browser you asked for it from…" |
| Access code `ttt2026` | Dashboard with the Founding Educator badge, no onboarding |
| Access code `WRONG` | "That code did not work…" under the code field; no stray anonymous user in *Users* |
| Onboarding with the code `TTT2026` | Founding Educator badge on a Microsoft or Google account |
| Browser offline (DevTools → Network → Offline), then any button | "Could not reach the sign-in service…" |
| Sign out, then open any page | Back to the sign-in page, with `next` set |
| Delete account (dashboard), with a throwaway account | The user disappears from *Users*; signed out |
