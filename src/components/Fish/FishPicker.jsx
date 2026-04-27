import { useState } from 'react';
import { FISH, searchFish } from '../../utils/fishData.js';
import FishInfo from './FishInfo.jsx';
import styles from './FishPicker.module.css';

export default function FishPicker({ value, onChange, onClose }) {
  const [query,    setQuery]    = useState('');
  const [infoFish, setInfoFish] = useState(null);

  const results = searchFish(query);

  if (infoFish) {
    return <FishInfo fish={infoFish} onBack={() => setInfoFish(null)} onSelect={() => { onChange(infoFish.name); onClose(); }} />;
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>Выбор рыбы</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div className={styles.searchWrap}>
          <input
            autoFocus
            className={styles.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск…"
          />
        </div>
        <ul className={styles.list}>
          {results.map((fish) => (
            <li key={fish.id} className={`${styles.item} ${value === fish.name ? styles.selected : ''}`}>
              <button className={styles.itemBtn} onClick={() => { onChange(fish.name); onClose(); }}>
                <span className={styles.dot} style={{ background: fish.color }} />
                <div className={styles.itemText}>
                  <span className={styles.itemName}>{fish.name}</span>
                  <span className={styles.itemLatin}>{fish.latin}</span>
                </div>
              </button>
              <button className={styles.infoBtn} onClick={() => setInfoFish(fish)} title="Подробнее">ℹ</button>
            </li>
          ))}
          {results.length === 0 && (
            <li className={styles.notFound}>
              <button className={styles.itemBtn} onClick={() => { onChange(query); onClose(); }}>
                Добавить «{query}»
              </button>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
