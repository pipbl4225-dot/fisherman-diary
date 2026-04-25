import { useState } from 'react';
import { db } from '../../db/index.js';
import styles from './WaterLevelForm.module.css';

const today = () => new Date().toISOString().slice(0, 10);

export default function WaterLevelForm({ stationId, onClose }) {
  const [date,  setDate]  = useState(today());
  const [level, setLevel] = useState('');
  const [flow,  setFlow]  = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!level) return;
    await db.waterLevels.add({
      stationId,
      level:      parseFloat(level),
      flow:       flow ? parseFloat(flow) : null,
      recordedAt: new Date(date).toISOString(),
    });
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <form className={styles.form} onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
        <h3>Новый замер</h3>

        <label>Дата *</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />

        <label>Уровень воды (см) *</label>
        <input
          autoFocus
          type="number"
          step="1"
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          placeholder="0"
          required
        />

        <label>Расход воды (м³/с)</label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={flow}
          onChange={(e) => setFlow(e.target.value)}
          placeholder="0.00"
        />

        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onClose}>Отмена</button>
          <button type="submit">Сохранить</button>
        </div>
      </form>
    </div>
  );
}
