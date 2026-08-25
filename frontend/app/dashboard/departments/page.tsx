"use client";

import { useState, useMemo } from "react";
import { motion, type Variants } from "framer-motion";
import {
  Plus,
  Search,
  Building2,
  Users,
  ClipboardList,
  CheckCircle2,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Cpu,
  Layers,
  Sparkles,
  Shield,
  Briefcase,
  FolderGit2,
  BarChart2,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { useDepartments } from "@/hooks/use-departments";
import { CreateDepartmentDialog } from "@/components/dashboard/departments/create-department-dialog";
import { EditDepartmentDialog } from "@/components/dashboard/departments/edit-department-dialog";
import { ViewDepartmentSheet } from "@/components/dashboard/departments/view-department-sheet";
import { DeleteDepartmentAlert } from "@/components/dashboard/departments/delete-department-alert";
import type { DepartmentWithStats } from "@/types/api";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

// Curated palette of icons and colors for department cards
const DEPARTMENT_THEMES = [
  {
    icon: Cpu,
    colorClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    gradientClass: "from-indigo-500/10 to-transparent",
  },
  {
    icon: Layers,
    colorClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    gradientClass: "from-emerald-500/10 to-transparent",
  },
  {
    icon: Sparkles,
    colorClass: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
    gradientClass: "from-violet-500/10 to-transparent",
  },
  {
    icon: BarChart2,
    colorClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    gradientClass: "from-amber-500/10 to-transparent",
  },
  {
    icon: FolderGit2,
    colorClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    gradientClass: "from-rose-500/10 to-transparent",
  },
  {
    icon: Briefcase,
    colorClass: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
    gradientClass: "from-cyan-500/10 to-transparent",
  },
];

function getDepartmentTheme(name: string, index: number) {
  const lower = name.toLowerCase();
  if (lower.includes("eng") || lower.includes("tech") || lower.includes("dev")) {
    return DEPARTMENT_THEMES[0];
  }
  if (lower.includes("ops") || lower.includes("operation")) {
    return DEPARTMENT_THEMES[1];
  }
  if (lower.includes("design") || lower.includes("product") || lower.includes("creative")) {
    return DEPARTMENT_THEMES[2];
  }
  if (lower.includes("finance") || lower.includes("sales") || lower.includes("growth")) {
    return DEPARTMENT_THEMES[3];
  }
  if (lower.includes("market") || lower.includes("brand")) {
    return DEPARTMENT_THEMES[4];
  }
  return DEPARTMENT_THEMES[index % DEPARTMENT_THEMES.length];
}

export default function DepartmentsPage() {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [viewDeptId, setViewDeptId] = useState<string | null>(null);
  const [editDept, setEditDept] = useState<DepartmentWithStats | null>(null);
  const [deleteDept, setDeleteDept] = useState<DepartmentWithStats | null>(null);

  const { data: departments, isLoading } = useDepartments();

  const filtered = useMemo(() => {
    if (!departments) return [];
    return departments.filter((dept) => {
      const d = dept.d;
      const matchesSearch =
        search === "" ||
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        (d.description && d.description.toLowerCase().includes(search.toLowerCase()));
      return matchesSearch;
    });
  }, [departments, search]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Departments</h1>
          <p className="text-sm text-muted-foreground">
            Manage organizational divisions, department heads, and task allocations
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="size-4" />
          Add Department
        </Button>
      </div>

      {/* Search Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search departments by name or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Department Cards Grid */}
      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden p-6">
              <div className="flex items-center gap-3">
                <Skeleton className="size-11 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="mt-4 h-12 w-full" />
              <div className="mt-4 flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Building2 className="size-5" />
                </EmptyMedia>
                <EmptyTitle>No departments found</EmptyTitle>
                <EmptyDescription>
                  {search
                    ? "No departments matched your search term."
                    : "Create your first department to organize teams and tasks."}
                </EmptyDescription>
                <Button onClick={() => setCreateOpen(true)} className="mt-4 gap-2">
                  <Plus className="size-4" />
                  Add Department
                </Button>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filtered.map((dept, index) => {
            const { d, head, staffCount = 0, totalTasks = 0, completedTasks = 0 } = dept;
            const theme = getDepartmentTheme(d.name, index);
            const Icon = theme.icon;

            const completionRate =
              totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            const headInitials = head
              ? `${head.firstName.charAt(0)}${head.lastName.charAt(0)}`.toUpperCase()
              : null;

            return (
              <motion.div key={d.id} variants={cardVariants}>
                <Card className="group relative flex h-full flex-col justify-between overflow-hidden transition-all duration-300 hover:shadow-md hover:border-foreground/20 hover:-translate-y-1">
                  {/* Subtle gradient banner */}
                  <div
                    className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${theme.gradientClass} opacity-60 pointer-events-none`}
                  />

                  <CardHeader className="relative pb-3">
                    <div className="flex items-start justify-between gap-2">
                      {/* Colored icon box */}
                      <div
                        className={`flex aspect-square size-11 items-center justify-center rounded-xl border transition-transform duration-300 group-hover:scale-105 ${theme.colorClass}`}
                      >
                        <Icon className="size-5" />
                      </div>

                      {/* Card Action Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-foreground"
                            />
                          }
                        >
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => setViewDeptId(d.id)}>
                            <Eye className="mr-2 size-4" />
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditDept(dept)}>
                            <Pencil className="mr-2 size-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteDept(dept)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 size-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="mt-3">
                      <CardTitle className="text-base font-semibold leading-tight">
                        {d.name}
                      </CardTitle>
                      <CardDescription className="mt-1 line-clamp-2 text-xs">
                        {d.description || "No description provided"}
                      </CardDescription>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-1">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/20 p-2.5">
                      <div className="flex items-center gap-2">
                        <Users className="size-3.5 text-muted-foreground" />
                        <div>
                          <p className="text-xs font-semibold">{staffCount}</p>
                          <p className="text-[10px] text-muted-foreground">Members</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <ClipboardList className="size-3.5 text-muted-foreground" />
                        <div>
                          <p className="text-xs font-semibold">{totalTasks}</p>
                          <p className="text-[10px] text-muted-foreground">Tasks</p>
                        </div>
                      </div>
                    </div>

                    {/* Completion rate bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[11px] text-muted-foreground">
                          Task Progress
                        </span>
                        <span className="font-medium text-foreground">
                          {completionRate}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-foreground transition-all duration-500 rounded-full"
                          style={{ width: `${completionRate}%` }}
                        />
                      </div>
                    </div>

                    {/* Department Head Footer */}
                    <div className="flex items-center justify-between border-t pt-3 text-xs">
                      <span className="text-[11px] text-muted-foreground">
                        Department Head:
                      </span>
                      {head && headInitials ? (
                        <div className="flex items-center gap-1.5">
                          <Avatar className="size-5">
                            <AvatarFallback className="bg-foreground text-background text-[9px] font-semibold">
                              {headInitials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium truncate max-w-[110px]">
                            {head.firstName} {head.lastName}
                          </span>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-muted-foreground">
                          Unassigned
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Dialogs and Sheets */}
      <CreateDepartmentDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      <EditDepartmentDialog
        department={editDept}
        onClose={() => setEditDept(null)}
      />
      <ViewDepartmentSheet
        departmentId={viewDeptId}
        onClose={() => setViewDeptId(null)}
      />
      <DeleteDepartmentAlert
        department={deleteDept}
        onClose={() => setDeleteDept(null)}
      />
    </motion.div>
  );
}
