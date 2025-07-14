"use client"

import { motion } from "framer-motion"

interface GlowingOrbProps {
  className?: string
}

export function GlowingOrb({ className = "" }: GlowingOrbProps) {
  return (
    <motion.div
      className={`w-2 h-2 bg-cyan-400 rounded-full ${className}`}
      animate={{
        scale: [1, 1.5, 1],
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 2,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      }}
      style={{
        boxShadow: "0 0 10px #00bcd4, 0 0 20px #00bcd4, 0 0 30px #00bcd4",
      }}
    />
  )
}
