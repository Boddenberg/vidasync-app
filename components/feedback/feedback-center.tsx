import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AttachmentPickerField } from '@/components/attachments/attachment-picker-field';
import { AppButton } from '@/components/app-button';
import { AppInput } from '@/components/app-input';
import { INTERNAL_ADMIN_API_KEY } from '@/constants/config';
import { Brand, Radii, Shadows, Typography } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { createFeedback, getAdminFeedbacks, type FeedbackItem } from '@/services/feedback';
import { resolveRemoteFileUrl } from '@/services/file-url';
import type { AttachmentItem } from '@/types/attachments';

function formatDateTime(item: FeedbackItem): string {
  return `${item.date} às ${item.time.slice(0, 5)}`;
}

function shortUserId(userId: string): string {
  return userId.length > 12 ? `${userId.slice(0, 8)}...` : userId;
}

async function resolveFeedbackImageUrl(attachments: AttachmentItem[]): Promise<string | null> {
  const successfulPhoto = attachments.find(
    (attachment) => attachment.kind === 'photo' && attachment.status === 'success',
  );

  if (!successfulPhoto) return null;

  if (successfulPhoto.backendPayload?.transport === 'remote_url') {
    return successfulPhoto.backendPayload.url;
  }

  if (successfulPhoto.backendPayload?.transport === 'inline_base64') {
    const remoteFile = await resolveRemoteFileUrl({
      kind: 'photo',
      localUri: successfulPhoto.uri,
      dataUri: successfulPhoto.backendPayload.data,
      mimeType: successfulPhoto.mimeType,
      fileName: successfulPhoto.name,
      sizeBytes: successfulPhoto.sizeBytes,
    });

    if (!remoteFile.remoteUrl) {
      throw new Error('Nao foi possivel obter a URL publica da imagem do feedback.');
    }

    return remoteFile.remoteUrl;
  }

  return null;
}

