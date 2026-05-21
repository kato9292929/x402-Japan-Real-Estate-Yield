import Anthropic from "@anthropic-ai/sdk";

/** 分析用 Claude モデル。 */
export const CLAUDE_MODEL = "claude-sonnet-4-6";

let client: Anthropic | null = null;

/** ANTHROPIC_API_KEY 未設定なら null（呼び出し側はヒューリスティックへ）。 */
export function getAnthropic(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  if (!client) client = new Anthropic({ apiKey });
  return client;
}

/** Claude にテキスト生成を依頼する。失敗時は null。 */
export async function callClaude(
  system: string,
  user: string,
  maxTokens: number,
): Promise<string | null> {
  const anthropic = getAnthropic();
  if (!anthropic) return null;
  try {
    const msg = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    });
    const text = msg.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("")
      .trim();
    return text || null;
  } catch {
    return null;
  }
}

/** Claude 応答（コードフェンス込みの場合あり）から JSON を抽出する。 */
export function extractJson<T>(text: string | null): T | null {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(body.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}
