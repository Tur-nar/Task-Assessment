# AGENTS.md — TaskManager Pro (CognoDB Edition) Backend
Wexa AI take-home rebuild: TaskManager Pro on NestJS + CognoDB (graph). See `teamos-cognodb-plan.md` for scope, data model, and headline queries. This file describes the project as it actually exists — keep it that way; it's the context every skill and every agent session reads first.

## 1. Project Context
- **Project:** TaskManager Pro — CognoDB Edition (Wexa AI take-home)
- **Package manager:** npm · **Node:** v26.4.0 · **NestJS:** v10.4+
- **HTTP adapter:** Express — don't switch to Fastify without discussion
- **Database:** CognoDB (managed graph DB, openCypher over Bolt) via the official `neo4j-driver` — no ORM
- **Deploy target:** Backend — Render/Railway. Frontend — Vercel. Two separate deployments; this project is a NestJS + Next.js split, not a monolith.

## 2. Stack
NestJS · TypeScript strict · `neo4j-driver` (CognoDB, parameterized Cypher, no ORM) · Passport-JWT + bcrypt (no Better Auth) · class-validator/class-transformer.

**Deliberately not in this project:** Prisma (no relational DB), Better Auth (plain JWT instead — simpler for a single-org, admin-provisions-staff model), BullMQ/ioredis, Socket.io. These were cut to fit a 1.5-day deadline and because the assignment is graded on graph modeling, not real-time or queue infra. Don't reintroduce any of them without flagging first — same weight as the swap warning below.

Not yet added, add if there's time: `@nestjs/swagger`, `@nestjs/throttler`, `helmet`, Jest + Supertest.

## 3. Session Workflow (JS Mastery Skills)
Install: `npx skills@latest add jsmastery-pro/skills -a claude-code` (installs into `.claude/skills` — restart Claude Code after).

This is a **brownfield** project (backend already exists) — the workflow's own guidance applies directly: `/audit` first so every skill reads the real project (this file is what `/audit` seeds and `/sync` keeps current — hand-edits here are a snapshot, not the permanent source of truth once the workflow is running), then `/scope` the next slice, then the feature loop per change:

```
/architect → /develop → /check verify → /test → /check review → /document → /sync
```

- `/architect` before any load-bearing decision — a new node label, a new relationship type, an auth-strategy change, a page's data model. Writes the decision to `docs/specs/`. `/develop` gates to it automatically if a decision is owed; override is allowed but gets flagged as `Assumed` until ratified.
- `/check verify` after `/develop` — runs the real app against the spec.
- `/check review` — senior review on a second model before a PR.
- `/test` — writes the test suite for the change just made.
- `/document` — writes the PR text/changelog from the real diff.
- `/sync` — last step at merge: reconciles this file, the scope, and spec statuses to what the repo actually shows.
- `/debug` anytime something breaks — root-causes, then hands a regression test to `/test`.
- Workflow depth (`Prototype` / `Alpha` / `Beta` / `GA`) is chosen at `/scope`, override per feature. For a 1.5-day take-home: `Prototype` or `Alpha`. Don't let `GA`-depth checking (fresh-model review, full docs) eat the deadline — that's a decision to make consciously at `/scope`, not default into.

## 4. Module Rules
- **Never `new` anything the DI container should own** (the Neo4j driver/session, services, SDK clients). Constructor injection only — `Neo4jService` is the one place the driver gets constructed.
- **Controllers are thin — one call to one service method.** Business logic, dependency/cycle checks, orchestration live in services and repositories.
- **Feature-based folders under `modules/`** (`modules/tasks/`, `modules/users/`, ...), not layer-based — see §5.
- **Infra (`lib/`) is `@Global()`, imported once** in `AppModule`: `lib/neo4j` exports `Neo4jService`. Feature modules never reconstruct a driver or session.
- **A module exports only what other modules need** — not everything.
- **Circular deps: fix the structure before reaching for `forwardRef()`.** Extract a shared module or use an event emitter first.

## 5. Folder Structure
```
src/
├── main.ts                  # bootstrap only — pipes, filters, listen()
├── app.module.ts
├── lib/                      # infra — one subfolder each, @Global()
│   └── neo4j/                # Neo4jService — wraps neo4j-driver, every query goes through .run()
├── modules/                  # one folder per feature
│   ├── auth/
│   │   ├── auth.module.ts  auth.service.ts  auth.controller.ts
│   │   ├── jwt.strategy.ts  jwt-auth.guard.ts
│   │   └── dto/
│   ├── users/
│   │   ├── users.module.ts  users.service.ts  users.controller.ts  users.repository.ts
│   │   └── dto/
│   ├── departments/
│   │   ├── departments.module.ts  departments.service.ts  departments.controller.ts  departments.repository.ts
│   ├── tasks/
│   │   ├── tasks.module.ts  tasks.service.ts  tasks.controller.ts  tasks.repository.ts
│   │   └── dto/
├── gateway/                  # Socket.io gateways — none yet, reserved for if real-time is added
├── scheduler/                # one file per cron task — none yet, reserved (e.g. a future notifications digest)
├── common/                   # guards, decorators, interceptors, filters, pipes — roles.guard.ts, roles.decorator.ts belong here
└── seed/
    └── seed.ts               # run with `npm run seed` — wipes and recreates demo data, never point at real data
```
No `*.processor.ts` per feature — no BullMQ in this project, nothing owns a queue (see §10).

