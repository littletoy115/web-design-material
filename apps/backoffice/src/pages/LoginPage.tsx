import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from '@repo/ui';
import { useAuthStore } from '../store/auth.store';
import api from '../services/api';
import { LoginResponse } from '@repo/types';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (import.meta.env.DEV && email === 'admin@demo.com' && password === 'admin123') {
      try {
        const { data } = await api.post<{ success: boolean; data: LoginResponse }>('/api/auth/dev-login');
        setAuth(data.data.token, data.data.user);
        navigate('/');
      } catch {
        setError('Dev login failed — is the API running?');
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const { data } = await api.post<{ success: boolean; data: LoginResponse }>('/api/auth/login', { email, password });
      if (data.data.user.role !== 'ADMIN') {
        setError('Admin access only');
        return;
      }
      setAuth(data.data.token, data.data.user);
      navigate('/');
    } catch {
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LayoutDashboard className="size-5" />
          </div>
          <CardTitle>Admin Login</CardTitle>
          <CardDescription>Sign in to access the backoffice</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" loading={loading}>
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
