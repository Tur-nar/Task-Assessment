"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateDepartment } from "@/hooks/use-departments";
import { useSupervisors } from "@/hooks/use-users";
import type { DepartmentWithStats } from "@/types/api";

const editDepartmentSchema = z.object({
  name: z.string().min(2, "Department name must be at least 2 characters"),
  description: z.string().optional(),
  headId: z.string().optional(),
});

type EditDepartmentForm = z.infer<typeof editDepartmentSchema>;

interface EditDepartmentDialogProps {
  department: DepartmentWithStats | null;
  onClose: () => void;
}

export function EditDepartmentDialog({
  department,
  onClose,
}: EditDepartmentDialogProps) {
  const updateDepartment = useUpdateDepartment();
  const { data: supervisors } = useSupervisors();
  const open = !!department;

  const filteredSupervisors = supervisors?.filter(supervisor => supervisor?.d?.id === department?.d?.id)
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<EditDepartmentForm>({
    resolver: zodResolver(editDepartmentSchema),
    defaultValues: {
      name: "",
      description: "",
      headId: undefined,
    },
  });

  useEffect(() => {
    if (department) {
      reset({
        name: department.d.name,
        description: department.d.description ?? "",
        headId: department.head?.id ?? undefined,
      });
    }
  }, [department, reset]);

  const selectedHeadId = watch("headId");

  const onSubmit = (values: EditDepartmentForm) => {
    if (!department) return;

    updateDepartment.mutate(
      {
        id: department.d.id,
        payload: {
          name: values.name.trim(),
          description: values.description?.trim() || undefined,
          headId: values.headId || undefined,
        },
      },
      {
        onSuccess: (response) => {
          toast.success(response.message || "Department updated successfully");
          onClose();
        },
        onError: (error: any) => {
          toast.error(
            error?.response?.data?.message || "Failed to update department"
          );
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Department</DialogTitle>
          <DialogDescription>
            Update department name, description, and assigned head.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Department Name */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-name" className="text-xs">
              Department Name
            </Label>
            <Input
              id="edit-name"
              placeholder="e.g. Engineering"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-description" className="text-xs">
              Description
            </Label>
            <Input
              id="edit-description"
              placeholder="Brief summary of responsibilities..."
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Head of Department</Label>
            <Select
              value={selectedHeadId}
              onValueChange={(v) => setValue("headId", v ? String(v) : undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select supervisor or admin" />
              </SelectTrigger>
              <SelectContent>
                {filteredSupervisors?.map((sup) => (
                  <SelectItem key={sup.u.id} value={sup.u.id}>
                    {sup.u.firstName} {sup.u.lastName} ({sup.u.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateDepartment.isPending}
              className="gap-2"
            >
              {updateDepartment.isPending && (
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
