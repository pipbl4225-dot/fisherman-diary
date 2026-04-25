import { useEffect, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { fetchDams, kindRu } from '../../utils/overpass.js';
import styles from './DamsLayer.module.css';

const damIcon  = L.divIcon({ className: '', html: '<div class="dam-icon">🏗</div>', iconSize: [28, 28], iconAnchor: [14, 14] });
const weirIcon = L.divIcon({ className: '', html: '<div class="dam-icon">🌊</div>', iconSize: [28, 28], iconAnchor: [14, 14] });
const lockIcon = L.divIcon({ className: '', html: '<div class="dam-icon">⚓</div>', iconSize: [28, 28], iconAnchor: [14, 14] });

function iconFor(kind) {
  if (kind === 'weir')      return weirIcon;
  if (kind === 'lock_gate') return lockIcon;
  return damIcon;
}

export default function DamsLayer({ position }) {
  const [dams,    setDams]    = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [radius,  setRadius]  = useState(30);

  const load = async (lat, lng, r) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDams(lat, lng, r);
      setDams(data);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (position) load(position.lat, position.lng, radius);
  }, [position?.lat, position?.lng, radius]);

  return (
    <>
      {/* Маркеры на карте */}
      {dams.map((d) => (
        <Marker key={`${d.type}-${d.id}`} position={[d.lat, d.lng]} icon={iconFor(d.kind)}>
          <Popup>
            <div className={styles.popup}>
              <strong>{d.name}</strong>
              <span className={styles.kind}>{kindRu(d.kind)}</span>
              {d.operator && <span>Оператор: {d.operator}</span>}
              {d.website  && <a href={d.website} target="_blank" rel="noopener noreferrer">Сайт ↗</a>}
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Статус-строка */}
      {loading && (
        <div className={styles.status}>Загрузка плотин…</div>
      )}
      {error && (
        <div className={`${styles.status} ${styles.err}`}>Overpass: {error}</div>
      )}
    </>
  );
}
