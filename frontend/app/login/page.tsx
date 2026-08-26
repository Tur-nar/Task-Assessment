"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FlipFadeText } from "@/components/ui/flip-fade-text";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { SessionLoader } from "@/components/shared/session-loader";
import { FloatingNodes } from "@/components/shared/floating-nodes";
import { useCurrentUser, useLogin, useAuthHydration } from "@/hooks/use-auth";

const loginSchema = z.object({
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const hydrated = useAuthHydration();
    const { data: user, isLoading: isUserLoading } = useCurrentUser();
    const [showPassword, setShowPassword] = useState(false);

    const loginMutation = useLogin();

    useEffect(() => {
        if (hydrated && user) {
            router.replace("/dashboard");
        }
    }, [hydrated, user, router]);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    });

    const onSubmit = (values: LoginForm) => {
        loginMutation.mutate(values, {
            onError: (error: any) => {
                const message =
                    error?.response?.data?.message || "Login failed. Please try again.";
                toast.error(message);
            },
        });
    };

    // If currently checking existing session, show the session loader
    if (!hydrated || isUserLoading) {
        return <SessionLoader />;
    }

    return (
        <div className="flex min-h-screen">
            <motion.div
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="relative hidden flex-col items-center justify-center overflow-hidden bg-foreground text-background lg:flex lg:w-[55%] xl:w-[60%]"
            >
                <FloatingNodes />

                <div className="relative z-10 flex flex-col items-center gap-6 px-12">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="mb-4"
                    >
                        <h1 className="text-lg font-medium tracking-[0.4em] uppercase opacity-60">
                            TaskManager Pro
                        </h1>
                    </motion.div>

                    <FlipFadeText
                        words={["ORGANIZING", "TRACKING", "COLLABORATING", "DELIVERING", "ACHIEVING"]}
                        interval={2800}
                        textClassName="text-3xl md:text-5xl xl:text-6xl font-bold tracking-[0.15em] text-background dark:text-background"
                        letterDuration={0.5}
                        staggerDelay={0.08}
                    />

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8, duration: 0.8 }}
                        className="mt-4 max-w-md text-center text-sm leading-relaxed opacity-50"
                    >
                        Enterprise task management powered by graph intelligence.
                        Visualize dependencies, track performance, achieve targets.
                    </motion.p>
                </div>

                <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-foreground to-transparent" />
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative flex w-full flex-col items-center justify-center px-6 py-12 lg:w-[45%] xl:w-[40%]"
            >
                <div className="absolute right-4 top-4">
                    <ThemeToggle />
                </div>

                {/* Mobile brand */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-8 lg:hidden"
                >
                    <h1 className="text-sm font-medium tracking-[0.4em] uppercase text-muted-foreground">
                        TaskManager Pro
                    </h1>
                </motion.div>

                {/* Login form container */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full max-w-sm"
                >
                    <div className="mb-8 space-y-2">
                        <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
                        <p className="text-sm text-muted-foreground">
                            Sign in to your account to continue
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium">
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@company.com"
                                autoComplete="email"
                                className="h-11"
                                {...register("email")}
                            />
                            <AnimatePresence>
                                {errors.email && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -4, height: 0 }}
                                        animate={{ opacity: 1, y: 0, height: "auto" }}
                                        exit={{ opacity: 0, y: -4, height: 0 }}
                                        className="text-xs text-destructive"
                                    >
                                        {errors.email.message}
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-medium">
                                Password
                            </Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    className="h-11 pr-10"
                                    {...register("password")}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <EyeOff className="size-4" />
                                    ) : (
                                        <Eye className="size-4" />
                                    )}
                                </button>
                            </div>
                            <AnimatePresence>
                                {errors.password && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -4, height: 0 }}
                                        animate={{ opacity: 1, y: 0, height: "auto" }}
                                        exit={{ opacity: 0, y: -4, height: 0 }}
                                        className="text-xs text-destructive"
                                    >
                                        {errors.password.message}
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Submit */}
                        <motion.div whileTap={{ scale: 0.98 }}>
                            <Button
                                type="submit"
                                className="h-11 w-full gap-2 text-sm font-medium"
                                disabled={loginMutation.isPending}
                            >
                                {loginMutation.isPending ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    <>
                                        Sign in
                                        <ArrowRight className="size-4" />
                                    </>
                                )}
                            </Button>
                        </motion.div>
                    </form>

                    {/* Footer hint */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="mt-8 text-center text-xs text-muted-foreground"
                    >
                        Contact your administrator for account credentials
                    </motion.p>
                </motion.div>
            </motion.div>
        </div>
    );
}
