import React, { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import type { CardBrand } from '../types';
import {
  CARD_BRAND_OPTIONS,
  getBrandDisplayName,
} from '../utils/cardUtils';
import { theme } from '../theme';

interface CardBrandPickerProps {
  value: CardBrand;
  customBrandName?: string;
  detectedBrand?: CardBrand;
  onChange: (brand: CardBrand) => void;
  onChangeCustomBrandName: (name: string) => void;
}

function getOptionLabel(brand: CardBrand): string {
  switch (brand) {
    case 'visa':
      return 'Visa';
    case 'mastercard':
      return 'Mastercard';
    case 'amex':
      return 'Amex';
    case 'discover':
      return 'Discover';
    case 'unionpay':
      return 'UnionPay';
    case 'jcb':
      return 'JCB';
    case 'rupay':
      return 'RuPay';
    case 'custom':
      return 'Custom';
    default:
      return 'Unknown';
  }
}

export function CardBrandPicker({
  value,
  customBrandName,
  detectedBrand,
  onChange,
  onChangeCustomBrandName,
}: CardBrandPickerProps) {
  const [open, setOpen] = useState(false);

  const currentLabel = useMemo(
    () => (value === 'custom'
      ? getBrandDisplayName(value, customBrandName)
      : getOptionLabel(value)),
    [value, customBrandName],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Card Brand</Text>
      <TouchableOpacity
        style={styles.selectField}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.selectValue}>{currentLabel}</Text>
        <Feather name="chevron-down" size={18} color={theme.colors.textMuted} />
      </TouchableOpacity>

      {detectedBrand && detectedBrand !== 'unknown' ? (
        <Text style={styles.detected}>
          Detected: {getOptionLabel(detectedBrand)}
        </Text>
      ) : null}

      {value === 'custom' ? (
        <View style={styles.customFieldWrap}>
          <Text style={styles.customLabel}>Custom Brand Name</Text>
          <TextInput
            style={styles.customInput}
            value={customBrandName ?? ''}
            onChangeText={onChangeCustomBrandName}
            placeholder="Enter brand name"
            placeholderTextColor={theme.colors.textMuted}
            autoCapitalize="words"
            autoCorrect={false}
            spellCheck={false}
          />
        </View>
      ) : null}

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Card Brand</Text>
              <TouchableOpacity onPress={() => setOpen(false)} activeOpacity={0.75}>
                <Feather name="x" size={18} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.optionList}
              contentContainerStyle={styles.optionListContent}
              showsVerticalScrollIndicator={false}
            >
              {CARD_BRAND_OPTIONS.map((brand) => {
                const isActive = brand === value;
                return (
                  <TouchableOpacity
                    key={brand}
                    style={[styles.optionRow, isActive ? styles.optionRowActive : null]}
                    onPress={() => {
                      onChange(brand);
                      setOpen(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isActive ? styles.optionTextActive : null,
                      ]}
                    >
                      {getOptionLabel(brand)}
                    </Text>
                    {isActive ? (
                      <Feather name="check" size={16} color={theme.colors.primary} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  selectValue: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  detected: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  customFieldWrap: {
    gap: 6,
    marginTop: 4,
  },
  customLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  customInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: theme.colors.text,
    fontSize: 16,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    maxHeight: '72%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  modalTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  optionList: {
    flexGrow: 0,
  },
  optionListContent: {
    paddingHorizontal: 14,
    paddingBottom: 16,
    gap: 8,
  },
  optionRow: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  optionRowActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
  },
  optionText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  optionTextActive: {
    color: theme.colors.text,
  },
});