**Naming:** `<name>.module|controller|service|repository|guard|strategy.ts`. DTOs: `<action>-<entity>.dto.ts` → class `CreateTaskDto`. Env vars SCREAMING_SNAKE_CASE (see `.env.example`). Scaffold with `nest g module/controller/service <name>` — don't hand-write boilerplate.

> **This doesn't match the current zip.** What's actually there is flat — `src/auth/`, `src/users/`, `src/departments/`, `src/tasks/`, `src/database/` sit directly under `src/`, not under `lib/`/`modules/`; `roles.guard.ts`/`roles.decorator.ts` live in `auth/`, not `common/`; `departments.module.ts` has its service and controller inline rather than split out. See my next message — I need to know whether to move the existing files to match this, or treat this as the standard for new work only.

## 6. Auth
- Plain JWT (Passport `passport-jwt`) + bcrypt — not Better Auth, decided deliberately for this project. Don't add Better Auth or any session library without flagging first.
- Lives under `modules/auth/` as a full NestJS module (service, controller, strategy, guard) — not a `lib/auth.ts` plain export. That pattern was specifically for Better Auth's instance-not-provider shape; a Passport strategy is naturally a Nest provider, so it belongs in `modules/`, not `lib/`.
- Single-org, no self-signup anywhere. `AuthService.onModuleInit()` seeds one `super_admin` from `SUPER_ADMIN_EMAIL`/`SUPER_ADMIN_PASSWORD` env vars if none exists yet. Every other account is created via `POST /api/users`, gated to `super_admin`/`admin`.
- `JwtStrategy` validates the bearer token → `request.user`. `JwtAuthGuard` (`AuthGuard('jwt')`) protects routes. `RolesGuard` + `@Roles(...)` enforce role checks on top — apply both at the controller level (`@UseGuards(JwtAuthGuard, RolesGuard)`), `@Roles()` per route that needs restricting.
- `super_admin` implicitly passes every `@Roles()` check inside `RolesGuard` — don't add per-route super_admin bypasses, it's handled once, centrally.
- Auth fields (`passwordHash`, `role`) live directly on the `User` node. There's no separate auth-library table, so don't build a 1:1 profile-split model — that pattern existed for Better Auth's user table and doesn't apply here.
- `passwordHash` is stripped before a `User` is ever returned from a service (see `AuthService.login`, `UsersService.create`) — follow that pattern anywhere else a `User` node crosses a controller boundary.

## 7. Database (CognoDB / Graph)
- `Neo4jService` (`database/neo4j.module.ts`, `@Global()`) wraps the official `neo4j-driver`, connects once via `onModuleInit`, closes via `onModuleDestroy`. Never construct a driver or session anywhere else.
- Every query goes through `Neo4jService.run(cypher, params, mode)` — parameterized, always. No string-concatenated Cypher, no exceptions, including for internal/admin-only queries.
- **One repository per node label.** All Cypher for that label lives in `<feature>.repository.ts`. Services call the repository; they never call `Neo4jService.run()` directly.
- Recursive/self-referencing relationships (`SUPERVISED_BY`, `DEPENDS_ON`) use **bounded** variable-length paths (`*1..10`, `*1..20` — see `users.repository.ts#reportingChain`, `tasks.repository.ts#transitiveBlockers`). Never an unbounded `*` on a graph that admits cycles.
- **New recursive relationship types must include a cycle check before writing the edge** — see `tasks.repository.ts#addDependency`. This is not optional: CognoDB will happily create a cycle, and an unbounded or later-added traversal over it will loop.
- Complex aggregation is one Cypher query with `OPTIONAL MATCH` / `WITH` / `collect()` / `count()`, not multiple round-trips reduced in JS — see `departments.repository.ts#list` (staff count + completion rate in one call).
- No ORM, no migrations — schema is implicit in node labels and relationship types. A new label or relationship type is a schema decision: document it in `teamos-cognodb-plan.md` and flag it, same weight an ORM model change used to carry.
- Deletes are currently **hard deletes** (`DETACH DELETE` — see `departments.repository.ts#delete`, `tasks.repository.ts#delete`). No soft-delete pattern exists. Don't introduce one for a subset of nodes without flagging; it's an all-or-nothing convention if it happens.
- CognoDB's free tier is small (0.5 vCPU, 256MB RAM, 200 connections). Don't add connection-pool tuning, bulk-write batching, or anything sized for a larger cluster — it's solving a problem this project doesn't have.

