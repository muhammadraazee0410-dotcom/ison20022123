import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect, createContext, useContext } from "react";
import { Toaster } from "@/components/ui/sonner";
import { SpeedInsights } from "@vercel/speed-insights/react";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Transactions from "@/pages/Transactions";
import TransactionDetail from "@/pages/TransactionDetail";
import NewTransaction from "@/pages/NewTransaction";
import AdminPanel from "@/pages/AdminPanel";
import BankingReports from "@/pages/BankingReports";
import Layout from "@/components/Layout";

// Auth Context
export const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("hsbc_user");
    return saved ? JSON.parse(saved) : null;
  });

  // Hide Emergent badge and fixed overlays during printing
  useEffect(() => {
    let hiddenEls = [];
    const onBeforePrint = () => {
      document.querySelectorAll('[style*="position: fixed"], [style*="position:fixed"]').forEach(el => {
        if (el.style.display !== 'none') {
          hiddenEls.push({ el, prev: el.style.display });
          el.style.display = 'none';
        }
      });
    };
    const onAfterPrint = () => {
      hiddenEls.forEach(({ el, prev }) => { el.style.display = prev; });
      hiddenEls = [];
    };
    window.addEventListener('beforeprint', onBeforePrint);
    window.addEventListener('afterprint', onAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', onBeforePrint);
      window.removeEventListener('afterprint', onAfterPrint);
    };
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("hsbc_user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("hsbc_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="transactions/new" element={<NewTransaction />} />
            <Route path="transactions/:id" element={<TransactionDetail />} />
            <Route path="admin" element={<AdminPanel />} />
            <Route path="reports" element={<BankingReports />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
      <SpeedInsights />
    </AuthContext.Provider>
  );
}

export default App;
