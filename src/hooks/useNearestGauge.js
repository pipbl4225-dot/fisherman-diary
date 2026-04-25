import { useState, useEffect } from 'react';
import { findNearest } from '../utils/gaugesList.js';
import { fetchGaugeLevel } from '../utils/allrivers.js';

const STORAGE_KEY = 'selected_gauge_slug';

export function useNearestGauge(position) {
  const [candidates,     setCandidates]     = useState([]);  // ближайшие посты
  const [selectedSlug,   setSelectedSlug]   = useState(() => localStorage.getItem(STORAGE_KEY) ?? null);
  const [currentLevel,   setCurrentLevel]   = useState(null);
  const [loadingLevel,   setLoadingLevel]   = useState(false);
  const [error,          setError]          = useState(null);

  // Найти ближайшие посты когда появится позиция
  useEffect(() => {
    if (!position) return;
    const nearby = findNearest(position.lat, position.lng, 5);
    setCandidates(nearby);
    // Авто-выбрать ближайший если ничего не выбрано
    if (!selectedSlug && nearby.length > 0) {
      select(nearby[0].slug);
    }
  }, [position?.lat, position?.lng]);

  // Загружать уровень при смене поста
  useEffect(() => {
    if (!selectedSlug) return;
    let cancelled = false;
    setLoadingLevel(true);
    setError(null);
    fetchGaugeLevel(selectedSlug).then((data) => {
      if (cancelled) return;
      setCurrentLevel(data);
      setLoadingLevel(false);
      if (!data) setError('Не удалось получить данные гидропоста');
    });
    return () => { cancelled = true; };
  }, [selectedSlug]);

  const select = (slug) => {
    localStorage.setItem(STORAGE_KEY, slug);
    setSelectedSlug(slug);
  };

  const selectedGauge = candidates.find((c) => c.slug === selectedSlug) ?? null;

  return { candidates, selectedSlug, selectedGauge, currentLevel, loadingLevel, error, select };
}
