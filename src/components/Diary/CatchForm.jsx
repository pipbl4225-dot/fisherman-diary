import { useEffect, useState } from 'react';
import { db } from '../../db/index.js';
import { useSetupStore } from '../../store/setupStore.js';
import styles from './CatchForm.module.css';

const nowTime = () => new Date().toTimeString().slice(0, 5);

async function resizeImage(file, maxPx = 1000) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL('image/jpeg', 0.78));
    };
    img.src = url;
  });
}

export default function CatchForm({ sessionId, spotId, onClose }) {
  const { setups, loadSetups } = useSetupStore();

  const [species,   setSpecies]   = useState('');
  const [weight,    setWeight]    = useState('');
  const [length,    setLength]    = useState('');
  const [bait,      setBait]      = useState('');
  const [tackle,    setTackle]    = useState('');
  const [setupId,   setSetupId]   = useState('');
  const [catchTime, setCatchTime] = useState(nowTime());

  const [catchPhoto, setCatchPhoto] = useState(null);
  const [spotPhoto,  setSpotPhoto]  = useState(null);
  const [photoX,     setPhotoX]     = useState(null);
  const [photoY,     setPhotoY]     = useState(null);

  useEffect(() => { loadSetups(); }, [loadSetups]);

  useEffect(() => {
    if (!spotId) return;
    db.spots.get(spotId).then((s) => {
      if (s?.photo) setSpotPhoto(s.photo);
    });
  }, [spotId]);

  useEffect(() => {
    if (!setupId) return;
    const s = setups.find((x) => String(x.id) === setupId);
    if (s?.name) setTackle(s.name);
  }, [setupId, setups]);

  const handlePhotoTap = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPhotoX(parseFloat(((e.clientX - rect.left) / rect.width * 100).toFixed(1)));
    setPhotoY(parseFloat(((e.clientY - rect.top)  / rect.height * 100).toFixed(1)));
  };

  const handleCatchPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCatchPhoto(await resizeImage(file, 1000));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!species.trim()) return;
    await db.catches.add({
      sessionId,
      species:   species.trim(),
      weight:    weight  ? parseFloat(weight)  : null,
      length:    length  ? parseFloat(length)  : null,
      bait:      bait.trim()   || null,
      tackle:    tackle.trim() || null,
      catchTime: catchTime || null,
      photo:     catchPhoto ?? null,
      photoX:    photoX ?? null,
      photoY:    photoY ?? null,
      time:      new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <form className={styles.form} onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
        <h3>Добавить рыбу</h3>

        <div className={styles.row2}>
          <div className={styles.field}>
            <label>Вид *</label>
            <input autoFocus value={species} onChange={(e) => setSpecies(e.target.value)}
              placeholder="Щука, карась…" required />
          </div>
          <div className={styles.field}>
            <label>Время</label>
            <input type="time" value={catchTime} onChange={(e) => setCatchTime(e.target.value)} />
          </div>
        </div>

        <div className={styles.row3}>
          <div className={styles.field}>
            <label>Вес (кг)</label>
            <input type="number" step="0.01" min="0" value={weight}
              onChange={(e) => setWeight(e.target.value)} placeholder="0.00" />
          </div>
          <div className={styles.field}>
            <label>Длина (см)</label>
            <input type="number" step="0.1" min="0" value={length}
              onChange={(e) => setLength(e.target.value)} placeholder="0.0" />
          </div>
        </div>

        <label>На что поймал</label>
        <input value={bait} onChange={(e) => setBait(e.target.value)}
          placeholder="Червь, опарыш, воблер, блесна…" />

        {setups.length > 0 && (
          <div className={styles.field}>
            <label>Сборка</label>
            <select value={setupId} onChange={(e) => setSetupId(e.target.value)}>
              <option value="">— не выбрано —</option>
              {setups.map((s) => (
                <option key={s.id} value={String(s.id)}>{s.name}</option>
              ))}
            </select>
          </div>
        )}

        <label>Снасть {setupId ? '(из сборки)' : ''}</label>
        <input value={tackle} onChange={(e) => setTackle(e.target.value)}
          placeholder="Спиннинг, поплавочная, фидер…" />

        {/* Фото рыбы */}
        <div className={styles.photoSection}>
          <label>Фото рыбы</label>
          {catchPhoto ? (
            <div className={styles.catchPreviewWrap}>
              <img src={catchPhoto} className={styles.catchPreview} alt="улов" />
              <button type="button" className={styles.clearPin}
                onClick={() => setCatchPhoto(null)}>✕ Удалить фото</button>
            </div>
          ) : (
            <label className={styles.photoUploadBtn}>
              📷 Сфотографировать / выбрать
              <input type="file" accept="image/*" capture="environment"
                style={{ display: 'none' }} onChange={handleCatchPhoto} />
            </label>
          )}
        </div>

        {/* Отметка на фото */}
        {spotPhoto && (
          <div className={styles.photoSection}>
            <label>Место поклёвки — нажмите на фото</label>
            <div className={styles.photoWrap} onClick={handlePhotoTap}>
              <img src={spotPhoto} className={styles.photo} alt="место" draggable={false} />
              {photoX !== null && (
                <div className={styles.pin} style={{ left: `${photoX}%`, top: `${photoY}%` }}>
                  🐟
                </div>
              )}
            </div>
            {photoX !== null && (
              <button type="button" className={styles.clearPin}
                onClick={() => { setPhotoX(null); setPhotoY(null); }}>
                ✕ Убрать метку
              </button>
            )}
          </div>
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onClose}>Отмена</button>
          <button type="submit">Сохранить</button>
        </div>
      </form>
    </div>
  );
}
