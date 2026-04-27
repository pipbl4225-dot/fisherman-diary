import { useState } from 'react';
import styles from './RigBuilder.module.css';

// ─── Описание типов монтажей ────────────────────────────────────────────────

const RIG_TYPES = [
  { id: 'float',    label: 'Поплавочная',    emoji: '🪝' },
  { id: 'feeder',   label: 'Фидер / Инлайн', emoji: '⚖️' },
  { id: 'otvodnoj', label: 'Отводной',        emoji: '↔️' },
  { id: 'dropshot', label: 'Дроп-шот',        emoji: '⬇️' },
  { id: 'carp',     label: 'Карп / Волос',    emoji: '🐟' },
];

// Каждый узел: { id, kind, label, hint, color, shape, editable }
const RIG_NODES = {
  float: [
    { id: 'rod',     kind: 'rod',    label: 'Вершинка удилища', color: '#6b7280', shape: 'bar' },
    { id: 'mainline',kind: 'line',   label: 'Основная леска',   color: '#4dabf7', shape: 'line', hint: 'Диаметр: 0.16–0.22 мм' },
    { id: 'stopper', kind: 'stopper',label: 'Стопор поплавка',  color: '#adb5bd', shape: 'dot-sm', hint: 'Силиконовый стопор' },
    { id: 'float',   kind: 'float',  label: 'Поплавок',         color: '#ff922b', shape: 'float', hint: 'Огрузка соответствует нагрузке' },
    { id: 'stopper2',kind: 'stopper',label: 'Нижний стопор',    color: '#adb5bd', shape: 'dot-sm' },
    { id: 'bulk',    kind: 'shot',   label: 'Основная огрузка (70–80%)', color: '#868e96', shape: 'shots', hint: '2–3 грузика на концентраторе' },
    { id: 'swivel',  kind: 'swivel', label: 'Вертлюжок (опц.)', color: '#dee2e6', shape: 'swivel', optional: true, hint: 'Убирает скручивание поводка' },
    { id: 'leader',  kind: 'line',   label: 'Поводок',          color: '#69db7c', shape: 'line', hint: 'Ø 0.10–0.14 мм · 20–40 см' },
    { id: 'shot',    kind: 'shot',   label: 'Подпасок (15–20%)', color: '#868e96', shape: 'dot', hint: '5–10 см от крючка' },
    { id: 'hook',    kind: 'hook',   label: 'Крючок',            color: '#f03e3e', shape: 'hook', hint: '№12–18 под размер насадки' },
  ],
  feeder: [
    { id: 'rod',     kind: 'rod',    label: 'Вершинка удилища', color: '#6b7280', shape: 'bar' },
    { id: 'mainline',kind: 'line',   label: 'Основная леска / шнур', color: '#4dabf7', shape: 'line', hint: '0.20–0.28 мм или шнур 0.10' },
    { id: 'leader_sh',kind:'line',   label: 'Шок-лидер (опц.)', color: '#74c0fc', shape: 'line', optional: true, hint: '50–80 см · монофил 0.35–0.40' },
    { id: 'feeder',  kind: 'feeder', label: 'Кормушка',         color: '#a9e34b', shape: 'feeder', hint: 'Инлайн, клипса или петля Гарднера' },
    { id: 'antitangle',kind:'sleeve',label: 'Антизакручиватель', color: '#adb5bd', shape: 'sleeve', hint: 'Жёсткая трубка 5–10 см' },
    { id: 'swivel',  kind: 'swivel', label: 'Вертлюжок',        color: '#dee2e6', shape: 'swivel' },
    { id: 'leader',  kind: 'line',   label: 'Поводок',          color: '#69db7c', shape: 'line', hint: 'Ø 0.14–0.20 мм · 25–60 см' },
    { id: 'hook',    kind: 'hook',   label: 'Крючок',           color: '#f03e3e', shape: 'hook', hint: '№8–14' },
  ],
  otvodnoj: [
    { id: 'rod',     kind: 'rod',    label: 'Вершинка удилища', color: '#6b7280', shape: 'bar' },
    { id: 'mainline',kind: 'line',   label: 'Основная леска / шнур', color: '#4dabf7', shape: 'line', hint: '0.18–0.25 мм или плетня' },
    { id: 'swivel1', kind: 'swivel', label: '3-х ходовой вертлюжок', color: '#dee2e6', shape: 'swivel3', hint: 'Распределяет поводок в сторону' },
    { id: 'side_note', kind: 'note', label: '↙ Отводной поводок 40–80 см · Ø 0.16 · крючок', color: '#a9e34b', shape: 'side' },
    { id: 'mainleader',kind:'line',  label: 'Нижняя леска 10–20 см',  color: '#4dabf7', shape: 'line' },
    { id: 'weight',  kind: 'weight', label: 'Груз-чебурашка 5–20 г', color: '#868e96', shape: 'sinker', hint: 'На дно, создаёт угол отводного' },
  ],
  dropshot: [
    { id: 'rod',     kind: 'rod',    label: 'Вершинка удилища', color: '#6b7280', shape: 'bar' },
    { id: 'mainline',kind: 'line',   label: 'Основная леска / шнур', color: '#4dabf7', shape: 'line', hint: 'Плетня 0.06–0.10 мм' },
    { id: 'hook',    kind: 'hook',   label: 'Крючок (выше груза)', color: '#f03e3e', shape: 'hook', hint: 'Вязать узлом Palomar · отступ от груза 15–40 см' },
    { id: 'tag_note',kind: 'note',   label: '↙ Силиконовая приманка (виброхвост, червь)', color: '#a9e34b', shape: 'side' },
    { id: 'drop',    kind: 'line',   label: 'Поводок до груза',  color: '#4dabf7', shape: 'line', hint: '15–40 см' },
    { id: 'weight',  kind: 'weight', label: 'Капля / груз дроп-шот', color: '#868e96', shape: 'sinker', hint: 'Лежит на дне, не движется' },
  ],
  carp: [
    { id: 'rod',     kind: 'rod',    label: 'Вершинка удилища', color: '#6b7280', shape: 'bar' },
    { id: 'mainline',kind: 'line',   label: 'Основная леска / шнур', color: '#4dabf7', shape: 'line', hint: 'Моно 0.30–0.35 или плетня' },
    { id: 'shock',   kind: 'line',   label: 'Шок-лидер 10–15 м', color: '#74c0fc', shape: 'line', hint: 'Моно 0.45–0.50 мм' },
    { id: 'lead',    kind: 'feeder', label: 'Инлайн / кормак',   color: '#a9e34b', shape: 'feeder', hint: 'Инлайн-грузило или кормушка-метод' },
    { id: 'sleeve',  kind: 'sleeve', label: 'Резиновый стопор',  color: '#adb5bd', shape: 'sleeve' },
    { id: 'swivel',  kind: 'swivel', label: 'Вертлюжок с безопасной клипсой', color: '#dee2e6', shape: 'swivel' },
    { id: 'leader',  kind: 'line',   label: 'Поводок (флюрокарбон)', color: '#69db7c', shape: 'line', hint: 'Ø 0.25–0.35 мм · 20–40 см' },
    { id: 'hair_note',kind:'note',   label: '↙ Волос: бойл / кукуруза 2–4 мм от крючка', color: '#ffd43b', shape: 'side' },
    { id: 'hook',    kind: 'hook',   label: 'Крючок (волосяной монтаж)', color: '#f03e3e', shape: 'hook', hint: '№4–8 с коротким цевьём' },
  ],
};

