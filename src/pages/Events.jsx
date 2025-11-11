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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0 }}>Upcoming Events</h1>
        <div>
          <Link to="/auth" style={{ marginRight: '12px', color: '#2563eb', textDecoration: 'none' }}>
            Login
          </Link>
          <Link to="/auth" style={{ color: '#2563eb', textDecoration: 'none' }}>
            Register
          </Link>
        </div>
      </div>

      {events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: '8px' }}>
          <p>No events available at the moment.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {events.map((event) => (
            <div
              key={event.id}
              style={{
                background: '#fff',
                padding: '24px',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                display: 'grid',
                gridTemplateColumns: event.poster_url ? '200px 1fr' : '1fr',
                gap: '20px'
              }}
            >
              {event.poster_url && (
                <img
                  src={event.poster_url}
                  alt={event.title}
                  style={{
                    width: '100%',
                    height: '200px',
                    objectFit: 'cover',
                    borderRadius: '8px'
                  }}
                />
              )}
              <div>
                <h2 style={{ marginTop: 0, marginBottom: '12px' }}>{event.title}</h2>
                <p style={{ color: '#64748b', marginBottom: '16px' }}>{event.description}</p>
                {event.support_contact && (
                  <p style={{ marginBottom: '16px' }}>
                    <strong>Contact:</strong> {event.support_contact}
                  </p>
                )}
                <Link
                  to="/auth"
                  style={{
                    display: 'inline-block',
                    padding: '10px 20px',
                    background: '#2563eb',
                    color: '#fff',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    marginTop: '12px'
                  }}
                >
                  Register Now
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

