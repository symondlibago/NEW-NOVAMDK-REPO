# NovaMDK

Telehealth site for NovaMDK. Vite + React 19 SPA, deployed on Vercel, with
serverless functions in `api/`. It integrates MD Integrations (the clinical
system), GoHighLevel (CRM and messaging), Stripe (payments) and Kurv (payment
fallback).

Real patients and real money flow through this code. Read this file before
changing anything.

## How changes reach production

- `main` is the Vercel production branch. A merge to `main` is the go-live moment.
- Never commit or push to `main` directly. Work on a branch and open a pull request.
- Every branch push builds a Vercel preview URL. Preview deploys run the real
  `api/` functions against whatever keys are scoped to the Preview environment,
  so a preview is not a sandbox. Assume a click there can create real records.
- Symond reviews and merges. Nothing is merged by the author.

## Do not touch without asking

These directories carry payments, prescriptions and patient data. Changing them
by accident is how someone gets double charged or sees another patient's record.

- `api/` - all serverless functions, including payment capture and webhooks
- `src/lib/portal.js`, `src/lib/planStatus.js`, `src/lib/portalCatalog.js`
- `src/components/portal/`
- `src/pages/PatientPortal.jsx`, `src/pages/Intake*`

If a task seems to need a change in there, stop and say so rather than making it.

## Hard constraints

- **Vercel function cap.** Hobby allows 12 serverless functions and all 12 are
  used. Files in `api/` prefixed with `_` are shared helpers, not routed
  functions. Adding a new routed file in `api/` fails the build. New endpoints
  go inside the existing `api/portal.js` as another `resource`.
- **No clinical data outside MD Integrations.** Questionnaire answers,
  diagnoses, prescriptions, medication names, dosages and provider notes must
  never be sent to GoHighLevel, GA4, Google Tag Manager, Meta or Kurv. Those
  systems get identity and order metadata only.
- **No secrets in the repo.** Keys live in Vercel environment variables. `.env`
  is gitignored and holds test keys only. Never hardcode a key as a fallback
  value, and never add one to an example file.
- **No em dashes in user facing copy.** Use a comma or a colon instead. This
  applies to anything a patient or visitor reads, not to code comments.
- **Compliance copy rules.** Public pages must not state doses, promise
  outcomes, or imply a prescription is guaranteed. Language is provider guided.
  If a copy change touches claims about treatment, flag it for review rather
  than writing it.

## Working locally

```
npm install
npm run dev      # Vite on port 5173
npm run build    # syncs blog, generates sitemap and prices, builds, prerenders
npm run lint
```

`npm run build` is slow because it runs the content pipeline first. Run it
before opening a pull request. A build failure on Vercel is usually the
function cap or a missing environment variable, not the app code.

The dev server is often already running. Do not kill node processes to start
your own.

## Conventions

- Tailwind utilities only. Avoid `calc()` and arbitrary values, they are hard
  to debug later.
- Prefer plain functions and small modules over abstractions. Match the style of
  the file you are editing.
- Keep comments to the density already in the file.
