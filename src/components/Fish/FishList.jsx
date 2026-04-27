import { useState } from 'react';
import { searchFish } from '../../utils/fishData.js';
import FishInfo from './FishInfo.jsx';
import styles from './FishList.module.css';

export default function FishList() {
  const [query,    setQuery]    = useState('');
  const [selected, setSelected] = useState(null);

  if (selected) {
    return <FishInfo fish={selected} onBack={() => setSelected(null)} />;
  }

  const results = searchFish(query);

  return (
    <div className={styles.wrap}>
      <input
        className={styles.search}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="🔍 Поиск рыбы…"
      />
      <ul className={styles.list}>
        {results.map((fish) => (
          <li key={fish.id}>
            <button className={styles.item} onClick={() => setSelected(fish)}>
              <span className={styles.dot} style={{ background: fish.color }} />
              <div className={styles.text}>
                <span className={styles.name}>{fish.name}</span>
                <span className={styles.latin}>{fish.latin}</span>
              </div>
              <span className={styles.arrow}>›</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
