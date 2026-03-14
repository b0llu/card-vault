/**
 * database.ts
 *
 * SQLite storage layer for encrypted card data.
 *
 * All data written to SQLite is already AES-256-CBC encrypted.
 * SQLite only ever sees opaque encrypted blobs — never plaintext card data.
 *
 * Schema:
 *   cards (
 *     id           TEXT PRIMARY KEY,
 *     encrypted_data TEXT NOT NULL,   -- JSON card blob, AES-256-CBC encrypted
 *     created_at   TEXT NOT NULL,
 *     updated_at   TEXT NOT NULL
 *   )
 */

import * as SQLite from 'expo-sqlite';
import { encryptData, decryptData } from '../crypto/encryption';
import { Card, EncryptedCardRow } from '../types';
import { detectCardBrand } from '../utils/cardUtils';

const DB_NAME = 'securecardvault.db';

let _db: SQLite.SQLiteDatabase | null = null;

/** Opens (or reuses) the SQLite database and ensures the schema exists. */
async function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;

  _db = await SQLite.openDatabaseAsync(DB_NAME);

  await _db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS cards (
      id           TEXT PRIMARY KEY NOT NULL,
      encrypted_data TEXT NOT NULL,
      created_at   TEXT NOT NULL,
      updated_at   TEXT NOT NULL
    );
  `);

  return _db;
}

/** Generates a short unique ID. */
function generateId(): string {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8)
  ).toUpperCase();
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the number of stored cards.
 */
export async function getCardCount(): Promise<number> {
  const db = await getDB();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM cards',
  );
  return row?.count ?? 0;
}

/**
 * Adds a new card after encrypting its data.
 */
export async function addCard(card: Omit<Card, 'id'>): Promise<Card> {
  const db = await getDB();
  const id = generateId();
  const now = new Date().toISOString();

  // Ensure brand is always set
  const cardWithId: Card = {
    ...card,
    id,
    brand: card.brand ?? detectCardBrand(card.cardNumber),
  };

  // SECURITY: encrypt the full card JSON before writing to SQLite
  const encryptedData = await encryptData(JSON.stringify(cardWithId));

  await db.runAsync(
    'INSERT INTO cards (id, encrypted_data, created_at, updated_at) VALUES (?, ?, ?, ?)',
    [id, encryptedData, now, now],
  );

  return cardWithId;
}

/**
 * Returns all stored cards, decrypted.
 * Cards that fail to decrypt (e.g. corrupted) are silently skipped.
 */
export async function getCards(): Promise<Card[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<EncryptedCardRow>(
    'SELECT * FROM cards ORDER BY created_at DESC',
  );

  const cards: Card[] = [];
  for (const row of rows) {
    try {
      const json = await decryptData(row.encrypted_data);
      cards.push(JSON.parse(json) as Card);
    } catch (err) {
      // SECURITY: log id only, never the encrypted blob
      console.warn('[DB] Failed to decrypt card id:', row.id);
    }
  }

  return cards;
}

/**
 * Returns a single card by id, decrypted.
 */
export async function getCardById(id: string): Promise<Card | null> {
  const db = await getDB();
  const row = await db.getFirstAsync<EncryptedCardRow>(
    'SELECT * FROM cards WHERE id = ?',
    [id],
  );

  if (!row) return null;

  try {
    const json = await decryptData(row.encrypted_data);
    return JSON.parse(json) as Card;
  } catch {
    console.warn('[DB] Failed to decrypt card id:', id);
    return null;
  }
}

/**
 * Updates an existing card (re-encrypts and writes updated data).
 */
export async function updateCard(id: string, updates: Omit<Card, 'id'>): Promise<void> {
  const db = await getDB();
  const now = new Date().toISOString();
  const card: Card = {
    ...updates,
    id,
    brand: updates.brand ?? detectCardBrand(updates.cardNumber),
  };
  const encryptedData = await encryptData(JSON.stringify(card));
  await db.runAsync(
    'UPDATE cards SET encrypted_data = ?, updated_at = ? WHERE id = ?',
    [encryptedData, now, id],
  );
}

/**
 * Deletes a card by id.
 */
export async function deleteCard(id: string): Promise<void> {
  const db = await getDB();
  await db.runAsync('DELETE FROM cards WHERE id = ?', [id]);
}

/**
 * Imports a list of cards (from backup) into the database.
 * Returns the number of cards actually imported.
 */
export async function importCards(cards: Card[]): Promise<number> {
  let imported = 0;

  for (const card of cards) {
    // Re-encrypt with the device's master key
    const db = await getDB();
    const now = new Date().toISOString();
    const encryptedData = await encryptData(JSON.stringify(card));

    await db.runAsync(
      'INSERT OR REPLACE INTO cards (id, encrypted_data, created_at, updated_at) VALUES (?, ?, ?, ?)',
      [card.id, encryptedData, now, now],
    );
    imported++;
  }

  return imported;
}

/**
 * Drops all cards. Used internally by import when replacing vault.
 */
export async function clearAllCards(): Promise<void> {
  const db = await getDB();
  await db.runAsync('DELETE FROM cards');
}
