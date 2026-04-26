import { FISHING_TYPES } from '../../utils/fishingTips.js';
import { weatherStr }    from '../../utils/weather.js';
import styles from './SessionCard.module.css';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function SessionCard({ session, onClick }) {
  const ft = FISHING_TYPES.find((t) => t.id === session.fishingType);
  const wStr = weatherStr(session.weather);
  const timeStr = session.timeStart
    ? session.timeEnd ? `${session.timeStart} – ${session.timeEnd}` : `с ${session.timeStart}`
    : '';
  return (
    <li className={styles.card} onClick={onClick}>
      <div className={styles.top}>
        <div className={styles.dateWrap}>
          <span className={styles.date}>{formatDate(session.date)}</span>
          {timeStr && <span className={styles.time}>{timeStr}</span>}
        </div>
        {ft && <span className={styles.badge}>{ft.emoji} {ft.label}</span>}
      </div>
      <div className={styles.location}>{session.locationName || 'Место не указано'}</div>
      {wStr && <p className={styles.weatherLine}>{wStr}</p>}
      {session.notes && <p className={styles.notes}>{session.notes}</p>}
    </li>
  );
}
