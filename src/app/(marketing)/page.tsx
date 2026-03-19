import { Nav } from './_components/nav'
import { Hero } from './_components/hero'
import { Ticker } from './_components/ticker'
import { MetricsStrip } from './_components/metrics-strip'
import { FeaturesBento } from './_components/features-bento'
import { HowItWorks } from './_components/how-it-works'
import { Testimonials } from './_components/testimonials'
import { Integrations } from './_components/integrations'
import { CTAStrip } from './_components/cta-strip'
import { Footer } from './_components/footer'

export default function MarketingPage() {
  return (
    <div className="bg-co-base min-h-screen">
      <Nav />
      <Hero />
      <Ticker />
      <MetricsStrip />
      <FeaturesBento />
      <HowItWorks />
      <Testimonials />
      <Integrations />
      <CTAStrip />
      <Footer />
    </div>
  )
}
