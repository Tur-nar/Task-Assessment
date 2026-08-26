// API response envelope from backend
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}

export interface ApiError {
  success: false;
  statusCode: number;
  message: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface ReassignSupervisorPayload {
  memberIds: string[];
  newSupervisorId: string;
}

// ─── User ───────────────────────────────────────────────
export type UserRole = "super_admin" | "admin" | "supervisor" | "staff";
export type UserStatus = "active" | "inactive";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt?: string;
  lastLogin?: string;
}

export interface UserWithRelations {
  u: User;
  d?: { id: string; name: string } | null;
}

export interface UserDetail extends User {
  department?: { id: string; name: string; description?: string } | null;
  supervisor?: { id: string; firstName: string; lastName: string } | null;
}

export interface SupervisorWithTeam extends UserWithRelations {
  teamMembers: Pick<User, "id" | "firstName" | "lastName" | "email" | "status">[];
}

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  departmentId?: string;
  supervisorId?: string;
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  departmentId?: string;
  supervisorId?: string;
}

// ─── Department ─────────────────────────────────────────
export interface Department {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
}

export interface DepartmentWithStats {
  d: Department;
  head?: { id: string; firstName: string; lastName: string; email?: string } | null;
  staffCount: number;
  totalTasks?: number;
  completedTasks?: number;
  activeTasks?: number;
  completionRate?: number;
}

export interface DepartmentDetail {
  d: Department;
  head?: { id: string; firstName: string; lastName: string; email?: string } | null;
  staff?: Pick<User, "id" | "firstName" | "lastName" | "email" | "role" | "status">[];
}

export interface CreateDepartmentPayload {
  name: string;
  description?: string;
  headId?: string;
}

export interface UpdateDepartmentPayload {
  name?: string;
  description?: string;
  headId?: string;
}

export type TaskStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "completed_late"
  | "overdue";

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  deadline?: string;
  createdAt: string;
  completedAt?: string;
}

export interface TaskWithRelations {
  t: Task;
  assignee?: Pick<User, "id" | "firstName" | "lastName" | "email"> | null;
  assigner?: Pick<User, "id" | "firstName" | "lastName"> | null;
  d?: { id: string; name: string } | null;
}

export interface TaskDependencyInfo {
  id: string;
  title: string;
  status: TaskStatus;
  priority?: TaskPriority;
}

export interface TaskDetail extends TaskWithRelations {
  dependencies?: TaskDependencyInfo[];
  dependents?: TaskDependencyInfo[];
  ready?: boolean;
}

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
  order: number;
}

export interface TaskComment {
  c: {
    id: string;
    content: string;
    createdAt: string;
  };
  author: Pick<User, "id" | "firstName" | "lastName" | "email">;
  replies?: {
    comment: { id: string; content: string; createdAt: string };
    author: Pick<User, "id" | "firstName" | "lastName" | "email">;
  }[];
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  assignedToId: string;
  departmentId?: string;
  priority?: TaskPriority;
  deadline: string;
  dependsOnTaskIds?: string[];
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  deadline?: string;
  assignedToId?: string;
  departmentId?: string;
}

export interface TaskStats {
  total: number;
  completed: number;
  completedLate: number;
  inProgress: number;
  overdue: number;
  notStarted: number;
}

// ─── Notification ───────────────────────────────────────
export type NotificationType =
  | "task_assigned"
  | "task_completed"
  | "comment_added"
  | "target_update"
  | "deadline_warning"
  | "overdue_alert";

export interface Notification {
  n: {
    id: string;
    title: string;
    message: string;
    type: NotificationType;
    severity: string;
    isRead: boolean;
    createdAt: string;
  };
  relatedTask?: { id: string; title: string; status: string } | null;
}

// ─── Performance ────────────────────────────────────────
export interface PerformanceRecord {
  user: Pick<User, "id" | "firstName" | "lastName" | "email" | "role">;
  department: { id: string; name: string } | null;
  totalTasksAssigned: number;
  tasksCompleted: number;
  tasksOnTime: number;
  tasksCompletedLate: number;
  tasksLate: number;
  performanceScore: number;
  rating: string;
}

// ─── Reporting Chain ────────────────────────────────────
export interface ReportingChainNode {
  manager: Pick<User, "id" | "firstName" | "lastName" | "email" | "role"> & { status?: string };
  depth: number;
}
