import styles from './SessionCard.module.css';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export default function SessionCard({ session, onClick }) {
  return (
    <li className={styles.card} onClick={onClick}>
      <div className={styles.date}>{formatDate(session.date)}</div>
      <div className={styles.location}>{session.locationName || 'Место не указано'}</div>
      {session.notes && <p className={styles.notes}>{session.notes}</p>}
    </li>
  );
}
