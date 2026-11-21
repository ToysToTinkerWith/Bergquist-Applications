# Contact Email

## Resend (Preferred)

Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` in the ignored root `.env` and
`functions/.env`, then rebuild and deploy. The sender can be a single address
or `Bergquist Applications <hello@bergquistapplications.com>`. Its domain must
be verified in Resend. These settings take precedence over SMTP; partial Resend
settings disable sending rather than silently switching providers.

The server sends plain text to the fixed recipient through Resend's HTTPS API.
The visitor is Reply-To, never From. A 20-second timeout, per-attempt idempotency
key, existing Firestore quotas, and non-revealing errors apply. No automatic
retry occurs. Success requires a successful response with an email ID; it means
provider acceptance, not confirmed inbox delivery. No additional SDK is needed.

Keep keys private, never use NEXT_PUBLIC variables, and rotate any key shared
in chat. Update both private environments and redeploy after rotation. See
[Resend's sending documentation](https://resend.com/docs/api-reference/emails/send-email).

## SMTP Alternative

The contact endpoint uses Nodemailer SMTP and always sends to the fixed
`CONTACT_EMAIL` in `lib/contactDetails.js`: `abergquist96@gmail.com`.
Request fields and environment variables cannot override that recipient.
The visitor appears in `Reply-To`, never `From`. The plain-text email includes
name, email, business, project type, and message.

No SMTP credentials or Firebase email extension are supplied by this change.
Configuration is provider-neutral until the owner chooses Gmail or an existing
SMTP service. No extension is required.

## Private Server Configuration

Provide these values through private server environment configuration:

| Variable | Value |
| --- | --- |
| `CONTACT_SMTP_HOST` | Provider hostname, for example `smtp.gmail.com` |
| `CONTACT_SMTP_PORT` | `465` (default) or `587` |
| `CONTACT_SMTP_USER` | SMTP login; Gmail uses the complete email address |
| `CONTACT_SMTP_PASSWORD` | SMTP password or Gmail app password |
| `CONTACT_SMTP_FROM` | Optional single email address; defaults to the SMTP user |

For services with a non-email login such as `apikey`, explicitly set
`CONTACT_SMTP_FROM` to a sender address verified with that provider. Display-name
address lists are not supported. Use the provider's DNS/domain verification
process where required.

For this repository, set private values in the ignored root `.env` for Next's
build-time configuration and in `functions/.env` for the Firebase runtime.
`scripts/build-production.cjs` does not copy environment files. Set both
explicitly; rebuild and redeploy after configuring or changing these values.
The root `.env` also works for local development. Ensure credential-bearing
files stay untracked. Platform-managed secrets are an
alternative when explicitly bound to the server runtime. Never use
`NEXT_PUBLIC_` prefixes, `next.config.js`'s `env` option, committed credentials,
client imports, page props containing configuration, or credential logging.

Gmail requires 2-Step Verification and a separate app password when available
for the account; do not use the ordinary account password. Enter the generated
app password without its display spaces. Account or organization restrictions
can make app passwords unavailable. Google revokes app passwords after an account
password change. See [Google's app-password instructions](https://support.google.com/mail/answer/185833).

Port 465 uses immediate TLS. Port 587 requires STARTTLS. Certificate validation
stays enabled, TLS 1.2 is the minimum, and DNS/connection/greeting/idle timeouts
are bounded. Debug and protocol logging are disabled. See
[Nodemailer's SMTP documentation](https://nodemailer.com/smtp).

## Frontend Contract

Only dynamically import the server module inside `getStaticProps`, for example:

```js
export async function getStaticProps() {
  const { isContactMailConfigured } = await import("../lib/contactMail")
  return { props: { emailDeliveryEnabled: isContactMailConfigured() } }
}
```

`getContactMailConfig()` returns `null` for missing/invalid configuration and a
private configuration object otherwise. `isContactMailConfigured()` returns a
boolean without connecting to SMTP or Firestore. It checks configuration shape,
not credential validity or service availability. Only the boolean belongs in
page props. Since `getStaticProps` runs at build time, provide configuration in
the build environment as well as the runtime when enabling that UI; rebuild
after changing its configured state. Keep runtime secrets out of browser bundles.

When unconfigured, preserve the email-app draft workflow and say nothing has
been sent. For direct sending, POST JSON to `/api/contact`:

```json
{
  "name": "Visitor Name",
  "email": "visitor@example.com",
  "company": "Example business",
  "project": "A new website",
  "message": "The project details.",
  "website": ""
}
```

The optional `website` honeypot must be exactly empty when present. `company`
is optional. Limits are name 100, email 200, company 120, and message 1200
characters, checked before trimming. Projects must exactly match `projectTypes`
from `lib/contactSubmission.js`. That module is safe for frontend reuse.

Success is HTTP 200 with `{ "ok": true }`, only after SMTP reports accepting the
fixed recipient. Acceptance does not guarantee inbox delivery. Every endpoint
failure includes a human-readable `error` string and a separate machine `code`.
Known pre-send failures use `{ "error": "...", "code": "not_sent" }`.
Statuses: 400 validation/JSON, 403 origin,
405 method, 413 body over 8192 bytes, 415 non-JSON/compressed body, 429 quota,
503 missing configuration or unavailable quota storage, 502 SMTP failure or
unconfirmed acceptance. Missing configuration explicitly includes `code: "not_sent"`.
SMTP timeout responses say sending could not be confirmed because the provider
may have accepted a message before the connection failed; those responses use
`code: "delivery_unconfirmed"`. Do not retry
automatically or claim success after any failed response.

## Origin And Quota Controls

Allowed production origins are exactly `https://bergquistapplications.com`,
`https://www.bergquistapplications.com`, `https://cleaning-7852d.web.app`, and
`https://cleaning-7852d.firebaseapp.com`. Missing origins are rejected. HTTP/HTTPS
loopback origins (`localhost`, `127.0.0.1`, `[::1]`, including ports) work only
outside production. Host headers do not expand the allowlist. There is no CORS
preflight allowance; the browser form should use its same-origin endpoint.
Origins deter browser abuse but are not authentication for non-browser clients.

