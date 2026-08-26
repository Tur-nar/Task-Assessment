import { describe, it, expect } from "vitest";
import {
  authKeys,
  userKeys,
  taskKeys,
  departmentKeys,
  notificationKeys,
  performanceKeys,
} from "../query-keys";

describe("React Query Key Factories", () => {
  it("generates correct hierarchy for authKeys", () => {
    expect(authKeys.all).toEqual(["auth"]);
    expect(authKeys.me()).toEqual(["auth", "me"]);
  });

  it("generates correct hierarchy for taskKeys", () => {
    expect(taskKeys.all).toEqual(["tasks"]);
    expect(taskKeys.list({ status: "in_progress" })).toEqual([
      "tasks",
      "list",
      { status: "in_progress" },
    ]);
    expect(taskKeys.detail("task-123")).toEqual(["tasks", "detail", "task-123"]);
    expect(taskKeys.stats()).toEqual(["tasks", "stats"]);
    expect(taskKeys.subtasks("task-123")).toEqual(["tasks", "subtasks", "task-123"]);
    expect(taskKeys.comments("task-123")).toEqual(["tasks", "comments", "task-123"]);
  });

  it("generates correct hierarchy for notificationKeys", () => {
    expect(notificationKeys.all).toEqual(["notifications"]);
    expect(notificationKeys.list({ isRead: "false" })).toEqual([
      "notifications",
      "list",
      { isRead: "false" },
    ]);
    expect(notificationKeys.unreadCount()).toEqual(["notifications", "unread-count"]);
  });

  it("generates correct hierarchy for performance and department keys", () => {
    expect(departmentKeys.detail("dept-1")).toEqual(["departments", "detail", "dept-1"]);
    expect(performanceKeys.department("dept-1")).toEqual(["performance", "department", "dept-1"]);
  });
});
