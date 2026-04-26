import { useEffect, useState } from 'react';
import { useDiaryStore }   from '../../store/diaryStore.js';
import { useMapStore }     from '../../store/mapStore.js';
import { useGeolocation }  from '../../hooks/useGeolocation.js';
import { FISHING_TYPES }   from '../../utils/fishingTips.js';
import { fetchWeather }    from '../../utils/weather.js';
import styles from './SessionForm.module.css';

const CONDITIONS = [
  { emoji: '☀️', label: 'Ясно'         },
  { emoji: '⛅', label: 'Облачно'      },
  { emoji: '☁️', label: 'Пасмурно'    },
  { emoji: '🌧️', label: 'Дождь'       },
  { emoji: '🌂',  label: 'Морось'      },
  { emoji: '🌫️', label: 'Туман'       },
  { emoji: '❄️', label: 'Снег'        },
  { emoji: '⛈️', label: 'Гроза'       },
  { emoji: '💨',  label: 'Сильный ветер' },
];

const WIND_DIRS = ['С', 'СВ', 'В', 'ЮВ', 'Ю', 'ЮЗ', 'З', 'СЗ'];

const today   = () => new Date().toISOString().slice(0, 10);
const nowTime = () => new Date().toTimeString().slice(0, 5);

export default function SessionForm({ onClose }) {
  const { addSession }     = useDiaryStore();
  const { spots, loadSpots } = useMapStore();
  const { position }       = useGeolocation();

  const [fishingType,  setFishingType]  = useState('');
  const [date,         setDate]         = useState(today());
  const [timeStart,    setTimeStart]    = useState(nowTime());
  const [timeEnd,      setTimeEnd]      = useState('');
  const [spotId,       setSpotId]       = useState('');
  const [locationName, setLocationName] = useState('');
  const [notes,        setNotes]        = useState('');

  const [wCondition, setWCondition] = useState('');
  const [wEmoji,     setWEmoji]     = useState('');
  const [wTemp,      setWTemp]      = useState('');
  const [wWind,      setWWind]      = useState('');
  const [wWindDir,   setWWindDir]   = useState('');
  const [wPressure,  setWPressure]  = useState('');
  const [fetching,   setFetching]   = useState(false);
  const [fetchMsg,   setFetchMsg]   = useState('');

  useEffect(() => { loadSpots(); }, [loadSpots]);

  const selectedSpot = spots.find((s) => String(s.id) === String(spotId));
  const hasLocation  = !!(selectedSpot?.lat ?? position?.lat);

  const doFetchWeather = async () => {
    const lat = selectedSpot?.lat ?? position?.lat;
    const lng = selectedSpot?.lng ?? position?.lng;
    if (!lat) { setFetchMsg('Нет геолокации'); return; }
    setFetching(true); setFetchMsg('');
    try {
      const w = await fetchWeather(lat, lng);
      setWCondition(w.condition);
      setWEmoji(w.emoji);
      setWTemp(String(w.temp));
      setWWind(String(w.wind));
      setWWindDir(w.windDir);
      setWPressure(String(w.pressure));
    } catch {
      setFetchMsg('Ошибка — проверьте интернет');
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const weather = (wCondition || wTemp || wWind)
      ? { emoji: wEmoji || '🌡️', condition: wCondition, temp: wTemp ? +wTemp : null,
          wind: wWind ? +wWind : null, windDir: wWindDir || null, pressure: wPressure ? +wPressure : null }
      : null;
    await addSession({
      date,
      timeStart:    timeStart    || null,
      timeEnd:      timeEnd      || null,
      fishingType:  fishingType  || null,
      spotId:       spotId       ? +spotId : null,
      locationName: locationName.trim() || selectedSpot?.name || null,
      weather,
      notes: notes.trim() || null,
    });
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <form className={styles.form} onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
        <h3>Новая запись</h3>

        <label>Вид ловли</label>
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

        {/* Дата и время */}
        <label>Дата и время</label>
        <div className={styles.timeRow}>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className={styles.dateInput} />
          <input type="time" value={timeStart} onChange={(e) => setTimeStart(e.target.value)} className={styles.timeInput} title="Начало" />
          <span className={styles.timeSep}>—</span>
          <input type="time" value={timeEnd} onChange={(e) => setTimeEnd(e.target.value)} className={styles.timeInput} title="Конец (необязательно)" />
        </div>

        {/* Место */}
        <label>Место</label>
        {spots.length > 0 && (
          <select className={styles.spotSelect} value={spotId} onChange={(e) => setSpotId(e.target.value)}>
            <option value="">— выбрать из карты —</option>
            {spots.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
        {!spotId && (
          <input value={locationName} onChange={(e) => setLocationName(e.target.value)}
            placeholder="Или введите название водоёма" />
        )}

        {/* Погода */}
        <label>Погода</label>
        <div className={styles.weatherRow}>
          <button type="button" className={styles.fetchBtn}
            disabled={!hasLocation || fetching} onClick={doFetchWeather}>
            {fetching ? '⏳' : '🌐'} Авто
          </button>
          {fetchMsg && <span className={styles.fetchMsg}>{fetchMsg}</span>}
          {!hasLocation && !fetchMsg && <span className={styles.fetchMsg}>Выберите место или включите геолокацию</span>}
        </div>

        <div className={styles.condChips}>
          {CONDITIONS.map((c) => (
            <button key={c.label} type="button"
              className={`${styles.condChip} ${wCondition === c.label ? styles.condActive : ''}`}
              onClick={() => { setWCondition(c.label); setWEmoji(c.emoji); }}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        <div className={styles.wFields}>
          <div className={styles.wField}>
            <span>°C</span>
            <input type="number" value={wTemp} onChange={(e) => setWTemp(e.target.value)} placeholder="+18" />
          </div>
          <div className={styles.wField}>
            <span>м/с</span>
            <input type="number" step="0.1" value={wWind} onChange={(e) => setWWind(e.target.value)} placeholder="3" />
          </div>
          <div className={styles.wField}>
            <span>Ветер</span>
            <select value={wWindDir} onChange={(e) => setWWindDir(e.target.value)}>
              <option value="">—</option>
              {WIND_DIRS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className={styles.wField}>
            <span>гПа</span>
            <input type="number" value={wPressure} onChange={(e) => setWPressure(e.target.value)} placeholder="1013" />
          </div>
        </div>

        <label>Заметки</label>
        <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="Что клевало, чем ловил, особенности..." />

        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onClose}>Отмена</button>
          <button type="submit">Сохранить</button>
        </div>
      </form>
    </div>
  );
}
