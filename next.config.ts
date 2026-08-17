import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Les uploads passent par une route API classique, mais on garde une marge
      // cohérente avec la limite de charge utile de Vercel (~4,5 Mo).
      bodySizeLimit: '4mb',
    },
  },
  async headers() {
    return [
      {
        // Le site contient des données d'entreprise : aucune indexation.
        source: '/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },
};

export default nextConfig;
