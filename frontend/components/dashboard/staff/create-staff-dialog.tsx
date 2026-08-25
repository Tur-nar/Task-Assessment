"use client";

import { useForm } from "react-hook-form";
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
import { useCreateUser, useDepartments, useSupervisors } from "@/hooks/use-users";
import type { UserRole } from "@/types/api";

const createUserSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(6, "Minimum 6 characters"),
    role: z.enum(["staff", "supervisor", "admin", "super_admin"] as const),
    departmentId: z.string().optional(),
    supervisorId: z.string().optional(),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

interface CreateStaffDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateStaffDialog({ open, onOpenChange }: CreateStaffDialogProps) {
    const createUser = useCreateUser();
    const { data: departments } = useDepartments();
    const { data: supervisors } = useSupervisors();

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<CreateUserForm>({
        resolver: zodResolver(createUserSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            password: "",
            role: "staff",
            departmentId: undefined,
            supervisorId: undefined,
        },
    });

    const selectedRole = watch("role");

    const onSubmit = (values: CreateUserForm) => {
        createUser.mutate(values, {
            onSuccess: (response) => {
                toast.success(response.message || "Staff member created successfully");
                reset();
                onOpenChange(false);
            },
            onError: (error: any) => {
                toast.error(
                    error?.response?.data?.message || "Failed to create staff member"
                );
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add Staff Member</DialogTitle>
                    <DialogDescription>
                        Create a new team member account with their role and department.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Name row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="firstName" className="text-xs">
                                First Name
                            </Label>
                            <Input
                                id="firstName"
                                placeholder="Ada"
                                {...register("firstName")}
                            />
                            {errors.firstName && (
                                <p className="text-xs text-destructive">
                                    {errors.firstName.message}
                                </p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="lastName" className="text-xs">
                                Last Name
                            </Label>
                            <Input
                                id="lastName"
                                placeholder="Okoro"
                                {...register("lastName")}
                            />
                            {errors.lastName && (
                                <p className="text-xs text-destructive">
                                    {errors.lastName.message}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-xs">
                            Email
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="ada.okoro@company.com"
                            {...register("email")}
                        />
                        {errors.email && (
                            <p className="text-xs text-destructive">
                                {errors.email.message}
                            </p>
                        )}
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                        <Label htmlFor="password" className="text-xs">
                            Password
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            {...register("password")}
                        />
                        {errors.password && (
                            <p className="text-xs text-destructive">
                                {errors.password.message}
                            </p>
                        )}
                    </div>

                    {/* Role */}
                    <div className="space-y-1.5">
                        <Label className="text-xs">Role</Label>
                        <Select
                            value={selectedRole}
                            onValueChange={(v) => setValue("role", v as UserRole)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="staff">Staff</SelectItem>
                                <SelectItem value="supervisor">Supervisor</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="super_admin">Super Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs">Department</Label>
                        <Select
                            onValueChange={(v) => setValue("departmentId", v as string)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent>
                                {departments?.map((dept) => (
                                    <SelectItem key={dept.d.id} value={dept.d.id}>
                                        {dept.d.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {(selectedRole === "staff" || selectedRole === "supervisor") && (
                        <div className="space-y-1.5">
                            <Label className="text-xs">Supervisor</Label>
                            <Select
                                onValueChange={(v) => setValue("supervisorId", v as string | undefined)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select supervisor" />
                                </SelectTrigger>
                                <SelectContent>
                                    {supervisors?.map((sup) => (
                                        <SelectItem key={sup.u.id} value={sup.u.id}>
                                            {sup.u.firstName} {sup.u.lastName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={createUser.isPending}
                            className="gap-2"
                        >
                            {createUser.isPending && (
                                <Loader2 className="size-4 animate-spin" />
                            )}
                            Create
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
