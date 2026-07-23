const token = process.env.OWNER_LICENSE_ADMIN_TOKEN?.trim() ?? "";
const siteUrl = (process.env.ONESEARCH_SITE_URL ?? "https://onesearch-download.adultdongsoo0516.chatgpt.site")
  .replace(/\/+$/, "");

if (!token) {
  console.error("OWNER_LICENSE_ADMIN_TOKEN is required.");
  process.exit(1);
}

const response = await fetch(`${siteUrl}/api/admin/license/owner`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
});
const data = await response.json().catch(() => null);

if (!response.ok || !data?.licenseKey) {
  console.error(data?.message ?? `Owner license request failed with HTTP ${response.status}.`);
  process.exit(1);
}

process.stdout.write(`${data.licenseKey}\n`);
