'use client';

import { Psychiatrist } from '@/types';

interface PsychiatristProfileProps {
  psychiatrist: Psychiatrist;
  onClose: () => void;
}

export default function PsychiatristProfile({ psychiatrist, onClose }: PsychiatristProfileProps) {
  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="profile-header">
          <h2>{psychiatrist.name}, {psychiatrist.credential}</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="profile-content">
          <div className="profile-section">
            <h3>Subspecialty</h3>
            <p>{psychiatrist.subspecialty}</p>
          </div>

          {psychiatrist.bio && (
            <div className="profile-section">
              <h3>Professional Bio</h3>
              <p>{psychiatrist.bio}</p>
            </div>
          )}

          <div className="profile-details-grid">
            {psychiatrist.yearsOfExperience && (
              <div className="profile-detail">
                <span className="detail-label">Years of Experience</span>
                <span className="detail-value">{psychiatrist.yearsOfExperience} years</span>
              </div>
            )}

            {psychiatrist.languages && psychiatrist.languages.length > 0 && (
              <div className="profile-detail">
                <span className="detail-label">Languages Spoken</span>
                <span className="detail-value">{psychiatrist.languages.join(', ')}</span>
              </div>
            )}

            <div className="profile-detail">
              <span className="detail-label">Network Status</span>
              <span className={`detail-value ${psychiatrist.inNetwork ? 'in-network' : 'out-network'}`}>
                {psychiatrist.inNetwork ? 'In-network' : 'Out-of-network'}
              </span>
            </div>

            <div className="profile-detail">
              <span className="detail-label">Accepting New Patients</span>
              <span className={`detail-value ${psychiatrist.acceptingNewPatients ? 'yes' : 'no'}`}>
                {psychiatrist.acceptingNewPatients ? 'Yes' : 'No'}
              </span>
            </div>

            <div className="profile-detail">
              <span className="detail-label">Availability</span>
              <span className="detail-value">{psychiatrist.availability}</span>
            </div>

            {psychiatrist.location && (
              <div className="profile-detail">
                <span className="detail-label">Location</span>
                <span className="detail-value">{psychiatrist.location}</span>
              </div>
            )}
          </div>

          {psychiatrist.additionalCredentials && psychiatrist.additionalCredentials.length > 0 && (
            <div className="profile-section">
              <h3>Additional Credentials</h3>
              <ul className="credentials-list">
                {psychiatrist.additionalCredentials.map((cred, idx) => (
                  <li key={idx}>{cred}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .profile-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .profile-modal {
          background: white;
          border-radius: 12px;
          max-width: 700px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          width: 100%;
        }

        .profile-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          position: sticky;
          top: 0;
          background: white;
          z-index: 10;
        }

        .profile-header h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 2rem;
          color: #6b7280;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: background-color 0.2s;
        }

        .close-btn:hover {
          background-color: #f3f4f6;
        }

        .profile-content {
          padding: 1.5rem;
        }

        .profile-section {
          margin-bottom: 2rem;
        }

        .profile-section h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.75rem;
        }

        .profile-section p {
          color: #374151;
          line-height: 1.6;
          margin: 0;
        }

        .profile-details-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .profile-detail {
          display: flex;
          flex-direction: column;
          padding: 0.75rem;
          background: #f9fafb;
          border-radius: 6px;
        }

        .detail-label {
          font-size: 0.875rem;
          color: #6b7280;
          font-weight: 500;
          margin-bottom: 0.25rem;
        }

        .detail-value {
          font-size: 0.95rem;
          color: #1f2937;
          font-weight: 600;
        }

        .detail-value.in-network {
          color: #16a269;
        }

        .detail-value.out-network {
          color: #dc2626;
        }

        .detail-value.yes {
          color: #16a269;
        }

        .detail-value.no {
          color: #dc2626;
        }

        .credentials-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .credentials-list li {
          padding: 0.5rem 0;
          color: #374151;
          border-bottom: 1px solid #e5e7eb;
        }

        .credentials-list li:last-child {
          border-bottom: none;
        }

        @media (max-width: 768px) {
          .profile-modal {
            max-width: 100%;
            max-height: 95vh;
          }

          .profile-details-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

