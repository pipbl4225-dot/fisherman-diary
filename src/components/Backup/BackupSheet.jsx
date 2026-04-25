import { useState } from 'react';
import { requestToken, findBackupFile, saveBackupFile, loadBackupFile } from '../../utils/googleDrive.js';
import { exportAll, importAll } from '../../db/backup.js';
import styles from './BackupSheet.module.css';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

function fmtDate(iso) {
  return new Date(iso).toLocaleString('ru-RU');
}

export default function BackupSheet({ onClose }) {
  const [status,  setStatus]  = useState('idle'); // idle | working | done | error
  const [message, setMessage] = useState('');

  async function handleBackup() {
    if (!CLIENT_ID) {
      setStatus('error');
      setMessage('VITE_GOOGLE_CLIENT_ID не настроен');
      return;
    }
    try {
      setStatus('working'); setMessage('Авторизация в Google…');
      const token = await requestToken(CLIENT_ID);
      setMessage('Экспорт данных…');
      const data = await exportAll();
      setMessage('Поиск файла в Drive…');
      const existing = await findBackupFile(token);
      setMessage('Сохранение…');
      await saveBackupFile(token, data, existing?.id ?? null);
      setStatus('done');
      setMessage(`Бэкап сохранён: ${fmtDate(data.exportedAt)}`);
    } catch (e) {
      setStatus('error');
      setMessage(e.message);
    }
  }

  async function handleRestore() {
    if (!CLIENT_ID) {
      setStatus('error');
      setMessage('VITE_GOOGLE_CLIENT_ID не настроен');
      return;
    }
    if (!confirm('Восстановить данные из Drive?\nВсе текущие данные будут заменены.')) return;
    try {
      setStatus('working'); setMessage('Авторизация в Google…');
      const token = await requestToken(CLIENT_ID);
      setMessage('Поиск бэкапа в Drive…');
      const file = await findBackupFile(token);
      if (!file) {
        setStatus('error');
        setMessage('Бэкап не найден. Сначала сохраните данные.');
        return;
      }
      setMessage('Загрузка данных…');
      const data = await loadBackupFile(token, file.id);
      setMessage('Импорт…');
      await importAll(data);
      setStatus('done');
      setMessage(`Восстановлено из бэкапа от ${fmtDate(data.exportedAt)}`);
    } catch (e) {
      setStatus('error');
      setMessage(e.message);
    }
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.sheet}>
        <h3>Google Drive</h3>
        <p className={styles.hint}>Данные сохраняются как файл в вашем Drive.</p>

        <div className={styles.buttons}>
          <button
            className={styles.btn}
            onClick={handleBackup}
            disabled={status === 'working'}
          >
            ☁ Сохранить в Drive
          </button>
          <button
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={handleRestore}
            disabled={status === 'working'}
          >
            ↓ Восстановить из Drive
          </button>
        </div>

        {status !== 'idle' && (
          <p className={`${styles.msg} ${status === 'error' ? styles.err : status === 'done' ? styles.ok : ''}`}>
            {status === 'working' ? '⏳ ' : ''}{message}
          </p>
        )}

        <button className={styles.closeBtn} onClick={onClose}>Закрыть</button>
      </div>
    </div>
  );
}
