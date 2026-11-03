import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PaymentPage from './pages/PaymentPage';
import ReceiptPage from './pages/ReceiptPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PaymentPage />} />
        <Route path="/receipt" element={<ReceiptPage />} />
      </Routes>
    </BrowserRouter>
  );
}
