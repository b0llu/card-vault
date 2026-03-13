/**
 * _layout.tsx — Root layout
 *
 * Initialises the SQLite database, provides the auth context, and
 * handles navigation based on auth state.
 */

import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { usePreventScreenCapture } from 'expo-screen-capture';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { theme } from '../src/theme';

// ─── Navigation guard ─────────────────────────────────────────────────────────

function NavigationGuard({ children }: { children: React.ReactNode }) {
  usePreventScreenCapture();
  const { isUnlocked, pinExists } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Route guard: redirect based on auth state
  useEffect(() => {
    if (pinExists === null) return;

    const inAuthFlow =
      segments[0] === 'unlock' || segments[0] === 'setup-pin';

    if (!pinExists) {
      // First launch — must create a PIN
      if (!inAuthFlow) router.replace('/setup-pin');
    } else if (!isUnlocked) {
      // PIN exists but vault is locked
      if (!inAuthFlow) router.replace('/unlock');
    } else {
      // Unlocked — send to home if on an auth screen
      if (inAuthFlow) router.replace('/home');
    }
  }, [pinExists, isUnlocked, segments, router]);

  if (pinExists === null) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  return <>{children}</>;
}

// ─── Root layout ──────────────────────────────────────────────────────────────

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AuthProvider>
          <NavigationGuard>
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: theme.colors.backgroundAlt },
                headerTintColor: theme.colors.text,
                headerTitleStyle: { fontWeight: '700' },
                headerShadowVisible: false,
                contentStyle: { backgroundColor: theme.colors.background },
                animation: 'slide_from_right',
              }}
            >
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen
                name="setup-pin"
                options={{ title: 'Create PIN', headerShown: false }}
              />
              <Stack.Screen
                name="unlock"
                options={{ title: 'Unlock Vault', headerShown: false }}
              />
              <Stack.Screen
                name="home"
                options={{ title: 'Card Vault', headerShown: false }}
              />
              <Stack.Screen
                name="add-card"
                options={{
                  title: 'Add Card',
                  headerBackTitle: 'Back',
                  contentStyle: { backgroundColor: theme.colors.background },
                }}
              />
              <Stack.Screen
                name="card/[id]"
                options={{ title: 'Card Details', headerBackTitle: 'Back' }}
              />
              <Stack.Screen
                name="security"
                options={{
                  title: 'Security & Privacy',
                  headerBackTitle: 'Back',
                }}
              />
              <Stack.Screen
                name="settings"
                options={{
                  title: 'Settings',
                  headerBackTitle: 'Back',
                }}
              />
              <Stack.Screen
                name="reset-pin"
                options={{
                  title: 'Reset PIN',
                  headerBackTitle: 'Back',
                }}
              />
              <Stack.Screen
                name="export"
                options={{ title: 'Export Backup', headerBackTitle: 'Back' }}
              />
              <Stack.Screen
                name="import"
                options={{ title: 'Import Backup', headerBackTitle: 'Back' }}
              />
            </Stack>
          </NavigationGuard>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
