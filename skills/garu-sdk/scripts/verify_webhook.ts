/**
 * Garu Webhook Verification
 *
 * Copy-paste-ready functions for verifying Garu webhook payloads.
 *
 * Usage:
 *   import { verifyGaruWebhook, isPaid } from './verify_webhook';
 *
 *   app.post('/webhooks/garu', (req, res) => {
 *     const result = verifyGaruWebhook(req.body, process.env.GARU_WEBHOOK_SECRET);
 *     if (!result.verified) {
 *       return res.status(401).json({ success: false, reason: result.reason });
 *     }
 *     // Process the verified event...
 *     return res.json({ success: true });
 *   });
 */

import { timingSafeEqual, createHash } from "crypto";

export interface GaruWebhookPayload {
  event: string;
  webhookId: number;
  confirmHash: string;
  Transaction?: {
    galaxPayId: number;
    status: string;
    value?: number;
    payday?: string;
    fee?: number;
    Pix?: { qrCode?: string; endToEndId?: string };
    Boleto?: { bankLine?: string; barCode?: string };
  };
  Subscription?: {
    galaxPayId: number;
    status?: string;
  };
}

type VerifyResult =
  | { verified: true }
  | { verified: false; reason: "missing_secret" | "missing_hash" | "invalid" };

/**
 * Verify a Garu webhook payload using constant-time comparison.
 *
 * @param payload - The parsed JSON body from the webhook request
 * @param secret  - Your GARU_WEBHOOK_SECRET (the webhook hash from the Garu dashboard)
 * @returns A discriminated result: { verified: true } or { verified: false, reason }
 */
export function verifyGaruWebhook(
  payload: GaruWebhookPayload,
  secret: string | undefined,
): VerifyResult {
  if (!secret) {
    return { verified: false, reason: "missing_secret" };
  }

  if (!payload || !payload.confirmHash) {
    return { verified: false, reason: "missing_hash" };
  }

  const isValid = safeEqual(payload.confirmHash, secret);
  return isValid ? { verified: true } : { verified: false, reason: "invalid" };
}

/**
 * Constant-time string comparison to prevent timing attacks.
 * Hashes both inputs first to guarantee equal-length buffers.
 */
function safeEqual(a: string, b: string): boolean {
  const aBuf = createHash("sha256").update(a).digest();
  const bBuf = createHash("sha256").update(b).digest();
  return timingSafeEqual(aBuf, bBuf);
}

/**
 * Track whether a webhook has already been processed.
 *
 * WARNING: This in-memory implementation is a DEVELOPMENT STUB.
 * In production, replace the Set with a durable store (Redis, database table)
 * to survive restarts and work across multiple processes (e.g., PM2 cluster).
 *
 * The caller MUST mark the webhook as processed AFTER successful handling,
 * not before — otherwise a failed handler will cause retries to be silently dropped.
 *
 * Recommended production pattern:
 *   1. Check if webhookId exists in durable store → if yes, skip (duplicate)
 *   2. Process the event
 *   3. Insert webhookId into durable store (with TTL matching Garu's retry window)
 *
 * @param webhookId - The unique webhookId from the payload
 * @param store     - A Set (or any has/add interface) tracking processed IDs
 * @returns true if this is a duplicate delivery
 */
export function checkAndMarkProcessed(
  webhookId: number,
  store: { has(id: number): boolean; add(id: number): void },
): boolean {
  if (store.has(webhookId)) {
    return true;
  }
  store.add(webhookId);
  return false;
}

/**
 * Paid statuses — use for order fulfillment decisions.
 */
export const PAID_STATUSES = ["captured", "payedBoleto", "payedPix"] as const;

export function isPaid(status: string): boolean {
  return (PAID_STATUSES as readonly string[]).includes(status);
}
