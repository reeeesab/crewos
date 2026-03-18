import crypto from "crypto";

const ENCRYPTION_PREFIX = "enc:v1";

function getEncryptionKey() {
  const secret = process.env.ANALYTICS_ENCRYPTION_KEY ?? process.env.ENCRYPTION_KEY;
  if (!secret) {
    throw new Error("Missing ANALYTICS_ENCRYPTION_KEY");
  }
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptSecret(plaintext: string) {
  const iv = crypto.randomBytes(12);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    ENCRYPTION_PREFIX,
    iv.toString("base64"),
    tag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

export function decryptSecret(payload: string) {
  if (!payload.startsWith(`${ENCRYPTION_PREFIX}:`)) {
    // Backward compatibility for any plain-text values in dev.
    return payload;
  }

  const parts = payload.split(":");
  let ivBase64: string;
  let tagBase64: string;
  let dataBase64: string;

  // Current format produced by encryptSecret:
  // enc:v1:<iv>:<tag>:<ciphertext>
  if (parts.length === 5 && parts[0] === "enc" && parts[1] === "v1") {
    ivBase64 = parts[2];
    tagBase64 = parts[3];
    dataBase64 = parts[4];
  } else if (parts.length === 4 && parts[0] === ENCRYPTION_PREFIX) {
    // Legacy parser compatibility, if any values were written with a no-colon prefix.
    ivBase64 = parts[1];
    tagBase64 = parts[2];
    dataBase64 = parts[3];
  } else {
    throw new Error("Invalid encrypted secret format");
  }

  const iv = Buffer.from(ivBase64, "base64");
  const tag = Buffer.from(tagBase64, "base64");
  const data = Buffer.from(dataBase64, "base64");
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
