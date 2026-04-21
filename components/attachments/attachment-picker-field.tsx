import Ionicons from '@expo/vector-icons/Ionicons';
import { type Dispatch, type SetStateAction, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand, Radii, Shadows, Typography } from '@/constants/theme';
import {
  buildBackendPayloadFromDraft,
  createProcessingAttachment,
  pickAttachment,
  pickPhotoAttachment,
} from '@/services/attachments';
import type { AttachmentContext, AttachmentItem, AttachmentKind } from '@/types/attachments';
import { getAllowedAttachmentKinds } from '@/utils/attachment-rules';

type Props = {
  title?: string;
  subtitle?: string;
  context: AttachmentContext;
  allowedKinds?: AttachmentKind[];
  maxItems?: number;
  value: AttachmentItem[];
  onChange: Dispatch<SetStateAction<AttachmentItem[]>>;
};

const KIND_LABEL: Record<AttachmentKind, string> = {
  photo: 'Foto',
  audio: 'Áudio',
  pdf: 'PDF',
};

const KIND_ICON: Record<AttachmentKind, keyof typeof Ionicons.glyphMap> = {
  photo: 'image',
  audio: 'mic',
  pdf: 'document-text',
};

function formatBytes(sizeBytes?: number): string {
  if (!sizeBytes || sizeBytes <= 0) return '-';
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function updateAttachment(
  list: AttachmentItem[],
  id: string,
  updater: (item: AttachmentItem) => AttachmentItem,
): AttachmentItem[] {
  return list.map((item) => (item.id === id ? updater(item) : item));
}

function pickLabel(kind: AttachmentKind): string {
  if (kind === 'photo') return 'foto';
  if (kind === 'audio') return 'áudio';
  return 'PDF';
}

export function AttachmentPickerField({
  title = 'Anexos',
  subtitle,
  context,
  allowedKinds,
  maxItems = 3,
  value,
  onChange,
}: Props) {
  const kinds = useMemo(() => allowedKinds ?? getAllowedAttachmentKinds(context), [allowedKinds, context]);
  const [selectedKind, setSelectedKind] = useState<AttachmentKind>(kinds[0]);

  const hasRoom = value.length < maxItems;

  async function handlePick(source: 'camera' | 'library' = 'library') {
    if (!hasRoom) return;

    const draft = selectedKind === 'photo' ? await pickPhotoAttachment(source) : await pickAttachment(selectedKind);
    if (!draft) return;

    const processing = createProcessingAttachment(context, draft);
    onChange((prev) => [...prev, processing]);

    try {
      const backendPayload = await buildBackendPayloadFromDraft(context, draft);
      onChange((prev) =>
        updateAttachment(prev, processing.id, (item) => ({
          ...item,
          status: 'success',
          errorMessage: undefined,
          backendPayload,
        })),
      );
    } catch (error: any) {
      onChange((prev) =>
        updateAttachment(prev, processing.id, (item) => ({
          ...item,
          status: 'error',
          errorMessage: error?.message ?? 'Falha ao processar anexo.',
        })),
      );
    }
  }

  async function handleRetry(item: AttachmentItem) {
    onChange((prev) =>
      updateAttachment(prev, item.id, (current) => ({
        ...current,
        status: 'processing',
        errorMessage: undefined,
      })),
    );

    try {
      const backendPayload = await buildBackendPayloadFromDraft(context, {
        kind: item.kind,
        name: item.name,
        uri: item.uri,
        mimeType: item.mimeType,
        sizeBytes: item.sizeBytes,
      });

      onChange((prev) =>
        updateAttachment(prev, item.id, (current) => ({
          ...current,
          status: 'success',
          backendPayload,
          errorMessage: undefined,
        })),
      );
    } catch (error: any) {
      onChange((prev) =>
        updateAttachment(prev, item.id, (current) => ({
          ...current,
          status: 'error',
          errorMessage: error?.message ?? 'Falha ao processar anexo.',
        })),
      );
    }
  }

  function handleRemove(id: string) {
    onChange((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <View style={s.wrapper}>
      {title || subtitle ? (
        <View style={s.headerBlock}>
          {title ? <Text style={s.title}>{title}</Text> : null}
          {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
        </View>
      ) : null}

      {kinds.length > 1 ? (
        <View style={s.kindRow}>
          {kinds.map((kind) => (
            <Pressable
              key={kind}
              onPress={() => setSelectedKind(kind)}
              style={[s.kindButton, selectedKind === kind && s.kindButtonActive]}>
              <Ionicons
                name={KIND_ICON[kind]}
                size={13}
                color={selectedKind === kind ? '#FFFFFF' : Brand.textSecondary}
              />
              <Text style={[s.kindButtonText, selectedKind === kind && s.kindButtonTextActive]}>{KIND_LABEL[kind]}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {selectedKind === 'photo' ? (
        <>
          <View style={s.photoAddRow}>
            <PhotoActionButton
              icon="camera"
              label="Tirar foto"
              disabled={!hasRoom}
              onPress={() => handlePick('camera')}
              primary
            />
            <PhotoActionButton
              icon="images"
              label="Galeria"
              disabled={!hasRoom}
              onPress={() => handlePick('library')}
            />
          </View>
          {!hasRoom ? (
            <View style={s.limitHintRow}>
              <Ionicons name="information-circle" size={13} color={Brand.textMuted} />
              <Text style={s.limitHint}>Você já adicionou uma foto. Remova para trocar.</Text>
            </View>
          ) : null}
        </>
      ) : (
        <Pressable
          style={({ pressed }) => [s.addButton, pressed && s.addButtonPressed, !hasRoom && s.addButtonDisabled]}
          onPress={() => handlePick('library')}
          disabled={!hasRoom}>
          <View style={[s.addButtonIcon, !hasRoom && s.addButtonIconDisabled]}>
            <Ionicons name={KIND_ICON[selectedKind]} size={16} color={!hasRoom ? Brand.textMuted : Brand.greenDeeper} />
          </View>
          <Text style={[s.addButtonText, !hasRoom && s.addButtonTextDisabled]}>
            {hasRoom ? `Adicionar ${pickLabel(selectedKind)}` : 'Limite atingido'}
          </Text>
        </Pressable>
      )}

      <View style={s.list}>
        {value.map((item) => (
          <View key={item.id} style={s.card}>
            {item.kind === 'photo' ? (
              <Image source={{ uri: item.uri }} style={s.photoPreview} />
            ) : (
              <View style={s.filePreview}>
                <Ionicons name={KIND_ICON[item.kind]} size={22} color={Brand.greenDark} />
              </View>
            )}

            <View style={s.content}>
              <Text style={s.fileName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={s.fileMeta}>
                {KIND_LABEL[item.kind]} · {formatBytes(item.sizeBytes)}
              </Text>

              {item.status === 'processing' ? (
                <View style={s.statusRow}>
                  <ActivityIndicator size="small" color={Brand.greenDeeper} />
                  <Text style={s.statusText}>Processando...</Text>
                </View>
              ) : null}

              {item.status === 'success' ? (
                <View style={s.statusRow}>
                  <Ionicons name="checkmark-circle" size={13} color={Brand.greenDeeper} />
                  <Text style={[s.statusText, s.successText]}>Pronto</Text>
                </View>
              ) : null}

              {item.status === 'error' ? (
                <View style={s.errorWrap}>
                  <View style={s.statusRow}>
                    <Ionicons name="alert-circle" size={13} color={Brand.danger} />
                    <Text style={[s.statusText, s.errorText]} numberOfLines={2}>
                      {item.errorMessage ?? 'Erro ao processar.'}
                    </Text>
                  </View>
                  <Pressable style={s.retryButton} onPress={() => handleRetry(item)}>
                    <Ionicons name="refresh" size={12} color={Brand.danger} />
                    <Text style={s.retryButtonText}>Tentar novamente</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>

            <Pressable
              style={({ pressed }) => [s.removeButton, pressed && s.removeButtonPressed]}
              onPress={() => handleRemove(item.id)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Remover anexo">
              <Ionicons name="close" size={16} color={Brand.textSecondary} />
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}

type PhotoActionButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled: boolean;
  primary?: boolean;
};

function PhotoActionButton({ icon, label, onPress, disabled, primary }: PhotoActionButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        s.photoActionBtn,
        primary && s.photoActionBtnPrimary,
        pressed && !disabled && s.photoActionBtnPressed,
        disabled && s.photoActionBtnDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}>
      <View
        style={[
          s.photoActionIcon,
          primary && s.photoActionIconPrimary,
          disabled && s.photoActionIconDisabled,
        ]}>
        <Ionicons
          name={icon}
          size={16}
          color={disabled ? Brand.textMuted : primary ? '#FFFFFF' : Brand.greenDeeper}
        />
      </View>
      <Text
        style={[
          s.photoActionText,
          primary && s.photoActionTextPrimary,
          disabled && s.photoActionTextDisabled,
        ]}
        numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  wrapper: {
    gap: 10,
  },
  headerBlock: {
    gap: 2,
  },
  title: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '800',
    color: Brand.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginLeft: 4,
  },
  subtitle: {
    ...Typography.caption,
    fontSize: 12,
    color: Brand.textSecondary,
    marginLeft: 4,
  },
  kindRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  kindButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: '#FFFFFF',
  },
  kindButtonActive: {
    borderColor: Brand.greenDeeper,
    backgroundColor: Brand.greenDeeper,
  },
  kindButtonText: {
    ...Typography.caption,
    fontSize: 12,
    color: Brand.textSecondary,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  kindButtonTextActive: {
    color: '#FFFFFF',
  },
  photoAddRow: {
    flexDirection: 'row',
    gap: 10,
  },
  photoActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(20,108,56,0.12)',
    borderRadius: Radii.lg,
    paddingVertical: 14,
    paddingHorizontal: 14,
    ...Shadows.card,
  },
  photoActionBtnPrimary: {
    backgroundColor: Brand.greenDeeper,
    borderColor: Brand.greenDeeper,
  },
  photoActionBtnPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.99 }],
  },
  photoActionBtnDisabled: {
    opacity: 0.55,
    backgroundColor: Brand.surfaceAlt,
    borderColor: Brand.border,
  },
  photoActionIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Brand.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoActionIconPrimary: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  photoActionIconDisabled: {
    backgroundColor: 'transparent',
  },
  photoActionText: {
    ...Typography.body,
    fontSize: 13,
    color: Brand.greenDeeper,
    fontWeight: '800',
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  photoActionTextPrimary: {
    color: '#FFFFFF',
  },
  photoActionTextDisabled: {
    color: Brand.textMuted,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(20,108,56,0.12)',
    borderRadius: Radii.lg,
    paddingVertical: 14,
    paddingHorizontal: 16,
    ...Shadows.card,
  },
  addButtonPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.99 }],
  },
  addButtonDisabled: {
    opacity: 0.55,
    backgroundColor: Brand.surfaceAlt,
    borderColor: Brand.border,
  },
  addButtonIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Brand.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonIconDisabled: {
    backgroundColor: 'transparent',
  },
  addButtonText: {
    ...Typography.body,
    fontSize: 14,
    color: Brand.greenDeeper,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  addButtonTextDisabled: {
    color: Brand.textMuted,
  },
  limitHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginLeft: 4,
  },
  limitHint: {
    ...Typography.caption,
    fontSize: 11,
    color: Brand.textMuted,
    fontWeight: '600',
  },
  list: {
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(20,108,56,0.08)',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 12,
    ...Shadows.card,
  },
  photoPreview: {
    width: 56,
    height: 56,
    borderRadius: 16,
  },
  filePreview: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Brand.surfaceSoft,
    borderWidth: 1,
    borderColor: 'rgba(20,108,56,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 3,
  },
  fileName: {
    ...Typography.body,
    fontSize: 14,
    color: Brand.text,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  fileMeta: {
    ...Typography.caption,
    fontSize: 11,
    color: Brand.textSecondary,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  statusText: {
    ...Typography.caption,
    fontSize: 11,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  successText: {
    color: Brand.greenDeeper,
  },
  errorWrap: {
    gap: 6,
    marginTop: 3,
  },
  errorText: {
    color: Brand.danger,
    fontWeight: '700',
    flex: 1,
  },
  retryButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF0F0',
    borderRadius: Radii.pill,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  retryButtonText: {
    ...Typography.caption,
    fontSize: 11,
    color: Brand.danger,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  removeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Brand.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonPressed: {
    backgroundColor: Brand.border,
  },
});
