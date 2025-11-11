import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import QRCode from 'qrcode';

export default function Chatbot({ onClose, events = [] }) {
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: 'Hello! I can help you register for events. What would you like to do?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [registeredEvent, setRegisteredEvent] = useState(null);
  const messagesEndRef = useRef(null);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    fetchUserInfo();
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
        id: user.id, // Profile ID (same as auth.users id)
        profile_id: profile?.id || user.id, // Explicit profile ID
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

  async function sendMessage(userMessage) {
    if (!userMessage.trim()) return;

    // Add user message to chat
    const newUserMessage = {
      type: 'user',
      text: userMessage
    };
    setMessages(prev => [...prev, newUserMessage]);
    setInput('');
    setLoading(true);

    try {
      // Get current user to ensure we have the latest ID
      const { data: { user } } = await supabase.auth.getUser();
      
      // Prepare context for chatbot with profile ID
      const context = {
        userInfo: {
          ...userInfo,
          id: user?.id || userInfo?.id, // Profile ID from auth.users
          profile_id: user?.id || userInfo?.profile_id // Explicit profile ID
        },
        profileId: user?.id, // Direct profile ID field
        userId: user?.id, // User ID (same as profile ID)
        availableEvents: events.map(e => ({
          id: e.id,
          title: e.title,
          description: e.description
        })),
        userMessage: userMessage
      };

      // Send GET request to webhook with query parameters
      const webhookUrl = new URL('https://supasanjay.app.n8n.cloud/webhook/chatbot');
      webhookUrl.searchParams.append('message', userMessage);
      webhookUrl.searchParams.append('context', JSON.stringify(context));
      
      // Also send profile ID as a separate parameter for easy access
      if (user?.id) {
        webhookUrl.searchParams.append('profileId', user.id);
        webhookUrl.searchParams.append('userId', user.id);
      }

      // Log what we're sending to webhook
      console.log('Sending to webhook:', {
        url: webhookUrl.toString(),
        profileId: user?.id,
        context: context
      });

      const response = await fetch(webhookUrl.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Webhook error: ${response.status}`);
      }

      // Handle different response types
      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          data = { message: text, rawResponse: text };
        }
      }
      
      // Display the full webhook response
      console.log('Webhook response:', data);
      
      // Extract message from various possible fields
      let botResponse = data.message || data.response || data.text || data.answer || data.output || data.reply;
      
      // If no message field found, try to format the entire response
      if (!botResponse && typeof data === 'object') {
        // If it's an object, try to create a readable message
        if (Object.keys(data).length === 1 && typeof Object.values(data)[0] === 'string') {
          botResponse = Object.values(data)[0];
        } else {
          // Display the full response as formatted JSON
          botResponse = JSON.stringify(data, null, 2);
        }
      }
      
      // Fallback if still no response
      if (!botResponse) {
        botResponse = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      }
      
      // Check if chatbot wants to register for an event
      // Look for event ID in response
      const eventId = data.eventId || data.event_id || data.eventID;
      
      // Or try to parse event name from response
      const eventMatch = botResponse.match(/register.*event[:\s]+(.+)/i) || 
                        botResponse.match(/event[:\s]+(.+)/i) ||
                        botResponse.match(/register.*for[:\s]+(.+)/i);
      
      let foundEventId = eventId;
      if (!foundEventId && eventMatch) {
        foundEventId = findEventByName(eventMatch[1]);
      }
      
      // Check if response indicates registration intent
      const wantsToRegister = data.registerEvent || 
                             data.register || 
                             data.register_for_event ||
                             data.shouldRegister ||
                             botResponse.toLowerCase().includes('register') ||
                             botResponse.toLowerCase().includes('sign up');
      
      // If registration is requested, handle it
      if (foundEventId && wantsToRegister) {
        await handleEventRegistration(foundEventId, botResponse);
        return;
      }

      // Add bot response - display the webhook output
      // If the response is a JSON object, format it nicely
      let displayText = botResponse;
      if (typeof data === 'object' && !Array.isArray(data) && Object.keys(data).length > 1) {
        // Check if we should show formatted JSON
        try {
          const formatted = JSON.stringify(data, null, 2);
          // Only show formatted JSON if it's not too long (less than 1000 chars)
          if (formatted.length < 1000) {
            displayText = formatted;
          } else {
            // For long responses, show the message field if available, otherwise show summary
            displayText = botResponse || `Received response with ${Object.keys(data).length} fields`;
          }
        } catch (e) {
          displayText = botResponse;
        }
      }
      
      setMessages(prev => [...prev, {
        type: 'bot',
        text: displayText
      }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        type: 'bot',
        text: 'Sorry, I encountered an error. Please try again or use the form to register.'
      }]);
    } finally {
      setLoading(false);
    }
  }

  function findEventByName(eventName) {
    const event = events.find(e => 
      e.title.toLowerCase().includes(eventName.toLowerCase()) ||
      eventName.toLowerCase().includes(e.title.toLowerCase())
    );
    return event?.id;
  }

  async function handleEventRegistration(eventId, chatbotMessage) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessages(prev => [...prev, {
          type: 'bot',
          text: 'You need to be logged in to register. Please log in first.'
        }]);
        return;
      }

      // Check if already registered
      const { data: existing } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        setMessages(prev => [...prev, {
          type: 'bot',
          text: 'You are already registered for this event!'
        }]);
        return;
      }

      // Check if user has required details
      if (!userInfo?.registration_number || !userInfo?.phone) {
        setMessages(prev => [...prev, {
          type: 'bot',
          text: 'I need some information to complete your registration. Please provide your registration number and phone number.'
        }]);
        return;
      }

      // Generate QR code data
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
          additional_details: { registered_via: 'chatbot', chatbot_message: chatbotMessage }
        }]);

      if (error) throw error;

      // Find event details
      const event = events.find(e => e.id === eventId);
      setRegisteredEvent(event);
      setQrCodeUrl(qrCodeDataUrl);

      setMessages(prev => [...prev, {
        type: 'bot',
        text: `Great! I've registered you for "${event?.title || 'the event'}". Your QR code is ready!`
      }]);
    } catch (error) {
      console.error('Error registering for event:', error);
      setMessages(prev => [...prev, {
        type: 'bot',
        text: 'Sorry, I encountered an error while registering. Please try using the registration form.'
      }]);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (input.trim() && !loading) {
      sendMessage(input);
    }
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '400px',
      height: '600px',
      background: '#fff',
      borderRadius: '12px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        background: '#2563eb',
        color: '#fff',
        borderRadius: '12px 12px 0 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px' }}>Event Registration Bot</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.9 }}>Ask me about events!</p>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: '#fff',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            cursor: 'pointer',
            fontSize: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        background: '#f9fafb'
      }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              marginBottom: '12px',
              display: 'flex',
              justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div style={{
              maxWidth: '75%',
              padding: '10px 14px',
              borderRadius: '18px',
              background: msg.type === 'user' ? '#2563eb' : '#e5e7eb',
              color: msg.type === 'user' ? '#fff' : '#111',
              fontSize: '14px',
              lineHeight: '1.4',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: msg.type === 'bot' && msg.text.includes('{') ? 'monospace' : 'inherit'
            }}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '12px' }}>
            <div style={{
              padding: '10px 14px',
              borderRadius: '18px',
              background: '#e5e7eb',
              color: '#111',
              fontSize: '14px'
            }}>
              Typing...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} style={{
        padding: '16px',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        gap: '8px'
      }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={loading}
          style={{
            flex: 1,
            padding: '10px 14px',
            border: '1px solid #e5e7eb',
            borderRadius: '20px',
            fontSize: '14px',
            outline: 'none'
          }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            padding: '10px 20px',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '20px',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            opacity: loading || !input.trim() ? 0.5 : 1
          }}
        >
          Send
        </button>
      </form>

      {/* QR Code Modal */}
      {qrCodeUrl && registeredEvent && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '12px',
          zIndex: 2000
        }}>
          <div style={{
            background: '#fff',
            padding: '24px',
            borderRadius: '12px',
            textAlign: 'center',
            maxWidth: '90%'
          }}>
            <h3 style={{ marginTop: 0 }}>Registration Successful!</h3>
            <p style={{ marginBottom: '16px', color: '#64748b' }}>
              {registeredEvent.title}
            </p>
            <img
              src={qrCodeUrl}
              alt="QR Code"
              style={{
                maxWidth: '250px',
                marginBottom: '16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                padding: '8px'
              }}
            />
            <button
              onClick={() => {
                setQrCodeUrl(null);
                setRegisteredEvent(null);
              }}
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
    </div>
  );
}

