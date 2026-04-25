import { create } from 'zustand';
import { db } from '../db/index.js';

export const useTackleStore = create((set) => ({
  tackles: [],

  loadTackles: async () => {
    const tackles = await db.tackles.toArray();
    set({ tackles });
  },

  addTackle: async (data) => {
    const id = await db.tackles.add(data);
    const tackle = await db.tackles.get(id);
    set((s) => ({ tackles: [...s.tackles, tackle] }));
    return id;
  },

  deleteTackle: async (id) => {
    await db.tackles.delete(id);
    set((s) => ({ tackles: s.tackles.filter((x) => x.id !== id) }));
  },
}));
