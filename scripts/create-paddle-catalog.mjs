const environment = process.env.PADDLE_ENVIRONMENT === "production" ? "production" : "sandbox";
const apiKey = process.env.PADDLE_API_KEY;
const baseUrl = environment === "production" ? "https://api.paddle.com" : "https://sandbox-api.paddle.com";

if (!apiKey) {
  console.error("PADDLE_API_KEY is required.");
  process.exit(1);
}

async function paddle(path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(JSON.stringify(payload));
  return payload.data;
}

const product = await paddle("/products", {
  name: "OneSearch Founding Pro",
  description: "8B·14B 고급 로컬 AI, 검색 결과 보관함, Markdown·CSV 내보내기, 최대 3대 기기, OneSearch 1.x 업데이트",
  tax_category: "standard",
  image_url: "https://onesearch-download.adultdongsoo0516.chatgpt.site/onesearch-icon.png",
});

const price = await paddle("/prices", {
  product_id: product.id,
  name: "Founding Pro",
  description: "One-time Founding Pro license",
  billing_cycle: null,
  unit_price: { amount: "19900", currency_code: "KRW" },
  tax_mode: "account_setting",
  quantity: { minimum: 1, maximum: 1 },
});

const notification = await paddle("/notification-settings", {
  description: "OneSearch production licensing",
  type: "url",
  destination: "https://onesearch-download.adultdongsoo0516.chatgpt.site/api/paddle/webhook",
  subscribed_events: ["transaction.completed", "adjustment.updated"],
  traffic_source: "platform",
});

console.log(JSON.stringify({
  environment,
  productId: product.id,
  priceId: price.id,
  notificationId: notification.id,
  webhookSecret: notification.endpoint_secret_key,
}, null, 2));
