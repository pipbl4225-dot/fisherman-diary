import { useState } from 'react';
import { db } from '../../db/index.js';
import styles from './SessionForm.module.css';

export default function CatchForm({ sessionId, onClose }) {
  const [species, setSpecies] = useState('');
  const [weight,  setWeight]  = useState('');
  const [length,  setLength]  = useState('');
  const [bait,    setBait]    = useState('');
  const [tackle,  setTackle]  = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!species.trim()) return;
    await db.catches.add({
      sessionId,
      species: species.trim(),
      weight:  weight ? parseFloat(weight) : null,
      length:  length ? parseFloat(length) : null,
      bait:    bait.trim()   || null,
      tackle:  tackle.trim() || null,
      time:    new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <form className={styles.form} onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
        <h3>Добавить рыбу</h3>

        <label>Вид *</label>
        <input
          autoFocus
          value={species}
          onChange={(e) => setSpecies(e.target.value)}
          placeholder="Например: Щука"
          required
        />

        <label>Вес (кг)</label>
        <input type="number" step="0.01" min="0" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="0.00" />

        <label>Длина (см)</label>
        <input type="number" step="0.1" min="0" value={length} onChange={(e) => setLength(e.target.value)} placeholder="0.0" />

        <label>Наживка / приманка</label>
        <input value={bait} onChange={(e) => setBait(e.target.value)} placeholder="Червь, воблер, блесна..." />

        <label>Снасть</label>
        <input value={tackle} onChange={(e) => setTackle(e.target.value)} placeholder="Спиннинг, поплавочная..." />

        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onClose}>Отмена</button>
          <button type="submit">Сохранить</button>
        </div>
      </form>
    </div>
  );
}
