/**
 * Garu Webhook Verification
 *
 * Standalone, copy-paste-ready function for verifying Garu webhook payloads.
 * Use this in your webhook endpoint to ensure events are authentic.
 *
 * Usage:
 *   import { verifyGaruWebhook } from './verify_webhook';
 *
 *   app.post('/webhooks/garu', (req, res) => {
 *     if (!verifyGaruWebhook(req.body, process.env.GARU_WEBHOOK_SECRET)) {
 *       return res.status(401).json({ success: false });
 *     }
 *     // Process the verified event...
 *     return res.json({ success: true });
 *   });
 */

interface GaruWebhookPayload {
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

/**
 * Verify a Garu webhook payload.
 *
 * @param payload - The parsed JSON body from the webhook request
 * @param secret  - Your GARU_WEBHOOK_SECRET (from the dashboard)
 * @returns true if the webhook is authentic, false otherwise
 */
export function verifyGaruWebhook(
  payload: GaruWebhookPayload,
  secret: string | undefined,
): boolean {
  if (!secret) {
    return false;
  }

  if (!payload || !payload.confirmHash) {
    return false;
  }

  return payload.confirmHash === secret;
}

/**
 * Check if a webhook has already been processed (idempotency).
 *
 * @param webhookId - The unique webhookId from the payload
 * @param store     - A Set (or any has/add interface) tracking processed IDs
 * @returns true if this is a duplicate delivery
 */
export function isDuplicateWebhook(
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
