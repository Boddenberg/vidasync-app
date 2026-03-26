import Ionicons from '@expo/vector-icons/Ionicons';
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

import { Brand, Radii, Shadows, Typography } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { sendChatPrompt } from '@/services/chat';
import type { ChatMessage, ChatReply } from '@/types/chat';

const AGENT_NAME = 'Fitty';
const AGENT_EMOJI = '\u2728';
const COMPOSER_PLACEHOLDER = `Mande uma mensagem para o ${AGENT_NAME}...`;
const WELCOME_MESSAGE = 'Como posso te ajudar hoje?';

const ChatColors = {
  screen: '#EAF2EC',
  header: 'rgba(250, 253, 250, 0.97)',
  headerBorder: 'rgba(21, 32, 24, 0.08)',
  assistantBubble: '#FFFFFF',
  userBubble: '#D9F2E1',
  userText: '#183223',
  accent: '#2E8B57',
  accentSoft: '#E3F3E8',
  composer: '#FDFEFD',
  composerBorder: '#D7E6DB',
  subtleText: '#6D7D72',
};

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

function createWelcomeMessage(createdAt: string): ChatMessage {
  return {
    id: 'chat-welcome',
    role: 'assistant',
    text: WELCOME_MESSAGE,
    createdAt,
    warnings: [],
    disclaimer: null,
    traceId: null,
    intent: null,
    confidence: null,
    model: null,
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

type MessageBubbleProps = {
  message: ChatMessage;
  userDisplayName: string;
};

function MessageBubble({ message, userDisplayName }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const authorName = isUser ? userDisplayName : AGENT_NAME;

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
            {authorName}
          </Text>
          <Text style={[s.messageTime, isUser ? s.messageTimeUser : s.messageTimeAssistant]}>
            {formatMessageTime(message.createdAt)}
          </Text>
        </View>

        <Text style={[s.messageText, isUser ? s.messageTextUser : s.messageTextAssistant]}>
          {message.text}
        </Text>
      </View>
    </View>
  );
}

export function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const scrollRef = useRef<ScrollView>(null);

  const [composerText, setComposerText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [welcomeCreatedAt, setWelcomeCreatedAt] = useState(() => new Date().toISOString());
  const [sending, setSending] = useState(false);

  const userDisplayName = user?.username?.trim() || 'Voce';
  const visibleMessages = messages.length > 0 ? messages : [createWelcomeMessage(welcomeCreatedAt)];
  const canSend = composerText.trim().length > 0 && !sending;
  const canStartNewConversation = !sending && (messages.length > 0 || conversationId !== null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 80);

    return () => clearTimeout(timeoutId);
  }, [messages, sending, welcomeCreatedAt]);

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

  function startNewConversation() {
    if (!canStartNewConversation) {
      return;
    }

    setComposerText('');
    setMessages([]);
    setConversationId(null);
    setWelcomeCreatedAt(new Date().toISOString());
  }

  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 18}>
      <View style={[s.root, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={ChatColors.header} />

        <View style={s.header}>
          <View style={s.headerIdentity}>
            <View style={s.avatar}>
              <Text style={s.avatarEmoji}>{AGENT_EMOJI}</Text>
            </View>

            <Text style={s.headerTitle}>{AGENT_NAME}</Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              s.newConversationButton,
              !canStartNewConversation && s.newConversationButtonDisabled,
              pressed && canStartNewConversation && s.pressed,
            ]}
            onPress={startNewConversation}
            disabled={!canStartNewConversation}>
            <Ionicons
              name="add-outline"
              size={16}
              color={canStartNewConversation ? ChatColors.accent : Brand.textMuted}
            />
            <Text
              style={[
                s.newConversationText,
                !canStartNewConversation && s.newConversationTextDisabled,
              ]}>
              Nova conversa
            </Text>
          </Pressable>
        </View>

        <ScrollView
          ref={scrollRef}
          style={s.scrollView}
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={s.messagesList}>
            {visibleMessages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                userDisplayName={userDisplayName}
              />
            ))}

            {sending ? (
              <View style={s.messageRow}>
                <View style={[s.messageBubble, s.messageBubbleAssistant, s.typingBubble]}>
                  <View style={s.messageHeader}>
                    <Text style={[s.messageAuthor, s.messageAuthorAssistant]}>{AGENT_NAME}</Text>
                    <Text style={[s.messageTime, s.messageTimeAssistant]}>
                      {formatMessageTime(new Date().toISOString())}
                    </Text>
                  </View>

                  <View style={s.typingRow}>
                    <ActivityIndicator size="small" color={ChatColors.accent} />
                    <Text style={s.typingText}>{AGENT_NAME} esta respondendo...</Text>
                  </View>
                </View>
              </View>
            ) : null}
          </View>
        </ScrollView>

        <View style={[s.composerShell, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          <View style={s.composerCard}>
            <TextInput
              value={composerText}
              onChangeText={setComposerText}
              placeholder={COMPOSER_PLACEHOLDER}
              placeholderTextColor={ChatColors.subtleText}
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
    backgroundColor: ChatColors.screen,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: ChatColors.header,
    borderBottomWidth: 1,
    borderBottomColor: ChatColors.headerBorder,
  },
  headerIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ChatColors.accentSoft,
  },
  avatarEmoji: {
    fontSize: 18,
  },
  headerTitle: {
    ...Typography.subtitle,
    color: Brand.text,
    fontWeight: '800',
  },
  newConversationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: Radii.pill,
    backgroundColor: ChatColors.accentSoft,
  },
  newConversationButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  newConversationText: {
    ...Typography.caption,
    color: ChatColors.accent,
    fontWeight: '800',
  },
  newConversationTextDisabled: {
    color: Brand.textMuted,
  },
  scrollView: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 18,
    paddingBottom: 16,
  },
  messagesList: {
    gap: 10,
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
    width: '86%',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
    ...Shadows.card,
  },
  messageBubbleAssistant: {
    backgroundColor: ChatColors.assistantBubble,
    borderWidth: 1,
    borderColor: 'rgba(21, 32, 24, 0.08)',
  },
  messageBubbleUser: {
    backgroundColor: ChatColors.userBubble,
  },
  messageBubbleError: {
    backgroundColor: '#FFF0EC',
    borderWidth: 1,
    borderColor: '#F2D4CB',
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
  },
  messageAuthorAssistant: {
    color: ChatColors.accent,
  },
  messageAuthorUser: {
    color: ChatColors.userText,
  },
  messageTime: {
    ...Typography.caption,
    fontWeight: '700',
  },
  messageTimeAssistant: {
    color: Brand.textMuted,
  },
  messageTimeUser: {
    color: 'rgba(24, 50, 35, 0.68)',
  },
  messageText: {
    ...Typography.body,
  },
  messageTextAssistant: {
    color: Brand.text,
  },
  messageTextUser: {
    color: ChatColors.userText,
  },
  typingBubble: {
    paddingVertical: 14,
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  typingText: {
    ...Typography.body,
    color: Brand.textSecondary,
    fontWeight: '600',
  },
  composerShell: {
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: ChatColors.header,
    borderTopWidth: 1,
    borderTopColor: ChatColors.headerBorder,
  },
  composerCard: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    borderRadius: 24,
    backgroundColor: ChatColors.composer,
    borderWidth: 1,
    borderColor: ChatColors.composerBorder,
    paddingLeft: 16,
    paddingRight: 10,
    paddingTop: 10,
    paddingBottom: 10,
    ...Shadows.soft,
  },
  composerInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    color: Brand.text,
    ...Typography.body,
    textAlignVertical: 'top',
    paddingTop: 4,
    paddingBottom: 4,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ChatColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#A8B8AD',
  },
  sendButtonPressed: {
    transform: [{ scale: 0.97 }],
  },
  pressed: {
    opacity: 0.92,
  },
});
