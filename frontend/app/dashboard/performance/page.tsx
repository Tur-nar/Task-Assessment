"use client";
import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import {
  RadialBarChart, RadialBar, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Legend,
} from "recharts";
import { TrendingUp, User, Award, CheckCircle2, Clock, AlertTriangle, Users, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrentUser } from "@/hooks/use-auth";
import { useAllPerformance, useMyPerformance, useDepartmentPerformance } from "@/hooks/use-performance";
import { useDepartments } from "@/hooks/use-users";
import type { PerformanceRecord, UserRole } from "@/types/api";

const pageVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

const pillVariants: Variants = {
  hidden: { opacity: 0, scale: 0.88, y: 12 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const statPillsContainer: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.2 } },
};

// ─── Rating helpers ───────────────────────────────────────────────────────────
type Rating = "Excellent" | "Good" | "Average" | "Needs Improvement";

const ratingConfig: Record<string, { color: string; bg: string; bar: string }> = {
  Excellent: { color: "text-emerald-500", bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", bar: "#10b981" },
  Good: { color: "text-blue-500", bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400", bar: "#3b82f6" },
  Average: { color: "text-amber-500", bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400", bar: "#f59e0b" },
  "Needs Improvement": { color: "text-rose-500", bg: "bg-rose-500/10 text-rose-600 dark:text-rose-400", bar: "#f43f5e" },
};

function getRatingStyle(rating: string) {
  return ratingConfig[rating] ?? ratingConfig["Average"];
}

// ─── Score ring chart ─────────────────────────────────────────────────────────
function ScoreRing({ score, rating }: { score: number; rating: string }) {
  const style = getRatingStyle(rating);
  const data = [{ value: score, fill: style.bar }];

  return (
    <div className="relative flex items-center justify-center">
      <RadialBarChart
        width={180}
        height={180}
        cx={90}
        cy={90}
        innerRadius={64}
        outerRadius={86}
        startAngle={90}
        endAngle={-270}
        data={data}
        barSize={16}
      >
        <RadialBar
          dataKey="value"
          cornerRadius={8}
          background={{ fill: "var(--muted)" }}
          animationBegin={0}
          animationDuration={1200}
          isAnimationActive
        />
      </RadialBarChart>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.5, type: "spring", stiffness: 200 }}
          className={`text-4xl font-bold tabular-nums ${style.color}`}
        >
          {score}
        </motion.span>
        <span className="mt-0.5 text-[11px] text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

function PersonalCard({ record }: { record: PerformanceRecord }) {
  const style = getRatingStyle(record.rating);
  const pills = [
    { label: "Total Assigned", value: record.totalTasksAssigned, icon: User, cls: "" },
    { label: "Completed", value: record.tasksCompleted, icon: CheckCircle2, cls: "text-emerald-500" },
    { label: "On Time", value: record.tasksOnTime, icon: TrendingUp, cls: "text-blue-500" },
    { label: "Late", value: record.tasksCompletedLate, icon: Clock, cls: "text-amber-500" },
    { label: "Overdue", value: record.tasksLate, icon: AlertTriangle, cls: "text-rose-500" },
  ];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Your Performance</CardTitle>
            <CardDescription className="mt-0.5 text-xs">
              {record.department?.name ?? "No department"} ·{" "}
              <span className="capitalize">{record.user.role.replace("_", " ")}</span>
            </CardDescription>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.4 }}
          >
            <Badge className={`${style.bg} border-0 text-xs font-semibold`}>
              <Award className="mr-1 size-3" />
              {record.rating}
            </Badge>
          </motion.div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <ScoreRing score={record.performanceScore} rating={record.rating} />

          <motion.div
            variants={statPillsContainer}
            initial="hidden"
            animate="show"
            className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3"
          >
            {pills.map((p) => (
              <motion.div
                key={p.label}
                variants={pillVariants}
                className="flex flex-col gap-1 rounded-xl border bg-muted/30 p-3"
              >
                <div className="flex items-center gap-1.5">
                  <p.icon className={`size-3.5 shrink-0 ${p.cls || "text-muted-foreground"}`} />
                  <span className="text-[11px] text-muted-foreground">{p.label}</span>
                </div>
                <span className="text-xl font-bold tabular-nums">{p.value}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
}

function LeaderboardTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as {
    name: string;
    score: number;
    rating: string;
    completed: number;
    total: number;
  };
  const style = getRatingStyle(d.rating);
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-semibold">{d.name}</p>
      <p>Score: <span className={`font-bold ${style.color}`}>{d.score}</span></p>
      <p>Completed: {d.completed} / {d.total}</p>
      <p>Rating: <span className={style.color}>{d.rating}</span></p>
    </div>
  );
}

function LeaderboardChart({ records }: { records: PerformanceRecord[] }) {
  const data = [...records]
    .sort((a, b) => b.performanceScore - a.performanceScore)
    .map((r) => ({
      name: `${r.user.firstName} ${r.user.lastName}`,
      score: r.performanceScore,
      rating: r.rating,
      completed: r.tasksCompleted,
      total: r.totalTasksAssigned,
      fill: getRatingStyle(r.rating).bar,
    }));

  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        No performance data available.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 42)}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
        <XAxis
          type="number"
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={112}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<LeaderboardTooltip />} cursor={{ fill: "var(--muted)/0.4)" }} />
        <Bar
          dataKey="score"
          radius={[0, 6, 6, 0]}
          animationBegin={0}
          animationDuration={900}
          isAnimationActive
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

