import { useEffect, useState } from 'react';
import { useTackleStore } from '../../store/tackleStore.js';
import { useSetupStore }  from '../../store/setupStore.js';
import { useRigStore }    from '../../store/rigStore.js';
import { useMapStore }    from '../../store/mapStore.js';
import { FISHING_TYPES }  from '../../utils/fishingTips.js';
import styles from './SetupEditor.module.css';

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

const SLOTS = [
  { key: 'rod',    label: 'Удилище',    types: ['Удилище']          },
  { key: 'reel',   label: 'Катушка',    types: ['Катушка']          },
  { key: 'line',   label: 'Леска/Шнур', types: ['Леска', 'Шнур']   },
  { key: 'float',  label: 'Поплавок',   types: ['Поплавок']         },
  { key: 'weight', label: 'Грузило',    types: ['Грузило']          },
  { key: 'bait',   label: 'Приманка',   types: ['Приманка']         },
  { key: 'jig',    label: 'Мормышка',   types: ['Мормышка']         },
];

export default function SetupEditor({ setup, onClose }) {
  const { tackles, loadTackles }  = useTackleStore();
  const { addSetup, updateSetup } = useSetupStore();
  const { rigs, loadRigs }        = useRigStore();
  const { spots, loadSpots }      = useMapStore();

  const [name,        setName]        = useState(setup?.name        ?? '');
  const [fishingType, setFishingType] = useState(setup?.fishingType ?? '');
  const [slots,       setSlots]       = useState(setup?.slots       ?? {});
  const [notes,       setNotes]       = useState(setup?.notes       ?? '');
  const [spotId,      setSpotId]      = useState(setup?.spotId      ?? '');
  const [photo,       setPhoto]       = useState(setup?.photo       ?? null);

  // Поводок
  const [ldDiam,  setLdDiam]  = useState(setup?.leader?.diameter ?? '');
  const [ldLen,   setLdLen]   = useState(setup?.leader?.length   ?? '');
  const [hookId,  setHookId]  = useState(setup?.leader?.hookId   ?? '');
  const [swivel,  setSwivel]  = useState(setup?.swivel           ?? false);

  // Подпасок выше поводка
  const [shotAboveW, setShotAboveW] = useState(setup?.shotAbove?.weight ?? '');
  const [shotAboveD, setShotAboveD] = useState(setup?.shotAbove?.dist   ?? '');
  // Подпасок на поводке
  const [shotLeadW,  setShotLeadW]  = useState(setup?.shotOnLeader?.weight ?? '');
  const [shotLeadD,  setShotLeadD]  = useState(setup?.shotOnLeader?.dist   ?? '');

  // Предложение огрузки для поплавка
  const [suggestedRig, setSuggestedRig] = useState(null);
  const [rigId,        setRigId]        = useState(setup?.rigId ?? null);

  useEffect(() => { loadTackles(); loadRigs(); loadSpots(); }, [loadTackles, loadRigs, loadSpots]);

  // Когда выбирается поплавок — ищем подходящую огрузку
  useEffect(() => {
    if (!slots.float || rigId) { setSuggestedRig(null); return; }
    const floatItem = tackles.find((t) => t.id === slots.float);
    if (!floatItem?.weight) { setSuggestedRig(null); return; }
    const match = rigs.find((r) => Math.abs((r.floatLoad ?? 0) - floatItem.weight) < 0.5);
    setSuggestedRig(match ?? null);
  }, [slots.float, tackles, rigs, rigId]);

  const setSlot = (key, val) => setSlots((s) => ({ ...s, [key]: val || undefined }));

  // Диаметр основной лески из выбранной снасти
  const lineTackle = tackles.find((t) => t.id === slots.line);
  const lineDiam   = lineTackle?.diameter ?? null;

  const linkedRig = rigId ? rigs.find((r) => r.id === rigId) : null;

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(await resizeImage(file, 1000));
  };

  const save = async () => {
    const leader = (ldDiam || ldLen || hookId)
      ? { diameter: ldDiam ? parseFloat(ldDiam) : null, length: ldLen ? parseFloat(ldLen) : null, hookId: hookId || null }
      : null;
    const shotAbove    = (shotAboveW || shotAboveD)
      ? { weight: shotAboveW ? parseFloat(shotAboveW) : null, dist: shotAboveD ? parseFloat(shotAboveD) : null }
      : null;
    const shotOnLeader = (shotLeadW || shotLeadD)
      ? { weight: shotLeadW ? parseFloat(shotLeadW) : null, dist: shotLeadD ? parseFloat(shotLeadD) : null }
      : null;

    const data = {
      name: name || 'Сборка',
      fishingType: fishingType || null,
      slots,
      notes: notes || null,
      rigId: rigId || null,
      leader,
      swivel,
      shotAbove,
      shotOnLeader,
      spotId: spotId || null,
      photo:  photo  ?? null,
    };
    if (setup?.id) await updateSetup(setup.id, data);
    else           await addSetup(data);
    onClose();
  };

  // Хуки из инвентаря
  const hooks = tackles.filter((t) => t.type === 'Крючок');

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <button className={styles.back} onClick={onClose}>← Назад</button>
        <h2>{setup ? 'Редактировать' : 'Новая сборка'}</h2>
        <button onClick={save}>Сохранить</button>
      </header>

      <input
        className={styles.nameInput}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Название сборки…"
      />

      {/* Вид ловли */}
      <div className={styles.typeRow}>
        {FISHING_TYPES.map((t) => (
          <button
            key={t.id}
            className={`${styles.typeChip} ${fishingType === t.id ? styles.typeChipActive : ''}`}
            onClick={() => setFishingType(fishingType === t.id ? '' : t.id)}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* ── Снасти ── */}
      <p className={styles.sectionTitle}>Снасти</p>
      <div className={styles.slots}>
        {SLOTS.map((slot) => {
          const options = tackles.filter((t) => slot.types.includes(t.type));
          const val = slots[slot.key] ?? '';
          const extra = slot.key === 'line' && lineDiam ? ` — Ø ${lineDiam} мм` : '';
          return (
            <div key={slot.key} className={styles.slot}>
              <label className={styles.slotLabel}>{slot.label}{extra && <span className={styles.slotDiam}>{extra}</span>}</label>
              <select
                className={styles.slotSelect}
                value={val}
                onChange={(e) => setSlot(slot.key, e.target.value)}
              >
                <option value="">— не выбрано —</option>
                {options.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}{t.brand ? ` (${t.brand})` : ''}
                    {t.diameter ? ` Ø${t.diameter}` : ''}
                    {t.weight   ? ` ${t.weight}г`   : ''}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      {/* ── Огрузка (если выбран поплавок) ── */}
      {slots.float && (
        <div className={styles.section}>
          <p className={styles.sectionTitle}>Огрузка поплавка</p>
          {linkedRig ? (
            <div className={styles.rigLinked}>
              <span>🔗 {linkedRig.name || `${linkedRig.floatLoad}г`} — {linkedRig.floatType} · {linkedRig.floatLoad}г · {(linkedRig.weights ?? []).length} грузиков</span>
              <button className={styles.rigUnlink} onClick={() => setRigId(null)}>✕</button>
            </div>
          ) : suggestedRig ? (
            <div className={styles.rigSuggest}>
              <span>Найдена огрузка: <b>{suggestedRig.name || `${suggestedRig.floatLoad}г`}</b> ({suggestedRig.floatType} · {suggestedRig.floatLoad}г)</span>
              <button onClick={() => { setRigId(suggestedRig.id); setSuggestedRig(null); }}>Привязать</button>
            </div>
          ) : (
            <p className={styles.rigHint}>Нет сохранённой огрузки для этого поплавка. Создайте её на вкладке «Огрузка».</p>
          )}
        </div>
      )}

      {/* ── Поводок ── */}
      <div className={styles.section}>
        <p className={styles.sectionTitle}>Поводок</p>
        <div className={styles.leaderRow}>
          <div className={styles.leaderField}>
            <label>Диаметр (мм)</label>
            <input type="number" step="0.01" min="0" value={ldDiam} onChange={(e) => setLdDiam(e.target.value)} placeholder="0.10" />
          </div>
          <div className={styles.leaderField}>
            <label>Длина (см)</label>
            <input type="number" min="1" value={ldLen} onChange={(e) => setLdLen(e.target.value)} placeholder="30" />
          </div>
        </div>

        {/* Крючок на поводке */}
        <div className={styles.slot} style={{ marginTop: 6 }}>
          <label className={styles.slotLabel}>Крючок</label>
          <select className={styles.slotSelect} value={hookId} onChange={(e) => setHookId(e.target.value)}>
            <option value="">— не выбрано —</option>
            {hooks.map((t) => (
              <option key={t.id} value={t.id}>{t.name}{t.brand ? ` (${t.brand})` : ''}</option>
            ))}
          </select>
        </div>

        {/* Вертлюжок */}
        <label className={styles.checkRow}>
          <input type="checkbox" checked={swivel} onChange={(e) => setSwivel(e.target.checked)} />
          Вертлюжок между основной леской и поводком
        </label>
      </div>

      {/* ── Подпаски ── */}
      <div className={styles.section}>
        <p className={styles.sectionTitle}>Подпаски</p>

        <p className={styles.shotLabel}>Выше поводка{swivel ? ' (ниже вертлюжка)' : ''}</p>
        <div className={styles.leaderRow}>
          <div className={styles.leaderField}>
            <label>Вес (г)</label>
            <input type="number" step="0.01" min="0" value={shotAboveW} onChange={(e) => setShotAboveW(e.target.value)} placeholder="0.1" />
          </div>
          <div className={styles.leaderField}>
            <label>Расст. до поводка (см)</label>
            <input type="number" min="0" value={shotAboveD} onChange={(e) => setShotAboveD(e.target.value)} placeholder="5" />
          </div>
        </div>

        <p className={styles.shotLabel}>На поводке (от крючка)</p>
        <div className={styles.leaderRow}>
          <div className={styles.leaderField}>
            <label>Вес (г)</label>
            <input type="number" step="0.01" min="0" value={shotLeadW} onChange={(e) => setShotLeadW(e.target.value)} placeholder="0.05" />
          </div>
          <div className={styles.leaderField}>
            <label>Расст. от крючка (см)</label>
            <input type="number" min="0" value={shotLeadD} onChange={(e) => setShotLeadD(e.target.value)} placeholder="3" />
          </div>
        </div>
      </div>

      <textarea
        className={styles.notes}
        rows={3}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Заметки к сборке…"
      />

      {/* ── Фото снасти ── */}
      <div className={styles.section}>
        <p className={styles.sectionTitle}>Фото сборки</p>
        {photo ? (
          <div className={styles.photoWrap}>
            <img src={photo} className={styles.photo} alt="сборка" />
            <button type="button" className={styles.photoRemove} onClick={() => setPhoto(null)}>✕ Удалить</button>
          </div>
        ) : (
          <label className={styles.photoUploadBtn}>
            📷 Сфотографировать / выбрать
            <input type="file" accept="image/*" capture="environment"
              style={{ display: 'none' }} onChange={handlePhoto} />
          </label>
        )}
      </div>

      {/* ── Привязка к месту ── */}
      {spots.length > 0 && (
        <div className={styles.section}>
          <p className={styles.sectionTitle}>Место ловли</p>
          <select
            className={styles.slotSelect}
            value={spotId}
            onChange={(e) => setSpotId(e.target.value)}
          >
            <option value="">— не привязано —</option>
            {spots.map((s) => (
              <option key={s.id} value={s.id}>{s.name || `Точка ${s.id}`}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
