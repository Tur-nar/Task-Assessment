"use client";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteUser } from "@/hooks/use-users";
import type { SupervisorWithTeam } from "@/types/api";

interface DeleteSupervisorAlertProps {
  supervisor: SupervisorWithTeam | null;
  onClose: () => void;
}

export function DeleteSupervisorAlert({
  supervisor,
  onClose,
}: DeleteSupervisorAlertProps) {
  const deleteUser = useDeleteUser();
  const open = !!supervisor;

  const handleDelete = () => {
    if (!supervisor) return;

    deleteUser.mutate(supervisor.u.id, {
      onSuccess: () => {
        toast.success("Supervisor deleted successfully");
        onClose();
      },
      onError: (error: any) => {
        toast.error(
          error?.response?.data?.message ||
            "Cannot delete supervisor with active assigned tasks or team members."
        );
      },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete supervisor account?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove the account for{" "}
            <span className="font-semibold text-foreground">
              {supervisor?.u.firstName} {supervisor?.u.lastName}
            </span>
            . If this supervisor has assigned team members, consider reassigning
            them first.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteUser.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
          >
            {deleteUser.isPending && (
              <Loader2 className="size-4 animate-spin" />
            )}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
