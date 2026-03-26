import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppCard } from '@/components/app-card';
import { ChatQuickActions } from '@/components/chat/chat-quick-actions';
import { Brand, Radii, Shadows, Typography } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { sendChatPrompt } from '@/services/chat';
import type { ChatMessage, ChatQuickAction, ChatReply } from '@/types/chat';

const STARTER_PROMPTS = [
  'Como montar um cafe da manha com mais proteina?',
  'O que posso comer antes de treinar sem pesar?',
  'Me ajude a organizar um jantar leve para hoje.',
];

function buildMessageId() {
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createUserMessage(text: string): ChatMessage {
  return {
    id: buildMessageId(),
    role: 'user',
    text,
    createdAt: new Date().toISOString(),
    warnings: [],
    disclaimer: null,
    traceId: null,
    intent: null,
    confidence: null,
    model: null,
  };
}

function createAssistantMessage(reply: ChatReply): ChatMessage {
  return {
    id: buildMessageId(),
    role: 'assistant',
    text: reply.response,
    createdAt: new Date().toISOString(),
    warnings: reply.warnings,
    disclaimer: reply.disclaimer,
    traceId: reply.traceId,
    intent: reply.intent,
    confidence: reply.confidence,
    model: reply.model,
  };
}

function createAssistantErrorMessage(message: string): ChatMessage {
  return {
    id: buildMessageId(),
    role: 'assistant',
    text: message,
    createdAt: new Date().toISOString(),
    warnings: [],
    disclaimer: null,
    traceId: null,
    intent: null,
    confidence: null,
    model: null,
    isError: true,
  };
}

function formatMessageTime(value: string): string {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return parsed.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatMemoryLabel(reply: ChatReply | null): string | null {
  if (!reply?.memory) {
    return null;
  }

  const turns = reply.memory.totalTurns;
  const summaryLabel = reply.memory.hasSummary ? 'Resumo ativo' : 'Contexto vivo';
  return `${summaryLabel} | ${turns} turnos na memoria`;
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const showMeta = !isUser && (message.warnings.length > 0 || message.disclaimer || message.model);

  return (
    <View style={[s.messageRow, isUser ? s.messageRowUser : s.messageRowAssistant]}>
      <View
        style={[
          s.messageBubble,
          isUser ? s.messageBubbleUser : s.messageBubbleAssistant,
          message.isError && s.messageBubbleError,
        ]}>
        <View style={s.messageHeader}>
          <Text style={[s.messageAuthor, isUser ? s.messageAuthorUser : s.messageAuthorAssistant]}>
            {isUser ? 'Voce' : 'Agente'}
          </Text>
          <Text style={[s.messageTime, isUser ? s.messageTimeUser : s.messageTimeAssistant]}>
            {formatMessageTime(message.createdAt)}
          </Text>
        </View>

        <Text style={[s.messageText, isUser ? s.messageTextUser : s.messageTextAssistant]}>
          {message.text}
        </Text>

        {showMeta ? (
          <View style={s.messageMeta}>
            {message.model ? <Text style={s.messageMetaText}>Modelo: {message.model}</Text> : null}
            {message.warnings.length > 0 ? (
              <Text style={s.messageMetaText}>Avisos: {message.warnings.join(' | ')}</Text>
            ) : null}
            {message.disclaimer ? <Text style={s.messageMetaText}>{message.disclaimer}</Text> : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

export function ChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const scrollRef = useRef<ScrollView>(null);

  const [composerText, setComposerText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [lastReply, setLastReply] = useState<ChatReply | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 80);

    return () => clearTimeout(timeoutId);
  }, [messages, sending]);

  async function submitPrompt(rawPrompt: string) {
    const prompt = rawPrompt.trim();

    if (!prompt || sending) {
      return;
    }

    setMessages((current) => [...current, createUserMessage(prompt)]);
    setComposerText('');
    setSending(true);

    try {
      const reply = await sendChatPrompt({
        prompt,
        conversationId,
      });

      setConversationId(reply.conversationId);
      setLastReply(reply);
      setMessages((current) => [...current, createAssistantMessage(reply)]);
    } catch (error: any) {
      setMessages((current) => [
        ...current,
        createAssistantErrorMessage(error?.message ?? 'Nao consegui responder agora.'),
      ]);
    } finally {
      setSending(false);
    }
  }

  function handleSubmit() {
    void submitPrompt(composerText);
  }

  function handlePressQuickAction(action: ChatQuickAction) {
    router.push(action.route as any);
  }

  function startNewConversation() {
    setComposerText('');
    setMessages([]);
    setConversationId(null);
    setLastReply(null);
  }

  const canSend = composerText.trim().length > 0 && !sending;
  const memoryLabel = formatMemoryLabel(lastReply);

  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 18}>
      <View style={[s.root, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={Brand.bg} />
        <View pointerEvents="none" style={s.backgroundOrbTop} />
        <View pointerEvents="none" style={s.backgroundOrbMid} />
        <View pointerEvents="none" style={s.backgroundOrbBottom} />

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={s.heroCard}>
            <View style={s.heroTopRow}>
              <View style={s.heroCopy}>
                <Text style={s.heroEyebrow}>Assistente</Text>
                <Text style={s.heroTitle}>Chat conversacional</Text>
                <Text style={s.heroSubtitle}>
                  Converse com o agente do app sobre alimentacao, refeicoes, rotina e habitos.
                </Text>
              </View>

              <Pressable
                style={({ pressed }) => [
                  s.heroAction,
                  messages.length === 0 && s.heroActionDisabled,
                  pressed && messages.length > 0 && s.pressed,
                ]}
                onPress={startNewConversation}
                disabled={messages.length === 0}>
                <Ionicons name="refresh-outline" size={16} color={messages.length > 0 ? Brand.greenDark : Brand.textMuted} />
                <Text
                  style={[
                    s.heroActionText,
                    messages.length === 0 && s.heroActionTextDisabled,
                  ]}>
                  Nova conversa
                </Text>
              </Pressable>
            </View>

            <View style={s.statusRow}>
              <View style={s.statusDot} />
              <Text style={s.statusText}>
                {memoryLabel ?? `Pronto para conversar com ${user?.username ?? 'voce'}.`}
              </Text>
            </View>
          </View>

          <AppCard style={s.quickActionsCard}>
            <Text style={s.sectionLabel}>Atalhos do chat</Text>
            <Text style={s.sectionText}>
              Abra ferramentas que ja fazem parte do fluxo conversacional sem sair do mesmo estilo do app.
            </Text>
            <ChatQuickActions onPressAction={handlePressQuickAction} />
          </AppCard>

          {messages.length === 0 ? (
            <AppCard style={s.emptyCard}>
              <Text style={s.emptyTitle}>Comece por uma pergunta</Text>
              <Text style={s.emptyText}>
                O agente responde em conversa livre e guarda o contexto da sessao enquanto voce troca mensagens.
              </Text>

              <View style={s.promptGrid}>
                {STARTER_PROMPTS.map((prompt) => (
                  <Pressable
                    key={prompt}
                    style={({ pressed }) => [s.promptChip, pressed && s.pressed]}
                    onPress={() => {
                      void submitPrompt(prompt);
                    }}>
                    <Text style={s.promptChipText}>{prompt}</Text>
                  </Pressable>
                ))}
              </View>
            </AppCard>
          ) : (
            <View style={s.messagesList}>
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}

              {sending ? (
                <View style={s.messageRow}>
                  <View style={[s.messageBubble, s.messageBubbleAssistant, s.typingBubble]}>
                    <View style={s.typingRow}>
                      <ActivityIndicator size="small" color={Brand.greenDark} />
                      <Text style={s.typingText}>Assistente respondendo...</Text>
                    </View>
                  </View>
                </View>
              ) : null}
            </View>
          )}
        </ScrollView>

        <View style={[s.composerShell, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          <View style={s.composerCard}>
            <TextInput
              value={composerText}
              onChangeText={setComposerText}
              placeholder="Pergunte ao agente sobre sua alimentacao."
              placeholderTextColor={Brand.textSecondary}
              multiline
              maxLength={800}
              style={s.composerInput}
            />

            <Pressable
              style={({ pressed }) => [
                s.sendButton,
                !canSend && s.sendButtonDisabled,
                pressed && canSend && s.sendButtonPressed,
              ]}
              onPress={handleSubmit}
              disabled={!canSend}>
              <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: {
    flex: 1,
  },
  root: {
    flex: 1,
    backgroundColor: Brand.bg,
  },
  backgroundOrbTop: {
    position: 'absolute',
    top: -152,
    right: -92,
    width: 272,
    height: 272,
    borderRadius: 136,
    backgroundColor: 'rgba(31,167,80,0.08)',
  },
  backgroundOrbMid: {
    position: 'absolute',
    top: 240,
    left: -98,
    width: 206,
    height: 206,
    borderRadius: 103,
    backgroundColor: 'rgba(45,156,219,0.05)',
  },
  backgroundOrbBottom: {
    position: 'absolute',
    right: -76,
    bottom: 94,
    width: 194,
    height: 194,
    borderRadius: 97,
    backgroundColor: 'rgba(244,166,42,0.07)',
  },
  scroll: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 28,
    gap: 16,
  },
  heroCard: {
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderWidth: 1,
    borderColor: 'rgba(20,108,56,0.08)',
    padding: 18,
    gap: 14,
    ...Shadows.card,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  heroCopy: {
    flex: 1,
    gap: 4,
  },
  heroEyebrow: {
    ...Typography.caption,
    color: Brand.greenDark,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroTitle: {
    ...Typography.title,
    color: Brand.text,
    fontWeight: '800',
  },
  heroSubtitle: {
    ...Typography.body,
    color: Brand.textSecondary,
  },
  heroAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: Radii.pill,
    backgroundColor: Brand.surfaceSoft,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  heroActionDisabled: {
    backgroundColor: Brand.surfaceAlt,
  },
  heroActionText: {
    ...Typography.caption,
    color: Brand.greenDark,
    fontWeight: '800',
  },
  heroActionTextDisabled: {
    color: Brand.textMuted,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Brand.green,
  },
  statusText: {
    ...Typography.helper,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  quickActionsCard: {
    gap: 10,
  },
  sectionLabel: {
    ...Typography.caption,
    color: Brand.textSecondary,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sectionText: {
    ...Typography.body,
    color: Brand.textSecondary,
  },
  emptyCard: {
    gap: 14,
  },
  emptyTitle: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
  },
  emptyText: {
    ...Typography.body,
    color: Brand.textSecondary,
  },
  promptGrid: {
    gap: 10,
  },
  promptChip: {
    borderRadius: 18,
    backgroundColor: '#F8FBF8',
    borderWidth: 1,
    borderColor: Brand.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  promptChipText: {
    ...Typography.body,
    color: Brand.text,
    fontWeight: '700',
  },
  messagesList: {
    gap: 12,
    paddingBottom: 4,
  },
  messageRow: {
    flexDirection: 'row',
  },
  messageRowAssistant: {
    justifyContent: 'flex-start',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    width: '90%',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
    ...Shadows.card,
  },
  messageBubbleAssistant: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(21,32,24,0.08)',
  },
  messageBubbleUser: {
    backgroundColor: Brand.greenDark,
  },
  messageBubbleError: {
    backgroundColor: '#FFF0EC',
    borderColor: '#F7D7CF',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  messageAuthor: {
    ...Typography.caption,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.55,
  },
  messageAuthorAssistant: {
    color: Brand.greenDark,
  },
  messageAuthorUser: {
    color: '#DDF5E4',
  },
  messageTime: {
    ...Typography.caption,
    fontWeight: '700',
  },
  messageTimeAssistant: {
    color: Brand.textMuted,
  },
  messageTimeUser: {
    color: 'rgba(255,255,255,0.78)',
  },
  messageText: {
    ...Typography.body,
  },
  messageTextAssistant: {
    color: Brand.text,
  },
  messageTextUser: {
    color: '#FFFFFF',
  },
  messageMeta: {
    gap: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(21,32,24,0.08)',
  },
  messageMetaText: {
    ...Typography.caption,
    color: Brand.textSecondary,
  },
  typingBubble: {
    paddingVertical: 16,
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  typingText: {
    ...Typography.body,
    color: Brand.textSecondary,
    fontWeight: '700',
  },
  composerShell: {
    paddingHorizontal: 18,
    paddingTop: 10,
    backgroundColor: 'rgba(247,250,247,0.94)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(21,32,24,0.08)',
  },
  composerCard: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Brand.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    ...Shadows.card,
  },
  composerInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    color: Brand.text,
    ...Typography.body,
    textAlignVertical: 'top',
    paddingTop: 4,
    paddingBottom: 4,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Brand.greenDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Brand.textMuted,
  },
  sendButtonPressed: {
    transform: [{ scale: 0.97 }],
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
});
