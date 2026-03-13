/**
 * exportService.ts
 *
 * Secure encrypted export/import of the card vault.
 *
 * Export flow:
 *  1. Decrypt all cards from SQLite using the master key.
 *  2. Re-encrypt the full card array using a user-supplied password
 *     via PBKDF2-SHA256 → AES-256-CBC (separate from the master key).
 *  3. Save the encrypted blob as a .securevault JSON file.
 *  4. Share the file via expo-sharing.
 *
 * Import flow:
 *  1. Read the .securevault file.
 *  2. Validate the schema/version.
 *  3. Derive the decryption key from user password + stored salt.
 *  4. Decrypt → parse cards → import into local SQLite.
 *
 * The export key is NEVER the same as the master key. This ensures that
 * even if an export file is leaked the master key is not exposed.
 */

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import CryptoJS from 'crypto-js';
import { getCards } from '../storage/database';
import { deriveKeyFromPassword, generateSalt, generateIV } from '../crypto/encryption';
import { Card, VaultExport } from '../types';

export const VAULT_VERSION = '1.0';
export const VAULT_FILE_EXTENSION = '.securevault';

// ─── Export ───────────────────────────────────────────────────────────────────

/**
 * Exports all cards as a password-encrypted .securevault file
 * and opens the share sheet.
 *
 * @param password  User-defined export password
 */
export async function exportVault(password: string): Promise<void> {
  if (!password || password.length < 6) {
    throw new Error('Export password must be at least 6 characters.');
  }

  // 1. Fetch all decrypted cards
  const cards = await getCards();
  if (cards.length === 0) {
    throw new Error('No cards to export.');
  }

  const plaintext = JSON.stringify(cards);

  // 2. Generate random salt + IV for PBKDF2 + AES
  const [saltHex, ivHex] = await Promise.all([generateSalt(), generateIV()]);

  // 3. Derive AES key from password using PBKDF2-SHA256 (100k iterations)
  const key = deriveKeyFromPassword(password, saltHex);
  const iv = CryptoJS.enc.Hex.parse(ivHex);

  // 4. AES-256-CBC encrypt the plaintext
  const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  // 5. Build export object
  const exportData: VaultExport = {
    encryptedVault: encrypted.toString(), // base64
    salt: saltHex,
    iv: ivHex,
    version: VAULT_VERSION,
  };

  // 6. Write to a local file
  const filename = `vault_backup_${Date.now()}${VAULT_FILE_EXTENSION}`;
  const filePath = `${FileSystem.documentDirectory}${filename}`;

  await FileSystem.writeAsStringAsync(
    filePath,
    JSON.stringify(exportData, null, 2),
    { encoding: FileSystem.EncodingType.UTF8 },
  );

  // 7. Share via OS share sheet
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('Sharing is not available on this device.');
  }

  await Sharing.shareAsync(filePath, {
    mimeType: 'application/octet-stream',
    dialogTitle: 'Save Secure Vault Backup',
    UTI: 'public.data',
  });
}

// ─── Import ───────────────────────────────────────────────────────────────────

/**
 * Reads and decrypts a .securevault backup file.
 *
 * @param fileUri   File URI from expo-document-picker
 * @param password  Password used when exporting
 * @returns  Decrypted array of cards
 */
export async function decryptVaultFile(
  fileUri: string,
  password: string,
): Promise<Card[]> {
  // 1. Read file contents
  let content: string;
  try {
    content = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.UTF8,
    });
  } catch {
    throw new Error('Could not read the backup file.');
  }

  // 2. Parse JSON
  let exportData: VaultExport;
  try {
    exportData = JSON.parse(content) as VaultExport;
  } catch {
    throw new Error(
      'Invalid file format. This does not appear to be a Secure Card Vault backup.',
    );
  }

  // 3. Validate schema
  if (
    !exportData.encryptedVault ||
    !exportData.salt ||
    !exportData.iv ||
    !exportData.version
  ) {
    throw new Error(
      'Invalid backup file. Missing required fields. Only files created by Secure Card Vault are supported.',
    );
  }

  if (exportData.version !== VAULT_VERSION) {
    throw new Error(
      `Unsupported backup version: ${exportData.version}. Please update the app.`,
    );
  }

  // 4. Derive key from password
  const key = deriveKeyFromPassword(password, exportData.salt);
  const iv = CryptoJS.enc.Hex.parse(exportData.iv);

  // 5. Decrypt
  let plaintext: string;
  try {
    const decryptedWA = CryptoJS.AES.decrypt(
      exportData.encryptedVault,
      key,
      { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 },
    );
    plaintext = decryptedWA.toString(CryptoJS.enc.Utf8);
    if (!plaintext) throw new Error('Empty result');
  } catch {
    throw new Error(
      'Incorrect password or corrupted backup file.',
    );
  }

  // 6. Parse cards array
  let cards: Card[];
  try {
    cards = JSON.parse(plaintext) as Card[];
    if (!Array.isArray(cards)) throw new Error('Not an array');
  } catch {
    throw new Error(
      'Incorrect password or corrupted backup file.',
    );
  }

  return cards;
}
