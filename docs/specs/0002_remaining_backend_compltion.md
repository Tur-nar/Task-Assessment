# Backend Completion — Comments, Performance, Targets, Notifications

Complete the remaining four backend modules, audit and fix gaps in the existing modules, and extend the seed script so everything is demo ready.

## Current State Audit

### What is built and working ✅

| Module | Status | Notes |
|---|---|---|
| `lib/neo4j` | ✅ Done | `@Global()`, single driver, `run()` method, graceful error on disconnect |
| `modules/auth` | ✅ Done | Login, super admin bootstrap, JWT strategy, guards |
| `modules/users` | ✅ Done | CRUD, reporting chain, team members, reassign supervisor, status toggle |
| `modules/departments` | ✅ Done | CRUD with staff count guard on delete, aggregated stats |
| `modules/tasks` | ✅ Done | CRUD, dependencies with cycle guard, transitive blockers, subtasks |

### What is missing ❌

| Module | Priority | Why |
|---|---|---|
| `modules/comments` | High | The old app had threaded task comments, the plan keeps them, and it demonstrates the `REPLY_TO` recursive graph relationship |
| `modules/performance` | High | Core feature of the old app, computed on read (no cron), good graph aggregation showcase |
| `modules/targets` | Medium | Individual and team targets with progress entries, demonstrates the 2 hop `User→Department←Target` query |
| `modules/notifications` | Medium | In app notifications created inline on triggering actions (no cron, no email for this deadline) |

### Gaps in existing modules that need fixing

| Gap | Where | Fix |
|---|---|---|
| No `GET /api/auth/me` endpoint | `auth.controller.ts` | Add `@Get('me')` that reads `req.user` from JWT and fetches the full user from Neo4j |
| No `PUT /api/auth/change-password` | `auth.controller.ts` | Add change password endpoint (verify current password, hash new one, update node) |
| No `DELETE /api/users/:id` | `users.controller.ts` | Add delete user (block if active tasks exist) |
| No `PUT /api/users/:id` | `users.controller.ts` | Add update user (role, department, supervisor changes) |
| No task update (`PUT /api/tasks/:id`) | `tasks.controller.ts` | Add edit task (title, description, priority, deadline, assignee) |
| No `GET /api/tasks/stats` | `tasks.controller.ts` | Add aggregated task counts for the dashboard |
| Missing `ASSIGNED_BY` in seed | `seed.ts` | Tasks in seed don't create the `ASSIGNED_BY` relationship |
| Seed doesn't cover new node types | `seed.ts` | Extend seed with comments, targets, entries, notifications |
| AGENTS.md §7 says "services never call Neo4jService.run() directly" | All services | We removed the repository layer. AGENTS.md needs a one line update to reflect this (repo layer removed, services call Neo4j directly). This is fine for an assessment, simpler to explain. |

---

## Proposed Changes

### Phase 1 — Fix existing module gaps

Priority: these are endpoints the frontend already expects.

---

#### [MODIFY] [auth.controller.ts](file:///Users/adebowaleademuyiwa/Documents/Web-dev/Nestjs/Assessment-Task-managementsystem/backend/src/modules/auth/auth.controller.ts)
- Add `GET /api/auth/me` — protected, returns the logged in user with department and supervisor
- Add `PUT /api/auth/change-password` — validates current password, hashes new one

#### [MODIFY] [auth.service.ts](file:///Users/adebowaleademuyiwa/Documents/Web-dev/Nestjs/Assessment-Task-managementsystem/backend/src/modules/auth/auth.service.ts)
- Add `me(userId)` method — fetch user by ID with department/supervisor
- Add `changePassword(userId, currentPassword, newPassword)` method

#### [NEW] [dto/change-password.dto.ts](file:///Users/adebowaleademuyiwa/Documents/Web-dev/Nestjs/Assessment-Task-managementsystem/backend/src/modules/auth/dto/change-password.dto.ts)
- `currentPassword: string`, `newPassword: string` with `@MinLength(8)`

---

#### [MODIFY] [users.controller.ts](file:///Users/adebowaleademuyiwa/Documents/Web-dev/Nestjs/Assessment-Task-managementsystem/backend/src/modules/users/users.controller.ts)
- Add `PUT /api/users/:id` — update role, department, supervisor
- Add `DELETE /api/users/:id` — block if user has active (non completed) tasks
- Add `GET /api/users/supervisors` — return all active supervisors with team info

#### [MODIFY] [users.service.ts](file:///Users/adebowaleademuyiwa/Documents/Web-dev/Nestjs/Assessment-Task-managementsystem/backend/src/modules/users/users.service.ts)
- Add `update()`, `delete()`, `listSupervisors()` methods

#### [NEW] [dto/update-user.dto.ts](file:///Users/adebowaleademuyiwa/Documents/Web-dev/Nestjs/Assessment-Task-managementsystem/backend/src/modules/users/dto/update-user.dto.ts)

---

