import { Outlet, NavLink } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';

export default function Layout() {
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-60 bg-gray-900 text-white flex flex-col">
        <div className="p-6 text-xl font-bold border-b border-gray-700">Backoffice</div>
        <nav className="flex-1 p-4 space-y-1">
          <NavLink to="/" end className={({ isActive }) => `block px-4 py-2 rounded ${isActive ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
            Dashboard
          </NavLink>
          <NavLink to="/users" className={({ isActive }) => `block px-4 py-2 rounded ${isActive ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
            Users
          </NavLink>
        </nav>
        <button onClick={logout} className="m-4 bg-red-600 px-4 py-2 rounded hover:bg-red-700">
          Logout
        </button>
      </aside>
      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
