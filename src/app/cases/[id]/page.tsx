"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Zap,
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  GitBranch,
  Shield,
  Loader2,
  Send,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  HelpCircle,
} from "lucide-react";

interface CaseState {
  request: {
    id: string;
    customerId: string;
    customerName: string;
    customerEmail: string;
    subject: string;
    description: string;
    category: string;
    urgency: string;
    sentiment: string;
    missingInformation: string[];
    likelyResolverTeam: string;
    riskScore: number;
    createdAt: string;
    updatedAt: string;
    status: string;
  };
  context: {
    id: string;
    originalRequest: string;
    problemSummary: string;
    customerMetadata: Record<string, any>;
    priorSteps: Array<{
      step: string;
      agentId: string;
      timestamp: string;
      notes?: string;
    }>;
    notes: Array<{
      id: string;
      agentId: string;
      content: string;
      timestamp: string;
    }>;
    resolutionState: string;
    approvalState: string;
  };
  notes: Array<{
    id: string;
    requestId: string;
    agentId: string;
    agentName: string;
    content: string;
    timestamp: string;
    type: string;
  }>;
  routes: Array<{
    id: string;
    requestId: string;
    fromAgentId: string;
    toAgentId: string;
    reason: string;
    contextShared: string[];
    confidence: number;
    timestamp: string;
    status: string;
  }>;
  resolutions: Array<{
    id: string;
    requestId: string;
    agentId: string;
    agentName: string;
    customerResponse: string;
    internalNote: string;
    followUpTask?: string;
    nextOwner?: string;
    caseSummary: string;
    timestamp: string;
    status: string;
  }>;
  approvals: Array<{
    id: string;
    requestId: string;
    resolutionId: string;
    approverId: string;
    approverName: string;
    action: string;
    reason?: string;
    timestamp: string;
  }>;
  auditEvents: Array<{
    id: string;
    requestId: string;
    eventType: string;
    agentId: string;
    agentName: string;
    agentType: string;
    details: string;
    metadata?: Record<string, any>;
    timestamp: string;
  }>;
}

interface Agent {
  id: string;
  name: string;
  type: string;
  role: string;
  team: string;
  capabilities: string[];
  isOnline: boolean;
  currentCases: number;
  maxCases: number;
}

