import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart, Zap, Shield } from "lucide-react";

export function Features() {
  const features = [
    {
      title: "Intuitive Analytics",
      description: "Understand your spending habits at a glance with beautiful, auto-generated charts that make sense of your data.",
      icon: <PieChart className="w-6 h-6 text-primary" />,
    },
    {
      title: "Lightning Fast",
      description: "Built for speed. Enter transactions in seconds and experience a frictionless interface that never slows you down.",
      icon: <Zap className="w-6 h-6 text-primary" />,
    },
    {
      title: "Bank-Grade Security",
      description: "Your financial data is encrypted and protected with industry-leading security protocols. We never sell your data.",
      icon: <Shield className="w-6 h-6 text-primary" />,
    },
  ];

  return (
    <section id="features" className="py-24 bg-zinc-50/50 dark:bg-zinc-950/20 border-y border-border/40">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight mb-4 text-foreground">Everything you need. Nothing you don&apos;t.</h2>
          <p className="text-lg text-muted-foreground font-light">
            Designed to bring clarity to your finances without overwhelming you with unnecessary features.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group border-none shadow-sm bg-background/60 backdrop-blur-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:bg-background"
            >
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-muted-foreground leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
