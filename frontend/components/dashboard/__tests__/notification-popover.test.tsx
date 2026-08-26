import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NotificationPopover } from "../notification-popover";
import * as notificationHooks from "@/hooks/use-notifications";
import type { Notification } from "@/types/api";

vi.mock("@/hooks/use-notifications");

const mockNotifications: Notification[] = [
  {
    n: {
      id: "notif-1",
      title: "Task Assigned",
      message: "You have been assigned: Design API schema",
      type: "task_assigned",
      severity: "info",
      isRead: false,
      createdAt: new Date().toISOString(),
    },
    relatedTask: {
      id: "task-1",
      title: "Design API schema",
      status: "in_progress",
    },
  },
  {
    n: {
      id: "notif-2",
      title: "Task Completed",
      message: "Tunde completed task",
      type: "task_completed",
      severity: "success",
      isRead: true,
      createdAt: new Date().toISOString(),
    },
    relatedTask: null,
  },
];

describe("NotificationPopover Component", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    vi.spyOn(notificationHooks, "useNotifications").mockReturnValue({
      data: mockNotifications,
      isLoading: false,
    } as any);

    vi.spyOn(notificationHooks, "useUnreadNotificationCount").mockReturnValue({
      data: 1,
      isLoading: false,
    } as any);

    vi.spyOn(notificationHooks, "useMarkNotificationAsRead").mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.spyOn(notificationHooks, "useMarkAllNotificationsAsRead").mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.spyOn(notificationHooks, "useDeleteNotification").mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);
  });

  it("renders the notification trigger bell button with unread count badge", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <NotificationPopover />
      </QueryClientProvider>
    );

    const triggerBtn = screen.getByRole("button", { name: /notifications/i });
    expect(triggerBtn).toBeInTheDocument();

    // Verify unread count badge text is visible
    expect(screen.getByText("1")).toBeInTheDocument();
  });
});
