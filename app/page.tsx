"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTheme } from "next-themes";
import { Moon, Sun, Send, Download, Copy, CheckCircle2 } from "lucide-react";
import { useAppStore, AgentRole } from "@/lib/store";
import { matchPsychiatrists } from "@/lib/matching";
import { PsychiatristCard } from "@/components/psychiatrist-card";
import { AlertCircle } from "lucide-react";

/**
 * Main chat interface component
 * Single-page application with multi-agent system
 */
export default function Home() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [copied, setCopied] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const {
    messages,
    isProcessing,
    currentAgent,
    intakeComplete,
    summaryComplete,
    recommendationsComplete,
    summary,
    recommendations,
    selectedPsychiatrist,
    addMessage,
    setIsProcessing,
    setCurrentAgent,
    setIntakeComplete,
    setSummaryComplete,
    setRecommendationsComplete,
    setSummary,
    setRecommendations,
    setSelectedPsychiatrist,
    setBookingComplete,
  } = useAppStore();

  useEffect(() => {
    setMounted(true);
    // Initialize with intake agent greeting
    if (messages.length === 0) {
      addMessage({
        role: "assistant",
        content: "Hello, I'm here to help you through your psychiatric intake assessment. What brings you in today?",
        agent: "intake",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /**
   * Handle user message and route to appropriate agent
   */
  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userContent = input.trim();
    addMessage({
      role: "user",
      content: userContent,
    });
    setInput("");
    setIsProcessing(true);

    try {
      // Get response from current agent
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: userContent }],
          agentRole: currentAgent,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      addMessage({
        role: "assistant",
        content: data.message,
        agent: currentAgent,
      });

      // Transition logic between agents
      await handleAgentTransition(userContent.toLowerCase());
    } catch (error) {
      console.error("Chat error:", error);
      addMessage({
        role: "assistant",
        content: "I apologize, I encountered an error. Please try again.",
        agent: currentAgent,
      });
    } finally {
      setIsProcessing(false);
      inputRef.current?.focus();
    }
  };

  /**
   * Handle transitions between agents based on conversation state
   */
  const handleAgentTransition = async (userInput: string) => {
    // Check if user wants to finish intake or see summary
    if ((userInput.includes("finish") || userInput.includes("done") || userInput.includes("complete")) && !intakeComplete && currentAgent === "intake") {
      await transitionToSummary();
    } else if ((userInput.includes("summary") || userInput.includes("show summary")) && summaryComplete) {
      setShowSummary(true);
    } else if (userInput.includes("recommendations") && summaryComplete && !recommendationsComplete) {
      await transitionToRecommendations();
    }
  };

  /**
   * Transition from Intake to Summary Agent
   */
  const transitionToSummary = async () => {
    setIsProcessing(true);
    try {
      // Extract structured summary
      const response = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });

      if (!response.ok) throw new Error("Failed to generate summary");

      const data = await response.json();
      const extractedSummary = data.summary;

      // Merge PHQ-9 data if available
      if (summary?.phq9) {
        extractedSummary.phq9 = summary.phq9;
      }

      setSummary(extractedSummary);
      setIntakeComplete(true);
      setCurrentAgent("summary");

      addMessage({
        role: "assistant",
        content: "I've completed your intake assessment and generated a clinical summary. Would you like to review it? You can also ask for psychiatrist recommendations.",
        agent: "summary",
      });
    } catch (error) {
      console.error("Summary generation error:", error);
      addMessage({
        role: "assistant",
        content: "I encountered an error generating your summary. Please try again.",
        agent: "summary",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Transition from Summary to Recommendation Agent
   */
  const transitionToRecommendations = async () => {
    if (!summary) return;

    setIsProcessing(true);
    try {
      // Get psychiatrist recommendations
      const matched = matchPsychiatrists(summary, 5);
      setRecommendations(matched);
      setRecommendationsComplete(true);
      setCurrentAgent("recommendation");

      addMessage({
        role: "assistant",
        content: `Based on your intake assessment, I've found ${matched.length} recommended psychiatrists. Please review them below and select one to book an appointment.`,
        agent: "recommendation",
      });
    } catch (error) {
      console.error("Recommendations error:", error);
      addMessage({
        role: "assistant",
        content: "I encountered an error generating recommendations. Please try again.",
        agent: "recommendation",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Export summary as JSON
   */
  const handleExport = () => {
    if (!summary) return;
    const dataStr = JSON.stringify(summary, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `clinical-summary-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Copy summary to clipboard for EMR
   */
  const handleCopyToClipboard = async () => {
    if (!summary) return;
    
    const formatted = formatSummaryForEMR(summary);
    await navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /**
   * Format summary for EMR pasting
   */
  const formatSummaryForEMR = (summary: any): string => {
    return `
CLINICAL SUMMARY
Generated: ${new Date().toLocaleDateString()}

CHIEF COMPLAINT:
${summary.chiefComplaint || "Not reported"}

HISTORY OF PRESENT ILLNESS:
${summary.historyOfPresentIllness?.course || "Not reported"}

SYMPTOMS:
${summary.symptoms?.map((s: any) => `- ${s.symptom} (${s.severity}, ${s.duration})`).join("\n") || "None reported"}

PHQ-9 SCORE: ${summary.phq9?.totalScore || "Not completed"} (${summary.phq9?.severity || "N/A"})

SAFETY CONCERNS:
${summary.safetyConcerns?.riskLevel || "Low"} - ${summary.safetyConcerns?.notes || "None"}

PREFERENCES:
Insurance: ${summary.preferences?.insurance || "Not specified"}
Location: ${summary.preferences?.location || "Not specified"}
    `.trim();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">AI Psychiatry Intake Assistant</h1>
          <div className="flex items-center gap-4">
            {summaryComplete && (
              <>
                <Button variant="outline" size="sm" onClick={() => setShowSummary(!showSummary)}>
                  {showSummary ? "Hide" : "Show"} Summary
                </Button>
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopyToClipboard}>
                  {copied ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy for EMR
                    </>
                  )}
                </Button>
              </>
            )}
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 px-4 py-6">
            <div className="max-w-4xl mx-auto space-y-4">
              {/* Disclaimer */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Important:</strong> This AI assistant does not provide diagnoses or emergency services.
                  If you are experiencing a mental health emergency, please contact your local emergency services or the National Suicide Prevention Lifeline at 988.
                </AlertDescription>
              </Alert>

              {/* Messages */}
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <Card
                    className={`max-w-[80%] p-4 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card"
                    }`}
                  >
                    {message.agent && message.role === "assistant" && (
                      <Badge variant="secondary" className="mb-2 text-xs">
                        {message.agent}
                      </Badge>
                    )}
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </Card>
                </div>
              ))}

              {isProcessing && (
                <div className="flex justify-start">
                  <Card className="bg-card p-4">
                    <div className="flex items-center gap-2">
                      <div className="animate-pulse">Thinking...</div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Recommendations Display */}
              {recommendationsComplete && recommendations.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Recommended Psychiatrists</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {recommendations.map((psych) => (
                      <PsychiatristCard
                        key={psych.id}
                        psychiatrist={psych}
                        selected={selectedPsychiatrist?.id === psych.id}
                        onSelect={async (selectedPsych) => {
                          setSelectedPsychiatrist(selectedPsych);
                          setCurrentAgent("booking");
                          addMessage({
                            role: "assistant",
                            content: `Great choice! You've selected ${selectedPsych.name}. Let's book your appointment. What's your preferred date and time?`,
                            agent: "booking",
                          });
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t border-border p-4 bg-card">
            <div className="max-w-4xl mx-auto flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type your message..."
                disabled={isProcessing}
                className="flex-1 h-12 text-lg"
              />
              <Button
                onClick={handleSend}
                disabled={isProcessing || !input.trim()}
                size="lg"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Panel */}
        {showSummary && summary && (
          <div className="w-96 border-l border-border bg-card p-4 overflow-y-auto">
            <ScrollArea className="h-full">
              <h2 className="text-lg font-bold mb-4">Clinical Summary</h2>
              <div className="space-y-4 text-sm">
                <div>
                  <strong>Chief Complaint:</strong>
                  <p className="mt-1">{summary.chiefComplaint || "Not reported"}</p>
                </div>

                {summary.phq9 && (
                  <div>
                    <strong>PHQ-9 Score:</strong>
                    <p className="mt-1">
                      {summary.phq9.totalScore}/27 ({summary.phq9.severity})
                    </p>
                  </div>
                )}

                <div>
                  <strong>Safety Risk:</strong>
                  <Badge className="ml-2" variant={
                    summary.safetyConcerns?.riskLevel === "emergency" ? "destructive" :
                    summary.safetyConcerns?.riskLevel === "high" ? "default" : "secondary"
                  }>
                    {summary.safetyConcerns?.riskLevel || "low"}
                  </Badge>
                </div>

                {summary.symptoms && summary.symptoms.length > 0 && (
                  <div>
                    <strong>Symptoms:</strong>
                    <ul className="mt-1 list-disc list-inside">
                      {summary.symptoms.map((s: any, i: number) => (
                        <li key={i}>{s.symptom} ({s.severity})</li>
                      ))}
                    </ul>
                  </div>
                )}

                {summary.preferences && (
                  <div>
                    <strong>Preferences:</strong>
                    <p className="mt-1">Insurance: {summary.preferences.insurance || "Not specified"}</p>
                    <p className="mt-1">Location: {summary.preferences.location || "Not specified"}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}
