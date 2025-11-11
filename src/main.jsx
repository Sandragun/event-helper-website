import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

console.log('🚀 Starting app...');

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found!');
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
  console.log('✅ App rendered successfully');
} catch (error) {
  console.error('❌ Failed to render app:', error);
  document.body.innerHTML = `
    <div style="padding: 40px; text-align: center; font-family: system-ui;">
      <h1>Failed to Load App</h1>
      <p style="color: #ef4444;">${error.message}</p>
      <pre style="text-align: left; background: #f9fafb; padding: 20px; border-radius: 8px; margin-top: 20px;">
        ${error.stack}
      </pre>
    </div>
  `;
}
