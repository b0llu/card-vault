/**
 * encryption.ts
 *
 * AES-256-CBC encryption/decryption for all card data stored on device.
 *
 * Architecture:
 *  1. On first launch, a 256-bit random master key is generated using
 *     expo-crypto's cryptographically secure random byte generator.
 *  2. The master key is stored in expo-secure-store, which uses Android
 *     Keystore / iOS Secure Enclave — hardware-backed secure storage.
 *  3. Each encryption call generates a fresh random 128-bit IV.
 *  4. The stored blob format is:  <hex_iv>:<base64_ciphertext>
 *  5. The master key NEVER appears in SQLite or any log output.
 */

import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import CryptoJS from 'crypto-js';

// SecureStore key for the master encryption key
const MASTER_KEY_STORE_ID = 'scv_master_encryption_key_v1';

/**
 * Returns the master AES-256 encryption key.
 * Generates and stores it securely on first call.
 * SECURITY NOTE: This key is only ever held in memory during active use.
 */
async function getMasterKey(): Promise<CryptoJS.lib.WordArray> {
  let keyHex = await SecureStore.getItemAsync(MASTER_KEY_STORE_ID);

  if (!keyHex) {
    // Generate 32 random bytes = 256-bit key
    const randomBytes = await Crypto.getRandomBytesAsync(32);
    keyHex = Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    await SecureStore.setItemAsync(MASTER_KEY_STORE_ID, keyHex, {
      // Require device authentication to access the key
      requireAuthentication: false, // We handle auth at app level
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  }

  return CryptoJS.enc.Hex.parse(keyHex);
}

/**
 * Encrypts a plaintext string using AES-256-CBC.
 * A fresh random IV is generated for each call.
 *
 * @param plaintext - The string to encrypt (JSON card data)
 * @returns  "<hexIV>:<base64Ciphertext>"
 */
export async function encryptData(plaintext: string): Promise<string> {
  const key = await getMasterKey();

  // Fresh random 16-byte IV for each encryption
  const ivBytes = await Crypto.getRandomBytesAsync(16);
  const iv = CryptoJS.lib.WordArray.create(ivBytes as unknown as number[]);

  const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  const ivHex = CryptoJS.enc.Hex.stringify(iv);
  // Format: <32-char hex IV>:<base64 ciphertext>
  return `${ivHex}:${encrypted.toString()}`;
}

/**
 * Decrypts a blob previously produced by encryptData().
 *
 * @param encryptedBlob - "<hexIV>:<base64Ciphertext>"
 * @returns Decrypted plaintext string
 */
export async function decryptData(encryptedBlob: string): Promise<string> {
  const key = await getMasterKey();

  const separatorIndex = encryptedBlob.indexOf(':');
  if (separatorIndex === -1) {
    throw new Error('Invalid encrypted blob format');
  }

  const ivHex = encryptedBlob.slice(0, separatorIndex);
  const ciphertext = encryptedBlob.slice(separatorIndex + 1);

  const iv = CryptoJS.enc.Hex.parse(ivHex);

  const decrypted = CryptoJS.AES.decrypt(ciphertext, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  const result = decrypted.toString(CryptoJS.enc.Utf8);

  if (!result) {
    throw new Error('Decryption failed — key mismatch or corrupted data');
  }

  return result;
}

/**
 * Derives an AES key from a user-supplied password using PBKDF2-SHA256.
 * Used for export/import password-based encryption (not the master key).
 *
 * @param password  User password
 * @param saltHex   Hex-encoded salt
 * @returns CryptoJS WordArray key
 */
export function deriveKeyFromPassword(
  password: string,
  saltHex: string,
): CryptoJS.lib.WordArray {
  const salt = CryptoJS.enc.Hex.parse(saltHex);

  // 100,000 iterations of PBKDF2-SHA256 → 256-bit key
  return CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32,
    iterations: 100_000,
    hasher: CryptoJS.algo.SHA256,
  });
}

/**
 * Generates a hex-encoded random salt for PBKDF2.
 */
export async function generateSalt(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(16);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generates a hex-encoded random IV for AES-CBC.
 */
export async function generateIV(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(16);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
