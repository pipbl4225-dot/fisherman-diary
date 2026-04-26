// SVG-веер маркерной карты
// Центр — берег (низ), лучи расходятся вверх в дуге 140°

const W = 320;
const H = 300;
const CX = W / 2;
const CY = H - 20; // точка заброса — берег
const MAX_R = H - 50;
const ARC_START = -110; // градусы от вертикали
const ARC_END   =  110;

const BOTTOM_COLORS = {
  mud:   '#8B6914',
  sand:  '#d4a017',
  shell: '#9b59b6',
  rock:  '#7f8c8d',
  snag:  '#6d4c41',
  weed:  '#27ae60',
};

const BOTTOM_LABELS = {
  mud: 'Ил', sand: 'Песок', shell: 'Ракушка',
  rock: 'Камень', snag: 'Коряга', weed: 'Трава',
};

function toRad(deg) { return deg * Math.PI / 180; }

function rayAngle(index, total) {
  if (total === 1) return 0;
  const step = (ARC_END - ARC_START) / (total - 1);
  return ARC_START + index * step;
}

function pointXY(angleDeg, distNorm) {
  const r = distNorm * MAX_R;
  const a = toRad(angleDeg - 90); // -90 чтобы 0° смотрел вверх
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
}

export default function FanDiagram({ rays = [] }) {
  const maxDist = Math.max(
    1,
    ...rays.flatMap((r) => r.points.map((p) => p.distance || 0)),
  );

  // Дуги расстояний (3 кольца)
  const arcRatios = [0.33, 0.66, 1.0];

  return (
    <svg width={W} height={H} style={{ display: 'block', margin: '0 auto' }}>
      {/* Дуги */}
      {arcRatios.map((ratio) => {
        const r = ratio * MAX_R;
        return (
          <g key={ratio}>
            <path
              d={`M ${CX - r * Math.sin(toRad(Math.abs(ARC_START)))} ${CY - r * Math.cos(toRad(Math.abs(ARC_START)))}
                  A ${r} ${r} 0 0 1
                  ${CX + r * Math.sin(toRad(Math.abs(ARC_END)))} ${CY - r * Math.cos(toRad(Math.abs(ARC_END)))}`}
              fill="none" stroke="#21262d" strokeWidth={1} strokeDasharray="4 4"
            />
            <text x={CX + r + 4} y={CY} fontSize={9} fill="#8b949e" dominantBaseline="middle">
              {Math.round(ratio * maxDist)}
            </text>
          </g>
        );
      })}

      {/* Лучи и точки */}
      {rays.map((ray, ri) => {
        const angle = rayAngle(ri, rays.length);
        const tip = pointXY(angle, 1.05);
        const base = { x: CX, y: CY };

        return (
          <g key={ri}>
            {/* Луч */}
            <line
              x1={base.x} y1={base.y} x2={tip.x} y2={tip.y}
              stroke="#30363d" strokeWidth={1}
            />
            {/* Название ориентира */}
            <text
              x={tip.x} y={tip.y - 6}
              fontSize={10} fill="#8b949e"
              textAnchor="middle"
            >
              {ray.landmark || `Луч ${ri + 1}`}
            </text>

            {/* Замеры */}
            {ray.points.map((p, pi) => {
              const norm = (p.distance || 0) / maxDist;
              const { x, y } = pointXY(angle, norm);
              const color = BOTTOM_COLORS[p.bottomType] ?? '#58a6ff';
              const labelLeft = angle < 0;
              return (
                <g key={pi}>
                  <circle cx={x} cy={y} r={7} fill={color} stroke="#161b22" strokeWidth={1.5} />
                  <text
                    x={labelLeft ? x - 10 : x + 10}
                    y={y + 4}
                    fontSize={9} fill="#e6edf3"
                    textAnchor={labelLeft ? 'end' : 'start'}
                  >
                    {p.depth}м
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}

      {/* Берег */}
      <rect x={CX - 30} y={CY + 4} width={60} height={14} rx={4} fill="#21262d" />
      <text x={CX} y={CY + 14} fontSize={10} fill="#8b949e" textAnchor="middle">берег</text>

      {/* Легенда */}
      {Object.entries(BOTTOM_LABELS).map(([id, label], i) => (
        <g key={id} transform={`translate(${4 + (i % 3) * 100}, ${i < 3 ? 6 : 18})`}>
          <circle cx={5} cy={5} r={4} fill={BOTTOM_COLORS[id]} />
          <text x={12} y={9} fontSize={9} fill="#8b949e">{label}</text>
        </g>
      ))}
    </svg>
  );
}
