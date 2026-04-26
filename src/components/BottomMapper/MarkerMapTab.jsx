import { useEffect, useState } from 'react';
import { db } from '../../db/index.js';
import FanDiagram from './FanDiagram.jsx';
import styles from './MarkerMapTab.module.css';

const BOTTOM_TYPES = [
  { id: 'mud',   label: 'Ил',      emoji: '🟤' },
  { id: 'sand',  label: 'Песок',   emoji: '🟡' },
  { id: 'shell', label: 'Ракушка', emoji: '🟣' },
  { id: 'rock',  label: 'Камень',  emoji: '⚫' },
  { id: 'snag',  label: 'Коряга',  emoji: '🪵' },
  { id: 'weed',  label: 'Трава',   emoji: '🌿' },
];

let _id = 0;
const uid = () => String(++_id);

// ─── Форма добавления замера ────────────────────────────────────────────────
function PointForm({ onAdd, onCancel }) {
  const [distance,   setDistance]   = useState('');
  const [depth,      setDepth]      = useState('');
  const [bottomType, setBottomType] = useState('');

  return (
    <div className={styles.pointForm}>
      <div className={styles.pfRow}>
        <div className={styles.pfField}>
          <label>Расстояние (обороты)</label>
          <input type="number" min="1" value={distance}
            onChange={(e) => setDistance(e.target.value)} placeholder="обор." />
        </div>
        <div className={styles.pfField}>
          <label>Глубина (м)</label>
          <input type="number" step="0.1" min="0" value={depth}
            onChange={(e) => setDepth(e.target.value)} placeholder="м" />
        </div>
      </div>
      <div className={styles.pfTypes}>
        {BOTTOM_TYPES.map((t) => (
          <button key={t.id}
            className={`${styles.pfType} ${bottomType === t.id ? styles.pfTypeActive : ''}`}
            onClick={() => setBottomType(t.id)}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>
      <div className={styles.pfActions}>
        <button className={styles.pfCancel} onClick={onCancel}>Отмена</button>
        <button
          disabled={!distance || !depth}
          onClick={() => onAdd({ distance: parseFloat(distance), depth: parseFloat(depth), bottomType: bottomType || null, _uid: uid() })}>
          Добавить
        </button>
      </div>
    </div>
  );
}

// ─── Луч (ориентир + замеры) ────────────────────────────────────────────────
function RayCard({ ray, onUpdate, onDelete }) {
  const [showForm, setShowForm] = useState(false);

  const addPoint = (pt) => {
    onUpdate({ ...ray, points: [...ray.points, pt].sort((a, b) => a.distance - b.distance) });
    setShowForm(false);
  };
  const delPoint = (uid) => onUpdate({ ...ray, points: ray.points.filter((p) => p._uid !== uid) });

  return (
    <div className={styles.rayCard}>
      <div className={styles.rayHeader}>
        <input
          className={styles.rayName}
          value={ray.landmark}
          onChange={(e) => onUpdate({ ...ray, landmark: e.target.value })}
          placeholder="Название ориентира (дерево, столб…)"
        />
        <button className={styles.rayDel} onClick={onDelete}>✕</button>
      </div>

      {ray.points.length > 0 && (
        <table className={styles.ptTable}>
          <thead>
            <tr><th>Обор.</th><th>Глубина</th><th>Грунт</th><th></th></tr>
          </thead>
          <tbody>
            {ray.points.map((p) => {
              const bt = BOTTOM_TYPES.find((t) => t.id === p.bottomType);
              return (
                <tr key={p._uid}>
                  <td>{p.distance}</td>
                  <td>{p.depth} м</td>
                  <td>{bt ? `${bt.emoji} ${bt.label}` : '—'}</td>
                  <td><button className={styles.ptDel} onClick={() => delPoint(p._uid)}>✕</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {showForm
        ? <PointForm onAdd={addPoint} onCancel={() => setShowForm(false)} />
        : <button className={styles.addPtBtn} onClick={() => setShowForm(true)}>+ Замер</button>
      }
    </div>
  );
}

// ─── Главный компонент ───────────────────────────────────────────────────────
export default function MarkerMapTab({ spotId }) {
  const [maps,       setMaps]       = useState([]);
  const [activeMap,  setActiveMap]  = useState(null); // null | map obj (in-memory)
  const [viewFan,    setViewFan]    = useState(false);

  const loadMaps = async () => {
    const rows = await db.markerMaps.where('spotId').equals(spotId).toArray();
    setMaps(rows);
  };

  useEffect(() => { loadMaps(); }, [spotId]);

  const createMap = async () => {
    const id = await db.markerMaps.add({
      spotId, name: 'Новый бланк', rays: [], createdAt: new Date().toISOString(),
    });
    const map = await db.markerMaps.get(id);
    setActiveMap({ ...map, rays: [] });
  };

  const openMap = (m) => setActiveMap({ ...m, rays: m.rays ?? [] });

  const saveMap = async () => {
    await db.markerMaps.update(activeMap.id, { name: activeMap.name, rays: activeMap.rays });
    setActiveMap(null);
    loadMaps();
  };

  const deleteMap = async (id) => {
    if (!confirm('Удалить бланк?')) return;
    await db.markerMaps.delete(id);
    loadMaps();
  };

  const addRay = () => setActiveMap((m) => ({
    ...m, rays: [...m.rays, { _uid: uid(), landmark: '', points: [] }],
  }));

  const updateRay = (uid, updated) => setActiveMap((m) => ({
    ...m, rays: m.rays.map((r) => r._uid === uid ? updated : r),
  }));

  const deleteRay = (uid) => setActiveMap((m) => ({
    ...m, rays: m.rays.filter((r) => r._uid !== uid),
  }));

  // ── Редактор бланка ─────────────────────────────────────────────────────
  if (activeMap) {
    return (
      <div className={styles.editor}>
        <div className={styles.editorHeader}>
          <input
            className={styles.mapName}
            value={activeMap.name}
            onChange={(e) => setActiveMap((m) => ({ ...m, name: e.target.value }))}
            placeholder="Название бланка"
          />
          <button className={styles.fanBtn} onClick={() => setViewFan((v) => !v)}>
            {viewFan ? '📋 Бланк' : '🌐 Веер'}
          </button>
        </div>

        {viewFan ? (
          <FanDiagram rays={activeMap.rays} />
        ) : (
          <div className={styles.rays}>
            {activeMap.rays.length === 0 && (
              <p className={styles.empty}>Добавь лучи (направления забросов) по ориентирам на берегу.</p>
            )}
            {activeMap.rays.map((ray) => (
              <RayCard
                key={ray._uid}
                ray={ray}
                onUpdate={(updated) => updateRay(ray._uid, updated)}
                onDelete={() => deleteRay(ray._uid)}
              />
            ))}
            {activeMap.rays.length < 5 && (
              <button className={styles.addRayBtn} onClick={addRay}>+ Луч / ориентир</button>
            )}
          </div>
        )}

        <div className={styles.editorFooter}>
          <button className={styles.cancelBtn} onClick={() => { setActiveMap(null); loadMaps(); }}>Отмена</button>
          <button onClick={saveMap}>Сохранить</button>
        </div>
      </div>
    );
  }

  // ── Список бланков ───────────────────────────────────────────────────────
  return (
    <div className={styles.list}>
      {maps.length === 0 && (
        <p className={styles.empty}>Нет бланков. Создай первый маркерный бланк для этого места.</p>
      )}
      {maps.map((m) => (
        <div key={m.id} className={styles.mapCard}>
          <div className={styles.mapInfo} onClick={() => openMap(m)}>
            <span className={styles.mapCardName}>{m.name}</span>
            <span className={styles.mapMeta}>{(m.rays ?? []).length} лучей</span>
          </div>
          <button className={styles.mapDel} onClick={() => deleteMap(m.id)}>✕</button>
        </div>
      ))}
      <button className={styles.createBtn} onClick={createMap}>+ Новый бланк</button>
    </div>
  );
}
