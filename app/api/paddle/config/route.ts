import { getRuntimeEnv } from "../../../../db/license-store";

export function GET() {
  const runtime = getRuntimeEnv();
  const clientToken = runtime.PADDLE_CLIENT_TOKEN ?? "";
  const priceId = runtime.PADDLE_PRICE_ID ?? "";

  return Response.json({
    configured: Boolean(clientToken && priceId),
    clientToken,
    priceId,
    environment: runtime.PADDLE_ENVIRONMENT === "sandbox" ? "sandbox" : "production",
  }, { headers: { "cache-control": "no-store" } });
}
