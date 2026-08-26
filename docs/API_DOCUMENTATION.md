# TaskManager Pro (CognoDB) — API Documentation for Frontend

> **Base URL:** `http://localhost:3000` (development) / `https://your-api-domain.com` (production)  
> **Authentication Header:** `Authorization: Bearer <jwt_token>`  
> **Content-Type:** `application/json`

---

## Response Structure Standard

All successful API responses are automatically enveloped by the global `ResponseInterceptor`:

```typescript
type ResponseTemplate<T> = {
  success: boolean;    // true on 2xx responses
  statusCode: number; // 200, 201, etc.
  message: string;    // Action-specific success message
  data: T;            // The payload data
};
```

---

## Table of Contents

1. [Authentication (`/api/auth`)](#1-authentication-apiauth)
2. [Users & Hierarchy (`/api/users`)](#2-users--hierarchy-apiusers)
3. [Departments (`/api/departments`)](#3-departments-apidepartments)
4. [Tasks, Dependencies & Sub-tasks (`/api/tasks`)](#4-tasks-dependencies--sub-tasks-apitasks)
5. [Task Comments (`/api/tasks/:taskId/comments`)](#5-task-comments-apitaskstaskidcomments)
6. [Performance Analytics (`/api/performance`)](#6-performance-analytics-apiperformance)
7. [Targets & Progress Entries (`/api/targets`)](#7-targets--progress-entries-apitargets)
8. [Notifications (`/api/notifications`)](#8-notifications-apinotifications)
9. [Standard Error Responses](#9-standard-error-responses)

---

## 1. Authentication (`/api/auth`)

### 1.1 Login
- **Endpoint:** `POST /api/auth/login`
- **Auth Required:** No
- **Body:**
  ```json
  {
    "email": "ada.okoro@org.com",
    "password": "Password123!"
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "success": true,
    "statusCode": 201,
    "message": "Login successful",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "c1f7a1e2-...",
        "firstName": "Ada",
        "lastName": "Okoro",
        "email": "ada.okoro@org.com",
        "role": "admin",
        "status": "active",
        "createdAt": "2026-08-25T02:00:00.000Z",
        "lastLogin": "2026-08-25T02:30:00.000Z"
      }
    }
  }
  ```

### 1.2 Get Current Profile (`/me`)
- **Endpoint:** `GET /api/auth/me`
- **Auth Required:** Yes (Any role)
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "User profile retrieved successfully",
    "data": {
      "id": "u-123",
      "firstName": "Tunde",
      "lastName": "Alabi",
      "email": "tunde.alabi@org.com",
      "role": "staff",
      "status": "active",
      "department": {
        "id": "d-eng-1",
        "name": "Engineering",
        "description": "Engineering department"
      },
      "supervisor": {
        "id": "sup-femi-1",
        "firstName": "Femi",
        "lastName": "Balogun"
      }
    }
  }
  ```

### 1.3 Change Password
- **Endpoint:** `PUT /api/auth/change-password`
- **Auth Required:** Yes (Any role)
- **Body:**
  ```json
  {
    "currentPassword": "Password123!",
    "newPassword": "NewStrongPassword456!"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Password changed successfully",
    "data": {
      "message": "Password changed successfully"
    }
  }
  ```

---

## 2. Users & Hierarchy (`/api/users`)

### 2.1 List Users
- **Endpoint:** `GET /api/users`
- **Auth Required:** Yes
- **Query Parameters (Optional):**
  - `role`: Filter by `admin`, `supervisor`, `staff`, or `super_admin`
  - `departmentId`: Filter by department UUID
  - `status`: `active` or `inactive`
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Users retrieved successfully",
    "data": [
      {
        "u": {
          "id": "u-1",
          "firstName": "Tunde",
          "lastName": "Alabi",
          "email": "tunde.alabi@org.com",
          "role": "staff",
          "status": "active"
        },
        "d": {
          "id": "d-1",
          "name": "Engineering"
        }
      }
    ]
  }
  ```

### 2.2 List Supervisors (with Team Summary)
- **Endpoint:** `GET /api/users/supervisors`
- **Auth Required:** Yes
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Supervisors retrieved successfully",
    "data": [
      {
        "u": {
          "id": "sup-1",
          "firstName": "Femi",
          "lastName": "Balogun",
          "email": "femi.balogun@org.com",
          "role": "supervisor",
          "status": "active"
        },
        "d": {
          "id": "d-1",
          "name": "Engineering"
        },
        "teamMembers": [
          {
            "id": "staff-1",
            "firstName": "Tunde",
            "lastName": "Alabi",
            "email": "tunde.alabi@org.com",
            "status": "active"
          }
        ]
      }
    ]
  }
  ```

### 2.3 Get User by ID
- **Endpoint:** `GET /api/users/:id`
- **Auth Required:** Yes
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "User details retrieved successfully",
    "data": {
      "id": "u-1",
      "firstName": "Tunde",
      "lastName": "Alabi",
      "email": "tunde.alabi@org.com",
      "role": "staff",
      "status": "active",
      "department": { "id": "d-1", "name": "Engineering" },
      "supervisor": { "id": "sup-1", "firstName": "Femi", "lastName": "Balogun" }
    }
  }
  ```

### 2.4 Create User
- **Endpoint:** `POST /api/users`
- **Auth Required:** Yes (Roles: `super_admin`, `admin`)
- **Body:**
  ```json
  {
    "firstName": "Zainab",
    "lastName": "Bello",
    "email": "zainab.bello@org.com",
    "password": "Password123!",
    "role": "staff",
    "departmentId": "d-eng-1",
    "supervisorId": "sup-femi-1"
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "success": true,
    "statusCode": 201,
    "message": "User created successfully",
    "data": {
      "id": "u-new-1",
      "firstName": "Zainab",
      "lastName": "Bello",
      "email": "zainab.bello@org.com",
      "role": "staff",
      "status": "active"
    }
  }
  ```

### 2.5 Update User Details
- **Endpoint:** `PUT /api/users/:id`
- **Auth Required:** Yes (Roles: `super_admin`, `admin`)
- **Body:**
  ```json
  {
    "firstName": "Zainab",
    "lastName": "Bello-Ade",
    "role": "supervisor",
    "departmentId": "d-eng-1",
    "supervisorId": "admin-1"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "User updated successfully",
    "data": { "id": "u-new-1", "firstName": "Zainab", "lastName": "Bello-Ade", ... }
  }
  ```

### 2.6 Toggle User Active/Inactive Status
- **Endpoint:** `PATCH /api/users/:id/status`
- **Auth Required:** Yes (Roles: `super_admin`, `admin`)
- **Body:**
  ```json
  {
    "status": "inactive"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "User status updated successfully",
    "data": { "message": "User status set to inactive" }
  }
  ```

### 2.7 Reassign Team Members to New Supervisor
- **Endpoint:** `PATCH /api/users/reassign-supervisor`
- **Auth Required:** Yes (Roles: `super_admin`, `admin`)
- **Body:**
  ```json
  {
    "memberIds": ["u-1", "u-2"],
    "newSupervisorId": "sup-new-1"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Supervisor reassigned successfully",
    "data": { "message": "Supervisor reassigned" }
  }
  ```

### 2.8 Delete User
- **Endpoint:** `DELETE /api/users/:id`
- **Auth Required:** Yes (Roles: `super_admin`, `admin`)
- **Guard:** Throws `400 Bad Request` if the user still has active tasks (`not_started`, `in_progress`, `overdue`).
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "User deleted successfully",
    "data": { "message": "User deleted" }
  }
  ```

### 2.9 Get Reporting Chain (Graph Traversal)
- **Endpoint:** `GET /api/users/:id/reporting-chain`
- **Auth Required:** Yes
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Reporting chain retrieved successfully",
    "data": [
      {
        "manager": { "id": "sup-1", "firstName": "Femi", "lastName": "Balogun", "role": "supervisor" },
        "depth": 1
      },
      {
        "manager": { "id": "admin-1", "firstName": "Ada", "lastName": "Okoro", "role": "admin" },
        "depth": 2
      }
    ]
  }
  ```

---

## 3. Departments (`/api/departments`)

### 3.1 List Departments (with Aggregations)
- **Endpoint:** `GET /api/departments`
- **Auth Required:** Yes
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Departments retrieved successfully",
    "data": [
      {
        "d": {
          "id": "d-1",
          "name": "Engineering",
          "description": "Engineering department"
        },
        "head": {
          "id": "sup-1",
          "firstName": "Femi",
          "lastName": "Balogun"
        },
        "staffCount": 4,
        "activeTasks": 3,
        "completionRate": 80.0
      }
    ]
  }
  ```

### 3.2 Get Department by ID
- **Endpoint:** `GET /api/departments/:id`
- **Auth Required:** Yes
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Department details retrieved successfully",
    "data": {
      "d": { "id": "d-1", "name": "Engineering" },
      "head": { "id": "sup-1", "firstName": "Femi" },
      "staff": [ ... ],
      "tasks": [ ... ]
    }
  }
  ```

### 3.3 Create Department
- **Endpoint:** `POST /api/departments`
- **Auth Required:** Yes (Roles: `super_admin`, `admin`)
- **Body:**
  ```json
  {
    "name": "Product Design",
    "description": "UI/UX and Research",
    "headId": "sup-1"
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "success": true,
    "statusCode": 201,
    "message": "Department created successfully",
    "data": { "id": "d-new-1", "name": "Product Design", ... }
  }
  ```

### 3.4 Update Department
- **Endpoint:** `PUT /api/departments/:id`
- **Auth Required:** Yes (Roles: `super_admin`, `admin`)
- **Body:**
  ```json
  {
    "name": "Product & Design",
    "description": "Updated description",
    "headId": "sup-2"
  }
  ```

### 3.5 Delete Department
- **Endpoint:** `DELETE /api/departments/:id`
- **Auth Required:** Yes (Roles: `super_admin`, `admin`)
- **Guard:** Throws `400 Bad Request` if staff members are assigned to the department.
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Department deleted successfully",
    "data": null
  }
  ```

---

## 4. Tasks, Dependencies & Sub-tasks (`/api/tasks`)

### 4.1 Get Task Overview Statistics (Dashboard)
- **Endpoint:** `GET /api/tasks/stats`
- **Auth Required:** Yes
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Task statistics retrieved successfully",
    "data": {
      "total": 12,
      "completed": 5,
      "completedLate": 1,
      "inProgress": 4,
      "overdue": 1,
      "notStarted": 1
    }
  }
  ```

### 4.2 List Tasks
- **Endpoint:** `GET /api/tasks`
- **Auth Required:** Yes
- **Query Parameters (Optional):** `status`, `priority`, `departmentId`, `assignedToId`
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Tasks retrieved successfully",
    "data": [
      {
        "t": {
          "id": "task-1",
          "title": "Design API schema",
          "description": "Create openCypher queries",
          "status": "completed",
          "priority": "high",
          "deadline": "2026-09-01T00:00:00.000Z",
          "createdAt": "2026-08-25T02:00:00.000Z",
          "completedAt": "2026-08-25T03:00:00.000Z"
        },
        "assignee": { "id": "u-1", "firstName": "Tunde", "lastName": "Alabi", "email": "tunde.alabi@org.com" },
        "assigner": { "id": "sup-1", "firstName": "Femi", "lastName": "Balogun" },
        "d": { "id": "d-1", "name": "Engineering" }
      }
    ]
  }
  ```

### 4.3 Get Task by ID (with Dependencies)
- **Endpoint:** `GET /api/tasks/:id`
- **Auth Required:** Yes
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Task details retrieved successfully",
    "data": {
      "t": { "id": "task-1", "title": "Implement API endpoints", ... },
      "assignee": { "id": "u-1", "firstName": "Tunde" },
      "assigner": { "id": "sup-1", "firstName": "Femi" },
      "d": { "id": "d-1", "name": "Engineering" },
      "dependencies": [
        { "id": "task-design", "title": "Design API schema", "status": "completed" }
      ]
    }
  }
  ```

### 4.4 Create Task
- **Endpoint:** `POST /api/tasks`
- **Auth Required:** Yes (Roles: `super_admin`, `admin`, `supervisor`)
- **Body:**
  ```json
  {
    "title": "Implement API endpoints",
    "description": "Write NestJS controllers and services",
    "assignedToId": "u-staff-1",
    "priority": "high",
    "departmentId": "d-eng-1",
    "deadline": "2026-09-05T00:00:00.000Z",
    "dependsOnTaskIds": ["task-design-id"]
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "success": true,
    "statusCode": 201,
    "message": "Task created successfully",
    "data": { "id": "task-new-1", "title": "Implement API endpoints", ... }
  }
  ```

### 4.5 Update Task
- **Endpoint:** `PUT /api/tasks/:id`
- **Auth Required:** Yes (Roles: `super_admin`, `admin`, `supervisor`)
- **Body:**
  ```json
  {
    "title": "Implement API endpoints v2",
    "description": "Updated description",
    "priority": "medium",
    "assignedToId": "u-staff-2",
    "departmentId": "d-eng-1",
    "deadline": "2026-09-10T00:00:00.000Z"
  }
  ```

### 4.6 Update Task Status
- **Endpoint:** `PATCH /api/tasks/:id/status`
- **Auth Required:** Yes
- **Body:** `{ "status": "completed" }`
- **Rules & Transitions:**
  - If status is `overdue` and marked `completed`, backend automatically sets status to `completed_late`.
  - An `overdue` task cannot be moved to `in_progress`.
  - Starting (`in_progress`) or finishing (`completed`) a task verifies that all prerequisite dependency tasks are completed; otherwise throws `400 Bad Request`.
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Task status updated successfully",
    "data": null
  }
  ```

### 4.7 Delete Task
- **Endpoint:** `DELETE /api/tasks/:id`
- **Auth Required:** Yes (Roles: `super_admin`, `admin`)
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Task deleted successfully",
    "data": { "message": "Task deleted" }
  }
  ```

### 4.8 Manage Task Dependencies
- **Add Dependency:** `POST /api/tasks/:id/dependencies`
  - Body: `{ "dependsOnTaskId": "prerequisite-task-id" }`
  - *Prevents circular dependencies using graph cycle detection.*
- **Remove Dependency:** `DELETE /api/tasks/:id/dependencies/:dependsOnTaskId`
- **Get Transitive Blockers:** `GET /api/tasks/:id/blockers`
- **Check Ready to Start:** `GET /api/tasks/:id/ready` -> `data: true | false`

### 4.9 Sub-tasks (Checklist)
- **List Subtasks:** `GET /api/tasks/:id/subtasks`
- **Add Subtask:** `POST /api/tasks/:id/subtasks`
  - Body: `{ "title": "Write unit tests", "order": 0 }`
- **Toggle Subtask Completion:** `PATCH /api/tasks/subtasks/:subtaskId`
  - Body: `{ "isCompleted": true }`
- **Delete Subtask:** `DELETE /api/tasks/subtasks/:subtaskId`

---

## 5. Task Comments (`/api/tasks/:taskId/comments`)

### 5.1 Post Comment or Reply
- **Endpoint:** `POST /api/tasks/:taskId/comments`
- **Auth Required:** Yes
- **Body (Root Comment):**
  ```json
  {
    "content": "Schema design is ready for review."
  }
  ```
- **Body (Threaded Reply):**
  ```json
  {
    "content": "Approved, please proceed with implementation.",
    "parentCommentId": "comment-root-uuid"
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "success": true,
    "statusCode": 201,
    "message": "Comment created successfully",
    "data": {
      "c": { "id": "c-1", "content": "Schema design is ready for review.", ... },
      "author": { "id": "u-1", "firstName": "Tunde" }
    }
  }
  ```

### 5.2 List Task Comments (with Threaded Replies)
- **Endpoint:** `GET /api/tasks/:taskId/comments`
- **Auth Required:** Yes
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Task comments retrieved successfully",
    "data": [
      {
        "c": {
          "id": "c-1",
          "content": "Schema design is ready for review.",
          "createdAt": "2026-08-25T02:10:00.000Z"
        },
        "author": {
          "id": "u-1",
          "firstName": "Tunde",
          "lastName": "Alabi",
          "email": "tunde.alabi@org.com"
        },
        "replies": [
          {
            "comment": {
              "id": "c-2",
              "content": "Approved, please proceed with implementation.",
              "createdAt": "2026-08-25T02:15:00.000Z"
            },
            "author": {
              "id": "sup-1",
              "firstName": "Femi",
              "lastName": "Balogun",
              "email": "femi.balogun@org.com"
            }
          }
        ]
      }
    ]
  }
  ```

### 5.3 Delete Comment
- **Endpoint:** `DELETE /api/tasks/:taskId/comments/:commentId`
- **Auth Required:** Yes (Comment author or `super_admin`)
- **Note:** Cascades delete to all nested replies.

---

## 6. Performance Analytics (`/api/performance`)

> **Performance is computed in real time on read** from the graph relationships (no cron delay).

### 6.1 List All Staff Performance Scores
- **Endpoint:** `GET /api/performance`
- **Auth Required:** Yes (Roles: `super_admin`, `admin`, `supervisor`)
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Performance analytics retrieved successfully",
    "data": [
      {
        "user": {
          "id": "u-1",
          "firstName": "Tunde",
          "lastName": "Alabi",
          "email": "tunde.alabi@org.com",
          "role": "staff"
        },
        "department": { "id": "d-1", "name": "Engineering" },
        "totalTasksAssigned": 6,
        "tasksCompleted": 5,
        "tasksOnTime": 4,
        "tasksCompletedLate": 1,
        "tasksLate": 1,
        "performanceScore": 87,
        "rating": "Good"
      }
    ]
  }
  ```

### 6.2 Get Own Performance Score
- **Endpoint:** `GET /api/performance/me`
- **Auth Required:** Yes (Any role)

### 6.3 Get Department Performance
- **Endpoint:** `GET /api/performance/department/:id`
- **Auth Required:** Yes (Roles: `super_admin`, `admin`, `supervisor`)

---

## 7. Targets & Progress Entries (`/api/targets`)

### 7.1 List Targets
- **Endpoint:** `GET /api/targets`
- **Auth Required:** Yes
- **Query Parameters (Optional):** `type` (`team` / `individual`), `status`, `departmentId`
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Targets retrieved successfully",
    "data": [
      {
        "id": "target-1",
        "title": "Complete Q3 sprint goals",
        "description": "Team delivery target for Q3",
        "type": "team",
        "targetValue": 20,
        "currentValue": 8,
        "status": "on_track",
        "deadline": "2026-09-25T00:00:00.000Z",
        "department": { "id": "d-1", "name": "Engineering" },
        "creator": { "id": "sup-1", "firstName": "Femi", "lastName": "Balogun" }
      }
    ]
  }
  ```

### 7.2 Get Target by ID
- **Endpoint:** `GET /api/targets/:id`
- **Auth Required:** Yes

### 7.3 Create Target
- **Endpoint:** `POST /api/targets`
- **Auth Required:** Yes (Roles: `super_admin`, `admin`, `supervisor`)
- **Body:**
  ```json
  {
    "title": "Complete Q3 sprint goals",
    "description": "Sprint tickets delivery",
    "type": "team",
    "targetValue": 20,
    "deadline": "2026-09-30T00:00:00.000Z",
    "departmentId": "d-eng-1"
  }
  ```

### 7.4 Update Target
- **Endpoint:** `PUT /api/targets/:id`
- **Auth Required:** Yes (Roles: `super_admin`, `admin`, `supervisor`)

### 7.5 Log Progress Entry
- **Endpoint:** `POST /api/targets/:id/entries`
- **Auth Required:** Yes
- **Body:**
  ```json
  {
    "value": 3,
    "note": "Delivered auth module tickets"
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "success": true,
    "statusCode": 201,
    "message": "Target progress entry logged successfully",
    "data": { "id": "entry-1", "value": 3, "note": "Delivered auth module tickets" }
  }
  ```

### 7.6 List Progress Entries for Target
- **Endpoint:** `GET /api/targets/:id/entries`
- **Auth Required:** Yes
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Target progress entries retrieved successfully",
    "data": [
      {
        "e": {
          "id": "entry-1",
          "value": 3,
          "note": "Delivered auth module tickets",
          "createdAt": "2026-08-25T02:40:00.000Z"
        },
        "submitter": {
          "id": "u-1",
          "firstName": "Tunde",
          "lastName": "Alabi"
        }
      }
    ]
  }
  ```

