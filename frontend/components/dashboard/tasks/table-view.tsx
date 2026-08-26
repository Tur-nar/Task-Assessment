"use client";

import { useState } from "react";
import { motion, type Variants, AnimatePresence } from "framer-motion";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Calendar,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { format, isPast } from "date-fns";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PRIORITY_CONFIG, STATUS_CONFIG } from "./task-card";
import { useCurrentUser } from "@/hooks/use-auth";
import { useUpdateTaskStatus } from "@/hooks/use-tasks";
import type { TaskWithRelations, TaskStatus } from "@/types/api";

const rowVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
  exit: { opacity: 0, x: -10, transition: { duration: 0.2 } },
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

type SortKey = "deadline" | "priority" | "status" | "title";
const PRIORITY_ORDER: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

interface TableViewProps {
  tasks: TaskWithRelations[];
  onView: (task: TaskWithRelations) => void;
  onEdit: (task: TaskWithRelations) => void;
  onDelete: (task: TaskWithRelations) => void;
}

export function TableView({ tasks, onView, onEdit, onDelete }: TableViewProps) {
  const [sortKey, setSortKey] = useState<SortKey>("deadline");
  const [sortAsc, setSortAsc] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const { data: currentUser } = useCurrentUser();
  const updateStatus = useUpdateTaskStatus();

  const role = currentUser?.role;
  const canEdit = role === "super_admin" || role === "admin" || role === "supervisor";
  const canDelete = role === "super_admin" || role === "admin";

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((a) => !a);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    setUpdatingTaskId(taskId);
    updateStatus.mutate(
      { id: taskId, status: newStatus },
      {
        onSuccess: () => {
          setUpdatingTaskId(null);
          toast.success(
            `Task marked as "${STATUS_CONFIG[newStatus]?.label || newStatus}"`
          );
        },
        onError: (err: any) => {
          setUpdatingTaskId(null);
          toast.error(
            err?.response?.data?.message || "Failed to update task status"
          );
        },
      }
    );
  };

  const sorted = [...tasks].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "deadline") {
      const da = a.t.deadline ? new Date(a.t.deadline).getTime() : Infinity;
      const db = b.t.deadline ? new Date(b.t.deadline).getTime() : Infinity;
      cmp = da - db;
    } else if (sortKey === "priority") {
      cmp = (PRIORITY_ORDER[a.t.priority] ?? 9) - (PRIORITY_ORDER[b.t.priority] ?? 9);
    } else if (sortKey === "status") {
      cmp = a.t.status.localeCompare(b.t.status);
    } else if (sortKey === "title") {
      cmp = a.t.title.localeCompare(b.t.title);
    }
    return sortAsc ? cmp : -cmp;
  });

  return (
    <div className="rounded-xl border overflow-hidden bg-card">
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_44px] items-center gap-3 border-b bg-muted/40 px-4 py-2.5 text-xs font-medium text-muted-foreground">
        <button
          onClick={() => handleSort("title")}
          className="flex items-center gap-1 text-left hover:text-foreground transition-colors"
        >
          Task
          <ArrowUpDown className="size-3" />
        </button>
        <button
          onClick={() => handleSort("status")}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          Status <ArrowUpDown className="size-3" />
        </button>
        <button
          onClick={() => handleSort("priority")}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          Priority <ArrowUpDown className="size-3" />
        </button>
        <span>Assignee</span>
        <button
          onClick={() => handleSort("deadline")}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          Deadline <ArrowUpDown className="size-3" />
        </button>
        <span />
      </div>

      {/* Rows */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="divide-y"
      >
        <AnimatePresence mode="popLayout">
          {sorted.map((task) => {
            const { t, assignee, d } = task;
            const status = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.not_started;
            const priority = PRIORITY_CONFIG[t.priority] ?? PRIORITY_CONFIG.medium;
            const isLate =
              t.deadline &&
              isPast(new Date(t.deadline)) &&
              !t.status.startsWith("completed");
            const initials = assignee
              ? `${assignee.firstName.charAt(0)}${assignee.lastName.charAt(0)}`.toUpperCase()
              : "??";

            const isUpdating = updatingTaskId === t.id;

            return (
              <motion.div
                key={t.id}
                variants={rowVariants}
                layout
                onClick={() => onView(task)}
                className="grid cursor-pointer grid-cols-[2fr_1fr_1fr_1fr_1fr_44px] items-center gap-3 px-4 py-3 text-xs transition-colors hover:bg-muted/30"
              >
                {/* Task title + department */}
                <div className="min-w-0">
                  <p className="truncate font-medium text-sm">{t.title}</p>
                  {d && (
                    <p className="truncate text-[10px] text-muted-foreground mt-0.5">
                      {d.name}
                    </p>
                  )}
                </div>

                {/* Status */}
                <Badge
                  variant="secondary"
                  className={`w-fit text-[10px] ${status.className}`}
                >
                  {status.label}
                </Badge>

                {/* Priority */}
                <Badge
                  variant="outline"
                  className={`w-fit text-[10px] ${priority.className}`}
                >
                  <span className={`mr-1 size-1.5 rounded-full ${priority.dot}`} />
                  {priority.label}
                </Badge>

                {/* Assignee */}
                {assignee ? (
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Avatar className="size-5 shrink-0">
                      <AvatarFallback className="bg-foreground/10 text-[9px] font-medium">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate text-[11px]">
                      {assignee.firstName} {assignee.lastName}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground/50">Unassigned</span>
                )}

                {/* Deadline */}
                {t.deadline ? (
                  <div
                    className={`flex items-center gap-1 ${isLate
                      ? "font-semibold text-red-600 dark:text-red-400"
                      : "text-muted-foreground"
                      }`}
                  >
                    <Calendar className="size-3 shrink-0" />
                    <span>{format(new Date(t.deadline), "MMM d, yyyy")}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground/40">No deadline</span>
                )}

                {/* Action menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-foreground"
                        onClick={(e) => e.stopPropagation()}
                        disabled={isUpdating}
                      />
                    }
                  >
                    {isUpdating ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <MoreHorizontal className="size-3.5" />
                    )}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onView(task);
                      }}
                    >
                      <Eye className="mr-2 size-3.5" />
                      View Details
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {t.status !== "in_progress" && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(t.id, "in_progress");
                        }}
                      >
                        <Clock className="mr-2 size-3.5 text-blue-500" />
                        Mark as In Progress
                      </DropdownMenuItem>
                    )}

                    {t.status !== "completed" && t.status !== "completed_late" && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(t.id, "completed");
                        }}
                      >
                        <CheckCircle2 className="mr-2 size-3.5 text-emerald-500" />
                        Mark as Completed
                      </DropdownMenuItem>
                    )}

                    {t.status !== "not_started" && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(t.id, "not_started");
                        }}
                      >
                        <RotateCcw className="mr-2 size-3.5 text-slate-500" />
                        Mark as Not Started
                      </DropdownMenuItem>
                    )}

                    {(canEdit || canDelete) && <DropdownMenuSeparator />}

                    {canEdit && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(task);
                        }}
                      >
                        <Pencil className="mr-2 size-3.5" />
                        Edit Task
                      </DropdownMenuItem>
                    )}

                    {canDelete && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(task);
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 size-3.5" />
                        Delete Task
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {tasks.length === 0 && (
        <div className="py-16 text-center text-sm text-muted-foreground">
          No tasks match your current filters.
        </div>
      )}
    </div>
  );
}
