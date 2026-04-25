import { create } from 'zustand';
import { db } from '../db/index.js';

export const useRigStore = create((set) => ({
  rigs: [],

  loadRigs: async () => {
    const rigs = await db.rigs.toArray();
    set({ rigs });
  },

  addRig: async (data) => {
    const id = await db.rigs.add({ ...data, createdAt: new Date().toISOString() });
    const rig = await db.rigs.get(id);
    set((s) => ({ rigs: [...s.rigs, rig] }));
    return id;
  },

  updateRig: async (id, data) => {
    await db.rigs.update(id, data);
    set((s) => ({ rigs: s.rigs.map((r) => r.id === id ? { ...r, ...data } : r) }));
  },

  deleteRig: async (id) => {
    await db.rigs.delete(id);
    set((s) => ({ rigs: s.rigs.filter((r) => r.id !== id) }));
  },
}));
