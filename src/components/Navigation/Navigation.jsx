import { NavLink } from 'react-router-dom';
import styles from './Navigation.module.css';

const tabs = [
  { to: '/tackle', label: 'Рюкзак',      icon: '🎒' },
  { to: '/',       label: 'Карта',       icon: '🗺' },
  { to: '/diary',  label: 'Дневник',     icon: '📓' },
  { to: '/water',  label: 'Вода',        icon: '💧' },
  { to: '/bottom', label: 'Промер дна',  icon: '📏' },
];

export default function Navigation() {
  return (
    <nav className={styles.nav}>
      {tabs.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => `${styles.tab} ${isActive ? styles.active : ''}`}
        >
          <span className={styles.icon}>{icon}</span>
          <span className={styles.label}>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
