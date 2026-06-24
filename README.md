# Brillianter

Brillianter is an interactive vector-math learning app. It guides learners through
lessons and skill checks on vectors — drawing, adding, subtracting, negating, and
scaling them — with live SVG diagrams, immediate feedback, hints, and progress
tracking.

Built with **React 19**, **TypeScript**, and **Vite**, using **Firebase**
(Authentication + Cloud Firestore) for sign-in and persisted progress. The UI is
mobile-responsive.

## Prerequisites

- **Node.js** 20+ (developed and tested on Node 23). The project uses Vite 8 and
  TypeScript 6, which target modern Node.
- **npm** (ships with Node). A `package-lock.json` is committed, so `npm` is the
  expected package manager.

## Local setup

Install dependencies:

```bash
npm install
```

### Firebase configuration

Firebase is initialized in `src/firebase.ts`. The web config is read from Vite
environment variables (`import.meta.env.*`), each with a hardcoded fallback for the
default `brillianter-app` project, so the app runs out of the box without a `.env`
file.

To point the app at your own Firebase project, copy the example file and fill in
your values:

```bash
cp .env.example .env.local
```

The following variables are read by `src/firebase.ts` (use these exact names):

| Variable | Purpose |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | Firebase web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Cloud Messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Analytics measurement ID |

Because Vite only exposes variables prefixed with `VITE_` to client code, these are
shipped to the browser by design — they are public Firebase web config, not server
secrets. Restrict access through Firebase Authentication and Firestore Security
Rules (`firestore.rules`), not by hiding these values.

## Available scripts

| Script | Command | Description |
| --- | --- | --- |
| `npm run dev` | `vite` | Start the Vite dev server with hot module replacement. |
| `npm run build` | `tsc -b && vite build` | Type-check the project and build for production into `dist/`. |
| `npm run lint` | `eslint .` | Lint the codebase with ESLint. |
| `npm test` | `vitest run` | Run the test suite once (CI mode). |
| `npm run test:watch` | `vitest` | Run tests in interactive watch mode. |
| `npm run preview` | `vite preview` | Serve the built `dist/` output locally to preview the production build. |
| `npm run seed` | `tsx scripts/seedFirestore.ts` | Seed lessons and questions into Firestore from `src/content/`. |

There are also `firebase:deploy`, `firebase:deploy:hosting`, and
`firebase:deploy:rules` scripts. **Deployment is out of scope for this phase** — the
scripts are documented here only for completeness and are not covered by these
instructions.

## Running the app

```bash
npm run dev
```

Vite starts a dev server (default `http://localhost:5173`) with hot reloading. The
URL is printed in the terminal.

## Testing

Tests use **Vitest** with **React Testing Library** and **jsdom**.

```bash
npm test          # run all tests once
npm run test:watch  # re-run tests on file changes
```

## Building & previewing

```bash
npm run build     # type-checks, then outputs a production bundle to dist/
npm run preview   # serves the dist/ build locally for a final check
```

`npm run build` produces the optimized static site in `dist/` (HTML, hashed JS/CSS
assets). `npm run preview` serves that exact output so you can verify the production
build before shipping.

### Seeding Firestore (optional)

`npm run seed` loads lesson and question content from `src/content/` into Firestore
using the Firebase Admin SDK. Provide credentials via the
`FIREBASE_SERVICE_ACCOUNT_PATH` environment variable (or rely on
`FIREBASE_PROJECT_ID` / application default credentials):

```bash
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccount.json npm run seed
```

Do not commit real service-account keys.

## Project structure

```
brillianter-app/
├── public/              # Static assets served as-is (favicon, icons)
├── scripts/             # Standalone scripts (seedFirestore.ts)
├── index.html           # Vite HTML entry point
└── src/
    ├── assets/          # Images bundled by Vite (hero, logos)
    ├── components/      # UI components (auth, dashboard, layout, lesson, skillcheck, svg, routing)
    ├── content/         # Lesson + question JSON content (lessons.json, questions/)
    ├── context/         # React context providers (auth, progress, lesson navigation)
    ├── hooks/           # Custom React hooks (useAuth, useLessons, useSvgPointer, …)
    ├── lib/             # Pure logic & helpers (vectorMath, svgMath, validation, dates, …)
    ├── pages/           # Route-level pages (Dashboard, Lesson, SkillCheck, Login)
    ├── services/        # Firestore/data access (lesson, question, progress, streak, auth, user)
    ├── styles/          # CSS (app.css, lesson.css)
    ├── types/           # Shared TypeScript types
    ├── firebase.ts      # Firebase app/auth/Firestore initialization
    └── main.tsx         # App bootstrap / React root
```

## Tech stack & notes

- **React 19** with **React Router 7** for routing.
- **TypeScript 6** for static typing.
- **Vite 8** for dev server, bundling, and preview.
- **Firebase 12** — Authentication and Cloud Firestore.
- **Vitest 3** with React Testing Library and jsdom for unit/component tests.
- `canvas-confetti` for celebratory lesson-completion effects.
- The UI is **mobile-responsive**.
