import { create } from 'zustand';
import { db } from '../db/index.js';

export const useMapStore = create((set) => ({
  spots: [],
  center: [55.75, 37.62],
  zoom: 10,

  loadSpots: async () => {
    const spots = await db.spots.toArray();
    set({ spots });
  },

  addSpot: async (data) => {
    const id = await db.spots.add(data);
    const spot = await db.spots.get(id);
    set((s) => ({ spots: [...s.spots, spot] }));
    return id;
  },

  deleteSpot: async (id) => {
    await db.spots.delete(id);
    set((s) => ({ spots: s.spots.filter((x) => x.id !== id) }));
  },

  setView: (center, zoom) => set({ center, zoom }),
}));
