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
      <div className="events-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .events-container {
          min-height: 100vh;
          background: linear-gradient(to bottom, #0f0f1e, #1a1a2e);
          padding: 40px 20px;
          position: relative;
          overflow: hidden;
        }

        .background-gradients {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 0;
          overflow: hidden;
          pointer-events: none;
        }

        .gradient-blob-1 {
          position: absolute;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%);
          top: -100px;
          right: -100px;
          animation: float 20s infinite ease-in-out;
        }

        .gradient-blob-2 {
          position: absolute;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%);
          bottom: -50px;
          left: -50px;
          animation: float 15s infinite ease-in-out reverse;
        }

        .gradient-blob-3 {
          position: absolute;
          width: 350px;
          height: 350px;
          background: radial-gradient(circle, rgba(236, 72, 153, 0.1) 0%, transparent 70%);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: float 18s infinite ease-in-out;
        }

        .events-header {
          max-width: 1200px;
          margin: 0 auto 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
          position: relative;
          z-index: 1;
        }

        .events-title {
          font-size: 36px;
          font-weight: 800;
          background: linear-gradient(135deg, #fff 0%, #a78bfa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }

        .events-subtitle {
          margin: 0;
          color: #a0a0b0;
          font-size: 16px;
        }

        .button-group {
          display: flex;
          gap: 12px;
        }

        .glass-btn {
          padding: 12px 24px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: #fff;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.3s ease;
          display: inline-block;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .glass-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(139, 92, 246, 0.5);
          transform: translateY(-2px);
        }

        .gradient-btn {
          padding: 12px 24px;
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
          border: none;
          border-radius: 12px;
          color: #fff;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.3s ease;
          display: inline-block;
          box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4);
        }

        .gradient-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(139, 92, 246, 0.6);
        }

        .events-grid {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
          position: relative;
          z-index: 1;
        }

        .event-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0;
        }

        .event-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 40px rgba(139, 92, 246, 0.3);
          border-color: rgba(139, 92, 246, 0.4);
        }

        .event-image-container {
          position: relative;
          width: 100%;
          height: 200px;
          overflow: hidden;
        }

        .event-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }

        .event-card:hover .event-image {
          transform: scale(1.05);
        }

        .event-image-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(to bottom, transparent 0%, rgba(15, 15, 30, 0.8) 100%);
        }

        .event-placeholder {
          width: 100%;
          height: 200px;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 64px;
          opacity: 0.5;
        }

        .event-content {
          padding: 24px;
        }

        .event-title {
          margin: 0 0 12px 0;
          font-size: 20px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.3px;
        }

        .event-description {
          color: #a0a0b0;
          margin-bottom: 16px;
          font-size: 14px;
          line-height: 1.6;
          min-height: 60px;
        }

        .event-contact {
          margin-bottom: 20px;
          padding: 14px;
          background: rgba(139, 92, 246, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 12px;
          font-size: 13px;
        }

        .event-contact-label {
          color: #a78bfa;
          margin-right: 8px;
          font-weight: 600;
        }

        .event-contact-text {
          color: #e0e0e0;
        }

        .register-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
          border: none;
          border-radius: 12px;
          color: #fff;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(139, 92, 246, 0.3);
        }

        .register-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(139, 92, 246, 0.6);
        }

        .button-sparkle {
          display: inline-block;
          animation: sparkle 2s infinite;
        }

        .empty-state {
          max-width: 500px;
          margin: 100px auto;
          padding: 60px 40px;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          text-align: center;
          position: relative;
          z-index: 1;
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 24px;
          animation: bounce 2s infinite;
        }

        .empty-title {
          margin: 0 0 12px 0;
          font-size: 24px;
          font-weight: 700;
          color: #fff;
        }

        .empty-text {
          color: #a0a0b0;
          margin: 0;
          font-size: 16px;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          position: relative;
          z-index: 1;
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 3px solid rgba(139, 92, 246, 0.2);
          border-top: 3px solid #8b5cf6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .loading-text {
          margin-top: 20px;
          color: #a0a0b0;
          font-size: 16px;
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

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes sparkle {
          0%, 100% {
            transform: scale(1) rotate(0deg);
          }
          50% {
            transform: scale(1.2) rotate(180deg);
          }
        }

        @media (max-width: 768px) {
          .events-header {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .events-title {
            font-size: 28px;
          }

          .events-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="events-container">
        {/* Animated Background */}
        <div className="background-gradients">
          <div className="gradient-blob-1"></div>
          <div className="gradient-blob-2"></div>
          <div className="gradient-blob-3"></div>
        </div>

        {/* Header */}
        <div className="events-header">
          <div>
            <h1 className="events-title">🎪 Upcoming Events</h1>
            <p className="events-subtitle">Discover and register for exciting events</p>
          </div>
          <div className="button-group">
            <Link to="/auth" className="glass-btn">
              🔑 Sign In
            </Link>
            <Link to="/auth" className="gradient-btn">
              📝 Register
            </Link>
          </div>
        </div>

        {/* Content */}
        {events.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <h3 className="empty-title">No Events Available</h3>
            <p className="empty-text">Check back soon for upcoming events!</p>
          </div>
        ) : (
          <div className="events-grid">
            {events.map((event, index) => (
              <div 
                key={event.id} 
                className="event-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {event.poster_url ? (
                  <div className="event-image-container">
                    <img
                      src={event.poster_url}
                      alt={event.title}
                      className="event-image"
                    />
                    <div className="event-image-overlay"></div>
                  </div>
                ) : (
                  <div className="event-placeholder">
                    🎪
                  </div>
                )}
                
                <div className="event-content">
                  <h3 className="event-title">{event.title}</h3>
                  <p className="event-description">{event.description}</p>
                  
                  {event.support_contact && (
                    <div className="event-contact">
                      <strong className="event-contact-label">📞 Contact:</strong>
                      <span className="event-contact-text">{event.support_contact}</span>
                    </div>
                  )}
                  
                  <Link to="/auth" className="register-button">
                    <span className="button-sparkle">✨</span>
                    Register Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}