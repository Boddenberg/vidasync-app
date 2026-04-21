import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { sendChatPrompt } from '@/services/chat';
import type { ChatMessage, ChatReply } from '@/types/chat';

import { ChatComposer } from './chat-composer';
import { ChatEmptyState } from './chat-empty-state';
import { ChatHeroHeader } from './chat-hero-header';
import { ChatMessageBubble } from './chat-message-bubble';
import { ChatTypingIndicator } from './chat-typing-indicator';

const AGENT_NAME = 'Fitty';
const AGENT_SUBTITLE = 'Nutrição IA • online';
const COMPOSER_PLACEHOLDER = 'Mande uma mensagem para a Fitty...';

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

export function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const [composerText, setComposerText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const userDisplayName = user?.username?.trim() || 'Você';
  const isEmpty = messages.length === 0 && !sending;
  const canStartNewConversation = !sending && (messages.length > 0 || conversationId !== null);

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
      setMessages((current) => [...current, createAssistantMessage(reply)]);
    } catch (error: any) {
      setMessages((current) => [
        ...current,
        createAssistantErrorMessage(error?.message ?? 'Não consegui responder agora.'),
      ]);
    } finally {
      setSending(false);
    }
  }

  function handleSubmit() {
    void submitPrompt(composerText);
  }

  function handleSuggestionPress(prompt: string) {
    void submitPrompt(prompt);
  }

  function startNewConversation() {
    if (!canStartNewConversation) {
      return;
    }

    setComposerText('');
    setMessages([]);
    setConversationId(null);
  }

  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 18}>
      <View style={[s.root, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={Brand.bg} />

        {/* Ambient orbs */}
        <View pointerEvents="none" style={s.orbTopLeft} />
        <View pointerEvents="none" style={s.orbMidRight} />
        <View pointerEvents="none" style={s.orbBottom} />

        <ChatHeroHeader
          agentName={AGENT_NAME}
          subtitle={AGENT_SUBTITLE}
          canStartNew={canStartNewConversation}
          onStartNew={startNewConversation}
          online
        />

        <ScrollView
          ref={scrollRef}
          bounces
          alwaysBounceVertical={false}
          contentInsetAdjustmentBehavior="never"
          overScrollMode="never"
          style={s.scrollView}
          contentContainerStyle={[
            s.scroll,
            isEmpty && s.scrollEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {isEmpty ? (
            <ChatEmptyState userName={userDisplayName} onSuggestionPress={handleSuggestionPress} />
          ) : (
            <View style={s.messagesList}>
              {messages.map((message) => (
                <ChatMessageBubble key={message.id} message={message} />
              ))}
              {sending ? <ChatTypingIndicator /> : null}
            </View>
          )}
        </ScrollView>

        <View style={{ paddingBottom: Math.max(insets.bottom, 8) }}>
          <ChatComposer
            ref={inputRef}
            value={composerText}
            onChangeText={setComposerText}
            onSubmit={handleSubmit}
            disabled={sending}
            placeholder={COMPOSER_PLACEHOLDER}
          />
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
  orbTopLeft: {
    position: 'absolute',
    top: -160,
    left: -120,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(31,167,80,0.14)',
  },
  orbMidRight: {
    position: 'absolute',
    top: 220,
    right: -140,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(244,166,42,0.09)',
  },
  orbBottom: {
    position: 'absolute',
    left: -100,
    bottom: 80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(45,156,219,0.08)',
  },
  scrollView: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 12,
  },
  scrollEmpty: {
    justifyContent: 'center',
    paddingTop: 8,
  },
  messagesList: {
    gap: 12,
    paddingBottom: 4,
  },
});
