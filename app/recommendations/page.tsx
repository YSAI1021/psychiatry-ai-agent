"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/navbar";
import { useAppStore } from "@/lib/store";
import { matchPsychiatrists } from "@/lib/matching";
import { Star, Calendar } from "lucide-react";

/**
 * Psychiatrist recommendations page
 * Displays matched psychiatrists with profile cards
 */
export default function RecommendationsPage() {
  const router = useRouter();
  const { summary, recommendations, setRecommendations } = useAppStore();

  useEffect(() => {
    if (!summary) {
      router.push("/chat");
      return;
    }

    // Match psychiatrists if not already matched
    if (recommendations.length === 0) {
      const matched = matchPsychiatrists(summary, 5);
      setRecommendations(matched);
    }
  }, [summary, recommendations, setRecommendations, router]);

  if (!summary) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-12 text-center">
          <p>Loading recommendations...</p>
        </main>
      </div>
    );
  }

  const handleBook = (psychiatristId: string) => {
    router.push(`/book?psychiatrist=${psychiatristId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">Recommended Psychiatrists</h1>
            <p className="text-muted-foreground mt-2">
              Based on your intake assessment, here are psychiatrists who may be a good fit for you.
            </p>
          </div>

          {/* Recommendations Grid */}
          {recommendations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No recommendations available at this time. Please check back later.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((psych) => (
                <Card key={psych.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{psych.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {psych.experience} years of experience
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{psych.rating}</span>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1 space-y-4">
                    {/* Specialties */}
                    <div>
                      <p className="text-sm font-medium mb-2">Specialties:</p>
                      <div className="flex flex-wrap gap-2">
                        {psych.specialty.map((spec) => (
                          <Badge key={spec} variant="secondary">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Bio */}
                    <p className="text-sm text-muted-foreground">{psych.bio}</p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {psych.tags.slice(0, 5).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    {/* Availability */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{psych.availability.join(", ")}</span>
                    </div>

                    {/* Book Button */}
                    <Button
                      onClick={() => handleBook(psych.id)}
                      className="w-full"
                      variant="default"
                    >
                      Book Appointment
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Back Button */}
          <div className="flex justify-start pt-4">
            <Button variant="outline" onClick={() => router.push("/summary")}>
              Back to Summary
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

