"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/navbar";
import { useAppStore, ChatMessage } from "@/lib/store";
import { Send, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

/**
 * Chat intake page
 * Conversational interface with typing animation and scrollback
 */
export default function ChatPage() {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  
  const {
    messages,
    isChatActive,
    isProcessing,
    addMessage,
    setMessages,
    setIsChatActive,
    setIsProcessing,
    setSummary,
  } = useAppStore();

  // Initialize chat with welcome message
  useEffect(() => {
    if (!isChatActive && messages.length === 0) {
      addMessage({
        role: "assistant",
        content: "Hello, I'm here to help guide you through your psychiatric intake assessment. I'll ask you some questions about your current concerns, symptoms, and background. This will help us understand your needs and connect you with the right support. How can I help you today?",
      });
      setIsChatActive(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /**
   * Send user message and get AI response
   */
  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessageContent = input.trim();
    addMessage({
      role: "user",
      content: userMessageContent,
    });
    const updatedMessages = [...messages, { role: "user" as const, content: userMessageContent }];
    setInput("");
    setIsProcessing(true);

    try {
      // Send to API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      
      addMessage({
        role: "assistant",
        content: data.message,
      });
    } catch (error) {
      console.error("Chat error:", error);
      addMessage({
        role: "assistant",
        content: "I apologize, I encountered an error. Please try again or check your connection.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Generate summary and navigate to summary page
   */
  const handleFinish = async () => {
    if (messages.length < 2) {
      alert("Please have at least a brief conversation before finishing.");
      return;
    }

    setIsProcessing(true);

    try {
      // Generate summary
      const response = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate summary");
      }

      const data = await response.json();
      setSummary(data.summary);

      // Navigate to summary page
      router.push("/summary");
    } catch (error) {
      console.error("Summary generation error:", error);
      alert("Failed to generate summary. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-6 flex flex-col max-w-4xl">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
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
                <p className="whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs opacity-70 mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </Card>
            </div>
          ))}
          
          {isProcessing && (
            <div className="flex justify-start">
              <Card className="bg-card p-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </Card>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-border pt-4 space-y-2">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Remember: This AI does not provide diagnoses. Your conversation helps generate
              an intake summary for clinician review.
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-2">
            <Input
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
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={isProcessing || !input.trim()}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleFinish}
              disabled={isProcessing || messages.length < 2}
              variant="outline"
            >
              Finish Intake
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

