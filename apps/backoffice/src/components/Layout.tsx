import { useEffect, useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-4 py-2 rounded ${isActive ? 'bg-blue-600' : 'hover:bg-gray-700'}`;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 text-white flex flex-col transform transition-transform duration-200 ease-in-out
        md:relative md:z-auto md:w-60 md:translate-x-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-6 text-xl font-bold border-b border-gray-700 flex items-center justify-between">
          Backoffice
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-gray-400 hover:text-white"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <NavLink to="/" end className={linkClass}>
            Dashboard
          </NavLink>
          {user?.role === 'ADMIN' && (
            <NavLink to="/users" className={linkClass}>
              Users
            </NavLink>
          )}
          <NavLink to="/documents" className={linkClass}>
            Documentary
          </NavLink>
          <NavLink to="/products" className={linkClass}>
            Products
          </NavLink>
        </nav>
        {user && (
          <div className="mx-4 mb-2 text-xs text-gray-400">
            {user.name} <span className="text-gray-500">({user.role})</span>
          </div>
        )}
        <button onClick={logout} className="m-4 mt-0 bg-red-600 px-4 py-2 rounded hover:bg-red-700">
          Logout
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        <header className="md:hidden flex items-center gap-3 bg-gray-900 text-white p-4 sticky top-0 z-20">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="p-1"
          >
            <span className="block w-6 h-0.5 bg-white mb-1.5" />
            <span className="block w-6 h-0.5 bg-white mb-1.5" />
            <span className="block w-6 h-0.5 bg-white" />
          </button>
          <span className="font-bold">Backoffice</span>
        </header>
        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
