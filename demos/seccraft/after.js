// OpsBoard auth/orders — after (the seccraft pass)
// Same jobs, secure defaults: secrets from the environment, text nodes
// instead of innerHTML, bound parameters, CSPRNG tokens, argon2id, and
// parameterized everything.

import crypto from "node:crypto";
import argon2 from "argon2";

const apiKey = process.env.ORDERS_API_KEY; // injected, never written

function render(name) {
  const node = document.createElement("span");
  node.textContent = name; // text node, never innerHTML
  document.getElementById("profile").appendChild(node);
}

async function findUser(q) {
  return db.query("SELECT id, email FROM users WHERE email = ?", [q]);
}

export function newToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function hashPassword(pw) {
  return argon2.hash(pw, { type: argon2.argon2id });
}

export function runPlugin(code) {
  throw new Error("dynamic code execution disabled — plugins are sandboxed");
}
