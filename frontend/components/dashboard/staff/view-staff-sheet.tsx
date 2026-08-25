"use client";

import { Mail, Building2, Shield, Calendar, User as UserIcon } from "lucide-react";
import { format } from "date-fns";

import { useIsMobile } from "@/hooks/use-mobile";
import { useUser } from "@/hooks/use-users";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";

interface ViewStaffSheetProps {
    userId: string | null;
    onClose: () => void;
}

function StaffDetail({ userId }: { userId: string }) {
    const { data: user, isLoading } = useUser(userId);

    if (isLoading) {
        return (
            <div className="space-y-6 p-1">
                <div className="flex items-center gap-4">
                    <Skeleton className="size-16 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-50" />
                    </div>
                </div>
                <Separator />
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <Skeleton className="size-4" />
                        <Skeleton className="h-4 w-45" />
                    </div>
                ))}
            </div>
        );
    }

    if (!user) {
        return (
            <p className="py-8 text-center text-sm text-muted-foreground">
                User not found
            </p>
        );
    }

    const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

    const roleLabel =
        user.role === "super_admin"
            ? "Super Admin"
            : user.role.charAt(0).toUpperCase() + user.role.slice(1);

    return (
        <div className="space-y-6">
            {/* Profile header */}
            <div className="flex items-center gap-4">
                <Avatar className="size-16">
                    <AvatarFallback className="bg-foreground text-background text-lg font-semibold">
                        {initials}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <h3 className="text-lg font-semibold">
                        {user.firstName} {user.lastName}
                    </h3>
                    <div className="mt-1 flex items-center gap-2">
                        <Badge
                            variant="secondary"
                            className={`text-[10px] ${user.status === "active"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "bg-muted text-muted-foreground"
                                }`}
                        >
                            {user.status === "active" ? "Active" : "Inactive"}
                        </Badge>
                    </div>
                </div>
            </div>

            <Separator />

            {/* Details */}
            <div className="space-y-4">
                <DetailRow icon={Mail} label="Email" value={user.email} />
                <DetailRow icon={Shield} label="Role" value={roleLabel} />
                <DetailRow
                    icon={Building2}
                    label="Department"
                    value={user.department?.name ?? "Unassigned"}
                />
                <DetailRow
                    icon={UserIcon}
                    label="Reports to"
                    value={
                        user.supervisor
                            ? `${user.supervisor.firstName} ${user.supervisor.lastName}`
                            : "None"
                    }
                />
                {user.createdAt && (
                    <DetailRow
                        icon={Calendar}
                        label="Joined"
                        value={format(new Date(user.createdAt), "MMM d, yyyy")}
                    />
                )}
            </div>
        </div>
    );
}

function DetailRow({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-start gap-3">
            <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium">{value}</p>
            </div>
        </div>
    );
}

export function ViewStaffSheet({ userId, onClose }: ViewStaffSheetProps) {
    const isMobile = useIsMobile();
    const open = !!userId;

    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>Staff Details</DrawerTitle>
                        <DrawerDescription>
                            View team member information
                        </DrawerDescription>
                    </DrawerHeader>
                    <div className="px-4 pb-6">
                        {userId && <StaffDetail userId={userId} />}
                    </div>
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Staff Details</SheetTitle>
                    <SheetDescription>
                        View team member information
                    </SheetDescription>
                </SheetHeader>
                <div className="mt-6">
                    {userId && <StaffDetail userId={userId} />}
                </div>
            </SheetContent>
        </Sheet>
    );
}
