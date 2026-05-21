"use client";

import { useMemo, type ReactNode } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { clusterApiUrl } from "@solana/web3.js";
import "@solana/wallet-adapter-react-ui/styles.css";

const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];

export default function SolanaWalletProviders({
  children,
}: {
  children: ReactNode;
}) {
  const endpoint = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_HELIUS_RPC_URL;
    if (url && !url.includes("YOUR_KEY")) return url;
    return clusterApiUrl("mainnet-beta");
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
