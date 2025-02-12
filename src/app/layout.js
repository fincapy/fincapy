import './globals.css';

export const metadata = {
  applicationName: 'Fincapy',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Fincapy',
  },
  description: 'Capybara spending plans',
  formatDetection: {
    telephone: false,
  },
  mobileWebAppCapable: true,
  themeColor: '#000000',
  viewport:
    'minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, user-scalable=no, viewport-fit=cover',
  icons: {
    icon: [
      { url: '/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon-180x180.png' },
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

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="overscroll-none" suppressHydrationWarning>
      <body className="touch-none overscroll-none">{children}</body>
    </html>
  );
}
