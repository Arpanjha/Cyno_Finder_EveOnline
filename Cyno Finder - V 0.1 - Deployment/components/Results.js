// components/Results.js
import React from 'react';

const styles = {
  container: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem',
    width: '100%',
    maxWidth: '1200px',
    margin: '2rem auto 0',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '2rem',
  },
  spinner: {
    width: '2.5rem',
    height: '2.5rem',
    border: '4px solid rgba(0, 143, 168, 0.1)',
    borderTopColor: '#00d8ff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  noResults: {
    color: '#fff',
    textAlign: 'center',
    marginTop: '2rem',
  },
  card: {
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderRadius: '0.5rem',
    padding: '1.5rem',
    border: '1px solid rgba(75, 85, 99, 1)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#fff',
  },
  distance: {
    fontSize: '1.125rem',
    color: '#00d8ff',
  },
  imagePlaceholder: {
    width: '100%',
    height: '12rem',
    backgroundColor: '#374151',
    borderRadius: '0.375rem',
    marginBottom: '1rem',
  },
  shipInfo: {
    color: '#fff',
  },
  '@keyframes spin': {
    from: {
      transform: 'rotate(0deg)',
    },
    to: {
      transform: 'rotate(360deg)',
    },
  },
};

export default function Results({ results, loading }) {
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
      </div>
    );
  }

  if (!results.length) {
    return (
      <p style={styles.noResults}>
        No results found. Please search for a system.
      </p>
    );
  }

  return (
    <div style={styles.container}>
      {results.map((result, index) => (
        <div key={index} style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>{result.name}</h2>
            <p style={styles.distance}>{result.distance} jumps</p>
          </div>
          <div style={styles.imagePlaceholder}></div>
          <p style={styles.shipInfo}>Current Ship: {result.shipType}</p>
        </div>
      ))}
    </div>
  );
}