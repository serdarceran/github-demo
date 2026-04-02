/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },
  transpilePackages: [
    "@goal-tracker/types",
    "@goal-tracker/core",
    "@goal-tracker/api-client",
    "@goal-tracker/db",
  ],
};

module.exports = nextConfig;
