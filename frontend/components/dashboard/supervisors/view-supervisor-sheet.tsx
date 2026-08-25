"use client";

import { Shield, Building2, Users, Mail, ArrowUp, UserCheck, Calendar, Network } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useReportingChain } from "@/hooks/use-users";
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
import type { SupervisorWithTeam } from "@/types/api";

interface ViewSupervisorSheetProps {
  supervisor: SupervisorWithTeam | null;
  onClose: () => void;
}

function SupervisorDetailContent({
  supervisor,
}: {
  supervisor: SupervisorWithTeam;
}) {
  const { u, d, teamMembers } = supervisor;
  const { data: chain, isLoading: chainLoading } = useReportingChain(u.id);

  const initials = `${u.firstName.charAt(0)}${u.lastName.charAt(0)}`.toUpperCase();

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="flex items-center gap-4">
        <Avatar className="size-14">
          <AvatarFallback className="bg-foreground text-background text-base font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold">
              {u.firstName} {u.lastName}
            </h3>
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
          <p className="truncate text-xs text-muted-foreground">{u.email}</p>
          {d && (
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Building2 className="size-3" />
              <span>{d.name} Department</span>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Reporting Hierarchy Chain (Graph traversal) */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Network className="size-3.5" />
          <span>Reporting Chain (Graph Tree)</span>
        </div>

        {chainLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ) : chain && chain.length > 0 ? (
          <div className="space-y-2">
            {/* Top Root Manager(s) in reverse order of depth */}
            {[...chain].reverse().map((node, idx) => (
              <div key={node.manager.id} className="space-y-1.5">
                <div className="flex items-center justify-between rounded-lg border bg-muted/20 p-2.5">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="size-7">
                      <AvatarFallback className="text-[10px] bg-foreground/10">
                        {node.manager.firstName.charAt(0)}
                        {node.manager.lastName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs font-medium">
                        {node.manager.firstName} {node.manager.lastName}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {node.manager.email}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[9px] capitalize">
                    {node.manager.role.replace("_", " ")} (L{node.depth})
                  </Badge>
                </div>
                {/* Visual arrow down */}
                <div className="flex justify-center">
                  <ArrowUp className="size-3 rotate-180 text-muted-foreground/50" />
                </div>
              </div>
            ))}

            {/* Current Supervisor Node */}
            <div className="flex items-center justify-between rounded-lg border-2 border-foreground/20 bg-background p-2.5 shadow-xs">
              <div className="flex items-center gap-2.5">
                <Avatar className="size-7">
                  <AvatarFallback className="bg-foreground text-background text-[10px] font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs font-semibold">
                    {u.firstName} {u.lastName}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    This Supervisor (Direct Lead)
                  </p>
                </div>
              </div>
              <Badge className="text-[9px]">Supervisor</Badge>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
            No upstream manager assigned (reports directly to Super Admin).
          </div>
        )}
      </div>

      <Separator />

      {/* Team Roster / Direct Reports */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Users className="size-3.5" />
            <span>Direct Reports ({teamMembers?.length || 0})</span>
          </div>
        </div>

        {teamMembers && teamMembers.length > 0 ? (
          <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border bg-muted/10 p-2.5 transition-colors hover:bg-muted/20"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar className="size-8">
                    <AvatarFallback className="text-[11px] font-medium bg-foreground/5">
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
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[9px]">
                    Staff
                  </Badge>
                  <span
                    className={`size-1.5 rounded-full ${member.status === "active"
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
            No direct reports currently assigned to this supervisor.
          </p>
        )}
      </div>
    </div>
  );
}

export function ViewSupervisorSheet({
  supervisor,
  onClose,
}: ViewSupervisorSheetProps) {
  const isMobile = useIsMobile();
  const open = !!supervisor;

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Supervisor Profile</DrawerTitle>
            <DrawerDescription>
              Team structure and reporting hierarchy
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6 max-h-[80vh] overflow-y-auto">
            {supervisor && <SupervisorDetailContent supervisor={supervisor} />}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Supervisor Profile</SheetTitle>
          <SheetDescription>
            Team structure and reporting hierarchy
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 max-h-[calc(100vh-8rem)] overflow-y-auto pr-1">
          {supervisor && <SupervisorDetailContent supervisor={supervisor} />}
        </div>
      </SheetContent>
    </Sheet>
  );
}
