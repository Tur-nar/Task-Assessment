"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import {
  Calendar,
  User2,
  GripVertical,
  CheckSquare,
  AlertTriangle,
} from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { TaskWithRelations, TaskPriority, TaskStatus } from "@/types/api";

export const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; className: string; dot: string }
> = {
  low: {
    label: "Low",
    className: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
    dot: "bg-slate-500",
  },
  medium: {
    label: "Medium",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    dot: "bg-amber-500",
  },
  high: {
    label: "High",
    className: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    dot: "bg-rose-500",
  },
  urgent: {
    label: "Urgent",
    className: "bg-red-600/10 text-red-700 dark:text-red-400 border-red-600/20",
    dot: "bg-red-600",
  },
};

export const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; className: string }
> = {
  not_started: {
    label: "Not Started",
    className: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  completed_late: {
    label: "Late",
    className: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
  overdue: {
    label: "Overdue",
    className: "bg-red-600/10 text-red-700 dark:text-red-400",
  },
};

interface TaskCardProps {
  task: TaskWithRelations;
  onView: (task: TaskWithRelations) => void;
  isDragOverlay?: boolean;
}

export function TaskCard({ task, onView, isDragOverlay = false }: TaskCardProps) {
  const { t, assignee } = task;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: t.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const priority = PRIORITY_CONFIG[t.priority] ?? PRIORITY_CONFIG.medium;
  const isDeadlineClose =
    t.deadline &&
    (isPast(new Date(t.deadline)) || isToday(new Date(t.deadline)));
  const isOverdue = t.status === "overdue";

  const initials = assignee
    ? `${assignee.firstName.charAt(0)}${assignee.lastName.charAt(0)}`.toUpperCase()
    : "??";

  return (
    <div ref={setNodeRef} style={style}>
      <motion.div
        layout
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileHover={{ y: -2, boxShadow: "0 4px 16px 0 rgba(0,0,0,0.10)" }}
        transition={{ duration: 0.22 }}
        onClick={() => onView(task)}
        className={`group relative cursor-pointer rounded-xl border bg-card p-3.5 text-card-foreground transition-colors hover:border-foreground/20 ${isDragOverlay ? "shadow-xl ring-2 ring-foreground/20" : ""
          } ${isOverdue ? "border-red-500/30 bg-red-500/3" : ""}`}
      >
        {/* Grip handle */}
        <div
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="absolute right-2 top-2 hidden cursor-grab touch-none text-muted-foreground/40 group-hover:flex active:cursor-grabbing"
        >
          <GripVertical className="size-3.5" />
        </div>

        {/* Priority dot + title */}
        <div className="mb-2 flex items-start gap-2 pr-4">
          <div className={`mt-1.5 size-1.5 shrink-0 rounded-full ${priority.dot}`} />
          <p className="line-clamp-2 text-xs font-medium leading-snug">{t.title}</p>
        </div>

        {/* Priority badge */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          <Badge variant="outline" className={`text-[10px] ${priority.className}`}>
            {priority.label}
          </Badge>
          {isOverdue && (
            <Badge variant="outline" className="gap-0.5 text-[10px] border-red-500/30 bg-red-500/8 text-red-600 dark:text-red-400">
              <AlertTriangle className="size-2.5" />
              Overdue
            </Badge>
          )}
        </div>

        {/* Footer: assignee + deadline */}
        <div className="flex items-center justify-between">
          {assignee ? (
            <div className="flex items-center gap-1.5">
              <Avatar className="size-5">
                <AvatarFallback className="bg-foreground/10 text-[9px] font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="max-w-22.5 truncate text-[10px] text-muted-foreground">
                {assignee.firstName} {assignee.lastName}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
              <User2 className="size-3" />
              <span>Unassigned</span>
            </div>
          )}

          {t.deadline && (
            <div
              className={`flex items-center gap-0.5 text-[10px] ${isDeadlineClose && !t.status.startsWith("completed")
                  ? "font-medium text-red-600 dark:text-red-400"
                  : "text-muted-foreground"
                }`}
            >
              <Calendar className="size-2.5" />
              <span>{format(new Date(t.deadline), "MMM d")}</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
