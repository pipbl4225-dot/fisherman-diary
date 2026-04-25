import { useEffect, useState } from 'react';
import { fetchDams, kindRu } from '../../utils/overpass.js';
import { useGeolocation } from '../../hooks/useGeolocation.js';
import styles from './DamsList.module.css';

const KIND_COLORS = {
  dam:       '#58a6ff',
  weir:      '#3fb950',
  lock_gate: '#d29922',
};

function distKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export default function DamsList({ onClose, onFlyTo }) {
  const { position }          = useGeolocation();
  const [dams,    setDams]    = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [radius,  setRadius]  = useState(50);
  const [filter,  setFilter]  = useState('all');

  const load = async () => {
    if (!position) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDams(position.lat, position.lng, radius);
      setDams(data);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => { if (position) load(); }, [position?.lat, position?.lng, radius]);

  const visible = filter === 'all' ? dams : dams.filter((d) => d.kind === filter);

  const sorted = position
    ? [...visible].sort((a, b) =>
        distKm(position.lat, position.lng, a.lat, a.lng) -
        distKm(position.lat, position.lng, b.lat, b.lng)
      )
    : visible;

  return (
    <div className={styles.sheet}>
      <div className={styles.header}>
        <h3>Плотины и запруды</h3>
        <button className={styles.close} onClick={onClose}>✕</button>
      </div>

      <div className={styles.controls}>
        <div className={styles.filters}>
          {['all','dam','weir','lock_gate'].map((k) => (
            <button key={k}
              className={`${styles.chip} ${filter === k ? styles.active : ''}`}
              onClick={() => setFilter(k)}
            >{k === 'all' ? 'Все' : kindRu(k)}</button>
          ))}
        </div>
        <div className={styles.radiusRow}>
          <span className={styles.radiusLabel}>Радиус: {radius} км</span>
          <input type="range" min="10" max="150" step="10" value={radius}
            onChange={(e) => setRadius(+e.target.value)} />
        </div>
      </div>

      {!position && (
        <p className={styles.hint}>Ожидание геопозиции…</p>
      )}
      {loading && <p className={styles.hint}>Загрузка из OpenStreetMap…</p>}
      {error   && <p className={styles.err}>{error}</p>}

      {!loading && sorted.length === 0 && position && !error && (
        <p className={styles.hint}>Объекты не найдены в радиусе {radius} км.</p>
      )}

      <ul className={styles.list}>
        {sorted.map((d) => {
          const km = position
            ? distKm(position.lat, position.lng, d.lat, d.lng).toFixed(1)
            : null;
          return (
            <li key={`${d.type}-${d.id}`} className={styles.item}
              onClick={() => { onFlyTo([d.lat, d.lng]); onClose(); }}>
              <div className={styles.itemMain}>
                <span className={styles.itemName}>{d.name}</span>
                <span className={styles.itemKind}
                  style={{ color: KIND_COLORS[d.kind] ?? '#8b949e' }}>
                  {kindRu(d.kind)}
                </span>
                {d.operator && <span className={styles.itemMeta}>{d.operator}</span>}
              </div>
              <div className={styles.itemRight}>
                {km && <span className={styles.dist}>{km} км</span>}
                <span className={styles.arrow}>→</span>
              </div>
            </li>
          );
        })}
      </ul>

      {sorted.length > 0 && (
        <p className={styles.count}>{sorted.length} объектов</p>
      )}
    </div>
  );
}
