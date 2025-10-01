import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Modern Chat App',
  description: 'Real-time chat with Next.js 15',
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