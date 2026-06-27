"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowRight,
  Zap,
  Users,
  GitBranch,
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  Loader2,
} from "lucide-react";

interface DemoScenario {
  id: string;
  title: string;
  description: string;
  category: string;
  urgency: string;
  subject: string;
  customerName: string;
  customerEmail: string;
}

const demoScenarios: DemoScenario[] = [
  {
    id: "billing-duplicate",
    title: "Duplicate Billing Charge",
    description: "Customer charged twice for monthly subscription",
    category: "billing",
    urgency: "high",
    subject: "Duplicate billing charge on my account",
    customerName: "John Smith",
    customerEmail: "john.smith@example.com",
  },
  {
    id: "refund-request",
    title: "Refund Request",
    description: "Customer wants refund for unused premium plan",
    category: "refund",
    urgency: "medium",
    subject: "Refund request for unused service",
    customerName: "Sarah Johnson",
    customerEmail: "sarah.j@example.com",
  },
  {
    id: "account-access",
    title: "Account Access Issue",
    description: "Customer locked out, not receiving reset emails",
    category: "account_access",
    urgency: "critical",
    subject: "Cannot access my account",
    customerName: "Mike Chen",
    customerEmail: "mike.chen@example.com",
  },
  {
    id: "product-bug",
    title: "Product Bug Report",
    description: "Dashboard showing incorrect data in reports",
    category: "product_bug",
    urgency: "high",
    subject: "Bug in dashboard reporting feature",
    customerName: "Emily Davis",
    customerEmail: "emily.d@example.com",
  },
  {
    id: "onboarding",
    title: "Onboarding Setup Help",
    description: "New user needs help with workspace setup",
    category: "onboarding",
    urgency: "low",
    subject: "Need help with initial setup",
    customerName: "Alex Wilson",
    customerEmail: "alex.w@example.com",
  },
];

export default function DemoPage() {
  const router = useRouter();
  const [selectedScenario, setSelectedScenario] = useState<DemoScenario | null>(null);
  const [customSubject, setCustomSubject] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [demoDataSeeded, setDemoDataSeeded] = useState(false);
  const [seedingLoading, setSeedingLoading] = useState(true);
  const [seedingError, setSeedingError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const seedDemo = async () => {
    setSeedingLoading(true);
    setSeedingError(null);
    try {
      const res = await fetch("/api/demo", { method: "POST" });
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Seeding returned success=false");
      }
      setDemoDataSeeded(true);
    } catch (error: any) {
      console.error("Failed to seed demo data:", error);
      setSeedingError(error.message || "Unknown error");
    } finally {
      setSeedingLoading(false);
    }
  };

  useEffect(() => {
    seedDemo();
  }, []);

  const handleScenarioSelect = (scenario: DemoScenario) => {
    setSelectedScenario(scenario);
    setCustomSubject(scenario.subject);
    setCustomDescription(scenario.description);
    setCustomerName(scenario.customerName);
    setCustomerEmail(scenario.customerEmail);
  };

  const handleSubmit = async () => {
    if (!customSubject || !customDescription || !customerName || !customerEmail) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: customSubject,
          description: customDescription,
          customerInfo: {
            id: `cust-${Date.now()}`,
            name: customerName,
            email: customerEmail,
          },
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned ${response.status}`);
      }

      const result = await response.json();
      router.push(`/cases/${result.request.id}`);
    } catch (error: any) {
      console.error("Failed to submit request:", error);
      setSubmitError(error.message || "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <Button variant="ghost" onClick={() => router.push("/")}>
              Home
            </Button>
            <Button variant="ghost" onClick={() => router.push("/inbox")}>
              Inbox
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Seeding Error Banner */}
          {seedingError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                <div>
                  <p className="font-medium text-red-500">Demo data failed to load</p>
                  <p className="text-sm text-muted-foreground">{seedingError}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={seedDemo} disabled={seedingLoading}>
                {seedingLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Retry
              </Button>
            </div>
          )}

          {/* Seeding Loading Banner */}
          {seedingLoading && !seedingError && (
            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin shrink-0" />
              <p className="text-sm text-muted-foreground">Loading demo data...</p>
            </div>
          )}

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Demo Mode</h1>
            <p className="text-muted-foreground">
              Select a scenario or create a custom support request to see
              RelayDesk in action.
            </p>
          </div>

          {/* Demo Scenarios */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Quick Start Scenarios</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {demoScenarios.map((scenario) => (
                <Card
                  key={scenario.id}
                  className={`cursor-pointer transition-all hover:border-primary ${
                    selectedScenario?.id === scenario.id
                      ? "border-primary bg-primary/5"
                      : ""
                  }`}
                  onClick={() => handleScenarioSelect(scenario)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{scenario.title}</CardTitle>
                      <Badge
                        variant={
                          scenario.urgency === "critical"
                            ? "destructive"
                            : scenario.urgency === "high"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {scenario.urgency}
                      </Badge>
                    </div>
                    <CardDescription>{scenario.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MessageSquare className="w-4 h-4" />
                      <span>{scenario.customerName}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Custom Request Form */}
          <Card>
            <CardHeader>
              <CardTitle>Create Support Request</CardTitle>
              <CardDescription>
                {selectedScenario
                  ? `Using scenario: ${selectedScenario.title}`
                  : "Fill in the details to create a new support request"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="John Smith"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerEmail">Customer Email</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="Brief description of the issue"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="Detailed description of the support request..."
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedScenario(null);
                    setCustomSubject("");
                    setCustomDescription("");
                    setCustomerName("");
                    setCustomerEmail("");
                    setSubmitError(null);
                  }}
                >
                  Clear
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={
                    !customSubject ||
                    !customDescription ||
                    !customerName ||
                    !customerEmail ||
                    isSubmitting ||
                    seedingError !== null
                  }
                  className="gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Submit Request
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>

              {/* Submit Error Banner */}
              {submitError && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-sm text-red-500">{submitError}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* How the Demo Works */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>How the Demo Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-medium">1. AI Understanding</h3>
                      <p className="text-sm text-muted-foreground">
                        NVIDIA NIM analyzes the request for category, urgency,
                        and sentiment
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                      <GitBranch className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-medium">2. Aicoo Routing</h3>
                      <p className="text-sm text-muted-foreground">
                        Request is routed to the right specialist agent via
                        Aicoo coordination
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-medium">3. Context Handoff</h3>
                      <p className="text-sm text-muted-foreground">
                        Specialist sees full context without asking the customer
                        to repeat themselves
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-medium">4. Human Oversight</h3>
                      <p className="text-sm text-muted-foreground">
                        AI drafts resolution, human reviews and approves before
                        sending
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
