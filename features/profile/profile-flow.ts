import { Brand } from '@/constants/theme';

export type ProfileStep = 'overview' | 'username' | 'password' | 'bmi';
export type UsernameCheckState =
  | 'idle'
  | 'checking'
  | 'available'
  | 'unavailable'
  | 'invalid'
  | 'same'
  | 'error';

export function getUsernameStatusPalette(status: UsernameCheckState) {
  if (status === 'available') {
    return {
      backgroundColor: '#F0FFF4',
      borderColor: '#C7E9D0',
      textColor: Brand.greenDark,
    };
  }

  if (status === 'checking' || status === 'error') {
    return {
      backgroundColor: '#FFF8E8',
      borderColor: '#F1D49A',
      textColor: '#9A6700',
    };
  }

  return {
    backgroundColor: '#FFF0F0',
    borderColor: '#F2C6CB',
    textColor: Brand.danger,
  };
}
