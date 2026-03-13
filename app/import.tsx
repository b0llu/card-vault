/**
 * import.tsx
 *
 * Secure vault import screen.
 *
 * Flow:
 *  1. User selects a .securevault file via document picker.
 *  2. User enters the password used when exporting.
 *  3. File is decrypted and parsed.
 *  4. Cards are imported (up to free tier limit of 3).
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';

import { decryptVaultFile, VAULT_FILE_EXTENSION } from '../src/services/exportService';
import { importCards, getCardCount, clearAllCards } from '../src/storage/database';
import { ThemedButton } from '../src/components/ThemedButton';

const FREE_LIMIT = 3;

export default function ImportScreen() {
  const router = useRouter();
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [importing, setImporting] = useState(false);

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', // Allow all files so user can select .securevault
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const asset = result.assets[0];

      // Validate extension
      if (
        !asset.name.endsWith(VAULT_FILE_EXTENSION) &&
        !asset.name.endsWith('.json') // allow .json for testing
      ) {
        Alert.alert(
          'Invalid File',
          `Please select a ${VAULT_FILE_EXTENSION} backup file created by Secure Card Vault.`,
        );
        return;
      }

      setFileUri(asset.uri);
      setFileName(asset.name);
    } catch (err: any) {
      Alert.alert('File Picker Error', err.message);
    }
  };

  const handleImport = async () => {
    if (!fileUri) {
      Alert.alert('No File Selected', 'Please select a backup file first.');
      return;
    }
    if (!password) {
      Alert.alert('Password Required', 'Please enter the export password.');
      return;
    }

    setImporting(true);
    try {
      // 1. Decrypt the vault file
      const cards = await decryptVaultFile(fileUri, password);

      const existingCount = await getCardCount();
      const availableSlots = FREE_LIMIT - existingCount;

      if (availableSlots === 0) {
        Alert.alert(
          'Card Limit Reached',
          `Free version supports up to ${FREE_LIMIT} cards. Please delete some cards before importing.`,
        );
        return;
      }

      // 2. Confirm if replacing or merging
      Alert.alert(
        'Import Options',
        `Found ${cards.length} card(s) in the backup.\n\nYou currently have ${existingCount} card(s). You can import up to ${availableSlots} more.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Replace All',
            style: 'destructive',
            onPress: async () => {
              await clearAllCards();
              const imported = await importCards(cards.slice(0, FREE_LIMIT));
              Alert.alert(
                'Import Complete',
                `${imported} card(s) imported successfully.`,
                [{ text: 'Done', onPress: () => router.replace('/home') }],
              );
            },
          },
          {
            text: `Add (up to ${availableSlots})`,
            onPress: async () => {
              const imported = await importCards(
                cards.slice(0, availableSlots),
              );
              Alert.alert(
                'Import Complete',
                `${imported} card(s) imported successfully.`,
                [{ text: 'Done', onPress: () => router.replace('/home') }],
              );
            },
          },
        ],
      );
    } catch (err: any) {
      Alert.alert('Import Failed', err.message ?? 'Could not import the backup.');
    } finally {
      setImporting(false);
      setPassword('');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container}>
          {/* Info banner */}
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>📥</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Import Backup</Text>
              <Text style={styles.infoBody}>
                Select a <Text style={styles.mono}>.securevault</Text> file created
                by this app and enter the password used when exporting.
              </Text>
            </View>
          </View>

          {/* File picker */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Select Backup File</Text>
            <TouchableOpacity
              style={[styles.filePicker, fileUri && styles.filePickerSelected]}
              onPress={handlePickFile}
            >
              {fileUri ? (
                <>
                  <Text style={styles.filePickerIcon}>✅</Text>
                  <Text style={styles.filePickerName} numberOfLines={1}>
                    {fileName}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.filePickerIcon}>📄</Text>
                  <Text style={styles.filePickerText}>
                    Tap to select .securevault file
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Password */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Enter Export Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.fieldInput, { flex: 1 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="Password used when exporting"
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

          {/* Import button */}
          <ThemedButton
            title="Decrypt & Import"
            onPress={handleImport}
            loading={importing}
            disabled={!fileUri || !password}
          />

          {/* Security note */}
          <View style={styles.securityNote}>
            <Text style={styles.securityNoteTitle}>🔐 Security Note</Text>
            <Text style={styles.securityNoteText}>
              Decryption happens entirely on your device. Your password and
              card data are never transmitted anywhere.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
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
  mono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#00C896',
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  filePicker: {
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: '#2C2C2E',
    borderStyle: 'dashed',
  },
  filePickerSelected: {
    borderStyle: 'solid',
    borderColor: '#00C896',
    backgroundColor: '#1C2B26',
  },
  filePickerIcon: {
    fontSize: 24,
  },
  filePickerText: {
    color: '#8E8E93',
    fontSize: 14,
    flex: 1,
  },
  filePickerName: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
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
  fieldInput: {
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: '#FFFFFF',
    fontSize: 16,
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
  securityNote: {
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    padding: 16,
    gap: 6,
  },
  securityNoteTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  securityNoteText: {
    color: '#8E8E93',
    fontSize: 13,
    lineHeight: 20,
  },
});
