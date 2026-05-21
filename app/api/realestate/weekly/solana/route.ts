import { withManual402, corsPreflight } from "@/lib/manual402";
import { weeklyHandler } from "@/lib/featureHandlers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withManual402(
  "solana",
  weeklyHandler,
  "2000000",
  "Weekly Japan real estate market report — Solana USDC",
);

export const OPTIONS = async () => corsPreflight();
