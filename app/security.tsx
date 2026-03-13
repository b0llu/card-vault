import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBackground } from '../src/components/AppBackground';
import { theme } from '../src/theme';

const SECURITY_POINTS = [
  {
    icon: '🔐',
    title: 'AES-256 Encryption',
    body: 'Every card is encrypted before it is written to storage, so the database never contains readable card details.',
  },
  {
    icon: '🔑',
    title: 'Hardware-Backed Key Storage',
    body: 'The encryption key is protected by Android Keystore or the iOS Secure Enclave when the device supports it.',
  },
  {
    icon: '📴',
    title: 'Fully Offline',
    body: 'There are no network requests, analytics calls, or background sync jobs. Your data never leaves the device.',
  },
  {
    icon: '🙈',
    title: 'Zero Knowledge',
    body: 'There is no backend and no recovery service. Only you can access the data stored in the vault.',
  },
  {
    icon: '🧬',
    title: 'Biometric & PIN Protection',
    body: 'The vault can require your PIN and optional biometrics, and it auto-locks after time in the background.',
  },
  {
    icon: '📋',
    title: 'Clipboard Auto-Clear',
    body: 'Copied card values are cleared from the clipboard automatically after a short delay to reduce accidental exposure.',
  },
  {
    icon: '🖼',
    title: 'Screenshot Protection',
    body: 'Android uses secure window flags to block screenshots and screen recordings when the app is open.',
  },
  {
    icon: '💾',
    title: 'Encrypted Backup Files',
    body: 'Exports are protected with a password-derived key so the shared backup file stays encrypted outside the app too.',
  },
];

export default function SecurityScreen() {
  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={styles.heroBadge}>
              <Feather name="shield" size={26} color={theme.colors.primary} />
            </View>
            <Text style={styles.eyebrow}>Security overview</Text>
            <Text style={styles.title}>Built to stay local.</Text>
            <Text style={styles.subtitle}>
              The app is designed around a simple rule: card data should stay
              encrypted, on-device, and under your control.
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <SecurityChip label="No cloud sync" />
            <SecurityChip label="No analytics" />
            <SecurityChip label="Device-only keys" />
          </View>

          {SECURITY_POINTS.map((point) => (
            <View key={point.title} style={styles.pointCard}>
              <View style={styles.pointIconWrap}>
                <Text style={styles.pointIcon}>{point.icon}</Text>
              </View>
              <View style={styles.pointCopy}>
                <Text style={styles.pointTitle}>{point.title}</Text>
                <Text style={styles.pointBody}>{point.body}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

function SecurityChip({ label }: { label: string }) {
  return (
    <View style={styles.securityChip}>
      <Text style={styles.securityChipText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
    gap: 14,
  },
  hero: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  heroBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    color: theme.colors.text,
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 330,
  },
  summaryCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    paddingBottom: 6,
  },
  securityChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  securityChipText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  pointCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 18,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  pointIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointIcon: {
    fontSize: 20,
  },
  pointCopy: {
    flex: 1,
    gap: 4,
  },
  pointTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  pointBody: {
    color: theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  bottomNote: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    paddingTop: 8,
  },
  bottomNoteText: {
    flex: 1,
    color: theme.colors.textSubtle,
    fontSize: 12,
    lineHeight: 18,
  },
});
