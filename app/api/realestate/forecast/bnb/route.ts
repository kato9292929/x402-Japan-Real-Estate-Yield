import { withManual402, corsPreflight } from "@/lib/manual402";
import { forecastHandler } from "@/lib/featureHandlers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withManual402(
  "bnb",
  forecastHandler,
  "1000000",
  "Forward-looking real estate yield forecast — BNB Chain USDT",
);

export const OPTIONS = async () => corsPreflight();