export default function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [caseState, setCaseState] = useState<CaseState | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteContent, setNoteContent] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isDraftingResolution, setIsDraftingResolution] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [resolutionReason, setResolutionReason] = useState("");

  useEffect(() => {
    if (id) {
      fetchCaseState();
      fetchAgents();
    }
  }, [id]);

  const fetchCaseState = async () => {
    try {
      const response = await fetch(`/api/cases/${id}`);
      if (response.ok) {
        const data = await response.json();
        setCaseState(data);
      }
    } catch (error) {
      console.error("Failed to fetch case state:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await fetch("/api/agents");
      if (response.ok) {
        const data = await response.json();
        setAgents(data);
      }
    } catch (error) {
      console.error("Failed to fetch agents:", error);
    }
  };

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;

    setIsSubmittingNote(true);
    try {
      await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId: id,
          agentId: "current_agent",
          agentName: "Current Agent",
          content: noteContent,
          type: "internal",
        }),
      });
      setNoteContent("");
      fetchCaseState();
    } catch (error) {
      console.error("Failed to add note:", error);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleDraftResolution = async () => {
    setIsDraftingResolution(true);
    try {
      await fetch("/api/resolution", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId: id,
          agentId: "current_agent",
          agentName: "Current Agent",
          action: "draft",
        }),
      });
      fetchCaseState();
    } catch (error) {
      console.error("Failed to draft resolution:", error);
    } finally {
      setIsDraftingResolution(false);
    }
  };

  const handleApproveResolution = async (
    draftId: string,
    action: "approve" | "reject" | "override" | "request_more_context"
  ) => {
    try {
      await fetch("/api/resolution", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          draftId,
          approverId: "human_approver",
          approverName: "Human Approver",
          action,
          reason: resolutionReason || undefined,
        }),
      });
      setResolutionReason("");
      fetchCaseState();
    } catch (error) {
      console.error("Failed to approve resolution:", error);
    }
  };

  const handleRouteToAgent = async (agentId: string) => {
    if (!agentId) return;

    try {
      await fetch("/api/routing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId: id,
          agentId,
          reason: "Manual re-routing by operator",
        }),
      });
      setSelectedAgent("");
      fetchCaseState();
    } catch (error) {
      console.error("Failed to route request:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "received":
        return "bg-blue-500/10 text-blue-500";
      case "triaged":
        return "bg-yellow-500/10 text-yellow-500";
      case "routed":
        return "bg-purple-500/10 text-purple-500";
      case "enriched":
        return "bg-green-500/10 text-green-500";
      case "escalated":
        return "bg-red-500/10 text-red-500";
      case "resolved":
        return "bg-emerald-500/10 text-emerald-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case "request_received":
        return <MessageSquare className="w-4 h-4" />;
      case "triage_completed":
        return <CheckCircle className="w-4 h-4" />;
      case "routed":
        return <GitBranch className="w-4 h-4" />;
      case "context_shared":
        return <User className="w-4 h-4" />;
      case "agent_joined":
        return <User className="w-4 h-4" />;
      case "note_added":
        return <MessageSquare className="w-4 h-4" />;
      case "resolution_drafted":
        return <CheckCircle className="w-4 h-4" />;
      case "resolution_approved":
        return <ThumbsUp className="w-4 h-4" />;
      case "resolution_rejected":
        return <ThumbsDown className="w-4 h-4" />;
      case "escalated":
        return <AlertTriangle className="w-4 h-4" />;
      case "resolved":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!caseState) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Case not found</h2>
          <Button onClick={() => router.push("/inbox")}>Back to Inbox</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/inbox")}>
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
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={getStatusColor(caseState.request.status)}>
              {caseState.request.status}
            </Badge>
            <Badge variant={caseState.request.urgency === "critical" ? "destructive" : "secondary"}>
              {caseState.request.urgency}
            </Badge>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Resolved Case Screen */}
          {caseState.request.status === "resolved" && (
            <div className="mb-8">
              <Card className="border-emerald-500/20 bg-emerald-500/5">
                <CardHeader className="text-center">
                  <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                  </div>
                  <CardTitle className="text-2xl text-emerald-500">Case Resolved</CardTitle>
                  <CardDescription>
                    This case has been resolved through cross-agent coordination
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Coordination Trace */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <GitBranch className="w-4 h-4" />
                      Cross-Agent Coordination Trace
                    </h3>
                    <div className="space-y-3">
                      {caseState.routes.map((route) => {
                        const fromAgent = agents.find((a) => a.id === route.fromAgentId);
                        const toAgent = agents.find((a) => a.id === route.toAgentId);
                        return (
                          <div key={route.id} className="flex items-center gap-3 text-sm">
                            <Badge variant="outline" className="shrink-0">
                              {new Date(route.timestamp).toLocaleTimeString()}
                            </Badge>
                            <span className="text-muted-foreground">
                              {fromAgent?.name || "System"} → {toAgent?.name || route.toAgentId}
                            </span>
                            <Badge variant="secondary" className="shrink-0">
                              {(route.confidence * 100).toFixed(0)}% confidence
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <Separator />

                  {/* Resolution Summary */}
                  {caseState.resolutions.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Final Resolution
                      </h3>
                      <div className="bg-muted rounded-lg p-4 space-y-3">
                        <div>
                          <span className="text-sm font-medium">Summary:</span>
                          <p className="text-sm text-muted-foreground">
                            {caseState.resolutions[caseState.resolutions.length - 1].caseSummary}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium">Customer Response:</span>
                          <p className="text-sm text-muted-foreground">
                            {caseState.resolutions[caseState.resolutions.length - 1].customerResponse}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Audit Summary */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Complete Audit Trail
                    </h3>
                    <div className="space-y-2">
                      {caseState.auditEvents.map((event) => (
                        <div key={event.id} className="flex items-center gap-3 text-sm">
                          <div className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center shrink-0">
                            {getEventTypeIcon(event.eventType)}
                          </div>
                          <span className="text-muted-foreground shrink-0">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                          <span className="font-medium">{event.agentName}</span>
                          <span className="text-muted-foreground truncate">{event.details}</span>
                          {event.metadata?.aicooOperation && (
                            <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-500 border-purple-500/20 shrink-0">
                              Aicoo
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-center pt-4">
                    <Button onClick={() => router.push("/inbox")}>
                      Back to Inbox
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Normal Case View (when not resolved) */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Request Details */}
              <Card>
                <CardHeader>
                  <CardTitle>{caseState.request.subject}</CardTitle>
                  <CardDescription>
                    From {caseState.request.customerName} •{" "}
                    {new Date(caseState.request.createdAt).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {caseState.request.description}
                  </p>
                  <Separator className="my-4" />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Category:</span>{" "}
                      <span className="capitalize">
                        {caseState.request.category.replace("_", " ")}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Sentiment:</span>{" "}
                      <span className="capitalize">{caseState.request.sentiment}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Risk Score:</span>{" "}
                      <span>{(caseState.request.riskScore * 100).toFixed(0)}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Team:</span>{" "}
                      <span>{caseState.request.likelyResolverTeam}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs */}
              <Tabs defaultValue="timeline">
                <TabsList>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                  <TabsTrigger value="resolution">Resolution</TabsTrigger>
                </TabsList>

                {/* Timeline Tab */}
                <TabsContent value="timeline" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Case Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-96">
                        <div className="space-y-4">
                          {caseState.auditEvents.map((event) => (
                            <div key={event.id} className="flex gap-4">
                              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                                {getEventTypeIcon(event.eventType)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium">{event.agentName}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {new Date(event.timestamp).toLocaleString()}
                                  </span>
                                  {event.metadata?.aicooOperation && (
                                    <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-500 border-purple-500/20">
                                      Aicoo: {event.metadata.aicooOperation}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {event.details}
                                </p>
                                {event.metadata?.aicooShareLink && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Share link: <a href={event.metadata.aicooShareLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">Open context cell</a>
                                  </p>
                                )}
                                {event.metadata?.aicooRoutingAnalysis && (
                                  <p className="text-xs text-muted-foreground mt-1 italic">
                                    Coordination note: {event.metadata.aicooRoutingAnalysis}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Notes Tab */}
                <TabsContent value="notes" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Add Note</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Textarea
                          placeholder="Add a note to this case..."
                          value={noteContent}
                          onChange={(e) => setNoteContent(e.target.value)}
                          rows={3}
                        />
                        <Button
                          onClick={handleAddNote}
                          disabled={!noteContent.trim() || isSubmittingNote}
                        >
                          {isSubmittingNote ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Send className="w-4 h-4 mr-2" />
                          )}
                          Add Note
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Notes History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-64">
                        <div className="space-y-4">
                          {caseState.notes.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">
                              No notes yet
                            </p>
                          ) : (
                            caseState.notes.map((note) => (
                              <div key={note.id} className="border rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-medium">{note.agentName}</span>
                                  <Badge variant="outline">{note.type}</Badge>
                                  <span className="text-sm text-muted-foreground">
                                    {new Date(note.timestamp).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-sm">{note.content}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Resolution Tab */}
                <TabsContent value="resolution" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Draft Resolution</CardTitle>
                      <CardDescription>
                        Use AI to draft a resolution based on case context
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={handleDraftResolution}
                        disabled={isDraftingResolution}
                      >
                        {isDraftingResolution ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Zap className="w-4 h-4 mr-2" />
                        )}
                        Draft Resolution with AI
                      </Button>
                    </CardContent>
                  </Card>

                  {caseState.resolutions.map((resolution) => (
                    <Card key={resolution.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">Resolution Draft</CardTitle>
                          <Badge
                            variant={
                              resolution.status === "approved"
                                ? "default"
                                : resolution.status === "rejected"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {resolution.status}
                          </Badge>
                        </div>
                        <CardDescription>
                          By {resolution.agentName} •{" "}
                          {new Date(resolution.timestamp).toLocaleString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Customer Response</h4>
                          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                            {resolution.customerResponse}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Internal Note</h4>
                          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                            {resolution.internalNote}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Case Summary</h4>
                          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                            {resolution.caseSummary}
                          </div>
                        </div>

                        {resolution.status === "pending_review" && (
                          <div className="border-t pt-4">
                            <h4 className="font-medium mb-2">Human Review</h4>
                            <Textarea
                              placeholder="Reason for decision (optional)"
                              value={resolutionReason}
                              onChange={(e) => setResolutionReason(e.target.value)}
                              rows={2}
                              className="mb-2"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleApproveResolution(resolution.id, "approve")
                                }
                              >
                                <ThumbsUp className="w-4 h-4 mr-2" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  handleApproveResolution(resolution.id, "reject")
                                }
                              >
                                <ThumbsDown className="w-4 h-4 mr-2" />
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleApproveResolution(resolution.id, "override")
                                }
                              >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Override
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleApproveResolution(
                                    resolution.id,
                                    "request_more_context"
                                  )
                                }
                              >
                                <HelpCircle className="w-4 h-4 mr-2" />
                                Need More Info
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Current Owner */}
              {caseState.routes.length > 0 && (
                <Card className="border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Current Owner</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const lastRoute = caseState.routes[caseState.routes.length - 1];
                      const owner = agents.find((a) => a.id === lastRoute.toAgentId);
                      if (!owner) return <p className="text-sm text-muted-foreground">Unassigned</p>;
                      return (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium">{owner.name}</p>
                            <p className="text-sm text-muted-foreground">{owner.team} • {owner.type}</p>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}

              {/* Case Context */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Case Context</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-1">Problem Summary</h4>
                    <p className="text-sm text-muted-foreground">
                      {caseState.context?.problemSummary || "No summary yet"}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-1">Missing Information</h4>
                    <div className="flex flex-wrap gap-1">
                      {caseState.request.missingInformation.length === 0 ? (
                        <span className="text-sm text-muted-foreground">None</span>
                      ) : (
                        caseState.request.missingInformation.map((info, index) => (
                          <Badge key={index} variant="outline">
                            {info}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-1">Resolution State</h4>
                    <Badge
                      variant={
                        caseState.context?.resolutionState === "resolved"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {caseState.context?.resolutionState || "pending"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Route to Agent */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Route to Agent</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Agent</Label>
                    <select
                      className="w-full p-2 border rounded-md bg-background"
                      value={selectedAgent}
                      onChange={(e) => setSelectedAgent(e.target.value)}
                    >
                      <option value="">Choose an agent...</option>
                      {agents
                        .filter((agent) => agent.isOnline)
                        .map((agent) => (
                          <option key={agent.id} value={agent.id}>
                            {agent.name} ({agent.team})
                          </option>
                        ))}
                    </select>
                  </div>
                  <Button
                    onClick={() => handleRouteToAgent(selectedAgent)}
                    disabled={!selectedAgent}
                    className="w-full"
                  >
                    <GitBranch className="w-4 h-4 mr-2" />
                    Route Request
                  </Button>
                </CardContent>
              </Card>

              {/* Routing History */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Routing History</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-4">
                      {caseState.routes.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">
                          No routing history
                        </p>
                      ) : (
                        caseState.routes.map((route) => (
                          <div key={route.id} className="border rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <GitBranch className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                {new Date(route.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {route.reason}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">
                                Confidence: {(route.confidence * 100).toFixed(0)}%
                              </Badge>
                            </div>
                            {route.contextShared && route.contextShared.length > 0 && (
                              <div className="mt-2">
                                <span className="text-xs text-muted-foreground">Context shared: </span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {route.contextShared.map((ctx, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                      {ctx}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
