import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import QRCode from 'qrcode';
import Chatbot from '../components/Chatbot';

export function DashboardUser() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [showChatbot, setShowChatbot] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    registration_number: '',
    email: '',
    phone_number: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const { data: details } = await supabase
        .from('user_details')
        .select('*')
        .eq('id', user.id)
        .single();

      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      const { data: regData } = await supabase
        .from('event_registrations')
        .select(`
          *,
          events (*)
        `)
        .eq('user_id', user.id)
        .order('registered_at', { ascending: false });

      setFormData({
        full_name: profile?.full_name || '',
        registration_number: details?.registration_number || '',
        email: profile?.email || user.email || '',
        phone_number: details?.phone_number || ''
      });

      setUserDetails(details);
      setEvents(eventsData || []);
      setRegistrations(regData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleFirstTimeRegistration(e) {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: formData.full_name, email: formData.email })
        .eq('id', user.id);

      if (profileError) throw profileError;

      const { error: detailsError } = await supabase
        .from('user_details')
        .upsert({
          id: user.id,
          registration_number: formData.registration_number,
          phone_number: formData.phone_number
        });

      if (detailsError) throw detailsError;

      setUserDetails({
        registration_number: formData.registration_number,
        phone_number: formData.phone_number
      });

      await registerForEvent(selectedEvent.id);
    } catch (err) {
      alert('Error saving details: ' + err.message);
    }
  }

  async function registerForEvent(eventId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: existing } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        alert('You are already registered for this event!');
        return;
      }

      const qrData = JSON.stringify({
        event_id: eventId,
        user_id: user.id,
        timestamp: Date.now()
      });

      const qrCodeDataUrl = await QRCode.toDataURL(qrData);

      const additionalPayload = {
        registered_via: 'form',
        qr_code_image: qrCodeDataUrl
      };
      if (additionalDetails) {
        additionalPayload.notes = additionalDetails;
      }

      const { error } = await supabase
        .from('event_registrations')
        .insert([{
          event_id: eventId,
          user_id: user.id,
          qr_code: qrData,
          additional_details: additionalPayload
        }]);

      if (error) throw error;

      setQrCodeUrl(qrCodeDataUrl);
      setShowRegistrationForm(false);
      setAdditionalDetails('');
      fetchData();
    } catch (err) {
      alert('Error registering for event: ' + err.message);
    }
  }

  function handleRegisterClick(event) {
    if (!userDetails || !userDetails.registration_number || !userDetails.phone_number) {
      setSelectedEvent(event);
      setShowRegistrationForm(true);
    } else {
      registerForEvent(event.id);
    }
  }

  function handleDownloadQr(imageDataUrl, filename) {
    if (!imageDataUrl) return;
    const link = document.createElement('a');
    link.href = imageDataUrl;
    link.download = `${filename}-qr.png`;
    link.click();
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate('/auth');
  }

  if (loading) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '60px', color: '#a0a0b0' }}>
          ⏳ Loading your dashboard...
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="sidebar">
        <Link to="/events" className="nav-item">🎪 Events</Link>
        <Link to="/dashboard-user" className="nav-item active">👤 Dashboard</Link>
        <button className="nav-item" onClick={() => setShowChatbot(true)}>💬 Chatbot</button>
        <button className="nav-item" onClick={signOut}>🚪 Sign Out</button>
      </div>
      <div className="container layout-with-sidebar">
      <div className="header">
        <div>
          <h1 style={{ marginBottom: 4 }}>👤 User Dashboard</h1>
          <p style={{ margin: 0, color: '#a0a0b0', fontSize: 14 }}>Manage your registrations and find events</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setShowChatbot(true)}
            className="btn btn-success"
          >
            💬 Chatbot
          </button>
          <button
            onClick={signOut}
            className="btn btn-danger"
          >
            🚪 Sign Out
          </button>
        </div>
      </div>

      {showRegistrationForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ marginTop: 0, marginBottom: 8 }}>📝 Complete Your Profile</h2>
            <p style={{ color: '#a0a0b0', marginBottom: '20px' }}>
              Please provide your details to register for events. This information will be saved for future registrations.
            </p>
            <form onSubmit={handleFirstTimeRegistration}>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="form-group">
                <label>Registration Number *</label>
                <input
                  type="text"
                  value={formData.registration_number}
                  onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                  placeholder="REG123456"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="+1234567890"
                  required
                />
              </div>

              {selectedEvent && (
                <div className="form-group">
                  <label>Additional Details for {selectedEvent.title} (Optional)</label>
                  <textarea
                    value={additionalDetails}
                    onChange={(e) => setAdditionalDetails(e.target.value)}
                    rows="3"
                    placeholder="Any additional information..."
                    style={{ resize: 'vertical' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="btn btn-success" style={{ flex: 1 }}>
                  ✅ Save & Register
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRegistrationForm(false);
                    setSelectedEvent(null);
                    setAdditionalDetails('');
                  }}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  ❌ Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {qrCodeUrl && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: 'center' }}>
            <h2 style={{ marginTop: 0, marginBottom: 8 }}>✅ Registration Successful!</h2>
            <p style={{ color: '#a0a0b0', marginBottom: '24px' }}>Your QR code for attendance</p>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: 20, borderRadius: 12, marginBottom: 24 }}>
              <img src={qrCodeUrl} alt="QR Code" style={{ maxWidth: '300px', width: '100%' }} />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleDownloadQr(qrCodeUrl, 'event')}
                className="btn btn-primary"
              >
                ⬇️ Download QR
              </button>
              <button
                onClick={() => setQrCodeUrl(null)}
                className="btn btn-secondary"
              >
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="panel" style={{ marginBottom: '24px' }}>
        <h2 style={{ marginBottom: 16 }}>📋 My Registrations</h2>
        {registrations.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <h3 style={{ marginBottom: 8 }}>No Registrations Yet</h3>
            <p style={{ color: '#a0a0b0', margin: 0 }}>You haven't registered for any events. Check available events below!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {registrations.map((reg) => {
              const posterUrl = reg.events?.poster_url;
              const qrImage = reg.additional_details?.qr_code_image;
              return (
                <div key={reg.id} className="card fade-in">
                  <div className="reg-item">
                    {posterUrl && (
                      <img
                        src={posterUrl}
                        alt={reg.events?.title}
                        className="img-banner"
                      />
                    )}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div>
                          <h3 style={{ marginTop: 0, marginBottom: 4 }}>{reg.events?.title}</h3>
                          <p style={{ color: '#a0a0b0', margin: 0, fontSize: 14 }}>{reg.events?.description}</p>
                        </div>
                        <span className={`badge ${reg.attendance_marked ? 'badge-green' : 'badge-yellow'}`}>
                          {reg.attendance_marked ? '✓ Attended' : '⏳ Pending'}
                        </span>
                      </div>

                      {reg.additional_details?.notes && (
                        <div style={{ marginBottom: 12, padding: 12, background: 'rgba(59,130,246,0.1)', borderRadius: 8, fontSize: 13 }}>
                          <strong style={{ color: '#60a5fa' }}>📝 Notes:</strong> <span style={{ color: '#e0e0e0' }}>{reg.additional_details.notes}</span>
                        </div>
                      )}

                      {reg.attendance_marked && reg.attendance_marked_at && (
                        <div style={{ fontSize: 13, color: '#a0a0b0', marginBottom: 12 }}>
                          ✓ Marked at {new Date(reg.attendance_marked_at).toLocaleString()}
                        </div>
                      )}

                      {qrImage && (
                        <button
                          onClick={() => handleDownloadQr(qrImage, reg.events?.title || 'event')}
                          className="btn btn-primary"
                          style={{ fontSize: 13, padding: '8px 16px' }}
                        >
                          ⬇️ Download QR Code
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="panel">
        <h2 style={{ marginBottom: 16 }}>🎪 Available Events</h2>
        {events.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
            <h3 style={{ marginBottom: 8 }}>No Events Available</h3>
            <p style={{ color: '#a0a0b0', margin: 0 }}>Check back soon for upcoming events!</p>
          </div>
        ) : (
          <div className="grid-3">
            {events.map((event) => {
              const isRegistered = registrations.some(reg => reg.event_id === event.id);
              return (
                <div key={event.id} className="card fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
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
                  <p style={{ color: '#a0a0b0', marginBottom: 12, flex: 1, fontSize: 14 }}>{event.description}</p>

                  {event.support_contact && (
                    <div style={{ marginBottom: 12, padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: 8, fontSize: 13 }}>
                      <strong style={{ color: '#60a5fa' }}>📞 Contact:</strong> <span style={{ color: '#e0e0e0' }}>{event.support_contact}</span>
                    </div>
                  )}

                  {isRegistered ? (
                    <div className="badge badge-green" style={{ display: 'block', textAlign: 'center', marginTop: 'auto' }}>
                      ✓ Already Registered
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRegisterClick(event)}
                      className="btn btn-success btn-block"
                      style={{ marginTop: 'auto' }}
                    >
                      ✨ Register Now
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showChatbot && (
        <Chatbot
          onClose={() => {
            setShowChatbot(false);
            fetchData();
          }}
          events={events}
        />
      )}
      </div>
    </div>
  );
}
