import { createHash, randomInt } from "crypto";

const INVITE_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const RAW_CODE_LENGTH = 12;

export function normalizeInviteCode(code: string) {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function hashInviteCode(code: string) {
  const normalized = normalizeInviteCode(code);
  return createHash("sha256").update(`crewos:invite:${normalized}`).digest("hex");
}

function generateRawCode(length = RAW_CODE_LENGTH) {
  let output = "";
  for (let i = 0; i < length; i += 1) {
    output += INVITE_CODE_CHARS[randomInt(0, INVITE_CODE_CHARS.length)];
  }
  return output;
}

export function formatInviteCode(raw: string) {
  const normalized = normalizeInviteCode(raw);
  return normalized.match(/.{1,4}/g)?.join("-") ?? normalized;
}

export function createInviteCode() {
  const normalized = generateRawCode();
  return {
    code: formatInviteCode(normalized),
    hash: hashInviteCode(normalized),
    hint: normalized.slice(-4),
  };
}

