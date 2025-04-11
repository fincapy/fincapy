import './globals.css';
import { headers } from 'next/headers';
import Script from 'next/script';

export const metadata = {
  title: 'Who will your money make you?',
  description:
    'Understand yourself and your finances with Fincapy. Instant insights, zero hassle, capybara approved. A customizable and automated budgeting solution that just works.',
  openGraph: {
    title: 'Who will your money make you?',
    description:
      'Understand yourself and your finances with Fincapy. Instant insights, zero hassle, capybara approved. A customizable and automated budgeting solution that just works.',
    images: [{ url: 'https://fincapy.com/capybara.png' }],
  },
  applicationName: 'Fincapy',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Fincapy',
    startupImage: [
      // iPhone 14 Pro Max, 13 Pro Max (1290 x 2796)
      {
        url: '/splash/apple-splash-1290-2796.jpeg',
        media:
          'screen and (device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)',
      },
      // iPhone 14 Pro, 13 Pro (1179 x 2556)
      {
        url: '/splash/apple-splash-1179-2556.jpeg',
        media:
          'screen and (device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)',
      },
      // iPhone 14 Plus, 13 (1284 x 2778)
      {
        url: '/splash/apple-splash-1284-2778.jpeg',
        media:
          'screen and (device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)',
      },
      // iPhone 14, 13 Mini, 12 Mini (1170 x 2532)
      {
        url: '/splash/apple-splash-1170-2532.jpeg',
        media:
          'screen and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)',
      },
      // iPhone 12 Pro Max (1284 x 2778)
      {
        url: '/splash/apple-splash-1284-2778.jpeg',
        media:
          'screen and (device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)',
      },
      // iPhone 12, 12 Pro (1170 x 2532)
      {
        url: '/splash/apple-splash-1170-2532.jpeg',
        media:
          'screen and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)',
      },
      // iPhone 11 Pro Max, XS Max (1242 x 2688)
      {
        url: '/splash/apple-splash-1242-2688.jpeg',
        media:
          'screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)',
      },
      // iPhone 11, XR (828 x 1792)
      {
        url: '/splash/apple-splash-828-1792.jpeg',
        media:
          'screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)',
      },
      // iPhone 11 Pro, XS, X (1125 x 2436)
      {
        url: '/splash/apple-splash-1125-2436.jpeg',
        media:
          'screen and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)',
      },
      // iPhone 8 Plus, 7 Plus, 6s Plus (1242 x 2208)
      {
        url: '/splash/apple-splash-1242-2208.jpeg',
        media:
          'screen and (device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)',
      },
      // iPhone 8, 7, 6s (750 x 1334)
      {
        url: '/splash/apple-splash-750-1334.jpeg',
        media:
          'screen and (device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)',
      },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  mobileWebAppCapable: true,
  icons: {
    icon: [
      { url: '/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png' },
      { url: '/icons/apple-touch-icon-152x152.png', sizes: '152x152' },
      { url: '/icons/apple-touch-icon-180x180.png', sizes: '180x180' },
      { url: '/icons/apple-touch-icon-167x167.png', sizes: '167x167' },
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
  userScalable: false,
  viewportFit: 'cover',
};

export default async function RootLayout({ children }) {
  const headersList = await headers();
  const nonce = headersList.get('x-nonce');

  return (
    <html lang="en" className="overscroll-none bg-card">
      <head>
        <Script
          src="/mixpanel-init.js"
          nonce={nonce}
          strategy="beforeInteractive"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
