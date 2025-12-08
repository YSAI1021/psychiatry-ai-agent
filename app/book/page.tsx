"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Navbar } from "@/components/navbar";
import { useAppStore } from "@/lib/store";
import { MOCK_PSYCHIATRISTS } from "@/lib/matching";
import { Calendar, CheckCircle2, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Booking page content component
 * Appointment booking form with Supabase integration
 */
function BookPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const psychiatristId = searchParams.get("psychiatrist");
  const { summary } = useAppStore();

  const [psychiatrist, setPsychiatrist] = useState(
    MOCK_PSYCHIATRISTS.find((p) => p.id === psychiatristId) || null
  );

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    preferredTime: "",
    notes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!psychiatristId || !psychiatrist) {
      router.push("/recommendations");
    }
  }, [psychiatristId, psychiatrist, router]);

  if (!psychiatrist) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-12 text-center">
          <p>Loading...</p>
        </main>
      </div>
    );
  }

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          psychiatristId: psychiatrist.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          preferredTime: formData.preferredTime,
          notes: formData.notes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to book appointment");
      }

      const data = await response.json();
      setIsSuccess(true);
      
      // Redirect after 3 seconds
      setTimeout(() => {
        router.push("/");
      }, 3000);
    } catch (error) {
      console.error("Booking error:", error);
      alert(error instanceof Error ? error.message : "Failed to book appointment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-12 max-w-2xl">
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold">Appointment Request Submitted!</h2>
              <p className="text-muted-foreground">
                Your appointment request with {psychiatrist.name} has been submitted.
                You will receive a confirmation email shortly.
              </p>
              <Button onClick={() => router.push("/")} className="mt-4">
                Return to Home
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <Button
              variant="ghost"
              onClick={() => router.push("/recommendations")}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Recommendations
            </Button>
            <h1 className="text-3xl font-bold">Book Appointment</h1>
            <p className="text-muted-foreground mt-2">
              Request an appointment with {psychiatrist.name}
            </p>
          </div>

          {/* Psychiatrist Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>{psychiatrist.name}</CardTitle>
              <CardDescription>
                {psychiatrist.specialty.join(", ")} • {psychiatrist.experience} years experience
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Booking Form */}
          <Card>
            <CardHeader>
              <CardTitle>Appointment Details</CardTitle>
              <CardDescription>
                Fill out the form below to request an appointment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Full Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Email *</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Phone</label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Preferred Date & Time *
                  </label>
                  <Input
                    value={formData.preferredTime}
                    onChange={(e) =>
                      setFormData({ ...formData, preferredTime: e.target.value })
                    }
                    required
                    placeholder="e.g., Monday-Friday mornings, or specific date"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Available: {psychiatrist.availability.join(", ")}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Additional Notes</label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Any additional information or requests"
                    rows={4}
                  />
                </div>

                <Alert>
                  <AlertDescription className="text-xs">
                    This is a booking request. The psychiatrist's office will contact you to confirm
                    the appointment date and time.
                  </AlertDescription>
                </Alert>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Calendar className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4 mr-2" />
                      Request Appointment
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

/**
 * Booking page wrapper with Suspense
 */
export default function BookPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-12 text-center">
          <p>Loading...</p>
        </main>
      </div>
    }>
      <BookPageContent />
    </Suspense>
  );
}

