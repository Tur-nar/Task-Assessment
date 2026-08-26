"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  GitBranch,
  ChartBar,
  Bell,
  Buildings,
  CheckCircle,
  Clock,
  Warning,
  Hourglass,
  Users,
  Target,
  ArrowRight,
  ListChecks,
  UserCircle,
  Megaphone,
  CalendarCheck,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { FeatCard } from "@/components/ui/agent-bento-grid";

type ActiveTask = "plan" | "design" | "build" | "test" | "deploy";

const VW = 320;
const VH = 240;

interface TaskNode {
  id: string;
  x: number;
  y: number;
  icon: any;
  label: string;
  step: ActiveTask;
}

const TASK_NODES: TaskNode[] = [
  { id: "plan", x: 50, y: 120, icon: ListChecks, label: "PLAN", step: "plan" },
  { id: "design", x: 130, y: 55, icon: Target, label: "DESIGN", step: "design" },
  { id: "build", x: 130, y: 185, icon: GitBranch, label: "BUILD", step: "build" },
  { id: "test", x: 210, y: 120, icon: CheckCircle, label: "TEST", step: "test" },
  { id: "deploy", x: 280, y: 120, icon: ArrowRight, label: "DEPLOY", step: "deploy" },
];

interface DepPath {
  id: string;
  d: string;
  activeSteps: ActiveTask[];
  colorClass: string;
}

const DEP_PATHS: DepPath[] = [
  {
    id: "plan-to-design",
    d: "M 78 120 L 104 55",
    activeSteps: ["plan"],
    colorClass: "text-cyan-500 dark:text-cyan-400",
  },
  {
    id: "plan-to-build",
    d: "M 78 120 L 104 185",
    activeSteps: ["plan"],
    colorClass: "text-cyan-500 dark:text-cyan-400",
  },
  {
    id: "design-to-test",
    d: "M 158 55 L 183 120",
    activeSteps: ["design"],
    colorClass: "text-violet-500 dark:text-violet-400",
  },
  {
    id: "build-to-test",
    d: "M 158 185 L 183 120",
    activeSteps: ["build"],
    colorClass: "text-emerald-500 dark:text-emerald-400",
  },
  {
    id: "test-to-deploy",
    d: "M 238 120 L 253 120",
    activeSteps: ["test"],
    colorClass: "text-amber-500 dark:text-amber-400",
  },
];

const TASK_NODE_COLORS: Record<string, { buttonBg: string; buttonBorder: string }> = {
  plan: { buttonBg: "bg-cyan-500", buttonBorder: "border-cyan-600" },
  design: { buttonBg: "bg-violet-500", buttonBorder: "border-violet-600" },
  build: { buttonBg: "bg-emerald-500", buttonBorder: "border-emerald-600" },
  test: { buttonBg: "bg-amber-500", buttonBorder: "border-amber-600" },
  deploy: { buttonBg: "bg-rose-500", buttonBorder: "border-rose-600" },
};

