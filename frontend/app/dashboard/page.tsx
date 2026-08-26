"use client";
import { useMemo } from "react";
import { motion, type Variants } from "framer-motion";
import { ClipboardList, CheckCircle2, Clock, AlertTriangle, ArrowUpRight, Calendar, PieChart as PieIcon, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

const STATUS_COLORS: Record<string, string> = {
    "Completed": "#10b981",
    "In Progress": "#3b82f6",
    "Not Started": "#94a3b8",
    "Completed Late": "#f59e0b",
    "Overdue": "#f43f5e",
};

const PRIORITY_COLORS: Record<string, string> = {
    "Low": "#64748b",
    "Medium": "#3b82f6",
    "High": "#f59e0b",
    "Urgent": "#f43f5e",
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

function ChartSkeleton({ height = 240 }: { height?: number }) {
    return <Skeleton className="w-full rounded-xl" style={{ height }} />;
}

export default function DashboardPage() {
    const { data: user } = useCurrentUser();
    const { data: stats, isLoading: statsLoading } = useTaskStats();
    const { data: recentTasks, isLoading: tasksLoading } = useTasks();

    const role = user?.role;
    const isStaff = role === "staff";
    const isSupervisor = role === "supervisor";
    const isAdmin = role === "super_admin" || role === "admin";

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 17) return "Good afternoon";
        return "Good evening";
    };

    const overviewSubtitle = isStaff
        ? "Here's your personal task overview"
        : isSupervisor
            ? "Here's your team's task overview (self + direct reports)"
            : "Here's your organisation-wide task overview";

    const totalTasksDesc = isStaff
        ? "Your assigned tasks"
        : isSupervisor
            ? "Team tasks assigned"
            : "All organisation tasks";

    const statsCards = stats
        ? [
            {
                title: "Total Tasks",
                value: stats.total,
                icon: ClipboardList,
                description: totalTasksDesc,
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

    // ── Status chart data ──
    const statusChartData = useMemo(() => {
        if (!stats || stats.total === 0) return [];
        return [
            { name: "Completed", value: stats.completed },
            { name: "In Progress", value: stats.inProgress },
            { name: "Not Started", value: stats.notStarted },
            { name: "Completed Late", value: stats.completedLate },
            { name: "Overdue", value: stats.overdue },
        ].filter((d) => d.value > 0);
    }, [stats]);

    // ── Priority chart data ──
    const priorityChartData = useMemo(() => {
        if (!recentTasks || recentTasks.length === 0) return [];
        const counts = { low: 0, medium: 0, high: 0, urgent: 0 };
        for (const task of recentTasks) {
            const p = task.t.priority;
            if (p in counts) counts[p]++;
        }
        return [
            { name: "Low", count: counts.low, fill: PRIORITY_COLORS["Low"] },
            { name: "Medium", count: counts.medium, fill: PRIORITY_COLORS["Medium"] },
            { name: "High", count: counts.high, fill: PRIORITY_COLORS["High"] },
            { name: "Urgent", count: counts.urgent, fill: PRIORITY_COLORS["Urgent"] },
        ];
    }, [recentTasks]);

    const completionRate = stats && stats.total > 0
        ? Math.round(((stats.completed + stats.completedLate) / stats.total) * 100)
        : 0;

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
                    {format(new Date(), "EEEE, MMMM d, yyyy")} — {overviewSubtitle}
                </p>
            </motion.div>

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

            <motion.div variants={itemVariants} className="grid gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                            <PieIcon className="size-4 text-indigo-500" />
                            <CardTitle className="text-base font-semibold">
                                {isStaff ? "Your Task Status" : isSupervisor ? "Team Task Status" : "Task Status Distribution"}
                            </CardTitle>
                        </div>
                        <CardDescription className="text-xs">
                            {isStaff
                                ? "Breakdown of your active, pending, and completed tasks"
                                : isSupervisor
                                    ? "Breakdown across your personal and supervised tasks"
                                    : "Breakdown of all active, pending, and completed organisation tasks"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                        {statsLoading ? (
                            <ChartSkeleton height={240} />
                        ) : statusChartData.length > 0 ? (
                            <div className="relative">
                                <ResponsiveContainer width="100%" height={240}>
                                    <PieChart>
                                        <Pie
                                            data={statusChartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={88}
                                            paddingAngle={3}
                                            dataKey="value"
                                            animationBegin={0}
                                            animationDuration={900}
                                            isAnimationActive
                                        >
                                            {statusChartData.map((entry) => (
                                                <Cell
                                                    key={entry.name}
                                                    fill={STATUS_COLORS[entry.name] ?? "#64748b"}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value, name) => [`${value} tasks`, name]}
                                            contentStyle={{
                                                background: "var(--popover)",
                                                border: "1px solid var(--border)",
                                                borderRadius: "8px",
                                                fontSize: "12px",
                                                color: "var(--popover-foreground)",
                                            }}
                                        />
                                        <Legend
                                            iconType="circle"
                                            iconSize={8}
                                            formatter={(val) => (
                                                <span className="text-xs text-muted-foreground">{val}</span>
                                            )}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center -translate-y-4">
                                    <span className="text-2xl font-bold tabular-nums">
                                        {completionRate}%
                                    </span>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                        Completed
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex h-60 items-center justify-center text-sm text-muted-foreground">
                                No task data available.
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="size-4 text-indigo-500" />
                            <CardTitle className="text-base font-semibold">
                                {isStaff ? "Your Task Priorities" : isSupervisor ? "Team Task Priorities" : "Task Priority Distribution"}
                            </CardTitle>
                        </div>
                        <CardDescription className="text-xs">
                            {isStaff
                                ? "Your assigned workload categorized by urgency level"
                                : isSupervisor
                                    ? "Team workload categorized by urgency level"
                                    : "Organisation workload categorized by urgency level"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                        {tasksLoading ? (
                            <ChartSkeleton height={240} />
                        ) : priorityChartData.some((d) => d.count > 0) ? (
                            <ResponsiveContainer width="100%" height={240}>
                                <BarChart
                                    data={priorityChartData}
                                    margin={{ left: -12, right: 16, top: 12, bottom: 4 }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                        stroke="var(--border)"
                                    />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        allowDecimals={false}
                                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        formatter={(val) => [`${val} tasks`, "Count"]}
                                        contentStyle={{
                                            background: "var(--popover)",
                                            border: "1px solid var(--border)",
                                            borderRadius: "8px",
                                            fontSize: "12px",
                                            color: "var(--popover-foreground)",
                                        }}
                                        cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                                    />
                                    <Bar
                                        dataKey="count"
                                        radius={[6, 6, 0, 0]}
                                        animationBegin={0}
                                        animationDuration={900}
                                        isAnimationActive
                                    >
                                        {priorityChartData.map((entry) => (
                                            <Cell key={entry.name} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-60 items-center justify-center text-sm text-muted-foreground">
                                No task priority data available.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <CardTitle className="text-base font-semibold">
                            {isStaff ? "Your Recent Tasks" : isSupervisor ? "Team Recent Tasks" : "Recent Tasks"}
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

                                            {task.t.deadline && (
                                                <span className="hidden items-center gap-1 text-xs text-muted-foreground md:flex">
                                                    <Calendar className="size-3" />
                                                    {formatSafeDate(task.t.deadline, "MMM d")}
                                                </span>
                                            )}

                                            <Badge
                                                variant="secondary"
                                                className={`shrink-0 text-[10px] ${status?.className}`}
                                            >
                                                {status?.label}
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