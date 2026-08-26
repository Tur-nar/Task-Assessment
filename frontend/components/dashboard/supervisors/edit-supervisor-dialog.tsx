"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateUser, useUser, useDepartments, useSupervisors } from "@/hooks/use-users";
import type { SupervisorWithTeam, UserRole } from "@/types/api";

const editSupervisorSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(["staff", "supervisor", "admin", "super_admin"] as const),
  departmentId: z.string().optional(),
  supervisorId: z.string().optional(),
});

type EditSupervisorForm = z.infer<typeof editSupervisorSchema>;

interface EditSupervisorDialogProps {
  supervisor: SupervisorWithTeam | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditSupervisorDialog({
  supervisor,
  open,
  onOpenChange,
}: EditSupervisorDialogProps) {
  const updateUser = useUpdateUser();
  const { data: userDetail } = useUser(supervisor ? supervisor.u.id : null);
  const { data: departments } = useDepartments();
  const { data: supervisors } = useSupervisors();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditSupervisorForm>({
    resolver: zodResolver(editSupervisorSchema),
  });

  const selectedRole = watch("role");

  useEffect(() => {
    if (supervisor && open) {
      const deptId = userDetail?.department?.id ?? supervisor.d?.id ?? "";
      const supId = userDetail?.supervisor?.id ?? "";

      reset({
        firstName: supervisor.u.firstName,
        lastName: supervisor.u.lastName,
        role: supervisor.u.role,
        departmentId: deptId,
        supervisorId: supId,
      });
    }
  }, [supervisor, userDetail, open, reset]);

  const onSubmit = (values: EditSupervisorForm) => {
    if (!supervisor) return;

    updateUser.mutate(
      {
        id: supervisor.u.id,
        payload: {
          firstName: values.firstName,
          lastName: values.lastName,
          role: values.role,
          departmentId:
            values.departmentId === "none" ? undefined : values.departmentId || undefined,
          supervisorId:
            values.role === "admin" ||
              values.role === "super_admin" ||
              values.supervisorId === "none"
              ? undefined
              : values.supervisorId || undefined,
        },
      },
      {
        onSuccess: (res) => {
          toast.success((res as any)?.message || "Supervisor updated successfully");
          onOpenChange(false);
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || "Failed to update supervisor");
        },
      }
    );
  };

  const availableSupervisors =
    supervisors?.filter((s) => s.u.id !== supervisor?.u.id) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Supervisor</DialogTitle>
          <DialogDescription>
            Update supervisor details, department, and role settings.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email (Read only) */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Email</Label>
            <Input
              value={supervisor?.u.email ?? ""}
              disabled
              className="bg-muted/40 text-muted-foreground cursor-not-allowed"
            />
          </div>

          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-sup-firstName" className="text-xs">
                First Name
              </Label>
              <Input
                id="edit-sup-firstName"
                placeholder="First name"
                {...register("firstName")}
              />
              {errors.firstName && (
                <p className="text-xs text-destructive">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-sup-lastName" className="text-xs">
                Last Name
              </Label>
              <Input
                id="edit-sup-lastName"
                placeholder="Last name"
                {...register("lastName")}
              />
              {errors.lastName && (
                <p className="text-xs text-destructive">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <Label className="text-xs">Role</Label>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v as UserRole);
                    if (v === "admin" || v === "super_admin") {
                      setValue("supervisorId", "");
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Department */}
          <div className="space-y-1.5">
            <Label className="text-xs">Department</Label>
            <Controller
              name="departmentId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || "none"}
                  onValueChange={(v) => field.onChange(v === "none" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department">
                      {field.value && field.value !== "none"
                        ? departments?.find((d) => d.d.id === field.value)?.d.name
                        : "No Department"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Department</SelectItem>
                    {departments?.map((dept) => (
                      <SelectItem key={dept.d.id} value={dept.d.id}>
                        {dept.d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Higher Supervisor (if supervisor reports to another supervisor) */}
          {(selectedRole === "staff" || selectedRole === "supervisor") && (
            <div className="space-y-1.5">
              <Label className="text-xs">Higher Supervisor</Label>
              <Controller
                name="supervisorId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || "none"}
                    onValueChange={(v) => field.onChange(v === "none" ? "" : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select supervisor">
                        {field.value && field.value !== "none"
                          ? (() => {
                            const s = availableSupervisors.find(
                              (sup) => sup.u.id === field.value
                            );
                            return s
                              ? `${s.u.firstName} ${s.u.lastName}`
                              : "No Supervisor";
                          })()
                          : "No Supervisor"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Supervisor</SelectItem>
                      {availableSupervisors.map((sup) => (
                        <SelectItem key={sup.u.id} value={sup.u.id}>
                          {sup.u.firstName} {sup.u.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || updateUser.isPending}
              className="gap-2"
            >
              {(isSubmitting || updateUser.isPending) && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
