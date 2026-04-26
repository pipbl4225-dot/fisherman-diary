import { FISHING_TYPES } from '../../utils/fishingTips.js';
import styles from './SessionCard.module.css';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export default function SessionCard({ session, onClick }) {
  const ft = FISHING_TYPES.find((t) => t.id === session.fishingType);
  return (
    <li className={styles.card} onClick={onClick}>
      <div className={styles.top}>
        <div className={styles.date}>{formatDate(session.date)}</div>
        {ft && <span className={styles.badge}>{ft.emoji} {ft.label}</span>}
      </div>
      <div className={styles.location}>{session.locationName || 'Место не указано'}</div>
      {session.notes && <p className={styles.notes}>{session.notes}</p>}
    </li>
  );
}