export function FeedbackCenter() {
  const { user } = useAuth();

  const [userName, setUserName] = useState('');
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);

  const hasAdminAccess = INTERNAL_ADMIN_API_KEY.length > 0;

  useEffect(() => {
    setUserName((prev) => prev || user?.username || '');
  }, [user?.username]);

  const loadAdminFeedbacks = useCallback(async () => {
    if (!hasAdminAccess) return;

    setAdminLoading(true);
    try {
      setFeedbacks(await getAdminFeedbacks(INTERNAL_ADMIN_API_KEY));
      setAdminError(null);
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Falha ao carregar feedbacks.');
    } finally {
      setAdminLoading(false);
    }
  }, [hasAdminAccess]);

  useEffect(() => {
    loadAdminFeedbacks();
  }, [loadAdminFeedbacks]);

  const canSubmit = useMemo(
    () => userName.trim().length > 0 && message.trim().length > 0 && !submitLoading,
    [message, submitLoading, userName],
  );

  async function handleSubmit() {
    const normalizedUserName = userName.trim();
    const normalizedMessage = message.trim();

    if (!normalizedUserName || !normalizedMessage) {
      setSubmitError('Preencha nome e mensagem para enviar o feedback.');
      return;
    }

    setSubmitLoading(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const imageUrl = await resolveFeedbackImageUrl(attachments);
      await createFeedback({
        userName: normalizedUserName,
        message: normalizedMessage,
        imageUrl,
      });

      setMessage('');
      setAttachments([]);
      setSubmitSuccess('Feedback enviado. Obrigado por ajudar a melhorar o app.');

      if (hasAdminAccess) {
        loadAdminFeedbacks();
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Falha ao enviar feedback.');
    } finally {
      setSubmitLoading(false);
    }
  }

  return (
    <View style={s.wrap}>
      <View style={s.heroCard}>
        <View style={s.heroGlow} />
        <View style={s.heroHeader}>
          <View>
            <Text style={s.heroEyebrow}>Feedback</Text>
            <Text style={s.heroTitle}>Sugestoes, erros e contexto visual</Text>
          </View>
          <View style={s.heroBadge}>
            <Text style={s.heroBadgeText}>/feedback</Text>
          </View>
        </View>
        <Text style={s.heroText}>
          Envie o relato do usuario com print opcional e, quando a chave interna estiver configurada, acompanhe a fila admin logo abaixo.
        </Text>
      </View>

      <View style={s.card}>
        <Text style={s.sectionTitle}>Enviar feedback</Text>
        <Text style={s.sectionSubtitle}>Nome e mensagem sao obrigatorios. A imagem e opcional e vai como URL publica.</Text>

        <View style={s.field}>
          <Text style={s.label}>Nome</Text>
          <AppInput
            value={userName}
            onChangeText={setUserName}
            placeholder="Ex.: Joao Silva"
            maxLength={50}
          />
        </View>

        <View style={s.field}>
          <Text style={s.label}>Mensagem</Text>
          <AppInput
            value={message}
            onChangeText={setMessage}
            placeholder="Descreva o erro, o que esperava e como reproduzir."
            multiline
            maxLength={600}
            style={s.messageInput}
            textAlignVertical="top"
          />
        </View>

        <AttachmentPickerField
          context="meal"
          allowedKinds={['photo']}
          maxItems={1}
          value={attachments}
          onChange={setAttachments}
          title="Print opcional"
          subtitle="Use camera ou galeria para anexar um screenshot do problema."
        />

        {submitError ? (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{submitError}</Text>
          </View>
        ) : null}

        {submitSuccess ? (
          <View style={s.successBox}>
            <Text style={s.successText}>{submitSuccess}</Text>
          </View>
        ) : null}

        <AppButton title="Enviar feedback" onPress={handleSubmit} loading={submitLoading} disabled={!canSubmit} />
      </View>

      <View style={s.card}>
        <View style={s.adminHeader}>
          <View>
            <Text style={s.sectionTitle}>Painel interno</Text>
            <Text style={s.sectionSubtitle}>Lista os feedbacks mais recentes em ordem decrescente.</Text>
          </View>
          <Pressable style={({ pressed }) => [s.refreshBtn, pressed && s.pressed]} onPress={loadAdminFeedbacks}>
            <Text style={s.refreshBtnText}>Atualizar</Text>
          </Pressable>
        </View>

        {!hasAdminAccess ? (
          <View style={s.infoBox}>
            <Text style={s.infoText}>Defina `EXPO_PUBLIC_INTERNAL_ADMIN_API_KEY` no build interno para habilitar `GET /feedback`.</Text>
          </View>
        ) : adminLoading ? (
          <View style={s.loadingRow}>
            <ActivityIndicator color={Brand.greenDark} size="small" />
            <Text style={s.loadingText}>Carregando feedbacks...</Text>
          </View>
        ) : adminError ? (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{adminError}</Text>
          </View>
        ) : feedbacks.length === 0 ? (
          <View style={s.infoBox}>
            <Text style={s.infoText}>Nenhum feedback recebido ainda.</Text>
          </View>
        ) : (
          <View style={s.list}>
            {feedbacks.map((item) => (
              <View key={item.id} style={s.feedbackCard}>
                <View style={s.feedbackTop}>
                  <View style={s.feedbackHead}>
                    <Text style={s.feedbackName}>{item.userName}</Text>
                    <Text style={s.feedbackMeta}>{formatDateTime(item)} • user {shortUserId(item.userId)}</Text>
                  </View>
                  <View style={s.statusPill}>
                    <Text style={s.statusPillText}>{item.status}</Text>
                  </View>
                </View>

                <Text style={s.feedbackMessage}>{item.message}</Text>

                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={s.feedbackImage} />
                ) : null}

                <View style={s.footerMeta}>
                  <Text style={s.footerMetaText}>
                    {item.developerResponse ? `Resposta: ${item.developerResponse}` : 'Sem resposta do desenvolvedor ainda.'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  heroCard: {
    backgroundColor: '#F8FBF7',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: '#DFEBDD',
    padding: 16,
    gap: 10,
    overflow: 'hidden',
    ...Shadows.card,
  },
  heroGlow: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 140,
    backgroundColor: '#E4F4E9',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  heroEyebrow: {
    ...Typography.caption,
    color: Brand.greenDark,
    textTransform: 'uppercase',
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  heroTitle: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
  },
  heroText: {
    ...Typography.body,
    color: Brand.textSecondary,
  },
  heroBadge: {
    borderRadius: Radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#EAF4EC',
    borderWidth: 1,
    borderColor: '#D8EAD9',
  },
  heroBadgeText: {
    ...Typography.caption,
    color: Brand.greenDark,
    fontWeight: '800',
  },
  card: {
    backgroundColor: Brand.card,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Brand.border,
    padding: 16,
    gap: 12,
    ...Shadows.card,
  },
  sectionTitle: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
  },
  sectionSubtitle: {
    ...Typography.helper,
    color: Brand.textSecondary,
    marginTop: -4,
  },
  field: {
    gap: 6,
  },
  label: {
    ...Typography.caption,
    color: Brand.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  messageInput: {
    minHeight: 140,
    paddingTop: 16,
  },
  errorBox: {
    borderRadius: Radii.md,
    backgroundColor: '#FFEDEE',
    padding: 12,
  },
  errorText: {
    ...Typography.body,
    color: Brand.danger,
    fontSize: 14,
  },
  successBox: {
    borderRadius: Radii.md,
    backgroundColor: '#EEF9F0',
    padding: 12,
  },
  successText: {
    ...Typography.body,
    color: Brand.greenDark,
    fontSize: 14,
    fontWeight: '700',
  },
  adminHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  refreshBtn: {
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  refreshBtnText: {
    ...Typography.caption,
    color: Brand.text,
    fontWeight: '700',
  },
  infoBox: {
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.surfaceAlt,
    padding: 12,
  },
  infoText: {
    ...Typography.body,
    color: Brand.textSecondary,
    fontSize: 14,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    ...Typography.body,
    color: Brand.textSecondary,
    fontSize: 14,
  },
  list: {
    gap: 10,
  },
  feedbackCard: {
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.card,
    padding: 12,
    gap: 10,
  },
  feedbackTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  feedbackHead: {
    flex: 1,
    gap: 2,
  },
  feedbackName: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '800',
  },
  feedbackMeta: {
    ...Typography.caption,
    color: Brand.textSecondary,
  },
  statusPill: {
    borderRadius: Radii.pill,
    backgroundColor: '#EAF4EC',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusPillText: {
    ...Typography.caption,
    color: Brand.greenDark,
    fontWeight: '800',
  },
  feedbackMessage: {
    ...Typography.body,
    color: Brand.text,
    lineHeight: 21,
  },
  feedbackImage: {
    width: '100%',
    height: 190,
    borderRadius: Radii.md,
    backgroundColor: Brand.surfaceAlt,
  },
  footerMeta: {
    borderTopWidth: 1,
    borderTopColor: Brand.border,
    paddingTop: 10,
  },
  footerMetaText: {
    ...Typography.caption,
    color: Brand.textSecondary,
  },
  pressed: {
    opacity: 0.84,
  },
});
