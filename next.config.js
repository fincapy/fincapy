import withBundleAnalyzer from '@next/bundle-analyzer';

const bundleAnalyzerConfig = {
  enabled: process.env.ANALYZE === 'true',
};

const nextConfig = {
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.fincapy.com',
          },
        ],
        destination: 'https://fincapy.com/:path*',
        permanent: true,
      },
    ];
  },
};

export default withBundleAnalyzer(bundleAnalyzerConfig)(nextConfig);
