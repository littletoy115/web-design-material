import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import api from '../services/api';
import { LoginResponse } from '@repo/types';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    // Dev bypass: use admin@demo.com / admin123 to skip API call
    if (import.meta.env.DEV && email === 'admin@demo.com' && password === 'admin123') {
      setAuth('dev-token', { id: 'dev', email: 'admin@demo.com', name: 'Admin (Dev)', role: 'admin' });
      navigate('/');
      return;
    }

    try {
      const { data } = await api.post<{ success: boolean; data: LoginResponse }>('/api/auth/login', { email, password });
      if (data.data.user.role !== 'admin') {
        setError('Admin access only');
        return;
      }
      setAuth(data.data.token, data.data.user);
      navigate('/');
    } catch {
      setError('Invalid credentials');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <form onSubmit={handleLogin} className="bg-gray-800 p-8 rounded-xl shadow w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-white text-center">Admin Login</h1>
        {import.meta.env.DEV && (
          <p className="text-yellow-400 text-xs text-center">
            Dev: <span className="font-mono">admin@demo.com</span> / <span className="font-mono">admin123</span>
          </p>
        )}
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          Sign In
        </button>
      </form>
    </div>
  );
}
