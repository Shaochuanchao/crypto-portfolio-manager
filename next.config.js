/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY,
    NEXT_PUBLIC_OKX_API_KEY: process.env.OKX_API_KEY,
    NEXT_PUBLIC_OKX_SECRET_KEY: process.env.OKX_SECRET_KEY,
    NEXT_PUBLIC_OKX_PASSPHRASE: process.env.OKX_PASSPHRASE,
    NEXT_PUBLIC_OKX_PROJECT_ID: process.env.OKX_PROJECT_ID,
  },
}

module.exports = nextConfig
