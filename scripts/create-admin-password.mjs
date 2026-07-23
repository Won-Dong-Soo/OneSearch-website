import { randomBytes } from "node:crypto";
import { createPasswordVerifier } from "../db/admin-auth.js";

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
const requestedPassword = process.argv[2]?.trim();
const password = requestedPassword || [...randomBytes(24)]
  .map((byte) => alphabet[byte % alphabet.length])
  .join("");

if (password.length < 16) {
  console.error("Admin password must contain at least 16 characters.");
  process.exit(1);
}

const verifier = await createPasswordVerifier(password);
process.stdout.write(JSON.stringify({ username: "admin", password, verifier }));
