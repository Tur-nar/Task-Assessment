"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateDepartment } from "@/hooks/use-departments";
import { useSupervisors } from "@/hooks/use-users";

const createDepartmentSchema = z.object({
  name: z.string().min(2, "Department name must be at least 2 characters"),
  description: z.string().optional(),
  headId: z.string().optional(),
});

type CreateDepartmentForm = z.infer<typeof createDepartmentSchema>;

interface CreateDepartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateDepartmentDialog({
  open,
  onOpenChange,
}: CreateDepartmentDialogProps) {
  const createDepartment = useCreateDepartment();
  const { data: supervisors } = useSupervisors();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateDepartmentForm>({
    resolver: zodResolver(createDepartmentSchema),
    defaultValues: {
      name: "",
      description: "",
      headId: undefined,
    },
  });

  const selectedHeadId = watch("headId");

  const onSubmit = (values: CreateDepartmentForm) => {
    createDepartment.mutate(
      {
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        headId: values.headId || undefined,
      },
      {
        onSuccess: (response) => {
          toast.success(response.message || "Department created successfully");
          reset();
          onOpenChange(false);
        },
        onError: (error: any) => {
          toast.error(
            error?.response?.data?.message || "Failed to create department"
          );
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Department</DialogTitle>
          <DialogDescription>
            Create a new department unit and assign a department head.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Department Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs">
              Department Name
            </Label>
            <Input
              id="name"
              placeholder="e.g. Engineering, Product Design"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs">
              Description
            </Label>
            <Input
              id="description"
              placeholder="Brief summary of responsibilities..."
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* <div className="space-y-1.5">
            <Label className="text-xs">Head of Department (Optional)</Label>
            <Select
              value={selectedHeadId}
              onValueChange={(v) => setValue("headId", v ? String(v) : undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select supervisor or admin" />
              </SelectTrigger>
              <SelectContent>
                {supervisors?.map((sup) => (
                  <SelectItem key={sup.u.id} value={sup.u.id}>
                    {sup.u.firstName} {sup.u.lastName} ({sup.u.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div> */}

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
              disabled={createDepartment.isPending}
              className="gap-2"
            >
              {createDepartment.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Create Department
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
