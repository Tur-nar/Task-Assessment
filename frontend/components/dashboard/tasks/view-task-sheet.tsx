"use client";
import { useState } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Calendar, User2, Building2, Plus, Trash2, Loader2, Send, AlertTriangle, RefreshCw, Link2, CheckCircle2, AlertCircle,
  ArrowRight, ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { PRIORITY_CONFIG, STATUS_CONFIG } from "./task-card";
import {
  useTask, useTasks, useSubtasks, useAddSubtask, useToggleSubtask, useDeleteSubtask, useTaskComments, useAddComment,
  useDeleteComment, useUpdateTaskStatus, useAddTaskDependency, useRemoveTaskDependency,
} from "@/hooks/use-tasks";
import { useCurrentUser } from "@/hooks/use-auth";
import type { TaskWithRelations, TaskStatus } from "@/types/api";

function safeFormatDistance(rawDate?: any): string {
  if (!rawDate) return "";
  try {
    let dateStr = rawDate;
    if (typeof rawDate === "object" && rawDate !== null) {
      if (typeof rawDate.formatted === "string") {
        dateStr = rawDate.formatted;
      } else if (rawDate.year && rawDate.month && rawDate.day) {
        const y = rawDate.year.low ?? rawDate.year;
        const m = String(rawDate.month.low ?? rawDate.month).padStart(2, "0");
        const d = String(rawDate.day.low ?? rawDate.day).padStart(2, "0");
        const h = String(rawDate.hour?.low ?? rawDate.hour ?? 0).padStart(2, "0");
        const min = String(rawDate.minute?.low ?? rawDate.minute ?? 0).padStart(2, "0");
        const s = String(rawDate.second?.low ?? rawDate.second ?? 0).padStart(2, "0");
        dateStr = `${y}-${m}-${d}T${h}:${min}:${s}`;
      } else if (typeof rawDate.toString === "function" && rawDate.toString() !== "[object Object]") {
        dateStr = rawDate.toString();
      }
    }
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) return "";
    return formatDistanceToNow(parsed, { addSuffix: true });
  } catch {
    return "";
  }
}

interface ViewTaskSheetProps {
  task: TaskWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (task: TaskWithRelations) => void;
}

const ALLOWED_STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  not_started: ["in_progress"],
  in_progress: ["completed"],
  completed: [],
  completed_late: [],
  overdue: ["completed_late"],
};

export function ViewTaskSheet({ task, open, onOpenChange, onEdit }: ViewTaskSheetProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const Content = isDesktop ? DesktopSheet : MobileDrawer;

  return (
    <Content
      task={task}
      open={open}
      onOpenChange={onOpenChange}
      onEdit={onEdit}
    />
  );
}

function DesktopSheet({ task, open, onOpenChange, onEdit }: ViewTaskSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-full max-w-140 overflow-y-auto p-0"
        side="right"
      >
        <TaskDetailContent task={task} onClose={() => onOpenChange(false)} onEdit={onEdit} />
      </SheetContent>
    </Sheet>
  );
}

