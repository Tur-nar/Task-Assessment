"use client";

import { useState, useMemo } from "react";
import { motion, type Variants } from "framer-motion";
import { Plus, Search, Shield, Users, Building2, MoreHorizontal, Eye, ArrowRightLeft, UserX, UserCheck, Trash2, Filter, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { useSupervisors, useToggleUserStatus, useDepartments } from "@/hooks/use-users";
import { CreateSupervisorDialog } from "@/components/dashboard/supervisors/create-supervisor-dialog";
import { EditSupervisorDialog } from "@/components/dashboard/supervisors/edit-supervisor-dialog";
import { ReassignTeamDialog } from "@/components/dashboard/supervisors/reassign-team-dialog";
import { ViewSupervisorSheet } from "@/components/dashboard/supervisors/view-supervisor-sheet";
import { DeleteSupervisorAlert } from "@/components/dashboard/supervisors/delete-supervisor-alert";
import type { SupervisorWithTeam } from "@/types/api";
import { useCurrentUser } from "@/hooks/use-auth";

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

const AVATAR_ACCENTS = [
  "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
];

export default function SupervisorsPage() {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [viewSupervisor, setViewSupervisor] = useState<SupervisorWithTeam | null>(null);
  const [editSupervisor, setEditSupervisor] = useState<SupervisorWithTeam | null>(null);
  const [reassignSupervisor, setReassignSupervisor] = useState<SupervisorWithTeam | null>(null);
  const [deleteSupervisor, setDeleteSupervisor] = useState<SupervisorWithTeam | null>(null);
  const { data: supervisors, isLoading } = useSupervisors();
  const { data: departments } = useDepartments();
  const { data: currentUser } = useCurrentUser();

  const toggleStatus = useToggleUserStatus();

  const filtered = useMemo(() => {
    if (!supervisors) return [];
    return supervisors.filter((sup) => {
      const u = sup.u;
      const d = sup.d;
      const matchesSearch =
        search === "" ||
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (d && d.name.toLowerCase().includes(search.toLowerCase())) ||
        (sup.teamMembers &&
          sup.teamMembers.some((m) =>
            `${m.firstName} ${m.lastName}`.toLowerCase().includes(search.toLowerCase())
          ));

      const matchesDept =
        deptFilter === "all" || (d && d.id === deptFilter);

      return matchesSearch && matchesDept;
    });
  }, [supervisors, search, deptFilter]);

  const handleToggleStatus = (sup: SupervisorWithTeam) => {
    const nextStatus = sup.u.status === "active" ? "inactive" : "active";
    toggleStatus.mutate(
      { id: sup.u.id, status: nextStatus },
      {
        onSuccess: () => {
          toast.success(
            `Supervisor set to ${nextStatus === "active" ? "Active" : "Inactive"}`
          );
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || "Failed to update status");
        },
      }
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Supervisors</h1>
          <p className="text-sm text-muted-foreground">
            Manage team leads, reporting relationships, and direct reports
          </p>
        </div>
        {(currentUser?.role === 'super_admin' || currentUser?.role === 'admin') && (
          <Button size={"sm"} onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Add Supervisor
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search supervisors by name, email, department, or team members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={deptFilter} onValueChange={(v) => setDeptFilter(v ?? "all")}>
            <SelectTrigger className="w-full sm:w-45">
              <Filter className="mr-2 size-3.5 text-muted-foreground" />
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments?.map((dept) => (
                <SelectItem key={dept.d.id} value={dept.d.id}>
                  {dept.d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden p-6">
              <div className="flex items-center gap-3">
                <Skeleton className="size-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
              <Skeleton className="mt-4 h-10 w-full" />
              <div className="mt-4 flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
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
                  <Shield className="size-5" />
                </EmptyMedia>
                <EmptyTitle>No supervisors found</EmptyTitle>
                <EmptyDescription>
                  {search || deptFilter !== "all"
                    ? "No supervisors matched your current search filters."
                    : "Add your first supervisor to build your reporting hierarchy."}
                </EmptyDescription>
                <Button onClick={() => setCreateOpen(true)} className="mt-4 gap-2">
                  <Plus className="size-4" />
                  Add Supervisor
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
          {filtered.map((sup, index) => {
            const { u, d, teamMembers = [] } = sup;
            const accentClass = AVATAR_ACCENTS[index % AVATAR_ACCENTS.length];
            const initials = `${u.firstName.charAt(0)}${u.lastName.charAt(0)}`.toUpperCase();

            return (
              <motion.div key={u.id} variants={cardVariants}>
                <Card className="group relative flex h-full flex-col justify-between overflow-hidden transition-all duration-300 hover:shadow-md hover:border-foreground/20">
                  <CardHeader className="relative pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-11 border">
                          <AvatarFallback className="bg-foreground text-background text-sm font-semibold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <CardTitle className="truncate text-base font-semibold">
                            {u.firstName} {u.lastName}
                          </CardTitle>
                          <p className="truncate text-xs text-muted-foreground">
                            {u.email}
                          </p>
                        </div>
                      </div>

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
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => setViewSupervisor(sup)}>
                            <Eye className="mr-2 size-4" />
                            View profile & tree
                          </DropdownMenuItem>
                          {(currentUser?.role === 'super_admin' || currentUser?.role === 'admin') && (
                            <>
                              <DropdownMenuItem onClick={() => setEditSupervisor(sup)}>
                                <Pencil className="mr-2 size-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setReassignSupervisor(sup)}>
                                <ArrowRightLeft className="mr-2 size-4" />
                                Reassign team
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleStatus(sup)}>
                                {u.status === "active" ? (
                                  <>
                                    <UserX className="mr-2 size-4" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="mr-2 size-4" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeleteSupervisor(sup)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 size-4" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {d ? (
                        <Badge variant="secondary" className="gap-1 text-[10px]">
                          <Building2 className="size-3" />
                          {d.name}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">
                          No Department
                        </Badge>
                      )}
                      <Badge
                        variant="secondary"
                        className={`text-[10px] ${u.status === "active"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground"
                          }`}
                      >
                        {u.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-1">
                    <div className="space-y-2 rounded-lg border bg-muted/20 p-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
                          <Users className="size-3.5" />
                          Direct Reports
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {teamMembers.length} member{teamMembers.length === 1 ? "" : "s"}
                        </Badge>
                      </div>

                      {teamMembers.length > 0 ? (
                        <div className="flex items-center gap-1 overflow-hidden pt-1">
                          <div className="flex -space-x-2 overflow-hidden">
                            {teamMembers.slice(0, 5).map((member) => (
                              <Avatar
                                key={member.id}
                                className={`inline-block size-6 border-2 border-background ring-1 ring-border ${accentClass}`}
                              >
                                <AvatarFallback className="bg-foreground/5 text-[9px] font-medium">
                                  {member.firstName.charAt(0)}
                                  {member.lastName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                          {teamMembers.length > 5 && (
                            <span className="text-[10px] font-medium text-muted-foreground pl-1.5">
                              +{teamMembers.length - 5} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-[11px] italic text-muted-foreground pt-0.5">
                          No team members assigned yet
                        </p>
                      )}
                    </div>

                    {/* Card Footer Actions */}
                    <div className="flex items-center justify-between border-t pt-3 text-xs">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewSupervisor(sup)}
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        View hierarchy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReassignSupervisor(sup)}
                        className="h-7 gap-1 px-2 text-xs"
                      >
                        <ArrowRightLeft className="size-3" />
                        Reassign
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <CreateSupervisorDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      <EditSupervisorDialog
        supervisor={editSupervisor}
        open={!!editSupervisor}
        onOpenChange={(open) => !open && setEditSupervisor(null)}
      />
      <ReassignTeamDialog
        supervisor={reassignSupervisor}
        onClose={() => setReassignSupervisor(null)}
      />
      <ViewSupervisorSheet
        supervisor={viewSupervisor}
        onClose={() => setViewSupervisor(null)}
      />
      <DeleteSupervisorAlert
        supervisor={deleteSupervisor}
        onClose={() => setDeleteSupervisor(null)}
      />
    </motion.div>
  );
}
