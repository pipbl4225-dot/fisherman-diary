import { useEffect, useState } from 'react';
import { useTackleStore } from '../../store/tackleStore.js';
import TackleCard from './TackleCard.jsx';
import TackleForm from './TackleForm.jsx';
import styles from './TackleScreen.module.css';

const TYPES = ['Все', 'Удилище', 'Катушка', 'Леска', 'Крючок', 'Приманка', 'Поплавок', 'Грузило', 'Прочее'];

export default function TackleScreen() {
  const { tackles, loadTackles, deleteTackle } = useTackleStore();
  const [showForm,  setShowForm]  = useState(false);
  const [editItem,  setEditItem]  = useState(null);
  const [filter,    setFilter]    = useState('Все');

  useEffect(() => { loadTackles(); }, [loadTackles]);

  const visible = filter === 'Все'
    ? tackles
    : tackles.filter((t) => t.type === filter);

  const handleEdit = (item) => { setEditItem(item); setShowForm(true); };
  const handleClose = () => { setShowForm(false); setEditItem(null); };

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h2>Снасти</h2>
        <button onClick={() => setShowForm(true)}>+ Снасть</button>
      </header>

      <div className={styles.filters}>
        {TYPES.map((t) => (
          <button
            key={t}
            className={`${styles.chip} ${filter === t ? styles.active : ''}`}
            onClick={() => setFilter(t)}
          >{t}</button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className={styles.empty}>Нет снастей. Нажми «+ Снасть» чтобы добавить.</p>
      ) : (
        <ul className={styles.list}>
          {visible.map((item) => (
            <TackleCard
              key={item.id}
              item={item}
              onEdit={() => handleEdit(item)}
              onDelete={() => deleteTackle(item.id)}
            />
          ))}
        </ul>
      )}

      {showForm && <TackleForm item={editItem} onClose={handleClose} />}
    </div>
  );
}
