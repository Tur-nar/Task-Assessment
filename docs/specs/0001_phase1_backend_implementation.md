# Backend Foundation — CognoDB Connection, Auth, Users, Departments, Tasks

Initial implementation of the TaskManager Pro (CognoDB Edition) backend for the Wexa AI take-home: the CognoDB connection layer plus four core modules (auth, users, departments, tasks), seed data, and app wiring. This is the foundation `0002_remaining_backend_compltion.md` builds on top of.

## Starting Point

- Assignment: build an app backed by CognoDB (openCypher over Bolt), graded on graph data modeling, a 2+ hop traversal, one relational-awkward query, UI/UX, and clean engineering. 48-hour deadline.
- Decision, locked before implementation started: rebuild TaskManager Pro (the pre-multi-tenant predecessor of the TeamOS roadmap) rather than the habit tracker — its self-referential `supervisorId` chain and the new task-dependency requirement are the two genuine graph use cases in scope. See `teamos-cognodb-plan.md`.
- Stack decided: NestJS + `neo4j-driver` (no ORM), Passport-JWT + bcrypt (no Better Auth, no self-signup anywhere — a super admin seeds from env vars and provisions every other account), NestJS/Next.js kept as a split, not a monolith.
- Nothing existed yet. This phase built the connection layer and the first four feature modules from scratch.

## Proposed Changes

### Phase 1 — CognoDB connection layer

#### [NEW] `src/lib/neo4j/`

