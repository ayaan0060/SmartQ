import { create } from 'zustand';

export const useQueueStore = create((set, get) => ({
  tokens: [],
  completedCount: 0,
  connected: false,
  lastUpdate: null,

  setTokens: (tokens) => set({
    tokens,
    completedCount: tokens.filter(t => t.status === 'completed').length,
    lastUpdate: Date.now(),
  }),

  addToken: (token) => set((state) => {
    if (state.tokens.find(t => t._id === token._id)) return state;
    return { tokens: [...state.tokens, token], lastUpdate: Date.now() };
  }),

  updateToken: (updated) => set((state) => {
    const terminal = ['completed', 'skipped', 'cancelled'];
    if (terminal.includes(updated.status)) {
      return {
        tokens: state.tokens.filter(t => t._id !== updated._id),
        completedCount: updated.status === 'completed' ? state.completedCount + 1 : state.completedCount,
        lastUpdate: Date.now(),
      };
    }
    return {
      tokens: state.tokens.map(t => t._id === updated._id ? { ...t, ...updated } : t),
      lastUpdate: Date.now(),
    };
  }),

  removeToken: ({ _id }) => set((state) => ({
    tokens: state.tokens.filter(t => t._id !== _id),
    lastUpdate: Date.now(),
  })),

  setConnected: (connected) => set({ connected }),

  getWaiting: () => get().tokens.filter(t => t.status === 'waiting')
    .sort((a, b) => {
      const prio = { emergency: 3, high: 2, normal: 1 };
      return (prio[b.priority] || 1) - (prio[a.priority] || 1);
    }),

  getInProgress: () => get().tokens.find(t => t.status === 'in-progress'),
}));
