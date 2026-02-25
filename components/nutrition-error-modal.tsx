/**
 * Modal de erro de nutrição
 *
 * Popup elegante quando o backend rejeita alimentos inválidos.
 */

import { Brand } from '@/constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  visible: boolean;
  message: string;
  onClose: () => void;
};

export function NutritionErrorModal({ visible, message, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.card} onPress={(e) => e.stopPropagation()}>
          {/* Ícone */}
          <View style={s.iconCircle}>
            <Ionicons name="alert-circle-outline" size={36} color={Brand.orange} />
          </View>

          {/* Título */}
          <Text style={s.title}>Ops! Algo não está certo</Text>

          {/* Mensagem do backend */}
          <Text style={s.message}>{message}</Text>

          {/* Dica */}
          <Text style={s.hint}>
            Revise os ingredientes e tente novamente com alimentos válidos.
          </Text>

          {/* Botão */}
          <Pressable
            style={({ pressed }) => [s.btn, pressed && s.btnPressed]}
            onPress={onClose}>
            <Text style={s.btnText}>Entendi</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Brand.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    color: Brand.text,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  hint: {
    fontSize: 13,
    color: Brand.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  btn: {
    backgroundColor: Brand.greenDark,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 40,
    width: '100%',
    alignItems: 'center',
  },
  btnPressed: {
    opacity: 0.85,
  },
  btnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
