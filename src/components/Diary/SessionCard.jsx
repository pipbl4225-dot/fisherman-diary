import { FISHING_TYPES } from '../../utils/fishingTips.js';
import { weatherStr }    from '../../utils/weather.js';
import styles from './SessionCard.module.css';

const TODAY = new Date().toISOString().slice(0, 10);

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function SessionCard({ session, catchCount, onClick }) {
  const ft     = FISHING_TYPES.find((t) => t.id === session.fishingType);
  const wStr   = weatherStr(session.weather);
  const isLive = session.date === TODAY && !session.timeEnd;
  const timeStr = session.timeStart
    ? session.timeEnd ? `${session.timeStart} – ${session.timeEnd}` : `с ${session.timeStart}`
    : '';

  return (
    <li className={`${styles.card} ${isLive ? styles.cardLive : ''}`} onClick={onClick}>
      {isLive && (
        <div className={styles.liveBadge}>
          <span className={styles.liveDot} /> Активная
        </div>
      )}
      <div className={styles.top}>
        <div className={styles.dateWrap}>
          <span className={styles.date}>{formatDate(session.date)}</span>
          {timeStr && <span className={styles.time}>{timeStr}</span>}
        </div>
        <div className={styles.badges}>
          {ft && <span className={styles.badge}>{ft.emoji} {ft.label}</span>}
          {catchCount > 0 && <span className={styles.catchBadge}>🐟 {catchCount}</span>}
        </div>
      </div>
      <div className={styles.location}>{session.locationName || 'Место не указано'}</div>
      {session.targetFish && <p className={styles.targetFish}>🎯 {session.targetFish}</p>}
      {wStr && <p className={styles.weatherLine}>{wStr}</p>}
      {session.notes && <p className={styles.notes}>{session.notes}</p>}
    </li>
  );
}
