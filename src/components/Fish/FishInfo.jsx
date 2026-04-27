import styles from './FishInfo.module.css';

const SEASON_LABEL = {
  spring: { label: 'Весна', emoji: '🌱' },
  summer: { label: 'Лето',  emoji: '☀️' },
  autumn: { label: 'Осень', emoji: '🍂' },
  winter: { label: 'Зима',  emoji: '❄️' },
};

const MONTH_SHORT = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];

export default function FishInfo({ fish, onBack, onSelect }) {
  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <button className={styles.back} onClick={onBack}>← Назад</button>
        {onSelect && (
          <button className={styles.select} onClick={onSelect}>Выбрать</button>
        )}
      </header>

      <div className={styles.hero}>
        <div className={styles.dot} style={{ background: fish.color }} />
        <div>
          <h2 className={styles.name}>{fish.name}</h2>
          <p className={styles.latin}>{fish.latin}</p>
        </div>
      </div>

      {/* Ключевые параметры */}
      <div className={styles.params}>
        <div className={styles.param}>
          <span className={styles.paramLabel}>Макс. вес</span>
          <span className={styles.paramVal}>{fish.maxWeight} кг</span>
        </div>
        <div className={styles.param}>
          <span className={styles.paramLabel}>Лучшее время</span>
          <span className={styles.paramVal}>{fish.bestTime}</span>
        </div>
      </div>

      {/* Сезоны */}
      <div className={styles.card}>
        <h4 className={styles.cardTitle}>Сезонность</h4>
        <div className={styles.seasons}>
          {Object.entries(SEASON_LABEL).map(([key, { label, emoji }]) => (
            <div key={key} className={`${styles.season} ${fish.seasons.includes(key) ? styles.seasonActive : styles.seasonOff}`}>
              <span>{emoji}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
        {fish.bestMonths?.length > 0 && (
          <p className={styles.bestMonths}>
            Лучшие месяцы: <strong>{fish.bestMonths.map((m) => MONTH_SHORT[m - 1]).join(', ')}</strong>
          </p>
        )}
      </div>

      {/* Среда обитания */}
      <div className={styles.card}>
        <h4 className={styles.cardTitle}>📍 Среда обитания</h4>
        <p className={styles.cardText}>{fish.habitat}</p>
      </div>

      {/* Лучшие приманки */}
      <div className={styles.card}>
        <h4 className={styles.cardTitle}>🪱 Лучшие приманки</h4>
        <div className={styles.baitList}>
          {fish.bait.map((b) => (
            <span key={b} className={styles.baitChip}>{b}</span>
          ))}
        </div>
      </div>

      {/* Совет */}
      {fish.tip && (
        <div className={styles.tipCard}>
          <span className={styles.tipIcon}>💡</span>
          <p className={styles.tipText}>{fish.tip}</p>
        </div>
      )}

      {/* Описание по Сабанееву */}
      <div className={styles.card}>
        <h4 className={styles.cardTitle}>📖 По Сабанееву</h4>
        {fish.sabaneev.split('\n\n').map((para, i) => (
          <p key={i} className={styles.cardText}>{para}</p>
        ))}
      </div>
    </div>
  );
}
