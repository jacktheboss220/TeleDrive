import { useState } from 'react';
import { ToastProvider } from './context/ToastContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  return (
    <ToastProvider>
      {token ? (
        <Dashboard
          onLogout={() => {
            localStorage.removeItem('token');
            setToken(null);
          }}
        />
      ) : (
        <Login onLogin={setToken} />
      )}
    </ToastProvider>
  );
}
