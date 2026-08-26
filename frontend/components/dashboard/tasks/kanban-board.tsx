"use client";

import { useState, useCallback, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { TaskCard } from "./task-card";
import type { TaskWithRelations, TaskStatus } from "@/types/api";
import { useUpdateTaskStatus } from "@/hooks/use-tasks";

const COLUMNS: {
  id: TaskStatus;
  label: string;
  color: string;
  headerClass: string;
}[] = [
  {
    id: "not_started",
    label: "Not Started",
    color: "#94a3b8",
    headerClass: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20",
  },
  {
    id: "in_progress",
    label: "In Progress",
    color: "#3b82f6",
    headerClass: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
  },
  {
    id: "completed",
    label: "Completed",
    color: "#10b981",
    headerClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  },
  {
    id: "completed_late",
    label: "Completed Late",
    color: "#f97316",
    headerClass: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20",
  },
  {
    id: "overdue",
    label: "Overdue",
    color: "#ef4444",
    headerClass: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20",
  },
];

interface KanbanColumnProps {
  column: (typeof COLUMNS)[number];
  tasks: TaskWithRelations[];
  onView: (task: TaskWithRelations) => void;
  colIdx: number;
}

function KanbanColumn({ column, tasks, onView, colIdx }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: colIdx * 0.05, duration: 0.3 }}
      className={`flex w-72 shrink-0 flex-col rounded-2xl border transition-all ${
        isOver
          ? "border-foreground/30 bg-muted/60 shadow-md ring-1 ring-foreground/20"
          : "bg-muted/30"
      }`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between rounded-t-2xl border-b bg-background/70 px-3.5 py-2.5 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div
            className="size-2 rounded-full"
            style={{ backgroundColor: column.color }}
          />
          <span className="text-xs font-semibold">{column.label}</span>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${column.headerClass}`}
        >
          {tasks.length}
        </span>
      </div>

      {/* Cards container */}
      <SortableContext
        items={tasks.map((t) => t.t.id)}
        strategy={verticalListSortingStrategy}
        id={column.id}
      >
        <div
          ref={setNodeRef}
          id={column.id}
          className="flex flex-1 flex-col gap-2.5 p-2.5 min-h-36"
        >
          <AnimatePresence mode="popLayout">
            {tasks.map((task) => (
              <TaskCard key={task.t.id} task={task} onView={onView} />
            ))}
          </AnimatePresence>
          {tasks.length === 0 && (
            <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border/60 py-8 text-[11px] text-muted-foreground/50">
              Drop tasks here
            </div>
          )}
        </div>
      </SortableContext>
    </motion.div>
  );
}

interface KanbanBoardProps {
  tasks: TaskWithRelations[];
  onView: (task: TaskWithRelations) => void;
}

export function KanbanBoard({ tasks, onView }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<TaskWithRelations | null>(null);
  const [optimisticTasks, setOptimisticTasks] = useState<TaskWithRelations[]>(tasks);
  const updateStatus = useUpdateTaskStatus();

  useEffect(() => {
    setOptimisticTasks(tasks);
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const task = optimisticTasks.find((t) => t.t.id === event.active.id);
      if (task) setActiveTask(task);
    },
    [optimisticTasks]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveTask(null);
      const { active, over } = event;
      if (!over) return;

      const activeId = String(active.id);
      const overId = String(over.id);

      const movingTask = optimisticTasks.find((t) => t.t.id === activeId);
      if (!movingTask) return;

      // Determine destination column:
      // If dropped over a column container (overId is column.id)
      let targetStatus: TaskStatus | null = null;
      if (COLUMNS.some((c) => c.id === overId)) {
        targetStatus = overId as TaskStatus;
      } else {
        // If dropped over another task card, find what column that card belongs to
        const overTask = optimisticTasks.find((t) => t.t.id === overId);
        if (overTask) {
          targetStatus = overTask.t.status;
        }
      }

      if (!targetStatus || movingTask.t.status === targetStatus) return;

      // Optimistic update
      setOptimisticTasks((prev) =>
        prev.map((t) =>
          t.t.id === movingTask.t.id
            ? { ...t, t: { ...t.t, status: targetStatus! } }
            : t
        )
      );

      // Call backend API with rollback on error
      updateStatus.mutate(
        { id: movingTask.t.id, status: targetStatus },
        {
          onSuccess: () => {
            const targetCol = COLUMNS.find((c) => c.id === targetStatus);
            toast.success(`Task moved to "${targetCol?.label || targetStatus}"`);
          },
          onError: (err: any) => {
            // Revert optimistic update
            setOptimisticTasks((prev) =>
              prev.map((t) =>
                t.t.id === movingTask.t.id
                  ? { ...t, t: { ...t.t, status: movingTask.t.status } }
                  : t
              )
            );
            const msg =
              err?.response?.data?.message ||
              "Cannot move task — check dependencies or status rules";
            toast.error(msg);
          },
        }
      );
    },
    [optimisticTasks, updateStatus]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1">
        {COLUMNS.map((col, colIdx) => {
          const colTasks = optimisticTasks.filter((t) => t.t.status === col.id);

          return (
            <KanbanColumn
              key={col.id}
              column={col}
              tasks={colTasks}
              onView={onView}
              colIdx={colIdx}
            />
          );
        })}
      </div>

      {/* Drag overlay */}
      <DragOverlay dropAnimation={{ duration: 200 }}>
        {activeTask ? (
          <TaskCard task={activeTask} onView={onView} isDragOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
