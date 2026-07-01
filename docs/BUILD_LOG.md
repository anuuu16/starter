# Build log

Append-only record of phases that land. Newest at the top.

## 2026-07-01 — Backend i18n + server-side CRUD tables (users, lookups)

Two things: (1) added server-side i18n and (2) built the reusable server-paginated CRUD pattern, converting the flagship tables. The frontends already had react-i18next (app) + locale routing (web); the DataTable already had a server-driven mode — but **no page used it** and there was no reusable pagination infra.

### Server-side i18n (backend) — runtime-verified
- Added `nestjs-i18n`. `I18nModule.forRoot` in `app.module.ts` resolves language from `?lang=`, `x-lang` header, or `Accept-Language` (fallback `en`). Locale files live in `apps/api/src/assets/i18n/<lng>/common.json` (en + hi) and ride the existing webpack `assets` glob into `dist/apps/api/assets/i18n`, so `join(__dirname,'/assets/i18n/')` resolves in dev and prod.
- Demo: `GET /api/i18n-demo` (marked `@Public()`). Verified on a built instance: `?lang=hi` → `{"lang":"hi","hello":"नमस्ते",...}`, default → English, `x-lang: hi` header → Hindi. Interpolation (`welcome`) works.

### Reusable server-table infra
- `@org/hooks` → **`useServerTable`**: owns page (0-based, matches DataTable's TanStack `pageIndex`)/pageSize/debounced-query/sort, guards out-of-order responses, exposes a `server` binding for `<DataTable server={…} />` + `reload()`. `fetcher` receives 1-based `page` (natural for APIs) and returns `{ rows, total }`. This is the repeatable recipe for converting any large table.

### Users table — full server-side
- Backend `AdminService.getUsers` gained case-insensitive search (`q` across name/email/username) + allow-listed sort (`name|email|username|role|createdAt`) + dir; controller passes `q/sort/dir` (response shape unchanged → AdminDashboard still works).
- `ConfigUsers` rewritten onto `useServerTable` + DataTable server mode (server paging/search/sort) with role toggle + delete.

### Lookups — full CRUD + server-paginated list
- Backend: `getGroupsPaginated` (search/sort + value counts) at `GET /lookups/admin/groups`; group detail `GET /lookups/admin/group/:key` (incl. inactive values); group `PATCH/DELETE :id` (delete cascades values). Value CRUD already existed.
- DTOs in the shared lib: `libs/shared/dto/src/lib/lookup/*` (create/update group + value zod schemas), exported from `@org/dto`.
- Frontend pages (routes under `/config/lookups`): list (server table + New) → `/config/lookups`; create/edit group form (RHF + zodResolver + `@org/dto`) → `/new` & `/:key/edit`; group detail with a values CRUD table + add/edit dialog + toggle-active + delete → `/:key`. Replaces the old `AdminLookups` embed. `app.tsx` routes nested accordingly.

### i18n extraction
- Ran `pnpm i18n:extract`: app `translation.json` went 11 → 291 lines across en/es/fr/de/hi (new `config.lookups.*`, `config.users.*`, etc.). Non-English frontend locales hold English placeholders (real human/pro translation is separate content work; the `hi` **backend** strings are real Hindi).

### Verification
- `@org/app:typecheck` PASS; `@org/api` webpack build PASS (i18n assets copied); lint PASS for app/ui/hooks/dto/api (0 errors; pre-existing warnings only); backend i18n runtime-verified. **Not browser-verified:** the new frontend CRUD pages weren't clicked through (Chrome extension offline) — but they typecheck and the endpoints they call are verified.

## 2026-07-01 — Collapsible sidebar dashboard shell (app + admin)

Added a reusable, accessible, collapsible left-sidebar shell and adopted it across the React dashboard (`apps/app`). Previously `MainLayout` was a top-bar + avatar dropdown and the admin `/config` area used a static (non-collapsible) nav card crammed into a narrow `max-w-5xl` column.

- **`@org/ui` — `sidebar.tsx`** (new): composable primitives — `SidebarProvider`/`useSidebar` (collapse state persisted to `localStorage` key `sidebar:collapsed`), `Sidebar` (desktop rail, animates `w-64` ↔ `w-[4.5rem]`, hidden below `lg`), `SidebarMobile` (left `Sheet` drawer for `<lg`, forces labels visible, closes on link tap), `SidebarHeader`/`SidebarContent`/`SidebarFooter`/`SidebarGroup` (optional label), `SidebarItem` (router-agnostic — injects icon+label into a passed `<NavLink>` via `cloneElement`; shows a right-side tooltip when collapsed), `SidebarTrigger` (mobile hamburger) + `SidebarCollapseButton` (desktop toggle). Exported from the barrel. New dep: `lucide-react` (first icon library in the repo).
- **`MainLayout`** rebuilt as the sidebar app shell — brand, primary nav (Dashboard/Referrals/Settings), conditional Admin group, sticky topbar (mobile trigger + `ThemeSwitcher`), footer user menu (avatar + `DropdownMenu`: Settings/Admin/Logout).
- **`ConfigLayout`** upgraded to a **standalone full-width admin dashboard** with the same collapsible sidebar, grouped nav (Overview / People / Billing / Comms & AI / System) with icons, back-to-app + user menu footer. Pulled `/config/*` out of the `MainLayout` parent route in `app.tsx` into its own `ProtectedRoute` so it renders as its own shell (no nested sidebars). Admin role gate preserved. All strings `t('key','English')`.
- Pre-existing lint errors greened up (global `confirm` → `window.confirm` in `AdminDashboard.tsx`/`AdminLookups.tsx`).
- Verified: `@org/app:typecheck` PASS; `@org/app` + `@org/ui` lint PASS (only pre-existing warnings, none in new code); vite dev server compiles all new modules incl. `lucide-react` re-optimization with no errors. Browser extension unavailable → no runtime screenshot.
- Note: RHF+zod+`@org/dto` forms and the referral feature the request also mentioned already existed — this phase was purely the missing sidebar/dashboard shell.

## 2026-07-01 — Referrals + seed users + webhooks-no-redis boot fix

- **`referrals` module** — new `Referral` Prisma model + migration `referrals`. `ReferralsService.getMyCode(userId)` lazily assigns a stable 8-char code per user; `attachReferred(code, referredUserId)` links a signup to its referrer (idempotent + rejects self-referral). Stats + admin list + `markRewarded(id, metadata?)` hook. UI: `/referrals` (per-user share + stats) and `/config/referrals` (admin list + mark-awarded). Reward decision is left to the consuming project — boilerplate tracks status only. Docs in `docs/modules/referrals.md`. Index updated.
- **Seed users** — `tools/prisma/seed.ts` now bootstraps `admin@example.com` (role=admin) + `test@example.com` (role=user) with password `"password"` (override via `SEED_PASSWORD` env). `upsertUser` handles "row already owns this username under a different email" gracefully.
- **Webhooks boot fix** — `WebhooksModule.forRootAsync()` was unconditionally registering a BullMQ queue, which crashed boot with `Nest could not find BULLMQ_CONFIG(default)` whenever `REDIS_URL` was absent. Now mirrors the mail pattern exactly: no Redis → no queue + no processor; `WebhooksService.dispatch` falls back to its existing sync HTTP path.

## 2026-06-30 — Tier 1 + Tier 3 upgrade (docs/16)

**All 13 items complete.** Plan: `docs/16-tier1-tier3-PLAN.md`. Tier 2 deferred (project-specific).

### New Prisma models
`AuditLog`, `Organization`, `Membership`, `Invitation`, `ApiKey`, `TwoFactor`, `WebhookEndpoint`, `WebhookDelivery`, `IdempotencyKey`. Migration `20260630175637_tier1_modules` applied.

### New API modules
- **audit** (global) — `AuditService.record()` + `@Audit({ action, targetType })` + `AuditInterceptor`. Admin query at `/admin/audit`.
- **org** — `Organization` + `Membership` CRUD; role gating via `OrgService.assertMember`/`assertPrivileged`; creator becomes `owner`; last-owner protection.
- **invitations** — email + token + 7-day expiry + acceptance flow. New `invitation` mail template.
- **cron** — `@nestjs/schedule` with 4 generic jobs (idempotency.purge hourly, invitations.purge 6h, mail-logs.purge daily, audit.purge daily) + `POST /admin/cron/:name/run`.
- **cache** (global) — `CacheService` w/ `get/set/del/wrap(key, ttl, compute)`. Redis when `REDIS_URL` set, in-process LRU fallback.
- **api-keys** — `pak_<prefix>_<secret>` tokens; bcrypt-hashed at rest; `ApiKeyGuard` accepts `Authorization: Bearer pak_...`; raw token shown ONCE on create.
- **totp** — RFC 6238 via `otplib`; setup → confirm → recovery codes (bcrypt-hashed, burned on use).
- **webhooks** — HMAC-SHA256 signed deliveries (`X-Webhook-Signature: sha256=...`); BullMQ queue `webhooks` with 5 attempts + exponential backoff; sync fallback when no Redis.
- **idempotency** (global) — `@Idempotent()` decorator + interceptor; 24h default TTL; replays cached responses by `Idempotency-Key` header.

### Admin UI additions
- `/config/storage` — file browser (uses existing `/storage/files` endpoint).
- `/config/queues` — BullMQ counts + recent jobs (new `/admin/queues` endpoint).
- Sidebar nav extended in `ConfigLayout`.
- All `/config/*` routes lazy-loaded; chunk-per-page.

### Infra & DX
- `.env.example` already covered the env surface (verified).
- `docker-compose.yml` (postgres 16 + redis 7 + minio + maildev) — local-dev stack.
- `.github/workflows/ci.yml` already in place (verified covers lint+build+prisma).

### Tests (example pattern)
- `apps/api/src/app/lookup/lookup.service.spec.ts` — unit, mocked DB.
- `apps/api/src/app/lookup/lookup.e2e-spec.ts` — supertest with overridden DI.

### Deps added
`@nestjs/schedule`, `otplib`, `lru-cache`.

### Validation
`pnpm nx run @org/api:build` ✅, `pnpm nx run @org/app:build` ✅, prisma generate ✅, migrate dev ✅.

### Open follow-ups
Stripe class, BullMQ-around-render, mail sync template render, `/config/audit|orgs|api-keys|webhooks|cron` UI pages (backing endpoints ready), live socket bell push, Tier 2 items.

## 2026-06-30 — Boilerplate modules migration (docs/15)

**Phases A–F complete.**

- **Prisma**: added `Notification`, `PushSubscription`, `PhoneOtp` (now `target` + `channel` for SMS or email OTP), `UserVerification` (User-bound, `kind` + `payload JSON`, generalised from Matrimonial's Profile-bound model). Migration `20260630132030_add_generic_notification_verification_models` applied.
- **Notification module**: copied + adapted from Matrimonial — dropped the ChatGateway/ChatModule coupling so the boilerplate is socket-agnostic. In-app bell (`/notifications/*`), Web Push (`/push/*`), admin broadcast. `web-push` + `@types/web-push` added to `package.json`.
- **Verification module**: rewritten generically — user-bound, `kind`-based, evidence via `StorageService`, decision email via `MailService` using a new `verification-decision` template.
- **Config schema**: added `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` to `apps/api/src/app/config/schema.ts` + the `OPTIONAL_GROUPS` warning table.
- **Admin UI shell**: new `/config/*` shell at `apps/app/src/app/features/config/`. 10 pages: `Overview`, `Users`, `Plans`, `Payments`, `AiUsage`, `MailLogs`, `Notifications` (broadcast composer), `Verification` (review queue), `Lookups` (wraps existing `AdminLookups`), `Settings`. All use `DataTable` + `@org/ui` + `t('key','English default')` per the UI-consistency rule.
- **Docs**: `docs/00-MODULES-INDEX.md` is the AI-friendly entry point. Per-module docs at `docs/modules/<name>.md` for all 19 generic modules. Each doc is self-contained: purpose, files, env vars, providers, prisma models, endpoints, admin UI, plug-into-new-project recipe, extending notes.
- **Validation**: `pnpm nx run @org/api:build` ✅, `pnpm nx run @org/app:build` ✅.

**Project-specific modules NOT migrated** (intentional): match, jyotish, family, chat, call, profile, safety, intelligence, legal-ai, master-assistant, signers, vault, estate-vault, comments, shares, document-groups, dev. Copy from source projects if any is needed in a downstream project.
