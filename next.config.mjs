/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // 1. Adicionado para permitir imagens do seu servidor local (desenvolvimento)
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8001',
        pathname: '/media/**', 
      },
      // 2. Mantido para permitir imagens do seu bucket S3 (produção)
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

