"use client";

import { motion, type Variants } from "framer-motion";
import { FlipFadeText } from "@/components/ui/flip-fade-text";

const pulseVariants: Variants = {
  animate: {
    scale: [1, 1.2, 1],
    opacity: [0.4, 0.8, 0.4],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export function SessionLoader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-background"
    >
      <FlipFadeText
        words={["LOADING", "SYNCING", "PREPARING", "ORGANIZING"]}
        interval={2000}
        textClassName="text-2xl md:text-4xl font-bold tracking-[0.3em] text-foreground"
      />

      <div className="flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="size-2 rounded-full bg-foreground/60"
            variants={pulseVariants}
            animate="animate"
            style={{ animationDelay: `${i * 0.3}s` }}
            initial={{ scale: 1, opacity: 0.4 }}
            transition={{
              delay: i * 0.3,
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
