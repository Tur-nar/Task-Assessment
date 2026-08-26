# TaskManager Pro — CognoDB Edition

## 1. Why a graph database (README seed)

TaskManager Pro already has two self-referential, arbitrary-depth relationships hiding inside a relational schema:

- **Supervisor chains** (`User.supervisorId` pointing at another `User`) — answering "who's in Amaka's reporting line up to the top" today means a recursive CTE or N application-level round trips.
- **Task dependencies** (new in this version) — "what's transitively blocking this task, and is it actually startable" is the same shape of problem: an arbitrary-depth self-join with cycle risk.

Both are one Cypher pattern (`-[:REL*1..]->`) instead of a recursive CTE. That's the genuine, defensible "graph earns its place" argument — not a rewrite for its own sake.

---

## 2. Stack (confirmed)

| Layer | Choice |
|---|---|
| Backend | NestJS (TypeScript), official `neo4j-driver` against CognoDB — no ORM |
| Frontend | Next.js (App Router), TanStack Query v5, Zustand, shadcn/ui, Vengeance UI, Framer Motion |
| Auth | JWT (Passport), bcrypt, **no Better Auth** — super admin seeded from env vars at bootstrap, super admin/admin registers staff, no self-signup |
| Hosting | Backend: Render/Railway. Frontend: Vercel. Two services (matches the existing split, unlike my earlier monolith suggestion) |

Repos stay split, matching what you're used to and what's already partly built.

---

## 3. Feature scope

Tasks, Sub-tasks, Task Comments (threaded), Targets + Progress Entries, Performance scoring, Departments, Supervisors, Staff/Users, Notifications.

**Adding:** Task dependencies — `Task -[:DEPENDS_ON]-> Task`, blocking/blocked-by view, "ready to start" check.

---

## 4. Graph data model

**Nodes:** `User`, `Department`, `Task`, `SubTask`, `TaskComment`, `Target`, `TargetEntry`, `Notification`

**Relationships:**
```
(User)-[:MEMBER_OF]->(Department)
(User)-[:SUPERVISED_BY]->(User)                 # recursive
(Department)-[:HEADED_BY]->(User)
(Task)-[:ASSIGNED_TO]->(User)
(Task)-[:ASSIGNED_BY]->(User)
(Task)-[:BELONGS_TO]->(Department)
(Task)-[:DEPENDS_ON]->(Task)                    # recursive — NEW
(Task)-[:HAS_SUBTASK]->(SubTask)
(Task)-[:HAS_COMMENT]->(TaskComment)
(TaskComment)-[:AUTHORED_BY]->(User)
(TaskComment)-[:REPLY_TO]->(TaskComment)        # recursive
(Target)-[:ASSIGNED_TO]->(User)                 # individual targets
(Target)-[:FOR_DEPARTMENT]->(Department)        # team targets
(Target)-[:CREATED_BY]->(User)
(TargetEntry)-[:LOGGED_FOR]->(Target)
(TargetEntry)-[:SUBMITTED_BY]->(User)
(Notification)-[:FOR_USER]->(User)
(Notification)-[:RELATED_TO]->(Task)
```

Performance is **computed on read** from `Task-[:ASSIGNED_TO]->User`, not a stored/cron-recalculated node — same formula as before (base 50, on-time bonus, overdue penalty, completion bonus, late-completion partial credit), just derived at query time instead of maintained by a 10-minute cron. Cuts out the recalculation job entirely with no user-facing difference at this data scale; can be cached later if it ever needs to be.

---

## 5. Headline queries (for the README + the interview defense)

**Multi-hop traversal — reporting chain:**
```cypher
MATCH path = (u:User {id: $userId})-[:SUPERVISED_BY*1..]->(manager)
RETURN path
```

**The relational-awkward one — transitive blockers:**
```cypher
MATCH (t:Task {id: $taskId})-[:DEPENDS_ON*1..5]->(blocker:Task)
RETURN blocker.id, blocker.title, blocker.status
```
A task is "ready to start" when every direct `DEPENDS_ON` target has `status = 'completed'` or `'completed_late'`.

**Team target visibility (2-hop):**
```cypher
MATCH (u:User {id: $userId})-[:MEMBER_OF]->(d:Department)<-[:FOR_DEPARTMENT]-(t:Target)
RETURN t
```

---

## 6. Build order

1. CognoDB connection module + auth (JWT, roles guard, super-admin bootstrap seed)
2. Users/Staff + Departments (foundation everything else hangs off)
3. Tasks + Sub-tasks + **Dependencies** (the graph showcase — build and demo this early, it's the centerpiece)
4. Performance (computed service, no cron)
5. Targets + Entries
6. Notifications + Comments (lowest risk to simplify if time runs short)

## 7. Where I'd cut first if the clock runs out

Not proposing you cut these now — just flagging risk, since you said only complaints is out:
- **Notification cron/email** is the single most time-expensive piece relative to what it demonstrates about graph modeling. If time gets tight, in-app notifications only (no Resend email, no scheduled job — create a `Notification` node inline when the triggering action happens) preserves the feature without the scheduler.
- **Threaded comment replies** are easy to model (`REPLY_TO` self-reference) but the nested-reply UI takes real frontend time. Flat comments with a `parentId` shown as a flat list is a fallback that keeps the graph relationship without the UI cost.

Everything else in scope is core to the existing app and low-risk to port as-is.
