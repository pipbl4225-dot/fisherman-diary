// Клиент для allrivers.info
// Сайт работает только из России, поэтому используем CORS-прокси allorigins.win

const BASE       = 'https://allrivers.info';
const PROXY_BASE = 'https://api.allorigins.win/get?url=';

function proxyUrl(path) {
  return PROXY_BASE + encodeURIComponent(BASE + path);
}

/**
 * Поиск гидропостов по названию реки/города.
 * allrivers.info/search?q=... возвращает JSON-массив.
 * Если ответ пустой — возвращает [].
 */
export async function searchGauges(query) {
  try {
    const res = await fetch(proxyUrl(`/search?q=${encodeURIComponent(query)}`));
    const { contents } = await res.json();
    const data = JSON.parse(contents);
    // Сайт возвращает массив или объект — нормализуем
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') return Object.values(data);
    return [];
  } catch {
    return [];
  }
}

/**
 * Получить текущий уровень воды для конкретного поста по slug.
 * Парсим HTML страницы /gauge/{slug}.
 * Возвращает { level, unit, date } или null.
 */
export async function fetchGaugeLevel(slug) {
  try {
    const res = await fetch(proxyUrl(`/gauge/${slug}`));
    const { contents } = await res.json();

    // Ищем уровень воды в HTML — типичный паттерн: число + "см"
    // Примеры: "-209 см", "312 см", "+15 см"
    const levelMatch = contents.match(/([+-]?\d+)\s*см/);
    // Ищем дату
    const dateMatch  = contents.match(/\d{1,2}\s+[а-яё]+\s+\d{4}/i);
    // Ищем температуру воды
    const tempMatch  = contents.match(/([\d.]+)\s*°C/);

    if (!levelMatch) return null;

    return {
      level: parseInt(levelMatch[1], 10),
      unit:  'см',
      date:  dateMatch?.[0] ?? null,
      temp:  tempMatch  ? parseFloat(tempMatch[1]) : null,
    };
  } catch {
    return null;
  }
}

/**
 * Получить историю уровней (если доступна через /gauge/{slug}/data или похожий endpoint).
 * Возвращает массив { date, level } или [].
 */
export async function fetchGaugeHistory(slug) {
  try {
    const res = await fetch(proxyUrl(`/gauge/${slug}/data.json`));
    const { contents } = await res.json();
    const data = JSON.parse(contents);
    if (Array.isArray(data)) return data;
    return [];
  } catch {
    return [];
  }
}
