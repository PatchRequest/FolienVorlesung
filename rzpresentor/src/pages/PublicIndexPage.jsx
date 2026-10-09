import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export default function PublicIndexPage() {
  const [presentations, setPresentations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/public/presentations')
      .then(setPresentations)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="public-index">
      <header className="public-header">
        <h1>Offensive Security</h1>
        <p>Daniel Riebel — DHBW Mannheim</p>
      </header>

      {loading ? (
        <div className="public-loading">Loading…</div>
      ) : presentations.length === 0 ? (
        <div className="public-empty">No presentations available yet.</div>
      ) : (
        <div className="public-grid">
          {presentations.map(p => (
            <Link key={p.id} to={`/view/${p.slug}`} className="public-card">
              <h2>{p.title}</h2>
              <span className="public-card-date">
                Zuletzt aktualisiert:{' '}
                {new Date(p.updated_at).toLocaleDateString('de-DE', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
