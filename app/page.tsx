"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/navbar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

/**
 * Welcome/Home page
 * Brief intro and "Start Intake" button
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              AI Psychiatry Intake Assistant
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A compassionate conversational assistant to guide you through your psychiatric intake assessment.
              Get matched with the right psychiatrist based on your needs.
            </p>
          </div>

          {/* Important Notice */}
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> This AI assistant does not provide diagnoses or emergency services.
              If you are experiencing a mental health emergency, please contact your local emergency services
              or the National Suicide Prevention Lifeline at 988.
            </AlertDescription>
          </Alert>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <Card>
              <CardHeader>
                <CardTitle>Conversational Intake</CardTitle>
                <CardDescription>
                  Complete your intake assessment through a natural, guided conversation
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Clinical Summary</CardTitle>
                <CardDescription>
                  Receive a structured summary of your intake that you can review and edit
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Smart Matching</CardTitle>
                <CardDescription>
                  Get matched with psychiatrists who specialize in your specific needs
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* CTA */}
          <div className="flex justify-center pt-8">
            <Link href="/chat">
              <Button size="lg" className="text-lg px-8 py-6">
                Start Intake Assessment
              </Button>
            </Link>
          </div>

          {/* Privacy Note */}
          <div className="text-center text-sm text-muted-foreground pt-8">
            <p>
              Your privacy is important to us. Chat transcripts are not stored.
              Only structured summary data is saved for clinical review.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
