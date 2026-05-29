import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout.jsx';
import AdminDashboard from './pages/AdminDashboard/index.jsx';
import Home from './pages/Home/index.jsx';
import Login from './pages/Login/index.jsx';
import MapPage from './pages/Map/index.jsx';
import Payment from './pages/Payment/index.jsx';
import Premium from './pages/Premium/index.jsx';
import Register from './pages/Register/index.jsx';
import StallDashboard from './pages/StallDashboard/index.jsx';
const logo = `${import.meta.env.BASE_URL}brand/logo.png`;

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 650);
    return () => window.clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <img src={logo} alt="VietTourAudio" />
        <span>VietTourAudio</span>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Home />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/premium" element={<Premium />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/stall-dashboard" element={<StallDashboard />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
