"use client";

import { motion, type Variants } from "framer-motion";
import {
    ClipboardList,
    CheckCircle2,
    Clock,
    AlertTriangle,
    ArrowUpRight,
    Calendar,
} from "lucide-react";
import { format } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/use-auth";
import { useTaskStats, useTasks } from "@/hooks/use-tasks";
import type { TaskStatus, TaskPriority } from "@/types/api";
import { formatSafeDate } from "@/lib/utils";

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.08 },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: "easeOut" },
    },
};

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
    not_started: { label: "Not Started", className: "bg-muted text-muted-foreground" },
    in_progress: { label: "In Progress", className: "bg-foreground/10 text-foreground" },
    completed: { label: "Completed", className: "bg-foreground text-background" },
    completed_late: { label: "Completed Late", className: "bg-muted-foreground text-background" },
    overdue: { label: "Overdue", className: "bg-destructive text-destructive-foreground" },
};

const priorityConfig: Record<TaskPriority, { label: string; className: string }> = {
    low: { label: "Low", className: "text-muted-foreground" },
    medium: { label: "Medium", className: "text-foreground/70" },
    high: { label: "High", className: "text-foreground" },
    urgent: { label: "Urgent", className: "text-destructive font-semibold" },
};

function AnimatedCounter({ value, label }: { value: number; label: string }) {
    return (
        <div>
            <motion.span
                key={value}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-bold tracking-tight"
            >
                {value}
            </motion.span>
            <p className="mt-1 text-xs text-muted-foreground">{label}</p>
        </div>
    );
}

function StatsSkeleton() {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
                <Card key={i}>
                    <CardContent className="p-6">
                        <Skeleton className="mb-3 h-4 w-24" />
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="mt-2 h-3 w-20" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export default function DashboardPage() {
    const user = useCurrentUser();
    const { data: stats, isLoading: statsLoading } = useTaskStats();
    const { data: recentTasks, isLoading: tasksLoading } = useTasks();

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 17) return "Good afternoon";
        return "Good evening";
    };

    const statsCards = stats
        ? [
            {
                title: "Total Tasks",
                value: stats.total,
                icon: ClipboardList,
                description: "All assigned tasks",
            },
            {
                title: "Completed",
                value: stats.completed,
                icon: CheckCircle2,
                description: `${stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% completion rate`,
            },
            {
                title: "In Progress",
                value: stats.inProgress,
                icon: Clock,
                description: "Currently active",
            },
            {
                title: "Overdue",
                value: stats.overdue,
                icon: AlertTriangle,
                description: stats.overdue > 0 ? "Needs attention" : "All on track",
            },
        ]
        : [];

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-8"
        >
            <motion.div variants={itemVariants} className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">
                    {greeting()}, {user?.firstName ?? "there"}
                </h1>
                <p className="text-sm text-muted-foreground">
                    {format(new Date(), "EEEE, MMMM d, yyyy")} — Here&apos;s your overview
                </p>
            </motion.div>

            {/* Stats Grid */}
            {statsLoading ? (
                <StatsSkeleton />
            ) : (
                <motion.div
                    variants={containerVariants}
                    className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
                >
                    {statsCards.map((card) => (
                        <motion.div key={card.title} variants={itemVariants}>
                            <Card className="group relative overflow-hidden transition-colors hover:bg-muted/30">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-muted-foreground">
                                            {card.title}
                                        </p>
                                        <card.icon className="size-4 text-muted-foreground/50" />
                                    </div>
                                    <AnimatedCounter
                                        value={card.value}
                                        label={card.description}
                                    />
                                </CardContent>
                                <div className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-foreground/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            <motion.div variants={itemVariants}>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <CardTitle className="text-base font-semibold">
                            Recent Tasks
                        </CardTitle>
                        <Badge variant="secondary" className="text-xs">
                            {recentTasks?.length ?? 0} tasks
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                        {tasksLoading ? (
                            <div className="space-y-0 divide-y">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-4 px-6 py-4">
                                        <Skeleton className="h-4 w-50" />
                                        <Skeleton className="ml-auto h-5 w-16" />
                                    </div>
                                ))}
                            </div>
                        ) : recentTasks && recentTasks.length > 0 ? (
                            <div className="divide-y">
                                {recentTasks.slice(0, 8).map((task, i) => {
                                    const status = statusConfig[task.t.status];
                                    const priority = priorityConfig[task.t.priority];
                                    return (
                                        <motion.div
                                            key={task.t.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-muted/30"
                                        >
                                            {/* Priority dot */}
                                            <div
                                                className={`size-2 rounded-full ${task.t.priority === "urgent"
                                                    ? "bg-destructive"
                                                    : task.t.priority === "high"
                                                        ? "bg-foreground"
                                                        : "bg-muted-foreground/40"
                                                    }`}
                                            />

                                            {/* Title & assignee */}
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">
                                                    {task.t.title}
                                                </p>
                                                {task.assignee && (
                                                    <p className="truncate text-xs text-muted-foreground">
                                                        {task.assignee.firstName}{" "}
                                                        {task.assignee.lastName}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Priority label */}
                                            <span
                                                className={`hidden text-xs sm:inline ${priority.className}`}
                                            >
                                                {priority.label}
                                            </span>

                                            {/* Deadline */}
                                            {task.t.deadline && (
                                                <span className="hidden items-center gap-1 text-xs text-muted-foreground md:flex">
                                                    <Calendar className="size-3" />
                                                    {formatSafeDate(task.t.deadline, "MMM d")}
                                                </span>
                                            )}

                                            {/* Status badge */}
                                            <Badge
                                                variant="secondary"
                                                className={`shrink-0 text-[10px] ${status.className}`}
                                            >
                                                {status.label}
                                            </Badge>

                                            <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground/40" />
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                                No tasks found. Create your first task to get started.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}