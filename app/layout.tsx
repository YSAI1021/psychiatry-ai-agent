import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Psychiatry Intake Assistant',
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
