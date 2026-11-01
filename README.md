# Task Manager — project documentation

The project is deployed on Firebase Hosting: [https://task-manager-f67c6.web.app](https://task-manager-f67c6.web.app).

It uses Firebase Realtime Database: [https://task-manager-f67c6-default-rtdb.firebaseio.com](https://task-manager-f67c6-default-rtdb.firebaseio.com).

The database is created from [`data-generator/generate-data.js`](data-generator/generate-data.js). Every Firebase deploy regenerates those JSON files and writes them to the database. The hosting predeploy hook runs [`mock-server/seed-firebase.mjs`](mock-server/seed-firebase.mjs), which runs the generator, rebuilds `mock-server/db.json`, and replaces each collection. A deploy on `main` does this after the production build, so the live database is replaced with fresh data.

A task dashboard for creating, editing, deleting, searching, filtering, and moving work. It also shows live statistics, charts, a team roster, a calendar agenda, and a recent activity feed.

The desktop layout follows the [Figma design](https://www.figma.com/design/inRRwrw0RP3v5eIXVx6grq/senior---frontend?node-id=0-1). Tablet and phone reuse that layout.

The rest of this file explains what the product does, why it is built this way, where the design patterns live, and how SOLID shows up in the code.

## Demo

https://github.com/user-attachments/assets/e1204cc3-8f9b-438c-b1a5-c230ea52d0eb

## Technologies

| Layer         | What it uses                                                           |
| ------------- | ---------------------------------------------------------------------- |
| App           | Angular 21 standalone components, signals, and `httpResource`          |
| Language      | TypeScript 5.9, RxJS 7                                                 |
| UI            | Angular Material and Angular CDK                                       |
| Languages     | ngx-translate. English is the default; German switches at runtime      |
| Charts        | Chart.js 4                                                             |
| API (local)   | json-server on port 3000, seeded from `data-generator/`                |
| API (hosting) | Firebase Realtime Database REST, selected by `environment.firebase.ts` |
| Tests         | Vitest through the Angular unit-test builder                           |
| Quality       | ESLint, Prettier, Husky, Commitlint (Conventional Commits)             |
| Delivery      | Angular CLI, Docker (Node 22 and nginx), `docker compose`              |

## How to run

**Requirements:** Node.js 22 and npm 11 (`packageManager` is `npm@11.21.1`).

Install dependencies, then start the mock API and the dev server together:

```bash
npm install
npm start
```

`npm start` generates seed data, rebuilds `mock-server/db.json`, starts json-server on [http://localhost:3000](http://localhost:3000), and runs `ng serve`. Open the app at [http://localhost:4200](http://localhost:4200). Requests to `/api` are proxied to the mock server (`proxy.conf.json`).

Other scripts:

| Command                 | What it does                                              |
| ----------------------- | --------------------------------------------------------- |
| `npm run serve`         | Angular dev server only (the API must already be running) |
| `npm run api`           | json-server only, after rebuilding `db.json`              |
| `npm test`              | Unit tests once                                           |
| `npm run test:watch`    | Unit tests in watch mode                                  |
| `npm run test:coverage` | Unit tests with the 80% coverage gate                     |
| `npm run lint`          | ESLint                                                    |
| `npm run build`         | Production build (`production,firebase`)                  |

Docker serves the production build and the mock API without a local Node install:

```bash
docker compose up --build
```

The app is at [http://localhost:8080](http://localhost:8080). The API is at [http://localhost:3000](http://localhost:3000). Override the host ports with `WEB_PORT` and `API_PORT`.

## Features

| Area      | What the user can do                                                                                                    | Where it lives                |
| --------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| Dashboard | See four statistic cards, filter the board, drag tasks between columns, or move them from the card menu                 | `src/app/features/dashboard/` |
| Tasks     | Sort, page, and edit status in a table. On a narrow screen the table keeps title, status, and actions                   | `src/app/features/tasks/`     |
| Calendar  | Browse an agenda grouped by due date, with an Overdue bucket and a “Show completed” toggle                              | `src/app/features/calendar/`  |
| Analytics | Read status, priority, and workload charts, plus the activity feed                                                      | `src/app/features/analytics/` |
| Team      | See each person’s open, done, and overdue counts, then open their tasks                                                 | `src/app/features/team/`      |
| Settings  | See the current profile, choose English or German, and refresh cached data                                              | `src/app/features/settings/`  |
| Shell     | Search, switch language, open the overdue agenda, create a task, and navigate. Below 960px the sidebar becomes a drawer | `src/app/layout/`             |

Task fields are title, description, status (`todo`, `in_progress`, `done`), priority (`high`, `medium`, `low`), due date, assignee, and tags. Search matches title, description, and tags. Filters cover status, priority, and assignee. Filters are shared: the dashboard, the task table, and the header search all write the same `TaskStore` filter signal, so a search started in the header is already applied when the dashboard or task list is open.

Creating and editing use one reactive-form dialog. Deleting asks for confirmation. A failed write rolls the list back and shows a snackbar. Drag-and-drop is the pointer path. Keyboard users change status from **Move to** on the card or from the status control in the table.

Statistic values are counted from the task list, not copied from a separate endpoint. A create, a drag, or a delete updates the cards and the charts in the same turn. The `/statistics` response only supplies labels, icons, and trend text such as “+12 this week”.

## Architecture

```text
shell (smart)
├── dashboard     stats + filters + Kanban
├── tasks         sortable, paginated table
├── calendar      tasks grouped by due date
├── analytics     charts + activity
├── team          workload per person
└── settings      profile + cache refresh

core/models       Task, Activity, filters, statistics
core/state        TaskStore, UserStore, ActivityStore, StatisticsStore
core/api          TaskApiService (writes only)
core/http         cache, errors, retry, Firebase adapter
core/utils        pure filters, ordering, dates
core/services     notifications, data refresh
core/i18n         English and German dictionaries, language choice
shared/ui         presentational cards, filters, charts
shared/forms      validators and error display
shared/task-dialogs   create / edit / confirm
```

Pages are smart. They inject stores and `TaskActionsService`, then forward clicks. Cards, the board, the filter bar, charts, the activity feed, and the header are presentational. They take inputs and emit events. They do not call HTTP.

`TaskStore` is the source of truth for tasks. Reads use `httpResource`. Writes use `HttpClient` through `TaskApiService`, patch the list immediately, and restore the previous snapshot if the request fails.

Routes are lazy. `PreloadAllModules` fetches the other pages after first paint. Chart.js and the task dialogs load on first use. Every component uses `OnPush`.

## Technical decisions

### Signals and four stores, not NgRx

Four root stores cover the data the screens need: tasks, users, activity, and statistic-card metadata. Derived views (filtered list, board columns, counts, overdue total, chart series, team summaries) are `computed` signals, so they cannot drift from the list.

NgRx would add actions, reducers, effects, and selectors for a client that has one collection and a handful of reads. Caching belongs on the HTTP pipeline, where every GET benefits, rather than in effects that only some features remember to call.

`TaskStore` owns mutations. `StatisticsStore` never writes tasks. It overlays live counts onto the remote card definitions (`src/app/core/state/statistics.store.ts`). `UserStore` prefers `/users` and, if that list is empty, falls back to the assignees already present on tasks (`src/app/core/state/user.store.ts`).

### Reads and writes are different shapes

`httpResource` fits a GET that should expose `value`, `isLoading`, `error`, and `status` as signals. A create, a patch, or a delete is a one-shot call that must update the list before the response returns. Those go through `TaskApiService` and `HttpClient` (`src/app/core/api/task-api.service.ts`).

Activity writes are best-effort. `ActivityStore.record` prepends the entry locally and posts it in the background. A failed activity log is warned, not shown, because the task change already succeeded (`src/app/core/state/activity.store.ts`).

### Optimistic updates and fractional order

`TaskStore.optimistic` snapshots the list, applies the change, and writes the snapshot back if the request throws. The board, the table, and the counters all read `tasks()`, so they move together and roll back together (`src/app/core/state/task.store.ts`).

A drag persists only the moved task. `orderBetween` places its `order` halfway between the new neighbours (`ORDER_STEP` is 1000). The column does not get renumbered. If two orders eventually collide at floating-point precision, a later edit can still append with `nextOrderFor`. Both functions live in `src/app/core/utils/task.utils.ts`.

### HTTP pipeline

Interceptors run outer to inner (`src/app/app.config.ts`):

1. **Cache** — successful GETs are stored for `cacheTtlMs` (30 seconds). Any other method invalidates the collection URL when it settles. `BYPASS_CACHE` skips a read but still stores the fresh response (`src/app/core/http/cache.interceptor.ts`).
2. **Errors** — after retries are exhausted, `HttpErrorResponse` becomes `ApiError` with a message safe to show (`src/app/core/http/error.interceptor.ts`, `src/app/core/http/api-error.ts`).
3. **Retry** — GET, HEAD, OPTIONS, PUT, and DELETE retry twice on status `0`, `408`, `429`, and `5xx`, with delays of 500 ms then 1 s. POST and PATCH are not retried, so a create cannot be duplicated (`src/app/core/http/retry.interceptor.ts`).
4. **Database adapter** — when `databaseUrl` is null, `/api` stays on json-server. When it is set, the same calls become Firebase Realtime Database REST calls, and object-shaped arrays are turned back into arrays before the stores see them (`src/app/core/http/database-api.interceptor.ts`).

The app speaks one API. Local `ng serve`, Docker, and Firebase Hosting differ only by environment (`src/environments/`). There is no sign-in. `CURRENT_USER` is a fixed person (`src/app/core/config/app-config.ts`).

### Loading, refresh, and the clock

`isInitialLoad` is true only until the first response, which is what skeleton screens use. Later reloads keep the current list on screen. Dashboard calls `reloadIfStale()` so a visit inside the cache window does not hit the network again.

`DataRefreshService` does not inject the stores. Each store registers a reload function from its constructor. Settings clears the HTTP cache and calls those functions. Injecting every store from Settings would construct `httpResource`s the page never displays (`src/app/core/services/data-refresh.service.ts`).

Business dates go through the `NOW` token instead of `new Date()` scattered through stores and validators. Tests replace the token with a fixed clock so “overdue” does not depend on the day the suite runs.

### Forms

The task dialog is a typed reactive form (`src/app/shared/task-dialogs/task-form-dialog/`):

- `notBlankValidator` rejects whitespace that `Validators.required` would accept.
- Tags are a `FormArray` that grows and shrinks from the chip input, capped by `maxItemsValidator` and checked by `uniqueItemsValidator`.
- `dueDateValidator` is a group validator: a due date in the past is allowed when the task is already done, or when the date is unchanged on an existing task.
- `CrossFieldErrorStateMatcher` paints the due-date field when the error sits on the group.
- Submit is blocked while a save is in flight. A rejected save stays in the dialog. Closing a dirty form asks for confirmation.
- `MatDialog` and the dialog components are imported on first open, so they stay out of the initial bundle (`TaskActionsService`).

### Languages

The UI is translated with [ngx-translate](https://github.com/ngx-translate/core). English is the default. German is the second language. The dictionaries live in `src/app/core/i18n/translations/` and are bundled, so a language change does not call the API and is not affected by the HTTP interceptors.

`LanguageService` remembers the choice in a cookie (`tm.language`), sets `lang` on the document, and updates the browser title and description. The header has an EN/DE control. Settings has the same choice with the language names. Dates use `en-US` or `de` (`DatePipe` and the Material date adapter). The paginator and the datepicker use translated Material labels.

Status, priority, due dates, relative times, validation, snackbars, and the known API error messages are translated. Task titles, descriptions, tags, and people’s names stay in the language they were saved in. An activity detail such as `To Do → In Progress` is translated when it is one of those status names.

### Performance and accessibility

- Standalone components, lazy `loadComponent` routes, `PreloadAllModules`.
- `OnPush` on every component. Lists track by id.
- Chart.js is a dynamic import behind `CHART_LOADER` (`src/app/shared/ui/chart/chart-loader.ts`).
- Material dialog and snack-bar modules load on first use.
- View transitions are enabled on the router. `prefers-reduced-motion` sets chart animation duration to 0.
- Skip link, labeled search, visible focus, status toggles, and a live region when filters change. Charts expose a visually hidden list of the same numbers. Priority and due-date text meets 4.5:1.

### Testing and delivery

Vitest runs through the Angular unit-test builder. Pure functions (`task.utils`, `date.utils`, validators, `sortTasks`, `buildAgenda`) are tested without `TestBed`. Stores and interceptors use `HttpTestingController`. Component tests replace dialogs and Chart.js. Coverage is enforced at 80%.

Husky runs ESLint and Prettier on commit. Commitlint requires [Conventional Commits](https://www.conventionalcommits.org/). CI runs format, lint, coverage, the production build, and `docker compose build`.

### Known limits

- One shared filter object. A status filter set on the dashboard is still set on the task table.
- No authentication, no roles, and no multi-user conflict handling beyond a 409 message.
- The HTTP cache is in memory for the tab. A refresh starts cold. Settings is the explicit “drop the cache and reload” control.
- Fractional `order` can theoretically exhaust precision after many drops between the same pair. The step of 1000 makes that unlikely for this dataset.
- Activity history is capped at 20 entries (`ACTIVITY_FEED_LIMIT`).
- Saved task text (titles, descriptions, tags) and people’s names are not translated.

## Design patterns

### Smart and presentational components

Smart components own orchestration. Presentational components own rendering.

| Smart            | Responsibility                                            |
| ---------------- | --------------------------------------------------------- |
| `ShellComponent` | Chrome, search routing, opening the create dialog         |
| `DashboardPage`  | Binds stores to the board and forwards move, edit, delete |
| `TasksPage`      | Sort, pagination, compact columns, inline status          |
| `CalendarPage`   | Agenda grouping and the completed toggle                  |
| `AnalyticsPage`  | Builds chart series from store counts                     |
| `TeamPage`       | Per-person summaries and navigation into `/tasks?userId=` |
| `SettingsPage`   | Profile and refresh                                       |

| Presentational                                                                                                                                                                  | Contract                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `TaskBoardComponent`                                                                                                                                                            | Columns in, `moved` / `edit` / `delete` / `statusChange` out. CDK drag-and-drop stays here |
| `TaskCardComponent`                                                                                                                                                             | One task in, intents out. No store                                                         |
| `TaskFilterBarComponent`                                                                                                                                                        | Current filters in, a partial filter change out                                            |
| `ChartComponent`                                                                                                                                                                | Labels and values in. Updates the existing Chart.js instance instead of recreating it      |
| `HeaderComponent`, `ActivityFeedComponent`, `StatCardComponent`, `EmptyStateComponent`, `ErrorStateComponent`, `SkeletonComponent`, `AvatarComponent`, `PriorityBadgeComponent` | Inputs and outputs only                                                                    |

`TaskCardComponent` is used by the board and by the calendar. Both parents handle `edit`, `delete`, and `statusChange` the same way, through `TaskActionsService`.

### Facade

`TaskActionsService` (`src/app/shared/task-dialogs/task-actions.service.ts`) is the UI entry for create, edit, delete, and move. Pages do not open `MatDialog` themselves and do not map store errors to snackbars themselves. The service lazy-loads the dialog, calls `TaskStore`, and uses `NotificationService` for the result.

`NotificationService` is a smaller facade over `MatSnackBar`, loaded on first toast (`src/app/core/services/notification.service.ts`).

### Chain of responsibility

Each HTTP interceptor handles one concern and forwards the request with `next`. Order is the policy: a cache hit never reaches retry or the network; retries run before errors are rewritten; the database adapter is closest to the wire so the cache stores the app’s `/api/...` URL, not the Firebase URL. Adding a concern means adding an interceptor in `app.config.ts`, not editing the stores.

### Adapter

`databaseApiInterceptor` adapts one client API onto two backends. Callers keep requesting `/api/tasks` and `/api/activities?_sort=timestamp&_order=desc&_limit=20`. When `databaseUrl` is set, the interceptor rewrites the URL to `…/{collection}/{id}.json`, turns POST-with-id into PUT, restores Realtime Database’s `{"0": …, "1": …}` arrays, and re-applies `_sort`, `_order`, and `_limit` because the REST API does not speak json-server query params.

### Proxy (caching)

`cacheInterceptor` plus `HttpCacheService` is a read-through cache. `get` returns a clone of the stored `HttpResponse` until `expiresAt`. Mutations call `invalidate` with the collection prefix, so `/api/tasks` also drops `/api/tasks?...`. `TaskStore.reloadIfStale` consults the same cache before asking `httpResource` to reload.

### Optimistic update

The private `optimistic` method in `TaskStore` is the only write path for create, update, move, and delete. Callers pass a pure projection of the next list and a request. The UI is a function of the list, so it does not need a separate “pending” model.

### Registry

`DataRefreshService` keeps a `Set` of reload functions. `registerForRefresh` adds the current store during construction. `refresh` clears the cache and invokes every registered function. Settings depends on the registry, not on a hard-coded list of stores.

### Strategy

Behavior is selected by a small map or a token instead of a growing `if` chain.

- `SORT_ACCESSORS` in `tasks.page.ts` maps a column id to a compare value. A new sortable column is a new entry.
- Validators in `src/app/shared/forms/validators.ts` are `ValidatorFn`s composed on the form group.
- `CHART_LOADER` is a token whose factory returns a function that builds a chart. Tests provide a fake factory. The component never imports `chart.js`.
- `isRetryable` decides whether a failure waits and retries or fails immediately.

### Dependency injection and injection tokens

Angular’s injector is the composition root (`app.config.ts` and `providedIn: 'root'`). Tokens that exist so tests and environments can replace a dependency:

| Token          | Production value              | Why it is a token                                                   |
| -------------- | ----------------------------- | ------------------------------------------------------------------- |
| `APP_CONFIG`   | The active `environment` file | Tests shorten TTL and retry delay without editing environment files |
| `NOW`          | `() => new Date()`            | Overdue checks and timestamps stay deterministic in tests           |
| `CURRENT_USER` | John Doe                      | No auth stack; the actor on activity entries is still injectable    |
| `CHART_LOADER` | Dynamic `import('chart.js')`  | Chart.js stays in its own chunk and out of unit tests               |
| `BYPASS_CACHE` | `false`                       | A single request can skip the cache without a new interceptor       |

### Lazy loading and code splitting

- Every route uses `loadComponent` (`src/app/app.routes.ts`).
- `PreloadAllModules` fills the remaining chunks after first paint.
- `TaskActionsService.dialog()` imports `@angular/material/dialog` and the dialog component together on first open.
- `CHART_LOADER` imports Chart.js on first chart render.
- The date adapter and form-field defaults are provided on the dialog component, so that code stays in the dialog chunk.

### Pure functional core

Filtering, grouping, counting, ordering, search matching, agenda grouping, and date math are pure functions in `src/app/core/utils/` and `buildAgenda` / `sortTasks` next to their pages. Stores and components call them. The functions do not inject services, which is why their tests do not create a `TestBed`.

### Observer

Signal writes are the subject. `computed` and templates are the observers. Examples: `filtersState` drives `filteredTasks`, `columns`, and the filter-result announcement; `httpResource` status drives skeletons and error states; chart `effect()` pushes new `ChartData` into the existing instance. `takeUntilDestroyed()` on the dialog’s backdrop and Escape stream drops that subscription with the component.

### Fallback (special case)

`UserStore.users` uses the user list when it has rows and otherwise derives assignees from tasks. `StatisticsStore.cards` starts from `DEFAULT_STATISTICS` and overlays whatever `/statistics` returned, then always replaces `value` with the live count. Screens render the same view model either way.

## SOLID

### Single responsibility

Each type has one reason to change.

| Type                                                                                 | One job                                    |
| ------------------------------------------------------------------------------------ | ------------------------------------------ |
| `TaskApiService`                                                                     | HTTP writes for tasks and activity         |
| `TaskStore`                                                                          | Task list, filters, and task mutations     |
| `UserStore`                                                                          | The assignee roster                        |
| `ActivityStore`                                                                      | The feed and appending a new entry         |
| `StatisticsStore`                                                                    | Card presentation plus live values         |
| `HttpCacheService`                                                                   | Store, expire, and drop cached responses   |
| `cacheInterceptor`, `errorInterceptor`, `retryInterceptor`, `databaseApiInterceptor` | One HTTP policy each                       |
| `NotificationService`                                                                | Toasts                                     |
| `TaskActionsService`                                                                 | Dialogs and user-facing success or failure |
| `DataRefreshService`                                                                 | “Reload what is already on screen”         |
| `task.utils.ts`, `date.utils.ts`, `validators.ts`                                    | Data in, data out                          |
| Presentational components                                                            | Render inputs and emit events              |

Pages stay thin for this reason. `DashboardPage` does not compute order keys, open dialogs, or talk to `HttpClient`. It reads signals and calls `TaskActionsService`.

### Open/closed

The pieces that grow do so by adding a collaborator, not by editing a central switch.

- A new HTTP policy is a new interceptor in the existing list. Stores keep calling `/api/...`.
- A new validator is another `ValidatorFn` on the form. The dialog’s submit path still checks `form.invalid`.
- A new sortable column is an entry in `SORT_ACCESSORS` and a header in the table.
- A new environment (shorter cache, another database URL, a fake clock) is another provider for `APP_CONFIG`, `databaseUrl`, or `NOW`. Call sites keep injecting the token.
- `ChartComponent` depends on `ChartFactory`. A different chart implementation can be provided for tests without changing the component.

Status and priority labels are records keyed by the union (`STATUS_LABELS`, `PRIORITY_LABELS`). Adding a value starts at the model union and the record, which is the closed set of legal tasks, and the UI maps over `TASK_STATUSES` / `TASK_PRIORITIES` rather than duplicating the list.

### Liskov substitution

Callers rely on a small contract and keep working when another implementation is provided.

- Anything provided as `CHART_LOADER` must return a `ChartFactory`. `ChartInstance` only requires `data`, `update()`, and `destroy()`. The real Chart.js object satisfies that. The test double does too. `ChartComponent` does not branch on which one it received.
- `errorMessage` accepts `ApiError`, `HttpErrorResponse`, or a generic `Error` and always returns a string. `ApiError` extends `Error`, so a `catch` that only knows `Error` still works, and a UI that only needs a message does not inspect the status.
- `UserStore.users` is `Assignee[]` whether the rows came from `/users` or from `uniqueAssignees`. Team, filters, and the form bind to that array and do not know which source filled it.
- `TaskCardComponent` behaves the same on the board and on the calendar. Parents may ignore an output. The card does not change its inputs based on who hosts it.
- `NOW` is `() => Date`. Production returns the current time. Tests return a fixed instant. `isOverdue`, activity timestamps, and `dueDateValidator` all call the function they were given.

### Interface segregation

Types expose the fields a caller actually uses.

- `TaskDraft` is `Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'dueDate' | 'assignee' | 'tags'>`. The form never supplies `id`, `order`, or `createdAt`. The store adds those.
- `ActivityStore.record` takes `Pick<Task, 'id' | 'title'>`, not a full task.
- `ChartInstance` is the slice of Chart.js the wrapper uses, so the component is not tied to plugins, scales, or the rest of the library type.
- `TaskFormDialogData.save` is `(draft: TaskDraft) => Promise<void>`. The dialog does not import `TaskStore`. Create and edit pass different closures.
- `HeaderComponent` takes `search`, `overdueCount`, and a small user shape. It does not take `TaskStore`.
- `TaskFilterBarComponent` emits `Partial<TaskFilters>`, so a status click does not rebuild assignee and priority.
- `TaskMove` is `{ task, status, index }`. The board does not know about fractional order.

### Dependency inversion

High-level code depends on abstractions. Low-level details are injected.

- Feature pages depend on `TaskStore`, `UserStore`, and `TaskActionsService`. They do not import `HttpClient`, `environment`, or `MatDialog`.
- `TaskStore` depends on `TaskApiService` for writes and on `httpResource` for reads. URL prefixes come from `APP_CONFIG`, not from a hard-coded host.
- `ChartComponent` depends on the `CHART_LOADER` token. The dynamic import of Chart.js sits in the token factory.
- `SettingsPage` depends on `DataRefreshService`. It does not construct task, user, activity, or statistics resources.
- Date rules depend on `NOW`. They do not construct a clock.
- The shell and activity log depend on `CURRENT_USER`. They do not embed “John Doe” in the component.
- `NotificationService` sits between features and `MatSnackBar`. A different toast implementation can replace the service without editing every page.

`providedIn: 'root'` is the default scope because each store and the cache must be singletons for the tab. The dialog’s date adapter is an exception on purpose: it is provided on the component so the lazy chunk owns it.

## Request lifecycle

Creating a task:

1. The shell or a page calls `TaskActionsService.openCreate`.
2. The service loads `MatDialog` and `TaskFormDialogComponent`.
3. The dialog validates the draft and calls the `save` closure.
4. `TaskStore.create` builds `id`, `order`, and timestamps, inserts the task into `httpResource`’s value, then `POST`s it.
5. The cache interceptor invalidates `/api/tasks` when the POST settles.
6. On success, `ActivityStore.record` prepends a feed entry and posts it. The service shows a success snackbar.
7. On failure, `optimistic` restores the snapshot, the interceptor has already mapped the body to `ApiError`, and the dialog shows `errorMessage`.

Moving a card:

1. `TaskBoardComponent` emits `TaskMove` from the CDK drop. A keyboard **Move to** emits `TaskStatusChange` instead.
2. The page calls `TaskActionsService.move` or `changeStatus`.
3. `TaskStore.move` computes `orderBetween` the visible siblings and patches status, order, `completedAt`, and `updatedAt`.
4. Only that task is `PATCH`ed. The board re-renders because `columns` is computed from `tasks()`.
