const FLOAT_W = 22;
const FLOAT_H = 60;
const SVG_W   = 280;
const SVG_H   = 420;
const CX      = SVG_W / 2;
const FLOAT_TOP    = 20;
const HOOK_Y       = SVG_H - 30;
const LINE_TOP     = FLOAT_TOP + FLOAT_H;
const LINE_BOTTOM  = HOOK_Y - 12;
const LINE_HEIGHT  = LINE_BOTTOM - LINE_TOP;

const TYPE_COLORS = {
  дробинка:     '#58a6ff',
  оливка:       '#d29922',
  подпасок:     '#3fb950',
  концентратор: '#f85149',
};

function weightRadius(g) {
  return Math.max(5, Math.min(18, 4 + Math.sqrt(g) * 6));
}

function weightY(distanceCm, maxDist) {
  if (!maxDist) return LINE_BOTTOM - 20;
  return LINE_BOTTOM - (distanceCm / maxDist) * LINE_HEIGHT * 0.92;
}

export default function RigDiagram({ floatLoad = 0, floatType = '', weights = [] }) {
  const used    = weights.reduce((s, w) => s + (w.value || 0), 0);
  const balance = Math.max(0, floatLoad - used);
  const maxDist = Math.max(...weights.map((w) => w.distance || 0), 10);
  const pct     = floatLoad ? Math.min(100, (used / floatLoad) * 100) : 0;
  const barColor = pct > 100 ? '#f85149' : pct > 85 ? '#d29922' : '#3fb950';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>

      {/* Баланс */}
      <div style={{ width: SVG_W, fontSize: 12, color: '#8b949e' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span>Огружено: <b style={{ color: pct > 100 ? '#f85149' : '#e6edf3' }}>{used.toFixed(2)}г</b></span>
          <span>Грузоподъёмность: <b style={{ color: '#e6edf3' }}>{floatLoad}г</b></span>
        </div>
        <div style={{ background: '#21262d', borderRadius: 4, height: 6, overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: barColor, borderRadius: 4, transition: 'width 0.3s' }} />
        </div>
        {balance > 0 && <div style={{ textAlign: 'right', marginTop: 2, color: '#3fb950' }}>Остаток: {balance.toFixed(2)}г</div>}
        {pct > 100  && <div style={{ textAlign: 'right', marginTop: 2, color: '#f85149' }}>Перегруз!</div>}
      </div>

      {/* SVG-схема */}
      <svg width={SVG_W} height={SVG_H} style={{ display: 'block' }}>
        {/* Леска */}
        <line x1={CX} y1={LINE_TOP} x2={CX} y2={LINE_BOTTOM} stroke="#8b949e" strokeWidth={1.5} />

        {/* Поплавок */}
        <ellipse
          cx={CX} cy={FLOAT_TOP + FLOAT_H / 2}
          rx={FLOAT_W / 2} ry={FLOAT_H / 2}
          fill="#f85149" stroke="#ff7b72" strokeWidth={1.5}
        />
        <ellipse cx={CX} cy={FLOAT_TOP + FLOAT_H * 0.25} rx={4} ry={6} fill="#ff7b72" opacity={0.6} />
        <text x={CX + FLOAT_W / 2 + 6} y={FLOAT_TOP + FLOAT_H / 2 + 4}
          fontSize={11} fill="#8b949e">
          {floatLoad}г {floatType && `· ${floatType}`}
        </text>

        {/* Грузики */}
        {weights.map((w, i) => {
          const cy = weightY(w.distance || 0, maxDist);
          const r  = weightRadius(w.value || 0);
          const color = TYPE_COLORS[w.type] ?? '#58a6ff';
          const labelRight = i % 2 === 0;
          return (
            <g key={w._key ?? i}>
              <circle cx={CX} cy={cy} r={r} fill={color} stroke="#161b22" strokeWidth={1.5} />
              <text
                x={labelRight ? CX + r + 6 : CX - r - 6}
                y={cy + 4}
                fontSize={11}
                fill="#e6edf3"
                textAnchor={labelRight ? 'start' : 'end'}
              >
                {w.value}г · {w.distance}см
              </text>
              <text
                x={labelRight ? CX + r + 6 : CX - r - 6}
                y={cy + 16}
                fontSize={10}
                fill="#8b949e"
                textAnchor={labelRight ? 'start' : 'end'}
              >
                {w.type}
              </text>
            </g>
          );
        })}

        {/* Крючок */}
        <path
          d={`M${CX},${LINE_BOTTOM} L${CX},${HOOK_Y - 8} Q${CX + 10},${HOOK_Y} ${CX},${HOOK_Y}`}
          fill="none" stroke="#8b949e" strokeWidth={2} strokeLinecap="round"
        />
        <text x={CX + 14} y={HOOK_Y + 4} fontSize={11} fill="#8b949e">крючок</text>
      </svg>
    </div>
  );
}
