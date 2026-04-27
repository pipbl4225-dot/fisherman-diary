import { useEffect, useState } from 'react';
import { useGeolocation }    from '../../hooks/useGeolocation.js';
import { findNearest }       from '../../utils/gaugesList.js';
import { fetchGaugeLevel }   from '../../utils/allrivers.js';
import styles from './WaterLevelScreen.module.css';

const HISTORY_KEY = 'water_level_history'; // { slug, level, ts }[]

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]'); }
  catch { return []; }
}

function saveReading(slug, level) {
  const hist = loadHistory().filter((r) => r.slug === slug).slice(-10);
  hist.push({ slug, level, ts: Date.now() });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(
    [...loadHistory().filter((r) => r.slug !== slug), ...hist]
  ));
}

function trendFromHistory(slug, current) {
  const hist = loadHistory()
    .filter((r) => r.slug === slug)
    .sort((a, b) => a.ts - b.ts);
  if (hist.length < 2) return null;
  const prev = hist[hist.length - 2].level;
  const diff = current - prev;
  return diff;
}

function levelLabel(diff) {
  if (diff === null)  return { icon: '→', text: 'Нет данных о тренде', color: '#69db7c' };
  if (diff > 5)       return { icon: '↑', text: `Растёт (+${diff} см)`,  color: '#f03e3e' };
  if (diff < -5)      return { icon: '↓', text: `Падает (${diff} см)`,   color: '#4dabf7' };
  return               { icon: '→', text: 'Стабильно',                   color: '#69db7c' };
}

function fishAdvice(diff) {
  if (diff === null)  return { icon: '✅', title: 'Актуальный уровень', text: 'Откройте приложение повторно через несколько часов — станет виден тренд.' };
  if (diff > 5)       return { icon: '🌊', title: 'Вода прибывает',     text: 'Рыба смещается к затопленным кустам и траве. Ловите у берега с медленной проводкой. Хороший клёв щуки и окуня в залитых зарослях.' };
  if (diff < -5)      return { icon: '🏖',  title: 'Вода убывает',      text: 'Рыба концентрируется на ямах и бровках. Уменьшайте снасть, ловите на дно. Клёв осторожный — лёгкий груз и тонкий поводок.' };
  return               { icon: '✅', title: 'Стабильный уровень',        text: 'Оптимальное состояние. Рыба стоит на привычных местах. Используйте стандартные методы для текущего сезона.' };
}

export default function WaterLevelScreen() {
  const { position } = useGeolocation();

  const [candidates, setCandidates] = useState([]);
  const [slug,       setSlug]       = useState(() => localStorage.getItem('selected_gauge_slug') ?? null);
  const [data,       setData]       = useState(null);   // { level, unit, date, temp }
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [showList,   setShowList]   = useState(false);

  // Найти ближайшие посты
  useEffect(() => {
    if (!position) return;
    const nearby = findNearest(position.lat, position.lng, 5);
    setCandidates(nearby);
    if (!slug && nearby.length > 0) {
      const first = nearby[0].slug;
      localStorage.setItem('selected_gauge_slug', first);
      setSlug(first);
    }
  }, [position?.lat, position?.lng]);

  // Загрузить уровень
  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    setData(null);
    fetchGaugeLevel(slug).then((d) => {
      setLoading(false);
      if (!d) { setError('Нет данных для этого гидропоста'); return; }
      setData(d);
      saveReading(slug, d.level);
    });
  }, [slug]);

  const gauge   = candidates.find((c) => c.slug === slug) ?? null;
  const diff    = data ? trendFromHistory(slug, data.level) : null;
  const trend   = levelLabel(diff);
  const advice  = fishAdvice(diff);

  function selectGauge(s) {
    localStorage.setItem('selected_gauge_slug', s);
    setSlug(s);
    setShowList(false);
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h2>Уровень воды</h2>
      </header>

      {!position && !loading && (
        <div className={styles.noGeo}>
          <span>📍</span>
          <p>Разрешите доступ к геолокации — ближайший гидропост подтянется автоматически.</p>
        </div>
      )}

      {/* Выбор гидропоста */}
      {candidates.length > 0 && (
        <div className={styles.gaugeSection}>
          <div className={styles.gaugeTitleRow}>
            <span className={styles.gaugeLabel}>Гидропост</span>
            <button className={styles.changeBtn} onClick={() => setShowList((v) => !v)}>
              {showList ? 'Скрыть' : 'Сменить'}
            </button>
          </div>

          {showList && (
            <div className={styles.searchBox}>
              <ul className={styles.searchList}>
                {candidates.map((c) => (
                  <li key={c.slug}>
                    <button
                      className={`${styles.searchItem} ${c.slug === slug ? styles.activeItem : ''}`}
                      onClick={() => selectGauge(c.slug)}
                    >
                      {c.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Загружаю данные гидропоста…</p>
        </div>
      )}

      {error && (
        <div className={styles.errorCard}>
          <span>⚠️</span>
          <p>{error}</p>
        </div>
      )}

      {data && !loading && (
        <>
          {/* Карточка уровня */}
          <div className={styles.liveCard}>
            <div className={styles.liveHeader}>
              <span className={styles.gaugeName}>{gauge?.name ?? slug}</span>
              <a
                className={styles.extLink}
                href={`https://allrivers.info/gauge/${slug}`}
                target="_blank"
                rel="noreferrer"
              >
                allrivers.info ↗
              </a>
            </div>

            <div className={styles.liveData}>
              <span className={styles.liveValue}>
                {data.level > 0 ? '+' : ''}{data.level} <small>см</small>
              </span>
              <div style={{ color: trend.color, fontWeight: 700, fontSize: 22 }}>
                {trend.icon}
              </div>
              <span style={{ color: trend.color, fontSize: 13 }}>{trend.text}</span>
            </div>

            <div className={styles.liveMeta}>
              {data.date && <span>📅 {data.date}</span>}
              {data.temp != null && <span>🌡 {data.temp} °C</span>}
            </div>
          </div>

          {/* Визуальный датчик */}
          <div className={styles.tankCard}>
            <div className={styles.tankWrap}>
              <div className={styles.tankScale}>
                <span>▲</span>
                <span>0</span>
                <span>▼</span>
              </div>
              <div className={styles.tank}>
                {/* Нулевая линия */}
                <div className={styles.zeroLine} />
                {/* Заливка выше/ниже нуля */}
                {data.level >= 0 ? (
                  <div
                    className={styles.tankFillPos}
                    style={{
                      height: `${Math.min(data.level / 3, 50)}%`,
                      background: data.level > 150 ? '#f03e3e' : '#4dabf7',
                    }}
                  />
                ) : (
                  <div
                    className={styles.tankFillNeg}
                    style={{
                      height: `${Math.min(Math.abs(data.level) / 3, 50)}%`,
                      background: '#a9e34b',
                    }}
                  />
                )}
              </div>
              <div className={styles.tankLabel}>{data.level > 0 ? '+' : ''}{data.level} см</div>
            </div>
            <p className={styles.tankHint}>
              Уровень воды относительно нуля графика гидропоста.
              Значения выше нуля — прибыль, ниже — убыль.
            </p>
          </div>

          {/* Рекомендация рыболову */}
          <div className={styles.adviceCard}>
            <span className={styles.adviceIcon}>{advice.icon}</span>
            <div>
              <strong>{advice.title}</strong>
              <p className={styles.adviceText}>{advice.text}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
