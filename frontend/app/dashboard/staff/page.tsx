"use client";

import { useState, useMemo } from "react";
import { motion, type Variants } from "framer-motion";
import { Plus, Search, Filter, MoreHorizontal, Eye, UserX, Trash2, Shield, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { useUsers, useToggleUserStatus } from "@/hooks/use-users";
import { CreateStaffDialog } from "@/components/dashboard/staff/create-staff-dialog";
import { EditStaffDialog } from "@/components/dashboard/staff/edit-staff-dialog";
import { ViewStaffSheet } from "@/components/dashboard/staff/view-staff-sheet";
import { DeleteStaffAlert } from "@/components/dashboard/staff/delete-staff-alert";
import { toast } from "sonner";
import type { UserRole, UserWithRelations } from "@/types/api";
import { useCurrentUser } from "@/hooks/use-auth";

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.04 },
    },
};

const rowVariants: Variants = {
    hidden: { opacity: 0, y: 8 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.35, ease: "easeOut" },
    },
};

const roleConfig: Record<UserRole, { label: string; className: string }> = {
    super_admin: { label: "Super Admin", className: "bg-foreground text-background" },
    admin: { label: "Admin", className: "bg-foreground/80 text-background" },
    supervisor: { label: "Supervisor", className: "bg-foreground/10 text-foreground" },
    staff: { label: "Staff", className: "bg-muted text-muted-foreground" },
};

