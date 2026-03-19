'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

export function CTAStrip() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setEmail('')
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <section className="bg-co-surface py-16 px-6 border-b border-co-b">
      <motion.div className="max-w-2xl mx-auto text-center" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
        <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.1 }} viewport={{ once: true }} className="text-3xl sm:text-4xl font-serif mb-4 tracking-tight">Ready to take control?</motion.h2>
        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }} viewport={{ once: true }} className="text-co-t2 text-sm mb-8">Join 200+ founders already using CrewOS</motion.p>
        <motion.form onSubmit={handleSubmit} className="flex gap-2" initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.3 }} viewport={{ once: true }}>
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1 px-4 py-3 rounded-lg bg-co-base border border-co-b text-co-t text-sm placeholder-co-t4 focus:outline-none focus:border-co-acc transition-colors"
          />
          <button
            type="submit"
            className="px-6 py-3 rounded-lg bg-co-acc text-white font-medium text-sm hover:bg-co-acc2 transition-all hover:-translate-y-0.5 whitespace-nowrap"
          >
            {submitted ? '✓ Joined' : 'Join waitlist'}
          </button>
        </motion.form>
      </motion.div>
    </section>
  )
}