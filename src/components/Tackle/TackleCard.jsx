import styles from './TackleCard.module.css';

export default function TackleCard({ item, onEdit, onDelete }) {
  return (
    <li className={styles.card}>
      {item.photo && <img className={styles.photo} src={item.photo} alt="" />}
      <div className={styles.main}>
        <span className={styles.name}>{item.name}</span>
        <span className={styles.type}>{item.type}</span>
        <div className={styles.meta}>
          {item.brand    && <span>{item.brand}</span>}
          {item.diameter && <span>Ø {item.diameter} мм</span>}
          {item.weight   && <span>{item.weight} г</span>}
          {item.color    && <span>{item.color}</span>}
        </div>
        {item.notes && <p className={styles.notes}>{item.notes}</p>}
      </div>
      <div className={styles.actions}>
        <button className={styles.edit}   onClick={onEdit}>✏</button>
        <button className={styles.delete} onClick={() => { if(confirm('Удалить?')) onDelete(); }}>✕</button>
      </div>
    </li>
  );
}
