"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Zap,
  Send,
  Loader2,
  HelpCircle,
  GitBranch,
  Users,
  Clock,
  CheckCircle,
} from "lucide-react";

interface Explanation {
  id: string;
  question: string;
  answer: string;
  sources: Array<{
    type: string;
    referenceId: string;
    description: string;
  }>;
  timestamp: string;
}

export default function AskPage() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [explanations, setExplanations] = useState<Explanation[]>([]);
  const [isAsking, setIsAsking] = useState(false);

  const suggestedQuestions = [
    "Why was this routed to billing?",
    "Why was this escalated?",
    "What context was shared?",
    "Who approved the final response?",
    "What role did Aicoo play here?",
    "How does multi-agent coordination work?",
  ];

  const handleAsk = async (questionText?: string) => {
    const q = questionText || question;
    if (!q.trim()) return;

    setIsAsking(true);
    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: q }),
      });

      if (response.ok) {
        const explanation = await response.json();
        setExplanations((prev) => [
          {
            id: Date.now().toString(),
            question: q,
            ...explanation,
            timestamp: new Date().toISOString(),
          },
          ...prev,
        ]);
        setQuestion("");
      }
    } catch (error) {
      console.error("Failed to ask question:", error);
    } finally {
      setIsAsking(false);
    }
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case "audit_event":
        return <Clock className="w-4 h-4" />;
      case "case_note":
        return <HelpCircle className="w-4 h-4" />;
      case "route_decision":
        return <GitBranch className="w-4 h-4" />;
      case "resolution":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <HelpCircle className="w-4 h-4" />;
    }
  };

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
            <h1 className="text-3xl font-bold mb-2">Ask RelayDesk</h1>
            <p className="text-muted-foreground">
              Ask questions about case routing, context sharing, and agent
              coordination.
            </p>
          </div>

          {/* Question Input */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <Input
                  placeholder="Ask a question about case routing, context, or coordination..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAsk()}
                  className="flex-1"
                />
                <Button
                  onClick={() => handleAsk()}
                  disabled={!question.trim() || isAsking}
                >
                  {isAsking ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Suggested Questions */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Suggested Questions</h2>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleAsk(q)}
                  disabled={isAsking}
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>

          {/* Explanations */}
          <div className="space-y-4">
            {explanations.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <HelpCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Ask anything about RelayDesk
                  </h3>
                  <p className="text-muted-foreground">
                    Ask questions about how requests are routed, what context is
                    shared, and how agents coordinate.
                  </p>
                </CardContent>
              </Card>
            ) : (
              explanations.map((explanation) => (
                <Card key={explanation.id}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <HelpCircle className="w-5 h-5" />
                      {explanation.question}
                    </CardTitle>
                    <CardDescription>
                      {new Date(explanation.timestamp).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-muted-foreground whitespace-pre-wrap">
                      {explanation.answer}
                    </div>

                    {explanation.sources && explanation.sources.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Sources</h4>
                        <div className="flex flex-wrap gap-2">
                          {explanation.sources.map((source, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="flex items-center gap-1"
                            >
                              {getSourceIcon(source.type)}
                              {source.description}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
