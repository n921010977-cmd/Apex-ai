import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Shield, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Process millions of data points in milliseconds with our optimized AI pipeline.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "SOC 2 compliant with end-to-end encryption and role-based access control.",
  },
  {
    icon: BarChart3,
    title: "Deep Analytics",
    description: "Real-time dashboards and insights powered by advanced machine learning models.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="container mx-auto px-4 py-24 text-center">
        <Badge variant="secondary" className="mb-6">Now in Public Beta</Badge>
        <h1 className="text-5xl font-bold tracking-tight mb-6 max-w-3xl mx-auto">
          The AI platform built for{" "}
          <span className="text-primary">serious teams</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
          Apex AI combines powerful language models with enterprise-grade tooling
          to help your team ship smarter, faster, and more reliably.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button size="lg">Start for free</Button>
          <Button size="lg" variant="outline">See how it works</Button>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Everything you need</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <feature.icon className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="px-0 text-sm">
                  Learn more →
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Card className="max-w-2xl mx-auto p-8">
          <CardHeader>
            <CardTitle className="text-3xl">Ready to get started?</CardTitle>
            <CardDescription className="text-base">
              Join thousands of teams already using Apex AI to build better products.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="lg" className="w-full sm:w-auto">
              Create your free account
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
