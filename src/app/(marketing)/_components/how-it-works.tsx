'use client'

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
    transition: { duration: 0.6, type: 'spring', bounce: 0 },
  },
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-co-base py-20 px-6 border-b border-co-b">
      <motion.div className="max-w-6xl mx-auto" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
        <div className="mb-16">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.5 }} viewport={{ once: true }} className="text-xs font-mono text-co-acc uppercase tracking-wider mb-3">How it works</motion.div>
          <motion.h2 initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }} className="text-4xl sm:text-5xl font-serif leading-tight tracking-tight">3 minutes to launch</motion.h2>
        </div>
        <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-co-b rounded-2xl overflow-hidden border border-co-b" variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}>
          {[
            { step: '01', title: 'Connect', desc: 'Link Stripe, DodoPayment, or GA4' },
            { step: '02', title: 'Sync', desc: 'Real-time data flows in automatically' },
            { step: '03', title: 'Analyze', desc: 'Get insights and health scores' },
          ].map((item, i) => (
            <motion.div key={i} variants={itemVariants} whileHover={{ y: -4 }} className="bg-co-surface p-8 cursor-default">
              <div className="text-xs font-mono text-co-acc uppercase tracking-wider mb-4">{item.step}</div>
              <h3 className="text-co-t font-semibold text-lg mb-2">{item.title}</h3>
              <p className="text-co-t3 text-sm">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}