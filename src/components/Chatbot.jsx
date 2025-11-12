import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import QRCode from 'qrcode';
import { generateGeminiResponse } from '../lib/gemini';

export default function Chatbot({ onClose, events = [] }) {
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: 'Hello! I can help you register for events. Here are the available events:'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [registeredEvent, setRegisteredEvent] = useState(null);
  const messagesEndRef = useRef(null);
  const [userInfo, setUserInfo] = useState(null);
  const [pendingField, setPendingField] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(null);

  const FIELD_LABELS = {
    registration_number: 'registration number',
    phone: 'phone number',
    name: 'full name',
    email: 'email address'
  };

  const FIELD_PROMPTS = {
    registration_number: 'Please provide your registration number.',
    phone: 'Thanks! Now please provide your phone number.',
    name: 'What is your full name?',
    email: 'Finally, what is your email address?'
  };

  function fieldFromString(str) {
    if (!str) return null;
    const lower = str.toLowerCase();
    if (lower.includes('registration')) return 'registration_number';
    if (lower.includes('phone')) return 'phone';
    if (lower.includes('name')) return 'name';
    if (lower.includes('email')) return 'email';
    return null;
  }

  function findNextMissing(info = {}) {
    const missing = [];
    if (!info.registration_number) missing.push('registration_number');
    if (!info.phone) missing.push('phone');
    if (!info.name) missing.push('name');
    if (!info.email) missing.push('email');
    return missing;
  }

  function promptForField(field) {
    return FIELD_PROMPTS[field] || `Please provide your ${FIELD_LABELS[field] || 'details'}.`;
  }

  useEffect(() => {
    fetchUserInfo();
  }, []);

  useEffect(() => {
    postEventsList();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function fetchUserInfo() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const { data: userDetails } = await supabase
        .from('user_details')
        .select('*')
        .eq('id', user.id)
        .single();

      setUserInfo({
        id: user.id,
        profile_id: profile?.id || user.id,
        email: profile?.email || user.email,
        name: profile?.full_name,
        registration_number: userDetails?.registration_number,
        phone: userDetails?.phone_number,
        role: profile?.role || 'user'
      });
    } catch (err) {
      console.error('Error fetching user info:', err);
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  function postEventsList(prefixText) {
    const eventChips = events.map(e => ({ id: e.id, title: e.title }));
    setMessages(prev => [
      ...prev,
      ...(prefixText ? [{ type: 'bot', text: prefixText }] : []),
      {
        type: 'bot',
        text: 'Tap an event below to register:',
        events: eventChips
      }
    ]);
  }

  function handleSelectEvent(eventId, infoOverride) {
    setSelectedEventId(eventId);
    const event = events.find(e => e.id === eventId);
    setMessages(prev => [...prev, { type: 'bot', text: `You selected: ${event?.title || 'event'}.` }]);
    const info = infoOverride || userInfo || {};
    const missing = findNextMissing(info);
    if (missing.length) {
      const nextField = missing[0];
      setPendingField(nextField);
      setMessages(prev => [...prev, { type: 'bot', text: promptForField(nextField) }]);
    } else {
      void handleEventRegistration(eventId, 'Registered via chatbot event selection', info);
    }
  }

  async function capturePendingField(value) {
    const trimmed = value.trim();
    if (!trimmed) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessages(prev => [...prev, { type: 'bot', text: 'Please sign in to continue.' }]);
      return;
    }

    let updatedInfo = { ...(userInfo || {}), id: user.id };

    if (pendingField === 'registration_number') {
      await supabase.from('user_details').upsert({ id: user.id, registration_number: trimmed });
      updatedInfo = { ...updatedInfo, registration_number: trimmed };
      setUserInfo(updatedInfo);
      const queue = findNextMissing(updatedInfo);
      if (queue.length) {
        const next = queue[0];
        setPendingField(next);
        setMessages(prev => [...prev, { type: 'bot', text: promptForField(next) }]);
      } else if (selectedEventId) {
        setPendingField(null);
        await handleEventRegistration(selectedEventId, 'Registered via chatbot after collecting details', updatedInfo);
      } else {
        setPendingField(null);
        setMessages(prev => [...prev, { type: 'bot', text: 'Thanks! You can pick an event anytime.' }]);
        postEventsList();
      }
      return;
    }

    if (pendingField === 'phone') {
      await supabase.from('user_details').upsert({ id: user.id, phone_number: trimmed });
      updatedInfo = { ...updatedInfo, phone: trimmed };
      setUserInfo(updatedInfo);
      const queue = findNextMissing(updatedInfo);
      if (queue.length) {
        const next = queue[0];
        setPendingField(next);
        setMessages(prev => [...prev, { type: 'bot', text: promptForField(next) }]);
      } else if (selectedEventId) {
        setPendingField(null);
        await handleEventRegistration(selectedEventId, 'Registered via chatbot after collecting details', updatedInfo);
      } else {
        setPendingField(null);
        setMessages(prev => [...prev, { type: 'bot', text: 'Great! Now choose an event to register.' }]);
        postEventsList();
      }
      return;
    }

    if (pendingField === 'name') {
      await supabase.from('profiles').update({ full_name: trimmed }).eq('id', user.id);
      updatedInfo = { ...updatedInfo, name: trimmed };
      setUserInfo(updatedInfo);
      const queue = findNextMissing(updatedInfo);
      if (queue.length) {
        const next = queue[0];
        setPendingField(next);
        setMessages(prev => [...prev, { type: 'bot', text: promptForField(next) }]);
      } else if (selectedEventId) {
        setPendingField(null);
        await handleEventRegistration(selectedEventId, 'Registered via chatbot after collecting details', updatedInfo);
      } else {
        setPendingField(null);
        setMessages(prev => [...prev, { type: 'bot', text: 'Nice to meet you! Ready to pick an event?' }]);
        postEventsList();
      }
      return;
    }

    if (pendingField === 'email') {
      await supabase.from('profiles').update({ email: trimmed }).eq('id', user.id);
      updatedInfo = { ...updatedInfo, email: trimmed };
      setUserInfo(updatedInfo);
      const queue = findNextMissing(updatedInfo);
      if (queue.length) {
        const next = queue[0];
        setPendingField(next);
        setMessages(prev => [...prev, { type: 'bot', text: promptForField(next) }]);
      } else if (selectedEventId) {
        setPendingField(null);
        await handleEventRegistration(selectedEventId, 'Registered via chatbot after collecting details', updatedInfo);
      } else {
        setPendingField(null);
        setMessages(prev => [...prev, { type: 'bot', text: 'Great! You can now choose an event to register.' }]);
        postEventsList();
      }
      return;
    }
  }

  async function sendMessage(userMessage) {
    if (!userMessage.trim()) return;

    const newUserMessage = { type: 'user', text: userMessage };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setInput('');

    if (pendingField) {
      setLoading(true);
      try {
        await capturePendingField(userMessage);
      } finally {
        setLoading(false);
      }
      return;
    }

    const lower = userMessage.toLowerCase();
    if (lower === 'list' || lower === 'events' || lower.includes('show events')) {
      postEventsList('Here are the available events:');
      return;
    }

    const matched = events.find(e => e.title.toLowerCase().includes(lower));
    if (matched) {
      handleSelectEvent(matched.id);
      return;
    }

    setLoading(true);
    try {
      const context = {
        userInfo: { ...(userInfo || {}) },
        availableEvents: events.map(e => ({ id: e.id, title: e.title, description: e.description, support_contact: e.support_contact })),
        userMessage
      };
      const geminiResult = await generateGeminiResponse({ messages: updatedMessages, context });
      if (geminiResult?.message) {
        setMessages(prev => [...prev, { type: 'bot', text: geminiResult.message }]);
      } else {
        setMessages(prev => [...prev, { type: 'bot', text: 'You can type “list” to see available events, or click one above.' }]);
      }

      const missingFromAi = (geminiResult?.missingFields || [])
        .map(fieldFromString)
        .filter(Boolean);
      if (!pendingField && missingFromAi.length) {
        const info = userInfo || {};
        const queue = findNextMissing(info);
        const field = queue.length ? queue[0] : missingFromAi[0];
        if (field) {
          setPendingField(field);
          setMessages(prev => [...prev, { type: 'bot', text: promptForField(field) }]);
          return;
        }
      }

      const potentialEventId = geminiResult?.eventId || (geminiResult?.eventName ? findEventByName(geminiResult.eventName) : null);
      if (geminiResult?.registerEvent && potentialEventId) {
        handleSelectEvent(potentialEventId);
      }
    } catch (err) {
      console.error('Gemini error', err);
      setMessages(prev => [...prev, { type: 'bot', text: 'Sorry, I did not get that. Type “list” to see available events.' }]);
    } finally {
      setLoading(false);
    }
  }

  function findEventByName(eventIdentifier) {
    if (!eventIdentifier) return null;
    const lower = eventIdentifier.toLowerCase();
    const event = events.find(e =>
      e.id === eventIdentifier ||
      e.title.toLowerCase() === lower ||
      e.title.toLowerCase().includes(lower) ||
      lower.includes(e.title.toLowerCase())
    );
    return event?.id;
  }

  async function handleEventRegistration(eventId, chatbotMessage, latestInfo) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessages(prev => [...prev, { type: 'bot', text: 'You need to be logged in to register. Please log in first.' }]);
        return;
      }

      const { data: existing } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        setMessages(prev => [...prev, { type: 'bot', text: 'You are already registered for this event!' }]);
        return;
      }

      const info = latestInfo || userInfo || {};
      if (!info.registration_number || !info.phone || !info.name || !info.email) {
        const queue = findNextMissing(info);
        const next = queue[0];
        setPendingField(next);
        setMessages(prev => [...prev, { type: 'bot', text: promptForField(next) }]);
        return;
      }

      const qrData = JSON.stringify({ event_id: eventId, user_id: user.id, timestamp: Date.now() });
      const qrCodeDataUrl = await QRCode.toDataURL(qrData);

      const additionalDetails = {
        registered_via: 'chatbot',
        chatbot_message: chatbotMessage,
        qr_code_image: qrCodeDataUrl
      };

      const { error } = await supabase
        .from('event_registrations')
        .insert([{ event_id: eventId, user_id: user.id, qr_code: qrData, additional_details: additionalDetails }]);

      if (error) throw error;

      const event = events.find(e => e.id === eventId);
      setRegisteredEvent(event);
      setQrCodeUrl(qrCodeDataUrl);
      setSelectedEventId(null);

      setMessages(prev => [...prev, { type: 'bot', text: `Great! I've registered you for "${event?.title || 'the event'}". Your QR code is ready!` }]);
    } catch (error) {
      console.error('Error registering for event:', error);
      setMessages(prev => [...prev, { type: 'bot', text: 'Sorry, I encountered an error while registering. Please try again.' }]);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (input.trim() && !loading) {
      sendMessage(input.trim());
    }
  }

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', width: '400px', height: '600px', background: '#fff', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', zIndex: 1000 }}>
      <div style={{ padding: '16px', background: '#2563eb', color: '#fff', borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px' }}>Event Registration Bot</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.9 }}>Ask me about events!</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Close chatbot">×</button>
          <button onClick={onClose} style={{ background: '#1d4ed8', border: 'none', color: '#fff', borderRadius: '16px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px' }}>Hide</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: '#f9fafb' }}>
        {messages.map((msg, idx) => (
          <div key={`${idx}-${msg.text?.slice?.(0, 10) || 'row'}`} style={{ marginBottom: '12px', display: 'flex', justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{ maxWidth: '75%', padding: '10px 14px', borderRadius: '18px', background: msg.type === 'user' ? '#2563eb' : '#e5e7eb', color: msg.type === 'user' ? '#fff' : '#111', fontSize: '14px', lineHeight: '1.4', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: msg.type === 'bot' && msg.text?.includes?.('{') ? 'monospace' : 'inherit' }}>
              {msg.text}
            </div>
          </div>
        ))}

        {/* Render event quick actions if present on last bot message */}
        {messages[messages.length - 1]?.events && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: -4 }}>
            {messages[messages.length - 1].events.map((evt) => (
              <button
                key={evt.id}
                onClick={() => handleSelectEvent(evt.id)}
                style={{ padding: '8px 12px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '999px', cursor: 'pointer', fontSize: '13px' }}
              >
                {evt.title}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '12px' }}>
            <div style={{ padding: '10px 14px', borderRadius: '18px', background: '#e5e7eb', color: '#111', fontSize: '14px' }}>Typing...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '16px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '8px' }}>
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your message... (or 'list')" disabled={loading} style={{ flex: 1, padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '20px', fontSize: '14px', outline: 'none' }} />
        <button type="submit" disabled={loading || !input.trim()} style={{ padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '20px', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', opacity: loading || !input.trim() ? 0.5 : 1 }}>Send</button>
      </form>
      <div style={{ padding: '0 16px 16px 16px' }}>
        <button onClick={onClose} style={{ width: '100%', padding: '10px', background: '#1e293b', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          Close Chat
        </button>
      </div>

      {qrCodeUrl && registeredEvent && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', zIndex: 2000 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', textAlign: 'center', maxWidth: '90%' }}>
            <h3 style={{ marginTop: 0 }}>Registration Successful!</h3>
            <p style={{ marginBottom: '16px', color: '#64748b' }}>{registeredEvent.title}</p>
            <img src={qrCodeUrl} alt="QR Code" style={{ maxWidth: '250px', marginBottom: '16px', border: '2px solid #e5e7eb', borderRadius: '8px', padding: '8px' }} />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => { const link = document.createElement('a'); link.href = qrCodeUrl; link.download = `${registeredEvent.title || 'event'}-qr.png`; link.click(); }} style={{ padding: '10px 20px', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Download QR</button>
              <button onClick={() => { setQrCodeUrl(null); setRegisteredEvent(null); }} style={{ padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

