import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import QRScanner from '../components/QRScanner';

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
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0 }}>Admin Dashboard</h1>
        <div>
          <button
            onClick={() => setShowScanner(true)}
            style={{
              padding: '8px 16px',
              marginRight: '12px',
              background: '#10b981',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Scan QR Code
          </button>
          <button
            onClick={signOut}
            style={{
              padding: '8px 16px',
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
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
          style={{
            padding: '10px 20px',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          + Create New Event
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2 style={{ marginTop: 0 }}>{editingEvent ? 'Edit Event' : 'Create New Event'}</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="4"
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Support Contact</label>
              <input
                type="text"
                value={formData.support_contact}
                onChange={(e) => setFormData({ ...formData, support_contact: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Poster URL</label>
              <input
                type="url"
                value={formData.poster_url}
                onChange={(e) => setFormData({ ...formData, poster_url: e.target.value })}
                placeholder="Or upload a file below"
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '8px' }}
              />
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ fontSize: '14px' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={formData.is_approved}
                  onChange={(e) => setFormData({ ...formData, is_approved: e.target.checked })}
                />
                <span>Approve event (make visible to users)</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="submit"
                style={{
                  padding: '10px 20px',
                  background: '#10b981',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                {editingEvent ? 'Update Event' : 'Create Event'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  padding: '10px 20px',
                  background: '#64748b',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading events...</div>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <h2 style={{ margin: 0 }}>{event.title}</h2>
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      background: event.is_approved ? '#d1fae5' : '#fee2e2',
                      color: event.is_approved ? '#065f46' : '#991b1b'
                    }}
                  >
                    {event.is_approved ? 'Approved' : 'Pending'}
                  </span>
                </div>
                <p style={{ color: '#64748b', marginBottom: '16px' }}>{event.description}</p>
                {event.support_contact && (
                  <p style={{ marginBottom: '16px' }}>
                    <strong>Contact:</strong> {event.support_contact}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => handleEdit(event)}
                    style={{
                      padding: '8px 16px',
                      background: '#2563eb',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    style={{
                      padding: '8px 16px',
                      background: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {events.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: '8px' }}>
          <p>No events created yet. Create your first event!</p>
        </div>
      )}
    </div>
  );
}
