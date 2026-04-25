import Dexie from 'dexie';

export const db = new Dexie('fisherman-diary');

db.version(1).stores({
  sessions:  '++id, date, locationName, lat, lng, weather, notes',
  catches:   '++id, sessionId, species, weight, length, bait, tackle, time',
  tackles:   '++id, name, type, brand, weight, color, notes',
  spots:     '++id, name, lat, lng, depth, notes',
  soundings: '++id, spotId, lat, lng, depth, recordedAt',
  waterLevels: '++id, stationId, level, flow, recordedAt',
});
