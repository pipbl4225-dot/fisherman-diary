import { useEffect, useState } from 'react';
import { db } from '../../db/index.js';
import FanDiagram from './FanDiagram.jsx';
import styles from './MarkerMapTab.module.css';

// ─── Анализ маркерной карты ──────────────────────────────────────────────────
function analyzeMap(rays) {
  const results = [];
  if (!rays.length) return results;

  // Перспективные точки: ракушка или камень + глубина 1.5–5м
  const goodPts = [];
  rays.forEach((ray, ri) => {
    ray.points.forEach((pt) => {
      if ((pt.bottomType === 'shell' || pt.bottomType === 'rock') && pt.depth >= 1.5 && pt.depth <= 6) {
        goodPts.push({ ray: ray.landmark || `Луч ${ri+1}`, dist: pt.distance, depth: pt.depth, type: pt.bottomType });
      }
    });
  });
  if (goodPts.length) {
    results.push({
      icon: '⭐',
      title: 'Перспективные точки',
      items: goodPts.map((p) => `${p.ray}: ${p.dist} об., ${p.depth}м — ${p.type === 'shell' ? 'ракушка' : 'камень'}`),
    });
  }

  // Бровки: перепад глубины >0.7м между соседними замерами
  const ledges = [];
  rays.forEach((ray, ri) => {
    const pts = [...ray.points].sort((a, b) => a.distance - b.distance);
    for (let i = 1; i < pts.length; i++) {
      const diff = Math.abs(pts[i].depth - pts[i-1].depth);
      if (diff >= 0.7) {
        ledges.push(`${ray.landmark || `Луч ${ri+1}`}: ${pts[i-1].distance}–${pts[i].distance} об. (${pts[i-1].depth}→${pts[i].depth}м)`);
      }
    }
  });
  if (ledges.length) {
    results.push({ icon: '📍', title: 'Бровки (перепад глубины)', items: ledges });
  }

  // Ямы: точки глубже 4м
  const pits = [];
  rays.forEach((ray, ri) => {
    ray.points.filter((p) => p.depth >= 4).forEach((p) => {
      pits.push(`${ray.landmark || `Луч ${ri+1}`}: ${p.distance} об., ${p.depth}м`);
    });
  });
  if (pits.length) {
    results.push({ icon: '🔵', title: 'Ямы (>4 м)', items: pits });
  }

  // Предупреждения: сплошной ил → плохо для ловли на дне
  const mudRays = rays.filter((ray) => ray.points.length > 0 && ray.points.every((p) => p.bottomType === 'mud'));
  if (mudRays.length) {
    results.push({
      icon: '⚠️',
      title: 'Сплошной ил — осторожно',
      items: mudRays.map((r, i) => `${r.landmark || `Луч ${i+1}`}: все замеры ил — наживка тонет в грунте`),
    });
  }

  if (!results.length) {
    results.push({ icon: 'ℹ️', title: 'Нет данных для анализа', items: ['Добавьте замеры с типом грунта'] });
  }
  return results;
}

const BOTTOM_TYPES = [
  { id: 'mud',   label: 'Ил',      emoji: '🟤' },
  { id: 'sand',  label: 'Песок',   emoji: '🟡' },
  { id: 'shell', label: 'Ракушка', emoji: '🟣' },
  { id: 'rock',  label: 'Камень',  emoji: '⚫' },
  { id: 'snag',  label: 'Коряга',  emoji: '🪵' },
  { id: 'weed',  label: 'Трава',   emoji: '🌿' },
];

// Уникальный ID без коллизий при перезагрузке
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

