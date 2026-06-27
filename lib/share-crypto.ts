/**
 * Secure sharing payload encryption/decryption using the browser's SubtleCrypto API.
 * This enables 100% client-side, zero-knowledge private sharing using a user-defined passcode.
 */

// Helper to convert base64 to array buffer
function base64ToBytes(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper to convert array buffer to base64
function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Encrypts a string payload with a passcode.
 * Returns a URL-safe base64 string containing salt, IV, and ciphertext.
 */
export async function encryptPayload(payload: string, passcode: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  
  // 1. Generate salt and IV
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  // 2. Import passcode raw key
  const passcodeKey = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(passcode),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  
  // 3. Derive AES-GCM key from PBKDF2
  const key = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 50000, // Balanced iterations for speed and security in browser
      hash: "SHA-256",
    },
    passcodeKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );
  
  // 4. Encrypt payload
  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    data
  );
  
  // 5. Combine salt, iv, and ciphertext
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length);
  
  // 6. Return as URL-safe base64
  return bytesToBase64(combined)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Decrypts a URL-safe base64 string using a passcode.
 * Throws an error if passcode is invalid.
 */
export async function decryptPayload(encryptedBase64: string, passcode: string): Promise<string> {
  // Restore normal base64 encoding from URL-safe format
  let base64 = encryptedBase64.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  
  const bytes = base64ToBytes(base64);
  
  // Extracts salt (16 bytes), iv (12 bytes), ciphertext (remaining)
  const salt = bytes.slice(0, 16);
  const iv = bytes.slice(16, 28);
  const ciphertext = bytes.slice(28);
  
  const encoder = new TextEncoder();
  
  // 1. Import passcode raw key
  const passcodeKey = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(passcode),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  
  // 2. Derive AES-GCM key from PBKDF2 using same parameters
  const key = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 50000,
      hash: "SHA-256",
    },
    passcodeKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
  
  // 3. Decrypt payload
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    ciphertext
  );
  
  return new TextDecoder().decode(decryptedBuffer);
}

/**
 * Helper to encode standard public payload (unencrypted UTF-8 base64)
 */
export function encodePublicPayload(payload: string): string {
  const utf8Bytes = new TextEncoder().encode(payload);
  let binary = "";
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Helper to decode standard public payload (unencrypted UTF-8 base64)
 */
export function decodePublicPayload(encodedBase64: string): string {
  let base64 = encodedBase64.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}
