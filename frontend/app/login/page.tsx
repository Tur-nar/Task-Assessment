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
import { useLogin } from "@/hooks/use-auth";
import { useAuthStore } from "@/lib/auth-store";

const loginSchema = z.object({
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

const STATIC_NODES = [
    { id: 0, x: 18, y: 22, size: 4.5, delay: 0.2, duration: 9 },
    { id: 1, x: 38, y: 16, size: 5.2, delay: 0.8, duration: 11 },
    { id: 2, x: 68, y: 24, size: 3.8, delay: 0.4, duration: 10 },
    { id: 3, x: 84, y: 19, size: 4.6, delay: 1.2, duration: 12 },
    { id: 4, x: 22, y: 52, size: 5.0, delay: 0.5, duration: 8.5 },
    { id: 5, x: 48, y: 44, size: 6.0, delay: 1.5, duration: 14 },
    { id: 6, x: 74, y: 56, size: 4.2, delay: 0.9, duration: 10.5 },
    { id: 7, x: 88, y: 62, size: 3.6, delay: 1.8, duration: 9.5 },
    { id: 8, x: 16, y: 82, size: 4.8, delay: 0.3, duration: 11.5 },
    { id: 9, x: 42, y: 86, size: 5.2, delay: 1.1, duration: 13 },
    { id: 10, x: 66, y: 79, size: 4.0, delay: 0.7, duration: 10 },
    { id: 11, x: 86, y: 85, size: 5.4, delay: 1.4, duration: 12.5 },
];

const NODE_CONNECTIONS = [
    [0, 3], [1, 4], [2, 5], [3, 6], [4, 7], [5, 8],
    [6, 9], [7, 10], [8, 11], [0, 6], [1, 7], [2, 8],
];

function FloatingNodes() {
    return (
        <div className="absolute inset-0 overflow-hidden opacity-20 dark:opacity-15">
            <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {NODE_CONNECTIONS.map(([from, to], i) => (
                    <motion.line
                        key={`line-${i}`}
                        x1={STATIC_NODES[from].x}
                        y1={STATIC_NODES[from].y}
                        x2={STATIC_NODES[to].x}
                        y2={STATIC_NODES[to].y}
                        stroke="currentColor"
                        strokeWidth="0.15"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: [0, 0.5, 0.3] }}
                        transition={{
                            duration: 3,
                            delay: i * 0.2,
                            repeat: Infinity,
                            repeatType: "reverse",
                            ease: "easeInOut",
                        }}
                    />
                ))}

                {STATIC_NODES.map((node) => (
                    <motion.circle
                        key={node.id}
                        cx={node.x}
                        cy={node.y}
                        r={node.size / 10}
                        fill="currentColor"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{
                            scale: [0.8, 1.2, 0.8],
                            opacity: [0.3, 0.7, 0.3],
                        }}
                        transition={{
                            duration: node.duration,
                            delay: node.delay,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                ))}
            </svg>
        </div>
    );
}

export default function LoginPage() {
    const router = useRouter();
    const token = useAuthStore((s) => s.token);
    const [showPassword, setShowPassword] = useState(false);

    const loginMutation = useLogin();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    });

    useEffect(() => {
        if (token) router.replace("/dashboard");
    }, [token, router]);

    const onSubmit = (values: LoginForm) => {
        loginMutation.mutate(values, {
            onError: (error: any) => {
                const message =
                    error?.response?.data?.message || "Login failed. Please try again.";
                toast.error(message);
            },
        });
    };

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
