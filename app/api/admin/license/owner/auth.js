export function readBearerToken(value) {
  const match = /^Bearer ([A-Za-z0-9_-]{32,})$/.exec(String(value ?? "").trim());
  return match?.[1] ?? "";
}

export function secureTokenEqual(provided, expected) {
  if (!provided || !expected || provided.length !== expected.length) return false;

  let difference = 0;
  for (let index = 0; index < provided.length; index += 1) {
    difference |= provided.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return difference === 0;
}
