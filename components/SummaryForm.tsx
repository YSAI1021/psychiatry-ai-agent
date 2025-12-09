'use client';

import { useState } from 'react';
import { ClinicalSummary } from '@/agents/summary-agent';

interface PatientInfo {
  name: string;
  dob: string;
  gender: string;
  pronouns: string;
  raceEthnicity: string;
  address: string;
  phone: string;
  email: string;
  emergencyContact: string;
}

interface SummaryFormProps {
  summary: ClinicalSummary;
  onSubmit: (patientInfo: PatientInfo, summary: ClinicalSummary) => void;
}

export default function SummaryForm({ summary, onSubmit }: SummaryFormProps) {
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    name: '',
    dob: '',
    gender: '',
    pronouns: '',
    raceEthnicity: '',
    address: '',
    phone: '',
    email: '',
    emergencyContact: '',
  });

  const handleChange = (field: keyof PatientInfo, value: string) => {
    setPatientInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    onSubmit(patientInfo, summary);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Clinical Summary</h2>

      {/* Structured Summary Section */}
      <div className="mb-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Reason for visit:</h3>
          <p className="text-sm text-gray-600">{summary.reasonForVisit || 'Not provided'}</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Psychiatric history:</h3>
          <p className="text-sm text-gray-600">{summary.psychiatricHistory || 'Not provided'}</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Symptoms:</h3>
          <p className="text-sm text-gray-600">{summary.symptoms || 'Not provided'}</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Substance use:</h3>
          <p className="text-sm text-gray-600">{summary.substanceUse || 'Not provided'}</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Functioning:</h3>
          <p className="text-sm text-gray-600">{summary.functioning || 'Not provided'}</p>
        </div>
        {summary.phq9Score !== undefined && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">PHQ-9 Score:</h3>
            <p className="text-sm text-gray-600">{summary.phq9Score}/27</p>
          </div>
        )}
      </div>

      {/* Patient Information Fields */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={patientInfo.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
            <input
              type="date"
              value={patientInfo.dob}
              onChange={(e) => handleChange('dob', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <input
              type="text"
              value={patientInfo.gender}
              onChange={(e) => handleChange('gender', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pronouns</label>
            <input
              type="text"
              value={patientInfo.pronouns}
              onChange={(e) => handleChange('pronouns', e.target.value)}
              placeholder="e.g., he/him, she/her, they/them"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Race/Ethnicity</label>
            <input
              type="text"
              value={patientInfo.raceEthnicity}
              onChange={(e) => handleChange('raceEthnicity', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={patientInfo.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              value={patientInfo.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={patientInfo.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
            <input
              type="text"
              value={patientInfo.emergencyContact}
              onChange={(e) => handleChange('emergencyContact', e.target.value)}
              placeholder="Name and phone number"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        className="mt-6 w-full bg-gray-700 text-white py-2 px-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
      >
        Submit
      </button>
    </div>
  );
}