| File | Purpose |
|---|---|
| [neo4j.service.ts](file:///Users/adebowaleademuyiwa/Documents/Web-dev/Nestjs/Assessment-Task-managementsystem/backend/src/lib/neo4j/neo4j.service.ts) | Wraps the official `neo4j-driver`. Connects once on `onModuleInit` (`verifyConnectivity()`; logs and continues rather than crashing the process if CognoDB is unreachable at boot); closes on `onModuleDestroy`. One `run<T>(cypher, params, mode)` method every query in the app goes through — parameterized always, throws `ServiceUnavailableException` on failure instead of leaking a driver error to the client. Unwraps Neo4j's `Integer`/node/relationship types into plain JSON. |
| [neo4j.module.ts](file:///Users/adebowaleademuyiwa/Documents/Web-dev/Nestjs/Assessment-Task-managementsystem/backend/src/lib/neo4j/neo4j.module.ts) | `@Global()`, exports `Neo4jService` — imported once in `AppModule`. |

This is what the assignment's "graceful error handling when the database is unreachable" requirement hangs off — verified by exercising it with the driver unset and confirming a clean 503 instead of an unhandled exception.

---

### Phase 2 — Auth (JWT, no self-signup)

#### [NEW] `src/modules/auth/`

| File | Purpose |
|---|---|
| [auth.service.ts](file:///Users/adebowaleademuyiwa/Documents/Web-dev/Nestjs/Assessment-Task-managementsystem/backend/src/modules/auth/auth.service.ts) | `onModuleInit()` — checks for an existing `super_admin` node; if none, creates one from `SUPER_ADMIN_EMAIL`/`SUPER_ADMIN_PASSWORD` env vars. `login(email, password)` — bcrypt compare, updates `lastLogin`, signs a JWT, strips `passwordHash` before returning the user. |
| [auth.controller.ts](file:///Users/adebowaleademuyiwa/Documents/Web-dev/Nestjs/Assessment-Task-managementsystem/backend/src/modules/auth/auth.controller.ts) | `POST /api/auth/login` |
| [jwt.strategy.ts](file:///Users/adebowaleademuyiwa/Documents/Web-dev/Nestjs/Assessment-Task-managementsystem/backend/src/modules/auth/jwt.strategy.ts) | Passport JWT strategy — validates the bearer token, attaches `{id, email, role}` to `request.user`. |
| [jwt-auth.guard.ts](file:///Users/adebowaleademuyiwa/Documents/Web-dev/Nestjs/Assessment-Task-managementsystem/backend/src/modules/auth/jwt-auth.guard.ts) | `AuthGuard('jwt')` alias. |
| [dto/login.dto.ts](file:///Users/adebowaleademuyiwa/Documents/Web-dev/Nestjs/Assessment-Task-managementsystem/backend/src/modules/auth/dto/login.dto.ts) | `email`, `password` (min 8). |
| [auth.module.ts](file:///Users/adebowaleademuyiwa/Documents/Web-dev/Nestjs/Assessment-Task-managementsystem/backend/src/modules/auth/auth.module.ts) | Wires `PassportModule` + `JwtModule.registerAsync` from `ConfigService`. |

#### [NEW] `src/common/`

| File | Purpose |
|---|---|
| [roles.decorator.ts](file:///Users/adebowaleademuyiwa/Documents/Web-dev/Nestjs/Assessment-Task-managementsystem/backend/src/common/roles.decorator.ts) | `Role` type (`super_admin`/`admin`/`supervisor`/`staff`), `@Roles(...)` decorator. |
| [roles.guard.ts](file:///Users/adebowaleademuyiwa/Documents/Web-dev/Nestjs/Assessment-Task-managementsystem/backend/src/common/roles.guard.ts) | Reads `@Roles()` metadata, checks `request.user.role` — `super_admin` implicitly passes every check. |

No self-signup route exists anywhere in the API — every account after the bootstrapped super admin is created via `POST /api/users`, gated to `super_admin`/`admin`.

---

### Phase 3 — Users / Staff

#### [NEW] `src/modules/users/`

| File | Purpose |
|---|---|
| [users.repository.ts](file:///Users/adebowaleademuyiwa/Documents/Web-dev/Nestjs/Assessment-Task-managementsystem/backend/src/modules/users/users.repository.ts) | All Cypher for the `User` label: `create` (MERGEs `MEMBER_OF`/`SUPERVISED_BY` if a department/supervisor is given), `findByEmail`, `findById` (with department + supervisor), `list(filters)`, `reportingChain(userId)`, `teamMembers(supervisorId)`, `setStatus`, `reassignSupervisor`. |
| [users.service.ts](file:///Users/adebowaleademuyiwa/Documents/Web-dev/Nestjs/Assessment-Task-managementsystem/backend/src/modules/users/users.service.ts) | Email-uniqueness check + bcrypt hash on create; thin pass-through for the rest; strips `passwordHash` on the create response. |
| [users.controller.ts](file:///Users/adebowaleademuyiwa/Documents/Web-dev/Nestjs/Assessment-Task-managementsystem/backend/src/modules/users/users.controller.ts) | See endpoints below. |
| [dto/create-user.dto.ts](file:///Users/adebowaleademuyiwa/Documents/Web-dev/Nestjs/Assessment-Task-managementsystem/backend/src/modules/users/dto/create-user.dto.ts) | `firstName`, `lastName`, `email`, `password` (min 8), `role` (`admin`/`supervisor`/`staff` — `super_admin` is never created through this route), optional `departmentId`/`supervisorId`. |
| [users.module.ts](file:///Users/adebowaleademuyiwa/Documents/Web-dev/Nestjs/Assessment-Task-managementsystem/backend/src/modules/users/users.module.ts) | |

**Endpoints:**
- `POST /api/users` (`super_admin`/`admin`)
- `GET /api/users?role=&departmentId=&status=`
- `GET /api/users/:id`
- `GET /api/users/:id/reporting-chain` — **the multi-hop traversal required by the assignment**
- `GET /api/users/:id/team`
- `PATCH /api/users/:id/status` (`super_admin`/`admin`)
- `PATCH /api/users/reassign-supervisor` (`super_admin`/`admin`)

**Cypher highlight — the required multi-hop query:**
```cypher
MATCH path = (u:User {id: $userId})-[:SUPERVISED_BY*1..10]->(manager:User)
RETURN manager, length(path) AS depth
ORDER BY depth
```
Bounded at 10 hops deliberately — a graph DB will happily traverse a cycle forever on an unbounded `*`.

---

### Phase 4 — Departments

#### [NEW] `src/modules/departments/`

| File | Purpose |
|---|---|
| [departments.repository.ts](file:///Users/adebowaleademuyiwa/Documents/Web-dev/Nestjs/Assessment-Task-managementsystem/backend/src/modules/departments/departments.repository.ts) | `create`, `list` — staff count + task completion rate per department computed in **one** Cypher call via `OPTIONAL MATCH` + `count()`, not a query-per-department loop — `findById`, `update`, `delete` (blocks with a thrown error if staff are still assigned). |
| [departments.module.ts](file:///Users/adebowaleademuyiwa/Documents/Web-dev/Nestjs/Assessment-Task-managementsystem/backend/src/modules/departments/departments.module.ts) | Service and controller were originally co-located in this one file — acceptable under ~5 endpoints. |

**Endpoints:** `GET /`, `GET /:id`, `POST /` (admin), `PUT /:id` (admin), `DELETE /:id` (admin).

---

### Phase 5 — Tasks, Sub-tasks, Dependencies

#### [NEW] `src/modules/tasks/`

| File | Purpose |
|---|---|
| [tasks.repository.ts](file:///Users/adebowaleademuyiwa/Documents/Web-dev/Nestjs/Assessment-Task-managementsystem/backend/src/modules/tasks/tasks.repository.ts) | All Cypher for `Task`. `create` (assigns, optionally attaches department + initial dependencies in one query), `list(filters)`, `findById`, `updateStatus` (auto-flips `completed`→`completed_late` if the task was `overdue`), `addDependency` **with a cycle guard that runs before the edge is written**, `removeDependency`, `transitiveBlockers`, `readyToStart`, `delete`, plus sub-task CRUD. |
| [tasks.service.ts](file:///Users/adebowaleademuyiwa/Documents/Web-dev/Nestjs/Assessment-Task-managementsystem/backend/src/modules/tasks/tasks.service.ts) | Wires `readyToStart` into the status-update flow — a task can't move to `in_progress`/`completed` while a blocker is unresolved. |
| [tasks.controller.ts](file:///Users/adebowaleademuyiwa/Documents/Web-dev/Nestjs/Assessment-Task-managementsystem/backend/src/modules/tasks/tasks.controller.ts) | See endpoints below. |
| [dto/create-task.dto.ts](file:///Users/adebowaleademuyiwa/Documents/Web-dev/Nestjs/Assessment-Task-managementsystem/backend/src/modules/tasks/dto/create-task.dto.ts) | `title`, optional `description`, `assignedToId`, optional `priority`/`departmentId`, `deadline` (ISO 8601), optional `dependsOnTaskIds[]`. |
| [tasks.module.ts](file:///Users/adebowaleademuyiwa/Documents/Web-dev/Nestjs/Assessment-Task-managementsystem/backend/src/modules/tasks/tasks.module.ts) | |

**Endpoints:**
- `POST /api/tasks` (`super_admin`/`admin`/`supervisor`)
- `GET /api/tasks?status=&priority=&departmentId=&assignedToId=`
- `GET /api/tasks/:id`
- `PATCH /api/tasks/:id/status`
- `DELETE /api/tasks/:id` (admin)
- `POST /api/tasks/:id/dependencies`, `DELETE /api/tasks/:id/dependencies/:dependsOnTaskId`
- `GET /api/tasks/:id/blockers` — **the relational-awkward query required by the assignment**
- `GET /api/tasks/:id/ready`
- `GET/POST /api/tasks/:id/subtasks`, `PATCH /api/tasks/subtasks/:subtaskId`

**Cypher highlights:**
```cypher
// Cycle guard — runs before addDependency writes the edge
MATCH (would:Task {id: $dependsOnTaskId})-[:DEPENDS_ON*1..20]->(t:Task {id: $taskId})
RETURN count(t) AS cycles

// The required relational-awkward query: transitive blockers
MATCH (t:Task {id: $taskId})-[:DEPENDS_ON*1..20]->(blocker:Task)
RETURN DISTINCT blocker
```
In Postgres, transitive blocker resolution is a recursive CTE with manual cycle protection; here it's one bounded variable-length pattern.

---

### Phase 6 — Seed data

#### [NEW] [seed.ts](file:///Users/adebowaleademuyiwa/Documents/Web-dev/Nestjs/Assessment-Task-managementsystem/backend/src/seed/seed.ts)

Wipes and recreates demo data (`Task`/`User`/`Department`/`SubTask` nodes) — never point it at real data. Creates 2 departments, an admin, 2 supervisors, 3 staff (a 2-hop `SUPERVISED_BY` chain: staff → supervisor → admin), and a real 4-task dependency chain (design → build → test → deploy), so `GET /api/tasks/:id/blockers` on the deploy task returns something meaningful in the demo recording. Passwords are bcrypt-hashed; seeded accounts share one demo password, logged to the console on completion.

---

### Phase 7 — Wiring

#### [NEW] [app.module.ts](file:///Users/adebowaleademuyiwa/Documents/Web-dev/Nestjs/Assessment-Task-managementsystem/backend/src/app.module.ts) / [main.ts](file:///Users/adebowaleademuyiwa/Documents/Web-dev/Nestjs/Assessment-Task-managementsystem/backend/src/main.ts)
`ConfigModule.forRoot({ isGlobal: true })`, `Neo4jModule`, `AuthModule`, `UsersModule`, `DepartmentsModule`, `TasksModule`. `main.ts`: global `ValidationPipe({ whitelist: true, transform: true })`, CORS scoped to `FRONTEND_URL`.

#### [NEW] `package.json`, `tsconfig.json`, `nest-cli.json`, `.env.example`, `.gitignore`

---

## Build Order

Connection layer first (everything depends on it) → auth (every other module's routes are guarded by it) → users + departments (foundation data the rest hangs off) → tasks (the dependency/traversal showcase, built last since it references users and departments) → seed → wiring.

## Verification Plan

### Automated
```bash
npm install
npx tsc --noEmit -p tsconfig.json
```
Ran twice: first pass caught 6 strict-mode nits (implicit `any` on caught errors, possibly-`undefined` config values passed where `string` was required) — fixed, second pass clean, zero errors.

### Manual
Not run against a live CognoDB instance from this side — no credentials to it from here. `npm run seed`, `npm run start:dev` against the real instance, and a login → create-task → add-dependency → blockers curl walkthrough were left as the next step.

---

## Note — structural amendment

This landed first as flat feature folders directly under `src/` (`src/auth/`, `src/users/`, ...). It was reorganized into the `lib/` + `modules/<feature>/` + `common/` convention shown above immediately after, to match the project's standard AGENTS.md template. Paths above reflect the final locations.