/**
 * CardView.tsx
 *
 * Visual credit card component with gradient background.
 * Shows masked number, cardholder name, expiry, and optionally CVV.
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Card } from '../types';
import {
  maskCardNumber,
  formatExpiry,
  getBrandGradient,
  getBrandAccent,
  getBrandLabel,
} from '../utils/cardUtils';

const CARD_WIDTH = Dimensions.get('window').width - 48;
const CARD_HEIGHT = CARD_WIDTH * 0.6;

interface CardViewProps {
  card: Card;
  showCVV?: boolean;
}

export const CardView: React.FC<CardViewProps> = ({
  card,
  showCVV = false,
}) => {
  const gradient = getBrandGradient(card.brand);
  const accent = getBrandAccent(card.brand);
  const brandLabel = getBrandLabel(card.brand);

  const cvvStyle = useAnimatedStyle(() => ({
    opacity: withTiming(showCVV ? 1 : 0, {
      duration: 300,
      easing: Easing.out(Easing.ease),
    }),
  }));

  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1.2 }}
      style={[styles.card, { width: CARD_WIDTH, height: CARD_HEIGHT }]}
    >
      {/* Header row */}
      <View style={styles.header}>
        <Text style={[styles.nickname, { color: accent }]}>
          {card.nickname || 'My Card'}
        </Text>
        <Text style={[styles.brandLabel, { color: accent }]}>
          {brandLabel}
        </Text>
      </View>

      {/* EMV Chip */}
      <View style={styles.chipRow}>
        <View style={styles.chip}>
          <View style={styles.chipLine} />
          <View style={styles.chipLine} />
          <View style={styles.chipLine} />
        </View>
      </View>

      {/* Card number */}
      <Text style={styles.cardNumber}>{maskCardNumber(card.cardNumber)}</Text>

      {/* Footer row */}
      <View style={styles.footer}>
        <View style={styles.footerCol}>
          <Text style={styles.footerLabel}>CARD HOLDER</Text>
          <Text style={styles.footerValue} numberOfLines={1}>
            {card.name || '—'}
          </Text>
        </View>

        <View style={styles.footerCol}>
          <Text style={styles.footerLabel}>EXPIRES</Text>
          <Text style={styles.footerValue}>
            {formatExpiry(card.expiryMonth, card.expiryYear)}
          </Text>
        </View>

        {showCVV && (
          <Animated.View style={[styles.footerCol, cvvStyle]}>
            <Text style={styles.footerLabel}>CVV</Text>
            <Text style={styles.footerValue}>{card.cvv}</Text>
          </Animated.View>
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 24,
    justifyContent: 'space-between',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nickname: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    opacity: 0.9,
  },
  brandLabel: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  chipRow: {
    marginTop: 8,
  },
  chip: {
    width: 36,
    height: 28,
    backgroundColor: '#D4AF37',
    borderRadius: 5,
    justifyContent: 'space-evenly',
    paddingVertical: 4,
    paddingHorizontal: 4,
    overflow: 'hidden',
  },
  chipLine: {
    height: 1.5,
    backgroundColor: 'rgba(0,0,0,0.3)',
    marginHorizontal: 2,
  },
  cardNumber: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: 3,
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  footerCol: {
    flex: 1,
    marginRight: 8,
  },
  footerLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 2,
  },
  footerValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
