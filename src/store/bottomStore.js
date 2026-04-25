import { create } from 'zustand';
import { db } from '../db/index.js';

export const useBottomStore = create((set) => ({
  soundings: [],
  activeSpotId: null,

  loadSoundings: async (spotId) => {
    const soundings = await db.soundings.where('spotId').equals(spotId).toArray();
    set({ soundings, activeSpotId: spotId });
  },

  addSounding: async (data) => {
    const id = await db.soundings.add({ ...data, recordedAt: data.recordedAt ?? new Date().toISOString() });
    const sounding = await db.soundings.get(id);
    set((s) => ({ soundings: [...s.soundings, sounding] }));
    return id;
  },

  clearSoundings: () => set({ soundings: [], activeSpotId: null }),
}));
