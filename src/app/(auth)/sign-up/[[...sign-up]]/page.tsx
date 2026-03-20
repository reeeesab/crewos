import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { IndiqoWordmark } from "@/components/ui/logo";

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
            <Link href="/" className="inline-flex items-center">
              <IndiqoWordmark size="lg" />
            </Link>
            <h1 className="text-4xl font-display leading-tight text-sf-text-primary">Create your workspace in minutes.</h1>
            <p className="text-sm text-sf-text-secondary">
              Bring your revenue, roadmap, and operations into one command center tailored for SaaS founders.
            </p>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md">
          <div className="mb-6 flex items-center justify-center lg:hidden">
            <Link href="/" className="inline-flex items-center">
              <IndiqoWordmark size="md" />
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
