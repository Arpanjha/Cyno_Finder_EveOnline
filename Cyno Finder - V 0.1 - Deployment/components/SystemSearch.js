import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { getSystemNameById } from '@/utils/systemLookup';

const styles = {
  searchInputContainer: {
    position: 'relative',
    width: '80%',
  },
  searchContainer: {
    width: '90%',
    boxSizing: 'border-box',
  },
  searchInput: {
    width: '90%',
    boxSizing: 'border-box',
  },
  searchInput: {
    width: '90%',
    padding: '0.5rem 2.5rem 0.5rem 0.75rem',
    backgroundColor: '#0e1a2b',
    color: '#fff',
    border: '1px solid #00d8ff',
    borderRadius: '4px',
    fontSize: '0.875rem',
  },
  searchIcon: {
    position: 'absolute',
    right: '0.75rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#9ca3af',
  },
  searchResults: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#1e293b',
    border: '1px solid #00d8ff',
    borderRadius: '4px',
    marginTop: '0.25rem',
    maxHeight: '200px',
    overflowY: 'auto',
    zIndex: 10,
  },
  searchResultItem: {
    padding: '0.5rem 0.75rem',
    color: '#fff',
    cursor: 'pointer',
    borderBottom: '1px solid rgba(75, 85, 99, 0.4)',
    '&:hover': {
      backgroundColor: 'rgba(0, 216, 255, 0.1)',
    },
    '&:last-child': {
      borderBottom: 'none',
    },
  }
};

const SystemSearch = ({ onSystemSelect }) => {
  const [query, setQuery] = useState('');
  const [systems, setSystems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchSystems = async () => {
      if (query.length < 3) {
        setSystems([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/searchSystems?query=${encodeURIComponent(query)}`);
        const data = await response.json();
        setSystems(data.items || []);
      } catch (error) {
        console.error('Failed to search systems:', error);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchSystems, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSelect = (system) => {
    setQuery(system.solarSystemName);
    setShowDropdown(false);
    onSystemSelect && onSystemSelect(system);
  };

  return (
    <div ref={dropdownRef} style={styles.searchInputContainer}>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowDropdown(true);
        }}
        placeholder="Enter system name"
        style={styles.searchInput}
      />
      <div style={styles.searchIcon}>
        {loading ? (
          <Loader2 className="animate-spin" size={16} />
        ) : (
          <Search size={16} />
        )}
      </div>

      {showDropdown && query.length >= 3 && systems.length > 0 && (
        <div style={styles.searchResults}>
          {systems.map((system) => (
            <div
              key={system.solarSystemID}
              onClick={() => handleSelect(system)}
              style={styles.searchResultItem}
            >
              {system.solarSystemName}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SystemSearch;