Quota uses the existing Firebase Admin initialization and its server credentials.
All counters live in the separate `contactMailRateLimits` collection:

- Three attempts per normalized sender email in a rolling hour.
- Five attempts per trusted public visitor IP in a rolling hour, when available.
- One hundred total attempts per UTC calendar day.

A Firestore transaction reserves the applicable counters before SMTP. Failed SMTP
attempts consume quota. If Firestore fails, no SMTP attempt occurs. Counters are
shared across server instances; there is no memory-only fallback. Document IDs
hash sender/IP values; documents store timestamps and counters, not message
content or raw addresses. Hashes are pseudonymous, not anonymized data.

IP identity uses only the server adapter's concrete public `req.ip`. The adapter
must derive this from a direct client connection or known trusted proxy hops,
never an arbitrary first forwarded entry. Raw `X-Forwarded-For`, `X-Real-IP`, and
socket addresses are ignored. Missing, private, loopback, shared-address,
link-local, and reserved identities skip the IP bucket entirely; they never
create one shared five-attempt bucket for a Cloud Run/Firebase proxy. If an
adapter supplies a shared public proxy address, it must omit `req.ip` or resolve
the actual visitor using documented, trusted proxy topology. This module does
not infer that topology or enable proxy trust. Sender and global limits still
apply when IP identity is unavailable. IPv4-mapped IPv6 and IPv4 share a bucket.

Firestore Admin writes bypass client rules. This change does not alter assistant
quotas or Firestore rules. Keep this collection inaccessible to browser clients;
existing deployed rule coverage must be checked before production activation.
Documents include `expiresAt` for optional Firestore TTL cleanup. No TTL policy
is created here. Limits expire logically without TTL; inactive hashed bucket
documents remain until separately cleaned up.

## Verification

Run `node --test tests/contact-mail.test.cjs` from the app directory. Tests use
the repository's Babel/VM pattern, mock SMTP and Firestore, and exercise actual
API body parsing. They do not connect to SMTP, send email, change remote
configuration, or write to Firestore. No live send test or deployment is part
of this implementation.
