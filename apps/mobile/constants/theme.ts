import { TextStyle } from 'react-native';

export const Colors = {
  bg: {
    base: '#060B18',        // screen background
    card: '#0D1526',        // card surface
    cardHover: '#111E33',   // pressed state
  },
  amber: {
    400: '#FBBF24',
    500: '#F59E0B',
    glow: '#F59E0B40',      // 25% opacity for shadow glow
  },
  danger: {
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    glow: '#EF444440',
  },
  success: {
    400: '#34D399',
    500: '#10B981',
    glow: '#10B98140',
  },
  neutral: {
    700: '#374151',
    500: '#6B7280',
    400: '#9CA3AF',
    white: '#FFFFFF',
  },
  arcTrack: '#1E2D47',
  status: {
    active: '#F59E0B',
    completed: '#10B981',
    failed: '#EF4444',
  },
} as const;

export const Typography = {
  display: {
    xl: {
      fontFamily: 'BebasNeue_400Regular',
      fontSize: 72,
      lineHeight: 80,
    } as TextStyle,
    lg: {
      fontFamily: 'BebasNeue_400Regular',
      fontSize: 48,
      lineHeight: 56,
    } as TextStyle,
    md: {
      fontFamily: 'BebasNeue_400Regular',
      fontSize: 32,
      lineHeight: 40,
    } as TextStyle,
    sm: {
      fontFamily: 'BebasNeue_400Regular',
      fontSize: 24,
      lineHeight: 32,
    } as TextStyle,
  },
  body: {
    lg: {
      fontFamily: 'Nunito_400Regular',
      fontSize: 18,
      lineHeight: 28,
    } as TextStyle,
    md: {
      fontFamily: 'Nunito_400Regular',
      fontSize: 16,
      lineHeight: 24,
    } as TextStyle,
    sm: {
      fontFamily: 'Nunito_400Regular',
      fontSize: 14,
      lineHeight: 20,
    } as TextStyle,
    xs: {
      fontFamily: 'Nunito_400Regular',
      fontSize: 12,
      lineHeight: 18,
    } as TextStyle,
    lgBold: {
      fontFamily: 'Nunito_700Bold',
      fontSize: 18,
      lineHeight: 28,
      fontWeight: '700',
    } as TextStyle,
    mdSemiBold: {
      fontFamily: 'Nunito_600SemiBold',
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '600',
    } as TextStyle,
    smBold: {
      fontFamily: 'Nunito_700Bold',
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '700',
    } as TextStyle,
    label: {
      fontFamily: 'Nunito_700Bold',
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    } as TextStyle,
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  screen: {
    horizontal: 20,
    vertical: 24,
  },
} as const;

export const Shadows = {
  amberGlow: {
    shadowColor: Colors.amber[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  dangerGlow: {
    shadowColor: Colors.danger[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  successGlow: {
    shadowColor: Colors.success[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;
