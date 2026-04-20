import { StyleSheet } from 'react-native';

import { Brand } from '@/constants/theme';

export const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Brand.bg,
  },
  // Nutrition-forward ambient background orbs
  backgroundOrbTop: {
    position: 'absolute',
    top: -200,
    right: -150,
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: 'rgba(31,167,80,0.14)',
  },
  backgroundOrbMid: {
    position: 'absolute',
    top: 260,
    left: -160,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(244,166,42,0.10)',
  },
  backgroundOrbBottom: {
    position: 'absolute',
    right: -130,
    bottom: 120,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(45,156,219,0.08)',
  },
  scroll: {
    paddingHorizontal: 20,
    gap: 22,
  },
});
