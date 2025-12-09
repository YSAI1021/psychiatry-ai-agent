import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AssessmentProvider } from '@/contexts/AssessmentContext';
import { AppHeader } from '@/components/AppHeader';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Psychiatric Intake Assessment',
  description: 'AI-powered psychiatric intake assessment tool',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <AssessmentProvider>
          <AppHeader />
          {children}
        </AssessmentProvider>
      </body>
    </html>
  );
}
