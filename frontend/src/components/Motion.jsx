import { motion, AnimatePresence, useInView } from "framer-motion"
import { useLocation } from "react-router-dom"
import { useState, useEffect, useRef } from "react"

/* ── Core Animation Components ────────────────────────────────── */

export function Reveal({ children, className = "", delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28, filter: "blur(4px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "0px 0px -60px 0px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerContainer({ children, className = "" }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "0px 0px -50px 0px" }}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className = "" }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function HoverCard({ children, className = "" }) {
  return (
    <motion.div
      whileHover={{ y: -4, transition: { type: "spring", stiffness: 400, damping: 25 } }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function HoverButton({ children, className = "", scale = 1.03, ...props }) {
  return (
    <motion.button
      whileHover={{ scale }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  )
}

export function Float({ children, className = "", y = 10, duration = 4 }) {
  return (
    <motion.div
      animate={{ y: [0, -y, 0] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function PageTransition({ children }) {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

/* ── New Gen-Z Components ─────────────────────────────────────── */

export function GlassCard({ children, className = "", ...props }) {
  return (
    <motion.div
      whileHover={{ y: -3, transition: { type: "spring", stiffness: 400, damping: 25 } }}
      className={`glass-card ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function GlowButton({ children, className = "", ...props }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, transition: { type: "spring", stiffness: 400, damping: 25 } }}
      whileTap={{ scale: 0.97 }}
      className={`btn-glow ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  )
}

export function AnimatedCounter({ value, duration = 1.2, className = "" }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return
    if (!value || value === 0) {
      const frame = requestAnimationFrame(() => setCount(0))
      return () => cancelAnimationFrame(frame)
    }
    const startTime = performance.now()
    const dur = duration * 1000

    function tick(now) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / dur, 1)
      // Ease-out cubic for satisfying deceleration
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * value))
      if (progress < 1) requestAnimationFrame(tick)
    }

    const frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [isInView, value, duration])

  return <span ref={ref} className={className}>{count}</span>
}

export function PulseRing({ color = "var(--accent-violet)", size = 40, className = "" }) {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <motion.div
        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 rounded-full"
        style={{ background: color }}
      />
      <motion.div
        animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
        className="absolute inset-1 rounded-full"
        style={{ background: color }}
      />
    </div>
  )
}
