'use client'

import { motion } from 'framer-motion'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
}

export function Integrations() {
  return (
    <section className="bg-co-base py-20 px-6 border-b border-co-b">
      <motion.div className="max-w-6xl mx-auto" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
        <div className="text-center mb-16">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.5 }} viewport={{ once: true }} className="text-xs font-mono text-co-acc uppercase tracking-wider mb-3">Integrations</motion.div>
          <motion.h2 initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }} className="text-4xl sm:text-5xl font-serif leading-tight tracking-tight">Built-in connectors</motion.h2>
        </div>
        <motion.div className="flex flex-wrap justify-center gap-3" variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}>
          {[
            'Stripe',
            'DodoPayments',
            'Google Analytics',
            'OpenAI',
            'Inngest',
            'Clerk',
            'Vercel',
            'PostgreSQL',
          ].map((int, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              whileHover={{ scale: 1.1 }}
              className="px-4 py-2 border border-co-b rounded-full text-xs font-medium text-co-t2 hover:text-co-t transition-all cursor-pointer"
            >
              {int}
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}