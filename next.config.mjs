/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    serverComponentsExternalPackages: ["@electric-sql/pglite", "postgres", "bcryptjs"],
  },
};

export default nextConfig;
