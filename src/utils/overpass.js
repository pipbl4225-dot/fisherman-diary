const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

/**
 * Загрузить плотины и запруды в радиусе `radiusKm` от точки.
 * OSM теги: waterway=dam, waterway=weir, waterway=lock_gate
 */
export async function fetchDams(lat, lng, radiusKm = 50) {
  const r = radiusKm * 1000;
  const query = `
[out:json][timeout:25];
(
  node["waterway"~"^(dam|weir|lock_gate)$"](around:${r},${lat},${lng});
  way["waterway"~"^(dam|weir|lock_gate)$"](around:${r},${lat},${lng});
  node["man_made"="dam"](around:${r},${lat},${lng});
  way["man_made"="dam"](around:${r},${lat},${lng});
);
out center tags;
  `.trim();

  const res = await fetch(OVERPASS_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    `data=${encodeURIComponent(query)}`,
  });

  if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);
  const json = await res.json();

  return json.elements.map((el) => {
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    return {
      id:       el.id,
      type:     el.type,
      lat,
      lng,
      name:     el.tags?.name ?? el.tags?.['name:ru'] ?? typeLabel(el.tags),
      kind:     el.tags?.waterway ?? el.tags?.man_made ?? 'dam',
      water:    el.tags?.water,
      operator: el.tags?.operator,
      website:  el.tags?.website ?? el.tags?.url,
      wikidata: el.tags?.wikidata,
    };
  }).filter((el) => el.lat && el.lng);
}

function typeLabel(tags) {
  const w = tags?.waterway ?? tags?.man_made;
  if (w === 'weir')      return 'Запруда';
  if (w === 'dam')       return 'Плотина';
  if (w === 'lock_gate') return 'Шлюз';
  return 'Гидросооружение';
}

export function kindRu(kind) {
  if (kind === 'weir')      return 'Запруда';
  if (kind === 'dam')       return 'Плотина';
  if (kind === 'lock_gate') return 'Шлюз';
  return 'Плотина';
}
