import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--color-border)',
        background: 'white',
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--color-text)' }}>
          <span style={{ color: 'var(--color-primary)', fontWeight: 800, fontSize: '1.25rem' }}>RZ</span>
          <span style={{ fontWeight: 800, fontSize: '1.25rem' }}>Presenter</span>
        </Link>
        {user && (
          <nav style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/">Presentations</Link>
            {user.isAdmin && <Link to="/admin">Admin</Link>}
            <span style={{ color: 'var(--color-text-light)' }}>{user.username}</span>
            <button className="btn-secondary" onClick={handleLogout}>Logout</button>
          </nav>
        )}
      </header>
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
}
