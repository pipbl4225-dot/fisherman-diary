import { useEffect, useState } from 'react';
import { db } from '../../db/index.js';
import { useDiaryStore } from '../../store/diaryStore.js';
import { FISHING_TYPES, TIPS } from '../../utils/fishingTips.js';
import CatchForm from './CatchForm.jsx';
import styles from './SessionDetail.module.css';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export default function SessionDetail({ session, onBack }) {
  const { deleteSession } = useDiaryStore();
  const [catches,    setCatches]    = useState([]);
  const [showForm,   setShowForm]   = useState(false);
  const [showTips,   setShowTips]   = useState(false);

  const ft   = FISHING_TYPES.find((t) => t.id === session.fishingType);
  const tips = session.fishingType ? TIPS[session.fishingType] : null;

  const loadCatches = async () => {
    const rows = await db.catches.where('sessionId').equals(session.id).sortBy('time');
    setCatches(rows);
  };

  useEffect(() => { loadCatches(); }, [session.id]);

  const handleDelete = async () => {
    if (!confirm('Удалить запись и весь улов?')) return;
    await deleteSession(session.id);
    onBack();
  };

  const handleDeleteCatch = async (id) => {
    await db.catches.delete(id);
    loadCatches();
  };

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <button className={styles.back} onClick={onBack}>← Назад</button>
        <button className={styles.danger} onClick={handleDelete}>Удалить</button>
      </header>

      <div className={styles.meta}>
        <h2>{session.locationName || 'Место не указано'}</h2>
        <span className={styles.date}>{formatDate(session.date)}</span>
        {ft && <span className={styles.ftBadge}>{ft.emoji} {ft.label}</span>}
        {session.weather && <p className={styles.weather}>🌤 {session.weather}</p>}
        {session.notes   && <p className={styles.notes}>{session.notes}</p>}
      </div>

      {/* Советы по виду ловли */}
      {tips && (
        <section className={styles.tipsSection}>
          <button className={styles.tipsToggle} onClick={() => setShowTips((v) => !v)}>
            📋 Советы: {tips.label} {showTips ? '▲' : '▼'}
          </button>
          {showTips && (
            <div className={styles.tipsBody}>
              {tips.sections.map((sec) => (
                <div key={sec.title} className={styles.tipsGroup}>
                  <h4 className={styles.tipsGroupTitle}>{sec.title}</h4>
                  <ul className={styles.tipsList}>
                    {sec.items.map((item, i) => (
                      <li key={i} className={styles.tipItem}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>Улов</h3>
          <button onClick={() => setShowForm(true)}>+ Рыба</button>
        </div>

        {catches.length === 0 ? (
          <p className={styles.empty}>Улов не добавлен.</p>
        ) : (
          <ul className={styles.catchList}>
            {catches.map((c) => (
              <li key={c.id} className={styles.catchItem}>
                <div className={styles.catchMain}>
                  <span className={styles.species}>{c.species}</span>
                  <div className={styles.catchMeta}>
                    {c.weight && <span>{c.weight} кг</span>}
                    {c.length && <span>{c.length} см</span>}
                    {c.bait   && <span>наживка: {c.bait}</span>}
                  </div>
                </div>
                <button
                  className={styles.deleteCatch}
                  onClick={() => handleDeleteCatch(c.id)}
                >✕</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {showForm && (
        <CatchForm
          sessionId={session.id}
          onClose={() => { setShowForm(false); loadCatches(); }}
        />
      )}
    </div>
  );
}
