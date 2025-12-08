"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/navbar";
import { useAppStore, ClinicalSummary } from "@/lib/store";
import { Download, Copy, ArrowRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";

/**
 * Clinical summary page
 * Displays and allows editing of auto-generated summary
 */
export default function SummaryPage() {
  const router = useRouter();
  const { summary, updateSummary, setRecommendations } = useAppStore();
  const [localSummary, setLocalSummary] = useState<ClinicalSummary | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!summary) {
      router.push("/chat");
      return;
    }
    setLocalSummary(summary);
  }, [summary, router]);

  if (!localSummary) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-12 text-center">
          <p>Loading summary...</p>
        </main>
      </div>
    );
  }

  /**
   * Update a specific field in the summary
   */
  const updateField = (path: string, value: any) => {
    const updated = { ...localSummary };
    const keys = path.split('.');
    let current: any = updated;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    
    setLocalSummary(updated);
    updateSummary(updated);
  };

  /**
   * Export summary as JSON file
   */
  const handleExport = () => {
    const dataStr = JSON.stringify(localSummary, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `clinical-summary-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Copy summary to clipboard (formatted for EMR pasting)
   */
  const handleCopyToClipboard = async () => {
    const formatted = `
CHIEF COMPLAINT:
${localSummary.chiefComplaint}

SYMPTOMS:
${localSummary.symptoms.join(', ')}

DURATION: ${localSummary.symptomDuration}
SEVERITY: ${localSummary.severity.toUpperCase()}
TRIAGE LEVEL: ${localSummary.triageLevel.toUpperCase()}

PRIOR DIAGNOSES:
${localSummary.priorDiagnoses.join(', ') || 'None reported'}

CURRENT MEDICATIONS:
${localSummary.currentMedications.join(', ') || 'None reported'}

SAFETY CONCERNS:
${Object.entries(localSummary.safetyConcerns)
  .filter(([_, value]) => value === true || (typeof value === 'string' && value))
  .map(([key, value]) => `${key}: ${value}`)
  .join('\n') || 'None reported'}

FUNCTIONAL IMPACT:
Work: ${localSummary.functionalImpact.work || 'Not reported'}
Relationships: ${localSummary.functionalImpact.relationships || 'Not reported'}
Daily Activities: ${localSummary.functionalImpact.dailyActivities || 'Not reported'}
    `.trim();

    await navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /**
   * Navigate to recommendations
   */
  const handleContinue = () => {
    // Match psychiatrists based on summary
    const { matchPsychiatrists } = require("@/lib/matching");
    const recommendations = matchPsychiatrists(localSummary, 5);
    setRecommendations(recommendations);
    router.push("/recommendations");
  };

  const triageColor =
    localSummary.triageLevel === "emergency"
      ? "destructive"
      : localSummary.triageLevel === "urgent"
      ? "default"
      : "secondary";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Clinical Summary</h1>
              <p className="text-muted-foreground mt-2">
                Review and edit your intake summary below
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCopyToClipboard}>
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
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export JSON
              </Button>
            </div>
          </div>

          {/* Triage Level Alert */}
          {localSummary.triageLevel !== "normal" && (
            <Alert variant={localSummary.triageLevel === "emergency" ? "destructive" : "default"}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Triage Level: {localSummary.triageLevel.toUpperCase()}</strong>
                {localSummary.safetyConcerns.notes && (
                  <span className="block mt-1">{localSummary.safetyConcerns.notes}</span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Chief Complaint */}
          <Card>
            <CardHeader>
              <CardTitle>Chief Complaint</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={localSummary.chiefComplaint}
                onChange={(e) => updateField("chiefComplaint", e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Symptoms */}
          <Card>
            <CardHeader>
              <CardTitle>Symptoms</CardTitle>
              <CardDescription>Separate symptoms with commas</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                value={localSummary.symptoms.join(", ")}
                onChange={(e) =>
                  updateField(
                    "symptoms",
                    e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                  )
                }
              />
            </CardContent>
          </Card>

          {/* Duration & Severity */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Symptom Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  value={localSummary.symptomDuration}
                  onChange={(e) => updateField("symptomDuration", e.target.value)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Severity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  {(["mild", "moderate", "severe"] as const).map((level) => (
                    <Button
                      key={level}
                      variant={localSummary.severity === level ? "default" : "outline"}
                      onClick={() => updateField("severity", level)}
                      size="sm"
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Prior Diagnoses */}
          <Card>
            <CardHeader>
              <CardTitle>Prior Diagnoses</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={localSummary.priorDiagnoses.join(", ")}
                onChange={(e) =>
                  updateField(
                    "priorDiagnoses",
                    e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                  )
                }
              />
            </CardContent>
          </Card>

          {/* Medications */}
          <Card>
            <CardHeader>
              <CardTitle>Current Medications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                value={localSummary.currentMedications.join(", ")}
                onChange={(e) =>
                  updateField(
                    "currentMedications",
                    e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                  )
                }
                placeholder="Separate with commas"
              />
              <Textarea
                value={localSummary.medicationHistory}
                onChange={(e) => updateField("medicationHistory", e.target.value)}
                placeholder="Medication history notes"
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Safety Concerns */}
          <Card>
            <CardHeader>
              <CardTitle>Safety Concerns</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.keys(localSummary.safetyConcerns)
                  .filter((key) => key !== "notes")
                  .map((key) => (
                    <div key={key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={
                          localSummary.safetyConcerns[
                            key as keyof typeof localSummary.safetyConcerns
                          ] === true
                        }
                        onChange={(e) =>
                          updateField(`safetyConcerns.${key}`, e.target.checked)
                        }
                        className="rounded"
                      />
                      <label className="text-sm capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </label>
                    </div>
                  ))}
              </div>
              <Textarea
                value={localSummary.safetyConcerns.notes}
                onChange={(e) => updateField("safetyConcerns.notes", e.target.value)}
                placeholder="Additional safety notes"
                rows={2}
              />
            </CardContent>
          </Card>

          {/* Functional Impact */}
          <Card>
            <CardHeader>
              <CardTitle>Functional Impact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(localSummary.functionalImpact).map(([key, value]) => (
                <div key={key}>
                  <label className="text-sm font-medium capitalize mb-2 block">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </label>
                  <Textarea
                    value={value}
                    onChange={(e) => updateField(`functionalImpact.${key}`, e.target.value)}
                    rows={2}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Therapist Gender</label>
                <Input
                  value={localSummary.preferences.therapistGender || ""}
                  onChange={(e) =>
                    updateField("preferences.therapistGender", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Treatment Approach</label>
                <Input
                  value={localSummary.preferences.treatmentApproach?.join(", ") || ""}
                  onChange={(e) =>
                    updateField(
                      "preferences.treatmentApproach",
                      e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                    )
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Availability</label>
                <Input
                  value={localSummary.preferences.availability || ""}
                  onChange={(e) => updateField("preferences.availability", e.target.value)}
                />
              </div>
              <Textarea
                value={localSummary.preferences.otherNotes}
                onChange={(e) => updateField("preferences.otherNotes", e.target.value)}
                placeholder="Other preferences or notes"
                rows={2}
              />
            </CardContent>
          </Card>

          {/* Continue Button */}
          <div className="flex justify-end pt-4">
            <Button onClick={handleContinue} size="lg">
              Continue to Recommendations
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