#### [MODIFY] [tasks.controller.ts](file:///Users/adebowaleademuyiwa/Documents/Web-dev/Nestjs/Assessment-Task-managementsystem/backend/src/modules/tasks/tasks.controller.ts)
- Add `PUT /api/tasks/:id` — edit task details
- Add `GET /api/tasks/stats` — aggregated counts for dashboard
- Add `DELETE /api/tasks/:id/subtasks/:subtaskId` — delete a subtask

#### [MODIFY] [tasks.service.ts](file:///Users/adebowaleademuyiwa/Documents/Web-dev/Nestjs/Assessment-Task-managementsystem/backend/src/modules/tasks/tasks.service.ts)
- Add `update()`, `getStats()`, `deleteSubtask()` methods

#### [NEW] [dto/update-task.dto.ts](file:///Users/adebowaleademuyiwa/Documents/Web-dev/Nestjs/Assessment-Task-managementsystem/backend/src/modules/tasks/dto/update-task.dto.ts)

---

### Phase 2 — Task Comments module (NEW)

Graph model: `TaskComment` node with `AUTHORED_BY→User`, `ON_TASK→Task`, and self referencing `REPLY_TO→TaskComment` for threaded replies.

#### [NEW] `src/modules/comments/`

| File | Purpose |
|---|---|
| `comments.module.ts` | Providers: `CommentsService`. Controllers: `CommentsController`. Exports: `CommentsService` |
| `comments.service.ts` | CRUD: `create`, `list` (flat with nested replies via `REPLY_TO*`), `delete` (author or super_admin) |
| `comments.controller.ts` | `POST /api/tasks/:taskId/comments`, `GET /api/tasks/:taskId/comments`, `DELETE /api/tasks/:taskId/comments/:commentId` |
| `dto/create-comment.dto.ts` | `content: string`, optional `parentCommentId?: string` for replies |

**Cypher highlights:**
```cypher
// Create comment with optional reply-to
CREATE (c:TaskComment {id: $id, content: $content, createdAt: datetime()})
WITH c
MATCH (t:Task {id: $taskId}), (u:User {id: $userId})
MERGE (c)-[:ON_TASK]->(t)
MERGE (c)-[:AUTHORED_BY]->(u)
WITH c
OPTIONAL MATCH (parent:TaskComment {id: $parentCommentId})
FOREACH (_ IN CASE WHEN parent IS NOT NULL THEN [1] ELSE [] END |
  MERGE (c)-[:REPLY_TO]->(parent))
RETURN c

// List comments with author and replies
MATCH (c:TaskComment)-[:ON_TASK]->(:Task {id: $taskId})
WHERE NOT (c)-[:REPLY_TO]->(:TaskComment)
MATCH (c)-[:AUTHORED_BY]->(author:User)
OPTIONAL MATCH (reply:TaskComment)-[:REPLY_TO]->(c)
OPTIONAL MATCH (reply)-[:AUTHORED_BY]->(replyAuthor:User)
RETURN c, author, collect({comment: reply, author: replyAuthor}) AS replies
ORDER BY c.createdAt
```

---

### Phase 3 — Performance module (NEW)

**No stored node, no cron.** Performance is computed on read from task relationships. This is the plan's design: same formula as the old app, derived at query time instead of maintained by a 10 minute cron.

#### [NEW] `src/modules/performance/`

| File | Purpose |
|---|---|
| `performance.module.ts` | Providers: `PerformanceService`. Controllers: `PerformanceController`. Exports: `PerformanceService` |
| `performance.service.ts` | `getAll()`, `getByUser(id)`, `getByDepartment(deptId)` — each runs ONE Cypher query that computes the score |
| `performance.controller.ts` | `GET /api/performance`, `GET /api/performance/me`, `GET /api/performance/department/:id` |

**Scoring formula (same as old app):**
```
base = 50
on_time_bonus    = (on_time / total) × 50
overdue_penalty  = (overdue / total) × 40
completion_bonus = (completed / total) × 10
late_bonus       = (completed_late / total) × 10
score = clamp(0, 100, base + on_time_bonus - overdue_penalty + completion_bonus + late_bonus)
```

**Rating scale:** 90+ = Excellent, 75 to 89 = Good, 50 to 74 = Average, below 50 = Needs Improvement

**Cypher highlight:**
```cypher
MATCH (u:User)
WHERE u.role IN ['staff', 'supervisor']
OPTIONAL MATCH (t:Task)-[:ASSIGNED_TO]->(u)
WITH u,
  count(t) AS total,
  count(CASE WHEN t.status = 'completed' THEN 1 END) AS onTime,
  count(CASE WHEN t.status = 'completed_late' THEN 1 END) AS completedLate,
  count(CASE WHEN t.status = 'overdue' THEN 1 END) AS overdue,
  count(CASE WHEN t.status IN ['completed', 'completed_late'] THEN 1 END) AS completed
OPTIONAL MATCH (u)-[:MEMBER_OF]->(d:Department)
RETURN u, d, total, onTime, completedLate, overdue, completed
```

The score math happens in TypeScript after the query returns the raw counts, keeping the Cypher clean and testable.

---

### Phase 4 — Targets + Entries module (NEW)

