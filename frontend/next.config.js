/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'ipfs.io' },
    ],
  },
  // Silence Turbopack warning by defining empty turbopack options
  turbopack: {},
  // Suppress noisy peer-dep warnings from Web3 packages in dev
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
};

module.exports = nextConfig;
