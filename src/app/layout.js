import './globals.css';
import { headers } from 'next/headers';
import Script from 'next/script';

export const metadata = {
  title: 'Fincapy',
  description:
    'Instant insights, zero hassle, capybara approved. A budgeting app that just works.',
  metadataBase: new URL('https://fincapy.com'),
  alternates: {
    canonical: 'https://fincapy.com',
  },
  openGraph: {
    title: 'Fincapy',
    description:
      'Instant insights, zero hassle, capybara approved. A budgeting app that just works.',
    images: [{ url: 'https://fincapy.com/capybara.png' }],
    url: 'https://fincapy.com',
  },
  applicationName: 'Fincapy',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Fincapy',
  },
  formatDetection: {
    telephone: false,
  },
  mobileWebAppCapable: true,
  icons: {
    icon: [
      { url: '/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png' },
      {
        url: '/icons/apple-touch-icon-152x152-precomposed.png',
        sizes: '152x152',
      },
      {
        url: '/icons/apple-touch-icon-180x180-precomposed.png',
        sizes: '180x180',
      },
      {
        url: '/icons/apple-touch-icon-167x167-precomposed.png',
        sizes: '167x167',
      },
    ],
    // maskIcon: { url: '/icons/safari-pinned-tab.svg', color: '#5bbad5' },
    shortcut: '/favicon.ico',
  },
  manifest: '/manifest.json',
  // twitter: {
  //   card: 'Capybara spending plans',
  //   url: 'https://fincapy.com',
  //   title: 'Fincapy',
  //   description: 'Best PWA App in the world',
  //   images: ['https://fincapy.com/icons/android-chrome-192x192.png'],
  // },
  // openGraph: {
  //   type: 'website',
  //   title: 'PWA App',
  //   description: 'Best PWA App in the world',
  //   siteName: 'PWA App',
  //   url: 'https://yourdomain.com',
  //   images: ['https://yourdomain.com/icons/apple-touch-icon.png'],
  // },
};

export const viewport = {
  themeColor: '#f9fafb',
  minimumScale: 1,
  initialScale: 1,
  width: 'device-width',
  shrinkToFit: false,
  userScalable: true,
  viewportFit: 'cover',
};

export default async function RootLayout({ children }) {
  return (
    <html lang="en" className="overscroll-none bg-card">
      <body>{children}</body>
    </html>
  );
}
