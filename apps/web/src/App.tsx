import { Routes, Route } from 'react-router-dom';
import HyamaxPage from './pages/hyamax/HyamaxPage';
import CosmelinePage from './pages/cosmeline/CosmelinePage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HyamaxPage />} />
      <Route path="/cosmeline" element={<CosmelinePage />} />
      <Route path="*" element={<HyamaxPage />} />
    </Routes>
  );
}
