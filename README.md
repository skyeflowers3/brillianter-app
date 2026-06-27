# Brillianter

**Live demo: [https://brillianter-app.web.app](https://brillianter-app.web.app)**

**Subject: Linear Algebra** (introductory vectors).

Brillianter is a learn-by-doing educational platform inspired by Brilliant. Instead of
teaching through videos or long text, learners build intuition by directly manipulating
visualizations, answering questions, and getting immediate feedback. The MVP focuses on
a single introductory **linear algebra** course covering vectors and vector operations —
drawing, adding, subtracting, negating, scaling, and combining them — with live SVG
diagrams, immediate feedback, hints, skill checks, and progress tracking.

Built with **React 19**, **TypeScript**, and **Vite**, using **Firebase**
(Authentication + Cloud Firestore + Hosting) for sign-in, persisted progress, and
deployment. The UI is mobile-responsive.

## Live demo

The app is deployed on Firebase Hosting:

- **[https://brillianter-app.web.app](https://brillianter-app.web.app)**
  (also reachable at [https://brillianter-app.firebaseapp.com](https://brillianter-app.firebaseapp.com))

**Accessing the demo:** progress is tied to an account, so sign in first. You can either:

- **Create an account** with any email + password on the sign-up screen, or
- **Continue with Google** for one-click sign-in.

New accounts start at Lesson 1 ("What is a Vector?") with later lessons gated until the
previous one is passed. Work through a lesson, take its skill check, and your progress,
mastery, and streak persist across sessions and devices.

## Who it's for (target persona)

**Primary user: an undergraduate student (ages 18–24) struggling with their first
linear algebra course.**

- **Background:** Can often follow examples in class but struggles to build intuition
  independently. Learns best by seeing concepts visually and interacting with them
  directly.
- **Goals:** Understand concepts instead of memorizing procedures, improve course
  performance, build confidence solving problems independently, and study in short
  sessions on a laptop or phone.
- **Pain points:** Lectures feel abstract, textbooks are dense with symbols and
  definitions, it's hard to visualize what vectors represent, and conventional practice
  problems give limited feedback.

Brillianter targets these pain points directly: every concept is taught through
interactive coordinate-plane diagrams with immediate, specific feedback and hints, so
the learner can experiment, recover from mistakes, and build geometric intuition rather
than rote procedure.

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

### Deployment

The app is deployed to **Firebase Hosting** at
[https://brillianter-app.web.app](https://brillianter-app.web.app). The following scripts
build and deploy it (they require the Firebase CLI and access to the project):

| Script | Command | Description |
| --- | --- | --- |
| `npm run firebase:deploy` | `npm run build && firebase deploy` | Build, then deploy hosting + Firestore rules + functions. |
| `npm run firebase:deploy:hosting` | `npm run build && firebase deploy --only hosting` | Build, then deploy the `dist/` site only. |
| `npm run firebase:deploy:rules` | `firebase deploy --only firestore:rules` | Deploy Firestore security rules only. |

The hosting and full-deploy scripts run `npm run build` first, so `dist/` always reflects
the latest code before it ships.

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
