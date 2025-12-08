'use client';

import { useState } from 'react';
import { PatientInfo } from '@/types';

interface SummaryFormProps {
  clinicalSummary: string;
  onSubmit: (patientInfo: PatientInfo) => void;
}

export default function SummaryForm({ clinicalSummary, onSubmit }: SummaryFormProps) {
  const [formData, setFormData] = useState<PatientInfo>({
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
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  return (
    <div className="summary-form-container">
      <div className="summary-form-header">
        <h2>Clinical Summary</h2>
        <p className="summary-text">{clinicalSummary}</p>
      </div>

      <div className="form-section">
        <h3>Patient Information</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Date of Birth</label>
            <input
              type="date"
              value={formData.dob}
              onChange={(e) => handleChange('dob', e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Gender</label>
            <input
              type="text"
              value={formData.gender}
              onChange={(e) => handleChange('gender', e.target.value)}
              className="form-input"
              placeholder="e.g., Male, Female, Non-binary"
            />
          </div>

          <div className="form-group">
            <label>Pronouns</label>
            <input
              type="text"
              value={formData.pronouns}
              onChange={(e) => handleChange('pronouns', e.target.value)}
              className="form-input"
              placeholder="e.g., he/him, she/her, they/them"
            />
          </div>

          <div className="form-group">
            <label>Race/Ethnicity</label>
            <input
              type="text"
              value={formData.raceEthnicity}
              onChange={(e) => handleChange('raceEthnicity', e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group full-width">
            <label>Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group full-width">
            <label>Emergency Contact</label>
            <input
              type="text"
              value={formData.emergencyContact}
              onChange={(e) => handleChange('emergencyContact', e.target.value)}
              className="form-input"
              placeholder="Name and phone number"
            />
          </div>
        </div>
      </div>

      <button onClick={handleSubmit} className="submit-btn">
        Submit
      </button>

      <style jsx>{`
        .summary-form-container {
          max-width: 900px;
          margin: 2rem auto;
          padding: 2rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .summary-form-header {
          margin-bottom: 2rem;
        }

        .summary-form-header h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 1rem;
        }

        .summary-text {
          background: #f9fafb;
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          color: #374151;
          line-height: 1.6;
          white-space: pre-wrap;
        }

        .form-section {
          margin-bottom: 2rem;
        }

        .form-section h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 1.5rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-group label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .form-input {
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 1rem;
          color: #1f2937;
          transition: border-color 0.2s;
        }

        .form-input:focus {
          outline: none;
          border-color: #19c37d;
          box-shadow: 0 0 0 3px rgba(25, 195, 125, 0.1);
        }

        .submit-btn {
          width: 100%;
          padding: 0.875rem 1.5rem;
          background-color: #19c37d;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .submit-btn:hover {
          background-color: #16a269;
        }

        @media (max-width: 768px) {
          .summary-form-container {
            padding: 1.5rem;
            margin: 1rem;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