## 8. Security — non-negotiable, enabled once at the top of the pipeline
- `ValidationPipe({ whitelist: true, transform: true })` is already global in `main.ts` — add `forbidNonWhitelisted: true` the next time that file is touched, it's a gap, not yet fixed.
- `helmet()` and `@nestjs/throttler` are not wired in yet — add before this goes beyond a take-home submission; not required for the assignment itself.
- CORS currently reads `FRONTEND_URL` from config with an open fallback — tighten the fallback (no `'*'`) before any deployment beyond the assessment demo.
- **Verify a package exists on the real npm registry before installing it** — AI agents hallucinate plausible package names and attackers pre-register the exact hallucinated names as malware (slopsquatting).
- Never log tokens, passwords, or full PII payloads. `passwordHash` is already stripped on every `User` response — keep it that way on any new endpoint that returns a `User`.
- All secrets via env vars — `.env.example` is committed and must stay in sync with actual usage. Never a real `COGNODB_PASSWORD` or `JWT_SECRET` in a commit, ever.
- Errors to the client never leak stack traces in production.
- Before submission: confirm the CognoDB instance and any hosting dashboard aren't left on default/permissive access.

## 9. Errors & Response Shape
- No global `HttpExceptionFilter` or `TransformInterceptor` yet — controllers return raw service data, and services throw Nest's built-in exceptions directly (`UnauthorizedException`, `BadRequestException`, `ConflictException`, and `ServiceUnavailableException` from `Neo4jService` when CognoDB is unreachable). This is deliberately simple for now.
- If a global filter/interceptor gets added later, wire it once in `main.ts` — don't have individual controllers wrapping responses manually in the meantime.
- A service signals failure by throwing, never by returning `null` for the controller to interpret — already the pattern throughout `tasks.service.ts` / `users.service.ts`, keep it.

## 10. Queues & Scheduling
- No queue infra in this project — no BullMQ, no Redis. Deliberate, not an oversight.
- If a notifications digest needs scheduling later, reach for `@nestjs/schedule`'s `@Cron()` alone first. Don't introduce a queue + Redis dependency for what's likely one scheduled job, not on this deadline.

## 11. WebSockets
None in this project. Skip entirely unless a real-time requirement actually shows up — it isn't part of the assignment's grading criteria.

## 12. Testing
- No test suite yet — the take-home priority is a working graph model, the two headline Cypher queries, and UI polish, in that order. The assignment doesn't require tests for grading.
- If there's time before submission: Jest + Supertest, co-located `.spec.ts` mocking `Neo4jService` via `Test.createTestingModule` + `useValue`. Highest-value first: `addDependency`'s cycle rejection and the `readyToStart` gate on status updates — those are the two places a silent bug would be invisible in a quick manual click-through.
- **Test the primary failure mode, not just the happy path**, whenever tests do get written.

## 13. Config & Docs
- All env access via `ConfigService` (`ConfigModule.forRoot({ isGlobal: true })`) — never raw `process.env` in a service. Already the pattern everywhere.
- `.env.example` is committed and current — keep it in sync with every new env var.
- `@nestjs/swagger` isn't added yet. Not required for grading, but a `/api/docs` route is a fast way to hand the reviewer something to click through if there's time.

## 14. Agent Guardrails
- Don't install new deps (queue lib, auth lib, ORM, HTTP client) without flagging first; verify on npm before adding one.
- **Every new node label or relationship type is a schema decision** — flag before introducing one, same weight an ORM model change used to carry.
- New recursive/self-referencing relationships need a cycle guard before the edge is written. No exceptions.
- Don't put business logic in controllers "just this once."
- Don't call `Neo4jService.run()` from a service directly — go through that feature's repository.
- Don't instantiate the Neo4j driver or a session outside `Neo4jService`.
- Don't skip DTO validation on any route, including internal-feeling ones.
- Match the `lib/` + `modules/<feature>/` structure in §5 for anything new — don't scatter feature code straight under `src/`.
- Ask before large structural changes (auth-strategy change, reintroducing an ORM, adding a queue). Make small/medium changes directly.
- `/architect` before a load-bearing decision; `/develop` gates to it automatically — don't route around the gate to move faster.
- Nothing is done without lint + typecheck passing at minimum; tests where they exist.