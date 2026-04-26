import { useRef, useState } from 'react';
import { useTackleStore } from '../../store/tackleStore.js';
import { db } from '../../db/index.js';
import styles from './TackleForm.module.css';

const TYPES = ['Удилище', 'Катушка', 'Леска', 'Шнур', 'Крючок', 'Приманка', 'Поплавок', 'Грузило', 'Мормышка', 'Прочее'];

function resizeImage(file, maxPx = 400) {
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
      resolve(canvas.toDataURL('image/jpeg', 0.75));
    };
    img.src = url;
  });
}

export default function TackleForm({ item, onClose }) {
  const { addTackle, loadTackles } = useTackleStore();
  const [name,     setName]     = useState(item?.name     ?? '');
  const [type,     setType]     = useState(item?.type     ?? TYPES[0]);
  const [brand,    setBrand]    = useState(item?.brand    ?? '');
  const [weight,   setWeight]   = useState(item?.weight   ?? '');
  const [diameter, setDiameter] = useState(item?.diameter ?? '');
  const [color,    setColor]    = useState(item?.color    ?? '');
  const [notes,    setNotes]    = useState(item?.notes    ?? '');
  const [photo,    setPhoto]    = useState(item?.photo    ?? null);

  const [scanning,  setScanning]  = useState(false);
  const [lookupMsg, setLookupMsg] = useState('');
  const videoRef   = useRef(null);
  const streamRef  = useRef(null);
  const scanActive = useRef(false);
  const fileRef    = useRef(null);

  // ── Фото из камеры / галереи ────────────────────────────────────────────
  const pickPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(await resizeImage(file));
  };

  // ── Штрихкод-сканер ─────────────────────────────────────────────────────
  const startScan = async () => {
    if (!('BarcodeDetector' in window)) {
      alert('Ваш браузер не поддерживает сканирование штрихкодов.\nИспользуйте Chrome на Android.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      scanActive.current = true;
      setScanning(true);
      setLookupMsg('Наведите камеру на штрихкод...');

      const detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
      const tick = async () => {
        if (!scanActive.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes.length > 0) {
            stopScan();
            await lookupBarcode(codes[0].rawValue);
            return;
          }
        } catch { /* ignore detect errors */ }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    } catch {
      alert('Не удалось открыть камеру');
    }
  };

  const stopScan = () => {
    scanActive.current = false;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  };

  const lookupBarcode = async (barcode) => {
    setLookupMsg('Ищу в базе...');
    try {
      const res  = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`);
      const data = await res.json();
      const prod = data.items?.[0];
      if (prod) {
        if (prod.title && !name)  setName(prod.title);
        if (prod.brand && !brand) setBrand(prod.brand);
        if (prod.images?.[0] && !photo) setPhoto(prod.images[0]);
        setLookupMsg(`Найдено: ${prod.title ?? barcode}`);
      } else {
        setLookupMsg(`Товар ${barcode} не найден — заполните вручную`);
      }
    } catch {
      setLookupMsg('Ошибка поиска — заполните вручную');
    }
  };

  // ── Сохранение ──────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    stopScan();
    const data = {
      name:     name.trim(),
      type,
      brand:    brand.trim()  || null,
      weight:   weight        ? parseFloat(weight)   : null,
      diameter: diameter      ? parseFloat(diameter) : null,
      color:    color.trim()  || null,
      notes:    notes.trim()  || null,
      photo:    photo         || null,
    };
    if (item) {
      await db.tackles.update(item.id, data);
      await loadTackles();
    } else {
      await addTackle(data);
    }
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={() => { stopScan(); onClose(); }}>
      <form className={styles.form} onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
        <h3>{item ? 'Редактировать снасть' : 'Новая снасть'}</h3>

        {/* Фото + сканер */}
        <div className={styles.photoRow}>
          {photo && <img className={styles.photoThumb} src={photo} alt="" />}
          <div className={styles.photoActions}>
            <button type="button" className={styles.photoBtn} onClick={() => fileRef.current.click()}>
              📷 Фото
            </button>
            <button type="button" className={styles.photoBtn} onClick={scanning ? stopScan : startScan}>
              {scanning ? '⏹ Стоп' : '🔍 Штрихкод'}
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={pickPhoto} />
        </div>

        {scanning && (
          <video ref={videoRef} className={styles.scanVideo} playsInline muted />
        )}
        {lookupMsg && <p className={styles.lookupMsg}>{lookupMsg}</p>}

        <label>Название *</label>
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Например: Shimano Stradic" required />

        <label>Тип</label>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          {TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>

        <label>Бренд</label>
        <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Shimano, Daiwa..." />

        {(type === 'Леска' || type === 'Шнур') ? (
          <>
            <label>Диаметр (мм)</label>
            <input type="number" step="0.01" min="0" value={diameter} onChange={(e) => setDiameter(e.target.value)} placeholder="0.00" />
          </>
        ) : (
          <>
            <label>Вес (г)</label>
            <input type="number" step="0.1" min="0" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="0.0" />
          </>
        )}

        <label>Цвет</label>
        <input value={color} onChange={(e) => setColor(e.target.value)} placeholder="Красный, #FF0000..." />

        <label>Заметки</label>
        <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Любые заметки..." />

        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={() => { stopScan(); onClose(); }}>Отмена</button>
          <button type="submit">{item ? 'Сохранить' : 'Добавить'}</button>
        </div>
      </form>
    </div>
  );
}
