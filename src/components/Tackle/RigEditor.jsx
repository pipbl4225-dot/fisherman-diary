import { useState } from 'react';
import { useRigStore } from '../../store/rigStore.js';
import RigDiagram from './RigDiagram.jsx';
import styles from './RigEditor.module.css';

const FLOAT_TYPES  = ['болонский', 'матчевый', 'штекерный', 'карповый', 'зимний', 'другой'];
const FLOAT_LOADS  = [0.5, 0.75, 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 15];
const WEIGHT_TYPES = ['дробинка', 'оливка', 'подпасок', 'концентратор'];
const WEIGHT_SIZES = [0.05, 0.1, 0.2, 0.3, 0.5, 0.75, 1.0, 1.5, 2.0, 3.0, 5.0];

let _key = 0;
const newKey = () => String(++_key);

export default function RigEditor({ rig, onClose }) {
  const { addRig, updateRig } = useRigStore();

  const [name,      setName]      = useState(rig?.name      ?? '');
  const [floatType, setFloatType] = useState(rig?.floatType ?? 'болонский');
  const [floatLoad, setFloatLoad] = useState(rig?.floatLoad ?? 3);
  const [weights,   setWeights]   = useState(
    (rig?.weights ?? []).map((w) => ({ ...w, _key: newKey() }))
  );
  const [showWForm, setShowWForm] = useState(false);

  // Форма добавления грузика
  const [wType,     setWType]     = useState('дробинка');
  const [wValue,    setWValue]    = useState(0.5);
  const [wDist,     setWDist]     = useState(30);

  const addWeight = () => {
    setWeights((prev) => [
      ...prev,
      { _key: newKey(), type: wType, value: wValue, distance: wDist },
    ]);
    setShowWForm(false);
  };

  const removeWeight = (key) => setWeights((prev) => prev.filter((w) => w._key !== key));

  const save = async () => {
    const data = {
      name: name || `Оснастка ${floatLoad}г`,
      floatType,
      floatLoad,
      weights: weights.map(({ _key: _, ...w }) => w),
    };
    if (rig?.id) await updateRig(rig.id, data);
    else         await addRig(data);
    onClose();
  };

  const sorted = [...weights].sort((a, b) => b.distance - a.distance);

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <button className={styles.back} onClick={onClose}>← Назад</button>
        <h2>{rig ? 'Редактировать' : 'Новая оснастка'}</h2>
        <button onClick={save}>Сохранить</button>
      </header>

      {/* Настройки поплавка */}
      <section className={styles.section}>
        <input
          className={styles.nameInput}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Название оснастки…"
        />

        <div className={styles.floatRow}>
          <div className={styles.field}>
            <label>Тип поплавка</label>
            <select value={floatType} onChange={(e) => setFloatType(e.target.value)}>
              {FLOAT_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label>Грузоподъёмность</label>
            <select value={floatLoad} onChange={(e) => setFloatLoad(parseFloat(e.target.value))}>
              {FLOAT_LOADS.map((l) => <option key={l} value={l}>{l}г</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* SVG-диаграмма */}
      <section className={styles.diagramWrap}>
        <RigDiagram floatLoad={floatLoad} floatType={floatType} weights={sorted} />
      </section>

      {/* Список грузиков */}
      <section className={styles.section}>
        <div className={styles.weightsHeader}>
          <span className={styles.weightsTitle}>Грузики</span>
          <button className={styles.addBtn} onClick={() => setShowWForm(true)}>+ Грузик</button>
        </div>

        {weights.length === 0 && (
          <p className={styles.empty}>Нет грузиков. Нажми «+ Грузик» чтобы добавить.</p>
        )}

        <ul className={styles.weightList}>
          {[...weights].sort((a, b) => b.distance - a.distance).map((w) => (
            <li key={w._key} className={styles.weightRow}>
              <span className={styles.wDot} style={{ background: { дробинка: '#58a6ff', оливка: '#d29922', подпасок: '#3fb950', концентратор: '#f85149' }[w.type] ?? '#58a6ff' }} />
              <span className={styles.wLabel}>{w.type}</span>
              <span className={styles.wVal}>{w.value}г</span>
              <span className={styles.wDist}>{w.distance} см от крючка</span>
              <button className={styles.delBtn} onClick={() => removeWeight(w._key)}>✕</button>
            </li>
          ))}
        </ul>
      </section>

      {/* Форма добавления грузика */}
      {showWForm && (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && setShowWForm(false)}>
          <div className={styles.wForm}>
            <h3>Добавить грузик</h3>

            <label>Тип</label>
            <div className={styles.typeRow}>
              {WEIGHT_TYPES.map((t) => (
                <button
                  key={t}
                  className={`${styles.typeChip} ${wType === t ? styles.typeChipActive : ''}`}
                  onClick={() => setWType(t)}
                >{t}</button>
              ))}
            </div>

            <label>Вес (г)</label>
            <div className={styles.sizeRow}>
              {WEIGHT_SIZES.map((s) => (
                <button
                  key={s}
                  className={`${styles.sizeChip} ${wValue === s ? styles.sizeChipActive : ''}`}
                  onClick={() => setWValue(s)}
                >{s}</button>
              ))}
            </div>
            <input
              type="number" step="0.01" min="0.01"
              className={styles.numInput}
              value={wValue}
              onChange={(e) => setWValue(parseFloat(e.target.value))}
              placeholder="или введи свой вес"
            />

            <label>Расстояние от крючка (см)</label>
            <input
              type="number" step="1" min="1"
              className={styles.numInput}
              value={wDist}
              onChange={(e) => setWDist(parseInt(e.target.value))}
            />

            <div className={styles.wActions}>
              <button className={styles.wCancel} onClick={() => setShowWForm(false)}>Отмена</button>
              <button onClick={addWeight}>Добавить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
