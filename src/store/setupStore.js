import { create } from 'zustand';
import { db } from '../db/index.js';

export const useSetupStore = create((set) => ({
  setups: [],

  loadSetups: async () => {
    const setups = await db.setups.toArray();
    set({ setups });
  },

  addSetup: async (data) => {
    const id = await db.setups.add({ ...data, createdAt: new Date().toISOString() });
    const setup = await db.setups.get(id);
    set((s) => ({ setups: [...s.setups, setup] }));
    return id;
  },

  updateSetup: async (id, data) => {
    await db.setups.update(id, data);
    set((s) => ({ setups: s.setups.map((r) => r.id === id ? { ...r, ...data } : r) }));
  },

  deleteSetup: async (id) => {
    await db.setups.delete(id);
    set((s) => ({ setups: s.setups.filter((r) => r.id !== id) }));
  },
}));
