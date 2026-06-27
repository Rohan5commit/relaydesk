"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Zap,
  Users,
  GitBranch,
  Shield,
  Clock,
  CheckCircle,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">RelayDesk</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/demo">
              <Button variant="ghost">Demo</Button>
            </Link>
            <Link href="/inbox">
              <Button variant="ghost">Inbox</Button>
            </Link>
            <Link href="/ask">
              <Button variant="ghost">Ask</Button>
            </Link>
            <Link href="/architecture">
              <Button variant="ghost">Architecture</Button>
            </Link>
            <Link href="/workflow">
              <Button variant="ghost">Workflow</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-20 text-center">
          <Badge variant="secondary" className="mb-4">
            Aicoo Hackathon 2026
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
            RelayDesk
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Aicoo-native multi-agent support and escalation network
          </p>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            Route requests faster, resolve with context, and hand off cleanly
            across teams using Aicoo as the coordination layer.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/demo">
              <Button size="lg" className="gap-2">
                Try Demo <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/architecture">
              <Button size="lg" variant="outline">
                View Architecture
              </Button>
            </Link>
          </div>
        </section>

        {/* How It Works */}
        <section className="container mx-auto px-4 py-20 border-t border-border/50">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                icon: <Zap className="w-6 h-6" />,
                title: "Receive Request",
                description:
                  "Customer submits a support request through any channel",
              },
              {
                icon: <GitBranch className="w-6 h-6" />,
                title: "Route to Right Agent",
                description:
                  "Aicoo routes to the correct specialist with full context",
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: "Reuse Context",
                description:
                  "Agents see saved context instead of starting from zero",
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: "Resolve with Oversight",
                description:
                  "Human approval ensures quality and accountability",
              },
            ].map((step, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                    {step.icon}
                  </div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{step.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Key Features */}
        <section className="container mx-auto px-4 py-20 border-t border-border/50">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why RelayDesk?
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                icon: <Users className="w-5 h-5" />,
                title: "Multi-Agent Coordination",
                description:
                  "Customer-facing agents, specialists, and humans work together through Aicoo",
              },
              {
                icon: <GitBranch className="w-5 h-5" />,
                title: "Smart Routing",
                description:
                  "AI-powered routing ensures requests reach the right team every time",
              },
              {
                icon: <Clock className="w-5 h-5" />,
                title: "Context Preservation",
                description:
                  "No more repeating yourself. Context moves with the case across handoffs",
              },
              {
                icon: <CheckCircle className="w-5 h-5" />,
                title: "Human Oversight",
                description:
                  "AI drafts resolutions, humans approve. Quality and accountability built-in",
              },
            ].map((feature, index) => (
              <div key={index} className="flex gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 py-20 border-t border-border/50 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to see it in action?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Experience how Aicoo coordinates multi-agent support workflows
            end-to-end.
          </p>
          <Link href="/demo">
            <Button size="lg" className="gap-2">
              Launch Demo <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Built for Aicoo Hackathon 2026. Powered by Aicoo + NVIDIA NIM.
        </div>
      </footer>
    </div>
  );
}
