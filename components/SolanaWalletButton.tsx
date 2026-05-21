"use client";

import dynamic from "next/dynamic";

// WalletMultiButton はブラウザ専用のため ssr:false で読み込む。
const WalletMultiButton = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false },
);

export function SolanaWalletButton() {
  return <WalletMultiButton />;
}
