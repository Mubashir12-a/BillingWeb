import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import BillingPage from './pages/BillingPage'
import CustomersPage from './pages/CustomersPage'
import HistoryPage from './pages/HistoryPage'
import AdminPage from './pages/AdminPage'
import BottomNav from './components/BottomNav'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BillingPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </BrowserRouter>
  )
}
