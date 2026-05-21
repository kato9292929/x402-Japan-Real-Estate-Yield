import { withManual402, corsPreflight } from "@/lib/manual402";
import { compareHandler } from "@/lib/featureHandlers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withManual402(
  "solana",
  compareHandler,
  "500000",
  "Compare real estate yield across up to 5 areas — Solana USDC",
);

export const OPTIONS = async () => corsPreflight();
