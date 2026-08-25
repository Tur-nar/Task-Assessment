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
import type { UserWithRelations } from "@/types/api";

interface DeleteStaffAlertProps {
    user: UserWithRelations | null;
    onClose: () => void;
}

export function DeleteStaffAlert({ user, onClose }: DeleteStaffAlertProps) {
    const deleteUser = useDeleteUser();
    const open = !!user;

    const handleDelete = () => {
        if (!user) return;

        deleteUser.mutate(user.u.id, {
            onSuccess: (response) => {
                toast.success(response.message || "Staff member deleted");
                onClose();
            },
            onError: (error: any) => {
                toast.error(
                    error?.response?.data?.message ||
                    "Cannot delete this user. They may have active tasks."
                );
            },
        });
    };

    return (
        <AlertDialog open={open} onOpenChange={(o) => !o && onClose()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete staff member?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete{" "}
                        <span className="font-medium text-foreground">
                            {user?.u.firstName} {user?.u.lastName}
                        </span>
                        &apos;s account. This action cannot be undone. If this user has
                        active tasks, the deletion will be blocked.
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
