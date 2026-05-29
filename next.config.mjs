/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8001',
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8080',
        pathname: '/media/**', 
      },
      {
        protocol: 'https',
        hostname: 'saas-simplydev-media.s3.amazonaws.com',
        port: '',
        pathname: '/**', 
      },
    ],
  },
};

export default nextConfig;

