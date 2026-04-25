import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Filler, Tooltip as ChartTooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useBottomStore } from '../../store/bottomStore.js';
import { useMapStore } from '../../store/mapStore.js';
import SoundingForm from './SoundingForm.jsx';
import styles from './BottomMapperScreen.module.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, ChartTooltip);

function depthColor(depth) {
  if (depth == null) return '#58a6ff';
  if (depth < 1)  return '#3fb950';
  if (depth < 3)  return '#d29922';
  if (depth < 6)  return '#f85149';
  return '#8b949e';
}

function ClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng) });
  return null;
}

export default function BottomMapperScreen() {
  const { soundings, activeSpotId, loadSoundings, clearSoundings } = useBottomStore();
  const { spots, loadSpots } = useMapStore();
  const [pendingLatLng, setPendingLatLng] = useState(null);
  const [selectedSpot,  setSelectedSpot]  = useState(null);
  const [view,          setView]          = useState('map'); // 'map' | 'profile'

  useEffect(() => { loadSpots(); }, [loadSpots]);

  useEffect(() => {
    if (selectedSpot) loadSoundings(selectedSpot.id);
    else              clearSoundings();
  }, [selectedSpot]);

  const sorted = [...soundings].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));

  const profileData = {
    labels: sorted.map((_, i) => `${i + 1}`),
    datasets: [{
      label: 'Глубина (м)',
      data:   sorted.map((s) => s.depth),
      borderColor:     '#58a6ff',
      backgroundColor: 'rgba(88,166,255,0.15)',
      tension: 0.4,
      fill: true,
      pointBackgroundColor: sorted.map((s) => depthColor(s.depth)),
    }],
  };

  const profileOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#8b949e' }, grid: { color: '#21262d' } },
      y: {
        reverse: true,
        ticks: { color: '#8b949e', callback: (v) => `${v} м` },
        grid:  { color: '#21262d' },
      },
    },
  };

  const mapCenter = selectedSpot
    ? [selectedSpot.lat, selectedSpot.lng]
    : [55.75, 37.62];

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h2>Промер дна</h2>
        {selectedSpot && (
          <button className={styles.back} onClick={() => { setSelectedSpot(null); setView('map'); }}>
            ← Все места
          </button>
        )}
      </header>

      {!selectedSpot ? (
        <>
          <p className={styles.hint}>Выбери место для работы с промерами:</p>
          <ul className={styles.spotList}>
            {spots.length === 0 && (
              <li className={styles.empty}>Нет мест. Добавь их на вкладке «Карта».</li>
            )}
            {spots.map((s) => (
              <li key={s.id} className={styles.spotItem} onClick={() => setSelectedSpot(s)}>
                <span className={styles.spotName}>{s.name}</span>
                {s.depth && <span className={styles.spotDepth}>{s.depth} м</span>}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <div className={styles.tabs}>
            <button className={`${styles.tab} ${view === 'map'     ? styles.activeTab : ''}`} onClick={() => setView('map')}>Карта</button>
            <button className={`${styles.tab} ${view === 'profile' ? styles.activeTab : ''}`} onClick={() => setView('profile')}>Профиль дна</button>
          </div>

          {view === 'map' && (
            <>
              <div className={styles.mapWrap}>
                <MapContainer center={mapCenter} zoom={14} className={styles.map}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <ClickHandler onMapClick={setPendingLatLng} />
                  {soundings.map((s) => (
                    <CircleMarker
                      key={s.id}
                      center={[s.lat, s.lng]}
                      radius={10}
                      pathOptions={{ color: depthColor(s.depth), fillColor: depthColor(s.depth), fillOpacity: 0.8 }}
                    >
                      <Tooltip permanent direction="top" offset={[0, -8]}>
                        {s.depth} м
                      </Tooltip>
                    </CircleMarker>
                  ))}
                </MapContainer>
              </div>
              <p className={styles.hint}>Нажми на карте для добавления промера.</p>
            </>
          )}

          {view === 'profile' && (
            <div className={styles.profileWrap}>
              {sorted.length < 2 ? (
                <p className={styles.empty}>Нужно минимум 2 промера для профиля.</p>
              ) : (
                <Line data={profileData} options={profileOptions} />
              )}
            </div>
          )}
        </>
      )}

      {pendingLatLng && (
        <SoundingForm
          latlng={pendingLatLng}
          spotId={selectedSpot?.id}
          onClose={() => { setPendingLatLng(null); if (selectedSpot) loadSoundings(selectedSpot.id); }}
        />
      )}
    </div>
  );
}
