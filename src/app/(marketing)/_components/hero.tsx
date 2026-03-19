'use client'

import { AppPreview } from './app-preview'
import { motion } from 'framer-motion'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, type: 'spring', bounce: 0 },
  },
}

export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-16 px-6 overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(14,165,233,0.06)_1px,transparent_0)] bg-[length:32px_32px] opacity-40 [mask-image:radial-gradient(ellipse_80%_70%_at_50%_40%,black,transparent)] pointer-events-none" />

      {/* Glow effects */}
      <motion.div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[radial-gradient(ellipse,rgba(14,165,233,0.08)_0%,transparent_65%)] pointer-events-none blur-3xl" initial={{ opacity: 0.5 }} animate={{ opacity: 0.8 }} transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }} />
      <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-[radial-gradient(ellipse,rgba(45,212,191,0.04)_0%,transparent_70%)] pointer-events-none blur-3xl" />

      <motion.div className="relative z-10 text-center max-w-4xl" variants={containerVariants} initial="hidden" animate="visible">
        {/* Badge */}
        <motion.div variants={itemVariants} className="inline-flex items-center gap-1.5 px-3 py-1 mb-6 bg-co-accbg border border-co-acc/20 rounded-full">
          <div className="w-1 h-1 rounded-full bg-co-acc animate-pulse" />
          <span className="text-xs font-mono text-co-acc">Now Live • CrewOS is open</span>
        </motion.div>

        {/* Hero heading */}
        <motion.h1 variants={itemVariants} className="text-5xl sm:text-6xl lg:text-7xl font-serif mb-6 leading-tight tracking-tight">
          The <em className="italic text-co-acc">operating system</em> for solo founders
        </motion.h1>

        {/* Subheading */}
        <motion.p variants={itemVariants} className="text-lg text-co-t2 max-w-2xl mx-auto mb-10 leading-relaxed">
          Revenue, team, health score, AI insights, and team access — all in one dashboard. No more context switching.
        </motion.p>

        {/* CTAs */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
          <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} className="px-7 py-3 bg-co-acc text-white rounded-lg font-medium hover:bg-co-acc2 transition-all flex items-center gap-2">
            Get started free
            <span>→</span>
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-7 py-3 border border-co-b text-co-t rounded-lg font-medium hover:border-co-b2 transition-colors">
            View demo
          </motion.button>
        </motion.div>

        {/* Social proof */}
        <motion.p variants={itemVariants} className="text-xs font-mono text-co-t4">
          <span className="text-co-acc">★★★★★</span> Used by 200+ founders
        </motion.p>
      </motion.div>

      <AppPreview />
    </section>
  )
}