// ─── Форма замера ────────────────────────────────────────────────────────────
function PointForm({ onAdd, onCancel }) {
  const [distance,   setDistance]   = useState('');
  const [depth,      setDepth]      = useState('');
  const [bottomType, setBottomType] = useState('');

  const submit = () => {
    if (!distance || !depth) return;
    onAdd({
      distance:   parseFloat(distance),
      depth:      parseFloat(depth),
      bottomType: bottomType || null,
      _uid:       uid(),
    });
  };

  return (
    <div className={styles.pointForm}>
      <div className={styles.pfRow}>
        <div className={styles.pfField}>
          <label>Обороты катушки</label>
          <input
            type="number" min="1" value={distance} autoFocus
            onChange={(e) => setDistance(e.target.value)}
            placeholder="напр. 8"
          />
        </div>
        <div className={styles.pfField}>
          <label>Глубина (м)</label>
          <input
            type="number" step="0.1" min="0" value={depth}
            onChange={(e) => setDepth(e.target.value)}
            placeholder="напр. 2.5"
          />
        </div>
      </div>
      <div className={styles.pfTypes}>
        {BOTTOM_TYPES.map((t) => (
          <button
            key={t.id}
            className={`${styles.pfType} ${bottomType === t.id ? styles.pfTypeActive : ''}`}
            onClick={() => setBottomType((prev) => (prev === t.id ? '' : t.id))}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>
      <div className={styles.pfActions}>
        <button className={styles.pfCancel} onClick={onCancel}>Отмена</button>
        <button disabled={!distance || !depth} onClick={submit}>Добавить</button>
      </div>
    </div>
  );
}

// ─── Карточка луча ───────────────────────────────────────────────────────────
function RayCard({ ray, index, onUpdate, onDelete }) {
  const [showForm, setShowForm] = useState(false);

  const addPoint = (pt) => {
    const sorted = [...ray.points, pt].sort((a, b) => a.distance - b.distance);
    onUpdate({ ...ray, points: sorted });
    setShowForm(false);
  };
  const delPoint = (id) => onUpdate({ ...ray, points: ray.points.filter((p) => p._uid !== id) });

  return (
    <div className={styles.rayCard}>
      <div className={styles.rayHeader}>
        <span className={styles.rayIndex}>{index + 1}</span>
        <input
          className={styles.rayName}
          value={ray.landmark}
          onChange={(e) => onUpdate({ ...ray, landmark: e.target.value })}
          placeholder="Ориентир на берегу: дерево, столб, угол дома…"
        />
        <button className={styles.rayDel} onClick={onDelete}>✕</button>
      </div>

      {ray.points.length > 0 && (
        <table className={styles.ptTable}>
          <thead>
            <tr><th>Об.</th><th>Глубина</th><th>Грунт</th><th></th></tr>
          </thead>
          <tbody>
            {ray.points.map((p) => {
              const bt = BOTTOM_TYPES.find((t) => t.id === p.bottomType);
              return (
                <tr key={p._uid}>
                  <td>{p.distance}</td>
                  <td>{p.depth} м</td>
                  <td>{bt ? `${bt.emoji} ${bt.label}` : '—'}</td>
                  <td>
                    <button className={styles.ptDel} onClick={() => delPoint(p._uid)}>✕</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {showForm
        ? <PointForm onAdd={addPoint} onCancel={() => setShowForm(false)} />
        : (
          <button className={styles.addPtBtn} onClick={() => setShowForm(true)}>
            + Замер (обороты + глубина)
          </button>
        )
      }
    </div>
  );
}

// ─── Главный компонент ───────────────────────────────────────────────────────
export default function MarkerMapTab({ spotId }) {
  const [maps,       setMaps]       = useState([]);
  const [activeMap,  setActiveMap]  = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const loadMaps = async () => {
    const rows = await db.markerMaps.where('spotId').equals(spotId).toArray();
    setMaps(rows);
  };

  useEffect(() => { loadMaps(); }, [spotId]);

  const createMap = async () => {
    const id  = await db.markerMaps.add({ spotId, name: 'Бланк 1', rays: [], createdAt: new Date().toISOString() });
    const map = await db.markerMaps.get(id);
    setActiveMap({ ...map, rays: [] });
  };

  const openMap  = (m) => setActiveMap({ ...m, rays: (m.rays ?? []).map((r) => ({ ...r, _uid: r._uid ?? uid() })) });
  const saveMap  = async () => {
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
  const updateRay = (id, updated) => setActiveMap((m) => ({
    ...m, rays: m.rays.map((r) => r._uid === id ? updated : r),
  }));
  const deleteRay = (id) => setActiveMap((m) => ({
    ...m, rays: m.rays.filter((r) => r._uid !== id),
  }));

  // ── Редактор ───────────────────────────────────────────────────────────────
  if (activeMap) {
    return (
      <div className={styles.editor}>
        {/* Название бланка */}
        <input
          className={styles.mapName}
          value={activeMap.name}
          onChange={(e) => setActiveMap((m) => ({ ...m, name: e.target.value }))}
          placeholder="Название бланка"
        />

        {/* Диаграмма — всегда видна, обновляется в реальном времени */}
        <div className={styles.diagramWrap}>
          <FanDiagram rays={activeMap.rays} />
          {activeMap.rays.length === 0 && (
            <p className={styles.diagramHint}>
              Добавьте лучи ниже — они появятся на схеме
            </p>
          )}
        </div>

        {/* Инструкция */}
        {activeMap.rays.length === 0 && (
          <div className={styles.howTo}>
            <p>📍 <b>Как заполнять:</b></p>
            <p>1. Нажмите <b>+ Луч</b> — это одно направление заброса</p>
            <p>2. Укажите ориентир на берегу (дерево, столб…)</p>
            <p>3. Добавьте замеры: <b>обороты катушки</b> при подмотке + <b>глубина</b> по маркерному поплавку + тип грунта</p>
            <p>4. Схема обновляется автоматически</p>
          </div>
        )}

        {/* Лучи */}
        <div className={styles.rays}>
          {activeMap.rays.map((ray, i) => (
            <RayCard
              key={ray._uid}
              ray={ray}
              index={i}
              onUpdate={(updated) => updateRay(ray._uid, updated)}
              onDelete={() => deleteRay(ray._uid)}
            />
          ))}

          {activeMap.rays.length < 9 && (
            <button className={styles.addRayBtn} onClick={addRay}>
              + Луч / ориентир {activeMap.rays.length > 0 ? `(${activeMap.rays.length}/9)` : ''}
            </button>
          )}
        </div>

        {/* Анализ */}
        {activeMap.rays.some((r) => r.points.length > 0) && (
          <div className={styles.analysisSection}>
            <button className={styles.analysisToggle} onClick={() => setShowAnalysis((v) => !v)}>
              🔍 Анализ перспективных мест {showAnalysis ? '▲' : '▼'}
            </button>
            {showAnalysis && (
              <div className={styles.analysisBody}>
                {analyzeMap(activeMap.rays).map((block) => (
                  <div key={block.title} className={styles.analysisBlock}>
                    <p className={styles.analysisTitle}>{block.icon} {block.title}</p>
                    <ul className={styles.analysisList}>
                      {block.items.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
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

  // ── Список бланков ──────────────────────────────────────────────────────────
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
