import { useEffect, useState } from 'react';
import { useTackleStore } from '../../store/tackleStore.js';
import { useSetupStore }  from '../../store/setupStore.js';
import { FISHING_TYPES }  from '../../utils/fishingTips.js';
import styles from './SetupEditor.module.css';

const SLOTS = [
  { key: 'rod',       label: 'Удилище',   types: ['Удилище']           },
  { key: 'reel',      label: 'Катушка',   types: ['Катушка']           },
  { key: 'line',      label: 'Леска/Шнур', types: ['Леска', 'Шнур']   },
  { key: 'hook',      label: 'Крючок',    types: ['Крючок']            },
  { key: 'float',     label: 'Поплавок',  types: ['Поплавок']          },
  { key: 'weight',    label: 'Грузило',   types: ['Грузило']           },
  { key: 'bait',      label: 'Приманка',  types: ['Приманка']          },
  { key: 'jig',       label: 'Мормышка',  types: ['Мормышка']          },
];

export default function SetupEditor({ setup, onClose }) {
  const { tackles, loadTackles } = useTackleStore();
  const { addSetup, updateSetup } = useSetupStore();

  const [name,        setName]        = useState(setup?.name        ?? '');
  const [fishingType, setFishingType] = useState(setup?.fishingType ?? '');
  const [slots,       setSlots]       = useState(setup?.slots       ?? {});
  const [notes,       setNotes]       = useState(setup?.notes       ?? '');

  useEffect(() => { loadTackles(); }, [loadTackles]);

  const setSlot = (key, val) => setSlots((s) => ({ ...s, [key]: val || undefined }));

  const save = async () => {
    const data = { name: name || 'Сборка', fishingType: fishingType || null, slots, notes: notes || null };
    if (setup?.id) await updateSetup(setup.id, data);
    else           await addSetup(data);
    onClose();
  };

  const ft = FISHING_TYPES.find((t) => t.id === fishingType);

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

      {/* Слоты снастей */}
      <div className={styles.slots}>
        {SLOTS.map((slot) => {
          const options = tackles.filter((t) => slot.types.includes(t.type));
          const val = slots[slot.key] ?? '';
          return (
            <div key={slot.key} className={styles.slot}>
              <label className={styles.slotLabel}>{slot.label}</label>
              <select
                className={styles.slotSelect}
                value={val}
                onChange={(e) => setSlot(slot.key, e.target.value)}
              >
                <option value="">— не выбрано —</option>
                {options.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}{t.brand ? ` (${t.brand})` : ''}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      <textarea
        className={styles.notes}
        rows={3}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Заметки к сборке…"
      />
    </div>
  );
}
