"use client";

import { useState } from "react";
import { Loader2, ArrowRightLeft, UserCheck } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useReassignSupervisor, useSupervisors } from "@/hooks/use-users";
import type { SupervisorWithTeam } from "@/types/api";

interface ReassignTeamDialogProps {
  supervisor: SupervisorWithTeam | null;
  onClose: () => void;
}

export function ReassignTeamDialog({
  supervisor,
  onClose,
}: ReassignTeamDialogProps) {
  const reassignMutation = useReassignSupervisor();
  const { data: allSupervisors } = useSupervisors();

  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [targetSupervisorId, setTargetSupervisorId] = useState<string>("");

  const open = !!supervisor;
  const teamMembers = supervisor?.teamMembers || [];

  // Filter out the current supervisor from target options
  const targetSupervisorOptions = (allSupervisors || []).filter(
    (s) => s.u.id !== supervisor?.u.id
  );

  const toggleSelectMember = (id: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedMemberIds(teamMembers.map((m) => m.id));
  };

  const clearAll = () => {
    setSelectedMemberIds([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSupervisorId) {
      toast.error("Please select a target supervisor");
      return;
    }
    if (selectedMemberIds.length === 0) {
      toast.error("Please select at least one team member to reassign");
      return;
    }

    reassignMutation.mutate(
      {
        memberIds: selectedMemberIds,
        newSupervisorId: targetSupervisorId,
      },
      {
        onSuccess: (res) => {
          toast.success(res.message || "Team members reassigned successfully");
          setSelectedMemberIds([]);
          setTargetSupervisorId("");
          onClose();
        },
        onError: (err: any) => {
          toast.error(
            err?.response?.data?.message || "Failed to reassign team members"
          );
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="size-4" />
            Reassign Team Members
          </DialogTitle>
          <DialogDescription>
            Transfer direct reports from{" "}
            <span className="font-semibold text-foreground">
              {supervisor?.u.firstName} {supervisor?.u.lastName}
            </span>{" "}
            to another supervisor.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target Supervisor Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs">Select New Supervisor</Label>
            <Select
              value={targetSupervisorId}
              onValueChange={(v) => setTargetSupervisorId(v ? String(v) : "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select receiving supervisor" />
              </SelectTrigger>
              <SelectContent>
                {targetSupervisorOptions.map((sup) => (
                  <SelectItem key={sup.u.id} value={sup.u.id}>
                    {sup.u.firstName} {sup.u.lastName} (
                    {sup.d?.name || "No Dept"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Members Selection List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">
                Select Members to Transfer ({selectedMemberIds.length}/
                {teamMembers.length})
              </Label>
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs text-muted-foreground underline hover:text-foreground"
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs text-muted-foreground underline hover:text-foreground"
                >
                  None
                </button>
              </div>
            </div>

            {teamMembers.length > 0 ? (
              <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-md border p-2">
                {teamMembers.map((member) => {
                  const isSelected = selectedMemberIds.includes(member.id);
                  return (
                    <div
                      key={member.id}
                      onClick={() => toggleSelectMember(member.id)}
                      className={`flex cursor-pointer items-center justify-between rounded-md p-2 text-xs transition-colors ${isSelected
                          ? "bg-accent font-medium text-accent-foreground"
                          : "hover:bg-muted/40"
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="size-6">
                          <AvatarFallback className="text-[9px]">
                            {member.firstName.charAt(0)}
                            {member.lastName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          {member.firstName} {member.lastName}
                        </span>
                      </div>
                      <Badge
                        variant={isSelected ? "default" : "outline"}
                        className="text-[9px] py-0 px-1.5"
                      >
                        {isSelected ? "Selected" : "Select"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="py-4 text-center text-xs italic text-muted-foreground">
                This supervisor currently has no team members assigned.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                reassignMutation.isPending ||
                selectedMemberIds.length === 0 ||
                !targetSupervisorId
              }
              className="gap-2"
            >
              {reassignMutation.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Reassign {selectedMemberIds.length} Member(s)
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
