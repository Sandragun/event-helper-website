import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
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

      // Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // Fetch user details
      const { data: details } = await supabase
        .from('user_details')
        .select('*')
        .eq('id', user.id)
        .single();

      // Fetch approved events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      // Fetch user registrations
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

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: formData.full_name, email: formData.email })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Insert or update user details
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

      // Now register for the event
      await registerForEvent(selectedEvent.id);
    } catch (err) {
      alert('Error saving details: ' + err.message);
    }
  }

  async function registerForEvent(eventId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if already registered
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

      // Generate unique QR code
      const qrData = JSON.stringify({
        event_id: eventId,
        user_id: user.id,
        timestamp: Date.now()
      });

      // Generate QR code image
      const qrCodeDataUrl = await QRCode.toDataURL(qrData);

      // Insert registration
      const { error } = await supabase
        .from('event_registrations')
        .insert([{
          event_id: eventId,
          user_id: user.id,
          qr_code: qrData,
          additional_details: additionalDetails ? { notes: additionalDetails } : null
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

  async function signOut() {
    await supabase.auth.signOut();
    navigate('/auth');
  }

  if (loading) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0 }}>User Dashboard</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setShowChatbot(true)}
            style={{
              padding: '8px 16px',
              background: '#10b981',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>💬</span>
            <span>Chatbot</span>
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

      {showRegistrationForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            padding: '24px',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginTop: 0 }}>Complete Your Profile</h2>
            <p style={{ color: '#64748b', marginBottom: '20px' }}>
              Please provide your details to register for events. This information will be saved for future registrations.
            </p>
            <form onSubmit={handleFirstTimeRegistration}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Full Name *</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Registration Number *</label>
                <input
                  type="text"
                  value={formData.registration_number}
                  onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Phone Number *</label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                />
              </div>

              {selectedEvent && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Additional Details for {selectedEvent.title} (Optional)
                  </label>
                  <textarea
                    value={additionalDetails}
                    onChange={(e) => setAdditionalDetails(e.target.value)}
                    rows="3"
                    placeholder="Any additional information..."
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontFamily: 'inherit' }}
                  />
                </div>
              )}

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
                  Save & Register
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRegistrationForm(false);
                    setSelectedEvent(null);
                    setAdditionalDetails('');
                  }}
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
        </div>
      )}

      {qrCodeUrl && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            padding: '24px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h2 style={{ marginTop: 0 }}>Registration Successful!</h2>
            <p style={{ marginBottom: '20px' }}>Your QR code for attendance:</p>
            <img src={qrCodeUrl} alt="QR Code" style={{ maxWidth: '300px', marginBottom: '20px' }} />
            <button
              onClick={() => setQrCodeUrl(null)}
              style={{
                padding: '10px 20px',
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '32px' }}>
        <h2>My Registrations</h2>
        {registrations.length === 0 ? (
          <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', textAlign: 'center' }}>
            <p>You haven't registered for any events yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {registrations.map((reg) => (
              <div
                key={reg.id}
                style={{
                  background: '#fff',
                  padding: '24px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                <h3 style={{ marginTop: 0 }}>{reg.events?.title}</h3>
                <p style={{ color: '#64748b' }}>{reg.events?.description}</p>
                <div style={{ marginTop: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    background: reg.attendance_marked ? '#d1fae5' : '#fef3c7',
                    color: reg.attendance_marked ? '#065f46' : '#92400e'
                  }}>
                    {reg.attendance_marked ? '✓ Attendance Marked' : 'Pending Attendance'}
                  </span>
                  {reg.attendance_marked && reg.attendance_marked_at && (
                    <span style={{ fontSize: '14px', color: '#64748b' }}>
                      Marked at: {new Date(reg.attendance_marked_at).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2>Available Events</h2>
        {events.length === 0 ? (
          <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', textAlign: 'center' }}>
            <p>No events available at the moment.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {events.map((event) => {
              const isRegistered = registrations.some(reg => reg.event_id === event.id);
              return (
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
                    <h3 style={{ marginTop: 0 }}>{event.title}</h3>
                    <p style={{ color: '#64748b', marginBottom: '16px' }}>{event.description}</p>
                    {event.support_contact && (
                      <p style={{ marginBottom: '16px' }}>
                        <strong>Contact:</strong> {event.support_contact}
                      </p>
                    )}
                    {isRegistered ? (
                      <span style={{
                        padding: '8px 16px',
                        background: '#d1fae5',
                        color: '#065f46',
                        borderRadius: '6px',
                        display: 'inline-block'
                      }}>
                        ✓ Registered
                      </span>
                    ) : (
                      <button
                        onClick={() => handleRegisterClick(event)}
                        style={{
                          padding: '10px 20px',
                          background: '#2563eb',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        Register Now
                      </button>
                    )}
                  </div>
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
            fetchData(); // Refresh data after chatbot registration
          }}
          events={events}
        />
      )}
    </div>
  );
}
