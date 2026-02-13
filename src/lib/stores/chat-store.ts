import { create } from "zustand";
import { persist } from "zustand/middleware";

interface RecentConversation {
  id: string;
  title: string;
  updatedAt: string;
}

interface ChatState {
  isOpen: boolean;
  conversationId: string | null;
  recentConversations: RecentConversation[];
  toggleChat: () => void;
  setOpen: (open: boolean) => void;
  setConversationId: (id: string | null) => void;
  addRecentConversation: (conv: RecentConversation) => void;
  startNewConversation: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      isOpen: false,
      conversationId: null,
      recentConversations: [],
      toggleChat: () => set((s) => ({ isOpen: !s.isOpen })),
      setOpen: (open) => set({ isOpen: open }),
      setConversationId: (id) => set({ conversationId: id }),
      addRecentConversation: (conv) =>
        set((s) => ({
          recentConversations: [
            conv,
            ...s.recentConversations.filter((c) => c.id !== conv.id),
          ].slice(0, 20),
        })),
      startNewConversation: () => set({ conversationId: null }),
    }),
    {
      name: "cf365-chat",
      version: 1,
      partialize: (state) => ({
        conversationId: state.conversationId,
        recentConversations: state.recentConversations,
      }),
    }
  )
);
