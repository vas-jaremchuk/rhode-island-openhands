# `contact-submission`

One record of what a visitor sent through the contact form
(`reference/spec/03-backend.md` §5). It is data, not editorial content, so the
type is not localized (no draft/published pair), the admin offers no "New
Submission" button, and the `contact-form` service inserts records with an
elevated request (§7).

Open the list from the admin bar: **Contact Submissions**.

## Permissions

| Role | Can |
|------|-----|
| Admin | Read, list, change any field. |
| Editor | Read and list, change `status` only. Every other field is read-only; a save that carries another value leaves the stored value alone. |
| Contributor, guest, public | Nothing. `GET /api/v1/contact-submission` answers 403 (there is no `publicApiProjection`). |

`viewRole` and `editRole` are both `editor`. The REST API says 403 rather than
the core default 404, because a contributor passes core's `view-draft` gate.

## Fields

| Field | Type | Notes |
|-------|------|-------|
| `title` | string | Auto: `"<fullName> – <areaOfInterest>"`, set on every convert. Read-only. |
| `status` | select `new` / `handled` | Default `new`; the only field an editor can change. |
| `fullName` | string, required, max 120 | As typed by the visitor. |
| `email` | email, required | As typed by the visitor. |
| `areaOfInterest` | string, required, max 120 | Must be a value of Global → Contact → Areas of interest (Q-10); the contact form service validates it (§7). |
| `emailSent` | boolean, default `false` | Set by the contact form service after the notification email goes out. |
| `meta` | object `{ ipHash, userAgent, referer }` | Read-only; captured by the service. `ipHash` is a salted SHA-256, the raw IP is never stored. |

`meta` is `readOnly` in the schema, so `convert` never fills it from input: the
service assigns `doc.meta` on the new instance before `insert`.

## Retention

`node app site:purge-submissions --days=N` deletes submissions older than N days
(default 365, Q-7). See the `site` module.
