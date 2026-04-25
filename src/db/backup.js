import { db } from './index.js';

export async function exportAll() {
  const [sessions, catches, tackles, spots, soundings, waterLevels] = await Promise.all([
    db.sessions.toArray(),
    db.catches.toArray(),
    db.tackles.toArray(),
    db.spots.toArray(),
    db.soundings.toArray(),
    db.waterLevels.toArray(),
  ]);
  return { exportedAt: new Date().toISOString(), sessions, catches, tackles, spots, soundings, waterLevels };
}

export async function importAll(data) {
  await db.transaction('rw',
    [db.sessions, db.catches, db.tackles, db.spots, db.soundings, db.waterLevels],
    async () => {
      await Promise.all([
        db.sessions.clear(), db.catches.clear(), db.tackles.clear(),
        db.spots.clear(), db.soundings.clear(), db.waterLevels.clear(),
      ]);
      if (data.sessions?.length)    await db.sessions.bulkAdd(data.sessions);
      if (data.catches?.length)     await db.catches.bulkAdd(data.catches);
      if (data.tackles?.length)     await db.tackles.bulkAdd(data.tackles);
      if (data.spots?.length)       await db.spots.bulkAdd(data.spots);
      if (data.soundings?.length)   await db.soundings.bulkAdd(data.soundings);
      if (data.waterLevels?.length) await db.waterLevels.bulkAdd(data.waterLevels);
    },
  );
}
