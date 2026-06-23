import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background pt-24 pb-32 md:pt-32 md:pb-40">
      {/* Subtle background gradient / shape */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />

      <div className="container relative z-10 mx-auto px-6 flex flex-col items-center text-center">
        {/* Subtle badge or pre-title (optional but adds premium feel) */}
        <div className="inline-flex items-center rounded-full border border-border/40 bg-muted/30 px-3 py-1 text-sm font-medium text-muted-foreground mb-8 backdrop-blur-sm">
          <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
          The new standard in personal finance
        </div>

        {/* Headline */}
        <h1 className="max-w-4xl text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6 leading-[1.1]">
          Master your money with <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">effortless precision.</span>
        </h1>

        {/* Subtext */}
        <p className="max-w-2xl text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed font-light">
          Take control of your finances without the complexity. EasyBudget provides a beautifully simple, incredibly powerful platform to track, plan, and grow your wealth.
        </p>

        {/* Single Primary CTA */}
        <Button asChild size="lg" className="rounded-full px-8 h-14 text-base font-medium shadow-lg transition-all hover:shadow-xl hover:-translate-y-1 group">
          <Link href="/get-started">
            Get Started Today
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </div>

      {/* Abstract geometric shapes or minimal mockup placeholder */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl h-full -z-10 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
        <svg viewBox="0 0 100 100" className="w-full h-full fill-current">
          <circle cx="50" cy="50" r="40" />
        </svg>
      </div>
    </section>
  );
}
