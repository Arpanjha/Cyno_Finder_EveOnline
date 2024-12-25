// components/AuthSection.js
import React from 'react';

const styles = {
  container: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    display: 'flex',
    gap: '1rem',
  },
  button: {
    backgroundColor: '#40E0FF',
    color: '#000',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.875rem',
    transition: 'background-color 0.3s ease',
    zIndex: 103,
  },
  signupButton: {
    backgroundColor: '#40E0FF',
  },
  loginButton: {
    backgroundColor: '#40E0FF',
  },
  logoutButton: {
    backgroundColor: '#40E0FF',
    fontWeight: 500,
  },
};

const AuthSection = ({ isLoggedIn, onLogin, onSignup, onLogout }) => {
  return (
    <div style={styles.container}>
      {!isLoggedIn ? (
        <>
          <button
            onClick={onSignup}
            style={{ ...styles.button, ...styles.signupButton }}
          >
            Sign Up
          </button>
          <button
            onClick={onLogin}
            style={{ ...styles.button, ...styles.loginButton }}
          >
            Login
          </button>
        </>
      ) : (
        <button
          onClick={onLogout}
          style={{ ...styles.button, ...styles.logoutButton }}
        >
          Logout
        </button>
      )}
    </div>
  );
};

export default AuthSection;