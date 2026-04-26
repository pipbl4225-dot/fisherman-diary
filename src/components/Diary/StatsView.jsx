import { useEffect, useState } from 'react';
import { db } from '../../db/index.js';
import { useDiaryStore } from '../../store/diaryStore.js';
import { FISHING_TYPES } from '../../utils/fishingTips.js';
import styles from './StatsView.module.css';

function monthName(n) {
  return ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'][n];
}

export default function StatsView() {
  const { sessions } = useDiaryStore();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!sessions.length) { setStats({}); return; }

    db.catches.toArray().then((allRows) => {
      const real = allRows.filter((c) => !c.type || c.type === 'catch');

      // Итого
      const totalWeight = real.reduce((s, c) => s + (c.weight ?? 0), 0);

      // Лучший улов
      const best = real.reduce((b, c) => (c.weight ?? 0) > (b?.weight ?? 0) ? c : b, null);
      const bestSession = best ? sessions.find((s) => s.id === best.sessionId) : null;

      // Виды рыб
      const specMap = {};
      real.forEach((c) => {
        if (c.species) specMap[c.species] = (specMap[c.species] ?? 0) + 1;
      });
      const topSpecies = Object.entries(specMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);

      // Лучшие места
      const spotMap = {};
      sessions.forEach((s) => {
        const loc = s.locationName || 'Неизвестно';
        if (!spotMap[loc]) spotMap[loc] = { sessions: 0, catches: 0 };
        spotMap[loc].sessions += 1;
      });
      real.forEach((c) => {
        const s = sessions.find((x) => x.id === c.sessionId);
        const loc = s?.locationName || 'Неизвестно';
        if (spotMap[loc]) spotMap[loc].catches += 1;
      });
      const topSpots = Object.entries(spotMap)
        .sort((a, b) => b[1].catches - a[1].catches)
        .slice(0, 5);

      // По месяцам (текущий год)
      const year = new Date().getFullYear();
      const monthly = Array(12).fill(0);
      real.forEach((c) => {
        const s = sessions.find((x) => x.id === c.sessionId);
        if (!s) return;
        const d = new Date(s.date);
        if (d.getFullYear() === year) monthly[d.getMonth()] += 1;
      });
      const maxM = Math.max(...monthly, 1);

      // По виду ловли
      const ftMap = {};
      sessions.forEach((s) => {
        if (s.fishingType) ftMap[s.fishingType] = (ftMap[s.fishingType] ?? 0) + 1;
      });
      const topFt = Object.entries(ftMap).sort((a, b) => b[1] - a[1]).slice(0, 4);

      // События за все сессии
      const events = allRows.filter((c) => c.type && c.type !== 'catch' && c.type !== 'weather' && c.type !== 'note');
      const bites  = events.filter((c) => c.type === 'bite').length;
      const losses = events.filter((c) => c.type === 'loss').length;
      const breaks = events.filter((c) => c.type === 'break').length;

      setStats({ totalWeight, best, bestSession, topSpecies, topSpots, monthly, maxM, topFt, bites, losses, breaks });
    });
  }, [sessions]);

  if (!stats) return <p className={styles.loading}>Загрузка статистики…</p>;

  const totalCatches = stats.topSpecies?.reduce((s, [, n]) => s + n, 0) ?? 0;

  return (
    <div className={styles.wrap}>

      {/* ── Сводка ── */}
      <div className={styles.summary}>
        <div className={styles.sumCard}>
          <span className={styles.sumVal}>{sessions.length}</span>
          <span className={styles.sumLabel}>рыбалок</span>
        </div>
        <div className={styles.sumCard}>
          <span className={styles.sumVal}>{totalCatches}</span>
          <span className={styles.sumLabel}>поймано</span>
        </div>
        <div className={styles.sumCard}>
          <span className={styles.sumVal}>{stats.totalWeight > 0 ? `${stats.totalWeight.toFixed(1)}` : '—'}</span>
          <span className={styles.sumLabel}>кг всего</span>
        </div>
        <div className={styles.sumCard}>
          <span className={styles.sumVal}>{stats.bites}</span>
          <span className={styles.sumLabel}>поклёвок</span>
        </div>
      </div>

      {/* ── Лучший улов ── */}
      {stats.best?.weight && (
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>🏆 Лучший улов</h4>
          <div className={styles.bestCard}>
            <span className={styles.bestFish}>{stats.best.species}</span>
            <span className={styles.bestWeight}>{stats.best.weight} кг</span>
            {stats.bestSession && (
              <span className={styles.bestDate}>
                {new Date(stats.bestSession.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                {stats.bestSession.locationName ? `, ${stats.bestSession.locationName}` : ''}
              </span>
            )}
          </div>
        </section>
      )}

      {/* ── По месяцам ── */}
      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>📅 Улов по месяцам ({new Date().getFullYear()})</h4>
        <div className={styles.monthChart}>
          {stats.monthly?.map((cnt, i) => (
            <div key={i} className={styles.monthCol}>
              <div className={styles.monthBar} style={{ height: `${Math.round((cnt / stats.maxM) * 60)}px` }}>
                {cnt > 0 && <span className={styles.monthCnt}>{cnt}</span>}
              </div>
              <span className={styles.monthName}>{monthName(i)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Виды рыб ── */}
      {stats.topSpecies?.length > 0 && (
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>🐟 Виды рыб</h4>
          <ul className={styles.rankList}>
            {stats.topSpecies.map(([sp, cnt], i) => (
              <li key={sp} className={styles.rankItem}>
                <span className={styles.rankPos}>#{i + 1}</span>
                <span className={styles.rankName}>{sp}</span>
                <div className={styles.rankBar}>
                  <div className={styles.rankFill}
                    style={{ width: `${Math.round((cnt / stats.topSpecies[0][1]) * 100)}%` }} />
                </div>
                <span className={styles.rankCnt}>{cnt}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Лучшие места ── */}
      {stats.topSpots?.length > 0 && (
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>📍 Места</h4>
          <ul className={styles.rankList}>
            {stats.topSpots.map(([loc, d], i) => (
              <li key={loc} className={styles.rankItem}>
                <span className={styles.rankPos}>#{i + 1}</span>
                <span className={styles.rankName}>{loc}</span>
                <span className={styles.rankMeta}>{d.sessions} выезд{d.sessions === 1 ? '' : 'а'}</span>
                <span className={styles.rankCnt}>🐟 {d.catches}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Вид ловли ── */}
      {stats.topFt?.length > 0 && (
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>🎣 Вид ловли</h4>
          <ul className={styles.ftList}>
            {stats.topFt.map(([id, cnt]) => {
              const ft = FISHING_TYPES.find((t) => t.id === id);
              return ft ? (
                <li key={id} className={styles.ftItem}>
                  <span>{ft.emoji} {ft.label}</span>
                  <span className={styles.ftCnt}>{cnt}</span>
                </li>
              ) : null;
            })}
          </ul>
        </section>
      )}

      {/* ── События ── */}
      {(stats.bites > 0 || stats.losses > 0 || stats.breaks > 0) && (
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>📊 События</h4>
          <div className={styles.evtRow}>
            <div className={styles.evtCard}><span className={styles.evtVal}>{stats.bites}</span><span>🎯 поклёвок</span></div>
            <div className={styles.evtCard}><span className={styles.evtVal}>{stats.losses}</span><span>💨 сходов</span></div>
            <div className={styles.evtCard}><span className={styles.evtVal}>{stats.breaks}</span><span>✂️ обрывов</span></div>
          </div>
          {stats.bites > 0 && (
            <p className={styles.evtHint}>
              Реализация поклёвок: {Math.round((totalCatches / stats.bites) * 100)}%
            </p>
          )}
        </section>
      )}

    </div>
  );
}
