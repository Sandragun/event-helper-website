import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import QRScanner from '../components/QRScanner';
import CertificateManager from '../components/CertificateManager';

export function DashboardAdmin() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    support_contact: '',
    poster_url: '',
    is_approved: false
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching events:', err);
      alert('Error fetching events: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (editingEvent) {
        const { error } = await supabase
          .from('events')
          .update({
            title: formData.title,
            description: formData.description,
            support_contact: formData.support_contact,
            poster_url: formData.poster_url,
            is_approved: formData.is_approved
          })
          .eq('id', editingEvent.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('events')
          .insert([{
            title: formData.title,
            description: formData.description,
            support_contact: formData.support_contact,
            poster_url: formData.poster_url,
            is_approved: formData.is_approved,
            created_by: user.id
          }]);

        if (error) throw error;
      }

      setShowForm(false);
      setEditingEvent(null);
      setFormData({
        title: '',
        description: '',
        support_contact: '',
        poster_url: '',
        is_approved: false
      });
      fetchEvents();
    } catch (err) {
      alert('Error saving event: ' + err.message);
    }
  }

  async function handleDelete(eventId) {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      fetchEvents();
    } catch (err) {
      alert('Error deleting event: ' + err.message);
    }
  }

  function handleEdit(event) {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      support_contact: event.support_contact || '',
      poster_url: event.poster_url || '',
      is_approved: event.is_approved
    });
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingEvent(null);
    setFormData({
      title: '',
      description: '',
      support_contact: '',
      poster_url: '',
      is_approved: false
    });
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `posters/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('event-posters')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = await supabase.storage
        .from('event-posters')
        .getPublicUrl(filePath);

      setFormData({ ...formData, poster_url: data.publicUrl });
    } catch (err) {
      alert('Error uploading file: ' + err.message);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate('/auth');
  }

  if (showScanner) {
    return <QRScanner onClose={() => setShowScanner(false)} />;
  }

  return (
    <div>
      <div className="sidebar">
        <button className="nav-item" onClick={() => setShowScanner(true)}>📱 Scan QR</button>
        <Link to="/dashboard-admin" className="nav-item active">🔐 Admin Dashboard</Link>
        <Link to="/events" className="nav-item">🎪 Events</Link>
        <button className="nav-item" onClick={signOut}>🚪 Sign Out</button>
      </div>
      <div className="container layout-with-sidebar">
        <div className="header">
          <div>
            <h1 style={{ marginBottom: 4 }}>🔐 Admin Dashboard</h1>
            <p style={{ margin: 0, color: '#a0a0b0', fontSize: 14 }}>Manage events and scan attendances</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setShowScanner(true)}
              className="btn btn-success"
            >
              📱 Scan QR Code
            </button>
            <button
              onClick={signOut}
              className="btn btn-danger"
            >
              🚪 Sign Out
            </button>
          </div>
        </div>

      <div className="panel" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0 }}>Events</h2>
            <p style={{ color: '#a0a0b0', margin: 0 }}>Manage and monitor your events</p>
          </div>
          <button
            onClick={() => {
              setEditingEvent(null);
              setFormData({
                title: '',
                description: '',
                support_contact: '',
                poster_url: '',
                is_approved: false
              });
              setShowForm(true);
            }}
            className="btn btn-primary"
            style={{ fontSize: 16 }}
          >
            ➕ Create New Event
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h2 style={{ marginTop: 0, marginBottom: 8 }}>{editingEvent ? '✏️ Edit Event' : '➕ Create New Event'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Event Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Tech Conference 2024"
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your event here..."
                rows="4"
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="form-group">
              <label>Support Contact</label>
              <input
                type="text"
                value={formData.support_contact}
                onChange={(e) => setFormData({ ...formData, support_contact: e.target.value })}
                placeholder="contact@example.com or phone number"
              />
            </div>

            <div className="form-group">
              <label>Poster Image</label>
              <input
                type="url"
                value={formData.poster_url}
                onChange={(e) => setFormData({ ...formData, poster_url: e.target.value })}
                placeholder="Or upload a file below"
                style={{ marginBottom: '12px' }}
              />
              <div style={{ marginBottom: '12px' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ fontSize: '14px' }}
                />
              </div>
              {formData.poster_url && (
                <div>
                  <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#a0a0b0' }}>📸 Poster preview</p>
                  <img
                    src={formData.poster_url}
                    alt="Event poster preview"
                    style={{
                      width: '100%',
                      maxHeight: '250px',
                      objectFit: 'cover',
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}
                  />
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontWeight: '600' }}>
                <input
                  type="checkbox"
                  checked={formData.is_approved}
                  onChange={(e) => setFormData({ ...formData, is_approved: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span>✓ Approve event (make visible to users)</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn btn-success" style={{ flex: 1 }}>
                {editingEvent ? '💾 Update Event' : '✅ Create Event'}
              </button>
              <button type="button" onClick={handleCancel} className="btn btn-secondary" style={{ flex: 1 }}>
                ❌ Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="panel" style={{ marginBottom: '24px' }}>
        {loading ? (
          <div className="grid-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="card skeleton" style={{ height: 300 }} />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎪</div>
            <h3 style={{ marginBottom: 8 }}>No Events Yet</h3>
            <p style={{ color: '#a0a0b0', margin: 0 }}>Create your first event using the button above!</p>
          </div>
        ) : (
          <div className="grid-3">
            {events.map((event) => (
              <div key={event.id} className="card fade-in">
                {event.poster_url && (
                  <img
                    src={event.poster_url}
                    alt={event.title}
                    className="img-banner"
                  />
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{event.title}</h3>
                  <span className={`badge ${event.is_approved ? 'badge-green' : 'badge-red'}`}>
                    {event.is_approved ? '✓ Approved' : '⏳ Pending'}
                  </span>
                </div>
                <p style={{ color: '#a0a0b0', marginBottom: 12, fontSize: 14 }}>{event.description}</p>
                {event.support_contact && (
                  <div style={{ marginBottom: 16, padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: 8, fontSize: 13 }}>
                    <strong style={{ color: '#60a5fa' }}>📞 Contact:</strong> <span style={{ color: '#e0e0e0' }}>{event.support_contact}</span>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => handleEdit(event)}
                    className="btn btn-primary"
                    style={{ flex: 1, fontSize: 13, padding: '10px 16px' }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="btn btn-danger"
                    style={{ flex: 1, fontSize: 13, padding: '10px 16px' }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CertificateManager />
      </div>
    </div>
  );
}
