import { CardBrand } from '../types';

export const CARD_BRAND_OPTIONS: CardBrand[] = [
  'visa',
  'mastercard',
  'amex',
  'discover',
  'unionpay',
  'jcb',
  'rupay',
  'custom',
  'unknown',
];

// ─── Brand Detection ──────────────────────────────────────────────────────────

/**
 * Detects the card network from the card number prefix.
 * Uses standard IIN/BIN ranges.
 */
export function detectCardBrand(cardNumber: string): CardBrand {
  const n = cardNumber.replace(/\D/g, '');

  if (/^4/.test(n)) return 'visa';
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return 'mastercard';
  if (/^3[47]/.test(n)) return 'amex';
  if (/^6(?:011|5[0-9]{2})/.test(n)) return 'discover';
  if (/^(?:2131|1800|35(?:2[89]|[3-8][0-9]))/.test(n)) return 'jcb';
  if (/^(?:62|81)/.test(n)) return 'unionpay';
  if (/^(?:508|60(?!11)|6521|6522)/.test(n)) return 'rupay';
  return 'unknown';
}

// ─── Formatting ───────────────────────────────────────────────────────────────

/**
 * Returns masked number. Amex shows "•••• •••••• #####", others "•••• •••• •••• ####".
 */
export function maskCardNumber(cardNumber: string): string {
  const n = cardNumber.replace(/\D/g, '');
  if (/^3[47]/.test(n)) {
    // Amex: 4-6-5
    return `•••• •••••• ${n.slice(10)}`;
  }
  return `•••• •••• •••• ${n.slice(-4)}`;
}

/**
 * Formats a raw digit string using network-appropriate grouping.
 * Amex: "3782 822463 10005"  (4-6-5)
 * Others: "4242 4242 4242 4242"  (4-4-4-4)
 */
export function formatCardNumber(cardNumber: string): string {
  const n = cardNumber.replace(/\D/g, '');
  if (/^3[47]/.test(n)) {
    // Amex 4-6-5
    if (n.length <= 4) return n;
    if (n.length <= 10) return `${n.slice(0, 4)} ${n.slice(4)}`;
    return `${n.slice(0, 4)} ${n.slice(4, 10)} ${n.slice(10)}`;
  }
  const groups = n.match(/.{1,4}/g) ?? [];
  return groups.join(' ');
}

/**
 * Returns "MM/YY" formatted expiry string.
 */
export function formatExpiry(month: string, year: string): string {
  const m = month.padStart(2, '0');
  const y = year.slice(-2);
  return `${m}/${y}`;
}

// ─── Brand Colors / Gradients ─────────────────────────────────────────────────

export function getBrandGradient(brand: CardBrand): [string, string] {
  switch (brand) {
    case 'visa':       return ['#181818', '#2E2E2E'];
    case 'mastercard': return ['#0A0A0A', '#1A1A1A'];
    case 'amex':       return ['#1E1E1E', '#343434'];
    case 'discover':   return ['#141414', '#242424'];
    case 'unionpay':   return ['#0D1E3C', '#1C4F84'];
    case 'jcb':        return ['#0F2F23', '#1C6247'];
    case 'rupay':      return ['#3B200F', '#6B3A19'];
    default:           return ['#161616', '#262626'];
  }
}

export function getBrandAccent(brand: CardBrand): string {
  switch (brand) {
    case 'visa':       return '#FFFFFF';
    case 'mastercard': return '#D0D0D0';
    case 'amex':       return '#E8E8E8';
    case 'discover':   return '#C0C0C0';
    case 'unionpay':   return '#CBE7FF';
    case 'jcb':        return '#D8FFE7';
    case 'rupay':      return '#FFE2C4';
    default:           return '#888888';
  }
}

export function getBrandLabel(brand: CardBrand): string {
  switch (brand) {
    case 'visa':       return 'VISA';
    case 'mastercard': return 'MASTERCARD';
    case 'amex':       return 'AMEX';
    case 'discover':   return 'DISCOVER';
    case 'unionpay':   return 'UNIONPAY';
    case 'jcb':        return 'JCB';
    case 'rupay':      return 'RUPAY';
    case 'custom':     return 'CUSTOM';
    default:           return 'UNKNOWN';
  }
}

export function getBrandDisplayName(
  brand: CardBrand,
  customBrandName?: string,
): string {
  if (brand === 'custom') {
    const custom = customBrandName?.trim();
    return custom && custom.length > 0 ? custom : 'Custom';
  }
  return getBrandLabel(brand);
}

// ─── Validation ───────────────────────────────────────────────────────────────

/** Luhn algorithm check. */
export function isValidCardNumber(cardNumber: string): boolean {
  const n = cardNumber.replace(/\D/g, '');
  if (n.length < 13 || n.length > 19) return false;

  let sum = 0;
  let alternate = false;

  for (let i = n.length - 1; i >= 0; i--) {
    let digit = parseInt(n[i], 10);
    if (alternate) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    alternate = !alternate;
  }

  return sum % 10 === 0;
}

export function isValidExpiry(month: string, year: string): boolean {
  const m = parseInt(month, 10);
  const y = parseInt(year.length === 2 ? `20${year}` : year, 10);
  if (m < 1 || m > 12) return false;

  const now = new Date();
  const expiry = new Date(y, m - 1, 1);
  return expiry >= new Date(now.getFullYear(), now.getMonth(), 1);
}
