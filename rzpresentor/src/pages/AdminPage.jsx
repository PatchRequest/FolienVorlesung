import { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState({});
  const [resetPw, setResetPw] = useState({});

  useEffect(() => {
    api.get('/api/admin/users').then(setUsers);
    api.get('/api/admin/settings').then(setSettings);
  }, []);

  const toggleLock = async (userId, currentlyLocked) => {
    await api.put(`/api/admin/users/${userId}/lock`, { locked: !currentlyLocked });
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, isLocked: !currentlyLocked, is_locked: !currentlyLocked ? 1 : 0 } : u));
  };

  const resetPassword = async (userId) => {
    const pw = resetPw[userId];
    if (!pw || pw.length < 8) return alert('Password must be at least 8 characters');
    await api.put(`/api/admin/users/${userId}/reset-password`, { newPassword: pw });
    setResetPw(prev => ({ ...prev, [userId]: '' }));
    alert('Password reset successfully');
  };

  const toggleRegistration = async () => {
    const newVal = settings.allow_registration !== 'true';
    await api.put('/api/admin/settings', { allowRegistration: newVal });
    setSettings(prev => ({ ...prev, allow_registration: String(newVal) }));
  };

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto', padding: '0 1rem' }}>
      <h1 style={{ marginBottom: '2rem' }}>Admin Panel</h1>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Settings</h2>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={settings.allow_registration === 'true'} onChange={toggleRegistration} />
          Allow new user registration
        </label>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '1rem' }}>Users ({users.length})</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
              <th style={{ padding: '0.5rem' }}>Username</th>
              <th style={{ padding: '0.5rem' }}>Email</th>
              <th style={{ padding: '0.5rem' }}>Role</th>
              <th style={{ padding: '0.5rem' }}>Status</th>
              <th style={{ padding: '0.5rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '0.5rem' }}>{u.username}</td>
                <td style={{ padding: '0.5rem' }}>{u.email}</td>
                <td style={{ padding: '0.5rem' }}>{u.isAdmin ? 'Admin' : 'User'}</td>
                <td style={{ padding: '0.5rem' }}>
                  <span style={{ color: u.isLocked ? 'var(--color-danger)' : 'var(--color-primary)' }}>
                    {u.isLocked ? 'Locked' : 'Active'}
                  </span>
                </td>
                <td style={{ padding: '0.5rem' }}>
                  {!u.isAdmin && (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <button className="btn-secondary" onClick={() => toggleLock(u.id, u.isLocked)}>
                        {u.isLocked ? 'Unlock' : 'Lock'}
                      </button>
                      <input
                        placeholder="New password"
                        type="password"
                        value={resetPw[u.id] || ''}
                        onChange={e => setResetPw(prev => ({ ...prev, [u.id]: e.target.value }))}
                        style={{ width: 140 }}
                      />
                      <button className="btn-danger" onClick={() => resetPassword(u.id)}>Reset PW</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
