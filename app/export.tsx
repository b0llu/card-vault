/**
 * export.tsx
 *
 * Secure encrypted vault export screen.
 *
 * The user enters an export password. The vault is then:
 *  1. Decrypted using the device master key.
 *  2. Re-encrypted using PBKDF2(password) → AES-256-CBC.
 *  3. Saved as a .securevault file.
 *  4. Shared via the OS share sheet.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { exportVault } from '../src/services/exportService';
import { ThemedButton } from '../src/components/ThemedButton';

export default function ExportScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Export password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }

    setExporting(true);
    try {
      await exportVault(password);
      Alert.alert(
        'Export Successful',
        'Your encrypted vault backup has been shared. Store it in a safe location.',
      );
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      Alert.alert('Export Failed', err.message ?? 'An unexpected error occurred.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container}>
          {/* Info card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>🔒</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Encrypted Export</Text>
              <Text style={styles.infoBody}>
                Your vault will be encrypted with a password you set. Only
                someone with this password can import the backup. Even if the
                file is intercepted, the card data remains secure.
              </Text>
            </View>
          </View>

          {/* How it works */}
          <View style={styles.steps}>
            <Text style={styles.stepsTitle}>How it works</Text>
            <Text style={styles.step}>
              1. Your cards are decrypted locally using the device key.
            </Text>
            <Text style={styles.step}>
              2. A new key is derived from your password using PBKDF2-SHA256
              (100,000 iterations).
            </Text>
            <Text style={styles.step}>
              3. The cards are re-encrypted with AES-256-CBC.
            </Text>
            <Text style={styles.step}>
              4. The encrypted file is saved as{' '}
              <Text style={styles.mono}>.securevault</Text>.
            </Text>
          </View>

          {/* Password fields */}
          <View style={styles.form}>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Export Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.fieldInput, { flex: 1 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 6 characters"
                  placeholderTextColor="#555558"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((s) => !s)}
                  style={styles.showHideBtn}
                >
                  <Text style={styles.showHideText}>
                    {showPassword ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Confirm Password</Text>
              <TextInput
                style={styles.fieldInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter password"
                placeholderTextColor="#555558"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password strength */}
            {password.length > 0 && (
              <PasswordStrength password={password} />
            )}
          </View>

          <ThemedButton
            title="Export Encrypted Backup"
            onPress={handleExport}
            loading={exporting}
            disabled={password.length < 6 || password !== confirmPassword}
          />

          <Text style={styles.warning}>
            ⚠️ If you forget this password, you cannot restore the backup.
            We cannot recover it for you.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Password strength indicator ───────────────────────────────────────────────

function PasswordStrength({ password }: { password: string }) {
  const strength = getStrength(password);
  const color =
    strength === 'Weak' ? '#FF453A' :
    strength === 'Fair' ? '#FF9F0A' :
    '#00C896';

  return (
    <View style={styles.strengthRow}>
      <View style={styles.strengthBar}>
        <View
          style={[
            styles.strengthFill,
            {
              width: strength === 'Weak' ? '33%' : strength === 'Fair' ? '66%' : '100%',
              backgroundColor: color,
            },
          ]}
        />
      </View>
      <Text style={[styles.strengthLabel, { color }]}>{strength}</Text>
    </View>
  );
}

function getStrength(pw: string): 'Weak' | 'Fair' | 'Strong' {
  if (pw.length < 8) return 'Weak';
  const hasUpper = /[A-Z]/.test(pw);
  const hasLower = /[a-z]/.test(pw);
  const hasDigit = /\d/.test(pw);
  const hasSymbol = /[^A-Za-z0-9]/.test(pw);
  const score = [hasUpper, hasLower, hasDigit, hasSymbol].filter(Boolean).length;
  if (score <= 2) return 'Fair';
  return 'Strong';
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0E0E0E',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
    gap: 20,
  },
  infoCard: {
    backgroundColor: '#1C2B26',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: '#00C89633',
  },
  infoIcon: {
    fontSize: 24,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    color: '#00C896',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  infoBody: {
    color: '#8E8E93',
    fontSize: 13,
    lineHeight: 20,
  },
  steps: {
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    padding: 16,
    gap: 8,
  },
  stepsTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  step: {
    color: '#8E8E93',
    fontSize: 13,
    lineHeight: 20,
  },
  mono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#00C896',
  },
  form: {
    gap: 16,
  },
  fieldContainer: {
    gap: 6,
  },
  fieldLabel: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  fieldInput: {
    backgroundColor: '#1C1C1E',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    overflow: 'hidden',
  },
  showHideBtn: {
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  showHideText: {
    color: '#00C896',
    fontSize: 14,
    fontWeight: '600',
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#2C2C2E',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '600',
    width: 48,
    textAlign: 'right',
  },
  warning: {
    color: '#555558',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
