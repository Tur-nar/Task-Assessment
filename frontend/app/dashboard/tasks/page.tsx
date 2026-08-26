"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Kanban, Table2, Calendar as CalendarIcon, Plus, Search, Filter, CheckCircle2, Clock, AlertTriangle, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { useCurrentUser } from "@/hooks/use-auth";
import { useTasks, useTaskStats } from "@/hooks/use-tasks";
import { KanbanBoard } from "@/components/dashboard/tasks/kanban-board";
import { TableView } from "@/components/dashboard/tasks/table-view";
import { CalendarView } from "@/components/dashboard/tasks/calendar-view";
import { CreateTaskDialog } from "@/components/dashboard/tasks/create-task-dialog";
import { EditTaskDialog } from "@/components/dashboard/tasks/edit-task-dialog";
import { ViewTaskSheet } from "@/components/dashboard/tasks/view-task-sheet";
import { DeleteTaskAlert } from "@/components/dashboard/tasks/delete-task-alert";
import type { TaskWithRelations } from "@/types/api";

type ViewMode = "kanban" | "table" | "calendar";

const VIEW_MODES: { id: ViewMode; label: string; icon: typeof Kanban }[] = [
  { id: "kanban", label: "Kanban", icon: Kanban },
  { id: "table", label: "Table", icon: Table2 },
  { id: "calendar", label: "Calendar", icon: CalendarIcon },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

export default function TasksPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [viewTask, setViewTask] = useState<TaskWithRelations | null>(null);
  const [editTask, setEditTask] = useState<TaskWithRelations | null>(null);
  const [deleteTask, setDeleteTask] = useState<TaskWithRelations | null>(null);

  const { data: currentUser } = useCurrentUser();
  const canCreate =
    currentUser?.role === "super_admin" ||
    currentUser?.role === "admin" ||
    currentUser?.role === "supervisor";

  const apiFilters = useMemo(() => {
    const f: Record<string, string> = {};
    if (statusFilter !== "all") f.status = statusFilter;
    if (priorityFilter !== "all") f.priority = priorityFilter;
    return Object.keys(f).length ? f : undefined;
  }, [statusFilter, priorityFilter]);

  const { data: tasks, isLoading } = useTasks(apiFilters);
  const { data: stats } = useTaskStats();

  const filtered = useMemo(() => {
    if (!tasks) return [];
    if (!search.trim()) return tasks;
    const q = search.toLowerCase();
    return tasks.filter(
      (t) =>
        t.t.title.toLowerCase().includes(q) ||
        t.t.description?.toLowerCase().includes(q) ||
        `${t.assignee?.firstName} ${t.assignee?.lastName}`
          .toLowerCase()
          .includes(q)
    );
  }, [tasks, search]);

  const handleViewTask = (task: TaskWithRelations) => setViewTask(task);
  const handleEditTask = (task: TaskWithRelations) => setEditTask(task);
  const handleDeleteTask = (task: TaskWithRelations) => setDeleteTask(task);

  return (
    <div className="flex flex-col gap-6 p-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-6"
      >
        <motion.div
          variants={itemVariants}
          className="flex flex-wrap items-start justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Manage and track work across your organisation
            </p>
          </div>
          {canCreate && (
            <Button
              id="create-task-btn"
              size={"sm"}
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="size-4" />
              New Task
            </Button>
          )}
        </motion.div>

        {stats && (
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-2 gap-3 sm:grid-cols-4"
          >
            {[
              {
                label: "Total",
                value: stats.total,
                icon: ListTodo,
                className: "text-foreground",
                bg: "bg-foreground/5",
              },
              {
                label: "In Progress",
                value: stats.inProgress,
                icon: Clock,
                className: "text-blue-600 dark:text-blue-400",
                bg: "bg-blue-500/8",
              },
              {
                label: "Completed",
                value: stats.completed + stats.completedLate,
                icon: CheckCircle2,
                className: "text-emerald-600 dark:text-emerald-400",
                bg: "bg-emerald-500/8",
              },
              {
                label: "Overdue",
                value: stats.overdue,
                icon: AlertTriangle,
                className: "text-red-600 dark:text-red-400",
                bg: "bg-red-500/8",
              },
            ].map(({ label, value, icon: Icon, className, bg }) => (
              <div
                key={label}
                className={`flex items-center gap-3 rounded-xl border ${bg} px-4 py-3`}
              >
                <div className={`rounded-lg bg-background p-2 shadow-sm border`}>
                  <Icon className={`size-4 ${className}`} />
                </div>
                <div>
                  <p className="text-xl font-bold leading-none">{value}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        <motion.div
          variants={itemVariants}
          className="flex flex-wrap items-center gap-3"
        >
          <div className="relative flex-1 min-w-48">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              id="task-search"
              placeholder="Search tasks…"
              className="pl-9 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter as any}>
            <SelectTrigger id="task-status-filter" className="w-36 h-9">
              <Filter className="mr-1.5 size-3 text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="not_started">Not Started</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="completed_late">Completed Late</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter as any}>
            <SelectTrigger id="task-priority-filter" className="w-32 h-9">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-0.5 rounded-lg border bg-muted/40 p-0.5 ml-auto">
            {VIEW_MODES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                id={`view-${id}-btn`}
                onClick={() => setViewMode(id)}
                className={`relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                {viewMode === id && (
                  <motion.div
                    layoutId="view-pill"
                    className="absolute inset-0 rounded-md bg-background shadow-sm"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className="relative size-3.5" />
                <span className="relative hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Task count */}
      {!isLoading && filtered.length > 0 && (
        <p className="text-xs text-muted-foreground -mt-2">
          {filtered.length} task{filtered.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Views */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Empty className="py-24">
          <EmptyMedia>
            <ListTodo className="size-12 text-muted-foreground/30" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>No tasks found</EmptyTitle>
            <EmptyDescription>
              {search || statusFilter !== "all" || priorityFilter !== "all"
                ? "Try adjusting your filters to find what you're looking for."
                : "Get started by creating your first task."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {viewMode === "kanban" && (
              <KanbanBoard tasks={filtered} onView={handleViewTask} />
            )}
            {viewMode === "table" && (
              <TableView
                tasks={filtered}
                onView={handleViewTask}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
              />
            )}
            {viewMode === "calendar" && (
              <CalendarView tasks={filtered} onView={handleViewTask} />
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Dialogs */}
      <CreateTaskDialog open={createOpen} onOpenChange={setCreateOpen} />

      <EditTaskDialog
        task={editTask}
        open={!!editTask}
        onOpenChange={(o) => !o && setEditTask(null)}
      />

      <ViewTaskSheet
        task={viewTask}
        open={!!viewTask}
        onOpenChange={(o) => !o && setViewTask(null)}
        onEdit={(t) => {
          setViewTask(null);
          setEditTask(t);
        }}
      />

      <DeleteTaskAlert
        task={deleteTask}
        open={!!deleteTask}
        onOpenChange={(o) => !o && setDeleteTask(null)}
      />
    </div>
  );
}
