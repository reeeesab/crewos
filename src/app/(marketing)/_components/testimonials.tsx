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
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, type: 'spring', bounce: 0 },
  },
}

export function Testimonials() {
  return (
    <section className="bg-co-base py-20 px-6 border-b border-co-b">
      <motion.div className="max-w-6xl mx-auto" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
        <div className="mb-16">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.5 }} viewport={{ once: true }} className="text-xs font-mono text-co-acc uppercase tracking-wider mb-3">Testimonials</motion.div>
          <motion.h2 initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }} className="text-4xl sm:text-5xl font-serif leading-tight tracking-tight">Loved by founders</motion.h2>
        </div>
        <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6" variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}>
          {[
            { quote: 'Cut our financial ops time by 70%. I never have to manually check Stripe or GA anymore.', author: 'Sarah', title: 'Founder, TechCo' },
            { quote: 'The health score system is a game changer. I know instantly if something is wrong.', author: 'Alex', title: 'Founder, DataFlow' },
            { quote: 'Invited our CTO in 30 seconds. Finally, my team can see the full picture.', author: 'Jordan', title: 'Founder, SyncPOS' },
          ].map((t, i) => (
            <motion.div key={i} variants={itemVariants} whileHover={{ y: -5 }} className="bg-co-surface border border-co-b rounded-xl p-8 transition-all cursor-default">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <span key={j} className="text-co-acc text-xs">★</span>
                ))}
              </div>
              <p className="text-co-t2 text-sm leading-relaxed mb-6 italic">\"{t.quote}\"</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-co-acc flex items-center justify-center text-white text-xs font-bold">
                  {t.author[0]}
                </div>
                <div>
                  <div className="text-xs font-semibold text-co-t">{t.author}</div>
                  <div className="text-xs text-co-t3">{t.title}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}