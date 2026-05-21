"use client";

import "@rainbow-me/rainbowkit/styles.css";
import dynamic from "next/dynamic";
import { useState, type ReactNode } from "react";
import {
  RainbowKitProvider,
  darkTheme,
  getDefaultConfig,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { base, polygon, bsc } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Solana ウォレットプロバイダーはブラウザ専用のため ssr:false で動的読み込み。
const SolanaWalletProviders = dynamic(
  () => import("@/components/SolanaWalletProviders"),
  { ssr: false },
);

const config = getDefaultConfig({
  appName: "x402 Japan Real Estate Yield",
  projectId:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "placeholder",
  chains: [base, polygon, bsc],
  ssr: true,
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#c8a96e",
            accentColorForeground: "#0a0a0a",
            borderRadius: "small",
            overlayBlur: "small",
          })}
        >
          <SolanaWalletProviders>{children}</SolanaWalletProviders>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
