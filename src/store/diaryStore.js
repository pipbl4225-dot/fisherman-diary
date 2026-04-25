import { create } from 'zustand';
import { db } from '../db/index.js';

export const useDiaryStore = create((set) => ({
  sessions: [],
  activeSession: null,

  loadSessions: async () => {
    const sessions = await db.sessions.orderBy('date').reverse().toArray();
    set({ sessions });
  },

  addSession: async (data) => {
    const id = await db.sessions.add({ ...data, date: data.date ?? new Date().toISOString() });
    const session = await db.sessions.get(id);
    set((s) => ({ sessions: [session, ...s.sessions] }));
    return id;
  },

  deleteSession: async (id) => {
    await db.sessions.delete(id);
    await db.catches.where('sessionId').equals(id).delete();
    set((s) => ({ sessions: s.sessions.filter((x) => x.id !== id) }));
  },

  setActiveSession: (session) => set({ activeSession: session }),
}));
