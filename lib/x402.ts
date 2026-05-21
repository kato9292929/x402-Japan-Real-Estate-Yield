/**
 * Japan Data API などの上流エンドポイントを叩くための x402 対応 fetch。
 *
 * 本番では x402-fetch + 署名済みウォレットで 402 チャレンジを決済するが、
 * サーバールートからの best-effort なデータ補完では署名鍵を持たないため、
 * 通常リクエストを試み、失敗時は呼び出し側のベースラインへフォールバックする。
 */
export async function fetchWithX402(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  const headers: HeadersInit = {
    Accept: "application/json",
    "User-Agent": "x402-japan-realestate-yield/0.1",
    ...(init?.headers ?? {}),
  };
  return fetch(url, {
    ...init,
    headers,
    signal: init?.signal ?? AbortSignal.timeout(8000),
    cache: "no-store",
  });
}

/** JSON を取得し、ネットワークエラー・402・非 200 は null を返す。 */
export async function fetchJsonWithX402<T>(url: string): Promise<T | null> {
  try {
    const res = await fetchWithX402(url);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