const PIE_COLORS = ["#10b981", "#f59e0b", "#f43f5e"];

function TaskBreakdownPie({ records }: { records: PerformanceRecord[] }) {
  const onTime = records.reduce((s, r) => s + r.tasksOnTime, 0);
  const completedLate = records.reduce((s, r) => s + r.tasksCompletedLate, 0);
  const overdue = records.reduce((s, r) => s + r.tasksLate, 0);
  const total = onTime + completedLate + overdue;

  if (total === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Not enough data.
      </div>
    );
  }

  const data = [
    { name: "On Time", value: onTime },
    { name: "Completed Late", value: completedLate },
    { name: "Overdue", value: overdue },
  ].filter((d) => d.value > 0);

  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const r = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={56}
          outerRadius={90}
          dataKey="value"
          paddingAngle={3}
          animationBegin={0}
          animationDuration={1000}
          isAnimationActive
          labelLine={false}
          label={renderLabel}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => (
            <span className="text-xs text-muted-foreground">{value}</span>
          )}
        />
        <Tooltip
          formatter={(value, name) => [`${value} tasks`, name]}
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

function ScoreDistributionChart({ records }: { records: PerformanceRecord[] }) {
  const data = [...records]
    .sort((a, b) => b.performanceScore - a.performanceScore)
    .map((r, i) => ({
      rank: i + 1,
      score: r.performanceScore,
      name: `${r.user.firstName} ${r.user.lastName}`,
    }));

  if (data.length < 2) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Need at least 2 staff members for distribution.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
        <defs>
          <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="rank"
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          label={{ value: "Rank", position: "insideBottom", offset: -2, fontSize: 10, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          width={28}
        />
        <Tooltip
          formatter={(value, _name, props) => [
            `${value} — ${props.payload.name}`,
            "Score",
          ]}
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Area
          type="monotone"
          dataKey="score"
          stroke="#6366f1"
          strokeWidth={2}
          fill="url(#scoreGrad)"
          animationBegin={0}
          animationDuration={1100}
          isAnimationActive
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function PersonalCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <Skeleton className="mx-auto size-45 rounded-full" />
          <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ChartSkeleton({ height = 240 }: { height?: number }) {
  return <Skeleton className={`w-full rounded-xl`} style={{ height }} />;
}

// ─── Org-wide summary stat row ────────────────────────────────────────────────
function OrgSummaryRow({ records }: { records: PerformanceRecord[] }) {
  const avg = records.length
    ? Math.round(records.reduce((s, r) => s + r.performanceScore, 0) / records.length)
    : 0;
  const excellent = records.filter((r) => r.rating === "Excellent").length;
  const needsHelp = records.filter((r) => r.rating === "Needs Improvement").length;
  const totalAssigned = records.reduce((s, r) => s + r.totalTasksAssigned, 0);

  const stats = [
    { label: "Avg. Score", value: avg, icon: TrendingUp, cls: "text-indigo-500" },
    { label: "Total Staff", value: records.length, icon: Users, cls: "text-blue-500" },
    { label: "Excellent Ratings", value: excellent, icon: Award, cls: "text-emerald-500" },
    { label: "Needs Improvement", value: needsHelp, icon: AlertTriangle, cls: "text-rose-500" },
    { label: "Total Tasks Issued", value: totalAssigned, icon: CheckCircle2, cls: "text-muted-foreground" },
  ];

  return (
    <motion.div
      variants={statPillsContainer}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
    >
      {stats.map((s) => (
        <motion.div
          key={s.label}
          variants={pillVariants}
          className="flex flex-col gap-1 rounded-xl border bg-muted/30 p-4"
        >
          <div className="flex items-center gap-1.5">
            <s.icon className={`size-3.5 shrink-0 ${s.cls}`} />
            <span className="text-[11px] text-muted-foreground">{s.label}</span>
          </div>
          <span className="text-2xl font-bold tabular-nums">{s.value}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PerformancePage() {
  const { data: user } = useCurrentUser();
  const role = user?.role as UserRole | undefined;

  const isAdmin = role === "super_admin" || role === "admin";
  const isSupervisor = role === "supervisor";
  const canViewTeam = isAdmin || isSupervisor;

  const [selectedDeptId, setSelectedDeptId] = useState<string>("");

  const { data: myPerf, isLoading: myLoading } = useMyPerformance();
  const { data: allPerf, isLoading: allLoading } = useAllPerformance(role);
  const { data: deptPerf, isLoading: deptLoading } = useDepartmentPerformance(
    isAdmin && selectedDeptId ? selectedDeptId : null
  );
  const { data: departments } = useDepartments();

  const leaderboardData =
    isAdmin && selectedDeptId && deptPerf ? deptPerf : allPerf ?? [];

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <motion.div variants={sectionVariants} className="space-y-1">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-5 text-indigo-500" />
          <h1 className="text-2xl font-semibold tracking-tight">Performance</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {isAdmin
            ? "Organisation-wide analytics and staff performance leaderboard"
            : isSupervisor
              ? "Your personal performance and your team's leaderboard"
              : "Your personal performance metrics"}
        </p>
      </motion.div>

      <motion.section variants={sectionVariants}>
        {myLoading ? (
          <PersonalCardSkeleton />
        ) : myPerf ? (
          <PersonalCard record={myPerf} />
        ) : (
          <Card>
            <CardContent className="px-6 py-10 text-center text-sm text-muted-foreground">
              No personal performance data yet. Complete some tasks to see your score.
            </CardContent>
          </Card>
        )}
      </motion.section>

      {canViewTeam && (
        <>
          {isAdmin && allPerf && allPerf.length > 0 && (
            <motion.section variants={sectionVariants}>
              <OrgSummaryRow records={allPerf} />
            </motion.section>
          )}

          <motion.section variants={sectionVariants}>
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4">
                <div>
                  <CardTitle className="text-base font-semibold">
                    {isAdmin ? "Organisation Leaderboard" : "Team Leaderboard"}
                  </CardTitle>
                  <CardDescription className="mt-0.5 text-xs">
                    Performance scores sorted highest to lowest
                  </CardDescription>
                </div>

                {isAdmin && departments && departments.length > 0 && (
                  <Select
                    value={selectedDeptId || "all"}
                    onValueChange={(v) => setSelectedDeptId(!v || v === "all" ? "" : v)}
                  >
                    <SelectTrigger className="h-8 w-44 text-xs">
                      <Building2 className="mr-1.5 size-3 text-muted-foreground" />
                      <SelectValue placeholder="All departments">
                        {selectedDeptId
                          ? departments.find((d) => d.d.id === selectedDeptId)?.d.name
                          : "All departments"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" label="All departments">All departments</SelectItem>
                      {departments.map(({ d }) => (
                        <SelectItem key={d.id} value={d.id} label={d.name}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                {allLoading || (isAdmin && selectedDeptId && deptLoading) ? (
                  <ChartSkeleton height={Math.max(160, (leaderboardData.length || 4) * 42)} />
                ) : (
                  <LeaderboardChart records={leaderboardData} />
                )}
              </CardContent>
            </Card>
          </motion.section>

          {isAdmin && (
            <motion.section variants={sectionVariants} className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Task Completion Breakdown</CardTitle>
                  <CardDescription className="text-xs">
                    Org-wide distribution: on-time, late, overdue
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {allLoading ? (
                    <ChartSkeleton height={220} />
                  ) : allPerf ? (
                    <TaskBreakdownPie records={allPerf} />
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Score Distribution</CardTitle>
                  <CardDescription className="text-xs">
                    Performance scores across all staff (rank 1 = highest)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {allLoading ? (
                    <ChartSkeleton height={200} />
                  ) : allPerf ? (
                    <ScoreDistributionChart records={allPerf} />
                  ) : null}
                </CardContent>
              </Card>
            </motion.section>
          )}
        </>
      )}
    </motion.div>
  );
}
