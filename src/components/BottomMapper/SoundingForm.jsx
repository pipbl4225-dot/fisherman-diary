import { useState } from 'react';
import { useBottomStore } from '../../store/bottomStore.js';
import styles from './SoundingForm.module.css';

export default function SoundingForm({ latlng, spotId, onClose }) {
  const { addSounding } = useBottomStore();
  const [depth, setDepth] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!depth) return;
    await addSounding({
      spotId,
      lat:   latlng.lat,
      lng:   latlng.lng,
      depth: parseFloat(depth),
    });
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <form className={styles.form} onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
        <h3>Промер глубины</h3>
        <p className={styles.coords}>{latlng.lat.toFixed(5)}, {latlng.lng.toFixed(5)}</p>

        <label>Глубина (м) *</label>
        <input
          autoFocus
          type="number"
          step="0.1"
          min="0"
          value={depth}
          onChange={(e) => setDepth(e.target.value)}
          placeholder="0.0"
          required
        />

        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onClose}>Отмена</button>
          <button type="submit">Добавить</button>
        </div>
      </form>
    </div>
  );
}
