import { useState } from 'react';
import { useMapStore } from '../../store/mapStore.js';
import styles from './SpotForm.module.css';

export default function SpotForm({ latlng, onClose }) {
  const { addSpot } = useMapStore();
  const [name,  setName]  = useState('');
  const [depth, setDepth] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await addSpot({
      name: name.trim(),
      lat:  latlng.lat,
      lng:  latlng.lng,
      depth: depth ? parseFloat(depth) : null,
      notes: notes.trim() || null,
    });
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <form className={styles.form} onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
        <h3>Новая точка</h3>
        <p className={styles.coords}>
          {latlng.lat.toFixed(5)}, {latlng.lng.toFixed(5)}
        </p>

        <label>Название *</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Например: Любимый омут"
          required
        />

        <label>Глубина (м)</label>
        <input
          type="number"
          step="0.1"
          min="0"
          value={depth}
          onChange={(e) => setDepth(e.target.value)}
          placeholder="0.0"
        />

        <label>Заметки</label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Описание места..."
        />

        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onClose}>Отмена</button>
          <button type="submit">Сохранить</button>
        </div>
      </form>
    </div>
  );
}
