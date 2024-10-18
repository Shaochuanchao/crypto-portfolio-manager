/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY,
  },
}

module.exports = nextConfig
