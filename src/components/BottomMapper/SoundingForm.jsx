import { useState } from 'react';
import { useBottomStore } from '../../store/bottomStore.js';
import styles from './SoundingForm.module.css';

const BOTTOM_TYPES = [
  {
    id: 'mud',
    label: 'Ил',
    emoji: '🟤',
    hint: 'Тяжело тянется, как пластилин. Груз «прилипает» ко дну.',
  },
  {
    id: 'sand',
    label: 'Песок',
    emoji: '🟡',
    hint: 'Плавное скольжение, тишина. Кончик удилища согнут ровно.',
  },
  {
    id: 'shell',
    label: 'Ракушка',
    emoji: '🟣',
    hint: 'Частая мелкая дробь, зудение. Идеальное место для леща!',
  },
  {
    id: 'rock',
    label: 'Камень',
    emoji: '⚫',
    hint: 'Резкие жёсткие удары, хаотичные рывки. Груз переваливается.',
  },
  {
    id: 'snag',
    label: 'Коряга',
    emoji: '🪵',
    hint: 'Груз застревает и резко соскакивает. Риск зацепа.',
  },
  {
    id: 'weed',
    label: 'Трава',
    emoji: '🌿',
    hint: 'Мягкое сопротивление, груз идёт с усилием через массу.',
  },
];

export default function SoundingForm({ latlng, spotId, onClose }) {
  const { addSounding } = useBottomStore();
  const [step,       setStep]       = useState(1); // 1 | 2 | 3
  const [depth,      setDepth]      = useState('');
  const [bottomType, setBottomType] = useState(null);
  const [distance,   setDistance]   = useState('');
  const [landmark,   setLandmark]   = useState('');
  const [notes,      setNotes]      = useState('');

  const save = async (overrides = {}) => {
    await addSounding({
      spotId,
      lat:        latlng.lat,
      lng:        latlng.lng,
      depth:      parseFloat(depth),
      bottomType: bottomType ?? overrides.bottomType ?? null,
      distance:   distance   ? parseFloat(distance)  : null,
      landmark:   landmark   || null,
      notes:      notes      || null,
    });
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.form}>

        {/* Прогресс */}
        <div className={styles.progress}>
          {[1, 2, 3].map((n) => (
            <div key={n} className={`${styles.dot} ${step >= n ? styles.dotActive : ''}`} />
          ))}
        </div>

        {/* Шаг 1 — глубина */}
        {step === 1 && (
          <>
            <h3 className={styles.question}>Какая глубина?</h3>
            <p className={styles.hint}>Вытравите маркерный поплавок до всплытия и считайте леску.</p>
            <input
              autoFocus
              type="number"
              step="0.1"
              min="0"
              className={styles.bigInput}
              value={depth}
              onChange={(e) => setDepth(e.target.value)}
              placeholder="0.0 м"
            />
            <div className={styles.actions}>
              <button className={styles.cancel} onClick={onClose}>Отмена</button>
              <button disabled={!depth} onClick={() => setStep(2)}>Далее →</button>
            </div>
          </>
        )}

        {/* Шаг 2 — тип грунта */}
        {step === 2 && (
          <>
            <h3 className={styles.question}>Что чувствуется на дне?</h3>
            <p className={styles.hint}>Протяните груз по дну и выберите по ощущениям.</p>
            <div className={styles.typeGrid}>
              {BOTTOM_TYPES.map((t) => (
                <button
                  key={t.id}
                  className={`${styles.typeBtn} ${bottomType === t.id ? styles.typeBtnActive : ''}`}
                  onClick={() => { setBottomType(t.id); setStep(3); }}
                >
                  <span className={styles.typeEmoji}>{t.emoji}</span>
                  <span className={styles.typeLabel}>{t.label}</span>
                  <span className={styles.typeHint}>{t.hint}</span>
                </button>
              ))}
            </div>
            <div className={styles.actions}>
              <button className={styles.cancel} onClick={() => setStep(1)}>← Назад</button>
              <button className={styles.skip} onClick={() => setStep(3)}>Пропустить</button>
            </div>
          </>
        )}

        {/* Шаг 3 — дистанция и ориентир */}
        {step === 3 && (
          <>
            <h3 className={styles.question}>Дистанция и ориентир</h3>
            <p className={styles.hint}>Необязательно. Помогает точно повторить заброс.</p>

            <label className={styles.label}>Обороты катушки</label>
            <input
              type="number"
              step="1"
              min="0"
              className={styles.input}
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              placeholder="напр. 12"
            />

            <label className={styles.label}>Ориентир на берегу</label>
            <input
              type="text"
              className={styles.input}
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="напр. одинокая берёза"
            />

            <label className={styles.label}>Заметки</label>
            <input
              type="text"
              className={styles.input}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="напр. бровка с ракушкой"
            />

            <div className={styles.actions}>
              <button className={styles.cancel} onClick={() => setStep(2)}>← Назад</button>
              <button onClick={() => save()}>Сохранить</button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
