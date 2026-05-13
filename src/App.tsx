import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { BedsPage } from './pages/BedsPage';
import { BedDetailPage } from './pages/BedDetailPage';
import { EventLogPage } from './pages/EventLogPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="beds" element={<BedsPage />} />
          <Route path="beds/:bedId" element={<BedDetailPage />} />
          <Route path="events" element={<EventLogPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
