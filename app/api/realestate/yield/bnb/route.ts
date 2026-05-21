import { withManual402, corsPreflight } from "@/lib/manual402";
import { yieldHandler } from "@/lib/featureHandlers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withManual402(
  "bnb",
  yieldHandler,
  "300000",
  "Japan real estate yield analysis by area — BNB Chain USDT",
);

export const OPTIONS = async () => corsPreflight();
