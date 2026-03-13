import { Platform, StyleSheet } from 'react-native';

export const theme = {
  colors: {
    background: '#0C0A08',
    backgroundAlt: '#111009',
    surface: '#18160F',
    surfaceElevated: '#201E14',
    surfaceMuted: '#141209',
    border: 'rgba(220, 190, 130, 0.10)',
    borderStrong: 'rgba(220, 190, 130, 0.20)',
    text: '#F0EAD8',
    textMuted: '#9C9078',
    textSubtle: '#6A5E48',
    primary: '#C8A050',
    primarySoft: 'rgba(200, 160, 80, 0.15)',
    primaryInk: '#100800',
    secondary: '#A08858',
    secondarySoft: 'rgba(160, 136, 88, 0.14)',
    danger: '#E87070',
    dangerSoft: 'rgba(232, 112, 112, 0.12)',
    warning: '#D4943A',
    warningSoft: 'rgba(212, 148, 58, 0.14)',
    success: '#7EC496',
    successSoft: 'rgba(126, 196, 150, 0.12)',
    white: '#FFFFFF',
    black: '#000000',
  },
  gradients: {
    app: ['#0C0A08', '#100E09', '#15120C'] as [string, string, string],
    hero: ['rgba(200, 160, 80, 0.14)', 'rgba(160, 136, 88, 0.07)', 'rgba(12, 10, 8, 0)'] as [
      string,
      string,
      string,
    ],
    panel: ['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.01)'] as [string, string],
  },
  radii: {
    sm: 12,
    md: 18,
    lg: 24,
    pill: 999,
  },
  spacing: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  fonts: {
    mono: Platform.select({
      ios: 'Menlo',
      default: 'monospace',
    }),
  },
};

export const sharedStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  surface: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  surfaceElevated: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  headline: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: '700',
  },
  subheadline: {
    color: theme.colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
});

export const shadows = StyleSheet.create({
  floatingCard: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 10,
  },
});
