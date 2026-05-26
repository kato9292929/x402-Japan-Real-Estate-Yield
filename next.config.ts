import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@x402/next",
    "@x402/core",
    "@x402/evm",
    "@coinbase/x402",
  ],
  webpack: (config) => {
    // pino-pretty は WalletConnect が transitive に要求する optional 依存。
    // 使わないので external にして "Can't resolve 'pino-pretty'" 警告を抑止。
    config.externals.push("pino-pretty");
    return config;
  },
};

export default nextConfig;
