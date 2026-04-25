import { useEffect, useState } from 'react';
import { useDiaryStore } from '../../store/diaryStore.js';
import SessionCard from './SessionCard.jsx';
import SessionForm from './SessionForm.jsx';
import SessionDetail from './SessionDetail.jsx';
import styles from './DiaryScreen.module.css';

export default function DiaryScreen() {
  const { sessions, loadSessions } = useDiaryStore();
  const [showForm,   setShowForm]   = useState(false);
  const [activeId,   setActiveId]   = useState(null);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const activeSession = sessions.find((s) => s.id === activeId) ?? null;

  if (activeSession) {
    return <SessionDetail session={activeSession} onBack={() => setActiveId(null)} />;
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h2>Дневник</h2>
        <button onClick={() => setShowForm(true)}>+ Запись</button>
      </header>

      {sessions.length === 0 ? (
        <p className={styles.empty}>Нет записей. Нажми «+ Запись» чтобы добавить первую рыбалку.</p>
      ) : (
        <ul className={styles.list}>
          {sessions.map((s) => (
            <SessionCard key={s.id} session={s} onClick={() => setActiveId(s.id)} />
          ))}
        </ul>
      )}

      {showForm && <SessionForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
