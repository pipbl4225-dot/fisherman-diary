// Маркерная карта — вид сектора сверху, белый фон
// Центр внизу = позиция рыболова, лучи расходятся вверх

const W = 320, H = 270;
const CX = W / 2, CY = H - 18;
const MAX_R = H - 55;

const GROUND_COLORS = {
  mud:   '#a0522d',
  sand:  '#c8a020',
  shell: '#8e44ad',
  rock:  '#666',
  snag:  '#5d4037',
  weed:  '#27ae60',
};
const GROUND_LABELS = {
  mud: 'Ил', sand: 'Песок', shell: 'Ракушка',
  rock: 'Камень', snag: 'Коряга', weed: 'Трава',
};

// Угол луча (в градусах от вертикали), равномерно в секторе
function rayAngles(n) {
  if (n === 0) return [];
  if (n === 1) return [0];
  const spread = Math.min(75, 20 + n * 7);
  return Array.from({ length: n }, (_, i) => -spread + i * (2 * spread) / (n - 1));
}

// Полярные координаты: угол от вертикали (°), радиус → (x, y)
function polar(deg, r) {
  const rad = (deg - 90) * Math.PI / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

// Путь дуги от угла a1 до a2 (в °)
function arcPath(a1, a2, r) {
  const s = polar(a1, r);
  const e = polar(a2, r);
  const large = Math.abs(a2 - a1) > 180 ? 1 : 0;
  return `M ${s.x.toFixed(1)} ${s.y.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(1)} ${e.y.toFixed(1)}`;
}

export default function FanDiagram({ rays = [] }) {
  const angles = rayAngles(rays.length);
  const spread = rays.length > 1 ? Math.min(75, 20 + rays.length * 7) : 20;

  // Масштаб расстояний
  const allDists = rays.flatMap((r) => r.points.map((p) => p.distance || 0));
  const maxDist = allDists.length > 0 ? Math.max(...allDists) : 20;
  const arcVals = [
    Math.round(maxDist * 0.25) || 5,
    Math.round(maxDist * 0.5)  || 10,
    Math.round(maxDist * 0.75) || 15,
    maxDist,
  ];
  const toR = (d) => (d / maxDist) * MAX_R;

  // Какие типы грунта есть на карте
  const usedGrounds = [...new Set(rays.flatMap((r) => r.points.map((p) => p.bottomType).filter(Boolean)))];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', maxWidth: W, display: 'block', background: 'white', borderRadius: 10 }}
    >
      {/* Сетка дуг */}
      {arcVals.map((val, i) => {
        const r = toR(val);
        const isOuter = i === arcVals.length - 1;
        return (
          <g key={val}>
            <path
              d={arcPath(-spread, spread, r)}
              fill="none"
              stroke={isOuter ? '#bbb' : '#ddd'}
              strokeWidth={isOuter ? 1.5 : 1}
            />
            {/* Метка расстояния справа */}
            <text
              x={polar(spread, r).x + 4}
              y={polar(spread, r).y + 4}
              fontSize={9} fill="#999" textAnchor="start"
            >
              {val}
            </text>
          </g>
        );
      })}

      {/* Граничные линии сектора */}
      {rays.length > 1 && (
        <>
          <line x1={CX} y1={CY} x2={polar(-spread, MAX_R).x} y2={polar(-spread, MAX_R).y}
            stroke="#e0e0e0" strokeWidth={1} />
          <line x1={CX} y1={CY} x2={polar(spread, MAX_R).x} y2={polar(spread, MAX_R).y}
            stroke="#e0e0e0" strokeWidth={1} />
        </>
      )}

      {/* Подпись единицы */}
      <text x={polar(spread, MAX_R).x + 4} y={polar(spread, MAX_R).y - 6} fontSize={8} fill="#bbb">об.</text>

      {/* Лучи, метки ориентиров и замеры */}
      {rays.map((ray, ri) => {
        const angle = angles[ri];
        const tipR  = MAX_R + 4;
        const lblR  = MAX_R + 20;
        const tip   = polar(angle, tipR);
        const lbl   = polar(angle, lblR);

        const anchor = angle < -6 ? 'end' : angle > 6 ? 'start' : 'middle';
        const shortName = (ray.landmark || `Луч ${ri + 1}`).slice(0, 12);

        return (
          <g key={ray._uid ?? ri}>
            {/* Линия луча */}
            <line x1={CX} y1={CY} x2={tip.x} y2={tip.y}
              stroke="#aaa" strokeWidth={1.2} />

            {/* Название ориентира */}
            <text x={lbl.x} y={lbl.y} fontSize={10} fill="#444"
              textAnchor={anchor} dominantBaseline="middle"
              style={{ fontWeight: 600 }}>
              {shortName}
            </text>

            {/* Точки замеров */}
            {ray.points.map((pt) => {
              const pos   = polar(angle, toR(pt.distance));
              const color = GROUND_COLORS[pt.bottomType] ?? '#2196f3';
              const lblLeft = angle < -5;
              return (
                <g key={pt._uid}>
                  <circle cx={pos.x} cy={pos.y} r={7}
                    fill={color} stroke="white" strokeWidth={1.5} />
                  <text
                    x={lblLeft ? pos.x - 10 : pos.x + 10}
                    y={pos.y + 1}
                    fontSize={9} fill="#222"
                    textAnchor={lblLeft ? 'end' : 'start'}
                    dominantBaseline="middle"
                  >
                    {pt.depth}м
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}

      {/* Позиция рыболова */}
      <circle cx={CX} cy={CY} r={6} fill="#1565c0" />
      <text x={CX} y={CY + 14} fontSize={9} fill="#555" textAnchor="middle">📍 вы</text>

      {/* Легенда использованных типов грунта */}
      {usedGrounds.length > 0 && (
        <g transform="translate(6, 6)">
          {usedGrounds.map((id, i) => (
            <g key={id} transform={`translate(0, ${i * 14})`}>
              <circle cx={5} cy={5} r={4} fill={GROUND_COLORS[id]} />
              <text x={13} y={9} fontSize={9} fill="#555">{GROUND_LABELS[id]}</text>
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}
