import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase } from '../supabaseClient';

export default function QRScanner({ onClose }) {
  const scannerRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [participantInfo, setParticipantInfo] = useState(null);
  const [error, setError] = useState(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    startScanning();
    return () => {
      stopScanning();
    };
  }, []);

  async function startScanning() {
    try {
      setScanning(true);
      setError(null);
      const html5QrCode = new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        onScanSuccess,
        onScanFailure
      );
    } catch (err) {
      console.error('Error starting scanner:', err);
      setError('Failed to start camera. Please check permissions.');
      setScanning(false);
    }
  }

  async function stopScanning() {
    try {
      if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null;
      }
    } catch (err) {
      console.error('Error stopping scanner:', err);
    }
    setScanning(false);
  }

  async function onScanSuccess(decodedText) {
    try {
      setScannedData(decodedText);
      await stopScanning();

      // Parse QR code data
      const qrData = JSON.parse(decodedText);
      
      // Fetch registration details
      const { data: registration, error: regError } = await supabase
        .from('event_registrations')
        .select(`
          *,
          events (*),
          user_id
        `)
        .eq('qr_code', decodedText)
        .single();

      if (regError) throw regError;

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', registration.user_id)
        .single();

      if (profileError) throw profileError;

      // Fetch user details
      const { data: userDetails, error: detailsError } = await supabase
        .from('user_details')
        .select('*')
        .eq('id', registration.user_id)
        .single();

      if (detailsError && detailsError.code !== 'PGRST116') throw detailsError;

      setParticipantInfo({
        registration,
        profile,
        userDetails: userDetails || {}
      });
    } catch (err) {
      console.error('Error processing QR code:', err);
      setError('Invalid QR code or registration not found: ' + err.message);
      setTimeout(() => {
        setError(null);
        setScannedData(null);
        startScanning();
      }, 3000);
    }
  }

  function onScanFailure(error) {
    // Ignore scan failures - they happen frequently
  }

  async function markAttendance() {
    try {
      const { error } = await supabase
        .from('event_registrations')
        .update({
          attendance_marked: true,
          attendance_marked_at: new Date().toISOString()
        })
        .eq('id', participantInfo.registration.id);

      if (error) throw error;

      alert('Attendance marked successfully!');
      setParticipantInfo(null);
      setScannedData(null);
      startScanning();
    } catch (err) {
      alert('Error marking attendance: ' + err.message);
    }
  }

  function handleClose() {
    stopScanning();
    onClose();
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: '#000',
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        padding: '16px',
        background: '#1f2937',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h2 style={{ margin: 0, color: '#fff' }}>QR Code Scanner</h2>
        <button
          onClick={handleClose}
          style={{
            padding: '8px 16px',
            background: '#ef4444',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Close
        </button>
      </div>

      {error && (
        <div style={{
          padding: '16px',
          background: '#fee2e2',
          color: '#991b1b',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      {participantInfo ? (
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '24px',
          background: '#fff'
        }}>
          <h2 style={{ marginTop: 0 }}>Participant Information</h2>
          
          <div style={{
            background: '#f9fafb',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3 style={{ marginTop: 0 }}>Event Details</h3>
            <p><strong>Event:</strong> {participantInfo.registration.events?.title}</p>
            <p><strong>Description:</strong> {participantInfo.registration.events?.description}</p>
          </div>

          <div style={{
            background: '#f9fafb',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3 style={{ marginTop: 0 }}>Participant Details</h3>
            <p><strong>Name:</strong> {participantInfo.profile.full_name || 'N/A'}</p>
            <p><strong>Email:</strong> {participantInfo.profile.email || 'N/A'}</p>
            <p><strong>Registration Number:</strong> {participantInfo.userDetails.registration_number || 'N/A'}</p>
            <p><strong>Phone Number:</strong> {participantInfo.userDetails.phone_number || 'N/A'}</p>
            {participantInfo.registration.additional_details && (
              <p><strong>Additional Details:</strong> {JSON.stringify(participantInfo.registration.additional_details)}</p>
            )}
          </div>

          <div style={{
            background: participantInfo.registration.attendance_marked ? '#d1fae5' : '#fef3c7',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <p style={{ margin: 0, fontWeight: '500' }}>
              {participantInfo.registration.attendance_marked
                ? '✓ Attendance Already Marked'
                : 'Attendance Not Marked'}
            </p>
            {participantInfo.registration.attendance_marked_at && (
              <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#64748b' }}>
                Marked at: {new Date(participantInfo.registration.attendance_marked_at).toLocaleString()}
              </p>
            )}
          </div>

          {!participantInfo.registration.attendance_marked && (
            <button
              onClick={markAttendance}
              style={{
                width: '100%',
                padding: '12px',
                background: '#10b981',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500',
                marginBottom: '12px'
              }}
            >
              Mark Attendance
            </button>
          )}

          <button
            onClick={() => {
              setParticipantInfo(null);
              setScannedData(null);
              startScanning();
            }}
            style={{
              width: '100%',
              padding: '12px',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Scan Another QR Code
          </button>
        </div>
      ) : (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div
            id="qr-reader"
            style={{
              width: '100%',
              maxWidth: '500px',
              borderRadius: '8px',
              overflow: 'hidden'
            }}
          />
          <p style={{ color: '#fff', marginTop: '20px', textAlign: 'center' }}>
            Point your camera at a QR code to scan
          </p>
        </div>
      )}
    </div>
  );
}

