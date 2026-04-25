import { useEffect, useRef, useState } from 'react';
import { Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
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

export default function DamsLayer() {
  const map     = useMap();
  const [dams,    setDams]    = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const timerRef = useRef(null);

  const load = async () => {
    const b = map.getBounds();
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDams(
        b.getSouth(), b.getWest(), b.getNorth(), b.getEast(),
      );
      setDams(data);
    } catch (e) {
      setError(e.message.includes('429') ? 'Сервер перегружен, попробуйте позже' : e.message);
    }
    setLoading(false);
  };

  const scheduleLoad = () => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(load, 1500);
  };

  // Загрузка при монтировании и после остановки карты
  useEffect(() => { scheduleLoad(); return () => clearTimeout(timerRef.current); }, []);
  useMapEvents({ moveend: scheduleLoad });

  return (
    <>
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

      {loading && <div className={styles.status}>Загрузка плотин…</div>}
      {error   && <div className={`${styles.status} ${styles.err}`}>{error}</div>}
    </>
  );
}
