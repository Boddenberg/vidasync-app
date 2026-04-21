import Ionicons from '@expo/vector-icons/Ionicons';
import { forwardRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Brand, Shadows, Typography } from '@/constants/theme';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  placeholder: string;
};

const MAX_LENGTH = 800;

export const ChatComposer = forwardRef<TextInput, Props>(function ChatComposer(
  { value, onChangeText, onSubmit, disabled, placeholder },
  ref,
) {
  const canSend = value.trim().length > 0 && !disabled;
  const showCount = value.length > MAX_LENGTH * 0.8;

  return (
    <View style={s.shell}>
      <View style={s.card}>
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Brand.textMuted}
          multiline
          maxLength={MAX_LENGTH}
          style={s.input}
        />

        <View style={s.actionsRow}>
          {showCount ? (
            <Text style={s.count}>
              {value.length}
              <Text style={s.countMax}> / {MAX_LENGTH}</Text>
            </Text>
          ) : (
            <View style={s.hintRow}>
              <Ionicons name="shield-checkmark" size={11} color={Brand.greenDark} />
              <Text style={s.hint}>Respostas privadas e personalizadas</Text>
            </View>
          )}

          <Pressable
            style={({ pressed }) => [
              s.sendBtn,
              !canSend && s.sendBtnDisabled,
              pressed && canSend && s.sendBtnPressed,
            ]}
            onPress={onSubmit}
            disabled={!canSend}>
            {canSend ? (
              <View style={StyleSheet.absoluteFill}>
                <Svg width="100%" height="100%">
                  <Defs>
                    <LinearGradient id="sendGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <Stop offset="0%" stopColor={Brand.fresh} stopOpacity="1" />
                      <Stop offset="100%" stopColor={Brand.forest} stopOpacity="1" />
                    </LinearGradient>
                  </Defs>
                  <Rect x="0" y="0" width="100%" height="100%" rx="22" ry="22" fill="url(#sendGrad)" />
                </Svg>
              </View>
            ) : null}
            <Ionicons
              name="arrow-up"
              size={18}
              color={canSend ? '#FFFFFF' : Brand.textMuted}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
});

const s = StyleSheet.create({
  shell: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(20,108,56,0.10)',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 6,
    ...Shadows.card,
  },
  input: {
    minHeight: 34,
    maxHeight: 120,
    color: Brand.text,
    ...Typography.body,
    fontSize: 15,
    lineHeight: 20,
    paddingTop: 0,
    paddingBottom: 0,
    textAlignVertical: 'top',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    minWidth: 0,
  },
  hint: {
    ...Typography.caption,
    fontSize: 10,
    color: Brand.textMuted,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  count: {
    ...Typography.caption,
    fontSize: 11,
    color: Brand.textSecondary,
    fontWeight: '800',
    flex: 1,
  },
  countMax: {
    color: Brand.textMuted,
    fontWeight: '600',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Brand.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sendBtnDisabled: {
    backgroundColor: Brand.surfaceAlt,
  },
  sendBtnPressed: {
    transform: [{ scale: 0.94 }],
  },
});
