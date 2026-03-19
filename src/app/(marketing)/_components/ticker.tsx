'use client'

import { motion } from 'framer-motion'

export function Ticker() {
  const features = [
    'Real-time revenue sync',
    'AI changelog generation',
    'Cost tracking & analysis',
    'Health score monitoring',
    'Team access control',
    'Stripe & DodoPayment',
  ]

  return (
    <section className="bg-co-surface border-t border-b border-co-b py-4 overflow-hidden">
      <div className="relative w-full">
        {/* Fade edges for smoother look */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-co-surface to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-co-surface to-transparent z-10 pointer-events-none" />
        
        <motion.div
          className="flex gap-8 whitespace-nowrap"
          animate={{ x: [0, -1600] }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {/* Show items 4 times for seamless loop */}
          {[0, 1, 2].map((batch) => (
            <div key={batch} className="flex gap-8 whitespace-nowrap">
              {features.map((f, i) => (
                <motion.div
                  key={`${batch}-${i}`}
                  className="flex items-center gap-3 flex-shrink-0 px-4 py-2 rounded-full border border-co-b/50 hover:border-co-b transition-colors"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-co-acc animate-pulse" />
                  <span className="text-xs font-mono text-co-t2 font-medium">{f}</span>
                </motion.div>
              ))}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}