const TIPS = {
  float:    'Подпасок — 15–20% от суммарной огрузки, в 5–10 см от крючка. Поплавок огружать «в ноль» — над водой только антенна.',
  feeder:   'Длина поводка — ключевой параметр: короткий (10–15 см) даёт чёткую поклёвку, длинный (40–60 см) — нежная подача на осторожной рыбе.',
  otvodnoj: 'Угол отводного поводка — 90° к основной леске. Груз лежит на дне, приманка колышется в толще воды.',
  dropshot: 'Груз на дне, крючок с приманкой — в толще воды. Минимальные движения вершинкой дают «дрожание» приманки на месте.',
  carp:     'Волос должен выходить из-под жала крючка. Насадка не должна мешать засечке — проверьте баланс в ведре с водой.',
};

// ─── Shape renderer ─────────────────────────────────────────────────────────

function NodeShape({ shape, color, optional }) {
  const s = { '--nc': color };
  switch (shape) {
    case 'bar':     return <div className={styles.shapeBar}     style={s} />;
    case 'line':    return null; // линия — только коннектор
    case 'float':   return <div className={styles.shapeFloat}   style={s} />;
    case 'shots':   return <div className={styles.shapeShots}   style={s}><span /><span /><span /></div>;
    case 'dot':     return <div className={styles.shapeDot}     style={s} />;
    case 'dot-sm':  return <div className={styles.shapeDotSm}   style={s} />;
    case 'swivel':  return <div className={styles.shapeSwivel}  style={s}>∞</div>;
    case 'swivel3': return <div className={styles.shapeSwivel}  style={s}>⊕</div>;
    case 'hook':    return <div className={styles.shapeHook}    style={s}>J</div>;
    case 'feeder':  return <div className={styles.shapeFeeder}  style={s} />;
    case 'sleeve':  return <div className={styles.shapeSleeve}  style={s} />;
    case 'sinker':  return <div className={styles.shapeSinker}  style={s} />;
    case 'side':    return null; // боковая заметка
    default:        return <div className={styles.shapeDot}     style={s} />;
  }
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function RigBuilder({ tackles }) {
  const [rigType,  setRigType]  = useState('float');
  const [expanded, setExpanded] = useState(null);

  const nodes = RIG_NODES[rigType] ?? [];
  const tip   = TIPS[rigType];

  return (
    <div className={styles.wrap}>

      {/* Тип монтажа */}
      <div className={styles.typeRow}>
        {RIG_TYPES.map((rt) => (
          <button
            key={rt.id}
            className={`${styles.typeBtn} ${rigType === rt.id ? styles.typeBtnActive : ''}`}
            onClick={() => { setRigType(rt.id); setExpanded(null); }}
          >
            <span className={styles.typeEmoji}>{rt.emoji}</span>
            <span className={styles.typeLabel}>{rt.label}</span>
          </button>
        ))}
      </div>

      {/* Совет */}
      {tip && (
        <div className={styles.tipBar}>
          <span>💡</span>
          <p>{tip}</p>
        </div>
      )}

      {/* Схема монтажа */}
      <div className={styles.diagram}>
        {nodes.map((node, i) => {
          const isLine    = node.shape === 'line';
          const isSide    = node.shape === 'side';
          const isOpen    = expanded === node.id;
          const showConn  = i < nodes.length - 1 && !isLine && nodes[i + 1]?.shape !== 'side';

          if (isSide) {
            return (
              <div key={node.id} className={styles.sideNote} style={{ '--nc': node.color }}>
                <div className={styles.sideLine} />
                <span className={styles.sideText}>{node.label}</span>
              </div>
            );
          }

          if (isLine) {
            return (
              <div key={node.id} className={styles.lineSegment} style={{ '--nc': node.color }}>
                <div className={styles.lineBar} />
                <span className={styles.lineLabel}>{node.hint || node.label}</span>
              </div>
            );
          }

          return (
            <div key={node.id} className={styles.nodeWrap}>
              <button
                className={`${styles.node} ${node.optional ? styles.nodeOptional : ''} ${isOpen ? styles.nodeOpen : ''}`}
                onClick={() => setExpanded(isOpen ? null : node.id)}
              >
                <NodeShape shape={node.shape} color={node.color} optional={node.optional} />
                <div className={styles.nodeText}>
                  <span className={styles.nodeLabel}>{node.label}</span>
                  {node.optional && <span className={styles.optBadge}>опц.</span>}
                </div>
                <span className={styles.nodeArrow}>{isOpen ? '▲' : '▼'}</span>
              </button>

              {isOpen && node.hint && (
                <div className={styles.nodeHint}>{node.hint}</div>
              )}

              {showConn && <div className={styles.connector} style={{ '--nc': (nodes[i + 1]?.color ?? '#4dabf7') }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
