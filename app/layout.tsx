import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PsyConnect Agent - Psychiatric Intake Assessment',
  description: 'AI-powered psychiatric intake assessment system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}