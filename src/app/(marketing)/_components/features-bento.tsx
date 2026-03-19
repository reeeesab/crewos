'use client'

import { TrendingUp, Zap, Lock, Brain, BarChart3, Users } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, type: 'spring', bounce: 0 },
  },
}

export function FeaturesBento() {
  const features = [
    { icon: TrendingUp, title: 'Revenue metrics', desc: 'MRR, ARR, churn, forecasting, and net margin analysis.' },
    { icon: Brain, title: 'AI-powered', desc: '3-email dunning sequences that recover failed payments.' },
    { icon: BarChart3, title: 'Analytics', desc: 'GA4 sync, traffic sources, engagement, conversion tracking.' },
    { icon: Zap, title: 'Issues board', desc: 'Kanban board for features, bugs, and product roadmap.' },
    { icon: Lock, title: 'Team & access', desc: 'Invite teammates with granular permission control.' },
    { icon: Users, title: 'Health score', desc: 'Single-number health indicator for your product.' },
  ]

  return (
    <section id="features" className="bg-co-base py-20 border-b border-co-b">
      <motion.div className="max-w-6xl mx-auto px-6" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
        <div className="mb-16">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.5 }} viewport={{ once: true }} className="text-xs font-mono text-co-acc uppercase tracking-wider mb-3">Features</motion.div>
          <motion.h2 initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }} className="text-4xl sm:text-5xl font-serif leading-tight tracking-tight mb-4">Built for founders</motion.h2>
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.1 }} viewport={{ once: true }} className="text-co-t2 text-base max-w-md">Everything you need to understand and grow your SaaS business.</motion.p>
        </div>

        <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}>
          {features.map((f, i) => {
            const Icon = f.icon
            return (
              <motion.div
                key={i}
                variants={itemVariants}
                whileHover={{ y: -5 }}
                className="bg-co-surface border border-co-b rounded-xl p-6 transition-all duration-200 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg bg-co-accbg flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-co-acc" />
                </div>
                <h3 className="text-co-t font-semibold mb-2 text-sm">{f.title}</h3>
                <p className="text-co-t3 text-xs leading-relaxed">{f.desc}</p>
              </motion.div>
            )
          })}
        </motion.div>
      </motion.div>
    </section>
  )
}