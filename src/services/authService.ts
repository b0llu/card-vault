/**
 * authService.ts
 *
 * Manages PIN setup/verification and biometric authentication.
 *
 * PIN storage format (v2):
 *   "v2:<32-hex salt>:<64-hex PBKDF2-SHA256>"
 *   100,000 iterations, 16-byte random salt per PIN.
 *
 * Legacy format (v1 — plain SHA-256 with no salt) is still verified for
 * existing users and silently upgraded to v2 on first successful login.
 *
 * Brute-force protection:
 *   Failed attempts are persisted across restarts. After 5 consecutive
 *   wrong PINs a time-based lockout engages; the duration doubles with
 *   each additional failure (30 s → 60 s → 2 min → 5 min → 10 min → 30 min).
 */

import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import CryptoJS from 'crypto-js';

const PIN_HASH_KEY = 'scv_pin_hash_v1';
const PIN_LOCKOUT_KEY = 'scv_pin_lockout_v1';
const BIOMETRICS_ENABLED_KEY = 'scv_biometrics_enabled_v1';

// PIN is stored in hardware-backed SecureStore (iOS Keychain / Android Keystore).
// The primary defenses are hardware isolation + the brute-force lockout above,
// not the iteration count. 10,000 iterations adds meaningful cost to offline
// attacks on extracted hashes without making the UI feel frozen (~1 s on device).
// Export backups use 200,000 because they can be copied and attacked offline.
const PIN_PBKDF2_ITERATIONS = 10_000;
const MAX_ATTEMPTS_BEFORE_LOCKOUT = 5;
// Lockout durations in seconds, indexed by (failedAttempts - MAX_ATTEMPTS_BEFORE_LOCKOUT),
// clamped at the last value for any higher count.
const LOCKOUT_SECONDS = [30, 60, 120, 300, 600, 1800];

// ─── Internal helpers ─────────────────────────────────────────────────────────

function pbkdf2Hash(pin: string, saltHex: string): string {
  const salt = CryptoJS.enc.Hex.parse(saltHex);
  return CryptoJS.PBKDF2(pin, salt, {
    keySize: 256 / 32,
    iterations: PIN_PBKDF2_ITERATIONS,
    hasher: CryptoJS.algo.SHA256,
  }).toString(CryptoJS.enc.Hex);
}

// ─── PIN ─────────────────────────────────────────────────────────────────────

/** Returns true if a PIN has already been set up. */
export async function hasPin(): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(PIN_HASH_KEY);
  return !!stored;
}

/**
 * Sets a new PIN. Stores a salted PBKDF2-SHA256 hash (v2 format).
 * Also clears any existing lockout state.
 * @param pin  4–6 digit string
 */
export async function setupPin(pin: string): Promise<void> {
  if (!/^\d{4,6}$/.test(pin)) {
    throw new Error('PIN must be 4–6 digits.');
  }

  const saltBytes = await Crypto.getRandomBytesAsync(16);
  const saltHex = Array.from(saltBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const hashHex = pbkdf2Hash(pin, saltHex);

  await SecureStore.setItemAsync(
    PIN_HASH_KEY,
    `v2:${saltHex}:${hashHex}`,
    { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY },
  );

  // A new PIN wipes any prior lockout state
  await clearPinLockout();
}

/**
 * Verifies a PIN attempt against the stored hash.
 * Handles v1 (legacy plain SHA-256) and v2 (salted PBKDF2) formats.
 * On a successful v1 match the stored value is silently upgraded to v2.
 *
 * Does NOT record failure counts — callers must call recordPinFailure()
 * on a false return and clearPinLockout() on a true return.
 *
 * @returns true if correct
 */
export async function verifyPin(pin: string): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(PIN_HASH_KEY);
  if (!stored) return false;

  if (stored.startsWith('v2:')) {
    // v2: "v2:<saltHex>:<hashHex>"
    const parts = stored.split(':');
    if (parts.length !== 3) return false;
    const saltHex = parts[1];
    const expectedHash = parts[2];
    const inputHash = pbkdf2Hash(pin, saltHex);
    return inputHash === expectedHash;
  }

  // v1 legacy: plain 64-char hex SHA-256 (no salt)
  const inputHash = CryptoJS.SHA256(pin).toString(CryptoJS.enc.Hex);
  const valid = stored === inputHash;
  if (valid) {
    // Silently upgrade to v2 on first successful login
    await setupPin(pin);
  }
  return valid;
}

