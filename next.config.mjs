/** @type {import('next').NextConfig} */
const nextConfig = {
  // Adicione este bloco de configuração de imagens
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8001',
        pathname: '/media/**', 
      },
    ],
  },
};

export default nextConfig