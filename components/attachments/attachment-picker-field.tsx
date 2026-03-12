import { type Dispatch, type SetStateAction, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand, Radii, Typography } from '@/constants/theme';
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
      <Text style={s.title}>{title}</Text>
      {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}

      {kinds.length > 1 ? (
        <View style={s.kindRow}>
          {kinds.map((kind) => (
            <Pressable
              key={kind}
              onPress={() => setSelectedKind(kind)}
              style={[s.kindButton, selectedKind === kind && s.kindButtonActive]}>
              <Text style={[s.kindButtonText, selectedKind === kind && s.kindButtonTextActive]}>{KIND_LABEL[kind]}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {selectedKind === 'photo' ? (
        <>
          <View style={s.photoAddRow}>
            <Pressable
              style={[s.addButton, s.photoAddButton, !hasRoom && s.addButtonDisabled]}
              onPress={() => handlePick('camera')}
              disabled={!hasRoom}>
              <Text style={s.addButtonText}>+ Tirar foto</Text>
            </Pressable>
            <Pressable
              style={[s.addButton, s.photoAddButton, !hasRoom && s.addButtonDisabled]}
              onPress={() => handlePick('library')}
              disabled={!hasRoom}>
              <Text style={s.addButtonText}>+ Galeria</Text>
            </Pressable>
          </View>
          {!hasRoom ? <Text style={s.limitHint}>Você já adicionou uma foto. Remova para trocar.</Text> : null}
        </>
      ) : (
        <Pressable style={[s.addButton, !hasRoom && s.addButtonDisabled]} onPress={() => handlePick('library')} disabled={!hasRoom}>
          <Text style={s.addButtonText}>{hasRoom ? `+ Adicionar ${pickLabel(selectedKind)}` : 'Limite atingido'}</Text>
        </Pressable>
      )}

      <View style={s.list}>
        {value.map((item) => (
          <View key={item.id} style={s.card}>
            {item.kind === 'photo' ? (
              <Image source={{ uri: item.uri }} style={s.photoPreview} />
            ) : (
              <View style={s.filePreview}>
                <Text style={s.filePreviewLabel}>{item.kind === 'audio' ? 'ÁUDIO' : 'PDF'}</Text>
              </View>
            )}

            <View style={s.content}>
              <Text style={s.fileName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={s.fileMeta}>
                {KIND_LABEL[item.kind]} • {formatBytes(item.sizeBytes)}
              </Text>

              {item.status === 'processing' ? (
                <View style={s.statusRow}>
                  <ActivityIndicator size="small" color={Brand.greenDark} />
                  <Text style={s.statusText}>Processando...</Text>
                </View>
              ) : null}

              {item.status === 'success' ? <Text style={[s.statusText, s.successText]}>Arquivo pronto</Text> : null}

              {item.status === 'error' ? (
                <View style={s.errorWrap}>
                  <Text style={[s.statusText, s.errorText]}>{item.errorMessage ?? 'Erro ao processar.'}</Text>
                  <Pressable style={s.retryButton} onPress={() => handleRetry(item)}>
                    <Text style={s.retryButtonText}>Tentar novamente</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>

            <Pressable style={s.removeButton} onPress={() => handleRemove(item.id)}>
              <Text style={s.removeButtonText}>Remover</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: {
    gap: 10,
  },
  title: {
    ...Typography.caption,
    color: Brand.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  subtitle: {
    ...Typography.caption,
    color: Brand.textSecondary,
    marginTop: -6,
  },
  kindRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  kindButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.surfaceAlt,
  },
  kindButtonActive: {
    borderColor: Brand.green,
    backgroundColor: Brand.green,
  },
  kindButtonText: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  kindButtonTextActive: {
    color: '#FFFFFF',
  },
  addButton: {
    borderRadius: Radii.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Brand.green,
    backgroundColor: Brand.surfaceSoft,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    borderColor: Brand.border,
    backgroundColor: Brand.surfaceAlt,
  },
  addButtonText: {
    ...Typography.body,
    color: Brand.greenDark,
    fontWeight: '700',
  },
  photoAddRow: {
    flexDirection: 'row',
    gap: 8,
  },
  photoAddButton: {
    flex: 1,
  },
  limitHint: {
    ...Typography.caption,
    color: Brand.textSecondary,
  },
  list: {
    gap: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.card,
    padding: 10,
    gap: 10,
  },
  photoPreview: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  filePreview: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: Brand.surfaceAlt,
    borderWidth: 1,
    borderColor: Brand.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filePreviewLabel: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
    fontSize: 10,
  },
  content: {
    flex: 1,
    gap: 3,
  },
  fileName: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '600',
    fontSize: 14,
  },
  fileMeta: {
    ...Typography.caption,
    color: Brand.textSecondary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  statusText: {
    ...Typography.caption,
    color: Brand.textSecondary,
  },
  successText: {
    color: Brand.greenDark,
    fontWeight: '700',
  },
  errorWrap: {
    gap: 5,
    marginTop: 3,
  },
  errorText: {
    color: Brand.danger,
    fontWeight: '700',
  },
  retryButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFEDEE',
    borderRadius: Radii.pill,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  retryButtonText: {
    ...Typography.caption,
    color: Brand.danger,
    fontWeight: '700',
  },
  removeButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  removeButtonText: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
});
