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
    body: 'Every card is encrypted before it is written to storage. AES-256 is the same standard used by banks and governments worldwide — considered unbreakable with current technology.',
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
    title: 'Fingerprint & PIN Protection',
    body: 'The vault can require your PIN and optional fingerprint unlock, and it auto-locks after time in the background.',
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
            <Text style={styles.title}>Your cards, locked tight.</Text>
            <Text style={styles.subtitle}>
              Bank-grade encryption, no internet connection, no servers — just your cards on your device and nothing else.
            </Text>
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
});
