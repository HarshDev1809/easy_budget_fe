import { describe, it, expect, beforeAll } from "vitest"
import { encodePublicPayload, decodePublicPayload, encryptPayload, decryptPayload } from "./share-crypto"

beforeAll(() => {
  // Polyfill Web Crypto API for jsdom environment if needed
  if (typeof window !== "undefined" && !window.crypto) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodeCrypto = require("crypto");
    Object.defineProperty(window, "crypto", {
      value: nodeCrypto.webcrypto,
      writable: true
    });
  }
  if (!globalThis.crypto) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodeCrypto = require("crypto");
    // @ts-expect-error - webcrypto type assignment mismatch
    globalThis.crypto = nodeCrypto.webcrypto;
  }
});

describe("share-crypto helpers", () => {
  const testPayload = JSON.stringify({
    bookName: "Vacation Budget",
    baseAmount: 12000,
    transactions: [
      { name: "Flight", amount: "5000", type: "debit", categoryName: "Travel", paidAt: "2026-06-25T10:00:00Z" }
    ]
  });

  describe("Public Payload encoding", () => {
    it("should encode and decode public payloads correctly", () => {
      const encoded = encodePublicPayload(testPayload);
      expect(typeof encoded).toBe("string");
      expect(encoded.length).toBeGreaterThan(0);

      const decoded = decodePublicPayload(encoded);
      expect(decoded).toBe(testPayload);
      expect(JSON.parse(decoded).bookName).toBe("Vacation Budget");
    });
  });

  describe("Private Payload encryption", () => {
    it("should encrypt and decrypt payloads correctly with the correct passcode", async () => {
      const passcode = "secret1234";
      const encrypted = await encryptPayload(testPayload, passcode);
      expect(typeof encrypted).toBe("string");
      expect(encrypted.length).toBeGreaterThan(0);

      const decrypted = await decryptPayload(encrypted, passcode);
      expect(decrypted).toBe(testPayload);
      expect(JSON.parse(decrypted).baseAmount).toBe(12000);
    });

    it("should throw an error when decrypting with an incorrect passcode", async () => {
      const passcode = "secret1234";
      const encrypted = await encryptPayload(testPayload, passcode);

      await expect(decryptPayload(encrypted, "wrongpass")).rejects.toThrow();
    });
  });
});
