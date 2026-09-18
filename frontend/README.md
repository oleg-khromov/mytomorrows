# Frontend

Angular `21.2.7` frontend.

## Structure

- `src/app/core`: shared HTTP error handling.
- `src/app/features/trials/services`: API services and external communication.
- `src/app/features/trials/store`: signal-based feature state.
- `src/app/features/trials/models`: DTO/domain types, mapper functions, and a small barrel export.
- `src/app/features/trials/pages`: routed smart pages.
- `src/app/features/trials/components`: presentational components, autocomplete form, skeletons, and infinite-scroll sentinel.
- `src/locale`: Angular i18n translation files.
- `src/environments`: centralized Angular build-time configuration.

## Local Run

```bash
npm install
npm start
```

The app runs on `http://localhost:4200` and proxies `/api` to `http://localhost:8000`.

## Docker Run

From the parent `recreated_online_coding_task` folder:

```bash
docker compose up --build frontend
```

The frontend is served by nginx on `http://localhost:4200`.

## Vercel Deploy

Use `frontend` as the Vercel project root directory.

Production environment variable:

```bash
API_BASE_URL=https://YOUR-BACKEND.vercel.app/api/v1
```

If `API_BASE_URL` is not set, the build uses `/api/v1`, which is useful for same-origin deployments and local Docker/nginx proxying.

Vercel files:

- `vercel.json` sets the Angular build command, static output directory, and SPA fallback.
- `scripts/write-env.mjs` writes `src/environments/environment.generated.ts` before production builds.
- `src/environments/environment.ts` reads the generated API base URL.

## Angular i18n

User-facing strings are marked with Angular i18n attributes in templates. Feature stores keep state only and do not contain translated display copy. If a future non-template message needs translation, use `$localize`.

```bash
npm run extract-i18n
npm run build:en
npm run build:nl
```

Translations:

- source locale: `en-US`
- Dutch locale: `nl-NL`
- Dutch file: `src/locale/messages.nl.xlf`

## Tests

```bash
npm test
```

The focused tests cover API DTO mapping and signal store behavior.

## Performance And Type Safety

- Typing in the search input updates local signal state only.
- Autocomplete suggestions wait for `600ms` of quiet typing, require at least `3` characters, search conditions only, show a short input spinner while loading, and use `switchMap` to cancel pending timers or in-flight requests when typing continues.
- The search button is enabled only when the trimmed query has at least `3` characters.
- The clear button resets the query and loads all paginated trials.
- Full result search is called only after submit, infinite scroll, or query-param changes.
- The feature store uses RxJS `switchMap` to cancel the previous in-flight search before starting a newer one.
- Results append through an `IntersectionObserver` sentinel instead of pagination controls. The sentinel uses a `360px` root margin and re-checks when loading finishes, so it works across different window heights.
- The sticky search/count bar keeps the current total and loaded count visible while scrolling.
- Return-from-detail uses clean URL query params plus Angular router state for scroll restoration.
- Search and detail requests use a `500ms` minimum loading duration so skeleton states are visible during demos. In a real production app, we can tune or remove this based on measured UX.
- Search-page state is kept in URL query params. Trial detail links stay clean and use Angular router state only for the temporary "Back to search" query context.
- The frontend does not use `sessionStorage` or `localStorage`.
- The app uses strict TypeScript, typed DTO-to-model mapping, readonly result arrays, and constrained page-size types.