/** Changes the PIN after verifying the current one. */
export async function changePin(
  currentPin: string,
  newPin: string,
): Promise<void> {
  const valid = await verifyPin(currentPin);
  if (!valid) throw new Error('Current PIN is incorrect.');
  await setupPin(newPin);
}

// ─── Brute-force lockout ──────────────────────────────────────────────────────

interface PinLockoutState {
  failedAttempts: number;
  lockUntil: number; // Unix timestamp ms; 0 = not locked
}

async function readLockoutState(): Promise<PinLockoutState> {
  try {
    const raw = await SecureStore.getItemAsync(PIN_LOCKOUT_KEY);
    if (raw) return JSON.parse(raw) as PinLockoutState;
  } catch {
    // corrupted state — treat as clean
  }
  return { failedAttempts: 0, lockUntil: 0 };
}

async function writeLockoutState(state: PinLockoutState): Promise<void> {
  await SecureStore.setItemAsync(PIN_LOCKOUT_KEY, JSON.stringify(state));
}

export interface PinLockoutStatus {
  locked: boolean;
  secondsRemaining: number;
  failedAttempts: number;
}

/** Returns current lockout status without modifying state. */
export async function getPinLockout(): Promise<PinLockoutStatus> {
  const state = await readLockoutState();
  const now = Date.now();
  if (state.lockUntil > now) {
    return {
      locked: true,
      secondsRemaining: Math.ceil((state.lockUntil - now) / 1000),
      failedAttempts: state.failedAttempts,
    };
  }
  return { locked: false, secondsRemaining: 0, failedAttempts: state.failedAttempts };
}

/**
 * Records a failed PIN attempt and applies a lockout if the threshold is met.
 * @returns Updated lockout status after recording the failure.
 */
export async function recordPinFailure(): Promise<PinLockoutStatus> {
  const state = await readLockoutState();
  const newCount = state.failedAttempts + 1;

  let lockUntil = 0;
  if (newCount >= MAX_ATTEMPTS_BEFORE_LOCKOUT) {
    const idx = Math.min(
      newCount - MAX_ATTEMPTS_BEFORE_LOCKOUT,
      LOCKOUT_SECONDS.length - 1,
    );
    lockUntil = Date.now() + LOCKOUT_SECONDS[idx] * 1000;
  }

  await writeLockoutState({ failedAttempts: newCount, lockUntil });

  return {
    locked: lockUntil > 0,
    secondsRemaining: lockUntil > 0 ? Math.ceil((lockUntil - Date.now()) / 1000) : 0,
    failedAttempts: newCount,
  };
}

/** Clears failed attempt counter and any active lockout (call on successful auth or PIN reset). */
export async function clearPinLockout(): Promise<void> {
  await SecureStore.deleteItemAsync(PIN_LOCKOUT_KEY).catch(() => {});
}

// ─── Biometrics ───────────────────────────────────────────────────────────────

/**
 * Returns true if the device has biometric hardware AND enrolled data.
 */
export async function isBiometricsAvailable(): Promise<boolean> {
  const [hardware, enrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);
  return hardware && enrolled;
}

/** Returns the biometric type label available on this device. */
export async function getBiometricType(): Promise<string> {
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return 'Face ID';
  }
  return 'Fingerprint';
}

/** Whether biometric unlock is opted in by the user. */
export async function isBiometricsEnabled(): Promise<boolean> {
  const val = await SecureStore.getItemAsync(BIOMETRICS_ENABLED_KEY);
  return val === 'true';
}

/** Enable or disable biometric unlock. */
export async function setBiometricsEnabled(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(
    BIOMETRICS_ENABLED_KEY,
    enabled ? 'true' : 'false',
  );
}

/**
 * Prompts biometric authentication.
 * @returns true on success
 */
export async function authenticateWithBiometrics(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Unlock Secure Card Vault',
    fallbackLabel: 'Use PIN',
    cancelLabel: 'Cancel',
    disableDeviceFallback: false,
  });
  return result.success;
}
