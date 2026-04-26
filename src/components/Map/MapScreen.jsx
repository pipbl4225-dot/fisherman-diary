import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useMapStore }    from '../../store/mapStore.js';
import { useGeolocation } from '../../hooks/useGeolocation.js';
import SpotForm   from './SpotForm.jsx';
import DamsLayer  from './DamsLayer.jsx';
import DamsList   from './DamsList.jsx';
import styles from './MapScreen.module.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl:       new URL('leaflet/dist/images/marker-icon.png',    import.meta.url).href,
  shadowUrl:     new URL('leaflet/dist/images/marker-shadow.png',  import.meta.url).href,
});

const userIcon = L.divIcon({
  className: '',
  html: `<div style="width:18px;height:18px;background:#58a6ff;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 4px rgba(88,166,255,0.35);"></div>`,
  iconSize: [18, 18], iconAnchor: [9, 9],
});

function ClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng) });
  return null;
}

function FlyToUser({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo([position.lat, position.lng], 14, { duration: 1.2 });
  }, [position]);
  return null;
}

function FlyToPoint({ point }) {
  const map = useMap();
  useEffect(() => {
    if (point) map.flyTo(point, 15, { duration: 1 });
  }, [point]);
  return null;
}

function RecenterControl({ position, loading, onRequest }) {
  const map = useMap();
  const fly = () => {
    if (position) map.flyTo([position.lat, position.lng], 14, { duration: 1 });
    else onRequest();
  };
  return (
    <div className={`leaflet-top leaflet-right ${styles.recenterWrap}`}>
      <button className={styles.recenterBtn} onClick={fly} title="Моя позиция">
        {loading ? '…' : '◎'}
      </button>
    </div>
  );
}

export default function MapScreen() {
  const { spots, center, zoom, loadSpots, deleteSpot } = useMapStore();
  const { position, loading, refresh } = useGeolocation();
  const [pendingLatLng, setPendingLatLng] = useState(null);
  const [centeredOnce,  setCenteredOnce]  = useState(false);
  const [showDams,      setShowDams]      = useState(false);
  const [showDamsList,  setShowDamsList]  = useState(false);
  const [damsLayer,     setDamsLayer]     = useState(false);
  const [flyPoint,      setFlyPoint]      = useState(null);

  useEffect(() => { loadSpots(); }, [loadSpots]);

  const shouldFly = position && !centeredOnce;
  useEffect(() => { if (position) setCenteredOnce(true); }, [position]);

  const handleFlyTo = (latlng) => {
    setFlyPoint(latlng);
    setTimeout(() => setFlyPoint(null), 500);
  };

  return (
    <div className={styles.screen}>
      <MapContainer center={center} zoom={zoom} className={styles.map}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ClickHandler onMapClick={setPendingLatLng} />
        {shouldFly  && <FlyToUser  position={position} />}
        {flyPoint   && <FlyToPoint point={flyPoint} />}
        <RecenterControl position={position} loading={loading} onRequest={refresh} />

        {/* Геопозиция */}
        {position && (
          <>
            <Circle
              center={[position.lat, position.lng]}
              radius={position.accuracy / 2}
              pathOptions={{ color: '#58a6ff', fillColor: '#58a6ff', fillOpacity: 0.1, weight: 1 }}
            />
            <Marker position={[position.lat, position.lng]} icon={userIcon}>
              <Popup>Вы здесь</Popup>
            </Marker>
          </>
        )}

        {/* Слой плотин */}
        {damsLayer && <DamsLayer />}

        {/* Точки рыбалки */}
        {spots.map((spot) => (
          <Marker key={spot.id} position={[spot.lat, spot.lng]}>
            <Popup>
              <div className={styles.popup}>
                <strong>{spot.name}</strong>
                {spot.depth && <span>Глубина: {spot.depth} м</span>}
                {spot.notes && <p>{spot.notes}</p>}
                <div className={styles.navBtns}>
                  <a href={`https://yandex.ru/maps/?rtext=~${spot.lat},${spot.lng}&rtt=auto`}
                    target="_blank" rel="noopener noreferrer" className={styles.navBtn}>🗺 Яндекс</a>
                  <a href={`https://2gis.ru/routeSearch/rsType/auto/to/${spot.lng},${spot.lat}`}
                    target="_blank" rel="noopener noreferrer" className={styles.navBtn}>🗺 2ГИС</a>
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`}
                    target="_blank" rel="noopener noreferrer" className={styles.navBtn}>🗺 Google</a>
                </div>
                <button className={styles.deleteBtn} onClick={() => deleteSpot(spot.id)}>Удалить</button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Тулбар слоёв */}
      <div className={styles.toolbar}>
        <button
          className={`${styles.toolBtn} ${damsLayer ? styles.toolActive : ''}`}
          onClick={() => setDamsLayer((v) => !v)}
          title="Плотины на карте"
        >🏗</button>
        <button
          className={styles.toolBtn}
          onClick={() => setShowDamsList(true)}
          title="Список плотин"
        >≡</button>
      </div>

      {pendingLatLng && (
        <SpotForm latlng={pendingLatLng} onClose={() => setPendingLatLng(null)} />
      )}

      {showDamsList && (
        <DamsList
          onClose={() => setShowDamsList(false)}
          onFlyTo={handleFlyTo}
        />
      )}
    </div>
  );
}
