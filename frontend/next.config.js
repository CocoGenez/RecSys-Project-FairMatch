/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: 'http://13.221.63.255:8000/:path*', 
      },
    ]
  },
};

module.exports = nextConfig