function TaskCard1() {
  const [step, setStep] = useState<ActiveTask>("plan");

  useEffect(() => {
    const steps: ActiveTask[] = ["plan", "design", "build", "test", "deploy"];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % steps.length;
      setStep(steps[idx]);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  const isNodeActive = (nodeId: string) => {
    switch (step) {
      case "plan": return nodeId === "plan";
      case "design": return nodeId === "design" || nodeId === "plan";
      case "build": return nodeId === "build" || nodeId === "plan";
      case "test": return nodeId === "test" || nodeId === "design" || nodeId === "build";
      case "deploy": return nodeId === "deploy" || nodeId === "test";
      default: return false;
    }
  };

  return (
    <div className="w-full h-full relative overflow-hidden select-none bg-neutral-50 dark:bg-neutral-950/80 rounded-xl flex items-center justify-center p-2">
      <svg className="absolute inset-0 w-full h-full" aria-hidden>
        <defs>
          <pattern id="dep-grid" width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="0.75" fill="currentColor" className="text-zinc-200 dark:text-zinc-800/60" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dep-grid)" />
      </svg>

      <svg
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${VW} ${VH}`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden
      >
        {/* Static base paths */}
        <path d="M 78 120 L 104 55" fill="none" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800/80" strokeWidth="1" />
        <path d="M 78 120 L 104 185" fill="none" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800/80" strokeWidth="1" />
        <path d="M 158 55 L 183 120" fill="none" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800/80" strokeWidth="1" />
        <path d="M 158 185 L 183 120" fill="none" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800/80" strokeWidth="1" />
        <path d="M 238 120 L 253 120" fill="none" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800/80" strokeWidth="1" />

        {/* Animated flow paths */}
        {DEP_PATHS.map((p) => {
          const isActive = p.activeSteps.includes(step);
          if (!isActive) return null;
          return (
            <g key={p.id}>
              <motion.path
                d={p.d} fill="none" stroke="currentColor" className={p.colorClass}
                strokeWidth="3.5" strokeOpacity="0.2"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
              />
              <motion.path
                d={p.d} fill="none" stroke="currentColor" className={p.colorClass}
                strokeWidth="1.5"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
              />
            </g>
          );
        })}

        {/* Task Nodes */}
        {TASK_NODES.map((node) => {
          const w = 56;
          const h = 56;
          const isActive = isNodeActive(node.id);
          const colors = TASK_NODE_COLORS[node.id];

          return (
            <foreignObject key={node.id} x={node.x - w / 2} y={node.y - h / 2} width={w} height={h} className="overflow-visible">
              <div className="w-full h-full flex items-center justify-center">
                <div
                  className={`w-full h-full rounded-[14px] border flex flex-col items-center justify-center text-white transition-all duration-300 ${colors.buttonBg} ${colors.buttonBorder} ${isActive
                      ? "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4),inset_4px_4px_0_0_rgba(255,255,255,0.06),inset_6px_6px_0_0_rgba(255,255,255,0.04),inset_8px_8px_0_0_rgba(255,255,255,0.02),0_1px_2px_0_rgba(0,0,0,0.08),0_2px_4px_0_rgba(0,0,0,0.06),0_4px_6px_0_rgba(0,0,0,0.04),0_6px_8px_0_rgba(0,0,0,0.02)] scale-105"
                      : "opacity-40 shadow-[0_1px_2px_0_rgba(0,0,0,0.06)]"
                    }`}
                >
                  <div className="mb-0.5 flex items-center justify-center">
                    <node.icon className="w-5 h-5" weight="fill" />
                  </div>
                  <span className="text-[8.5px] font-mono font-bold tracking-wider select-none">{node.label}</span>
                </div>
              </div>
            </foreignObject>
          );
        })}
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Card2 – Performance Analytics
   Bar chart + stat cards
───────────────────────────────────────────── */
function TaskCard2() {
  const bars = [72, 85, 45, 90, 68, 78, 55];
  const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  const [activeIdx, setActiveIdx] = useState(0);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev === 0 ? 1 : 0));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full flex flex-col gap-3.5 justify-between">
      <div className="flex gap-4 pt-2.5 pr-2.5 pb-0.5 pl-0.5">
        {[
          { label: "Completion", value: "87%", trend: "+12%" },
          { label: "Avg Score", value: "74.2", trend: "+5%" },
        ].map((s, i) => {
          const isActive = i === activeIdx || hoveredIdx === i;
          return (
            <div key={i} className="flex-1 h-19 relative select-none">
              <div
                className="absolute inset-0 rounded-xl border border-border/40 dark:border-border/20 bg-muted/5 text-border/30 dark:text-border/20"
                style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 6px, currentColor 6px, currentColor 7px)" }}
              />
              <motion.div
                className="absolute inset-0 w-full h-full rounded-xl bg-muted/20 dark:bg-neutral-950/80 border border-border/50 shadow-[inset_0_0_0_1px_rgba(255,255,255,1)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.01)] p-3 hover:bg-muted/30 transition-colors duration-300 backdrop-blur-[2px] flex items-center justify-between gap-3 cursor-pointer"
                animate={{ x: isActive ? "0.5rem" : "0rem", y: isActive ? "-0.5rem" : "0rem" }}
                transition={{ type: "spring", stiffness: 200, damping: 16 }}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <div className="flex flex-col min-w-0">
                  <span className="text-[8px] text-muted-foreground/80 font-mono uppercase tracking-widest leading-none">{s.label}</span>
                  <span className="text-base font-bold font-mono text-foreground leading-none mt-1.5 tracking-tight">{s.value}</span>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className={`text-[8px] font-mono font-bold ${s.trend.startsWith("+") ? "text-emerald-500" : "text-rose-400"}`}>{s.trend}</span>
                    <span className="text-[8px] text-muted-foreground/50 font-mono">prev</span>
                  </div>
                </div>
                <div className="w-12 h-6 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 48 24">
                    <motion.path
                      d={i === 0 ? "M 0 18 L 16 11 L 32 14 L 48 4" : "M 0 14 L 16 8 L 32 12 L 48 6"}
                      fill="none" stroke="currentColor" className="text-muted-foreground/30 dark:text-muted-foreground/20"
                      strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"
                      initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                      transition={{ duration: 0.8, delay: 0.2 + i * 0.15, ease: "easeOut" }}
                    />
                    {(i === 0
                      ? [{ x: 0, y: 18 }, { x: 16, y: 11 }, { x: 32, y: 14 }, { x: 48, y: 4 }]
                      : [{ x: 0, y: 14 }, { x: 16, y: 8 }, { x: 32, y: 12 }, { x: 48, y: 6 }]
                    ).map((pt, idx) => (
                      <motion.circle key={idx} cx={pt.x} cy={pt.y} r="1.5"
                        className="fill-background stroke-muted-foreground/40 dark:stroke-muted-foreground/30" strokeWidth="1"
                        initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.5 + idx * 0.08, duration: 0.25 }}
                      />
                    ))}
                  </svg>
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>

      <div className="flex-1 flex items-end gap-2.5 px-0.5 min-h-22.5">
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 h-full rounded-xl dark:bg-neutral-950/80 border border-border/80 dark:border-border/30 relative overflow-hidden bg-muted/5 text-border/40 dark:text-border/20"
            style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 6px, currentColor 6px, currentColor 7px)" }}
          >
            <motion.div
              className="absolute bottom-0 left-0 right-0 bg-primary border-t border-x border-primary/80 shadow-[inset_0_0.5px_0_0_rgba(255,255,255,0.6),inset_0_8px_12px_0_rgba(255,255,255,0.03),inset_0.5px_0_0_0_rgba(255,255,255,0.2),inset_0_2px_6px_0_rgba(255,255,255,0.3),inset_0_-0.5px_0_0_rgba(0,0,0,0.2),inset_-0.5px_0_0_0_rgba(0,0,0,0.1),inset_0_-2px_6px_0_rgba(0,0,0,0.1),0_1px_2px_0_rgba(0,0,0,0.08),0_2px_4px_0_rgba(0,0,0,0.06),0_4px_6px_0_rgba(0,0,0,0.04),inset_0_-4px_8px_0_rgba(0,0,0,0.05)] rounded-t-[10px]"
              initial={{ height: "0%" }}
              animate={{
                height: [`${h}%`, `${Math.min(95, h + 15)}%`, `${Math.max(10, h - 20)}%`, `${Math.min(90, h + 8)}%`, `${h}%`],
              }}
              transition={{ repeat: Infinity, duration: 3 + (i % 3) * 0.8, ease: "easeInOut", delay: i * 0.1 }}
            />
          </div>
        ))}
      </div>

      <div className="flex gap-2.5 px-0.5">
        {days.map((d, i) => (
          <p key={i} className="flex-1 text-center text-[8px] text-muted-foreground font-mono font-medium">{d}</p>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Card3 – Live Notifications Feed
───────────────────────────────────────────── */
const NOTIF_STATUS: Record<string, { icon: any; gradient: string; border: string }> = {
  assigned: { icon: UserCircle, gradient: "bg-gradient-to-b from-blue-400 to-blue-600", border: "border-blue-600" },
  completed: { icon: CheckCircle, gradient: "bg-gradient-to-b from-lime-400 to-lime-600", border: "border-lime-600" },
  overdue: { icon: Warning, gradient: "bg-gradient-to-b from-rose-400 to-rose-600", border: "border-rose-600" },
  reminder: { icon: Bell, gradient: "bg-gradient-to-b from-amber-400 to-amber-600", border: "border-amber-600" },
  announcement: { icon: Megaphone, gradient: "bg-gradient-to-b from-violet-400 to-violet-600", border: "border-violet-600" },
};

function TaskCard3() {
  const notifs = [
    { type: "assigned", agent: "New Task", action: "Q3 Report assigned to you by Femi B.", t: "2m" },
    { type: "completed", agent: "Completed", action: "API Integration marked done by Ada O.", t: "8m" },
    { type: "overdue", agent: "Overdue", action: "Database Migration is 3 days overdue", t: "1h" },
    { type: "reminder", agent: "Deadline", action: "UI Redesign due in 24 hours", t: "3h" },
    { type: "announcement", agent: "Update", action: "Sprint 4 targets published", t: "5h" },
  ];

  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % notifs.length);
    }, 2400);
    return () => clearInterval(interval);
  }, [notifs.length]);

  const getSlot = (i: number) => {
    const N = notifs.length;
    let rel = i - activeIdx;
    if (rel > Math.floor(N / 2)) rel -= N;
    if (rel < -Math.floor(N / 2)) rel += N;
    return rel;
  };

  const Y: Record<string, number> = { "-2": -68, "-1": -38, "0": 0, "1": 38, "2": 68 };

  return (
    <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
      {notifs.map((n, i) => {
        const slot = getSlot(i);
        const si = NOTIF_STATUS[n.type];
        const abs = Math.abs(slot);
        const isActive = slot === 0;
        const isVisible = abs <= 2;

        const yOffset = Y[String(slot)] ?? (slot < 0 ? -120 : 120);
        const scale = isActive ? 1 : abs === 1 ? 0.93 : 0.87;
        const opacity = isActive ? 1 : abs === 1 ? 0.65 : 0.38;
        const zIndex = isActive ? 30 : abs === 1 ? 20 : 10;

        return (
          <motion.div
            key={n.agent + n.action}
            className="absolute left-0 right-0 mx-auto px-1.5"
            style={{ zIndex }}
            animate={{
              y: isVisible ? yOffset : slot < 0 ? -150 : 150,
              scale,
              opacity: isVisible ? opacity : 0,
            }}
            transition={{
              y: { type: "spring", stiffness: 500, damping: 35 },
              scale: { type: "spring", stiffness: 500, damping: 35 },
              opacity: { duration: 0.25, ease: "easeOut" },
            }}
          >
            <div className={`w-full rounded-2xl border flex items-center gap-2.5 ${isActive ? "px-3 py-2.5 bg-background border-border" : "px-2.5 py-1.5 bg-muted/30 border-border/50"}`}>
              <div className={`shrink-0 rounded-[8px] flex items-center justify-center font-bold text-white transition-all duration-300 ${si.gradient} border ${si.border} shadow-[inset_0_0.5px_0_0_rgba(255,255,255,0.6),inset_0.5px_0_0_0_rgba(255,255,255,0.2),inset_0_2px_6px_0_rgba(255,255,255,0.3),inset_0_-0.5px_0_0_rgba(0,0,0,0.3),inset_-0.5px_0_0_0_rgba(0,0,0,0.1),inset_0_-2px_6px_0_rgba(0,0,0,0.1),0_1px_2px_0_rgba(0,0,0,0.08),0_2px_4px_0_rgba(0,0,0,0.06),0_4px_6px_0_rgba(0,0,0,0.04)] ${isActive ? "w-8 h-8" : "w-5 h-5"}`}>
                <si.icon weight="bold" className={`${isActive ? "w-4 h-4" : "w-2.5 h-2.5"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`font-mono font-semibold text-foreground leading-none ${isActive ? "text-[10px]" : "text-[9px]"}`}>{n.agent}</span>
                </div>
                {isActive && <p className="text-[9px] text-muted-foreground truncate mt-0.5 leading-tight">{n.action}</p>}
              </div>
              {isActive && <span className="text-[9px] font-mono text-muted-foreground shrink-0">{n.t}</span>}
            </div>
          </motion.div>
        );
      })}

      <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-1">
        {notifs.map((_, i) => (
          <motion.div key={i} className="rounded-full bg-foreground/25"
            animate={{ width: i === activeIdx ? 14 : 4, opacity: i === activeIdx ? 0.7 : 0.2 }}
            style={{ height: 3 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          />
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Card4 – Department Overview
───────────────────────────────────────────── */
const DEPT_COLORS: Record<string, { bar: string; dot: string; badge: string; buttonBg: string; buttonBorder: string }> = {
  engineering: { bar: "from-violet-500 to-violet-400", dot: "bg-violet-500", badge: "bg-violet-500/15 text-violet-400", buttonBg: "bg-violet-500", buttonBorder: "border-violet-600" },
  marketing: { bar: "from-sky-500 to-sky-400", dot: "bg-sky-500", badge: "bg-sky-500/15 text-sky-400", buttonBg: "bg-sky-500", buttonBorder: "border-sky-600" },
  hr: { bar: "from-emerald-500 to-emerald-400", dot: "bg-emerald-500", badge: "bg-emerald-500/15 text-emerald-400", buttonBg: "bg-emerald-500", buttonBorder: "border-emerald-600" },
  finance: { bar: "from-amber-500 to-amber-400", dot: "bg-amber-500", badge: "bg-amber-500/15 text-amber-400", buttonBg: "bg-amber-500", buttonBorder: "border-amber-600" },
};

const DEPT_ICONS: Record<string, React.ElementType> = {
  engineering: GitBranch,
  marketing: Megaphone,
  hr: Users,
  finance: ChartBar,
};

const RECENT_TASKS = [
  { dept: "engineering", q: "Implement auth middleware", t: "2h" },
  { dept: "marketing", q: "Q3 campaign launch plan", t: "5h" },
  { dept: "engineering", q: "Fix Redis cache invalidation", t: "1d" },
  { dept: "hr", q: "Onboarding flow for new hires", t: "2d" },
  { dept: "finance", q: "Budget reconciliation Q2", t: "3d" },
  { dept: "marketing", q: "Social media content calendar", t: "4d" },
];

function TaskCard4() {
  const departments = [
    { name: "engineering", members: 24, fill: 88 },
    { name: "marketing", members: 12, fill: 56 },
    { name: "hr", members: 8, fill: 25 },
    { name: "finance", members: 6, fill: 14 },
  ];

  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((prev) => (prev + 1) % RECENT_TASKS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const activeDept = RECENT_TASKS[tick].dept;
  const recentQueries = [0, 1, 2, 3].map(
    (offset) => RECENT_TASKS[(tick - offset + RECENT_TASKS.length) % RECENT_TASKS.length]
  );

  return (
    <div className="w-full h-full flex gap-5 py-2 px-3">
      {/* Left panel: Department bars */}
      <div className="flex-1 flex flex-col gap-0 min-w-0 pr-2">
        <p className="text-[8px] font-mono uppercase tracking-widest text-muted-foreground mb-3">Departments</p>
        <div className="flex flex-col gap-3 flex-1">
          {departments.map((dept, i) => {
            const c = DEPT_COLORS[dept.name];
            const isActive = dept.name === activeDept;
            const Icon = (DEPT_ICONS[dept.name] || Buildings) as React.ComponentType<{ size?: number; weight?: string; className?: string }>;

            return (
              <div key={dept.name} className="flex items-center gap-3 group relative">
                <div
                  className={`relative flex shrink-0 items-center justify-center w-9 h-9 rounded-[12px] border transition-all duration-500 ${isActive
                      ? `shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4),inset_4px_4px_0_0_rgba(255,255,255,0.06),inset_6px_6px_0_0_rgba(255,255,255,0.04),inset_8px_8px_0_0_rgba(255,255,255,0.02),0_1px_2px_0_rgba(0,0,0,0.08),0_2px_4px_0_rgba(0,0,0,0.06),0_4px_6px_0_rgba(0,0,0,0.04),0_6px_8px_0_rgba(0,0,0,0.02)] text-white ${c.buttonBg} ${c.buttonBorder} scale-105`
                      : "dark:bg-neutral-950/80 shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_1px_2px_-1px_rgba(0,0,0,0.06),0_2px_4px_0px_rgba(0,0,0,0.04)] bg-white border-transparent text-[#A1A1A1]"
                    }`}
                >
                  <Icon size={16} weight={isActive ? "fill" : "regular"} className="relative z-10" />
                </div>
                <span className={`text-[10px] font-mono w-16 shrink-0 capitalize transition-colors duration-400 ${isActive ? "text-foreground font-semibold" : "text-muted-foreground group-hover:text-foreground/70"}`}>
                  {dept.name}
                </span>
                <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden relative backdrop-blur-sm shadow-inner">
                  <motion.div
                    className={`absolute left-0 top-0 bottom-0 rounded-full overflow-hidden bg-linear-to-r ${c.bar}`}
                    initial={{ width: "0%" }}
                    animate={{ width: `${dept.fill}%`, opacity: isActive ? 1 : 0.25 }}
                    transition={{ width: { duration: 1.2, delay: i * 0.1, type: "spring", bounce: 0.2 }, opacity: { duration: 0.4 } }}
                  >
                    {isActive && (
                      <motion.div className="absolute inset-y-0 left-0 w-full bg-linear-to-r from-transparent via-white/50 to-transparent"
                        initial={{ x: "-100%" }} animate={{ x: "100%" }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                      />
                    )}
                  </motion.div>
                </div>
                <div className={`flex items-center gap-1.5 w-10 justify-end transition-all duration-500 ${isActive ? "opacity-100 scale-105" : "opacity-60 scale-100"}`}>
                  <span className={`text-[9px] font-mono font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>{dept.members}</span>
                  {isActive && (
                    <motion.div className={`w-1 h-1 rounded-full ${c.dot}`}
                      animate={{ opacity: [1, 0.2, 1], scale: [1, 1.5, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-2 pt-3 mt-auto">
          <div className="relative flex items-center justify-center w-2 h-2">
            <motion.div className="absolute inset-0 rounded-full bg-emerald-400/40"
              animate={{ scale: [1, 2.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            />
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
          <span className="text-[8px] font-mono text-muted-foreground font-medium tracking-wide">Live team activity</span>
        </div>
      </div>

      <div className="w-px bg-border/30 self-stretch shrink-0" />

      {/* Right panel: Recent tasks log */}
      <div className="w-43 shrink-0 flex flex-col gap-0">
        <p className="text-[8px] font-mono uppercase tracking-widest text-muted-foreground mb-2.5">Recent Tasks</p>
        <div className="flex flex-col gap-1.5 flex-1 overflow-hidden">
          {recentQueries.map((q, qi) => {
            const c = DEPT_COLORS[q.dept];
            return (
              <motion.div
                key={`${q.dept}-${q.q}-${qi}`}
                className="rounded-xl border border-border/40 bg-muted/20 dark:bg-neutral-950/80 px-2.5 py-2"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: qi === 0 ? 1 : qi === 1 ? 0.8 : qi === 2 ? 0.5 : 0.25, y: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 35, delay: qi * 0.05 }}
              >
                <div className="flex items-center gap-1 mb-1">
                  <span className={`text-[6.5px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded-md ${c.badge}`}>{q.dept}</span>
                  <span className="text-[7px] font-mono text-muted-foreground/50 ml-auto tabular-nums">{q.t}</span>
                </div>
                <p className="text-[8px] text-foreground/75 leading-tight font-mono truncate">{q.q}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Card5 – Task Status Board
───────────────────────────────────────────── */
function TaskCard5() {
  const statuses = [
    { name: "completed", count: 47, icon: CheckCircle, latency: "on time", color: "bg-gradient-to-b from-emerald-400 to-emerald-600", borderColor: "border-emerald-600" },
    { name: "in_progress", count: 12, icon: Clock, latency: "active", color: "bg-gradient-to-b from-blue-400 to-blue-600", borderColor: "border-blue-600" },
    { name: "overdue", count: 5, icon: Warning, latency: "attention", color: "bg-gradient-to-b from-rose-400 to-rose-600", borderColor: "border-rose-600" },
    { name: "not_started", count: 18, icon: Hourglass, latency: "queued", color: "bg-gradient-to-b from-zinc-400 to-zinc-600", borderColor: "border-zinc-600" },
  ];

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="grid grid-cols-2 gap-2 w-full">
        {statuses.map((s, i) => (
          <motion.div
            key={i}
            className="relative rounded-[16px] border border-border/50 bg-background dark:bg-neutral-950/50 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between p-2.5 group hover:border-border"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, type: "spring", stiffness: 300, damping: 25 }}
          >
            <div className="flex items-start justify-between">
              <div className={`w-7 h-7 rounded-[8px] flex items-center justify-center text-white ${s.color} border ${s.borderColor} shadow-[inset_0_0.5px_0_0_rgba(255,255,255,0.6),inset_0.5px_0_0_0_rgba(255,255,255,0.2),inset_0_2px_6px_0_rgba(255,255,255,0.3),inset_0_-0.5px_0_0_rgba(0,0,0,0.3),inset_-0.5px_0_0_0_rgba(0,0,0,0.1),inset_0_-2px_6px_0_rgba(0,0,0,0.1),0_1px_2px_0_rgba(0,0,0,0.08),0_2px_4px_0_rgba(0,0,0,0.06),0_4px_6px_0_rgba(0,0,0,0.04)] group-hover:scale-105 transition-transform duration-300`}>
                <s.icon weight="fill" className="w-3.5 h-3.5 relative z-10" />
              </div>
              <div className="flex flex-col items-end gap-0.5 mt-0.5">
                <span className="text-[12px] font-mono font-bold text-foreground leading-none">{s.count}</span>
                <span className="text-[7px] font-mono text-muted-foreground/80 uppercase tracking-widest leading-none">Tasks</span>
              </div>
            </div>
            <div className="mt-2 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-medium text-foreground tracking-tight">{s.name.replace("_", " ")}</span>
                <span className="text-[8px] font-mono text-muted-foreground tabular-nums">{s.latency}</span>
              </div>
              <div className="w-full h-1.5 bg-muted/50 rounded-full overflow-hidden shadow-inner relative">
                <motion.div
                  className={`absolute left-0 top-0 bottom-0 rounded-full ${s.color}`}
                  initial={{ width: "0%" }}
                  animate={{ width: `${(s.count / 47) * 100}%` }}
                  transition={{ delay: 0.4 + i * 0.1, duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Task Bento Grid
───────────────────────────────────────────── */
const TASK_CARDS = [
  {
    title: "Dependency Graph",
    description: "Visualise task dependencies and blocking chains powered by graph traversal.",
    visual: <TaskCard1 />,
    colSpan: "lg:col-span-1",
    height: "h-[260px]",
  },
  {
    title: "Performance Scores",
    description: "Track team completion rates and performance scores in real time.",
    visual: <TaskCard2 />,
    colSpan: "lg:col-span-1",
    height: "h-[260px]",
  },
  {
    title: "Live Notifications",
    description: "Stay on top of assignments, deadlines, and team updates instantly.",
    visual: <TaskCard3 />,
    colSpan: "lg:col-span-1",
    height: "h-[260px]",
  },
  {
    title: "Department Overview",
    description: "Monitor team activity across departments with real-time task feeds.",
    visual: <TaskCard4 />,
    colSpan: "lg:col-span-2",
    height: "h-[260px]",
  },
  {
    title: "Status Board",
    description: "At-a-glance view of task statuses across your entire organisation.",
    visual: <TaskCard5 />,
    colSpan: "lg:col-span-1",
    height: "h-[260px]",
  },
];

export interface TaskBentoGridProps {
  className?: string;
}

export function TaskBentoGrid({ className }: TaskBentoGridProps) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 w-full max-w-5xl mx-auto", className)}>
      {TASK_CARDS.map((card, idx) => (
        <FeatCard
          key={idx}
          title={card.title}
          description={card.description}
          className={cn(card.colSpan, card.height)}
        >
          {card.visual}
        </FeatCard>
      ))}
    </div>
  );
}

export default TaskBentoGrid;
