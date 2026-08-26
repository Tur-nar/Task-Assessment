"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Bell,
  Search,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  ClipboardList,
  CheckCircle2,
  MessageSquare,
  Clock,
  AlertTriangle,
  Target,
  Sparkles,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
} from "@/hooks/use-notifications";
import { formatRelativeTime, formatSafeDate } from "@/lib/utils";
import type { Notification, NotificationType } from "@/types/api";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

const TYPE_CONFIG: Record<
  NotificationType,
  {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    color: string;
    bg: string;
    border: string;
  }
> = {
  task_assigned: {
    icon: ClipboardList,
    label: "Task Assigned",
    color: "text-blue-500",
    bg: "bg-blue-500/10 dark:bg-blue-500/15",
    border: "border-blue-500/20",
  },
  task_completed: {
    icon: CheckCircle2,
    label: "Task Completed",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
    border: "border-emerald-500/20",
  },
  comment_added: {
    icon: MessageSquare,
    label: "Comment",
    color: "text-purple-500",
    bg: "bg-purple-500/10 dark:bg-purple-500/15",
    border: "border-purple-500/20",
  },
  deadline_warning: {
    icon: Clock,
    label: "Deadline Warning",
    color: "text-amber-500",
    bg: "bg-amber-500/10 dark:bg-amber-500/15",
    border: "border-amber-500/20",
  },
  overdue_alert: {
    icon: AlertTriangle,
    label: "Overdue Alert",
    color: "text-rose-500",
    bg: "bg-rose-500/10 dark:bg-rose-500/15",
    border: "border-rose-500/20",
  },
  target_update: {
    icon: Target,
    label: "Target Update",
    color: "text-indigo-500",
    bg: "bg-indigo-500/10 dark:bg-indigo-500/15",
    border: "border-indigo-500/20",
  },
};

function getTypeConfig(type: NotificationType) {
  return (
    TYPE_CONFIG[type] ?? {
      icon: Bell,
      label: "General",
      color: "text-foreground",
      bg: "bg-muted",
      border: "border-border",
    }
  );
}

