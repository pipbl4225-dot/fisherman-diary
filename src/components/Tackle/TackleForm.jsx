import { useState } from 'react';
import { useTackleStore } from '../../store/tackleStore.js';
import { db } from '../../db/index.js';
import styles from './TackleForm.module.css';

const TYPES = ['Удилище', 'Катушка', 'Леска', 'Крючок', 'Приманка', 'Поплавок', 'Грузило', 'Прочее'];

export default function TackleForm({ item, onClose }) {
  const { addTackle, loadTackles } = useTackleStore();
  const [name,   setName]   = useState(item?.name   ?? '');
  const [type,   setType]   = useState(item?.type   ?? TYPES[0]);
  const [brand,  setBrand]  = useState(item?.brand  ?? '');
  const [weight, setWeight] = useState(item?.weight ?? '');
  const [color,  setColor]  = useState(item?.color  ?? '');
  const [notes,  setNotes]  = useState(item?.notes  ?? '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const data = {
      name:   name.trim(),
      type,
      brand:  brand.trim()  || null,
      weight: weight ? parseFloat(weight) : null,
      color:  color.trim()  || null,
      notes:  notes.trim()  || null,
    };
    if (item) {
      await db.tackles.update(item.id, data);
      await loadTackles();
    } else {
      await addTackle(data);
    }
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <form className={styles.form} onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
        <h3>{item ? 'Редактировать снасть' : 'Новая снасть'}</h3>

        <label>Название *</label>
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Например: Shimano Stradic" required />

        <label>Тип</label>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          {TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>

        <label>Бренд</label>
        <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Shimano, Daiwa..." />

        <label>Вес (г)</label>
        <input type="number" step="0.1" min="0" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="0.0" />

        <label>Цвет</label>
        <input value={color} onChange={(e) => setColor(e.target.value)} placeholder="Красный, #FF0000..." />

        <label>Заметки</label>
        <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Любые заметки..." />

        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onClose}>Отмена</button>
          <button type="submit">{item ? 'Сохранить' : 'Добавить'}</button>
        </div>
      </form>
    </div>
  );
}
