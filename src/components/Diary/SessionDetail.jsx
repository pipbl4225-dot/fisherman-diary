import { useEffect, useState } from 'react';
import { db }            from '../../db/index.js';
import { useDiaryStore } from '../../store/diaryStore.js';
import { FISHING_TYPES, TIPS } from '../../utils/fishingTips.js';
import { fetchWeather, weatherStr } from '../../utils/weather.js';
import CatchForm from './CatchForm.jsx';
import styles from './SessionDetail.module.css';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

const TODAY = new Date().toISOString().slice(0, 10);

const EVENT_META = {
  bite:    { emoji: '🎯', label: 'Поклёвка'         },
  loss:    { emoji: '💨', label: 'Сход'              },
  break:   { emoji: '✂️',  label: 'Обрыв'            },
  note:    { emoji: '📝', label: 'Заметка'           },
  catch:   { emoji: '✅', label: 'Поймал'            },
  weather: { emoji: '🌤', label: 'Погода изменилась' },
};

function elapsed(date, timeStart) {
  if (!timeStart) return '';
  const start = new Date(`${date}T${timeStart}`);
  const diff  = Date.now() - start;
  if (diff < 0) return '';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}ч ${m}мин` : `${m} мин`;
}

export default function SessionDetail({ session, onBack }) {
  const { deleteSession, loadSessions } = useDiaryStore();

  const [catches,   setCatches]   = useState([]);
  const [showForm,  setShowForm]  = useState(false);
  const [showTips,  setShowTips]  = useState(false);
  const [spotPhoto, setSpotPhoto] = useState(null);
  const [timer,     setTimer]     = useState('');
  const [isLive,    setIsLive]    = useState(
    session.date === TODAY && !session.timeEnd
  );

  const ft   = FISHING_TYPES.find((t) => t.id === session.fishingType);
  const tips = session.fishingType ? TIPS[session.fishingType] : null;

  const loadCatches = async () => {
    const rows = await db.catches.where('sessionId').equals(session.id).sortBy('time');
    setCatches(rows);
  };

  useEffect(() => { loadCatches(); }, [session.id]);

  useEffect(() => {
    if (!session.spotId) return;
    db.spots.get(session.spotId).then((s) => { if (s?.photo) setSpotPhoto(s.photo); });
  }, [session.spotId]);

  // Таймер живой сессии
  useEffect(() => {
    if (!isLive) return;
    const tick = () => setTimer(elapsed(session.date, session.timeStart));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [isLive, session.date, session.timeStart]);

  // Авто-запись изменений погоды во время сессии
  useEffect(() => {
    if (!isLive) return;

    let coords = null;
    let lastW = typeof session.weather === 'object' && session.weather ? { ...session.weather } : null;

    const getCoords = async () => {
      if (coords) return coords;
      if (session.spotId) {
        const spot = await db.spots.get(session.spotId);
        if (spot?.lat && spot?.lng) { coords = { lat: spot.lat, lng: spot.lng }; return coords; }
      }
      return new Promise((resolve) => {
        if (!navigator.geolocation) { resolve(null); return; }
        navigator.geolocation.getCurrentPosition(
          (p) => { coords = { lat: p.coords.latitude, lng: p.coords.longitude }; resolve(coords); },
          () => resolve(null),
          { timeout: 6000 }
        );
      });
    };

    const check = async () => {
      const c = await getCoords();
      if (!c) return;
      try {
        const w = await fetchWeather(c.lat, c.lng);
        if (lastW) {
          const tempDiff = Math.abs((w.temp ?? 0) - (lastW.temp ?? 0));
          const windDiff = Math.abs((w.wind ?? 0) - (lastW.wind ?? 0));
          const condChg  = w.condition !== lastW.condition;
          if (tempDiff >= 2 || windDiff >= 2 || condChg) {
            await db.catches.add({
              sessionId:   session.id,
              type:        'weather',
              catchTime:   new Date().toTimeString().slice(0, 5),
              time:        new Date().toISOString(),
              weatherData: w,
              species: null, weight: null, length: null,
              bait: null, tackle: null, photo: null, photoX: null, photoY: null,
            });
            loadCatches();
          }
        }
        lastW = w;
      } catch (_) {}
    };

    const delay = setTimeout(check, 60_000);
    const id    = setInterval(check, 20 * 60_000);
    return () => { clearTimeout(delay); clearInterval(id); };
  }, [isLive, session.spotId, session.id, session.weather]);

  // Быстрое событие
  const logEvent = async (type) => {
    await db.catches.add({
      sessionId: session.id,
      type,
      catchTime: new Date().toTimeString().slice(0, 5),
      time:      new Date().toISOString(),
      species:   null, weight: null, length: null,
      bait: null, tackle: null, photo: null, photoX: null, photoY: null,
    });
    loadCatches();
  };

  // Завершить сессию
  const endSession = async () => {
    const timeEnd = new Date().toTimeString().slice(0, 5);
    await db.sessions.update(session.id, { timeEnd });
    await loadSessions();
    setIsLive(false);
  };

  const handleDelete = async () => {
    if (!confirm('Удалить запись и весь улов?')) return;
    await deleteSession(session.id);
    onBack();
  };

  const handleDeleteCatch = async (id) => {
    await db.catches.delete(id);
    loadCatches();
  };

  // Разделяем: улов и события
  const realCatches = catches.filter((c) => !c.type || c.type === 'catch');
  const events      = catches.filter((c) => c.type && c.type !== 'catch');
  const allSorted   = [...catches].sort((a, b) => (a.catchTime ?? '').localeCompare(b.catchTime ?? ''));

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <button className={styles.back} onClick={onBack}>← Назад</button>
        {isLive && (
          <button className={styles.endBtn} onClick={endSession}>⏹ Завершить</button>
        )}
        {!isLive && <button className={styles.danger} onClick={handleDelete}>Удалить</button>}
      </header>

      {/* ── Живая сессия ─────────────────────────────────── */}
      {isLive && (
        <div className={styles.liveHeader}>
          <div className={styles.livePulse} />
          <span className={styles.liveLabel}>Активная сессия</span>
          {timer && <span className={styles.liveTimer}>{timer}</span>}
        </div>
      )}

      {/* ── Мета ─────────────────────────────────────────── */}
      <div className={styles.meta}>
        <h2>{session.locationName || 'Место не указано'}</h2>
        <div className={styles.metaRow}>
          <span className={styles.date}>{formatDate(session.date)}</span>
          {session.timeStart && (
            <span className={styles.time}>
              {session.timeStart}{session.timeEnd ? ` – ${session.timeEnd}` : ''}
            </span>
          )}
          {ft && <span className={styles.ftBadge}>{ft.emoji} {ft.label}</span>}
        </div>
        {session.weather && (
          <div className={styles.weatherBlock}>
            {typeof session.weather === 'object' ? (
              <div className={styles.weatherGrid}>
                {session.weather.emoji    && <span className={styles.wEmoji}>{session.weather.emoji}</span>}
                {session.weather.condition && <span>{session.weather.condition}</span>}
                {session.weather.temp  != null && <span>🌡 {session.weather.temp > 0 ? '+' : ''}{session.weather.temp}°C</span>}
                {session.weather.wind  != null && <span>💨 {session.weather.windDir} {session.weather.wind} м/с</span>}
                {session.weather.pressure      && <span>🔵 {session.weather.pressure} гПа</span>}
              </div>
            ) : (
              <p className={styles.weather}>🌤 {session.weather}</p>
            )}
          </div>
        )}
        {session.notes && <p className={styles.notes}>{session.notes}</p>}
      </div>

      {/* ── Советы ───────────────────────────────────────── */}
      {tips && (
        <section className={styles.tipsSection}>
          <button className={styles.tipsToggle} onClick={() => setShowTips((v) => !v)}>
            📋 Советы: {tips.label} {showTips ? '▲' : '▼'}
          </button>
          {showTips && (
            <div className={styles.tipsBody}>
              {tips.sections.map((sec) => (
                <div key={sec.title} className={styles.tipsGroup}>
                  <h4 className={styles.tipsGroupTitle}>{sec.title}</h4>
                  <ul className={styles.tipsList}>
                    {sec.items.map((item, i) => <li key={i} className={styles.tipItem}>{item}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Живые кнопки событий ─────────────────────────── */}
      {isLive && (
        <section className={styles.eventBtns}>
          <button className={styles.evtCatch} onClick={() => setShowForm(true)}>✅ Поймал</button>
          <button className={styles.evtBite}  onClick={() => logEvent('bite')}>🎯 Поклёвка</button>
          <button className={styles.evtLoss}  onClick={() => logEvent('loss')}>💨 Сход</button>
          <button className={styles.evtBreak} onClick={() => logEvent('break')}>✂️ Обрыв</button>
        </section>
      )}

      {/* ── Тайм-лайн (живая сессия) ─────────────────────── */}
      {isLive && allSorted.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionH}>Лог</h3>
          <ul className={styles.timeline}>
            {allSorted.map((c) => {
              const isC   = !c.type || c.type === 'catch';
              const isW   = c.type === 'weather';
              const meta  = EVENT_META[c.type ?? 'catch'] ?? EVENT_META.catch;
              const liCls = isC ? styles.tlCatch : isW ? styles.tlWeather : styles.tlEvent;
              return (
                <li key={c.id} className={`${styles.tlItem} ${liCls}`}>
                  <span className={styles.tlTime}>{c.catchTime}</span>
                  <span className={styles.tlEmoji}>{meta.emoji}</span>
                  <span className={styles.tlText}>
                    {isC
                      ? [c.species, c.weight && `${c.weight} кг`, c.length && `${c.length} см`, c.bait && `— ${c.bait}`].filter(Boolean).join(' ')
                      : c.type === 'weather' && c.weatherData
                        ? weatherStr(c.weatherData)
                        : meta.label}
                  </span>
                  <button className={styles.tlDel} onClick={() => handleDeleteCatch(c.id)}>✕</button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* ── Улов (завершённые сессии) ─────────────────────── */}
      {!isLive && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3>Улов</h3>
            <button onClick={() => setShowForm(true)}>+ Рыба</button>
          </div>

          {/* Фото с метками поклёвок */}
          {spotPhoto && realCatches.some((c) => c.photoX != null) && (
            <div className={styles.catchPhotoWrap}>
              <img src={spotPhoto} className={styles.catchPhoto} alt="место" />
              {realCatches.filter((c) => c.photoX != null).map((c) => (
                <div key={c.id} className={styles.catchPin}
                  style={{ left: `${c.photoX}%`, top: `${c.photoY}%` }} title={c.species}>
                  🐟
                </div>
              ))}
            </div>
          )}

          {realCatches.length === 0 ? (
            <p className={styles.empty}>Улов не добавлен.</p>
          ) : (
            <ul className={styles.catchList}>
              {realCatches.map((c) => (
                <li key={c.id} className={styles.catchItem}>
                  {c.photo && <img src={c.photo} className={styles.catchThumb} alt="" />}
                  <div className={styles.catchMain}>
                    <div className={styles.catchTop}>
                      <span className={styles.species}>{c.species}</span>
                      {c.catchTime && <span className={styles.catchTime}>{c.catchTime}</span>}
                    </div>
                    <div className={styles.catchMeta}>
                      {c.weight && <span>{c.weight} кг</span>}
                      {c.length && <span>{c.length} см</span>}
                      {c.bait   && <span>🪱 {c.bait}</span>}
                      {c.tackle && <span>🎣 {c.tackle}</span>}
                      {c.photoX != null && <span>📍 на фото</span>}
                    </div>
                  </div>
                  <button className={styles.deleteCatch} onClick={() => handleDeleteCatch(c.id)}>✕</button>
                </li>
              ))}
            </ul>
          )}

          {/* Лог событий (если были) */}
          {events.length > 0 && (
            <ul className={styles.timeline} style={{ marginTop: 12 }}>
              {events.map((c) => {
                const meta = EVENT_META[c.type] ?? EVENT_META.catch;
                return (
                  <li key={c.id} className={`${styles.tlItem} ${styles.tlEvent}`}>
                    <span className={styles.tlTime}>{c.catchTime}</span>
                    <span className={styles.tlEmoji}>{meta.emoji}</span>
                    <span className={styles.tlText}>{meta.label}</span>
                    <button className={styles.tlDel} onClick={() => handleDeleteCatch(c.id)}>✕</button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {showForm && (
        <CatchForm
          sessionId={session.id}
          spotId={session.spotId ?? null}
          onClose={() => { setShowForm(false); loadCatches(); }}
        />
      )}
    </div>
  );
}
