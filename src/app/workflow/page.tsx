"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Zap,
  Users,
  GitBranch,
  Shield,
  Clock,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

export default function WorkflowPage() {
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
            <h1 className="text-3xl font-bold mb-2">Aicoo Workflow</h1>
            <p className="text-muted-foreground">
              See how Aicoo coordinates multi-agent support workflows
              end-to-end.
            </p>
          </div>

          {/* Workflow Diagram */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Coordination Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Customer */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Customer</h3>
                    <p className="text-sm text-muted-foreground">
                      Submits support request
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </div>

                {/* Aicoo Identity Layer */}
                <div className="ml-8 border-l-2 border-primary/20 pl-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                      <Zap className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Aicoo Identity Layer</h3>
                      <p className="text-sm text-muted-foreground">
                        Request enters with customer context
                      </p>
                    </div>
                  </div>

                  {/* Customer-Facing Agent */}
                  <div className="ml-8 border-l-2 border-primary/20 pl-6 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center text-green-500">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">
                          Customer Support Bot
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Receives request, triages with AI
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">intake</Badge>
                          <Badge variant="outline">triage</Badge>
                          <Badge variant="outline">category</Badge>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Routing Decision */}
                  <div className="ml-8 border-l-2 border-primary/20 pl-6 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-500">
                        <GitBranch className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">Aicoo Routing</h3>
                        <p className="text-sm text-muted-foreground">
                          Routes to specialist based on category and urgency
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">category</Badge>
                          <Badge variant="outline">urgency</Badge>
                          <Badge variant="outline">team</Badge>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Specialist Agent */}
                  <div className="ml-8 border-l-2 border-primary/20 pl-6 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center text-yellow-500">
                        <Users className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">Specialist Agent</h3>
                        <p className="text-sm text-muted-foreground">
                          Receives full context, works on resolution
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">context</Badge>
                          <Badge variant="outline">draft</Badge>
                          <Badge variant="outline">notes</Badge>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Human Review */}
                  <div className="ml-8 border-l-2 border-primary/20 pl-6 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center text-red-500">
                        <Shield className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">Human Escalation</h3>
                        <p className="text-sm text-muted-foreground">
                          Human reviews and approves resolution
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">review</Badge>
                          <Badge variant="outline">approve</Badge>
                          <Badge variant="outline">override</Badge>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Resolution */}
                  <div className="ml-8 border-l-2 border-primary/20 pl-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">Resolved</h3>
                        <p className="text-sm text-muted-foreground">
                          Case resolved with full audit trail
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">audit</Badge>
                          <Badge variant="outline">context</Badge>
                          <Badge variant="outline">history</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Context Flow */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Context Flow Through Aicoo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Customer Request</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Subject & description</li>
                    <li>• Customer metadata</li>
                    <li>• Contact information</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">AI Analysis</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Category classification</li>
                    <li>• Urgency assessment</li>
                    <li>• Sentiment analysis</li>
                    <li>• Missing information</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Specialist Context</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Full request history</li>
                    <li>• Prior agent notes</li>
                    <li>• Routing decisions</li>
                    <li>• Resolution drafts</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <Card>
            <CardContent className="py-8 text-center">
              <h2 className="text-2xl font-bold mb-4">
                See it in action
              </h2>
              <p className="text-muted-foreground mb-6">
                Experience the full workflow with a demo request
              </p>
              <Button onClick={() => router.push("/demo")} size="lg">
                Try Demo <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
