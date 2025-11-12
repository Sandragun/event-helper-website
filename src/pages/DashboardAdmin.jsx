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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Background Elements */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          filter: 'blur(80px)',
          top: '-100px',
          right: '-100px',
          animation: 'float 20s infinite ease-in-out'
        }} />
        <div style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'rgba(118, 75, 162, 0.2)',
          filter: 'blur(100px)',
          bottom: '-50px',
          left: '-50px',
          animation: 'float 15s infinite ease-in-out reverse'
        }} />
      </div>

      {/* Sidebar */}
      <div style={{
        position: 'fixed',
        left: 0,
        top: 0,
        height: '100vh',
        width: '280px',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.2)',
        padding: '32px 0',
        zIndex: 100,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          padding: '0 24px 32px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          marginBottom: '24px'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: '700',
            color: '#fff',
            textShadow: '0 2px 10px rgba(0,0,0,0.2)'
          }}>🔐 Admin Panel</h2>
          <p style={{
            margin: '8px 0 0',
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '14px'
          }}>Event Management</p>
        </div>
        
        <div style={{ padding: '0 16px' }}>
          <button
            onClick={() => setShowScanner(true)}
            style={{
              width: '100%',
              padding: '14px 20px',
              marginBottom: '12px',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.25)';
              e.target.style.transform = 'translateX(5px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.15)';
              e.target.style.transform = 'translateX(0)';
            }}
          >
            <span style={{ fontSize: '20px' }}>📱</span>
            <span>Scan QR Code</span>
          </button>

          <Link
            to="/dashboard-admin"
            style={{
              width: '100%',
              padding: '14px 20px',
              marginBottom: '12px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.2))',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
            }}
          >
            <span style={{ fontSize: '20px' }}>🔐</span>
            <span>Admin Dashboard</span>
          </Link>

          <Link
            to="/events"
            style={{
              width: '100%',
              padding: '14px 20px',
              marginBottom: '12px',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textDecoration: 'none',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.25)';
              e.target.style.transform = 'translateX(5px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.15)';
              e.target.style.transform = 'translateX(0)';
            }}
          >
            <span style={{ fontSize: '20px' }}>🎪</span>
            <span>Events</span>
          </Link>

          <button
            onClick={signOut}
            style={{
              width: '100%',
              padding: '14px 20px',
              background: 'rgba(239, 68, 68, 0.2)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(239, 68, 68, 0.2)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(239, 68, 68, 0.3)';
              e.target.style.transform = 'translateX(5px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(239, 68, 68, 0.2)';
              e.target.style.transform = 'translateX(0)';
            }}
          >
            <span style={{ fontSize: '20px' }}>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        marginLeft: '280px',
        padding: '40px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '32px',
          marginBottom: '32px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: '36px',
              fontWeight: '700',
              color: '#fff',
              textShadow: '0 2px 10px rgba(0,0,0,0.2)',
              marginBottom: '8px'
            }}>🔐 Admin Dashboard</h1>
            <p style={{
              margin: 0,
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '16px'
            }}>Manage events and scan attendances</p>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button
              onClick={() => setShowScanner(true)}
              style={{
                padding: '14px 28px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 25px rgba(16, 185, 129, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 20px rgba(16, 185, 129, 0.4)';
              }}
            >
              📱 Scan QR Code
            </button>
            <button
              onClick={signOut}
              style={{
                padding: '14px 28px',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                border: 'none',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(239, 68, 68, 0.4)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 25px rgba(239, 68, 68, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 20px rgba(239, 68, 68, 0.4)';
              }}
            >
              🚪 Sign Out
            </button>
          </div>
        </div>

        {/* Events Section Header */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '28px 32px',
          marginBottom: '32px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: '28px',
              fontWeight: '700',
              color: '#fff',
              textShadow: '0 2px 10px rgba(0,0,0,0.2)'
            }}>Events</h2>
            <p style={{
              color: 'rgba(255, 255, 255, 0.85)',
              margin: '6px 0 0',
              fontSize: '15px'
            }}>Manage and monitor your events</p>
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
            style={{
              padding: '14px 28px',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 25px rgba(59, 130, 246, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 20px rgba(59, 130, 246, 0.4)';
            }}
          >
            ➕ Create New Event
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '32px',
            marginBottom: '32px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            animation: 'slideDown 0.3s ease'
          }}>
            <h2 style={{
              marginTop: 0,
              marginBottom: 24,
              fontSize: '24px',
              fontWeight: '700',
              color: '#fff',
              textShadow: '0 2px 10px rgba(0,0,0,0.2)'
            }}>
              {editingEvent ? '✏️ Edit Event' : '➕ Create New Event'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '10px',
                  color: '#fff',
                  fontSize: '15px',
                  fontWeight: '600'
                }}>Event Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Tech Conference 2024"
                  required
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.25)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                  }}
                  onBlur={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '10px',
                  color: '#fff',
                  fontSize: '15px',
                  fontWeight: '600'
                }}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your event here..."
                  rows="4"
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '15px',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.25)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                  }}
                  onBlur={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '10px',
                  color: '#fff',
                  fontSize: '15px',
                  fontWeight: '600'
                }}>Support Contact</label>
                <input
                  type="text"
                  value={formData.support_contact}
                  onChange={(e) => setFormData({ ...formData, support_contact: e.target.value })}
                  placeholder="contact@example.com or phone number"
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.25)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                  }}
                  onBlur={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '10px',
                  color: '#fff',
                  fontSize: '15px',
                  fontWeight: '600'
                }}>Poster Image</label>
                <input
                  type="url"
                  value={formData.poster_url}
                  onChange={(e) => setFormData({ ...formData, poster_url: e.target.value })}
                  placeholder="Or upload a file below"
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    marginBottom: '12px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.25)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                  }}
                  onBlur={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                  }}
                />
                <div style={{ marginBottom: '12px' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{
                      fontSize: '14px',
                      color: '#fff',
                      padding: '10px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                  />
                </div>
                {formData.poster_url && (
                  <div>
                    <p style={{
                      margin: '0 0 12px 0',
                      fontSize: '13px',
                      color: 'rgba(255, 255, 255, 0.8)'
                    }}>📸 Poster preview</p>
                    <img
                      src={formData.poster_url}
                      alt="Event poster preview"
                      style={{
                        width: '100%',
                        maxHeight: '250px',
                        objectFit: 'cover',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
                      }}
                    />
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '28px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  color: '#fff',
                  padding: '14px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
                >
                  <input
                    type="checkbox"
                    checked={formData.is_approved}
                    onChange={(e) => setFormData({ ...formData, is_approved: e.target.checked })}
                    style={{
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer',
                      accentColor: '#10b981'
                    }}
                  />
                  <span>✓ Approve event (make visible to users)</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 25px rgba(16, 185, 129, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 20px rgba(16, 185, 129, 0.4)';
                  }}
                >
                  {editingEvent ? '💾 Update Event' : '✅ Create Event'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.25)';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  ❌ Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Events Grid */}
        <div>
          {loading ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '24px'
            }}>
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  style={{
                    height: '400px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    animation: 'pulse 1.5s infinite'
                  }}
                />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              padding: '60px',
              textAlign: 'center',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎪</div>
              <h3 style={{
                marginBottom: '12px',
                fontSize: '24px',
                fontWeight: '700',
                color: '#fff'
              }}>No Events Yet</h3>
              <p style={{
                color: 'rgba(255, 255, 255, 0.8)',
                margin: 0,
                fontSize: '16px'
              }}>Create your first event using the button above!</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '24px'
            }}>
              {events.map((event, index) => (
                <div
                  key={event.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.3s ease',
                    animation: `fadeInUp 0.5s ease ${index * 0.1}s both`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  {event.poster_url && (
                    <div style={{
                      width: '100%',
                      height: '200px',
                      overflow: 'hidden',
                      position: 'relative'
                    }}>
                      <img
                        src={event.poster_url}
                        alt={event.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.3))'
                      }} />
                    </div>
                  )}
                  <div style={{ padding: '24px' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '16px'
                    }}>
                      <h3 style={{
                        margin: 0,
                        fontSize: '20px',
                        fontWeight: '700',
                        color: '#fff',
                        textShadow: '0 2px 10px rgba(0,0,0,0.2)'
                      }}>{event.title}</h3>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: event.is_approved 
                          ? 'linear-gradient(135deg, #10b981, #059669)' 
                          : 'linear-gradient(135deg, #f59e0b, #d97706)',
                        color: '#fff',
                        boxShadow: event.is_approved
                          ? '0 2px 10px rgba(16, 185, 129, 0.3)'
                          : '0 2px 10px rgba(245, 158, 11, 0.3)',
                        whiteSpace: 'nowrap'
                      }}>
                        {event.is_approved ? '✓ Approved' : '⏳ Pending'}
                      </span>
                    </div>
                    <p style={{
                      color: 'rgba(255, 255, 255, 0.85)',
                      marginBottom: '16px',
                      fontSize: '14px',
                      lineHeight: '1.6'
                    }}>{event.description}</p>
                    {event.support_contact && (
                      <div style={{
                        marginBottom: '20px',
                        padding: '14px',
                        background: 'rgba(59, 130, 246, 0.15)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '12px',
                        fontSize: '13px',
                        border: '1px solid rgba(59, 130, 246, 0.3)'
                      }}>
                        <strong style={{ color: '#93c5fd' }}>📞 Contact:</strong>{' '}
                        <span style={{ color: '#e0e0e0' }}>{event.support_contact}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={() => handleEdit(event)}
                        style={{
                          flex: 1,
                          padding: '12px',
                          background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                          border: 'none',
                          borderRadius: '10px',
                          color: '#fff',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)';
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(event.id)}
                        style={{
                          flex: 1,
                          padding: '12px',
                          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                          border: 'none',
                          borderRadius: '10px',
                          color: '#fff',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.3)';
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Certificate Manager Section */}
        <div style={{ marginTop: '40px' }}>
          <CertificateManager />
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-20px) translateX(20px); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.8; }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        input::placeholder,
        textarea::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }
        
        input[type="file"]::file-selector-button {
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          borderRadius: 8px;
          color: #fff;
          cursor: pointer;
          marginRight: 12px;
          transition: all 0.3s ease;
        }
        
        input[type="file"]::file-selector-button:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        
        * {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
        }
        
        *::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        *::-webkit-scrollbar-track {
          background: transparent;
        }
        
        *::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          borderRadius: 4px;
        }
        
        *::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.4);
        }
      `}</style>
    </div>
  );
}