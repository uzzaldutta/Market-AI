/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'https://market-ai-pf2c.onrender.com/api/v1/:path*',
      },
    ];
  },
};

export default nextConfig;
