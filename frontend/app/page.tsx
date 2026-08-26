"use client";
import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { ArrowRight, GitBranch, Lightning, Eye } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { FlipFadeText } from "@/components/ui/flip-fade-text";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { FloatingNodes } from "@/components/shared/floating-nodes";
import { TaskBentoGrid } from "@/components/ui/task-bento-grid";

function RevealSection({
    children,
    className = "",
    delay = 0,
}: {
    children: React.ReactNode;
    className?: string;
    delay?: number;
}) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-80px" });

    return (
        <motion.section
            ref={ref}
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
            className={className}
        >
            {children}
        </motion.section>
    );
}

const GRAPH_FEATURES = [
    {
        icon: GitBranch,
        title: "Multi-hop Traversal",
        description:
            "See the full reporting chain from any staff member to the top in a single query. No recursive CTEs, no N+1 round trips.",
        color: "text-violet-500",
        gradient: "from-violet-500/10 to-violet-500/5",
        border: "hover:border-violet-500/30",
    },
    {
        icon: Lightning,
        title: "Dependency Intelligence",
        description:
            "Detect transitive blockers across tasks — know what's truly blocking progress with graph-native path queries.",
        color: "text-amber-500",
        gradient: "from-amber-500/10 to-amber-500/5",
        border: "hover:border-amber-500/30",
    },
    {
        icon: Eye,
        title: "Team Visibility",
        description:
            "Navigate departments, supervisors, and targets through natural relationship paths. One query replaces five JOINs.",
        color: "text-cyan-500",
        gradient: "from-cyan-500/10 to-cyan-500/5",
        border: "hover:border-cyan-500/30",
    },
];

export default function LandingPage() {
    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground">

            <nav
                className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/40"
            >
                <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-sm font-medium tracking-[0.3em] uppercase text-foreground/80">
                            TaskManager Pro
                        </span>
                    </Link>

                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <Link href="/login">
                            <Button size="sm" className="gap-1.5 rounded-full px-5">
                                Sign in
                                <ArrowRight className="size-3.5" weight="bold" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>
            <section
                className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
            >
                {/* Background: Floating graph nodes (pure CSS animation) */}
                <FloatingNodes opacity={0.25} />

                <div className="relative z-10 flex flex-col items-center gap-6 px-6 max-w-4xl mx-auto text-center">
                    <motion.h2
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="text-sm font-medium tracking-[0.4em] uppercase text-muted-foreground"
                    >
                        TaskManager Pro
                    </motion.h2>

                    <FlipFadeText
                        words={["ORGANIZING", "TRACKING", "COLLABORATING", "DELIVERING", 'ACHIEVING', 'MANAGING PERFORMANCE',]}
                        interval={2800}
                        textClassName="text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-bold tracking-[0.12em] text-foreground"
                        letterDuration={0.5}
                        staggerDelay={0.08}
                        className="min-h-25 sm:min-h-30 md:min-h-40"
                    />

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8, duration: 0.8 }}
                        className="max-w-lg text-sm sm:text-base leading-relaxed text-muted-foreground"
                    >
                        Enterprise task management powered by graph intelligence.
                        Visualize dependencies, track performance, achieve targets.
                    </motion.p>

                    {/* CTAs */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1, duration: 0.6 }}
                        className="flex flex-col sm:flex-row items-center gap-3 mt-2"
                    >
                        <Link href="/login">
                            <Button size="sm" className="gap-2 rounded-full px-8 text-sm font-medium">
                                Get Started
                                <ArrowRight className="size-4" weight="bold" />
                            </Button>
                        </Link>
                        <a href="#features">
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 rounded-full px-8 text-sm font-medium"
                            >
                                Learn More
                            </Button>
                        </a>
                    </motion.div>
                </div>

                {/* Bottom fade */}
                <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-background to-transparent" />
            </section>

            {/* ════════════════════════════════════════
         Section 3 — Features Bento Grid
      ════════════════════════════════════════ */}
            <section id="features" className="relative py-24 sm:py-32 px-6">
                <div className="max-w-5xl mx-auto">
                    <RevealSection className="text-center mb-16">
                        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-4">
                            Everything you need to manage at scale
                        </h2>
                        <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
                            From dependency tracking to performance analytics — every feature
                            is designed to help your team move faster and stay aligned.
                        </p>
                    </RevealSection>

                    <RevealSection delay={0.15}>
                        <TaskBentoGrid />
                    </RevealSection>
                </div>
            </section>

            {/* ════════════════════════════════════════
         Section 4 — Why Graph?
      ════════════════════════════════════════ */}
            <section className="relative py-24 sm:py-32 px-6 bg-muted/20">
                <div className="max-w-5xl mx-auto">
                    <RevealSection className="text-center mb-16">
                        <span className="inline-block text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">
                            Architecture
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-4">
                            Why a graph database?
                        </h2>
                        <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
                            TaskManager Pro uses CognoDB to model relationships natively — supervisor chains,
                            task dependencies, and team structures become first-class citizens, not afterthoughts.
                        </p>
                    </RevealSection>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {GRAPH_FEATURES.map((feature, i) => (
                            <RevealSection key={feature.title} delay={0.1 * i}>
                                <motion.div
                                    whileHover={{ y: -4 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                    className={`group relative flex flex-col gap-4 rounded-2xl border border-border/50 bg-background p-6 transition-all duration-300 ${feature.border} hover:shadow-lg`}
                                >
                                    {/* Gradient background on hover */}
                                    <div
                                        className={`absolute inset-0 rounded-2xl bg-linear-to-b ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                                    />

                                    <div className="relative z-10">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${feature.color} bg-current/10`}>
                                            <feature.icon className="w-5 h-5" weight="duotone" />
                                        </div>
                                        <h3 className="text-base font-semibold tracking-tight mb-2">
                                            {feature.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {feature.description}
                                        </p>
                                    </div>
                                </motion.div>
                            </RevealSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════════════
         Section 5 — Footer CTA + Footer
      ════════════════════════════════════════ */}
            <section className="relative py-24 sm:py-32 px-6">
                <RevealSection>
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-4">
                            Ready to transform how your team works?
                        </h2>
                        <p className="text-sm sm:text-base text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
                            Start managing tasks with the power of graph intelligence.
                            See dependencies, track performance, and hit targets — all in one place.
                        </p>
                        <Link href="/login">
                            <Button size="lg" className="gap-2 rounded-full px-10 text-sm font-medium">
                                Get Started
                                <ArrowRight className="size-4" weight="bold" />
                            </Button>
                        </Link>
                    </div>
                </RevealSection>
            </section>

            {/* Footer */}
            <footer className="border-t border-border/50 py-8 px-6">
                <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
                    <p>© {new Date().getFullYear()} TaskManager Pro. Built with CognoDB.</p>
                    <div className="flex items-center gap-4">
                        <Link href="/login" className="hover:text-foreground transition-colors">
                            Sign in
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
