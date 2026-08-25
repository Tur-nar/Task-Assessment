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
import { useDeleteDepartment } from "@/hooks/use-departments";
import type { DepartmentWithStats } from "@/types/api";

interface DeleteDepartmentAlertProps {
  department: DepartmentWithStats | null;
  onClose: () => void;
}

export function DeleteDepartmentAlert({
  department,
  onClose,
}: DeleteDepartmentAlertProps) {
  const deleteDepartment = useDeleteDepartment();
  const open = !!department;

  const handleDelete = () => {
    if (!department) return;

    deleteDepartment.mutate(department.d.id, {
      onSuccess: (response) => {
        toast.success(response?.message || "Department deleted successfully");
        onClose();
      },
      onError: (error: any) => {
        toast.error(
          error?.response?.data?.message ||
            "Cannot delete a department with assigned staff members or tasks."
        );
      },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete department?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove the{" "}
            <span className="font-semibold text-foreground">
              {department?.d.name}
            </span>{" "}
            department. This action cannot be undone. Departments with active staff
            members cannot be deleted until staff are reassigned.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteDepartment.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
          >
            {deleteDepartment.isPending && (
              <Loader2 className="size-4 animate-spin" />
            )}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
