# Glitch Gemini Hackathon waiver app

A deployable Next.js application for collecting two electronic waivers for the **Glitch Gemini Hackathon**:

1. the uploaded University of California student organization liability waiver, adapted into a web-based signing flow
2. a second **media release waiver** created for this project

The app is designed for Vercel deployment and stores signed packets as PDFs plus structured JSON records. In production it is intended to use a **private Vercel Blob store**. For local development, the app can fall back to a local `.local-data/` folder if `BLOB_READ_WRITE_TOKEN` is not configured.

## What is included

- participant signing flow at `/sign`
- conditional parent / guardian section that becomes required only when the participant is under 18
- combined packet PDF generation with signatures, timestamps, and audit metadata
- admin portal at `/admin`
- private file download route for packet PDFs and JSON records
- reusable waiver template system so more forms can be added later
- local development fallback storage

## Stack

- Next.js App Router
- Route Handlers for submission and admin endpoints
- PDFKit for generating signed packet PDFs
- Vercel Blob for persistent private file storage on Vercel

## Routes

- `/` — landing page
- `/sign` — signer workflow
- `/success/[submissionId]` — confirmation page
- `/admin` — password-protected admin portal
- `/api/submissions` — creates a signed packet submission
- `/api/admin/file` — streams a private packet file for authenticated admins

## Environment variables

Copy `.env.example` to `.env.local` and set values:

```bash
cp .env.example .env.local
```

Minimum local setup:

```env
ADMIN_PASSWORD=choose-a-password
SESSION_SECRET=choose-a-long-random-secret
```

Keep admin credentials server-side only. Do not expose them with `NEXT_PUBLIC_*`
environment variables or import the admin auth module into client components.

Recommended production setup on Vercel:

```env
ADMIN_PASSWORD=choose-a-password
SESSION_SECRET=choose-a-long-random-secret
BLOB_READ_WRITE_TOKEN=...
NEXT_PUBLIC_APP_NAME=Glitch Gemini Hackathon Waiver Packet
NEXT_PUBLIC_ORGANIZATION_NAME=GLITCH
NEXT_PUBLIC_EVENT_NAME=Glitch Gemini Hackathon
NEXT_PUBLIC_EVENT_DATE_LABEL=March 27-28, 2026
NEXT_PUBLIC_EVENT_DATE_RANGE_SHORT=3/27/2026 - 3/28/2026
NEXT_PUBLIC_EVENT_LOCATION=Carnesale Commons
NEXT_PUBLIC_EVENT_CAMPUS=Los Angeles
NEXT_PUBLIC_EVENT_CONTACT_EMAIL=
```

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Without `BLOB_READ_WRITE_TOKEN`, signed packets are saved to:

- `.local-data/packets/*.pdf`
- `.local-data/submissions/*.json`

That local storage mode is only for development convenience.

## Vercel deployment

### 1. Create the Vercel project

Import this repository into Vercel.

### 2. Create a private Blob store

In the Vercel project:

- go to **Storage**
- create a **Blob** store
- choose **Private** access
- attach the store to the project so `BLOB_READ_WRITE_TOKEN` is added

### 3. Add environment variables

Set these in the Vercel project settings:

- `ADMIN_PASSWORD`
- `SESSION_SECRET`
- `BLOB_READ_WRITE_TOKEN`
- any `NEXT_PUBLIC_*` event variables you want to override

### 4. Deploy

Push to your Git provider or run:

```bash
vercel
vercel --prod
```

## How submissions are stored

Each completed signing creates:

- `packets/<submissionId>.pdf` — the signed waiver packet
- `submissions/<submissionId>.json` — the structured record and audit snapshot

The admin portal lists records and links to both files.

## Parent / guardian behavior

- the participant's date of birth is required
- if the participant is **18 or older**, parent / guardian fields stay optional and hidden
- if the participant is **under 18**, parent / guardian name, relationship, email, and signature become required

## Media waiver

The media waiver lives in:

- `lib/waivers.js` for in-app rendering
- `docs/media-waiver.md` for plain-text review

The current media waiver is intentionally written in plain language, but because waivers are legal documents, you should still have counsel or your institution review it before production use.

## Source waiver

The original uploaded university waiver PDF is included at:

- `public/source-uc-liability-waiver.pdf`

## Reusing this for future events

You can add more forms by extending the waiver array in `lib/waivers.js`. The UI and packet generator are already set up to render multiple waiver definitions.
# glitch-hackathon-check-in
