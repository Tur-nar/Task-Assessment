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
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

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
import { useCreateTask, useTasks } from "@/hooks/use-tasks";
import { useUsers, useDepartments } from "@/hooks/use-users";
import { addSubtask } from "@/lib/api/tasks";
import { taskKeys } from "@/constants/query-keys";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  assignedToId: z.string().min(1, "Assignee is required"),
  departmentId: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"] as const),
  deadline: z.string().min(1, "Deadline is required"),
});

type FormValues = z.infer<typeof schema>;

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTaskDialog({ open, onOpenChange }: CreateTaskDialogProps) {
  const queryClient = useQueryClient();
  const createTask = useCreateTask();
  const { data: users } = useUsers();
  const { data: departments } = useDepartments();
  const { data: existingTasks } = useTasks();

  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [subtaskInput, setSubtaskInput] = useState("");
  const [selectedDepIds, setSelectedDepIds] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      priority: "medium",
    },
  });

  useEffect(() => {
    if (!open) {
      reset();
      setSubtasks([]);
      setSubtaskInput("");
      setSelectedDepIds([]);
    }
  }, [open, reset]);

  const handleAddSubtask = () => {
    const trimmed = subtaskInput.trim();
    if (!trimmed) return;
    setSubtasks((prev) => [...prev, trimmed]);
    setSubtaskInput("");
  };

  const handleRemoveSubtask = (index: number) => {
    setSubtasks((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleDependency = (taskId: string) => {
    setSelectedDepIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const onSubmit = async (data: FormValues) => {
    try {
      const toastId = toast.loading("Creating task and setting up dependencies...");

      // 1. Create the primary task
      const res = await createTask.mutateAsync({
        title: data.title,
        description: data.description,
        assignedToId: data.assignedToId,
        departmentId: data.departmentId || undefined,
        priority: data.priority,
        deadline: new Date(data.deadline).toISOString(),
        dependsOnTaskIds: selectedDepIds.length > 0 ? selectedDepIds : undefined,
      });

      const newTaskId = (res as any)?.data?.id || (res as any)?.id;

      // 2. Create initial subtasks if any
      if (newTaskId && subtasks.length > 0) {
        await Promise.all(
          subtasks.map((title, order) =>
            addSubtask(newTaskId, { title, order })
          )
        );
        queryClient.invalidateQueries({ queryKey: taskKeys.subtasks(newTaskId) });
      }

      toast.dismiss(toastId);
      toast.success(
        subtasks.length > 0
          ? `Task created with ${subtasks.length} subtask${subtasks.length > 1 ? "s" : ""}`
          : "Task created successfully"
      );
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create task");
    }
  };

  const staffUsers =
    users?.filter(
      (u) => u.u.role === "staff" || u.u.role === "supervisor"
    ) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-160 max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>Create Task</DialogTitle>
          <DialogDescription>
            Assign a new task to a team member with priority, subtasks, and dependencies.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-2 space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="task-title">Title *</Label>
              <Input
                id="task-title"
                placeholder="e.g. Design and implement API authentication"
                {...register("title")}
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="task-desc">Description</Label>
              <Textarea
                id="task-desc"
                placeholder="Optional details about this task…"
                rows={2}
                className="resize-none"
                {...register("description")}
              />
            </div>

            {/* Assignee */}
            <div className="space-y-1.5">
              <Label htmlFor="task-assignee">Assignee *</Label>
              <Controller
                name="assignedToId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="task-assignee" className="w-full">
                      <SelectValue placeholder="Select team member">
                        {staffUsers?.find((d) => d.u.id === field.value)?.u.firstName + " " + staffUsers.find((d) => d.u.id === field.value)?.u.lastName}
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

            {/* Department + Priority in a row */}
            <div className="grid grid-cols-2 gap-3">
              {/* <div className="space-y-1.5">
                <Label htmlFor="task-dept">Department</Label>
                <Controller
                  name="departmentId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value ?? ""}
                      onValueChange={(v) => field.onChange(v === "none" ? "" : v)}
                    >
                      <SelectTrigger id="task-dept" className="w-full">
                        <SelectValue placeholder="None">
                          {departments?.find((d) => d.d.id === field.value)?.d.name}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" label="None">None</SelectItem>
                        {departments?.map(({ d }) => (
                          <SelectItem key={d.id} value={d.id} label={d.name}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div> */}

              <div className="space-y-1.5">
                <Label htmlFor="task-priority">Priority</Label>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="task-priority" className="w-full">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low" label="Low">Low</SelectItem>
                        <SelectItem value="medium" label="Medium">Medium</SelectItem>
                        <SelectItem value="high" label="High">High</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="task-deadline">Deadline *</Label>
                <div className="relative">
                  <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input
                    id="task-deadline"
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
            </div>

            {/* Subtask Checklist Creation */}
            <div className="rounded-lg border bg-muted/20 p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <CheckSquare className="size-3.5 text-primary" />
                  Subtasks Checklist ({subtasks.length})
                </Label>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Type a subtask and press Add or Enter..."
                  value={subtaskInput}
                  onChange={(e) => setSubtaskInput(e.target.value)}
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
                  disabled={!subtaskInput.trim()}
                  className="h-8 shrink-0 px-3"
                >
                  <Plus className="size-3.5 mr-1" />
                  Add
                </Button>
              </div>

              {subtasks.length > 0 && (
                <ul className="space-y-1.5 pt-1">
                  {subtasks.map((st, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between gap-2 rounded-md bg-background px-2.5 py-1.5 text-sm border shadow-xs"
                    >
                      <span className="flex items-center gap-2 min-w-0 flex-1 truncate">
                        <span className="size-4.5 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold text-muted-foreground shrink-0">
                          {index + 1}
                        </span>
                        <span className="truncate">{st}</span>
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleRemoveSubtask(index)}
                        className="text-muted-foreground hover:text-destructive shrink-0"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-lg border bg-muted/20 p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Link2 className="size-3.5 text-primary" />
                  Prerequisite Dependencies ({selectedDepIds.length})
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Select tasks that must be completed before this task can be started.
              </p>

              {selectedDepIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pb-1">
                  {selectedDepIds.map((depId) => {
                    const t = existingTasks?.find((item) => item.t.id === depId);
                    return (
                      <Badge
                        key={depId}
                        variant="secondary"
                        className="gap-1 pr-1 text-xs py-1"
                      >
                        <span className="max-w-48 truncate">{t?.t.title || depId}</span>
                        <button
                          type="button"
                          onClick={() => toggleDependency(depId)}
                          className="rounded-full p-0.5 hover:bg-muted cursor-pointer"
                        >
                          <X className="size-3 text-muted-foreground" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}

              <Select
                value=""
                onValueChange={(val) => {
                  if (val && !selectedDepIds.includes(val)) {
                    setSelectedDepIds((prev) => [...prev, val]);
                  }
                }}
              >
                <SelectTrigger className="w-full h-8 text-sm">
                  <SelectValue placeholder="Add a prerequisite task..." />
                </SelectTrigger>
                <SelectContent>
                  {existingTasks && existingTasks.length > 0 ? (
                    existingTasks
                      .filter((t) => !selectedDepIds.includes(t.t.id))
                      .map(({ t, assignee }) => (
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
            </div>
          </div>

          <DialogFooter className="px-6 shrink-0">
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || createTask.isPending}>
              {(isSubmitting || createTask.isPending) && (
                <Loader2 className="mr-2 size-3.5 animate-spin" />
              )}
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
