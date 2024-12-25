import React, { useState, useEffect } from 'react';
import { AlertCircle, X, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const styles = {
  container: {
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    position: 'relative'
  },
  errorContainer: {
    position: 'relative',
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    border: '1px solid rgba(220, 38, 38, 0.2)',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '20px',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  messageContainer: {
    position: 'relative',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.2)',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '20px',
    color: '#fff'
  },
  closeButton: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    padding: '4px',
    cursor: 'pointer',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    marginLeft: 'auto'
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  loadingSpinner: {
    animation: 'spin 1s linear infinite'
  },
  '@keyframes spin': {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' }
  }
};

const AuthManager = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [lastRetryTimestamp, setLastRetryTimestamp] = useState(null);

  // Cookie utility
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };

  // Check auth status
  const checkAuthStatus = async () => {
    const loginState = getCookie('isLoggedIn');
    if (!loginState) return false;

    try {
      setIsLoading(true);
      const response = await fetch('/api/getCharacters');
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Failed to fetch characters');
      
      return data?.characters?.length > 0;
    } catch (err) {
      console.error('Auth check failed:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle auth errors
  const handleAuthError = async (error) => {
    const now = Date.now();
    const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 32000); // Exponential backoff

    if (lastRetryTimestamp && (now - lastRetryTimestamp) < retryDelay) {
      setError('Too many retry attempts. Please try again later.');
      return;
    }

    setRetryCount(prev => prev + 1);
    setLastRetryTimestamp(now);
    setError(`Authentication error: ${error.message}. Retrying...`);

    try {
      const isAuthenticated = await checkAuthStatus();
      if (!isAuthenticated) {
        throw new Error('Authentication failed after retry');
      }
      setError(null);
      setRetryCount(0);
    } catch (retryError) {
      setError(`Authentication failed. Please try logging in again.`);
    }
  };

  // Initialize
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authStatus = params.get('auth');
    const messageParam = params.get('message');

    if (messageParam) {
      setMessage(decodeURIComponent(messageParam));
    } else if (authStatus) {
      const messages = {
        success: 'Successfully logged in!',
        signup_success: 'Account created successfully!',
        character_linked: 'Character linked successfully!',
        exists: 'Character already exists. Please login instead.',
        error: 'An error occurred during authentication.'
      };
      setMessage(messages[authStatus] || '');
    }

    const timer = setTimeout(() => setMessage(''), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={styles.container}>
      {isLoading && (
        <div style={styles.loadingOverlay}>
          <Loader2 size={40} style={styles.loadingSpinner} />
        </div>
      )}

      {error && (
        <div style={styles.errorContainer}>
          <AlertCircle size={20} />
          <span>{error}</span>
          <button
            style={styles.retryButton}
            onClick={() => handleAuthError({ message: 'Retrying authentication' })}
          >
            Retry
          </button>
          <button
            style={styles.closeButton}
            onClick={() => setError(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {message && (
        <Alert style={styles.messageContainer}>
          <AlertDescription>
            {message}
            <button
              style={styles.closeButton}
              onClick={() => setMessage('')}
            >
              <X size={16} />
            </button>
          </AlertDescription>
        </Alert>
      )}

      {children}
    </div>
  );
};

export default AuthManager;