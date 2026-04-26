import { useEffect, useRef, useState } from 'react';
import { db } from '../../db/index.js';
import styles from './SpotPhoto.module.css';

const TYPES = [
  { id: 'bite',    label: 'Поклёвка', emoji: '🐟' },
  { id: 'snag',    label: 'Коряга',   emoji: '🪵' },
  { id: 'hookup',  label: 'Зацеп',    emoji: '🎣' },
  { id: 'pit',     label: 'Яма',      emoji: '🔵' },
  { id: 'shallow', label: 'Мель',     emoji: '🟡' },
  { id: 'weed',    label: 'Трава',    emoji: '🌿' },
  { id: 'ledge',   label: 'Бровка',   emoji: '📍' },
  { id: 'feed',    label: 'Кормёжка', emoji: '✅' },
  { id: 'note',    label: 'Заметка',  emoji: '✏️' },
];

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;

function resizeImage(file, maxPx = 1200) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.src = url;
  });
}

export default function SpotPhoto({ spot }) {
  const [photo,      setPhoto]      = useState(spot.photo       ?? null);
  const [pins,       setPins]       = useState(spot.annotations ?? []);
  const [pendingPos, setPendingPos] = useState(null); // { x%, y% }
  const [pickType,   setPickType]   = useState('');
  const [pickLabel,  setPickLabel]  = useState('');
  const fileRef = useRef(null);

  // Сохраняем в базу при каждом изменении
  useEffect(() => {
    db.spots.update(spot.id, { photo: photo ?? null, annotations: pins });
  }, [photo, pins, spot.id]);

  const pickPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(await resizeImage(file));
  };

  const handlePhotoTap = (e) => {
    if (pendingPos) return; // уже открыт пикер
    const rect = e.currentTarget.getBoundingClientRect();
    const x = parseFloat(((e.clientX - rect.left) / rect.width  * 100).toFixed(1));
    const y = parseFloat(((e.clientY - rect.top)  / rect.height * 100).toFixed(1));
    setPickType('');
    setPickLabel('');
    setPendingPos({ x, y });
  };

  const addPin = () => {
    if (!pickType) return;
    const t = TYPES.find((t) => t.id === pickType);
    setPins((prev) => [...prev, {
      id:    uid(),
      x:     pendingPos.x,
      y:     pendingPos.y,
      type:  pickType,
      label: pickLabel || t?.label || '',
    }]);
    setPendingPos(null);
  };

  const deletePin = (id) => {
    if (confirm('Удалить метку?')) setPins((prev) => prev.filter((p) => p.id !== id));
  };

  if (!photo) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyText}>Сфотографируйте берег и место ловли — потом можно расставить метки: яма, зацеп, коряга…</p>
        <button onClick={() => fileRef.current.click()}>📷 Добавить фото</button>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={pickPhoto} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Фото с метками */}
      <div className={styles.photoWrap} onClick={handlePhotoTap}>
        <img src={photo} className={styles.photo} alt="место" draggable={false} />

        {/* Временный крест на месте тапа */}
        {pendingPos && (
          <div
            className={styles.crosshair}
            style={{ left: `${pendingPos.x}%`, top: `${pendingPos.y}%` }}
          />
        )}

        {/* Метки */}
        {pins.map((pin) => {
          const t = TYPES.find((t) => t.id === pin.type);
          return (
            <button
              key={pin.id}
              className={styles.pin}
              style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
              onClick={(e) => { e.stopPropagation(); deletePin(pin.id); }}
              title={pin.label}
            >
              <span className={styles.pinEmoji}>{t?.emoji ?? '📍'}</span>
              {pin.label && pin.label !== t?.label && (
                <span className={styles.pinLabel}>{pin.label}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Кнопки управления */}
      <div className={styles.toolbar}>
        <button className={styles.toolBtn} onClick={() => fileRef.current.click()}>📷 Сменить</button>
        <span className={styles.hint}>Нажмите на фото, чтобы добавить метку</span>
        <button className={styles.toolBtn} onClick={() => { if (confirm('Удалить фото и все метки?')) { setPhoto(null); setPins([]); } }}>🗑</button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={pickPhoto} />

      {/* Пикер типа метки */}
      {pendingPos && (
        <div className={styles.pickerOverlay} onClick={() => setPendingPos(null)}>
          <div className={styles.picker} onClick={(e) => e.stopPropagation()}>
            <p className={styles.pickerTitle}>Что отметить?</p>
            <div className={styles.pickerTypes}>
              {TYPES.map((t) => (
                <button
                  key={t.id}
                  className={`${styles.pickerType} ${pickType === t.id ? styles.pickerActive : ''}`}
                  onClick={() => setPickType((p) => p === t.id ? '' : t.id)}
                >
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
            {pickType === 'note' && (
              <input
                className={styles.pickerInput}
                value={pickLabel}
                onChange={(e) => setPickLabel(e.target.value)}
                placeholder="Своё описание…"
                autoFocus
              />
            )}
            <div className={styles.pickerActions}>
              <button className={styles.pickerCancel} onClick={() => setPendingPos(null)}>Отмена</button>
              <button disabled={!pickType} onClick={addPin}>Поставить метку</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
