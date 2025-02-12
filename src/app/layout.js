import Head from 'next/head';
import './globals.css';

export const metadata = {
  title: 'Budget App',
  description: 'Personal budgeting application',
  manifest: '/manifest.json',
  themeColor: '#000000',
  viewport: 'minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, viewport-fit=cover'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="overscroll-none" suppressHydrationWarning>
      <body className="touch-none overscroll-none">{children}</body>
    </html>
  );
}
