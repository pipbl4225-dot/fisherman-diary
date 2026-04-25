import { create } from 'zustand';
import { db } from '../db/index.js';

export const useWaterStore = create((set) => ({
  levels: [],
  stationId: 'default',

  loadLevels: async (stationId) => {
    const levels = await db.waterLevels
      .where('stationId').equals(stationId)
      .sortBy('recordedAt');
    set({ levels, stationId });
  },

  addLevel: async (data) => {
    const id = await db.waterLevels.add({ ...data, recordedAt: data.recordedAt ?? new Date().toISOString() });
    const entry = await db.waterLevels.get(id);
    set((s) => ({ levels: [...s.levels, entry] }));
    return id;
  },
}));
