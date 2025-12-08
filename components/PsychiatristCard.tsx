'use client';

import { Psychiatrist } from '@/types';

interface PsychiatristCardProps {
  psychiatrist: Psychiatrist;
  onSelect: (psychiatrist: Psychiatrist) => void;
  onViewBio: (psychiatrist: Psychiatrist) => void;
}

export default function PsychiatristCard({ psychiatrist, onSelect, onViewBio }: PsychiatristCardProps) {
  return (
    <div className="psychiatrist-card">
      <div className="card-header">
        <h3>{psychiatrist.name}, {psychiatrist.credential}</h3>
        <span className="subspecialty">{psychiatrist.subspecialty}</span>
      </div>
      
      <div className="card-details">
        <div className="detail-item">
          <span className="label">Network:</span>
          <span className={`value ${psychiatrist.inNetwork ? 'in-network' : 'out-network'}`}>
            {psychiatrist.inNetwork ? 'In-network' : 'Out-of-network'}
          </span>
        </div>
        
        <div className="detail-item">
          <span className="label">Accepting New Patients:</span>
          <span className={`value ${psychiatrist.acceptingNewPatients ? 'yes' : 'no'}`}>
            {psychiatrist.acceptingNewPatients ? 'Yes' : 'No'}
          </span>
        </div>
        
        <div className="detail-item">
          <span className="label">Availability:</span>
          <span className="value">{psychiatrist.availability}</span>
        </div>
      </div>

      <div className="card-actions">
        <button onClick={() => onViewBio(psychiatrist)} className="btn-secondary">
          View Bio
        </button>
        <button onClick={() => onSelect(psychiatrist)} className="btn-primary">
          Select
        </button>
      </div>

      <style jsx>{`
        .psychiatrist-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: box-shadow 0.2s;
        }

        .psychiatrist-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .card-header {
          margin-bottom: 1rem;
        }

        .card-header h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.25rem;
        }

        .subspecialty {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .card-details {
          margin-bottom: 1.5rem;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid #f3f4f6;
        }

        .detail-item:last-child {
          border-bottom: none;
        }

        .label {
          font-size: 0.875rem;
          color: #6b7280;
          font-weight: 500;
        }

        .value {
          font-size: 0.875rem;
          color: #1f2937;
          font-weight: 600;
        }

        .value.in-network {
          color: #16a269;
        }

        .value.out-network {
          color: #dc2626;
        }

        .value.yes {
          color: #16a269;
        }

        .value.no {
          color: #dc2626;
        }

        .card-actions {
          display: flex;
          gap: 0.75rem;
        }

        .btn-primary,
        .btn-secondary {
          flex: 1;
          padding: 0.75rem 1rem;
          border: none;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background-color: #19c37d;
          color: white;
        }

        .btn-primary:hover {
          background-color: #16a269;
        }

        .btn-secondary {
          background-color: #f3f4f6;
          color: #374151;
        }

        .btn-secondary:hover {
          background-color: #e5e7eb;
        }
      `}</style>
    </div>
  );
}
