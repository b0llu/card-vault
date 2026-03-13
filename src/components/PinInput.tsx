/**
 * PinInput.tsx
 *
 * A custom PIN entry component.
 * Renders dot indicators and a numpad.
 * Supports 4–6 digit PINs.
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', '⌫'],
];

interface PinInputProps {
  maxLength?: number;
  minLength?: number;
  onComplete: (pin: string) => void;
  onError?: () => void;
  disabled?: boolean;
  label?: string;
  errorMessage?: string;
}

export const PinInput: React.FC<PinInputProps> = ({
  maxLength = 6,
  minLength = 4,
  onComplete,
  disabled = false,
  label = 'Enter PIN',
  errorMessage,
}) => {
  const [pin, setPin] = useState('');
  const shakeX = useSharedValue(0);

  const shake = useCallback(() => {
    shakeX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 }),
    );
    Vibration.vibrate(200);
  }, [shakeX]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  // Trigger shake when errorMessage changes to a non-empty value
  React.useEffect(() => {
    if (errorMessage) {
      shake();
      setPin('');
    }
  }, [errorMessage, shake]);

  const handlePress = useCallback(
    (key: string) => {
      if (disabled) return;

      if (key === '⌫') {
        setPin((p) => p.slice(0, -1));
        return;
      }

      if (!key) return;

      const next = pin + key;
      setPin(next);

      if (next.length >= minLength && next.length === maxLength) {
        // Slight delay so last dot animates before callback
        setTimeout(() => {
          onComplete(next);
          setPin('');
        }, 100);
      } else if (next.length === maxLength && minLength === maxLength) {
        setTimeout(() => {
          onComplete(next);
          setPin('');
        }, 100);
      } else if (next.length >= minLength) {
        // For variable length, allow manual submit — handled elsewhere
        // For fixed max length, auto-submit when full
        if (next.length === maxLength) {
          setTimeout(() => {
            onComplete(next);
            setPin('');
          }, 100);
        }
      }
    },
    [disabled, maxLength, minLength, onComplete, pin],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      {/* Dot indicators */}
      <Animated.View style={[styles.dotsRow, shakeStyle]}>
        {Array.from({ length: maxLength }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < pin.length ? styles.dotFilled : styles.dotEmpty,
            ]}
          />
        ))}
      </Animated.View>

      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}

      {/* Numpad */}
      <View style={styles.numpad}>
        {KEYS.map((row, ri) => (
          <View key={ri} style={styles.row}>
            {row.map((key, ki) => (
              <TouchableOpacity
                key={ki}
                style={[styles.key, !key && styles.keyEmpty]}
                onPress={() => handlePress(key)}
                disabled={disabled || !key}
                activeOpacity={0.6}
              >
                <Text
                  style={[
                    styles.keyText,
                    key === '⌫' && styles.backspaceText,
                  ]}
                >
                  {key}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 32,
    letterSpacing: 0.5,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 16,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  dotFilled: {
    backgroundColor: '#00C896',
  },
  dotEmpty: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#3A3A3C',
  },
  errorText: {
    color: '#FF453A',
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  numpad: {
    marginTop: 24,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  key: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyEmpty: {
    backgroundColor: 'transparent',
  },
  keyText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '400',
  },
  backspaceText: {
    fontSize: 20,
  },
});
