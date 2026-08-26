"use client";
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, CheckCheck, Trash2, ClipboardList, CheckCircle2, MessageSquare, Clock, AlertTriangle, Target, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNotifications, useUnreadNotificationCount, useMarkNotificationAsRead, useMarkAllNotificationsAsRead, useDeleteNotification } from "@/hooks/use-notifications";
import { formatRelativeTime } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import type { Notification, NotificationType } from "@/types/api";

const TYPE_CONFIG: Record<
  NotificationType,
  {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bg: string;
    border: string;
  }
> = {
  task_assigned: {
    icon: ClipboardList,
    color: "text-blue-500",
    bg: "bg-blue-500/10 dark:bg-blue-500/15",
    border: "border-blue-500/20",
  },
  task_completed: {
    icon: CheckCircle2,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
    border: "border-emerald-500/20",
  },
  comment_added: {
    icon: MessageSquare,
    color: "text-purple-500",
    bg: "bg-purple-500/10 dark:bg-purple-500/15",
    border: "border-purple-500/20",
  },
  deadline_warning: {
    icon: Clock,
    color: "text-amber-500",
    bg: "bg-amber-500/10 dark:bg-amber-500/15",
    border: "border-amber-500/20",
  },
  overdue_alert: {
    icon: AlertTriangle,
    color: "text-rose-500",
    bg: "bg-rose-500/10 dark:bg-rose-500/15",
    border: "border-rose-500/20",
  },
  target_update: {
    icon: Target,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10 dark:bg-indigo-500/15",
    border: "border-indigo-500/20",
  },
};

function getNotificationConfig(type: NotificationType) {
  return (
    TYPE_CONFIG[type] ?? {
      icon: Bell,
      color: "text-foreground",
      bg: "bg-muted",
      border: "border-border",
    }
  );
}

export function NotificationPopover() {
  const [open, setOpen] = useState(false);

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

  const handleMarkRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markReadMutation.mutateAsync(id);
    } catch {
      toast.error("Failed to update notification");
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Notification removed");
    } catch {
      toast.error("Failed to remove notification");
    }
  };

  const recentNotifications = notifications.slice(0, 6);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative size-9 rounded-full transition-transform active:scale-95"
            aria-label="Notifications"
          />
        }
      >
        <Bell className="size-4" />
        <AnimatePresence>
          {typeof unreadCount === "number" && unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-96 p-0 border-border/60 bg-card/95 backdrop-blur-lg"
      >
        <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">Notifications</span>
            {unreadCount > 0 && (
              <Badge
                variant="secondary"
                className="h-5 px-1.5 text-[10px] font-bold bg-primary/10 text-primary border-0"
              >
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markAllReadMutation.isPending}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <CheckCheck className="mr-1 size-3.5" />
              Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-95 overflow-y-auto divide-y divide-border/20">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="size-8 rounded-full bg-muted/60 animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-3/4 rounded bg-muted/60 animate-pulse" />
                    <div className="h-3 w-1/2 rounded bg-muted/40 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentNotifications.length > 0 ? (
            <AnimatePresence initial={false}>
              {recentNotifications.map((item: Notification) => {
                const cfg = getNotificationConfig(item.n.type);
                const Icon = cfg.icon;
                const isUnread = !item.n.isRead;

                return (
                  <motion.div
                    key={item.n.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`group relative flex gap-3 p-3.5 transition-colors hover:bg-muted/40 ${isUnread ? "bg-primary/5 dark:bg-primary/10" : ""
                      }`}
                  >
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-xl border ${cfg.bg} ${cfg.border} ${cfg.color}`}
                    >
                      <Icon className="size-4" />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-1.5">
                        <p
                          className={`text-xs font-semibold leading-snug truncate ${isUnread ? "text-foreground" : "text-muted-foreground"
                            }`}
                        >
                          {item.n.title}
                        </p>
                        {isUnread && (
                          <span className="size-2 shrink-0 rounded-full bg-primary animate-pulse" />
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {item.n.message}
                      </p>

                      <div className="flex items-center gap-2 pt-0.5 text-[10px] text-muted-foreground/80">
                        {item.relatedTask && (
                          <span className="truncate rounded-md bg-muted px-1.5 py-0.5 font-medium text-foreground/80">
                            {item.relatedTask.title}
                          </span>
                        )}
                        <span>{formatRelativeTime(item.n.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-center justify-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      {isUnread && (
                        <button
                          onClick={(e) => handleMarkRead(item.n.id, e)}
                          title="Mark as read"
                          className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <Check className="size-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDelete(item.n.id, e)}
                        title="Delete"
                        className="rounded-lg p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl mb-2">
                <Bell className="size-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">All caught up!</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                No notifications right now
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-border/40 bg-muted/10 p-2 text-center">
          <Link
            href={ROUTES.dashboard.notifications}
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
          >
            <span>View all notifications</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
