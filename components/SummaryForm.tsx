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

  const formatSummary = (text: string): string => {
    if (!text) return '';
    
    // Remove code block markers if present
    let formatted = text
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/`([^`]+)`/g, '$1') // Remove inline code
      .trim();
    
    // Remove markdown bold markers (**text** or __text__) and convert to proper headings
    formatted = formatted
      .replace(/\*\*(.+?)\*\*/g, '$1') // Remove **bold**
      .replace(/__(.+?)__/g, '$1') // Remove __bold__
      .replace(/\*(.+?)\*/g, '$1') // Remove *bold*
      .replace(/_(.+?)_/g, '$1'); // Remove _bold_
    
    // Convert markdown-style headers to HTML
    formatted = formatted
      .replace(/^### (.*$)/gim, '<h4>$1</h4>')
      .replace(/^## (.*$)/gim, '<h3>$1</h3>')
      .replace(/^# (.*$)/gim, '<h2>$1</h2>');
    
    // Convert bullet points
    const lines = formatted.split('\n');
    const formattedLines: string[] = [];
    let inList = false;
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) {
        if (inList) {
          formattedLines.push('</ul>');
          inList = false;
        }
        formattedLines.push('<br>');
        return;
      }
      
      // Check if it's a list item
      if (/^[\*\-\+] (.+)$/.test(trimmedLine) || /^\d+\. (.+)$/.test(trimmedLine)) {
        if (!inList) {
          formattedLines.push('<ul>');
          inList = true;
        }
        const content = trimmedLine.replace(/^[\*\-\d+\.\s]+/, '');
        formattedLines.push(`<li>${content}</li>`);
        } else {
          if (inList) {
            formattedLines.push('</ul>');
            inList = false;
          }
          // Check if it's already a header
          if (trimmedLine.startsWith('<h')) {
            formattedLines.push(trimmedLine);
          } else {
            // Check if line looks like a section header (ends with colon, is short, and doesn't contain sentence-ending punctuation)
            const isSectionHeader = trimmedLine.endsWith(':') && 
                                   trimmedLine.length < 50 && 
                                   !trimmedLine.includes('.') &&
                                   !trimmedLine.includes('!') &&
                                   !trimmedLine.includes('?');
            
            if (isSectionHeader) {
              formattedLines.push(`<h3 class="section-header">${trimmedLine}</h3>`);
            } else {
              formattedLines.push(`<p>${trimmedLine}</p>`);
            }
          }
        }
    });
    
    if (inList) {
      formattedLines.push('</ul>');
    }
    
    return formattedLines.join('');
  };

  return (
    <div className="summary-form-container">
      <div className="summary-form-header">
        <h2>Clinical Summary</h2>
        <div className="summary-text" dangerouslySetInnerHTML={{ __html: formatSummary(clinicalSummary) }} />
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
          padding: 1.5rem;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          color: #374151;
          line-height: 1.8;
          font-size: 0.95rem;
        }

        .summary-text h2 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
          margin: 1.5rem 0 1rem 0;
        }

        .summary-text h2:first-child {
          margin-top: 0;
        }

        .summary-text h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1f2937;
          margin: 1.25rem 0 0.75rem 0;
        }

        .summary-text h3.section-header {
          font-size: 1rem;
          font-weight: 600;
          color: #1f2937;
          margin: 1.5rem 0 0.5rem 0;
        }

        .summary-text h3.section-header:first-of-type {
          margin-top: 0;
        }

        .summary-text h4 {
          font-size: 1rem;
          font-weight: 600;
          color: #374151;
          margin: 1rem 0 0.5rem 0;
        }

        .summary-text p {
          margin: 0.75rem 0;
          color: #374151;
        }

        .summary-text p:first-child {
          margin-top: 0;
        }

        .summary-text p:last-child {
          margin-bottom: 0;
        }

        .summary-text ul {
          margin: 0.75rem 0;
          padding-left: 1.5rem;
          list-style-type: disc;
        }

        .summary-text li {
          margin: 0.5rem 0;
          color: #374151;
        }

        .summary-text br {
          line-height: 1.8;
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
          background-color: #4b5563;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .submit-btn:hover {
          background-color: #374151;
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
