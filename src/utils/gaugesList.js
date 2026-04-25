// Статический справочник гидропостов allrivers.info
// Поля: slug — часть URL /gauge/{slug}, lat/lng — координаты поста
export const GAUGES = [
  // Москва-река
  { slug: 'moskva-reka-zvenigorod',     name: 'Москва-река — Звенигород',     lat: 55.731, lng: 36.851 },
  { slug: 'moskva-reka-moscow',         name: 'Москва-река — Москва',          lat: 55.760, lng: 37.640 },
  { slug: 'moskva-reka-kolomna',        name: 'Москва-река — Коломна',         lat: 55.073, lng: 38.844 },
  // Ока
  { slug: 'oka-serpuhov',               name: 'Ока — Серпухов',                lat: 54.912, lng: 37.401 },
  { slug: 'oka-kashira',                name: 'Ока — Кашира',                  lat: 54.844, lng: 38.148 },
  { slug: 'oka-kolomna',                name: 'Ока — Коломна',                 lat: 55.095, lng: 38.795 },
  { slug: 'oka-ryazan',                 name: 'Ока — Рязань',                  lat: 54.620, lng: 39.716 },
  { slug: 'oka-murom',                  name: 'Ока — Муром',                   lat: 55.574, lng: 42.043 },
  { slug: 'oka-nizhnij-novgorod',       name: 'Ока — Нижний Новгород',         lat: 56.328, lng: 44.007 },
  // Волга
  { slug: 'volga-tver',                 name: 'Волга — Тверь',                 lat: 56.852, lng: 35.892 },
  { slug: 'volga-rybinsk',              name: 'Волга — Рыбинск',               lat: 58.049, lng: 38.855 },
  { slug: 'volga-yaroslavl',            name: 'Волга — Ярославль',             lat: 57.626, lng: 39.893 },
  { slug: 'volga-kostroma',             name: 'Волга — Кострома',              lat: 57.767, lng: 40.927 },
  { slug: 'volga-nizhnij-novgorod',     name: 'Волга — Нижний Новгород',       lat: 56.331, lng: 44.007 },
  { slug: 'volga-kazan',                name: 'Волга — Казань',                lat: 55.796, lng: 49.108 },
  { slug: 'volga-samara',               name: 'Волга — Самара',                lat: 53.196, lng: 50.150 },
  { slug: 'volga-saratov',              name: 'Волга — Саратов',               lat: 51.533, lng: 46.034 },
  { slug: 'volga-volgograd',            name: 'Волга — Волгоград',             lat: 48.708, lng: 44.513 },
  { slug: 'volga-astrahan',             name: 'Волга — Астрахань',             lat: 46.348, lng: 48.040 },
  // Кама
  { slug: 'kama-perm',                  name: 'Кама — Пермь',                  lat: 58.004, lng: 56.237 },
  { slug: 'kama-naberezhnye-chelny',    name: 'Кама — Набережные Челны',       lat: 55.730, lng: 52.381 },
  // Дон
  { slug: 'don-voronezh',               name: 'Дон — Воронеж',                 lat: 51.660, lng: 39.200 },
  { slug: 'don-rostov-na-donu',         name: 'Дон — Ростов-на-Дону',          lat: 47.222, lng: 39.718 },
  { slug: 'don-kalach-na-donu',         name: 'Дон — Калач-на-Дону',           lat: 48.684, lng: 43.534 },
  // Северная Двина / Вологодская обл.
  { slug: 'sukhona-vologda',            name: 'Сухона — Вологда',              lat: 59.220, lng: 39.891 },
  { slug: 'severnaya-dvina-arkhangelsk',name: 'Сев. Двина — Архангельск',      lat: 64.539, lng: 40.516 },
  // Нева
  { slug: 'neva-saint-petersburg',      name: 'Нева — Санкт-Петербург',        lat: 59.939, lng: 30.315 },
  { slug: 'neva-shlisselburg',          name: 'Нева — Шлиссельбург',           lat: 59.944, lng: 31.035 },
  // Урал
  { slug: 'ural-orenburg',              name: 'Урал — Оренбург',               lat: 51.767, lng: 55.097 },
  // Обь / Сибирь
  { slug: 'ob-novosibirsk',             name: 'Обь — Новосибирск',             lat: 54.990, lng: 82.904 },
  { slug: 'ob-barnaul',                 name: 'Обь — Барнаул',                 lat: 53.347, lng: 83.779 },
  { slug: 'ob-salekhard',               name: 'Обь — Салехард',                lat: 66.530, lng: 66.602 },
  { slug: 'irtysh-omsk',                name: 'Иртыш — Омск',                  lat: 54.989, lng: 73.368 },
  { slug: 'irtysh-tobolsk',             name: 'Иртыш — Тобольск',              lat: 58.201, lng: 68.254 },
  { slug: 'tom-tomsk',                  name: 'Томь — Томск',                  lat: 56.488, lng: 84.948 },
  // Енисей / Красноярск
  { slug: 'yenisei-krasnoyarsk',        name: 'Енисей — Красноярск',           lat: 56.010, lng: 92.852 },
  { slug: 'yenisei-igarka',             name: 'Енисей — Игарка',               lat: 67.468, lng: 86.574 },
  // Ангара
  { slug: 'angara-irkutsk',             name: 'Ангара — Иркутск',              lat: 52.286, lng: 104.296 },
  // Лена
  { slug: 'lena-yakutsk',               name: 'Лена — Якутск',                 lat: 62.034, lng: 129.732 },
  // Амур
  { slug: 'amur-khabarovsk',            name: 'Амур — Хабаровск',              lat: 48.480, lng: 135.071 },
  { slug: 'amur-blagoveshchensk',       name: 'Амур — Благовещенск',           lat: 50.290, lng: 127.527 },
  // Краснодарский край
  { slug: 'kuban-krasnodar',            name: 'Кубань — Краснодар',            lat: 45.035, lng: 38.975 },
];

/** Найти N ближайших гидропостов к точке */
export function findNearest(lat, lng, n = 5) {
  return [...GAUGES]
    .map((g) => ({
      ...g,
      dist: Math.hypot(g.lat - lat, g.lng - lng),
    }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, n);
}
