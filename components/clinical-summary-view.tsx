'use client';

import * as React from 'react';
import { useAppStore } from '@/lib/store';
import { AgentType } from '@/lib/openai';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Copy, Check } from 'lucide-react';
import { useState, useEffect } from 'react';

export function ClinicalSummaryView() {
  const clinicalSummary = useAppStore((state) => state.clinicalSummary);
  const setClinicalSummary = useAppStore((state) => state.setClinicalSummary);
  const setCurrentAgent = useAppStore((state) => state.setCurrentAgent);
  const [copied, setCopied] = useState(false);
  const [editedSummary, setEditedSummary] = useState(clinicalSummary?.text || '');
  const [showPreview, setShowPreview] = useState(true);

  // Update edited summary when clinical summary changes
  useEffect(() => {
    if (clinicalSummary?.text) {
      setEditedSummary(clinicalSummary.text);
    }
  }, [clinicalSummary?.text]);

  // Hide preview if summary is confirmed
  useEffect(() => {
    if (clinicalSummary?.confirmed) {
      setShowPreview(false);
    }
  }, [clinicalSummary?.confirmed]);

  if (!clinicalSummary || clinicalSummary.confirmed) return null;

  const handleConfirm = () => {
    if (setClinicalSummary) {
      // Update summary with edited text and mark as confirmed
      setClinicalSummary({
        ...clinicalSummary,
        text: editedSummary,
        confirmed: true,
      });
      // Hide preview after confirmation
      setShowPreview(false);
    }
  };

  // Generate live preview text with updated values
  const generatePreviewText = () => {
    let preview = editedSummary;
    
    // Replace age in preview if changed
    if (clinicalSummary.patientAge) {
      preview = preview.replace(/A \d+-year-old/g, `A ${clinicalSummary.patientAge}-year-old`);
      if (!preview.includes(`${clinicalSummary.patientAge}-year-old`)) {
        preview = preview.replace(/^A /, `A ${clinicalSummary.patientAge}-year-old `);
      }
    }
    
    // Replace gender in preview if changed
    if (clinicalSummary.patientGender) {
      const genderMap: Record<string, string> = {
        'male': 'male',
        'female': 'female',
        'non-binary': 'non-binary',
        'prefer-not-to-say': 'individual',
      };
      const genderText = genderMap[clinicalSummary.patientGender] || clinicalSummary.patientGender;
      preview = preview.replace(/\b(male|female|non-binary|individual)\b/gi, genderText);
    }
    
    return preview;
  };

  const handleDownload = () => {
    const blob = new Blob([editedSummary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clinical-summary-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editedSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenderChange = (value: string) => {
    if (setClinicalSummary) {
      setClinicalSummary({
        ...clinicalSummary,
        patientGender: value,
      });
    }
  };

  const handleAgeChange = (value: string) => {
    const age = parseInt(value);
    if (!isNaN(age) && setClinicalSummary) {
      setClinicalSummary({
        ...clinicalSummary,
        patientAge: age,
      });
    }
  };

  const previewText = generatePreviewText();

  return (
    <div className="mb-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Clinical Summary Review</CardTitle>
          <CardDescription>
            Please review your clinical summary. You can edit fields below, and see a live preview on the right.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Editable fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={clinicalSummary.patientAge || ''}
                onChange={(e) => handleAgeChange(e.target.value)}
                placeholder="Age"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={clinicalSummary.patientGender || ''}
                onValueChange={handleGenderChange}
              >
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="non-binary">Non-binary</SelectItem>
                  <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Summary text - editable */}
          <div className="space-y-2">
            <Label htmlFor="summary">Clinical Summary (Editable)</Label>
            <Textarea
              id="summary"
              value={editedSummary}
              onChange={(e) => {
                setEditedSummary(e.target.value);
                // Update store with edited text
                setClinicalSummary({
                  ...clinicalSummary,
                  text: e.target.value,
                });
              }}
              className="min-h-[200px] font-mono text-sm"
              placeholder="Clinical summary will appear here..."
            />
          </div>

          {/* PHQ-9 Score */}
          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm font-medium">
              PHQ-9 Score: <span className="font-bold">{clinicalSummary.phq9Score}</span> / 27
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {clinicalSummary.phq9Score <= 4 && 'Minimal depression'}
              {clinicalSummary.phq9Score >= 5 && clinicalSummary.phq9Score <= 9 && 'Mild depression'}
              {clinicalSummary.phq9Score >= 10 && clinicalSummary.phq9Score <= 14 && 'Moderate depression'}
              {clinicalSummary.phq9Score >= 15 && clinicalSummary.phq9Score <= 19 && 'Moderately severe depression'}
              {clinicalSummary.phq9Score >= 20 && 'Severe depression'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleDownload} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button onClick={handleCopy} variant="outline" size="sm">
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy to Clipboard
                </>
              )}
            </Button>
            <Button onClick={handleConfirm} className="ml-auto">
              Confirm and Continue
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Live Preview Panel - shown when not confirmed */}
      {showPreview && (
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Live Preview</CardTitle>
                <CardDescription>
                  This preview updates automatically as you make changes
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(false)}
              >
                Hide
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {previewText}
              </pre>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              PHQ-9 Score: {clinicalSummary.phq9Score} / 27
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

