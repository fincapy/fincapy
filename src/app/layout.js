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
  themeColor: '#059669',
  minimumScale: 1,
  initialScale: 1,
  width: 'device-width',
  shrinkToFit: false,
  userScalable: true,
  viewportFit: 'cover',
};

export default async function RootLayout({ children }) {
  return (
    <html lang="en" className="overscroll-none bg-gray-200">
      <head>
        {/* Apple PWA Splash Screens */}
        {/* iPhone 16 Pro Max, 15 Pro Max, 14 Pro Max - Portrait */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-touch-startup-image-1290x2796.png"
          media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        {/* iPhone 16 Pro Max, 15 Pro Max, 14 Pro Max - Landscape */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-touch-startup-image-2796x1290.png"
          media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"
        />

        {/* iPhone 14 Plus, 13 Pro Max, 12 Pro Max - Portrait */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-touch-startup-image-1284x2778.png"
          media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        {/* iPhone 14 Plus, 13 Pro Max, 12 Pro Max - Landscape */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-touch-startup-image-2778x1284.png"
          media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"
        />

        {/* iPhone 16 Pro, 15 Pro, 14 Pro - Portrait */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-touch-startup-image-1179x2556.png"
          media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        {/* iPhone 16 Pro, 15 Pro, 14 Pro - Landscape */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-touch-startup-image-2556x1179.png"
          media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"
        />

        {/* iPhone 16, 15, 14, 13, 12 - Portrait */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-touch-startup-image-1170x2532.png"
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        {/* iPhone 16, 15, 14, 13, 12 - Landscape */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-touch-startup-image-2532x1170.png"
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"
        />

        {/* iPhone 13 Mini, 12 Mini, 11 Pro, XS, X - Portrait */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-touch-startup-image-1125x2436.png"
          media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        {/* iPhone 13 Mini, 12 Mini, 11 Pro, XS, X - Landscape */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-touch-startup-image-2436x1125.png"
          media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"
        />

        {/* iPhone 11 Pro Max, XS Max - Portrait */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-touch-startup-image-1242x2688.png"
          media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        {/* iPhone 11 Pro Max, XS Max - Landscape */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-touch-startup-image-2688x1242.png"
          media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"
        />

        {/* iPhone 11, XR - Portrait */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-touch-startup-image-828x1792.png"
          media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        {/* iPhone 11, XR - Landscape */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-touch-startup-image-1792x828.png"
          media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
        />

        {/* iPhone 8 Plus, 7 Plus, 6S Plus, 6 Plus - Portrait */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-touch-startup-image-1242x2208.png"
          media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        {/* iPhone 8 Plus, 7 Plus, 6S Plus, 6 Plus - Landscape */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-touch-startup-image-2208x1242.png"
          media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"
        />

        {/* iPhone 8, 7, 6S, 6, SE - Portrait */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-touch-startup-image-750x1334.png"
          media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        {/* iPhone 8, 7, 6S, 6, SE - Landscape */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-touch-startup-image-1334x750.png"
          media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
        />

        {/* iPhone 5, SE (1st gen) - Portrait */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-touch-startup-image-640x1136.png"
          media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        {/* iPhone 5, SE (1st gen) - Landscape */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-touch-startup-image-1136x640.png"
          media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
        />

        {/* iPad Pro 12.9" - Portrait */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-touch-startup-image-2048x2732.png"
          media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        {/* iPad Pro 12.9" - Landscape */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-touch-startup-image-2732x2048.png"
          media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
        />

        {/* iPad Pro 11" - Portrait */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-touch-startup-image-1668x2388.png"
          media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        {/* iPad Pro 11" - Landscape */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-touch-startup-image-2388x1668.png"
          media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
        />

        {/* iPad Air 10.9" - Portrait */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-touch-startup-image-1640x2360.png"
          media="(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        {/* iPad Air 10.9" - Landscape */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-touch-startup-image-2360x1640.png"
          media="(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
        />

        {/* iPad Air 10.5", iPad Pro 10.5" - Portrait */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-touch-startup-image-1668x2224.png"
          media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        {/* iPad Air 10.5", iPad Pro 10.5" - Landscape */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-touch-startup-image-2224x1668.png"
          media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
        />

        {/* iPad 10.2" - Portrait */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-touch-startup-image-1620x2160.png"
          media="(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        {/* iPad 10.2" - Landscape */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-touch-startup-image-2160x1620.png"
          media="(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
        />

        {/* iPad 9.7", iPad Air 9.7", iPad Pro 9.7", iPad Mini 7.9" - Portrait */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-touch-startup-image-1536x2048.png"
          media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        {/* iPad 9.7", iPad Air 9.7", iPad Pro 9.7", iPad Mini 7.9" - Landscape */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-touch-startup-image-2048x1536.png"
          media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
        />

        {/* iPad Mini 8.3" - Portrait */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-touch-startup-image-1488x2266.png"
          media="(device-width: 744px) and (device-height: 1133px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        {/* iPad Mini 8.3" - Landscape */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-touch-startup-image-2266x1488.png"
          media="(device-width: 744px) and (device-height: 1133px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