### 7.7 Delete Progress Entry
- **Endpoint:** `DELETE /api/targets/:id/entries/:entryId`
- **Auth Required:** Yes (Roles: `super_admin`, `admin`, `supervisor`)

---

## 8. Notifications (`/api/notifications`)

### 8.1 List User Notifications
- **Endpoint:** `GET /api/notifications`
- **Auth Required:** Yes
- **Query Parameters (Optional):**
  - `type`: `task_assigned`, `task_completed`, `comment_added`, `target_update`, `deadline_warning`, `overdue_alert`
  - `isRead`: `true` or `false`
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Notifications retrieved successfully",
    "data": [
      {
        "n": {
          "id": "notif-1",
          "title": "Task Assigned",
          "message": "You have been assigned: Design API schema",
          "type": "task_assigned",
          "severity": "info",
          "isRead": false,
          "createdAt": "2026-08-25T02:00:00.000Z"
        },
        "relatedTask": {
          "id": "task-1",
          "title": "Design API schema",
          "status": "completed"
        }
      }
    ]
  }
  ```

### 8.2 Get Unread Count (for Badge Counters)
- **Endpoint:** `GET /api/notifications/unread-count`
- **Auth Required:** Yes
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Unread notification count retrieved successfully",
    "data": 3
  }
  ```

