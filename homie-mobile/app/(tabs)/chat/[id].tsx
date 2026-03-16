import { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useChatStore } from '../../../store/chatStore';
import { useAuthStore } from '../../../store/authStore';
import { getSocket } from '../../../services/socket';
import { COLORS } from '../../../utils/constants';
import type { Message } from '../../../types';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeMessages, isLoading, fetchMessages, sendMessage, markAsRead } =
    useChatStore();
  const { user } = useAuthStore();
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (id) {
      fetchMessages(id);
      markAsRead(id);
    }
  }, [id]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !id) return;

    socket.emit('chat:join', id);

    const handleNewMessage = (data: { conversationId: string; message: Message }) => {
      if (data.conversationId === id) {
        useChatStore.setState((state) => ({
          activeMessages: [...state.activeMessages, data.message],
        }));
        markAsRead(id);
      }
    };

    const handleTyping = (data: { conversationId: string; userId: string }) => {
      if (data.conversationId === id && data.userId !== user?.id) {
        setOtherUserTyping(true);
      }
    };

    const handleStopTyping = (data: { conversationId: string; userId: string }) => {
      if (data.conversationId === id && data.userId !== user?.id) {
        setOtherUserTyping(false);
      }
    };

    socket.on('chat:newMessage', handleNewMessage);
    socket.on('chat:typing', handleTyping);
    socket.on('chat:stopTyping', handleStopTyping);

    return () => {
      socket.emit('chat:leave', id);
      socket.off('chat:newMessage', handleNewMessage);
      socket.off('chat:typing', handleTyping);
      socket.off('chat:stopTyping', handleStopTyping);
    };
  }, [id, user?.id]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || !id) return;

    setInputText('');
    const socket = getSocket();
    if (socket) {
      socket.emit('chat:stopTyping', id);
    }

    try {
      await sendMessage(id, text);
    } catch {
      // Message failed
    }
  }, [inputText, id, sendMessage]);

  const handleTextChange = (text: string) => {
    setInputText(text);
    const socket = getSocket();
    if (!socket || !id) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('chat:typing', id);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('chat:stopTyping', id);
    }, 2000);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMine = item.senderId === user?.id;

    return (
      <View
        style={[
          styles.messageBubbleContainer,
          isMine ? styles.messageMine : styles.messageTheirs,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isMine ? styles.bubbleMine : styles.bubbleTheirs,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isMine ? styles.messageTextMine : styles.messageTextTheirs,
            ]}
          >
            {item.content}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isMine ? styles.messageTimeMine : styles.messageTimeTheirs,
            ]}
          >
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Chat',
          headerBackTitle: 'Back',
          headerTintColor: COLORS.primary,
          headerStyle: { backgroundColor: COLORS.surface },
          headerTitleStyle: { color: COLORS.text, fontWeight: '600' },
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={activeMessages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            inverted
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              otherUserTyping ? (
                <View style={styles.typingIndicator}>
                  <Text style={styles.typingText}>typing...</Text>
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <Text style={styles.emptyChatText}>
                  Start the conversation!
                </Text>
              </View>
            }
          />
        )}

        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor={COLORS.textLight}
            value={inputText}
            onChangeText={handleTextChange}
            multiline
            maxLength={2000}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !inputText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim()}
            activeOpacity={0.7}
          >
            <Ionicons
              name="send"
              size={20}
              color={inputText.trim() ? COLORS.surface : COLORS.textLight}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },
  messageBubbleContainer: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  messageMine: {
    justifyContent: 'flex-end',
  },
  messageTheirs: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleMine: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextMine: {
    color: COLORS.surface,
  },
  messageTextTheirs: {
    color: COLORS.text,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  messageTimeMine: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  messageTimeTheirs: {
    color: COLORS.textLight,
  },
  typingIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  typingText: {
    fontSize: 13,
    color: COLORS.textLight,
    fontStyle: 'italic',
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
    transform: [{ scaleY: -1 }],
  },
  emptyChatText: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.border,
  },
});
