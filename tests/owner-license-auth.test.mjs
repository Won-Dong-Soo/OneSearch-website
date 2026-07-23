import assert from "node:assert/strict";
import test from "node:test";
import {
  readBearerToken,
  secureTokenEqual,
} from "../app/api/admin/license/owner/auth.js";

const TOKEN = "owner_admin_token_0123456789abcdef";

test("accepts only a strong Bearer token", () => {
  assert.equal(readBearerToken(`Bearer ${TOKEN}`), TOKEN);
  assert.equal(readBearerToken(TOKEN), "");
  assert.equal(readBearerToken("Bearer short"), "");
  assert.equal(readBearerToken("Basic dGVzdA=="), "");
});

test("compares owner admin tokens without partial matches", () => {
  assert.equal(secureTokenEqual(TOKEN, TOKEN), true);
  assert.equal(secureTokenEqual(`${TOKEN}x`, TOKEN), false);
  assert.equal(secureTokenEqual(TOKEN.slice(0, -1), TOKEN), false);
  assert.equal(secureTokenEqual(TOKEN.replace("a", "b"), TOKEN), false);
});
