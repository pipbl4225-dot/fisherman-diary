import { useEffect, useState } from 'react';
import { useNavigate }   from 'react-router-dom';
import { useDiaryStore } from '../../store/diaryStore.js';
import { FISHING_TYPES } from '../../utils/fishingTips.js';
import { fetchWeather }  from '../../utils/weather.js';
import styles from './CheckInSheet.module.css';

const nowTime = () => new Date().toTimeString().slice(0, 5);
const today   = () => new Date().toISOString().slice(0, 10);

export default function CheckInSheet({ spot, onClose }) {
  const { addSession }  = useDiaryStore();
  const navigate        = useNavigate();

  const [fishingType, setFishingType] = useState('');
  const [timeStart,   setTimeStart]   = useState(nowTime());
  const [notes,       setNotes]       = useState('');
  const [weather,     setWeather]     = useState(null);
  const [wStatus,     setWStatus]     = useState('loading'); // loading | ok | error

  // Авто-погода сразу при открытии
  useEffect(() => {
    fetchWeather(spot.lat, spot.lng)
      .then((w) => { setWeather(w); setWStatus('ok'); })
      .catch(() => setWStatus('error'));
  }, [spot.lat, spot.lng]);

  const save = async () => {
    await addSession({
      date:         today(),
      timeStart,
      timeEnd:      null,
      fishingType:  fishingType || null,
      spotId:       spot.id,
      locationName: spot.name,
      weather:      weather ?? null,
      notes:        notes.trim() || null,
    });
    onClose();
    navigate('/diary');
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.handle} />

        <div className={styles.spotRow}>
          <span className={styles.spotPin}>📍</span>
          <div>
            <p className={styles.spotName}>{spot.name}</p>
            <p className={styles.spotTime}>Прибытие: <b>{timeStart}</b></p>
          </div>
          <input
            type="time"
            value={timeStart}
            onChange={(e) => setTimeStart(e.target.value)}
            className={styles.timeEdit}
          />
        </div>

        {/* Погода */}
        <div className={styles.weatherRow}>
          {wStatus === 'loading' && <span className={styles.wHint}>⏳ Загружаю погоду…</span>}
          {wStatus === 'error'   && <span className={styles.wHint}>Нет погоды (нет сети)</span>}
          {wStatus === 'ok' && weather && (
            <div className={styles.wCard}>
              <span className={styles.wEmoji}>{weather.emoji}</span>
              <span>{weather.condition}</span>
              <span>{weather.temp > 0 ? '+' : ''}{weather.temp}°C</span>
              <span>💨 {weather.windDir} {weather.wind} м/с</span>
              <span>🔵 {weather.pressure} гПа</span>
            </div>
          )}
        </div>

        {/* Вид ловли */}
        <div className={styles.typeGrid}>
          {FISHING_TYPES.map((t) => (
            <button key={t.id} type="button"
              className={`${styles.typeBtn} ${fishingType === t.id ? styles.typeBtnActive : ''}`}
              onClick={() => setFishingType(fishingType === t.id ? '' : t.id)}>
              <span>{t.emoji}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <input
          className={styles.notes}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Заметка (необязательно)…"
        />

        <div className={styles.actions}>
          <button className={styles.cancel} onClick={onClose}>Отмена</button>
          <button className={styles.start} onClick={save}>🎣 Начать ловлю</button>
        </div>
      </div>
    </div>
  );
}
