import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import CertificateEditor from './CertificateEditor';
import CertificatePreview from './CertificatePreview';
import TemplateUploader from './TemplateUploader';

export function CertificateManager() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [templateFile, setTemplateFile] = useState(null);
  const [textPosition, setTextPosition] = useState({ x: 400, y: 300 });
  const [textStyle, setTextStyle] = useState({
    fontSize: 36,
    fontFamily: 'Playfair Display, serif',
    color: '#000000',
    textAlign: 'center',
    fontWeight: '400',
    letterSpacing: 0,
    rotation: 0,
    opacity: 100,
    textShadow: false
  });
  const [certificateBlobs, setCertificateBlobs] = useState([]);
  const [certificateNames, setCertificateNames] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('setup');

  // Fetch events on component mount
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

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching events:', err);
      alert('Error fetching events: ' + err.message);
    }
  }

  const fetchParticipants = useCallback(async () => {
    if (!selectedEvent) return;

    try {
      // Step 1: Get all event registrations with attendance marked
      const { data: registrations, error: regError } = await supabase
        .from('event_registrations')
        .select('id, user_id, attendance_marked')
        .eq('event_id', selectedEvent.id)
        .eq('attendance_marked', true)
        .order('registered_at', { ascending: false });

      if (regError) throw regError;

      if (!registrations || registrations.length === 0) {
        setParticipants([]);
        return;
      }

      // Step 2: Get user IDs and fetch profiles
      const userIds = registrations.map(reg => reg.user_id);
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      if (profileError) throw profileError;

      // Step 3: Combine the data
      const transformedParticipants = registrations.map(reg => {
        const profile = profiles?.find(p => p.id === reg.user_id) || {};
        return {
          id: reg.user_id,
          name: profile.full_name || 'Unnamed Participant',
          email: profile.email || '',
          registrationId: reg.id
        };
      });

      setParticipants(transformedParticipants);
    } catch (err) {
      console.error('Error fetching participants:', err);
      alert('Error fetching participants: ' + err.message);
    }
  }, [selectedEvent]);

  useEffect(() => {
    if (selectedEvent) {
      fetchParticipants();
    }
  }, [selectedEvent, fetchParticipants]);

  async function generateCertificates() {
    if (!templateFile || participants.length === 0) {
      alert('Please select a template and ensure there are participants');
      return;
    }

    setGenerating(true);
    try {
      const blobs = [];
      const names = [];

      for (const participant of participants) {
        const blob = await generateCertificate(participant.name);
        blobs.push(blob);
        names.push(participant.name);
      }

      setCertificateBlobs(blobs);
      setCertificateNames(names);
      setActiveTab('preview');
    } catch (err) {
      console.error('Error generating certificates:', err);
      alert('Error generating certificates: ' + err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function generateCertificate(participantName) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        // Draw template
        ctx.drawImage(img, 0, 0);

        // Apply transformations
        ctx.save();
        ctx.translate(textPosition.x, textPosition.y);
        ctx.rotate(((textStyle.rotation || 0) * Math.PI) / 180);

        // Apply text styles
        ctx.font = `${textStyle.fontWeight || '400'} ${textStyle.fontSize}px ${textStyle.fontFamily}`;
        ctx.fillStyle = textStyle.color;
        ctx.textAlign = textStyle.textAlign;
        ctx.globalAlpha = (textStyle.opacity || 100) / 100;

        // Apply text shadow if enabled
        if (textStyle.textShadow) {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
        }

        // Apply letter spacing
        if ((textStyle.letterSpacing || 0) !== 0) {
          const chars = participantName.split('');
          let xOffset = 0;
          const letterSpacing = textStyle.letterSpacing || 0;

          if (textStyle.textAlign === 'center') {
            const totalWidth = ctx.measureText(participantName).width + (letterSpacing * (chars.length - 1));
            xOffset = -totalWidth / 2;
          } else if (textStyle.textAlign === 'right') {
            const totalWidth = ctx.measureText(participantName).width + (letterSpacing * (chars.length - 1));
            xOffset = -totalWidth;
          }

          chars.forEach((char) => {
            ctx.fillText(char, xOffset, 0);
            xOffset += ctx.measureText(char).width + letterSpacing;
          });
        } else {
          ctx.fillText(participantName, 0, 0);
        }

        ctx.restore();

        // Convert to blob
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create certificate blob'));
          }
        }, 'image/png');
      };
      img.onerror = () => reject(new Error('Failed to load template image'));
      img.src = URL.createObjectURL(templateFile);
    });
  }

  function downloadCertificates() {
    if (certificateBlobs.length === 0) return;

    certificateBlobs.forEach((blob, index) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${certificateNames[index]}_Certificate.png`;
      link.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <div className="card" style={{ marginBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ fontSize: '32px' }}>🎖️</div>
        <div>
          <h2 style={{ margin: 0, marginBottom: '4px', fontSize: '20px', fontWeight: '700' }}>Certificate Manager</h2>
          <p style={{ margin: 0, color: '#a0a0b0', fontSize: '13px' }}>Create and generate certificates for event participants</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-buttons" style={{ marginBottom: '24px' }}>
        <button
          className={`tab-btn ${activeTab === 'setup' ? 'active' : ''}`}
          onClick={() => setActiveTab('setup')}
        >
          ⚙️ Setup
        </button>
        <button
          className={`tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
          onClick={() => setActiveTab('preview')}
        >
          👀 Preview & Download
        </button>
      </div>

      {/* Setup Tab */}
      {activeTab === 'setup' && (
        <div style={{ display: 'grid', gap: '24px' }}>
          {/* Event Selection */}
          <div style={{ display: 'grid', gap: '12px' }}>
            <label style={{ fontSize: '14px', fontWeight: '600', color: '#c0c0d0' }}>
              📅 Select Event
            </label>
            <select
              value={selectedEvent?.id || ''}
              onChange={(e) => {
                const event = events.find(ev => ev.id === e.target.value);
                setSelectedEvent(event || null);
              }}
              style={{
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#e0e0e0',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              <option value="">-- Select an event --</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>

            {selectedEvent && (
              <div className="alert alert-info" style={{ marginTop: '12px' }}>
                ✓ Selected: <strong>{selectedEvent.title}</strong> ({participants.length} attended participants)
              </div>
            )}
          </div>

          {/* Template Upload */}
          <div>
            <label style={{ fontSize: '14px', fontWeight: '600', color: '#c0c0d0', display: 'block', marginBottom: '12px' }}>
              📄 Certificate Template
            </label>
            <TemplateUploader onTemplateSelected={setTemplateFile} />
          </div>

          {/* Certificate Editor */}
          {templateFile && (
            <div>
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#c0c0d0', display: 'block', marginBottom: '12px' }}>
                ✏️ Position & Style
              </label>
              <CertificateEditor
                templateFile={templateFile}
                sampleName="Sample Name"
                onPositionChange={setTextPosition}
                onStyleChange={setTextStyle}
              />
            </div>
          )}

          {/* Generate Button */}
          {selectedEvent && templateFile && participants.length > 0 && (
            <button
              onClick={generateCertificates}
              disabled={generating}
              className="btn btn-success"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '16px',
                fontWeight: '600',
                marginTop: '16px'
              }}
            >
              {generating ? '⏳ Generating...' : '🚀 Generate Certificates'}
            </button>
          )}

          {!selectedEvent && (
            <div className="alert alert-info">
              ℹ️ Select an event to see its attended participants
            </div>
          )}

          {selectedEvent && participants.length === 0 && (
            <div className="alert alert-error">
              ❌ No participants with attendance marked for this event yet
            </div>
          )}
        </div>
      )}

      {/* Preview Tab */}
      {activeTab === 'preview' && (
        <div style={{ display: 'grid', gap: '24px' }}>
          {certificateBlobs.length > 0 ? (
            <>
              <CertificatePreview
                certificateBlobs={certificateBlobs}
                certificateNames={certificateNames}
              />
              <button
                onClick={downloadCertificates}
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: '16px', fontWeight: '600' }}
              >
                ⬇️ Download All Certificates
              </button>
            </>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
              <h3 style={{ marginBottom: '8px' }}>No Certificates Generated</h3>
              <p style={{ color: '#a0a0b0', margin: 0 }}>Generate certificates using the Setup tab</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CertificateManager;
