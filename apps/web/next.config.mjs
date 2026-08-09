/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@agbofa/ui",
    "@agbofa/api-client",
    "@agbofa/config",
    "@agbofa/utils",
    "@agbofa/enterprise-centers"
  ]
};

export default nextConfig;
