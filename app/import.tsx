import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBackground } from '../src/components/AppBackground';
import { ThemedButton } from '../src/components/ThemedButton';
import {
  decryptVaultFile,
  VAULT_FILE_EXTENSION,
} from '../src/services/exportService';
import {
  clearAllCards,
  getCardCount,
  importCards,
} from '../src/storage/database';
import { theme } from '../src/theme';

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
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const asset = result.assets[0];

      if (
        !asset.name.endsWith(VAULT_FILE_EXTENSION) &&
        !asset.name.endsWith('.json')
      ) {
        Alert.alert(
          'Invalid File',
          `Please select a ${VAULT_FILE_EXTENSION} backup file created by this app.`,
        );
        return;
      }

      setFileUri(asset.uri);
      setFileName(asset.name);
    } catch (err: any) {
      Alert.alert('File Picker Error', err.message);
    }
  };

  const completeImport = async (
    mode: 'replace' | 'merge',
    cards: Awaited<ReturnType<typeof decryptVaultFile>>,
    availableSlots: number,
  ) => {
    if (mode === 'replace') {
      await clearAllCards();
      const imported = await importCards(cards.slice(0, FREE_LIMIT));
      setPassword('');
      Alert.alert('Import Complete', `${imported} card(s) imported successfully.`, [
        { text: 'Done', onPress: () => router.replace('/home') },
      ]);
      return;
    }

    const imported = await importCards(cards.slice(0, availableSlots));
    setPassword('');
    Alert.alert('Import Complete', `${imported} card(s) imported successfully.`, [
      { text: 'Done', onPress: () => router.replace('/home') },
    ]);
  };

  const handleImport = async () => {
    if (!fileUri) {
      Alert.alert('No File Selected', 'Please choose a backup file first.');
      return;
    }

    if (!password) {
      Alert.alert('Password Required', 'Please enter the export password.');
      return;
    }

    setImporting(true);
    try {
      const cards = await decryptVaultFile(fileUri, password);
      const existingCount = await getCardCount();
      const availableSlots = FREE_LIMIT - existingCount;

      if (availableSlots === 0) {
        Alert.alert(
          'Card Limit Reached',
          `Free version supports up to ${FREE_LIMIT} cards. Delete a card before importing.`,
        );
        return;
      }

      Alert.alert(
        'Choose Import Mode',
        `This backup contains ${cards.length} card(s). You currently have ${existingCount} card(s) stored.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Replace All',
            style: 'destructive',
            onPress: async () => {
              try {
                await completeImport('replace', cards, availableSlots);
              } finally {
                setImporting(false);
              }
            },
          },
          {
            text: `Add up to ${availableSlots}`,
            onPress: async () => {
              try {
                await completeImport('merge', cards, availableSlots);
              } finally {
                setImporting(false);
              }
            },
          },
        ],
      );
    } catch (err: any) {
      Alert.alert(
        'Import Failed',
        err.message ?? 'Could not import the backup.',
      );
      setImporting(false);
      return;
    }

    setImporting(false);
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.heroCard}>
              <View style={styles.heroIcon}>
                <Feather
                  name="download"
                  size={20}
                  color={theme.colors.primary}
                />
              </View>
              <View style={styles.heroCopy}>
                <Text style={styles.heroEyebrow}>Restore</Text>
                <Text style={styles.heroTitle}>Import a backup</Text>
                <Text style={styles.heroText}>
                  Pick a previously exported file and unlock it with the same
                  password you used during export.
                </Text>
              </View>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.fieldLabel}>Step 1</Text>
              <TouchableOpacity
                style={[styles.filePicker, fileUri ? styles.filePickerSelected : null]}
                onPress={handlePickFile}
                activeOpacity={0.84}
              >
                <View style={styles.fileIconWrap}>
                  <Feather
                    name={fileUri ? 'check' : 'file-text'}
                    size={18}
                    color={theme.colors.primary}
                  />
                </View>
                <View style={styles.fileCopy}>
                  <Text style={styles.fileTitle}>
                    {fileUri ? 'Backup selected' : 'Choose .securevault file'}
                  </Text>
                  <Text style={styles.fileSubtitle} numberOfLines={1}>
                    {fileName || 'Tap to browse for an encrypted backup file.'}
                  </Text>
                </View>
              </TouchableOpacity>

              <Text style={styles.fieldLabel}>Step 2</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, styles.inputNoBorder]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password used when exporting"
                  placeholderTextColor={theme.colors.textSubtle}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((value) => !value)}
                  style={styles.showHideButton}
                >
                  <Text style={styles.showHideText}>
                    {showPassword ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <ThemedButton
              title="Decrypt & Import"
              onPress={handleImport}
              loading={importing}
              disabled={!fileUri || !password}
              icon={
                <Feather
                  name="download"
                  size={18}
                  color={theme.colors.primaryInk}
                />
              }
            />

            <View style={styles.noteCard}>
              <Feather
                name="shield"
                size={16}
                color={theme.colors.primary}
              />
              <Text style={styles.noteText}>
                Import happens entirely on-device. The password and card data are
                never sent anywhere.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
    gap: 18,
  },
  heroCard: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    padding: 20,
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  heroIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: {
    flex: 1,
    gap: 4,
  },
  heroEyebrow: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  heroText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  formCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 18,
    gap: 12,
  },
  fieldLabel: {
    color: theme.colors.textSubtle,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  filePicker: {
    backgroundColor: theme.colors.backgroundAlt,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  filePickerSelected: {
    borderColor: 'rgba(141, 201, 185, 0.28)',
    backgroundColor: theme.colors.primarySoft,
  },
  fileIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileCopy: {
    flex: 1,
    gap: 2,
  },
  fileTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  fileSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  input: {
    backgroundColor: theme.colors.backgroundAlt,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: theme.colors.text,
    fontSize: 16,
  },
  inputNoBorder: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingVertical: 0,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundAlt,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    paddingLeft: 14,
  },
  showHideButton: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  showHideText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  noteCard: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
  },
  noteText: {
    flex: 1,
    color: theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
});
