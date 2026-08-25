"use client";

import {
  Building2,
  Users,
  Shield,
  Mail,
  CheckCircle2,
  ClipboardList,
  Calendar,
  Sparkles,
} from "lucide-react";
import { formatSafeDate } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDepartment } from "@/hooks/use-departments";
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

interface ViewDepartmentSheetProps {
  departmentId: string | null;
  onClose: () => void;
}

function DepartmentDetailContent({ departmentId }: { departmentId: string }) {
  const { data: dept, isLoading } = useDepartment(departmentId);

  if (isLoading) {
    return (
      <div className="space-y-6 p-1">
        <div className="flex items-center gap-4">
          <Skeleton className="size-14 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-60" />
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

  if (!dept || !dept.d) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Department not found
      </p>
    );
  }

  const { d, head, staff } = dept;
  const staffList = staff || [];

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex items-center gap-4">
        <div className="flex aspect-square size-14 items-center justify-center rounded-xl bg-foreground/10 text-foreground">
          <Building2 className="size-7" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold">{d.name}</h3>
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {d.description || "No description provided"}
          </p>
        </div>
      </div>

      <Separator />

      {/* Department Head */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Department Head
        </h4>
        {head ? (
          <div className="flex items-center gap-3 rounded-lg border bg-muted/20 p-3">
            <Avatar className="size-10">
              <AvatarFallback className="bg-foreground text-background text-xs font-semibold">
                {head.firstName.charAt(0)}
                {head.lastName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                {head.firstName} {head.lastName}
              </p>
              {head.email && (
                <p className="truncate text-xs text-muted-foreground">
                  {head.email}
                </p>
              )}
            </div>
            <Badge variant="secondary" className="text-[10px]">
              Head
            </Badge>
          </div>
        ) : (
          <p className="text-xs italic text-muted-foreground">
            No department head currently assigned.
          </p>
        )}
      </div>

      <Separator />

      {/* Staff Members List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Team Members ({staffList.length})
          </h4>
        </div>

        {staffList.length > 0 ? (
          <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {staffList.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border bg-muted/10 p-2.5 transition-colors hover:bg-muted/20"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-foreground/5 text-[11px] font-medium">
                      {member.firstName.charAt(0)}
                      {member.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">
                      {member.firstName} {member.lastName}
                    </p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {member.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant="outline" className="text-[9px] capitalize">
                    {member.role.replace("_", " ")}
                  </Badge>
                  <span
                    className={`size-1.5 rounded-full ${
                      member.status === "active"
                        ? "bg-emerald-500"
                        : "bg-muted-foreground/40"
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs italic text-muted-foreground">
            No staff members currently assigned to this department.
          </p>
        )}
      </div>
    </div>
  );
}

export function ViewDepartmentSheet({
  departmentId,
  onClose,
}: ViewDepartmentSheetProps) {
  const isMobile = useIsMobile();
  const open = !!departmentId;

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Department Overview</DrawerTitle>
            <DrawerDescription>
              View department details and team roster
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6">
            {departmentId && (
              <DepartmentDetailContent departmentId={departmentId} />
            )}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Department Overview</SheetTitle>
          <SheetDescription>
            View department details and team roster
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          {departmentId && (
            <DepartmentDetailContent departmentId={departmentId} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
