import { useEffect, useState } from 'react';
import { useTackleStore } from '../../store/tackleStore.js';
import { useRigStore }    from '../../store/rigStore.js';
import TackleCard  from './TackleCard.jsx';
import TackleForm  from './TackleForm.jsx';
import RigEditor   from './RigEditor.jsx';
import styles from './TackleScreen.module.css';

const TYPES = ['Все', 'Удилище', 'Катушка', 'Леска', 'Крючок', 'Приманка', 'Поплавок', 'Грузило', 'Прочее'];

export default function TackleScreen() {
  const { tackles, loadTackles, deleteTackle } = useTackleStore();
  const { rigs,    loadRigs,    deleteRig }     = useRigStore();

  const [tab,       setTab]       = useState('gear');   // 'gear' | 'rigs'
  const [showForm,  setShowForm]  = useState(false);
  const [editItem,  setEditItem]  = useState(null);
  const [editRig,   setEditRig]   = useState(null);     // null | rig obj
  const [showRigEditor, setShowRigEditor] = useState(false);
  const [filter,    setFilter]    = useState('Все');

  useEffect(() => { loadTackles(); loadRigs(); }, [loadTackles, loadRigs]);

  // Открыть редактор оснастки поверх экрана
  if (showRigEditor) {
    return (
      <RigEditor
        rig={editRig}
        onClose={() => { setShowRigEditor(false); setEditRig(null); loadRigs(); }}
      />
    );
  }

  const visible = filter === 'Все' ? tackles : tackles.filter((t) => t.type === filter);

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h2>Снасти</h2>
        {tab === 'gear' && <button onClick={() => setShowForm(true)}>+ Снасть</button>}
        {tab === 'rigs' && (
          <button onClick={() => { setEditRig(null); setShowRigEditor(true); }}>+ Оснастка</button>
        )}
      </header>

      {/* Переключатель вкладок */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'gear' ? styles.activeTab : ''}`}
          onClick={() => setTab('gear')}
        >Инвентарь</button>
        <button
          className={`${styles.tab} ${tab === 'rigs' ? styles.activeTab : ''}`}
          onClick={() => setTab('rigs')}
        >Огрузка</button>
      </div>

      {/* --- Инвентарь --- */}
      {tab === 'gear' && (
        <>
          <div className={styles.filters}>
            {TYPES.map((t) => (
              <button
                key={t}
                className={`${styles.chip} ${filter === t ? styles.active : ''}`}
                onClick={() => setFilter(t)}
              >{t}</button>
            ))}
          </div>

          {visible.length === 0 ? (
            <p className={styles.empty}>Нет снастей.</p>
          ) : (
            <ul className={styles.list}>
              {visible.map((item) => (
                <TackleCard
                  key={item.id}
                  item={item}
                  onEdit={() => { setEditItem(item); setShowForm(true); }}
                  onDelete={() => deleteTackle(item.id)}
                />
              ))}
            </ul>
          )}
        </>
      )}

      {/* --- Оснастки --- */}
      {tab === 'rigs' && (
        <>
          {rigs.length === 0 ? (
            <p className={styles.empty}>Нет оснасток. Нажми «+ Оснастка» чтобы создать первую.</p>
          ) : (
            <ul className={styles.list}>
              {rigs.map((r) => (
                <li key={r.id} className={styles.rigCard}>
                  <div className={styles.rigInfo}>
                    <span className={styles.rigName}>{r.name || `Оснастка ${r.floatLoad}г`}</span>
                    <span className={styles.rigMeta}>{r.floatType} · {r.floatLoad}г · {(r.weights ?? []).length} грузиков</span>
                  </div>
                  <div className={styles.rigActions}>
                    <button className={styles.rigEdit} onClick={() => { setEditRig(r); setShowRigEditor(true); }}>✏</button>
                    <button className={styles.rigDel}  onClick={() => deleteRig(r.id)}>✕</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {showForm && (
        <TackleForm item={editItem} onClose={() => { setShowForm(false); setEditItem(null); }} />
      )}
    </div>
  );
}
