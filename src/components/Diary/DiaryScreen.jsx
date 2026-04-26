import { useEffect, useState } from 'react';
import { useDiaryStore } from '../../store/diaryStore.js';
import { db } from '../../db/index.js';
import SessionCard from './SessionCard.jsx';
import SessionForm from './SessionForm.jsx';
import SessionDetail from './SessionDetail.jsx';
import StatsView from './StatsView.jsx';
import BackupSheet from '../Backup/BackupSheet.jsx';
import styles from './DiaryScreen.module.css';

export default function DiaryScreen() {
  const { sessions, loadSessions } = useDiaryStore();
  const [showForm,    setShowForm]    = useState(false);
  const [activeId,    setActiveId]    = useState(null);
  const [showBackup,  setShowBackup]  = useState(false);
  const [catchCounts, setCatchCounts] = useState({});
  const [tab,         setTab]         = useState('list');

  useEffect(() => { loadSessions(); }, [loadSessions]);

  useEffect(() => {
    db.catches.toArray().then((rows) => {
      const counts = {};
      rows.filter((r) => !r.type || r.type === 'catch').forEach((r) => {
        counts[r.sessionId] = (counts[r.sessionId] ?? 0) + 1;
      });
      setCatchCounts(counts);
    });
  }, [sessions]);

  const activeSession = sessions.find((s) => s.id === activeId) ?? null;

  if (activeSession) {
    return <SessionDetail session={activeSession} onBack={() => setActiveId(null)} />;
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h2>Дневник</h2>
        <div className={styles.headerActions}>
          <button className={styles.cloudBtn} onClick={() => setShowBackup(true)} title="Google Drive бэкап">☁</button>
          <button onClick={() => setShowForm(true)}>+ Запись</button>
        </div>
      </header>

      <div className={styles.tabRow}>
        <button className={`${styles.tabBtn} ${tab === 'list'  ? styles.tabActive : ''}`} onClick={() => setTab('list')}>Записи</button>
        <button className={`${styles.tabBtn} ${tab === 'stats' ? styles.tabActive : ''}`} onClick={() => setTab('stats')}>Статистика</button>
      </div>

      {tab === 'stats' ? (
        <StatsView />
      ) : sessions.length === 0 ? (
        <p className={styles.empty}>Нет записей. Нажми «+ Запись» чтобы добавить первую рыбалку.</p>
      ) : (
        <ul className={styles.list}>
          {sessions.map((s) => (
            <SessionCard key={s.id} session={s} catchCount={catchCounts[s.id] ?? 0} onClick={() => setActiveId(s.id)} />
          ))}
        </ul>
      )}

      {showForm   && <SessionForm   onClose={() => setShowForm(false)} />}
      {showBackup && <BackupSheet   onClose={() => setShowBackup(false)} />}
    </div>
  );
}
