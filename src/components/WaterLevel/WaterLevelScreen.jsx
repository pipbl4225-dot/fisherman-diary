import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useWaterStore } from '../../store/waterStore.js';
import { useGeolocation } from '../../hooks/useGeolocation.js';
import { useNearestGauge } from '../../hooks/useNearestGauge.js';
import { searchGauges } from '../../utils/allrivers.js';
import { GAUGES } from '../../utils/gaugesList.js';
import WaterLevelForm from './WaterLevelForm.jsx';
import styles from './WaterLevelScreen.module.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export default function WaterLevelScreen() {
  const { levels, loadLevels } = useWaterStore();
  const { position }           = useGeolocation();
  const {
    candidates, selectedSlug, selectedGauge,
    currentLevel, loadingLevel, error, select,
  } = useNearestGauge(position);

  const [showManual,    setShowManual]    = useState(false);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching,     setSearching]     = useState(false);
  const [showSearch,    setShowSearch]    = useState(false);

  const STATION_ID = selectedSlug ?? 'default';

  useEffect(() => { loadLevels(STATION_ID); }, [loadLevels, STATION_ID]);

  // Поиск по справочнику + allrivers.info
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const q = searchQuery.toLowerCase();
    // Сначала ищем в локальном справочнике
    const local = GAUGES.filter(
      (g) => g.name.toLowerCase().includes(q) || g.slug.includes(q)
    ).slice(0, 8);
    setSearchResults(local);

    // Потом пробуем API
    setSearching(true);
    searchGauges(searchQuery).then((remote) => {
      setSearching(false);
      if (!remote.length) return;
      // Мерджим уникальные
      const remoteNorm = remote.map((r) => ({
        slug: r.slug ?? r.id ?? String(r),
        name: r.name ?? r.title ?? r.slug ?? String(r),
        lat: r.lat ?? r.latitude ?? null,
        lng: r.lng ?? r.longitude ?? null,
      }));
      setSearchResults((prev) => {
        const slugs = new Set(prev.map((x) => x.slug));
        return [...prev, ...remoteNorm.filter((x) => !slugs.has(x.slug))].slice(0, 10);
      });
    });
  }, [searchQuery]);

  // Локальные ручные замеры для графика
  const sorted    = [...levels].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
  const chartData = {
    labels: sorted.map((l) => fmtDate(l.recordedAt)),
    datasets: [{
      label: 'Уровень (см)',
      data:   sorted.map((l) => l.level),
      borderColor:     '#58a6ff',
      backgroundColor: 'rgba(88, 166, 255, 0.12)',
      pointBackgroundColor: '#58a6ff',
      tension: 0.35,
      fill: true,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#8b949e', maxTicksLimit: 8 }, grid: { color: '#21262d' } },
      y: { ticks: { color: '#8b949e' },                   grid: { color: '#21262d' } },
    },
  };

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h2>Уровень воды</h2>
        <button onClick={() => setShowManual(true)}>+ Замер</button>
      </header>

      {/* --- Гидропост --- */}
      <section className={styles.gaugeSection}>
        <div className={styles.gaugeTitleRow}>
          <span className={styles.gaugeLabel}>Гидропост</span>
          <button className={styles.changeBtn} onClick={() => setShowSearch((v) => !v)}>
            {showSearch ? 'Закрыть' : 'Изменить'}
          </button>
        </div>

        {showSearch && (
          <div className={styles.searchBox}>
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Река, город… напр. Ока Рязань"
            />
            {searching && <p className={styles.hint}>Поиск…</p>}
            {searchResults.length > 0 && (
              <ul className={styles.searchList}>
                {searchResults.map((g) => (
                  <li key={g.slug} className={styles.searchItem}
                    onClick={() => { select(g.slug); setShowSearch(false); setSearchQuery(''); }}>
                    {g.name}
                  </li>
                ))}
              </ul>
            )}
            {/* Ближайшие посты по геолокации */}
            {!searchQuery && candidates.length > 0 && (
              <>
                <p className={styles.hint}>Ближайшие по геопозиции:</p>
                <ul className={styles.searchList}>
                  {candidates.map((g) => (
                    <li key={g.slug}
                      className={`${styles.searchItem} ${g.slug === selectedSlug ? styles.activeItem : ''}`}
                      onClick={() => { select(g.slug); setShowSearch(false); }}>
                      {g.name}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {/* Текущий уровень с гидропоста */}
        {selectedSlug && (
          <div className={styles.liveCard}>
            <div className={styles.liveHeader}>
              <span className={styles.gaugeName}>
                {selectedGauge?.name ?? selectedSlug}
              </span>
              <a
                href={`https://allrivers.info/gauge/${selectedSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.extLink}
              >↗ allrivers</a>
            </div>

            {loadingLevel && <p className={styles.hint}>Загрузка…</p>}
            {error        && <p className={styles.errorHint}>{error}</p>}

            {currentLevel && !loadingLevel && (
              <div className={styles.liveData}>
                <span className={styles.liveValue}>
                  {currentLevel.level > 0 ? '+' : ''}{currentLevel.level}
                  <small> {currentLevel.unit}</small>
                </span>
                <div className={styles.liveMeta}>
                  {currentLevel.date && <span>{currentLevel.date}</span>}
                  {currentLevel.temp != null && <span>🌡 {currentLevel.temp}°C</span>}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* --- Ручные замеры (личный журнал) --- */}
      <section className={styles.manualSection}>
        <h3>Мои замеры</h3>

        {sorted.length < 2 ? (
          <p className={styles.hint}>Добавьте хотя бы 2 замера для графика.</p>
        ) : (
          <div className={styles.chartWrap}>
            <Line data={chartData} options={chartOptions} />
          </div>
        )}

        {sorted.length > 0 && (
          <ul className={styles.list}>
            {[...sorted].reverse().map((l) => (
              <li key={l.id} className={styles.row}>
                <span className={styles.rowDate}>{fmtDate(l.recordedAt)}</span>
                <span className={styles.rowVal}>{l.level} см</span>
                {l.flow != null && <span className={styles.rowFlow}>{l.flow} м³/с</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {showManual && (
        <WaterLevelForm
          stationId={STATION_ID}
          onClose={() => { setShowManual(false); loadLevels(STATION_ID); }}
        />
      )}
    </div>
  );
}
