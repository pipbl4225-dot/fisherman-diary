import { useEffect, useState } from 'react';
import { useTackleStore } from '../../store/tackleStore.js';
import { useRigStore }    from '../../store/rigStore.js';
import { useSetupStore }  from '../../store/setupStore.js';
import { FISHING_TYPES }  from '../../utils/fishingTips.js';
import TackleCard   from './TackleCard.jsx';
import TackleForm   from './TackleForm.jsx';
import RigEditor    from './RigEditor.jsx';
import SetupEditor  from './SetupEditor.jsx';
import RigBuilder   from './RigBuilder.jsx';
import FishList     from '../Fish/FishList.jsx';
import styles from './TackleScreen.module.css';

const TYPES = ['Все', 'Удилище', 'Катушка', 'Леска', 'Шнур', 'Крючок', 'Приманка', 'Поплавок', 'Грузило', 'Мормышка', 'Прочее'];

export default function TackleScreen() {
  const { tackles, loadTackles, deleteTackle } = useTackleStore();
  const { rigs,    loadRigs,    deleteRig }     = useRigStore();
  const { setups,  loadSetups,  deleteSetup }   = useSetupStore();

  const [tab,       setTab]       = useState('gear');   // 'gear' | 'rigs' | 'setups' | 'montage' | 'fish'
  const [showForm,  setShowForm]  = useState(false);
  const [editItem,  setEditItem]  = useState(null);
  const [editRig,         setEditRig]         = useState(null);
  const [showRigEditor,   setShowRigEditor]   = useState(false);
  const [editSetup,       setEditSetup]       = useState(null);
  const [showSetupEditor, setShowSetupEditor] = useState(false);
  const [filter,          setFilter]          = useState('Все');

  useEffect(() => { loadTackles(); loadRigs(); loadSetups(); }, [loadTackles, loadRigs, loadSetups]);

  if (showRigEditor) {
    return (
      <RigEditor
        rig={editRig}
        onClose={() => { setShowRigEditor(false); setEditRig(null); loadRigs(); }}
      />
    );
  }

  if (showSetupEditor) {
    return (
      <SetupEditor
        setup={editSetup}
        onClose={() => { setShowSetupEditor(false); setEditSetup(null); loadSetups(); }}
      />
    );
  }

  const visible = filter === 'Все' ? tackles : tackles.filter((t) => t.type === filter);

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h2>Рюкзак</h2>
        {tab === 'gear'    && <button onClick={() => setShowForm(true)}>+ Снасть</button>}
        {tab === 'rigs'    && <button onClick={() => { setEditRig(null); setShowRigEditor(true); }}>+ Огрузка</button>}
        {tab === 'setups'  && <button onClick={() => { setEditSetup(null); setShowSetupEditor(true); }}>+ Сборка</button>}
      </header>

      {/* Переключатель вкладок */}
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'gear'    ? styles.activeTab : ''}`} onClick={() => setTab('gear')}>Инвентарь</button>
        <button className={`${styles.tab} ${tab === 'rigs'    ? styles.activeTab : ''}`} onClick={() => setTab('rigs')}>Огрузка</button>
        <button className={`${styles.tab} ${tab === 'setups'  ? styles.activeTab : ''}`} onClick={() => setTab('setups')}>Сборки</button>
        <button className={`${styles.tab} ${tab === 'montage' ? styles.activeTab : ''}`} onClick={() => setTab('montage')}>Монтаж</button>
        <button className={`${styles.tab} ${tab === 'fish'    ? styles.activeTab : ''}`} onClick={() => setTab('fish')}>Рыбы</button>
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

      {/* --- Сборки --- */}
      {tab === 'setups' && (
        <>
          {setups.length === 0 ? (
            <p className={styles.empty}>Нет сборок. Нажми «+ Сборка» чтобы собрать комплект.</p>
          ) : (
            <ul className={styles.list}>
              {setups.map((s) => {
                const ft = FISHING_TYPES.find((t) => t.id === s.fishingType);
                const slotCount = Object.values(s.slots ?? {}).filter(Boolean).length;
                return (
                  <li key={s.id} className={styles.rigCard}>
                    <div className={styles.rigInfo}>
                      <span className={styles.rigName}>{s.name}</span>
                      <span className={styles.rigMeta}>
                        {ft ? `${ft.emoji} ${ft.label} · ` : ''}{slotCount} позиций
                      </span>
                    </div>
                    <div className={styles.rigActions}>
                      <button className={styles.rigEdit} onClick={() => { setEditSetup(s); setShowSetupEditor(true); }}>✏</button>
                      <button className={styles.rigDel}  onClick={() => deleteSetup(s.id)}>✕</button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      {/* --- Монтаж --- */}
      {tab === 'montage' && <RigBuilder tackles={tackles} />}

      {/* --- Рыбы --- */}
      {tab === 'fish' && <FishList />}

      {showForm && (
        <TackleForm item={editItem} onClose={() => { setShowForm(false); setEditItem(null); }} />
      )}
    </div>
  );
}
