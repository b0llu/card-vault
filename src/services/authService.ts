/**
 * authService.ts
 *
 * Manages PIN setup/verification and biometric authentication.
 *
 * PIN is stored as a SHA-256 hash in expo-secure-store so the raw
 * PIN value never persists on disk.
 */

import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import CryptoJS from 'crypto-js';

const PIN_HASH_KEY = 'scv_pin_hash_v1';
const BIOMETRICS_ENABLED_KEY = 'scv_biometrics_enabled_v1';

// ─── PIN ─────────────────────────────────────────────────────────────────────

/** Returns true if a PIN has already been set up. */
export async function hasPin(): Promise<boolean> {
  const hash = await SecureStore.getItemAsync(PIN_HASH_KEY);
  return !!hash;
}

/**
 * Sets a new PIN. Stores only its SHA-256 hash.
 * @param pin  4–6 digit string
 */
export async function setupPin(pin: string): Promise<void> {
  if (!/^\d{4,6}$/.test(pin)) {
    throw new Error('PIN must be 4–6 digits.');
  }
  const hash = CryptoJS.SHA256(pin).toString(CryptoJS.enc.Hex);
  await SecureStore.setItemAsync(PIN_HASH_KEY, hash, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

/**
 * Verifies a PIN attempt against the stored hash.
 * @returns true if correct
 */
export async function verifyPin(pin: string): Promise<boolean> {
  const storedHash = await SecureStore.getItemAsync(PIN_HASH_KEY);
  if (!storedHash) return false;
  const inputHash = CryptoJS.SHA256(pin).toString(CryptoJS.enc.Hex);
  return storedHash === inputHash;
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

/** Returns the biometric type available (face / fingerprint). */
export async function getBiometricType(): Promise<string> {
  const types =
    await LocalAuthentication.supportedAuthenticationTypesAsync();
  if (
    types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
  ) {
    return 'Fingerprint';
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
