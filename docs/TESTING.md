# TaskManager Pro (CognoDB Edition) — Test Documentation

Comprehensive test documentation for the TaskManager Pro backend.

---

## 1. Overview & Stack

The backend test suite is built on **Jest** and **@nestjs/testing**, with TypeScript compilation powered by **ts-jest**.

| Tool | Version | Purpose |
|---|---|---|
| **Jest** | `^29.7.0` | Test runner, assertion library, and mock orchestration |
| **@nestjs/testing** | `^10.4.0` | NestJS dependency injection test bed (`Test.createTestingModule`) |
| **ts-jest** | `^29.4.0` | In-memory TypeScript transformer for Jest |
| **@types/jest** | `^29.5.0` | TypeScript typings for Jest |

---

## 2. Testing Strategy

### Boundary Mocking (Graph Database)
In alignment with our decoupled architecture, all Neo4j / CognoDB interactions go through `Neo4jService.run(cypher, params, mode)`. 
In unit and integration tests:
- `Neo4jService` is mocked at the DI boundary with `mockNeo4j = { run: jest.fn() }`.
- No active CognoDB or Neo4j instance is required to run the test suite.
- Tests assert input validation, graph query formulation, business logic, status transitions, cycle prevention, and output sanitization.

### Security & Sanitization Checks
Every service returning a user model (`AuthService`, `UsersService`) is explicitly tested to verify that sensitive fields such as `passwordHash` are stripped before crossing controller boundaries.

---

## 3. Test Suites Breakdown

All 8 feature modules have co-located test files (`src/modules/*/*.spec.ts`).

### 3.1 Auth Module (`src/modules/auth/auth.service.spec.ts`)
- **Login Success**: Validates password comparison with bcrypt and JWT payload signing (`sub`, `email`, `role`).
- **Inactive Account Guard**: Ensures inactive users cannot authenticate even with valid credentials.
- **Credential Verification**: Rejects nonexistent emails and mismatched passwords with `UnauthorizedException`.
- **Profile (`/me`)**: Asserts projection of department and supervisor details alongside sanitized user data.
- **Change Password**: Validates current password verification and bcrypt hashing of the new password.

### 3.2 Users Module (`src/modules/users/users.service.spec.ts`)
- **Sanitized Creation**: Confirms password hashing and stripping of `passwordHash` on return.
- **Duplicate Email Prevention**: Asserts `ConflictException` on existing email.
- **Active Task Guard on Deletion**: Confirms deletion is blocked with `BadRequestException` if user has active tasks (`not_started`, `in_progress`, `overdue`).
- **Supervisor Team Aggregation**: Tests collection of team members and department relationships.

### 3.3 Tasks Module (`src/modules/tasks/tasks.service.spec.ts`)
- **Task Creation**: Verifies task properties, priority, deadline, and multi-relational edges (`ASSIGNED_TO`, `ASSIGNED_BY`, `BELONGS_TO`).
- **Status Counts Aggregation**: Tests count aggregation across all task statuses for dashboard metrics.
- **Self-Dependency Guard**: Rejects tasks depending on themselves.
- **Cyclic Dependency Guard**: Simulates variable-length path traversal (`-[:DEPENDS_ON*1..20]->`) to detect and reject circular dependencies with `BadRequestException`.
- **Ready-to-Start Blocker Check**: Blocks starting or completing tasks if upstream dependency tasks are incomplete.
- **Overdue Transition Guard**: Prevents moving overdue tasks back to `in_progress`.

### 3.4 Departments Module (`src/modules/departments/departments.service.spec.ts`)
- **Aggregated Statistics**: Validates single-query department listing with staff count and completion rate calculation.
- **Safe Deletion Guard**: Ensures departments cannot be deleted while staff members remain assigned.

### 3.5 Comments Module (`src/modules/comments/comments.service.spec.ts`)
- **Top-Level Comments**: Tests creation of root task comments with author assignment.
- **Threaded Replies**: Validates parent comment existence check on the same task before writing `REPLY_TO` edge.
- **Role-Based Deletion**: Author can delete own comment; `super_admin` can delete any comment; other users are blocked with `ForbiddenException`.

### 3.6 Performance Module (`src/modules/performance/performance.service.spec.ts`)
- **Scoring Algorithm**:
  $$\text{score} = \text{clamp}(0, 100, 50 + \text{on\_time\_bonus} - \text{overdue\_penalty} + \text{completion\_bonus} + \text{late\_bonus})$$
- **Rating Categories**:
  - `90+`: **Excellent**
  - `75–89`: **Good**
  - `50–74`: **Average**
  - `< 50`: **Needs Improvement**
- **Default Score**: Verifies users with 0 assigned tasks receive a baseline score of `50 (Average)`.

### 3.7 Targets Module (`src/modules/targets/targets.service.spec.ts`)
- **Target Creation**: Tests team targets (`FOR_DEPARTMENT`) and individual targets (`ASSIGNED_TO`).
- **Dynamic Status Resolution**:
  - `completed`: `currentValue >= targetValue`
  - `missed`: Deadline passed and target value not met.
  - `at_risk`: Within 3 days of deadline and progress $< 75\%$.
  - `on_track`: Default progressing state.
- **Progress Entries**: Validates progress logging (`TargetEntry`) with timestamp and submitter link.

### 3.8 Notifications Module (`src/modules/notifications/notifications.service.spec.ts`)
- **Notification Creation**: Tests creation and linking to recipient (`FOR_USER`) and optional task (`RELATED_TO`).
- **Unread Count**: Verifies fast count aggregation of unread notifications.
- **Read State Updates**: Tests single-item read update and bulk `markAllRead`.

---

## 4. Running the Tests

From the `backend/` directory:

```bash
# Run all test suites once
npm test

# Run tests in watch mode during development
npm run test:watch

# Run tests with code coverage report
npm run test:cov

# Run a specific test suite
npm test -- src/modules/tasks/tasks.service.spec.ts
```

---

## 5. Test Results Summary

```
PASS src/modules/performance/performance.service.spec.ts
PASS src/modules/targets/targets.service.spec.ts
PASS src/modules/tasks/tasks.service.spec.ts
PASS src/modules/departments/departments.service.spec.ts
PASS src/modules/comments/comments.service.spec.ts
PASS src/modules/notifications/notifications.service.spec.ts
PASS src/modules/users/users.service.spec.ts
PASS src/modules/auth/auth.service.spec.ts

Test Suites: 8 passed, 8 total
Tests:       39 passed, 39 total
Snapshots:   0 total
Time:        ~6s
```
