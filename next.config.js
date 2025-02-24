import withBundleAnalyzer from '@next/bundle-analyzer';

const bundleAnalyzerConfig = {
  enabled: process.env.ANALYZE === 'true',
};

const nextConfig = {
  output: 'standalone',
};

export default withBundleAnalyzer(bundleAnalyzerConfig)(nextConfig);
