"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Zap,
  Users,
  GitBranch,
  Shield,
  Clock,
  CheckCircle,
  Database,
  Brain,
  Network,
} from "lucide-react";

export default function ArchitecturePage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">RelayDesk</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Architecture</h1>
            <p className="text-muted-foreground">
              How RelayDesk uses Aicoo as the coordination layer for
              multi-agent support workflows.
            </p>
          </div>

          {/* Problem Statement */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>The Problem</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Support work breaks when every handoff loses context. Multi-team
                coordination is slow. AI agents need identities and routing, not
                just model calls. Customers repeat themselves. Agents start from
                zero. Escalations lack context.
              </p>
            </CardContent>
          </Card>

          {/* Solution */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>The Solution: RelayDesk</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                RelayDesk uses Aicoo as the coordination layer that makes
                people, agents, and workflows work together. Every actor has an
                identity. Every handoff preserves context. Every action is
                auditable.
              </p>
            </CardContent>
          </Card>

          {/* System Overview */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>System Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                      <Brain className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">NVIDIA NIM</h3>
                      <p className="text-sm text-muted-foreground">
                        AI inference for request understanding, routing
                        decisions, resolution drafting, and grounded Q&A
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                      <Network className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Aicoo</h3>
                      <p className="text-sm text-muted-foreground">
                        Coordination layer for agent identities, routing,
                        context sharing, and cross-team workflows
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Multi-Agent System</h3>
                      <p className="text-sm text-muted-foreground">
                        Customer-facing agents, specialists, and human
                        escalation managers working together
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Context Persistence</h3>
                      <p className="text-sm text-muted-foreground">
                        Case context, notes, and audit trails preserved across
                        all handoffs
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Request Lifecycle */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Request Lifecycle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    step: "1",
                    title: "Receive",
                    description: "Customer submits support request",
                    icon: <Clock className="w-5 h-5" />,
                  },
                  {
                    step: "2",
                    title: "Triage",
                    description: "AI analyzes category, urgency, and sentiment",
                    icon: <Brain className="w-5 h-5" />,
                  },
                  {
                    step: "3",
                    title: "Route",
                    description: "Aicoo routes to the right specialist agent",
                    icon: <GitBranch className="w-5 h-5" />,
                  },
                  {
                    step: "4",
                    title: "Enrich",
                    description: "Context shared with specialist, notes added",
                    icon: <Users className="w-5 h-5" />,
                  },
                  {
                    step: "5",
                    title: "Resolve",
                    description: "AI drafts resolution, human reviews",
                    icon: <CheckCircle className="w-5 h-5" />,
                  },
                  {
                    step: "6",
                    title: "Audit",
                    description: "Complete trail of all actions and decisions",
                    icon: <Shield className="w-5 h-5" />,
                  },
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">Step {item.step}</Badge>
                        <h3 className="font-semibold">{item.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Aicoo Identity Model */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Aicoo Identity Model</CardTitle>
              <CardDescription>
                Every actor in the system has a clear identity and role
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  {
                    name: "Customer Support Bot",
                    type: "customer_facing",
                    team: "Support",
                    capabilities: ["intake", "triage", "basic_resolution"],
                  },
                  {
                    name: "Billing Specialist",
                    type: "specialist",
                    team: "Finance",
                    capabilities: [
                      "billing_analysis",
                      "refund_processing",
                      "payment_issues",
                    ],
                  },
                  {
                    name: "Technical Support Agent",
                    type: "specialist",
                    team: "Engineering",
                    capabilities: [
                      "bug_analysis",
                      "technical_debugging",
                      "system_issues",
                    ],
                  },
                  {
                    name: "Onboarding Specialist",
                    type: "specialist",
                    team: "Customer Success",
                    capabilities: [
                      "setup_assistance",
                      "training",
                      "adoption",
                    ],
                  },
                  {
                    name: "Escalation Manager",
                    type: "escalation_manager",
                    team: "Management",
                    capabilities: [
                      "escalation_handling",
                      "override_authority",
                      "final_approval",
                    ],
                  },
                ].map((agent, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{agent.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {agent.team}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="mb-2">
                      {agent.type}
                    </Badge>
                    <div className="flex flex-wrap gap-1">
                      {agent.capabilities.map((cap, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {cap}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* How Aicoo is Used */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>How Aicoo is Used</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Agent Identities</h3>
                  <p className="text-sm text-muted-foreground">
                    Every agent has a clear Aicoo identity with role, team, and
                    capabilities. This enables access-aware routing and context
                    sharing.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Cross-Agent Routing</h3>
                  <p className="text-sm text-muted-foreground">
                    Requests are routed through Aicoo to the correct specialist
                    based on category, urgency, and team availability.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Context Persistence</h3>
                  <p className="text-sm text-muted-foreground">
                    Case context is stored in Aicoo and shared with agents
                    through Mountable Context Cells, ensuring each agent sees
                    only what they need.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Human Handoff</h3>
                  <p className="text-sm text-muted-foreground">
                    When AI cannot resolve, Aicoo facilitates handoff to human
                    agents with full context preserved.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Why Aicoo is Central */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Why Aicoo is Central, Not Decorative</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    <strong>Without Aicoo:</strong> Agents are isolated. Context
                    is lost at every handoff. Routing is manual. Escalations
                    lack context.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    <strong>With Aicoo:</strong> Agents have identities. Context
                    moves with the case. Routing is intelligent. Every action is
                    auditable.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    <strong>Result:</strong> Faster resolution, happier
                    customers, accountable workflows, and a coordination layer
                    that scales across teams.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
