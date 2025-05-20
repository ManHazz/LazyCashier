/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable image optimization
  images: {
    domains: ["firebasestorage.googleapis.com"],
    formats: ["image/avif", "image/webp"],
  },

  // Enable static page generation where possible
  output: "standalone",

  // Enable compression
  compress: true,

  // Configure caching
  headers: async () => [
    {
      source: "/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
      ],
    },
  ],
};

export default nextConfig;
