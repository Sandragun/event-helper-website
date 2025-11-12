import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching events:', error);
        // If table doesn't exist yet, just show empty state
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          console.warn('Events table does not exist yet. Please run the database schema.');
        }
        setEvents([]);
      } else {
        setEvents(data || []);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading events...</div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <div>
          <h1 style={{ marginBottom: 4 }}>🎪 Upcoming Events</h1>
          <p style={{ margin: 0, color: '#a0a0b0', fontSize: 14 }}>Discover and register for exciting events</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/auth" className="btn btn-primary">
            🔑 Sign In
          </Link>
          <Link to="/auth" className="btn btn-success">
            📝 Register
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card skeleton" style={{ height: 300 }} />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
          <h3 style={{ marginBottom: 8 }}>No Events Available</h3>
          <p style={{ color: '#a0a0b0', margin: 0 }}>Check back soon for upcoming events!</p>
        </div>
      ) : (
        <div className="grid-3">
          {events.map((event) => (
            <div key={event.id} className="card fade-in" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {event.poster_url ? (
                <img
                  src={event.poster_url}
                  alt={event.title}
                  className="img-banner"
                />
              ) : (
                <div className="banner-placeholder">🎪</div>
              )}
              
              <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 18, fontWeight: 700 }}>{event.title}</h3>
              <p style={{ color: '#a0a0b0', marginBottom: 12, fontSize: 14, flex: 1 }}>{event.description}</p>
              
              {event.support_contact && (
                <div style={{ marginBottom: 12, padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: 8, fontSize: 13 }}>
                  <strong style={{ color: '#60a5fa' }}>📞 Contact:</strong> <span style={{ color: '#e0e0e0' }}>{event.support_contact}</span>
                </div>
              )}
              
              <Link
                to="/auth"
                className="btn btn-primary btn-block"
                style={{ marginTop: 'auto' }}
              >
                ✨ Register Now
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

