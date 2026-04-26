// Open-Meteo: бесплатно, без ключа
// https://open-meteo.com/

const WMO = [
  [0,  '☀️', 'Ясно'],
  [1,  '🌤', 'В основном ясно'],
  [2,  '⛅', 'Переменная облачность'],
  [3,  '☁️', 'Пасмурно'],
  [45, '🌫️', 'Туман'],
  [51, '🌦️', 'Морось лёгкая'],
  [53, '🌧️', 'Морось'],
  [61, '🌧️', 'Дождь лёгкий'],
  [63, '🌧️', 'Дождь'],
  [65, '🌧️', 'Сильный дождь'],
  [71, '🌨️', 'Снег лёгкий'],
  [73, '❄️', 'Снег'],
  [80, '🌦️', 'Ливень лёгкий'],
  [81, '🌧️', 'Ливень'],
  [95, '⛈️', 'Гроза'],
  [99, '⛈️', 'Гроза с градом'],
];

function codeInfo(code) {
  let result = { emoji: '🌡️', condition: 'Неизвестно' };
  for (const [threshold, emoji, condition] of WMO) {
    if (code >= threshold) result = { emoji, condition };
  }
  return result;
}

const DIRS = ['С', 'СВ', 'В', 'ЮВ', 'Ю', 'ЮЗ', 'З', 'СЗ'];
export const windDir = (deg) => DIRS[Math.round((deg % 360) / 45) % 8];

export async function fetchWeather(lat, lng) {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lng}` +
    `&current=temperature_2m,wind_speed_10m,wind_direction_10m,precipitation,weather_code,surface_pressure` +
    `&wind_speed_unit=ms&timezone=auto`;
  const res  = await fetch(url);
  const data = await res.json();
  const c    = data.current;
  const { emoji, condition } = codeInfo(c.weather_code);
  return {
    emoji,
    condition,
    temp:     Math.round(c.temperature_2m),
    wind:     Math.round(c.wind_speed_10m * 10) / 10,
    windDir:  windDir(c.wind_direction_10m),
    pressure: Math.round(c.surface_pressure),
    precip:   c.precipitation ?? 0,
  };
}

// Форматирует погоду (объект или строка) в одну строку
export function weatherStr(w) {
  if (!w) return '';
  if (typeof w === 'string') return w;
  return [
    w.emoji,
    w.condition,
    w.temp != null   ? `${w.temp > 0 ? '+' : ''}${w.temp}°C` : '',
    w.wind != null   ? `${w.windDir ?? ''} ${w.wind} м/с`.trim() : '',
    w.pressure       ? `${w.pressure} гПа` : '',
  ].filter(Boolean).join(' · ');
}
