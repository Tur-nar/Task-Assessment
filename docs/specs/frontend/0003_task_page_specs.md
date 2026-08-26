# Tasks Page — Full Feature Implementation Plan

## Overview

A fully-featured Task Management surface at `/dashboard/tasks` with three interchangeable views powered by a single `useTasks()` query, plus a full CRUD modal suite. This mirrors the quality and animation standards of the Staff/Departments/Supervisors pages.

---

## Architecture

### View Modes (toggle via animated tab strip)
| View | Description | Library |
| :--- | :--- | :--- |
| **Kanban Board** | Drag-and-drop status columns | `@dnd-kit/core` + `@dnd-kit/sortable` |
| **Table View** | Sortable, filterable list (like Staff page) | Native (Framer Motion rows) |
| **Calendar View** | Deadline-based monthly/weekly calendar | `react-big-calendar` + `date-fns` |

A single `useTasks(filters)` hook feeds all three views — the data is shared from TanStack Query cache.

---

## New Packages to Install
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities react-big-calendar
npm install -D @types/react-big-calendar
```

---

## Files to Create / Modify

### API & Hook Layer
#### [MODIFY] `frontend/lib/api/tasks.ts`
- Add `updateTaskStatus(id, status)` — `PATCH /api/tasks/:id/status`
- Add `getSubtasks(taskId)` — `GET /api/tasks/:id/subtasks`
- Add `addSubtask(taskId, payload)` — `POST /api/tasks/:id/subtasks`
- Add `toggleSubtask(subtaskId, isCompleted)` — `PATCH /api/tasks/subtasks/:subtaskId`
- Add `deleteSubtask(subtaskId)` — `DELETE /api/tasks/subtasks/:subtaskId`
- Add `getTaskComments(taskId)`, `addComment(taskId, payload)`, `deleteComment(taskId, commentId)`
- Move `CreateTaskPayload` / `UpdateTaskPayload` into `types/api.ts`

#### [MODIFY] `frontend/hooks/use-tasks.ts`
- Add `useUpdateTaskStatus()` mutation
- Add `useSubtasks(taskId)`, `useAddSubtask()`, `useToggleSubtask()`, `useDeleteSubtask()`
- Add `useTaskComments(taskId)`, `useAddComment()`, `useDeleteComment()`

#### [MODIFY] `frontend/types/api.ts`
- Add `Subtask`, `Comment`, `TaskDetail` interfaces
- Add `CreateTaskPayload`, `UpdateTaskPayload`

#### [MODIFY] `frontend/constants/query-keys.ts`
- Add `taskKeys.subtasks(id)`, `taskKeys.comments(id)`

---

### Main Page
#### [MODIFY] `frontend/app/dashboard/tasks/page.tsx` → [NEW]
- Animated view-mode switcher (Kanban | Table | Calendar tab strip)
- Search + Priority + Status + Department filter bar (shared across views)
- `ViewRenderer` that mounts the active view component
- All dialogs orchestrated here (Create, View, Delete)

---

### View Components
#### [NEW] `frontend/components/dashboard/tasks/kanban-board.tsx`
- 5 columns: `not_started`, `in_progress`, `completed`, `completed_late`, `overdue`
- Each column has a colored header badge + task count
- Draggable `<TaskCard>` using `@dnd-kit/sortable`
- On drop: calls `useUpdateTaskStatus()` → optimistic UI update
- Animated column entrance (stagger), card shake on drop feedback

#### [NEW] `frontend/components/dashboard/tasks/table-view.tsx`
- Sortable rows with Framer Motion stagger (exact pattern from Staff page)
- Columns: Title, Assignee, Department, Priority, Status, Deadline, Actions
- Priority + Status color badges
- Relative or formatted deadline with overdue red highlight
- Row action menu: View, Edit, Delete

#### [NEW] `frontend/components/dashboard/tasks/calendar-view.tsx`
- `react-big-calendar` with `date-fns` localizer
- Month / Week / Day / Agenda toggle
- Events colored by task priority (low=indigo, medium=amber, high=rose, urgent=red)
- Click event → opens `ViewTaskSheet`
- Custom event tile with truncated title + assignee avatar

#### [NEW] `frontend/components/dashboard/tasks/task-card.tsx`
- Used in Kanban board
- Shows: Title (truncated), Priority badge, Assignee avatar, deadline, subtask progress bar
- `useDraggable` via `@dnd-kit/sortable`
- `DragOverlay` clone while dragging

---

### Task CRUD Components
#### [NEW] `frontend/components/dashboard/tasks/create-task-dialog.tsx`
- Dialog with `react-hook-form` + `zod`
- Fields: Title, Description, Assignee (user selector), Department, Priority, Deadline, Dependencies (multi-select)

#### [NEW] `frontend/components/dashboard/tasks/view-task-sheet.tsx`
- Sheet (desktop) / Drawer (mobile) pattern
- Shows full task detail: description, assignee, assigner, department, status, priority, deadline
- **Subtask Checklist** — real-time toggle with `useToggleSubtask()`, add/delete subtasks
- **Threaded Comments** — list with avatar + timestamp, reply support, delete own comment
- Status update dropdown (with backend transition guards rendered as toasts)

#### [NEW] `frontend/components/dashboard/tasks/delete-task-alert.tsx`
- `AlertDialog` with confirmation

#### [NEW] `frontend/components/dashboard/tasks/edit-task-dialog.tsx`
- Pre-populated edit dialog matching create form

---

### Navigation
#### [MODIFY] `frontend/components/dashboard/app-sidebar.tsx`
- Remove `disabled: true` from Tasks link

#### [MODIFY] `frontend/constants/routes.ts`
- Already has `tasks` — no change needed

---

## Verification Plan

### Automated
```bash
npm run build   # TypeScript check + static generation
```

### Manual
- Kanban: Drag a task card from `not_started` to `in_progress`, confirm status updates via toast
- Table: Sort by priority, filter by department
- Calendar: Navigate months, click a deadline event to open the detail sheet
- Create → appears in all three views simultaneously (from cache)
- Subtask checklist: add, toggle, delete items within sheet

---

## Open Questions

> [!IMPORTANT]
> **Calendar locale**: react-big-calendar needs a localizer. I'll use the `date-fns` localizer since `date-fns` is already installed — no extra package needed beyond `react-big-calendar`.

> [!IMPORTANT]
> **Kanban drag-to-status**: Backend enforces transition rules (e.g. `overdue` cannot move to `in_progress`). I will render backend error toasts and revert the optimistic update if the API call fails.

> [!IMPORTANT]
> **Task visibility by role**: The backend already enforces role-based filtering. The frontend shows all tasks returned by the API without additional client-side role checks.
