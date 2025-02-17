import withPWA from 'next-pwa';
import withBundleAnalyzer from '@next/bundle-analyzer';

const pwaConfig = {
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
};

const bundleAnalyzerConfig = {
  enabled: process.env.ANALYZE === 'true',
};

const nextConfig = {
  output: 'standalone',
};

export default withPWA(pwaConfig)(
  withBundleAnalyzer(bundleAnalyzerConfig)(nextConfig)
);
