import { create } from 'zustand';
import { Conversation, Message } from '../types';
import { chatService } from '../services/chat.service';

interface ChatState {
  conversations: Conversation[];
  activeMessages: Message[];
  unreadCount: number;
  isLoading: boolean;
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
  setUnreadCount: (count: number) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeMessages: [],
  unreadCount: 0,
  isLoading: false,

  fetchConversations: async () => {
    set({ isLoading: true });
    try {
      const conversations = await chatService.getConversations();
      set({ conversations, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchMessages: async (conversationId: string) => {
    set({ isLoading: true });
    try {
      const messages = await chatService.getMessages(conversationId);
      set({ activeMessages: messages, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  sendMessage: async (conversationId: string, content: string) => {
    try {
      const message = await chatService.sendMessage(conversationId, content);
      set({ activeMessages: [...get().activeMessages, message] });
    } catch {
      // Message send failed
    }
  },

  markAsRead: async (conversationId: string) => {
    try {
      await chatService.markAsRead(conversationId);
      const { unreadCount } = get();
      if (unreadCount > 0) {
        set({ unreadCount: unreadCount - 1 });
      }
    } catch {
      // Ignore read status errors
    }
  },

  setUnreadCount: (count: number) => {
    set({ unreadCount: count });
  },
}));
