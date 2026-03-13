/**
 * ocrParser.ts
 *
 * Extracts credit card fields from raw OCR text.
 *
 * Card Number regex:  matches 13–19 digit sequences, ignoring spaces/dashes
 * Expiry regex:       matches MM/YY or MM/YYYY patterns
 *
 * The parser is intentionally permissive — it returns best-effort matches
 * and the user can correct anything in the form before saving.
 */

import { OCRCardResult } from '../types';

// Matches 13–16 consecutive digits with optional spaces or dashes between groups
const CARD_NUMBER_REGEX = /\b(\d[ \-]*){13,19}\b/g;

// Matches expiry in MM/YY, MM-YY, MM/YYYY formats
const EXPIRY_REGEX = /\b(0[1-9]|1[0-2])[\/\-]([0-9]{2,4})\b/g;

/**
 * Parses OCR text and extracts credit card fields.
 *
 * @param text  Raw OCR output (multi-line)
 * @returns     Partial card data to pre-fill the form
 */
export function parseCardFromOCR(text: string): OCRCardResult {
  const result: OCRCardResult = {};
  const normalized = text.replace(/\n/g, ' ');

  // ── Card Number ──────────────────────────────────────────────────────────
  const cardMatches = [...normalized.matchAll(CARD_NUMBER_REGEX)];
  if (cardMatches.length > 0) {
    // Pick the longest digit sequence (most likely the card number)
    const best = cardMatches.sort((a, b) => {
      const aDigits = a[0].replace(/\D/g, '').length;
      const bDigits = b[0].replace(/\D/g, '').length;
      return bDigits - aDigits;
    })[0];

    const digits = best[0].replace(/\D/g, '');
    if (digits.length >= 13 && digits.length <= 19) {
      result.cardNumber = digits;
    }
  }

  // ── Expiry ───────────────────────────────────────────────────────────────
  const expiryMatches = [...normalized.matchAll(EXPIRY_REGEX)];
  if (expiryMatches.length > 0) {
    const match = expiryMatches[0];
    result.expiryMonth = match[1]; // "01" – "12"
    const yearRaw = match[2];
    // Normalize 4-digit year to 2-digit
    result.expiryYear =
      yearRaw.length === 4 ? yearRaw.slice(-2) : yearRaw;
  }

  return result;
}

/**
 * Combines OCR results from multiple text blocks (Vision Camera frame blocks).
 * Merges results, preferring earlier non-null values.
 */
export function mergeOCRResults(
  results: OCRCardResult[],
): OCRCardResult {
  return results.reduce(
    (acc, curr) => ({
      cardNumber: acc.cardNumber ?? curr.cardNumber,
      expiryMonth: acc.expiryMonth ?? curr.expiryMonth,
      expiryYear: acc.expiryYear ?? curr.expiryYear,
    }),
    {} as OCRCardResult,
  );
}
