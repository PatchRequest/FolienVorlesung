import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function DashboardPage() {
  const [presentations, setPresentations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/presentations').then(setPresentations).finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    const p = await api.post('/api/presentations', { title: 'Untitled Presentation' });
    navigate(`/edit/${p.id}`);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this presentation?')) return;
    await api.delete(`/api/presentations/${id}`);
    setPresentations(prev => prev.filter(p => p.id !== id));
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto', padding: '0 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>My Presentations</h1>
        <button className="btn-primary" onClick={handleCreate}>+ New Presentation</button>
      </div>
      {presentations.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-light)' }}>
          No presentations yet. Create your first one!
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {presentations.map(p => (
            <div key={p.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <h3 style={{ margin: 0 }}>{p.title}</h3>
                  {p.public && (
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.5rem',
                      backgroundColor: '#bd93f9',
                      color: '#000',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      borderRadius: '3px'
                    }}>
                      Public
                    </span>
                  )}
                </div>
                <span style={{ color: 'var(--color-text-light)', fontSize: '0.85rem' }}>
                  Updated: {new Date(p.updated_at).toLocaleString('de-DE')}
                </span>
                {p.slug && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <a
                      href={`/view/${p.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: '#50fa7b',
                        fontSize: '0.85rem',
                        textDecoration: 'none',
                        display: 'inline-block'
                      }}
                      onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                      onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                    >
                      → /view/{p.slug}
                    </a>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn-primary" onClick={() => navigate(`/edit/${p.id}`)}>Edit</button>
                <button className="btn-secondary" onClick={() => navigate(`/present/${p.id}`)}>Present</button>
                <button className="btn-danger" onClick={() => handleDelete(p.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
