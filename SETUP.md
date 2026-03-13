# Secure Card Vault — Setup & Running Guide

## Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- EAS CLI (for production builds)
- Android Studio + Android SDK (for Android)
- Xcode 15+ (for iOS)
- A physical Android or iOS device (camera/biometrics require real hardware)

---

## 1. Install Dependencies

```bash
cd secure-card-vault
npm install
```

---

## 2. Configure EAS (for builds)

```bash
npm install -g eas-cli
eas login
eas init --id <your-project-id>
```

Or skip EAS for local development and just use `expo run:android`.

---

## 3. Run Prebuild (generates native android/ and ios/ folders)

This is **required** because the project uses native modules
(VisionCamera, MLKit, expo-sqlite, expo-local-authentication):

```bash
npx expo prebuild --clean
```

> Tip: Re-run this any time you change `app.config.ts` or add/remove plugins.

---

## 4. Run on Android (USB debugging)

### Enable USB Debugging on your Android phone:
1. Go to **Settings → About Phone**
2. Tap **Build Number** 7 times to unlock Developer Options
3. Go to **Settings → Developer Options → USB Debugging** → Enable

### Connect and run:
```bash
# Connect phone via USB, then:
adb devices           # Should show your device
npx expo run:android  # Builds and installs debug APK
```

---

## 5. Run on iOS (Simulator or Device)

```bash
npx expo run:ios
# For a specific simulator:
npx expo run:ios --simulator "iPhone 15 Pro"
```

> Note: Camera and biometrics DO NOT work in simulator.
> Use a physical device for full testing.

---

## 6. Testing Camera OCR on Real Device

1. Run `npx expo run:android` or `npx expo run:ios`
2. Grant camera permission when prompted
3. Tap **+ Add Card** → **Scan Card with Camera**
4. Point camera at a physical credit card
5. Tap the white capture button
6. OCR results pre-fill the form — verify and save

### Testing OCR without a physical card:
- On the camera screen, tap **Gallery**
- Select any image of a card (even a screenshot)
- OCR will process the image

---

## 7. EAS Production Build

### Android APK (for direct install):
```bash
eas build --platform android --profile preview
# Downloads an .apk file — install via adb or share directly
```

### Android App Bundle (for Play Store):
```bash
eas build --platform android --profile production
```

### iOS (App Store / TestFlight):
```bash
eas build --platform ios --profile production
```

### Install APK on device:
```bash
adb install path/to/your.apk
# Or open the EAS build URL on your Android device
```

---

## Project Structure

```
secure-card-vault/
├── app/                        # Expo Router screens
│   ├── _layout.tsx             # Root layout + auth guard
│   ├── index.tsx               # Entry redirect
│   ├── setup-pin.tsx           # First-launch PIN creation
│   ├── unlock.tsx              # PIN / biometric unlock
│   ├── home.tsx                # Card list
│   ├── add-card.tsx            # Manual entry + OCR scan
│   ├── card/[id].tsx           # Card detail + copy + delete
│   ├── security.tsx            # Security & Privacy screen
│   ├── export.tsx              # Encrypted vault export
│   └── import.tsx              # Encrypted vault import
│
├── src/
│   ├── components/
│   │   ├── CardView.tsx        # Visual credit card UI
│   │   ├── PinInput.tsx        # PIN entry numpad
│   │   └── ThemedButton.tsx    # Reusable button
│   ├── context/
│   │   └── AuthContext.tsx     # Auth state + auto-lock
│   ├── crypto/
│   │   └── encryption.ts       # AES-256-CBC encrypt/decrypt
│   ├── services/
│   │   ├── authService.ts      # PIN hash + biometrics
│   │   └── exportService.ts    # PBKDF2 export/import
│   ├── storage/
│   │   └── database.ts         # SQLite CRUD operations
│   ├── types/
│   │   └── index.ts            # TypeScript types
│   └── utils/
│       ├── cardUtils.ts        # Brand detection, masking, validation
│       └── ocrParser.ts        # OCR text → card fields
│
├── plugins/
│   └── withAndroidSecureFlag.ts  # Android FLAG_SECURE plugin
│
├── app.config.ts               # Expo config + plugins
├── babel.config.js
├── eas.json
├── metro.config.js
├── package.json
└── tsconfig.json
```

---

## Key Technical Decisions

### Encryption Architecture

```
Card Data (JSON)
       │
       ▼
  AES-256-CBC encrypt
  (random IV per call)
       │
  Master Key (256-bit)
  Stored in Secure Hardware
  (Android Keystore / iOS Secure Enclave)
       │
       ▼
  Encrypted Blob stored in SQLite
  Format: <hex_IV>:<base64_ciphertext>
```

### Export Encryption Architecture

```
Card Data (plaintext)
       │
       ▼
  PBKDF2-SHA256
  (user password + random salt, 100,000 iterations)
       │
  Derived AES-256 Key (separate from master key)
       │
       ▼
  AES-256-CBC encrypt
       │
       ▼
  .securevault file:
  { encryptedVault, salt, iv, version }
```

### OCR Parsing

```
Camera frame → takePhoto() → file path
       │
       ▼
  @react-native-ml-kit/text-recognition
       │
  Raw OCR text
       │
  Card number regex: \b(\d[ -]*){13,19}\b
  Expiry regex:      (0[1-9]|1[0-2])[\/\-]([0-9]{2,4})
       │
       ▼
  Pre-filled form fields (user can correct)
```

### Security Features Summary

| Feature | Implementation |
|---|---|
| AES-256 encryption | crypto-js AES-CBC |
| Key storage | expo-secure-store (hardware-backed) |
| PIN storage | SHA-256 hash in SecureStore |
| Biometric auth | expo-local-authentication |
| Auto-lock | AppState + 30s timer in AuthContext |
| Screenshot prevention | FLAG_SECURE (Android config plugin) |
| Clipboard auto-clear | setTimeout 20s after copy |
| Export key derivation | PBKDF2-SHA256, 100k iterations |
| Offline-only | No network code anywhere |

---

## Troubleshooting

### "Camera permission denied"
- Go to **Settings → Apps → Secure Card Vault → Permissions → Camera**

### "expo-sqlite not found"
- Run `npx expo prebuild --clean` again

### "Biometrics not working"
- Ensure the device has enrolled Face ID / fingerprint
- Biometrics require a real device, not simulator

### Build fails with MLKit error
- Ensure `google-services.json` is NOT required — MLKit text recognition
  works without Firebase in this setup via the standalone ML Kit SDK

### OCR misses card number
- Try better lighting
- Hold camera steady and let autofocus lock
- Use the Gallery button to test with a saved image
