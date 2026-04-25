import { useState } from 'react';
import { useDiaryStore } from '../../store/diaryStore.js';
import styles from './SessionForm.module.css';

const today = () => new Date().toISOString().slice(0, 10);

export default function SessionForm({ onClose }) {
  const { addSession } = useDiaryStore();
  const [date,         setDate]         = useState(today());
  const [locationName, setLocationName] = useState('');
  const [weather,      setWeather]      = useState('');
  const [notes,        setNotes]        = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addSession({
      date,
      locationName: locationName.trim() || null,
      weather:      weather.trim()      || null,
      notes:        notes.trim()        || null,
    });
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <form className={styles.form} onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
        <h3>Новая запись</h3>

        <label>Дата *</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />

        <label>Место</label>
        <input
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
          placeholder="Название водоёма или места"
        />

        <label>Погода</label>
        <input
          value={weather}
          onChange={(e) => setWeather(e.target.value)}
          placeholder="Например: ясно, +18°C, ветер СЗ"
        />

        <label>Заметки</label>
        <textarea
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Что клевало, чем ловил, особенности..."
        />

        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onClose}>Отмена</button>
          <button type="submit">Сохранить</button>
        </div>
      </form>
    </div>
  );
}
