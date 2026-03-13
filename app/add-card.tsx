/**
 * add-card.tsx
 *
 * Two-mode screen: manual entry OR OCR scan.
 *
 * Manual: standard form fields with validation.
 * Scan:   VisionCamera live preview → capture photo → MLKit OCR → pre-fill form.
 *
 * Also supports picking an image from the gallery (dev utility / accessibility).
 */

import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import * as ImagePicker from 'expo-image-picker';

import { addCard } from '../src/storage/database';
import { detectCardBrand, isValidExpiry, formatCardNumber } from '../src/utils/cardUtils';
import { parseCardFromOCR } from '../src/utils/ocrParser';
import { ThemedButton } from '../src/components/ThemedButton';

type Mode = 'manual' | 'scan';

const FIELD_PLACEHOLDER_COLOR = '#555558';

export default function AddCardScreen() {
  const router = useRouter();
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const cameraRef = useRef<Camera>(null);

  const [mode, setMode] = useState<Mode>('manual');
  const [scanning, setScanning] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [nickname, setNickname] = useState('');
  const [saving, setSaving] = useState(false);

  const brand = detectCardBrand(cardNumber);

  // ── OCR scanning ──────────────────────────────────────────────────────────

  const handleCapturePhoto = useCallback(async () => {
    if (!cameraRef.current) return;
    setScanning(true);
    try {
      const photo = await cameraRef.current.takePhoto({
        flash: 'off',
      });
      const fileUri = `file://${photo.path}`;
      await processOCR(fileUri);
    } catch (err: any) {
      Alert.alert('Scan Error', err.message ?? 'Could not capture photo.');
    } finally {
      setScanning(false);
      setMode('manual');
    }
  }, []);

  /**
   * DEV UTILITY: Pick image from gallery for OCR testing.
   * Useful when running on simulator or testing without physical card.
   */
  const handlePickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled || !result.assets[0]) return;

    setScanning(true);
    try {
      await processOCR(result.assets[0].uri);
    } finally {
      setScanning(false);
      setMode('manual');
    }
  }, []);

  const processOCR = async (fileUri: string) => {
    try {
      const result = await TextRecognition.recognize(fileUri);
      const parsed = parseCardFromOCR(result.text);

      if (parsed.cardNumber) setCardNumber(parsed.cardNumber);
      if (parsed.expiryMonth) setExpiryMonth(parsed.expiryMonth);
      if (parsed.expiryYear) setExpiryYear(parsed.expiryYear);

      if (!parsed.cardNumber && !parsed.expiryMonth) {
        Alert.alert(
          'No card data detected',
          'Could not extract card details. Please fill in the form manually.',
        );
      }
    } catch (err: any) {
      Alert.alert('OCR Error', 'Could not read the image.');
    }
  };

  const handleSwitchToScan = async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert(
          'Camera Permission Required',
          'Please allow camera access in Settings to scan cards.',
        );
        return;
      }
    }
    setMode('scan');
  };

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    const cleanNumber = cardNumber.replace(/\D/g, '');

    if (!name.trim()) {
      Alert.alert('Validation', 'Please enter the cardholder name.');
      return;
    }
    if (cleanNumber.length < 13) {
      Alert.alert('Validation', 'Please enter a valid card number.');
      return;
    }
    if (!expiryMonth || !expiryYear) {
      Alert.alert('Validation', 'Please enter the card expiry date.');
      return;
    }
    if (!isValidExpiry(expiryMonth, expiryYear)) {
      Alert.alert('Validation', 'The card appears to be expired.');
      return;
    }
    if (!cvv.trim()) {
      Alert.alert('Validation', 'Please enter the CVV.');
      return;
    }

    setSaving(true);
    try {
      await addCard({
        name: name.trim(),
        cardNumber: cleanNumber,
        expiryMonth: expiryMonth.padStart(2, '0'),
        expiryYear: expiryYear.slice(-2),
        cvv: cvv.trim(),
        nickname: nickname.trim(),
        brand: detectCardBrand(cleanNumber),
      });
      router.back();
    } catch (err: any) {
      Alert.alert('Could Not Save', err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Camera view ───────────────────────────────────────────────────────────

  if (mode === 'scan') {
    return (
      <View style={styles.cameraContainer}>
        {device ? (
          <>
            <Camera
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              device={device}
              isActive
              photo
            />
            {/* Overlay guide */}
            <View style={styles.cameraOverlay}>
              <View style={styles.scanFrame} />
              <Text style={styles.scanHint}>
                Align card within the frame
              </Text>
            </View>
            {/* Controls */}
            <View style={styles.cameraControls}>
              <TouchableOpacity
                onPress={() => setMode('manual')}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.captureBtn}
                onPress={handleCapturePhoto}
                disabled={scanning}
              >
                {scanning ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <View style={styles.captureBtnInner} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handlePickImage}
                style={styles.galleryBtn}
              >
                <Text style={styles.galleryBtnText}>Gallery</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.noCameraContainer}>
            <Text style={styles.noCameraText}>No camera available</Text>
            <ThemedButton
              title="Go Back"
              onPress={() => setMode('manual')}
              variant="ghost"
            />
          </View>
        )}
      </View>
    );
  }

  // ── Manual form ───────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
        >
          {/* Scan shortcut */}
          <TouchableOpacity
            style={styles.scanButton}
            onPress={handleSwitchToScan}
          >
            <Text style={styles.scanButtonText}>📷  Scan Card with Camera</Text>
          </TouchableOpacity>

          <Text style={styles.orDivider}>— or enter manually —</Text>

          {/* Brand indicator */}
          {cardNumber.replace(/\D/g, '').length > 0 && (
            <View style={styles.brandRow}>
              <Text style={styles.brandDetected}>
                Detected: {brand.toUpperCase()}
              </Text>
            </View>
          )}

          <Field
            label="Cardholder Name"
            value={name}
            onChangeText={setName}
            placeholder="John Smith"
            autoCapitalize="words"
          />

          <Field
            label="Card Number"
            value={formatCardNumber(cardNumber)}
            onChangeText={(t) => setCardNumber(t.replace(/\D/g, ''))}
            placeholder="4242 4242 4242 4242"
            keyboardType="number-pad"
            maxLength={19}
          />

          <View style={styles.row}>
            <View style={styles.rowField}>
              <Field
                label="Expiry Month"
                value={expiryMonth}
                onChangeText={(t) => setExpiryMonth(t.replace(/\D/g, '').slice(0, 2))}
                placeholder="MM"
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
            <View style={styles.rowField}>
              <Field
                label="Expiry Year"
                value={expiryYear}
                onChangeText={(t) => setExpiryYear(t.replace(/\D/g, '').slice(0, 2))}
                placeholder="YY"
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
            <View style={styles.rowField}>
              <Field
                label="CVV"
                value={cvv}
                onChangeText={(t) => setCvv(t.replace(/\D/g, '').slice(0, 4))}
                placeholder="•••"
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
              />
            </View>
          </View>

          <Field
            label="Nickname (optional)"
            value={nickname}
            onChangeText={setNickname}
            placeholder="Travel Visa, Work Card…"
            autoCapitalize="words"
          />

          <ThemedButton
            title="Save Card"
            onPress={handleSave}
            loading={saving}
            style={styles.saveBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Small form field component ────────────────────────────────────────────────

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad' | 'email-address';
  maxLength?: number;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'words' | 'sentences' | 'characters';
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  maxLength,
  secureTextEntry,
  autoCapitalize,
}: FieldProps) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={FIELD_PLACEHOLDER_COLOR}
        keyboardType={keyboardType}
        maxLength={maxLength}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        spellCheck={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0E0E0E',
  },
  form: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  scanButton: {
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  scanButtonText: {
    color: '#00C896',
    fontSize: 15,
    fontWeight: '600',
  },
  orDivider: {
    color: '#555558',
    fontSize: 13,
    textAlign: 'center',
    marginVertical: -4,
  },
  brandRow: {
    alignItems: 'flex-end',
    marginBottom: -8,
  },
  brandDetected: {
    color: '#00C896',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowField: {
    flex: 1,
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
  saveBtn: {
    marginTop: 8,
  },
  // Camera styles
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 320,
    height: 200,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#00C896',
    backgroundColor: 'transparent',
  },
  scanHint: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 32,
  },
  cancelBtn: {
    padding: 12,
  },
  cancelBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00C896',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  captureBtnInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#E0E0E0',
  },
  galleryBtn: {
    padding: 12,
  },
  galleryBtnText: {
    color: '#00C896',
    fontSize: 16,
    fontWeight: '500',
  },
  noCameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  noCameraText: {
    color: '#8E8E93',
    fontSize: 16,
  },
});
