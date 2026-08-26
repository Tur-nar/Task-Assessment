"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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

interface FloatingNodesProps {
    className?: string;
    opacity?: number;
}

export function FloatingNodes({ className, opacity = 0.4 }: FloatingNodesProps) {
    return (
        <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)} style={{ opacity }}>
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
                        <stop offset="50%" stopColor="currentColor" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0.15" />
                    </linearGradient>
                </defs>

                {NODE_CONNECTIONS.map(([fromIdx, toIdx], idx) => {
                    const fromNode = STATIC_NODES[fromIdx];
                    const toNode = STATIC_NODES[toIdx];
                    return (
                        <motion.line
                            key={`conn-${idx}`}
                            x1={`${fromNode.x}%`}
                            y1={`${fromNode.y}%`}
                            x2={`${toNode.x}%`}
                            y2={`${toNode.y}%`}
                            stroke="url(#lineGrad)"
                            strokeWidth="1"
                            initial={{ pathLength: 0, opacity: 0.2 }}
                            animate={{
                                pathLength: [0.3, 1, 0.3],
                                opacity: [0.2, 0.6, 0.2],
                            }}
                            transition={{
                                duration: 8 + (idx % 4) * 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        />
                    );
                })}

                {STATIC_NODES.map((node) => (
                    <motion.circle
                        key={`node-${node.id}`}
                        cx={`${node.x}%`}
                        cy={`${node.y}%`}
                        r={node.size}
                        className="fill-background"
                        initial={{ scale: 1, opacity: 0.4 }}
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
