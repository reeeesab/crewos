'use client'

import { motion } from 'framer-motion'

const itemVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      delay: i * 0.1,
      type: 'spring',
      bounce: 0,
    },
  }),
}

export function MetricsStrip() {
  return (
    <section className="bg-co-base py-12 px-6 border-b border-co-b">
      <motion.div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-co-b rounded-2xl overflow-hidden border border-co-b" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}>
        {[
          { val: '99.8%', label: 'Uptime guarantee' },
          { val: '8+', label: 'Integrations built-in' },
          { val: '2h', label: 'Setup time' },
          { val: '₹0', label: 'First month (free)' },
        ].map((m, i) => (
          <motion.div key={i} custom={i} variants={itemVariants} whileHover={{ y: -4 }} className="bg-co-surface p-8 text-center cursor-default">
            <motion.div className="text-4xl sm:text-5xl font-serif font-bold tracking-tight mb-2">{m.val}</motion.div>
            <div className="text-xs text-co-t4 font-mono uppercase tracking-wider">{m.label}</div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}