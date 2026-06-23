import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/40">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center transition-transform group-hover:scale-105">
            <span className="text-primary-foreground font-bold text-xl">E</span>
          </div>
          <span className="font-bold text-xl tracking-tight">EasyBudget</span>
        </Link>

        {/* Center Links */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Features
          </Link>
          <Link href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            How it Works
          </Link>
          <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </Link>
        </nav>

        {/* CTA */}
        <div className="flex items-center">
          <Button asChild className="rounded-full px-6 font-medium shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
            <Link href="/get-started">Start for free</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
