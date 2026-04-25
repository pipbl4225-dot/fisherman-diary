import { HashRouter, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation/Navigation.jsx';
import MapScreen from './components/Map/MapScreen.jsx';
import DiaryScreen from './components/Diary/DiaryScreen.jsx';
import TackleScreen from './components/Tackle/TackleScreen.jsx';
import WaterLevelScreen from './components/WaterLevel/WaterLevelScreen.jsx';
import BottomMapperScreen from './components/BottomMapper/BottomMapperScreen.jsx';
import styles from './App.module.css';

export default function App() {
  return (
    <HashRouter>
      <div className={styles.layout}>
        <main className={styles.content}>
          <Routes>
            <Route path="/"       element={<MapScreen />} />
            <Route path="/diary"  element={<DiaryScreen />} />
            <Route path="/tackle" element={<TackleScreen />} />
            <Route path="/water"  element={<WaterLevelScreen />} />
            <Route path="/bottom" element={<BottomMapperScreen />} />
          </Routes>
        </main>
        <Navigation />
      </div>
    </HashRouter>
  );
}
