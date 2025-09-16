import React, { createContext, useContext, useState } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';


const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const addToast = (message, type = 'success', duration = 4000) => {
    const id = Date.now();
    const newToast = {
      id,
      message,
      type, 
      duration,
      show: true
    };
    setToasts(prev => [...prev, newToast]);
    // Auto remove toast
    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const getToastVariant = (type) => {
    switch (type) {
      case 'success': return 'success';
      case 'error': return 'danger';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'success';
    }
  };

  const getToastIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '✅';
    }
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            show={toast.show}
            onClose={() => removeToast(toast.id)}
            bg={getToastVariant(toast.type)}
            className="toast-custom"
          >
            <Toast.Header>
              <span className="me-2">{getToastIcon(toast.type)}</span>
              <strong className="me-auto">
                {toast.type === 'success' && 'Success'}
                {toast.type === 'error' && 'Error'}
                {toast.type === 'warning' && 'Warning'}
                {toast.type === 'info' && 'Info'}
              </strong>
            </Toast.Header>
            <Toast.Body className={toast.type === 'success' ? 'text-white' : ''}>
              {toast.message}
            </Toast.Body>
          </Toast>
        ))}
      </ToastContainer>

      <style jsx>{`
        .toast-custom {
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          border: none;
          border-radius: 12px;
          overflow: hidden;
        }

        .toast-custom .toast-header {
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          font-weight: 600;
        }

        .toast-custom .toast-body {
          font-weight: 500;
        }
      `}</style>
    </ToastContext.Provider>
  );
};