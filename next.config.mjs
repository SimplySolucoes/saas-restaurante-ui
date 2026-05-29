/** @type {import('next').NextConfig} */
const tunnelApiHost =
  process.env.NEXT_PUBLIC_TUNNEL_API_HOST ||
  'camcorder-untagged-reappear.ngrok-free.dev';

const tunnelFrontHost =
  process.env.NEXT_PUBLIC_TUNNEL_FRONT_HOSTS?.split(',')[0]?.trim() ||
  'cold-actors-stay.loca.lt';

const nextConfig = {
  allowedDevOrigins: [tunnelFrontHost],
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
        hostname: tunnelApiHost,
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

