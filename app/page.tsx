import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen selection:bg-primary/20 selection:text-primary">
      <Navbar />
      <main className="flex-1 flex flex-col">
        <Hero />
        <Features />
      </main>
      <Footer />
    </div>
  );
}
