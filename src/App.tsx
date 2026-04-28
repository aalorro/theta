import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { HoldingsPage } from '@/features/holdings/HoldingsPage';
import { SimulatorPage } from '@/features/simulator/SimulatorPage';
import { StrikePickerPage } from '@/features/strike-picker/StrikePickerPage';
import { RegimePage } from '@/features/regime/RegimePage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/regime" replace />} />
          <Route path="regime" element={<RegimePage />} />
          <Route path="holdings" element={<HoldingsPage />} />
          <Route path="strike-picker" element={<StrikePickerPage />} />
          <Route path="simulator" element={<SimulatorPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
