import api from './api';
import { Conversation, Message } from '../types';

export const chatService = {
  getConversations: async (): Promise<Conversation[]> => {
    const response = await api.get('/api/chat/conversations');
    return response.data;
  },

  getMessages: async (
    conversationId: string,
    cursor?: string
  ): Promise<Message[]> => {
    const response = await api.get(
      `/api/chat/conversations/${conversationId}/messages`,
      { params: cursor ? { cursor } : undefined }
    );
    return response.data;
  },

  sendMessage: async (
    conversationId: string,
    content: string
  ): Promise<Message> => {
    const response = await api.post(
      `/api/chat/conversations/${conversationId}/messages`,
      { content }
    );
    return response.data;
  },

  markAsRead: async (conversationId: string): Promise<void> => {
    await api.patch(`/api/chat/conversations/${conversationId}/read`);
  },
};