Graph model: `Target` with `ASSIGNED_TO→User` (individual), `FOR_DEPARTMENT→Department` (team), `CREATED_BY→User`. `TargetEntry` with `LOGGED_FOR→Target`, `SUBMITTED_BY→User`.

#### [NEW] `src/modules/targets/`

| File | Purpose |
|---|---|
| `targets.module.ts` | Standard NestJS module |
| `targets.service.ts` | `create`, `list` (with type/status/department filters), `update`, `findById`, `addEntry`, `listEntries`, `deleteEntry` |
| `targets.controller.ts` | Full CRUD + nested entry endpoints |
| `dto/create-target.dto.ts` | `title`, `type` (individual/team), `targetValue`, `deadline`, optional `assignedToId`, `departmentId`, `description` |
| `dto/update-target.dto.ts` | Partial of create |
| `dto/create-entry.dto.ts` | `value: number`, optional `note: string` |

**Endpoints:**
- `POST /api/targets` — create target (admin/supervisor)
- `GET /api/targets` — list with filters
- `GET /api/targets/:id` — single target with entries and progress
- `PUT /api/targets/:id` — update target (admin/supervisor)
- `POST /api/targets/:id/entries` — log progress entry
- `GET /api/targets/:id/entries` — list entries
- `DELETE /api/targets/:id/entries/:entryId` — delete entry (admin/supervisor)

**Status is computed:** `currentValue` = sum of all entries. Status = `completed` if currentValue >= targetValue, `missed` if past deadline and not completed, `at_risk` if within 3 days of deadline and less than 75% progress, `on_track` otherwise.

**Cypher highlight (2 hop team target visibility from the plan):**
```cypher
MATCH (u:User {id: $userId})-[:MEMBER_OF]->(d:Department)<-[:FOR_DEPARTMENT]-(t:Target)
RETURN t
```

---

### Phase 5 — Notifications module (NEW)

In app notifications only, no cron, no email. Created inline when the triggering action happens (plan §7 fallback).

#### [NEW] `src/modules/notifications/`

| File | Purpose |
|---|---|
| `notifications.module.ts` | Standard NestJS module |
| `notifications.service.ts` | `create(forUserId, title, message, type, severity, relatedTaskId?)`, `list(userId, filters)`, `markRead(id)`, `markAllRead(userId)`, `delete(id)` |
| `notifications.controller.ts` | `GET`, `PATCH :id/read`, `PATCH read-all`, `DELETE :id` |

**Notification types:** `task_assigned`, `task_completed`, `comment_added`, `target_update`
**Severities:** `info`, `warning`, `critical`, `success`

Notifications are created by calling `NotificationsService.create()` from other services (task assignment, task completion, comment). The `NotificationsModule` exports `NotificationsService` so other modules can import it.

---

### Phase 6 — Wire everything up

#### [MODIFY] [app.module.ts](file:///Users/adebowaleademuyiwa/Documents/Web-dev/Nestjs/Assessment-Task-managementsystem/backend/src/app.module.ts)
- Import `CommentsModule`, `PerformanceModule`, `TargetsModule`, `NotificationsModule`

#### [MODIFY] [seed.ts](file:///Users/adebowaleademuyiwa/Documents/Web-dev/Nestjs/Assessment-Task-managementsystem/backend/src/seed/seed.ts)
- Add `ASSIGNED_BY` relationships to existing tasks
- Seed sample comments (including a threaded reply)
- Seed sample targets (1 team, 1 individual) with entries
- Seed sample notifications
- Wipe `TaskComment`, `Target`, `TargetEntry`, `Notification` nodes in the cleanup step

#### [MODIFY] [AGENTS.md](file:///Users/adebowaleademuyiwa/Documents/Web-dev/Nestjs/Assessment-Task-managementsystem/backend/AGENTS.md)
- Update §5 folder structure to reflect the removal of repository layer and addition of new modules
- Update §7 to note services call `Neo4jService.run()` directly (repository layer was removed for simplicity)

---

## Build Order

> [!IMPORTANT]
> The order matters because later modules depend on earlier ones being importable:
> 1. **Phase 1** (Fix existing gaps) — standalone, no new modules
> 2. **Phase 5** (Notifications) — must exist before Phase 2, 3, 4 so those can fire notifications
> 3. **Phase 2** (Comments) — depends on notifications being importable
> 4. **Phase 3** (Performance) — standalone read only queries, no deps
> 5. **Phase 4** (Targets) — depends on notifications being importable
> 6. **Phase 6** (Wiring + seed) — wire all modules into AppModule, extend seed

## Verification Plan

### Automated
```bash
npm run build   # TypeScript must compile with zero errors
```

### Manual
```bash
npm run seed    # Seed script runs without errors against CognoDB
npm run start:dev   # Server boots, super admin seeds, all routes respond
```

Then test key endpoints with curl or the frontend:
- `POST /api/auth/login` → get token
- `GET /api/auth/me` → user profile
- `GET /api/tasks` → task list
- `GET /api/tasks/:id/comments` → comments
- `GET /api/performance` → computed scores
- `GET /api/targets` → targets with progress
- `GET /api/notifications` → notification list
