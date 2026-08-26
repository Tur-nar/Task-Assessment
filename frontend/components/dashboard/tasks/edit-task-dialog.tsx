"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  CalendarIcon,
  Plus,
  Trash2,
  CheckSquare,
  Link2,
  X,
  Check,
  Circle,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useUpdateTask,
  useTask,
  useTasks,
  useSubtasks,
  useAddSubtask,
  useToggleSubtask,
  useDeleteSubtask,
  useAddTaskDependency,
  useRemoveTaskDependency,
} from "@/hooks/use-tasks";
import { useUsers, useDepartments } from "@/hooks/use-users";
import type { TaskWithRelations, TaskPriority, TaskStatus } from "@/types/api";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  assignedToId: z.string().min(1, "Assignee is required"),
  departmentId: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"] as const),
  deadline: z.string().min(1, "Deadline is required"),
});

type FormValues = z.infer<typeof schema>;

interface EditTaskDialogProps {
  task: TaskWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTaskDialog({ task, open, onOpenChange }: EditTaskDialogProps) {
  const taskId = task?.t.id ?? null;
  const updateTask = useUpdateTask();
  const { data: taskDetail } = useTask(taskId);
  const { data: users } = useUsers();
  const { data: departments } = useDepartments();
  const { data: allTasks } = useTasks();

  // Subtask hooks
  const { data: subtasks, isLoading: isLoadingSubtasks } = useSubtasks(taskId);
  const addSubtask = useAddSubtask();
  const toggleSubtask = useToggleSubtask();
  const deleteSubtask = useDeleteSubtask();

  // Dependency hooks
  const addDependency = useAddTaskDependency();
  const removeDependency = useRemoveTaskDependency();

  const [newSubtaskInput, setNewSubtaskInput] = useState("");

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (task && open) {
      const deadlineValue = task.t.deadline
        ? format(new Date(task.t.deadline), "yyyy-MM-dd'T'HH:mm")
        : "";
      reset({
        title: task.t.title,
        description: task.t.description ?? "",
        assignedToId: task.assignee?.id ?? "",
        departmentId: task.d?.id ?? "",
        priority: task.t.priority,
        deadline: deadlineValue,
      });
      setNewSubtaskInput("");
    }
  }, [task, open, reset]);

  const handleAddSubtask = async () => {
    if (!taskId || !newSubtaskInput.trim()) return;
    const title = newSubtaskInput.trim();
    try {
      await addSubtask.mutateAsync({
        taskId,
        payload: { title, order: (subtasks?.length ?? 0) },
      });
      setNewSubtaskInput("");
      toast.success("Subtask added");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to add subtask");
    }
  };

  const handleToggleSubtask = async (subtaskId: string, isCompleted: boolean) => {
    if (!taskId) return;
    try {
      await toggleSubtask.mutateAsync({
        subtaskId,
        isCompleted,
        taskId,
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update subtask");
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!taskId) return;
    try {
      await deleteSubtask.mutateAsync({
        subtaskId,
        taskId,
      });
      toast.success("Subtask removed");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete subtask");
    }
  };

  const handleAddDependency = async (dependsOnTaskId: string) => {
    if (!taskId || !dependsOnTaskId) return;
    try {
      await addDependency.mutateAsync({
        taskId,
        dependsOnTaskId,
      });
      toast.success("Prerequisite dependency added");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to add dependency");
    }
  };

  const handleRemoveDependency = async (dependsOnTaskId: string) => {
    if (!taskId || !dependsOnTaskId) return;
    try {
      await removeDependency.mutateAsync({
        taskId,
        dependsOnTaskId,
      });
      toast.success("Dependency removed");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to remove dependency");
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (!task) return;
    try {
      await updateTask.mutateAsync({
        id: task.t.id,
        payload: {
          title: data.title,
          description: data.description,
          assignedToId: data.assignedToId,
          departmentId: data.departmentId === "none" ? undefined : data.departmentId || undefined,
          priority: data.priority,
          deadline: new Date(data.deadline).toISOString(),
        },
      });
      toast.success("Task updated successfully");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update task");
    }
  };

  const staffUsers =
    users?.filter(
      (u) => u.u.role === "staff" || u.u.role === "supervisor"
    ) ?? [];

  const currentDependencies = taskDetail?.dependencies ?? [];
  const currentDependencyIds = currentDependencies.map((d) => d.id);

  // Available tasks to add as dependencies (exclude current task and already added dependencies)
  const availableDependencyCandidates = (allTasks ?? []).filter(
    (item) => item.t.id !== taskId && !currentDependencyIds.includes(item.t.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-160 max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Update task details, subtask checklist, and prerequisite dependencies.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-2 space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-task-title">Title *</Label>
              <Input
                id="edit-task-title"
                placeholder="Task title"
                {...register("title")}
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-task-desc">Description</Label>
              <Textarea
                id="edit-task-desc"
                rows={2}
                placeholder="Task description..."
                className="resize-none"
                {...register("description")}
              />
            </div>

            {/* Assignee */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-assignee">Assignee *</Label>
              <Controller
                name="assignedToId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="edit-assignee" className="w-full">
                      <SelectValue placeholder="Select team member">
                        {(() => {
                          const assignedUser = staffUsers.find((d) => d.u.id === field.value);
                          return assignedUser
                            ? `${assignedUser.u.firstName} ${assignedUser.u.lastName}`
                            : "Select team member";
                        })()}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {staffUsers.map(({ u }) => (
                        <SelectItem
                          key={u.id}
                          value={u.id}
                          label={`${u.firstName} ${u.lastName} (${u.role})`}
                        >
                          {u.firstName} {u.lastName}{" "}
                          <span className="text-muted-foreground">({u.role})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.assignedToId && (
                <p className="text-xs text-destructive">
                  {errors.assignedToId.message}
                </p>
              )}
            </div>

            {/* Department + Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-dept">Department</Label>
                <Controller
                  name="departmentId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || "none"}
                      onValueChange={(v) => field.onChange(v === "none" ? "" : v)}
                    >
                      <SelectTrigger id="edit-dept" className="w-full">
                        <SelectValue placeholder="None">
                          {field.value && field.value !== "none"
                            ? departments?.find((d) => d.d.id === field.value)?.d.name
                            : "None"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" label="None">
                          None
                        </SelectItem>
                        {departments?.map(({ d }) => (
                          <SelectItem key={d.id} value={d.id} label={d.name}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-priority">Priority</Label>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="edit-priority" className="w-full">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low" label="Low">Low</SelectItem>
                        <SelectItem value="medium" label="Medium">Medium</SelectItem>
                        <SelectItem value="high" label="High">High</SelectItem>
                        <SelectItem value="urgent" label="Urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* Deadline */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-deadline">Deadline *</Label>
              <div className="relative">
                <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  id="edit-deadline"
                  type="datetime-local"
                  className="pl-9"
                  {...register("deadline")}
                />
              </div>
              {errors.deadline && (
                <p className="text-xs text-destructive">
                  {errors.deadline.message}
                </p>
              )}
            </div>

            {/* Subtask Checklist Section */}
            <div className="rounded-lg border bg-muted/20 p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <CheckSquare className="size-3.5 text-primary" />
                  Subtasks Checklist ({subtasks?.length ?? 0})
                </Label>
              </div>

              {/* Add subtask input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Type a subtask and press Add or Enter..."
                  value={newSubtaskInput}
                  onChange={(e) => setNewSubtaskInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSubtask();
                    }
                  }}
                  className="h-8 text-sm"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={handleAddSubtask}
                  disabled={!newSubtaskInput.trim() || addSubtask.isPending}
                  className="h-8 shrink-0 px-3 gap-1"
                >
                  {addSubtask.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Plus className="size-3.5" />
                  )}
                  Add
                </Button>
              </div>

              {/* Subtasks List */}
              {isLoadingSubtasks ? (
                <div className="py-3 flex items-center justify-center text-xs text-muted-foreground gap-2">
                  <Loader2 className="size-3.5 animate-spin" />
                  Loading subtasks...
                </div>
              ) : subtasks && subtasks.length > 0 ? (
                <ul className="space-y-1.5 pt-1">
                  {subtasks.map(({ s }) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between gap-2 rounded-md bg-background px-2.5 py-1.5 text-sm border shadow-xs"
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleSubtask(s.id, !s.isCompleted)}
                        className="flex items-center gap-2 min-w-0 flex-1 truncate text-left cursor-pointer group"
                      >
                        <div
                          className={`size-4.5 rounded-sm border flex items-center justify-center transition-colors shrink-0 ${
                            s.isCompleted
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-muted-foreground/40 group-hover:border-foreground"
                          }`}
                        >
                          {s.isCompleted && <Check className="size-3" />}
                        </div>
                        <span
                          className={`truncate text-sm ${
                            s.isCompleted
                              ? "line-through text-muted-foreground"
                              : "text-foreground"
                          }`}
                        >
                          {s.title}
                        </span>
                      </button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleDeleteSubtask(s.id)}
                        disabled={deleteSubtask.isPending}
                        className="text-muted-foreground hover:text-destructive shrink-0"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground pt-1">
                  No subtasks added yet.
                </p>
              )}
            </div>

            {/* Task Dependency / Prerequisites Section */}
            <div className="rounded-lg border bg-muted/20 p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Link2 className="size-3.5 text-primary" />
                  Prerequisite Dependencies ({currentDependencies.length})
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Tasks that must be completed before this task can proceed.
              </p>

              {/* Current dependencies badges */}
              {currentDependencies.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pb-1">
                  {currentDependencies.map((dep) => (
                    <Badge
                      key={dep.id}
                      variant="secondary"
                      className="gap-1 pr-1 text-xs py-1"
                    >
                      <span className="max-w-48 truncate">
                        {dep.title} ({dep.status.replace("_", " ")})
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDependency(dep.id)}
                        disabled={removeDependency.isPending}
                        className="rounded-full p-0.5 hover:bg-muted cursor-pointer"
                      >
                        <X className="size-3 text-muted-foreground hover:text-destructive" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Add Dependency Select */}
              <Select
                value=""
                onValueChange={(val) => {
                  if (val) handleAddDependency(val);
                }}
              >
                <SelectTrigger className="w-full h-8 text-sm">
                  <SelectValue placeholder="Add a prerequisite task..." />
                </SelectTrigger>
                <SelectContent>
                  {availableDependencyCandidates.length > 0 ? (
                    availableDependencyCandidates.map(({ t, assignee }) => (
                      <SelectItem
                        key={t.id}
                        value={t.id}
                        label={`${t.title} (${t.status.replace("_", " ")})`}
                      >
                        <div className="flex items-center justify-between gap-3 w-full">
                          <span className="font-medium truncate max-w-64">{t.title}</span>
                          <span className="text-[11px] text-muted-foreground shrink-0">
                            {assignee ? `${assignee.firstName} • ` : ""}
                            {t.status.replace("_", " ")}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-xs text-muted-foreground text-center">
                      No other tasks available
                    </div>
                  )}
                </SelectContent>
              </Select>

              {/* Dependent Tasks (Tasks blocked by this task) */}
              {taskDetail?.dependents && taskDetail.dependents.length > 0 && (
                <div className="pt-2 border-t mt-2">
                  <Label className="text-[11px] font-medium text-muted-foreground block mb-1">
                    Tasks waiting on this task ({taskDetail.dependents.length}):
                  </Label>
                  <div className="flex flex-wrap gap-1">
                    {taskDetail.dependents.map((dep) => (
                      <Badge
                        key={dep.id}
                        variant="outline"
                        className="text-[11px] py-0.5 text-muted-foreground"
                      >
                        {dep.title} ({dep.status.replace("_", " ")})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t bg-background shrink-0">
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || updateTask.isPending}>
              {(isSubmitting || updateTask.isPending) && (
                <Loader2 className="mr-2 size-3.5 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
