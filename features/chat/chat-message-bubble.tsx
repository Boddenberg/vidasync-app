import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { Brand, Radii, Shadows, Typography } from '@/constants/theme';
import type { ChatMessage } from '@/types/chat';

type Props = {
  message: ChatMessage;
};

function formatTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function ChatMessageBubble({ message }: Props) {
  const isUser = message.role === 'user';
  const isError = message.isError === true;

  if (isUser) {
    return (
      <View style={[s.row, s.rowUser]}>
        <View style={[s.bubble, s.bubbleUser]}>
          <Text style={s.textUser}>{message.text}</Text>
        </View>
        <Text style={s.timeUser}>{formatTime(message.createdAt)}</Text>
      </View>
    );
  }

  return (
    <View style={[s.row, s.rowAssistant]}>
      <View style={s.avatarAssistant}>
        <Ionicons
          name={isError ? 'alert' : 'sparkles'}
          size={12}
          color={isError ? Brand.danger : Brand.greenDeeper}
        />
      </View>
      <View style={s.assistantCol}>
        <View
          style={[
            s.bubble,
            s.bubbleAssistant,
            isError && s.bubbleError,
          ]}>
          {message.intent && !isError ? (
            <View style={s.intentRow}>
              <View style={s.intentDot} />
              <Text style={s.intentText}>{formatIntent(message.intent)}</Text>
            </View>
          ) : null}
          <Text style={[s.textAssistant, isError && s.textError]}>{message.text}</Text>

          {message.warnings.length > 0 && !isError ? (
            <View style={s.warningsWrap}>
              {message.warnings.map((warning, idx) => (
                <View key={idx} style={s.warningChip}>
                  <Ionicons name="warning-outline" size={10} color={Brand.warning} />
                  <Text style={s.warningText}>{warning}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {message.disclaimer && !isError ? (
            <Text style={s.disclaimer}>{message.disclaimer}</Text>
          ) : null}
        </View>
        <Text style={s.timeAssistant}>{formatTime(message.createdAt)}</Text>
      </View>
    </View>
  );
}

function formatIntent(intent: string): string {
  return intent
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  rowAssistant: {
    justifyContent: 'flex-start',
  },
  avatarAssistant: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Brand.mintSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  assistantCol: {
    flex: 1,
    maxWidth: '85%',
    alignItems: 'flex-start',
    gap: 4,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 6,
  },
  bubbleAssistant: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 6,
    borderTopRightRadius: Radii.xl,
    borderBottomRightRadius: Radii.xl,
    borderBottomLeftRadius: Radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(20,108,56,0.08)',
    ...Shadows.soft,
  },
  bubbleUser: {
    backgroundColor: Brand.greenDeeper,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: 6,
    borderBottomRightRadius: Radii.xl,
    borderBottomLeftRadius: Radii.xl,
    maxWidth: '85%',
    ...Shadows.card,
  },
  bubbleError: {
    backgroundColor: '#FFF5F3',
    borderColor: 'rgba(228,88,88,0.25)',
  },
  intentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  intentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Brand.fresh,
  },
  intentText: {
    ...Typography.caption,
    fontSize: 9,
    fontWeight: '800',
    color: Brand.greenDeeper,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  textAssistant: {
    ...Typography.body,
    fontSize: 15,
    lineHeight: 22,
    color: Brand.text,
    fontWeight: '500',
  },
  textError: {
    color: Brand.danger,
  },
  textUser: {
    ...Typography.body,
    fontSize: 15,
    lineHeight: 22,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  timeAssistant: {
    ...Typography.caption,
    fontSize: 10,
    color: Brand.textMuted,
    fontWeight: '600',
    marginLeft: 4,
  },
  timeUser: {
    ...Typography.caption,
    fontSize: 10,
    color: Brand.textMuted,
    fontWeight: '600',
    marginBottom: 2,
    marginRight: 2,
  },
  warningsWrap: {
    gap: 4,
    marginTop: 2,
  },
  warningChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Brand.warningBg,
    borderRadius: Radii.pill,
    alignSelf: 'flex-start',
  },
  warningText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: Brand.warning,
  },
  disclaimer: {
    ...Typography.caption,
    fontSize: 10,
    color: Brand.textMuted,
    fontWeight: '500',
    fontStyle: 'italic',
    marginTop: 4,
    lineHeight: 14,
  },
});
