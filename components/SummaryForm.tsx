'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useAssessment } from '@/contexts/AssessmentContext';
import { ClinicalSummary } from '@/lib/agents/summary-agent';

/**
 * SummaryForm Component
 * 
 * Displays and allows editing of the clinical summary with patient information.
 * All fields are editable before final submission.
 */

interface SummaryFormProps {
  onSubmit: () => void;
}

export function SummaryForm({ onSubmit }: SummaryFormProps) {
  const { state, setClinicalSummary } = useAssessment();
  const [formData, setFormData] = useState<ClinicalSummary>(
    state.clinicalSummary || {
      name: '',
      dob: '',
      gender: '',
      pronouns: '',
      raceEthnicity: '',
      address: '',
      phone: '',
      email: '',
      emergencyContact: '',
      chiefComplaint: '',
      historyOfPresentIllness: '',
      pastPsychiatricHistory: '',
      familyHistory: '',
      medicalHistory: '',
      substanceUse: '',
      mentalStatus: '',
      functioning: '',
      phq9Score: state.phq9Score,
      phq9Severity: '',
      additionalNotes: '',
    }
  );

  useEffect(() => {
    if (state.clinicalSummary) {
      setFormData(state.clinicalSummary);
    }
  }, [state.clinicalSummary]);

  const handleChange = (field: keyof ClinicalSummary, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    setClinicalSummary(formData);
    onSubmit();
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Clinical Summary</h2>
        <p className="text-muted-foreground">
          Please review and edit the information below. All fields are editable.
        </p>
      </div>

      <div className="space-y-6">
        {/* Patient Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Patient Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                value={formData.dob}
                onChange={(e) => handleChange('dob', e.target.value)}
                placeholder="MM/DD/YYYY"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Input
                id="gender"
                value={formData.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pronouns">Pronouns</Label>
              <Input
                id="pronouns"
                value={formData.pronouns}
                onChange={(e) => handleChange('pronouns', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="raceEthnicity">Race/Ethnicity</Label>
              <Input
                id="raceEthnicity"
                value={formData.raceEthnicity}
                onChange={(e) => handleChange('raceEthnicity', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="emergencyContact">Emergency Contact</Label>
              <Input
                id="emergencyContact"
                value={formData.emergencyContact}
                onChange={(e) => handleChange('emergencyContact', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Clinical Sections */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Clinical Assessment</h3>
          
          <div className="space-y-2">
            <Label htmlFor="chiefComplaint">Chief Complaint</Label>
            <Textarea
              id="chiefComplaint"
              value={formData.chiefComplaint}
              onChange={(e) => handleChange('chiefComplaint', e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="historyOfPresentIllness">History of Present Illness</Label>
            <Textarea
              id="historyOfPresentIllness"
              value={formData.historyOfPresentIllness}
              onChange={(e) => handleChange('historyOfPresentIllness', e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pastPsychiatricHistory">Past Psychiatric History</Label>
            <Textarea
              id="pastPsychiatricHistory"
              value={formData.pastPsychiatricHistory}
              onChange={(e) => handleChange('pastPsychiatricHistory', e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="familyHistory">Family History</Label>
            <Textarea
              id="familyHistory"
              value={formData.familyHistory}
              onChange={(e) => handleChange('familyHistory', e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="medicalHistory">Medical History</Label>
            <Textarea
              id="medicalHistory"
              value={formData.medicalHistory}
              onChange={(e) => handleChange('medicalHistory', e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="substanceUse">Substance Use</Label>
            <Textarea
              id="substanceUse"
              value={formData.substanceUse}
              onChange={(e) => handleChange('substanceUse', e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mentalStatus">Mental Status</Label>
            <Textarea
              id="mentalStatus"
              value={formData.mentalStatus}
              onChange={(e) => handleChange('mentalStatus', e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="functioning">Social/Occupational Functioning</Label>
            <Textarea
              id="functioning"
              value={formData.functioning}
              onChange={(e) => handleChange('functioning', e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phq9Score">PHQ-9 Score</Label>
              <Input
                id="phq9Score"
                type="number"
                min="0"
                max="27"
                value={formData.phq9Score}
                onChange={(e) => handleChange('phq9Score', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phq9Severity">PHQ-9 Severity</Label>
              <Input
                id="phq9Severity"
                value={formData.phq9Severity}
                onChange={(e) => handleChange('phq9Severity', e.target.value)}
                readOnly
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalNotes">Additional Notes</Label>
            <Textarea
              id="additionalNotes"
              value={formData.additionalNotes}
              onChange={(e) => handleChange('additionalNotes', e.target.value)}
              rows={3}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-4 pt-4 border-t">
        <Button onClick={handleSubmit} size="lg" className="flex-1">
          Submit Assessment
        </Button>
      </div>
    </div>
  );
}
