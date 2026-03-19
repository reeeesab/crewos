import Link from "next/link";
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-sf-bg-base">
      <div className="bg-noise" />
      <div className="bg-grid absolute inset-0 pointer-events-none" />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-sf-accent-cyan/10 blur-[90px]" />
        <div className="absolute -right-24 bottom-8 h-72 w-72 rounded-full bg-sf-accent-violet/10 blur-[90px]" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 items-center gap-10 px-4 py-10 lg:grid-cols-2">
        <div className="hidden lg:block">
          <div className="max-w-md space-y-5">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sf-accent-cyan to-blue-600 shadow-[0_0_18px_rgba(0,212,255,0.35)]">
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor" aria-hidden="true">
                  <path d="M13 2.5a1 1 0 0 1 .9 1.4l-2.16 5.04h5.21a1 1 0 0 1 .77 1.64l-8.5 10.5a1 1 0 0 1-1.72-.9l1.7-5.72H4.94a1 1 0 0 1-.8-1.6l7.98-10.1a1 1 0 0 1 .88-.38Z" />
                </svg>
              </span>
              <span className="font-display text-2xl tracking-wide text-white">CrewOS</span>
            </Link>
            <h1 className="text-4xl font-display leading-tight text-sf-text-primary">Create your workspace in minutes.</h1>
            <p className="text-sm text-sf-text-secondary">
              Bring your revenue, roadmap, and operations into one command center tailored for SaaS founders.
            </p>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md">
          <div className="mb-4 flex items-center justify-center lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sf-accent-cyan to-blue-600 shadow-[0_0_14px_rgba(0,212,255,0.3)]">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="currentColor" aria-hidden="true">
                  <path d="M13 2.5a1 1 0 0 1 .9 1.4l-2.16 5.04h5.21a1 1 0 0 1 .77 1.64l-8.5 10.5a1 1 0 0 1-1.72-.9l1.7-5.72H4.94a1 1 0 0 1-.8-1.6l7.98-10.1a1 1 0 0 1 .88-.38Z" />
                </svg>
              </span>
              <span className="font-display text-lg tracking-wide text-white">CrewOS</span>
            </Link>
          </div>

          <SignUp
            fallbackRedirectUrl="/portfolio"
            signInUrl="/sign-in"
          />
        </div>
      </div>
    </div>
  );
}