export default function StaffPage() {
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [createOpen, setCreateOpen] = useState(false);
    const [viewUserId, setViewUserId] = useState<string | null>(null);
    const [editUser, setEditUser] = useState<UserWithRelations | null>(null);
    const [deleteUser, setDeleteUser] = useState<UserWithRelations | null>(null);
    const { data: currentUser, isLoading: isLoadingUser } = useCurrentUser();

    const { data: users, isLoading } = useUsers();
    const toggleStatus = useToggleUserStatus();

    const filtered = useMemo(() => {
        if (!users) return [];
        return users.filter((item) => {
            const u = item.u;
            const matchesSearch =
                search === "" ||
                `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
                u.email.toLowerCase().includes(search.toLowerCase());
            const matchesRole = roleFilter === "all" || u.role === roleFilter;
            const matchesStatus = statusFilter === "all" || u.status === statusFilter;
            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [users, search, roleFilter, statusFilter]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6"
        >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Staff Management</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage your team members, roles, and permissions
                    </p>
                </div>
                {currentUser?.role !== "staff" && (
                    <Button size={"sm"} onClick={() => setCreateOpen(true)}>
                        <Plus className="size-4" />
                        Add Staff
                    </Button>
                )}
            </div>

            <Card>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v ?? "all")}>
                            <SelectTrigger className="w-35">
                                <Filter className="mr-2 size-3.5 text-muted-foreground" />
                                <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                <SelectItem value="super_admin">Super Admin</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="supervisor">Supervisor</SelectItem>
                                <SelectItem value="staff">Staff</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
                            <SelectTrigger className="w-32.5">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {isLoading ? (
                <Card>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="flex items-center gap-4 px-6 py-4">
                                    <Skeleton className="size-9 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-45" />
                                        <Skeleton className="h-3 w-55" />
                                    </div>
                                    <Skeleton className="h-5 w-16" />
                                    <Skeleton className="h-5 w-20" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ) : filtered.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="py-16">
                        <Empty>
                            <EmptyHeader>
                                <EmptyMedia variant="icon">
                                    <Shield className="size-5" />
                                </EmptyMedia>
                                <EmptyTitle>No staff found</EmptyTitle>
                                <EmptyDescription>
                                    {search || roleFilter !== "all" || statusFilter !== "all"
                                        ? "Try adjusting your filters to find what you're looking for."
                                        : "Get started by adding your first team member."}
                                </EmptyDescription>
                                <Button onClick={() => setCreateOpen(true)} className="mt-4">
                                    <Plus className="size-4" />
                                    Add Staff
                                </Button>
                            </EmptyHeader>
                        </Empty>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <div className="hidden border-b px-6 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground sm:flex">
                            <div className="flex-1">Member</div>
                            <div className="w-28 text-center">Role</div>
                            <div className="w-32 text-center">Department</div>
                            <div className="w-24 text-center">Status</div>
                            <div className="w-12" />
                        </div>

                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            className="divide-y"
                        >
                            {filtered.map((item) => {
                                const { u, d } = item;
                                const role = roleConfig[u.role];
                                const initials = `${u.firstName.charAt(0)}${u.lastName.charAt(0)}`.toUpperCase();

                                return (
                                    <motion.div
                                        key={u.id}
                                        variants={rowVariants}
                                        className={`
                                            flex flex-col gap-3 px-6 py-4 transition-colors hover:bg-muted/20 sm:flex-row sm:items-center sm:gap-4
                                            ${currentUser?.id === u.id ? "bg-muted/50 hover:bg-bg-muted/50" : ""}
                                        `}
                                    >
                                        <div className="flex flex-1 items-center gap-3 hover:underline cursor-pointer" onClick={() => setViewUserId(u.id)}>
                                            <Avatar className="size-9 shrink-0">
                                                <AvatarFallback className="bg-foreground/5 text-xs font-medium">
                                                    {initials}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium">
                                                    {currentUser?.id === u.id ? "You" : `${u.firstName} ${u.lastName}`}
                                                </p>
                                                <p className="truncate text-xs text-muted-foreground">
                                                    {u.email}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="w-28 text-center">
                                            <Badge
                                                variant="secondary"
                                                className={`text-[10px] ${role.className}`}
                                            >
                                                {role.label}
                                            </Badge>
                                        </div>

                                        <div className="w-32 text-center">
                                            <span className="text-xs text-muted-foreground">
                                                {d?.name ?? "—"}
                                            </span>
                                        </div>

                                        <div className="w-24 text-center">
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

                                        {(currentUser?.role === 'super_admin' || currentUser?.role === 'admin') && (
                                            <div className="w-12 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8" />}>
                                                        <MoreHorizontal className="size-4" />
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-44">
                                                        <DropdownMenuItem
                                                            onClick={() => setViewUserId(u.id)}
                                                        >
                                                            <Eye className="mr-2 size-4" />
                                                            View details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => setEditUser(item)}
                                                        >
                                                            <Pencil className="mr-2 size-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                const nextStatus =
                                                                    u.status === "active"
                                                                        ? "inactive"
                                                                        : "active";
                                                                toggleStatus.mutate(
                                                                    {
                                                                        id: u.id,
                                                                        status: nextStatus,
                                                                    },
                                                                    {
                                                                        onSuccess: () => {
                                                                            toast.success(
                                                                                `Staff member set to ${nextStatus === "active"
                                                                                    ? "Active"
                                                                                    : "Inactive"
                                                                                }`
                                                                            );
                                                                        },
                                                                        onError: (err: any) => {
                                                                            toast.error(
                                                                                err?.response?.data?.message ||
                                                                                "Failed to update staff status"
                                                                            );
                                                                        },
                                                                    }
                                                                );
                                                            }}
                                                        >
                                                            <UserX className="mr-2 size-4" />
                                                            {u.status === "active"
                                                                ? "Deactivate"
                                                                : "Activate"}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => setDeleteUser(item)}
                                                            className="text-destructive focus:text-destructive"
                                                        >
                                                            <Trash2 className="mr-2 size-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    </CardContent>
                </Card>
            )}

            <CreateStaffDialog open={createOpen} onOpenChange={setCreateOpen} />
            <EditStaffDialog
                user={editUser}
                open={!!editUser}
                onOpenChange={(open) => !open && setEditUser(null)}
            />
            <ViewStaffSheet userId={viewUserId} onClose={() => setViewUserId(null)} />
            <DeleteStaffAlert
                user={deleteUser}
                onClose={() => setDeleteUser(null)}
            />
        </motion.div>
    );
}