### 8.3 Mark Notification as Read
- **Endpoint:** `PATCH /api/notifications/:id/read`
- **Auth Required:** Yes
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Notification marked as read",
    "data": { "message": "Notification marked as read" }
  }
  ```

### 8.4 Mark All Notifications as Read
- **Endpoint:** `PATCH /api/notifications/read-all`
- **Auth Required:** Yes
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "All notifications marked as read",
    "data": { "message": "All notifications marked as read" }
  }
  ```

### 8.5 Delete Notification
- **Endpoint:** `DELETE /api/notifications/:id`
- **Auth Required:** Yes
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Notification deleted successfully",
    "data": { "message": "Notification deleted" }
  }
  ```

---

## 9. Standard Error Responses

All API errors (handled by the global `HttpExceptionFilter`) return a symmetrical, consistent JSON payload:

```typescript
type ErrorResponse = {
  success: false;
  statusCode: number; // 400, 401, 403, 404, 409, 500, etc.
  message: string;    // Human-readable error description
};
```

### 400 Bad Request (Validation or Business Rule Conflict)
```json
{
  "success": false,
  "statusCode": 400,
  "message": "That dependency would create a cycle"
}
```

### 401 Unauthorized (Missing or Invalid Credentials)
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid credentials"
}
```

### 403 Forbidden (Insufficient Role Permissions)
```json
{
  "success": false,
  "statusCode": 403,
  "message": "You can only delete your own comments"
}
```

### 409 Conflict (Duplicate Resource / Email)
```json
{
  "success": false,
  "statusCode": 409,
  "message": "A user with this email already exists"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "statusCode": 500,
  "message": "Internal server error"
}
```
