import { useEffect, useState, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useGeolocation } from '../../hooks/useGeolocation.js';
import styles from './WaterLevelScreen.module.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

async function fetchFloodData(lat, lng) {
  const url =
    `https://flood-api.open-meteo.com/v1/flood` +
    `?latitude=${lat}&longitude=${lng}` +
    `&daily=river_discharge` +
    `&past_days=60&forecast_days=7` +
    `&timezone=auto`;
  const res  = await fetch(url);
  const data = await res.json();
  return data.daily ?? null;
}

function trendIcon(vals) {
  if (vals.length < 3) return '—';
  const last  = vals[vals.length - 1];
  const prev3 = vals.slice(-4, -1).reduce((s, v) => s + v, 0) / 3;
  const pct   = (last - prev3) / (Math.abs(prev3) || 1) * 100;
  if (pct >  5) return '↑';
  if (pct < -5) return '↓';
  return '→';
}

function trendColor(icon) {
  if (icon === '↑') return '#f03e3e';
  if (icon === '↓') return '#4dabf7';
  return '#69db7c';
}

function levelPercent(vals) {
  if (!vals.length) return 50;
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const cur = vals[vals.length - 1];
  if (max === min) return 50;
  return Math.round(((cur - min) / (max - min)) * 100);
}

function levelLabel(pct) {
  if (pct >= 75) return { text: 'Высокий', color: '#f03e3e' };
  if (pct >= 50) return { text: 'Средний', color: '#ffa94d' };
  if (pct >= 25) return { text: 'Ниже среднего', color: '#69db7c' };
  return              { text: 'Низкий',  color: '#4dabf7' };
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function fmtFlow(v) {
  if (v == null) return '—';
  if (v >= 1000) return `${(v / 1000).toFixed(1)} тыс. м³/с`;
  return `${v.toFixed(1)} м³/с`;
}

export default function WaterLevelScreen() {
  const { position } = useGeolocation();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [loaded,  setLoaded]  = useState(false);

  useEffect(() => {
    if (!position || loaded) return;
    setLoading(true);
    setLoaded(true);
    fetchFloodData(position.lat, position.lng)
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError('Нет данных для этой точки'); setLoading(false); });
  }, [position, loaded]);

  const discharge = data?.river_discharge ?? [];
  const times     = data?.time ?? [];

  // Последние 60 дней для отображения
  const showN     = 30;
  const chartDis  = discharge.slice(-showN);
  const chartTime = times.slice(-showN);

  const current   = discharge[discharge.length - 1] ?? null;
  const pct       = levelPercent(discharge);
  const icon      = trendIcon(discharge);
  const lbl       = levelLabel(pct);

  const chartData = {
    labels: chartTime.map((t) => fmtDate(t)),
    datasets: [{
      label: 'Расход воды (м³/с)',
      data: chartDis,
      borderColor: '#4dabf7',
      backgroundColor: 'rgba(77,158,255,0.12)',
      pointRadius: 2,
      pointBackgroundColor: '#4dabf7',
      tension: 0.4,
      fill: true,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: {
      label: (ctx) => ` ${ctx.parsed.y.toFixed(1)} м³/с`,
    }}},
    scales: {
      x: { ticks: { color: '#768390', maxTicksLimit: 6, font: { size: 10 } }, grid: { color: '#1c2333' } },
      y: { ticks: { color: '#768390', font: { size: 10 } }, grid: { color: '#1c2333' } },
    },
  };

  // Прогноз (последние 7 записей — forecast)
  const forecast = discharge.slice(-7).map((v, i) => ({
    date: times[times.length - 7 + i],
    val: v,
  }));

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h2>Уровень воды</h2>
      </header>

      {!position && !loading && (
        <div className={styles.noGeo}>
          <span>📍</span>
          <p>Разрешите доступ к геолокации — данные подтянутся автоматически для вашего ближайшего водоёма.</p>
        </div>
      )}

      {loading && (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Загружаю данные…</p>
        </div>
      )}

      {error && (
        <div className={styles.errorCard}>
          <span>⚠️</span>
          <p>{error}</p>
        </div>
      )}

      {current != null && !loading && (
        <>
          {/* ── Датчик ── */}
          <div className={styles.gaugeCard}>
            <div className={styles.gaugeLeft}>
              <span className={styles.gaugeTitle}>Расход воды</span>
              <span className={styles.gaugeVal}>{fmtFlow(current)}</span>
              <span className={styles.gaugeSub} style={{ color: lbl.color }}>
                {lbl.text}
              </span>
              <span className={styles.gaugeSrc}>
                Open-Meteo · {position?.lat.toFixed(2)}, {position?.lng.toFixed(2)}
              </span>
            </div>

            <div className={styles.gaugeRight}>
              {/* Вертикальный датчик */}
              <div className={styles.tank}>
                <div
                  className={styles.tankFill}
                  style={{
                    height: `${pct}%`,
                    background: `linear-gradient(to top, ${lbl.color}88, ${lbl.color})`,
                  }}
                />
                <div className={styles.tankPct}>{pct}%</div>
              </div>
              {/* Тренд */}
              <div className={styles.trend} style={{ color: trendColor(icon) }}>
                <span className={styles.trendIcon}>{icon}</span>
                <span className={styles.trendLabel}>
                  {icon === '↑' ? 'Растёт' : icon === '↓' ? 'Падает' : 'Стабильно'}
                </span>
              </div>
            </div>
          </div>

          {/* ── График 30 дней ── */}
          {chartDis.length > 2 && (
            <section className={styles.chartSection}>
              <h4 className={styles.sectionTitle}>📈 30 дней</h4>
              <div className={styles.chartWrap}>
                <Line data={chartData} options={chartOptions} />
              </div>
            </section>
          )}

          {/* ── Прогноз 7 дней ── */}
          <section className={styles.forecastSection}>
            <h4 className={styles.sectionTitle}>🔭 Прогноз на 7 дней</h4>
            <div className={styles.forecastRow}>
              {forecast.map((f) => {
                const fPct = levelPercent([...discharge.slice(-60), f.val]);
                const fLbl = levelLabel(fPct);
                return (
                  <div key={f.date} className={styles.forecastDay}>
                    <span className={styles.forecastDate}>
                      {new Date(f.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'numeric' })}
                    </span>
                    <div className={styles.forecastBar}>
                      <div className={styles.forecastFill}
                        style={{ height: `${fPct}%`, background: fLbl.color }} />
                    </div>
                    <span className={styles.forecastVal}>{f.val?.toFixed(0)}</span>
                  </div>
                );
              })}
            </div>
            <p className={styles.forecastNote}>м³/с · данные гидрологической модели Open-Meteo</p>
          </section>

          {/* ── Рекомендация рыболову ── */}
          <div className={`${styles.adviceCard} ${pct >= 75 ? styles.adviceHigh : pct <= 25 ? styles.adviceLow : ''}`}>
            <span className={styles.adviceIcon}>
              {pct >= 75 ? '🌊' : pct <= 25 ? '🏖' : '✅'}
            </span>
            <div>
              <strong>
                {pct >= 75 ? 'Высокий уровень' : pct <= 25 ? 'Низкая вода' : 'Нормальный уровень'}
              </strong>
              <p className={styles.adviceText}>
                {pct >= 75
                  ? 'Рыба ушла в затопленные кусты и травы. Ловите у берега с медленной проводкой. Хороший клёв щуки и окуня в залитых зарослях.'
                  : pct <= 25
                  ? 'Рыба сконцентрирована в ямах и глубоких местах. Ловите на бровках и у коряжника. Клёв осторожный — уменьшайте снасть.'
                  : 'Оптимальный уровень. Рыба распределена по привычным местам. Используйте стандартные методы для текущего сезона.'}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
