import { describe, it, expect } from "vitest";
import {
  verifyGaruWebhook,
  checkAndMarkProcessed,
  isPaid,
  PAID_STATUSES,
} from "./verify_webhook";
import type { GaruWebhookPayload } from "./verify_webhook";

const VALID_SECRET = "test-webhook-hash-abc123";

function makePayload(
  overrides: Partial<GaruWebhookPayload> = {},
): GaruWebhookPayload {
  return {
    event: "transaction.updateStatus",
    webhookId: 1001,
    confirmHash: VALID_SECRET,
    Transaction: {
      galaxPayId: 5678,
      status: "payedPix",
    },
    ...overrides,
  };
}

describe("verifyGaruWebhook", () => {
  it("returns verified: true for valid hash", () => {
    const result = verifyGaruWebhook(makePayload(), VALID_SECRET);
    expect(result).toEqual({ verified: true });
  });

  it("returns reason: invalid for wrong hash", () => {
    const result = verifyGaruWebhook(makePayload(), "wrong-secret");
    expect(result).toEqual({ verified: false, reason: "invalid" });
  });

  it("returns reason: missing_secret when secret is undefined", () => {
    const result = verifyGaruWebhook(makePayload(), undefined);
    expect(result).toEqual({ verified: false, reason: "missing_secret" });
  });

  it("returns reason: missing_secret when secret is empty string", () => {
    const result = verifyGaruWebhook(makePayload(), "");
    expect(result).toEqual({ verified: false, reason: "missing_secret" });
  });

  it("returns reason: missing_hash when confirmHash is missing", () => {
    const payload = makePayload({ confirmHash: "" });
    const result = verifyGaruWebhook(payload, VALID_SECRET);
    expect(result).toEqual({ verified: false, reason: "missing_hash" });
  });

  it("returns reason: missing_hash for null payload", () => {
    const result = verifyGaruWebhook(
      null as unknown as GaruWebhookPayload,
      VALID_SECRET,
    );
    expect(result).toEqual({ verified: false, reason: "missing_hash" });
  });

  it("uses constant-time comparison (does not throw on different-length strings)", () => {
    const payload = makePayload({ confirmHash: "short" });
    const result = verifyGaruWebhook(payload, "a-much-longer-secret-value");
    expect(result).toEqual({ verified: false, reason: "invalid" });
  });
});

describe("checkAndMarkProcessed", () => {
  it("returns false for first occurrence and marks it", () => {
    const store = new Set<number>();
    expect(checkAndMarkProcessed(100, store)).toBe(false);
    expect(store.has(100)).toBe(true);
  });

  it("returns true for duplicate webhookId", () => {
    const store = new Set<number>();
    checkAndMarkProcessed(200, store);
    expect(checkAndMarkProcessed(200, store)).toBe(true);
  });

  it("tracks multiple distinct webhookIds", () => {
    const store = new Set<number>();
    expect(checkAndMarkProcessed(1, store)).toBe(false);
    expect(checkAndMarkProcessed(2, store)).toBe(false);
    expect(checkAndMarkProcessed(1, store)).toBe(true);
    expect(checkAndMarkProcessed(2, store)).toBe(true);
    expect(checkAndMarkProcessed(3, store)).toBe(false);
  });
});

describe("isPaid", () => {
  it.each([...PAID_STATUSES])("returns true for paid status: %s", (status) => {
    expect(isPaid(status)).toBe(true);
  });

  it.each([
    "pendingPix",
    "pendingBoleto",
    "denied",
    "reversed",
    "cancel",
    "authorized",
    "unavailablePix",
    "notCompensated",
  ])("returns false for non-paid status: %s", (status) => {
    expect(isPaid(status)).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isPaid("")).toBe(false);
  });
});