export default function NotificationsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "unread" | "read">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: notifications = [], isLoading } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadNotificationCount();

  const markReadMutation = useMarkNotificationAsRead();
  const markAllReadMutation = useMarkAllNotificationsAsRead();
  const deleteMutation = useDeleteNotification();

  const handleMarkAllRead = async () => {
    try {
      await markAllReadMutation.mutateAsync();
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  const handleToggleRead = async (item: Notification) => {
    if (item.n.isRead) return;
    try {
      await markReadMutation.mutateAsync(item.n.id);
    } catch {
      toast.error("Failed to update notification");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Notification deleted");
    } catch {
      toast.error("Failed to delete notification");
    }
  };

  // Filtered notification list
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      // Status filter
      if (statusFilter === "unread" && item.n.isRead) return false;
      if (statusFilter === "read" && !item.n.isRead) return false;

      // Type filter
      if (typeFilter !== "all" && item.n.type !== typeFilter) return false;

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const titleMatch = item.n.title.toLowerCase().includes(q);
        const msgMatch = item.n.message.toLowerCase().includes(q);
        const taskMatch = item.relatedTask?.title?.toLowerCase().includes(q);
        if (!titleMatch && !msgMatch && !taskMatch) return false;
      }

      return true;
    });
  }, [notifications, statusFilter, typeFilter, search]);

  // Metric stats
  const totalCount = notifications.length;
  const taskUpdatesCount = notifications.filter(
    (n) => n.n.type === "task_assigned" || n.n.type === "task_completed"
  ).length;
  const alertsCount = notifications.filter(
    (n) => n.n.type === "deadline_warning" || n.n.type === "overdue_alert"
  ).length;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Bell className="size-5 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Stay updated with task assignments, deadlines, mentions, and team activities
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markAllReadMutation.isPending}
            className="gap-1.5 self-start sm:self-auto"
          >
            <CheckCheck className="size-4" />
            <span>Mark all as read</span>
          </Button>
        )}
      </motion.div>

      {/* ── Summary Stats Pills ─────────────────────────────── */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Notifications</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{totalCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Unread</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-primary">{unreadCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Task Updates</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-blue-500">{taskUpdatesCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Alerts & Warnings</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-rose-500">{alertsCount}</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Filter & Search Bar ──────────────────────────────── */}
      <motion.div variants={itemVariants} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 rounded-xl border bg-muted/40 p-1">
          {(["all", "unread", "read"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`relative rounded-lg px-3 py-1 text-xs font-medium capitalize transition-colors ${
                statusFilter === s
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s}
              {s === "unread" && unreadCount > 0 && (
                <span className="ml-1.5 rounded-full bg-primary/20 px-1 py-0.2 text-[10px] font-bold text-primary">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search & Type filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-60">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search notifications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9 text-xs"
            />
          </div>

          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v ?? "all")}
          >
            <SelectTrigger className="h-9 w-40 text-xs">
              <Filter className="mr-1.5 size-3.5 text-muted-foreground" />
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" label="All Types">All Types</SelectItem>
              <SelectItem value="task_assigned" label="Task Assigned">Task Assigned</SelectItem>
              <SelectItem value="task_completed" label="Task Completed">Task Completed</SelectItem>
              <SelectItem value="comment_added" label="Comments">Comments</SelectItem>
              <SelectItem value="deadline_warning" label="Deadline Warning">Deadline Warning</SelectItem>
              <SelectItem value="overdue_alert" label="Overdue Alert">Overdue Alert</SelectItem>
              <SelectItem value="target_update" label="Target Updates">Target Updates</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* ── Notification List ────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="divide-y">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-4 p-4">
                    <Skeleton className="size-10 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3.5 w-3/4" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredNotifications.length > 0 ? (
              <div className="divide-y divide-border/40">
                <AnimatePresence initial={false}>
                  {filteredNotifications.map((item) => {
                    const cfg = getTypeConfig(item.n.type);
                    const Icon = cfg.icon;
                    const isUnread = !item.n.isRead;

                    return (
                      <motion.div
                        key={item.n.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                        transition={{ duration: 0.2 }}
                        className={`group flex flex-col gap-3 p-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-start sm:gap-4 ${
                          isUnread ? "bg-primary/5 dark:bg-primary/10" : ""
                        }`}
                      >
                        {/* Type Icon */}
                        <div
                          className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${cfg.bg} ${cfg.border} ${cfg.color}`}
                        >
                          <Icon className="size-5" />
                        </div>

                        {/* Text details */}
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3
                              className={`text-sm font-medium ${
                                isUnread ? "font-semibold text-foreground" : "text-muted-foreground"
                              }`}
                            >
                              {item.n.title}
                            </h3>
                            <Badge variant="outline" className={`text-[10px] py-0 ${cfg.color} border-current/20`}>
                              {cfg.label}
                            </Badge>
                            {isUnread && (
                              <span className="size-2 rounded-full bg-primary animate-pulse" />
                            )}
                            <span className="ml-auto text-xs text-muted-foreground">
                              {formatRelativeTime(item.n.createdAt)}
                            </span>
                          </div>

                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {item.n.message}
                          </p>

                          {/* Related Task tag */}
                          {item.relatedTask && (
                            <div className="pt-1">
                              <span className="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-0.5 text-xs text-foreground/80">
                                <ClipboardList className="size-3 text-muted-foreground" />
                                <span className="font-medium">{item.relatedTask.title}</span>
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex shrink-0 items-center gap-1 self-end sm:self-center">
                          {isUnread && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleRead(item)}
                              title="Mark as read"
                              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                            >
                              <Check className="mr-1 size-3.5" />
                              <span>Read</span>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item.n.id)}
                            title="Delete"
                            className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/50 mb-3">
                  <Inbox className="size-7 text-muted-foreground" />
                </div>
                <h3 className="text-base font-semibold">No notifications found</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  {search || statusFilter !== "all" || typeFilter !== "all"
                    ? "Try adjusting your filters or search keywords"
                    : "You are all caught up with all tasks and notifications"}
                </p>
                {(search || statusFilter !== "all" || typeFilter !== "all") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearch("");
                      setStatusFilter("all");
                      setTypeFilter("all");
                    }}
                    className="mt-4 text-xs"
                  >
                    Reset filters
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