function MobileDrawer({ task, open, onOpenChange, onEdit }: ViewTaskSheetProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92dvh]">
        <div className="overflow-y-auto">
          <TaskDetailContent task={task} onClose={() => onOpenChange(false)} onEdit={onEdit} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function TaskDetailContent({
  task,
  onClose,
  onEdit,
}: {
  task: TaskWithRelations | null;
  onClose: () => void;
  onEdit: (task: TaskWithRelations) => void;
}) {
  const { data: detail, isLoading: detailLoading } = useTask(task?.t.id ?? null);
  const { data: allTasks } = useTasks();
  const { data: subtasks, isLoading: subtasksLoading } = useSubtasks(task?.t.id ?? null);
  const { data: comments, isLoading: commentsLoading } = useTaskComments(task?.t.id ?? null);
  const { data: currentUser } = useCurrentUser();

  const addSubtask = useAddSubtask();
  const toggleSubtask = useToggleSubtask();
  const deleteSubtask = useDeleteSubtask();
  const addComment = useAddComment();
  const deleteComment = useDeleteComment();
  const updateStatus = useUpdateTaskStatus();
  const addDependency = useAddTaskDependency();
  const removeDependency = useRemoveTaskDependency();

  const [newSubtask, setNewSubtask] = useState("");
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [selectedDepToAdd, setSelectedDepToAdd] = useState("");

  if (!task) return null;

  const canManage =
    currentUser?.role === "super_admin" ||
    currentUser?.role === "admin" ||
    currentUser?.role === "supervisor";

  const { t, assignee, assigner, d } = task;
  const priority = PRIORITY_CONFIG[t.priority] ?? PRIORITY_CONFIG.medium;
  const status = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.not_started;
  const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[t.status] ?? [];
  const isOverdue = t.status === "overdue";
  const isDeadlinePast = t.deadline && isPast(new Date(t.deadline));

  const completedSubtasks = subtasks?.filter((s) => s.s.isCompleted).length ?? 0;
  const totalSubtasks = subtasks?.length ?? 0;
  const subtaskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  const dependencies = detail?.dependencies ?? [];
  const dependents = detail?.dependents ?? [];
  const isReady = detail?.ready ?? true;

  const handleAddSubtask = async () => {
    if (!newSubtask.trim() || !task) return;
    try {
      await addSubtask.mutateAsync({
        taskId: task.t.id,
        payload: { title: newSubtask.trim(), order: totalSubtasks },
      });
      setNewSubtask("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to add subtask");
    }
  };

  const handleToggleSubtask = async (subtaskId: string, currentVal: boolean) => {
    try {
      await toggleSubtask.mutateAsync({
        taskId: task.t.id,
        subtaskId,
        isCompleted: currentVal,
      });
      toast.success(currentVal ? "Subtask marked completed" : "Subtask marked incomplete");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update subtask");
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      await deleteSubtask.mutateAsync({
        taskId: task.t.id,
        subtaskId,
      });
      toast.success("Subtask removed");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete subtask");
    }
  };

  const handleAddDependency = async (dependsOnTaskId: string) => {
    if (!dependsOnTaskId || !task) return;
    try {
      await addDependency.mutateAsync({
        taskId: task.t.id,
        dependsOnTaskId,
      });
      toast.success("Prerequisite dependency added");
      setSelectedDepToAdd("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to add dependency");
    }
  };

  const handleRemoveDependency = async (dependsOnTaskId: string) => {
    if (!dependsOnTaskId || !task) return;
    try {
      await removeDependency.mutateAsync({
        taskId: task.t.id,
        dependsOnTaskId,
      });
      toast.success("Dependency removed");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to remove dependency");
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !task) return;
    try {
      await addComment.mutateAsync({
        taskId: task.t.id,
        payload: { content: newComment.trim() },
      });
      toast.success("Comment posted");
      setNewComment("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to post comment");
    }
  };

  const handleAddReply = async (parentCommentId: string) => {
    if (!replyText.trim() || !task) return;
    try {
      await addComment.mutateAsync({
        taskId: task.t.id,
        payload: { content: replyText.trim(), parentCommentId },
      });
      toast.success("Reply posted");
      setReplyText("");
      setReplyTo(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to post reply");
    }
  };

  const handleDeleteComment = (commentId: string) => {
    deleteComment.mutate(
      { taskId: task.t.id, commentId },
      {
        onSuccess: () => {
          toast.success("Comment deleted");
        },
        onError: (err: any) => {
          toast.error(
            err?.response?.data?.message || "Failed to delete comment"
          );
        },
      }
    );
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    try {
      await updateStatus.mutateAsync({ id: task.t.id, status: newStatus });
      toast.success(`Status updated to "${STATUS_CONFIG[newStatus]?.label}"`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Cannot update status");
    }
  };

  const initials = (first?: string, last?: string) =>
    first && last ? `${first[0]}${last[0]}`.toUpperCase() : "??";

  const potentialDependencies =
    allTasks?.filter(
      (item) =>
        item.t.id !== task.t.id &&
        !dependencies.some((d) => d.id === item.t.id)
    ) ?? [];

  return (
    <div className="flex flex-col gap-0">
      {/* Header banner */}
      <div className="relative overflow-hidden bg-linear-to-br from-foreground/5 via-foreground/3 to-transparent px-6 pb-5 pt-6">
        <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 via-transparent to-purple-500/5" />
        <div className="relative space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={`text-xs ${priority.className}`}>
              <span className={`mr-1.5 size-1.5 rounded-full ${priority.dot}`} />
              {priority.label}
            </Badge>
            <Badge variant="secondary" className={`text-xs ${status.className}`}>
              {status.label}
            </Badge>
            {isOverdue && (
              <Badge
                variant="outline"
                className="gap-1 text-xs border-red-500/30 bg-red-500/8 text-red-600 dark:text-red-400"
              >
                <AlertTriangle className="size-3" />
                Overdue
              </Badge>
            )}
          </div>
          <h2 className="text-lg font-semibold leading-snug">{t.title}</h2>
          {t.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6 px-6 py-5">
        {/* Core Metadata Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border bg-muted/20 p-3 space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Assignee
            </p>
            {assignee ? (
              <div className="flex items-center gap-2">
                <Avatar className="size-6">
                  <AvatarFallback className="bg-blue-500/10 text-[10px] text-blue-700 dark:text-blue-300 font-semibold">
                    {initials(assignee.firstName, assignee.lastName)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium truncate">
                  {assignee.firstName} {assignee.lastName}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <User2 className="size-3.5" />
                Unassigned
              </div>
            )}
          </div>

          <div className="rounded-lg border bg-muted/20 p-3 space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Assigned By
            </p>
            {assigner ? (
              <div className="flex items-center gap-2">
                <Avatar className="size-6">
                  <AvatarFallback className="bg-purple-500/10 text-[10px] text-purple-700 dark:text-purple-300 font-semibold">
                    {initials(assigner.firstName, assigner.lastName)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium truncate">
                  {assigner.firstName} {assigner.lastName}
                </span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            )}
          </div>

          {d && (
            <div className="rounded-lg border bg-muted/20 p-3 space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Department
              </p>
              <div className="flex items-center gap-1.5 text-xs font-medium truncate">
                <Building2 className="size-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">{d.name}</span>
              </div>
            </div>
          )}

          {t.deadline && (
            <div className="rounded-lg border bg-muted/20 p-3 space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Deadline
              </p>
              <div
                className={`flex items-center gap-1.5 text-xs font-medium ${isDeadlinePast && !t.status.startsWith("completed")
                  ? "text-red-600 dark:text-red-400"
                  : ""
                  }`}
              >
                <Calendar className="size-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">
                  {format(new Date(t.deadline), "MMM d, yyyy · h:mm a")}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Status Transition Quick Action */}
        {allowedTransitions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Update Status
            </p>
            <div className="flex flex-wrap gap-2">
              {allowedTransitions.map((nextStatus) => (
                <Button
                  key={nextStatus}
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  disabled={updateStatus.isPending}
                  onClick={() => handleStatusChange(nextStatus)}
                >
                  {updateStatus.isPending ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <RefreshCw className="size-3" />
                  )}
                  Mark as {STATUS_CONFIG[nextStatus]?.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Task Dependencies & Readiness Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
              <Link2 className="size-3.5 text-primary" />
              Dependencies &amp; Graph
            </p>
            {dependencies.length > 0 && (
              <Badge
                variant="outline"
                className={`text-[10px] gap-1 ${isReady
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                  }`}
              >
                {isReady ? (
                  <>
                    <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
                    Ready to Start
                  </>
                ) : (
                  <>
                    <AlertCircle className="size-3 text-amber-600 dark:text-amber-400" />
                    Blocked by Prerequisites
                  </>
                )}
              </Badge>
            )}
          </div>

          {/* Readiness Banner */}
          {dependencies.length > 0 && !isReady && (
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/8 p-3 text-xs text-amber-800 dark:text-amber-200">
              <ShieldAlert className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5 leading-relaxed">
                <p className="font-semibold">Prerequisite tasks in progress</p>
                <p className="text-muted-foreground text-[11px]">
                  This task depends on unfinished tasks below. Complete all prerequisites before proceeding.
                </p>
              </div>
            </div>
          )}

          {/* Prerequisite Tasks (Depends On) */}
          <div className="space-y-2">
            <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <span>Depends On (Prerequisites)</span>
              <span className="text-[10px] text-muted-foreground/70">
                ({dependencies.length})
              </span>
            </p>

            {dependencies.length > 0 ? (
              <div className="space-y-1.5">
                {dependencies.map((dep) => {
                  const depStatus = STATUS_CONFIG[dep.status] ?? STATUS_CONFIG.not_started;
                  const isDone = dep.status === "completed" || dep.status === "completed_late";

                  return (
                    <div
                      key={dep.id}
                      className="group flex items-center justify-between gap-2 rounded-lg border bg-muted/20 px-3 py-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {isDone ? (
                          <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <AlertCircle className="size-3.5 text-amber-500 shrink-0" />
                        )}
                        <span className={`truncate font-medium ${isDone ? "text-muted-foreground line-through" : ""}`}>
                          {dep.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="secondary" className={`text-[10px] py-0 px-1.5 ${depStatus.className}`}>
                          {depStatus.label}
                        </Badge>
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDependency(dep.id)}
                            className="hidden text-muted-foreground/40 hover:text-destructive group-hover:flex transition-colors cursor-pointer"
                            title="Remove dependency"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic pl-1">
                No prerequisite dependencies. This task can start immediately.
              </p>
            )}

            {/* Add Prerequisite selector */}
            {canManage && potentialDependencies.length > 0 && (
              <div className="pt-1">
                <Select
                  value={selectedDepToAdd}
                  onValueChange={(val) => {
                    if (val) handleAddDependency(val);
                  }}
                >
                  <SelectTrigger className="w-full h-8 text-xs">
                    <SelectValue placeholder="+ Link another prerequisite task...">
                      {potentialDependencies.find((d) => d?.t?.id === selectedDepToAdd)?.t?.title}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {potentialDependencies.map(({ t: pt, assignee: pa }) => (
                      <SelectItem
                        key={pt.id}
                        value={pt.id}
                        label={`${pt.title} (${pt.status.replace("_", " ")})`}
                      >
                        <div className="flex items-center justify-between gap-3 w-full">
                          <span className="font-medium truncate max-w-64">{pt.title}</span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {pa ? `${pa.firstName} • ` : ""}{pt.status.replace("_", " ")}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {dependents.length > 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <ArrowRight className="size-3 text-primary shrink-0" />
                <span>Blocks Downstream Tasks ({dependents.length})</span>
              </p>
              <div className="space-y-1.5">
                {dependents.map((dep) => {
                  const depStatus = STATUS_CONFIG[dep.status] ?? STATUS_CONFIG.not_started;
                  return (
                    <div
                      key={dep.id}
                      className="flex items-center justify-between gap-2 rounded-lg border bg-muted/15 px-3 py-2 text-xs"
                    >
                      <span className="truncate font-medium text-muted-foreground">
                        {dep.title}
                      </span>
                      <Badge variant="outline" className={`text-[10px] py-0 px-1.5 ${depStatus.className}`}>
                        {depStatus?.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Subtasks{" "}
              {totalSubtasks > 0 && (
                <span className="ml-1 text-foreground">
                  {completedSubtasks}/{totalSubtasks}
                </span>
              )}
            </p>
          </div>

          {totalSubtasks > 0 && (
            <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-emerald-500"
                initial={{ width: 0 }}
                animate={{ width: `${subtaskProgress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <AnimatePresence mode="popLayout">
              {subtasksLoading
                ? Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full rounded-lg" />
                ))
                : subtasks?.map(({ s }) => (
                  <motion.div
                    key={s.id}
                    layout
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 6 }}
                    className="group flex items-center gap-2.5 rounded-lg border bg-muted/20 px-3 py-2"
                  >
                    <Checkbox
                      id={`subtask-${s.id}`}
                      checked={s.isCompleted}
                      onCheckedChange={(checked) =>
                        handleToggleSubtask(s.id, checked === true)
                      }
                      className="size-3.5 shrink-0"
                    />
                    <label
                      htmlFor={`subtask-${s.id}`}
                      className={`flex-1 cursor-pointer text-xs ${s.isCompleted
                        ? "line-through text-muted-foreground"
                        : ""
                        }`}
                    >
                      {s.title}
                    </label>
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => handleDeleteSubtask(s.id)}
                        className="hidden text-muted-foreground/40 transition-colors hover:text-destructive group-hover:flex cursor-pointer"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    )}
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Add a subtask…"
              value={newSubtask}
              className="h-8 text-xs"
              onChange={(e) => setNewSubtask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
            />
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5"
              onClick={handleAddSubtask}
              disabled={!newSubtask.trim() || addSubtask.isPending}
            >
              {addSubtask.isPending ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Plus className="size-3" />
              )}
            </Button>
          </div>
        </div>

        <Separator />

        <div className="space-y-3 pb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Comments{" "}
            {comments && comments.length > 0 && (
              <span className="ml-1 text-foreground">{comments.length}</span>
            )}
          </p>

          {/* Comment list */}
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {commentsLoading
                ? Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex gap-2.5">
                    <Skeleton className="size-7 shrink-0 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-10 w-full rounded-lg" />
                    </div>
                  </div>
                ))
                : comments?.map((item) => (
                  <motion.div
                    key={item.c.id}
                    layout
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-2"
                  >
                    {/* Root comment */}
                    <div className="flex gap-2.5">
                      <Avatar className="size-7 shrink-0">
                        <AvatarFallback className="bg-foreground/10 text-[10px] font-semibold">
                          {initials(item.author.firstName, item.author.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold">
                            {item.author.firstName} {item.author.lastName}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {safeFormatDistance(item.c.createdAt)}
                          </span>
                        </div>
                        <div className="rounded-lg border bg-muted/20 px-3 py-2 text-xs leading-relaxed">
                          {item.c.content}
                        </div>
                        <div className="flex items-center gap-3 pt-0.5">
                          <button
                            type="button"
                            onClick={() =>
                              setReplyTo(
                                replyTo === item.c.id ? null : item.c.id
                              )
                            }
                            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          >
                            Reply
                          </button>
                          {(canManage || currentUser?.id === item.author.id) && (
                            <button
                              type="button"
                              onClick={() => handleDeleteComment(item.c.id)}
                              className="text-[10px] text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                            >
                              Delete
                            </button>
                          )}
                        </div>

                        {/* Reply input */}
                        <AnimatePresence>
                          {replyTo === item.c.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="flex gap-2 overflow-hidden pt-1"
                            >
                              <Input
                                placeholder={`Reply to ${item.author.firstName}…`}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                className="h-7 text-xs"
                                onKeyDown={(e) =>
                                  e.key === "Enter" &&
                                  handleAddReply(item.c.id)
                                }
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0"
                                onClick={() => handleAddReply(item.c.id)}
                                disabled={
                                  !replyText.trim() || addComment.isPending
                                }
                              >
                                <Send className="size-3" />
                              </Button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Threaded replies */}
                    {item.replies && item.replies.length > 0 && (
                      <div className="ml-9 space-y-2 border-l-2 border-border pl-3">
                        {item.replies.map((reply) => (
                          <div key={reply.comment.id} className="flex gap-2">
                            <Avatar className="size-6 shrink-0">
                              <AvatarFallback className="bg-foreground/8 text-[9px] font-semibold">
                                {initials(
                                  reply.author.firstName,
                                  reply.author.lastName
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-semibold">
                                  {reply.author.firstName}{" "}
                                  {reply.author.lastName}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {safeFormatDistance(reply?.comment?.createdAt)}
                                </span>
                              </div>
                              <div className="rounded-lg border bg-muted/15 px-3 py-2 text-xs leading-relaxed">
                                {reply.comment.content}
                              </div>
                              {(canManage || currentUser?.id === reply.author.id) && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteComment(reply.comment.id)
                                  }
                                  className="text-[10px] text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>

          <div className="flex gap-2 pt-1">
            <Input
              placeholder="Add a comment…"
              value={newComment}
              className="h-8 text-xs"
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handleAddComment}
              disabled={!newComment.trim() || addComment.isPending}
            >
              {addComment.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
