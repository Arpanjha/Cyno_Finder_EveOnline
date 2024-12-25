// components/CharacterDropdown.js
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, RefreshCw, AlertCircle } from 'lucide-react';
import { getSystemNameById } from '@/utils/systemLookup';

const styles = {
  authenticatedCharacters: {
    position: 'absolute',
    top: '1rem',
    left: '1rem',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    alignItems: 'start',
    zIndex: 50,
  },
  buttonGroup: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
  },
  characterDropdownButton: {
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '200px',
  },
  updateButton: {
    backgroundColor: '#40E0FF',
    color: '#000',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s ease',
  },
  characterDropdownContent: {
    backgroundColor: '#fff',
    color: '#000',
    position: 'absolute',
    top: '40px',
    left: '0',
    width: '350px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    zIndex: 10,
    padding: '8px 0',
  },
  characterItem: {
    padding: '8px 12px',
    borderBottom: '1px solid #ddd',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  characterName: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#000',
    justifyContent: 'space-between',
  },
  reauthButton: {
    backgroundColor: '#ff4040',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 8px',
    fontSize: '12px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  warningIcon: {
    color: '#ff4040',
    flexShrink: 0,
    
  },
  addCharacterButton: {
    backgroundColor: '#00d8ff',
    color: '#000',
    border: 'none',
    borderRadius: '5px',
    padding: '0.5rem 1rem',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'center',
  },
  '@keyframes spin': {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' }
  },
  spinnerIcon: {
    animation: 'spin 1s linear infinite',
  }
};

const CharacterDropdown = ({
  characters,
  onAuthenticate,
  onUpdateLocations,
  userGlobalId,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(characters.length === 0);
  const [isUpdating, setIsUpdating] = useState(false);

// Move silentAuthCheck inside component
const silentAuthCheck = async () => {
  try {
    const response = await fetch('/api/getCharacters', {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    const data = await response.json();
    if (data.characters) {
      // Compare both auth status and location changes
      const hasChanges = characters.some(prevChar => {
        const newChar = data.characters.find(c => c.character_id === prevChar.character_id);
        return newChar && (
          newChar.is_auth_valid !== prevChar.is_auth_valid ||
          newChar.solar_system_name !== prevChar.solar_system_name
        );
      });
      
      if (hasChanges) {
        onUpdateLocations(); // Call parent update if any changes detected
      }
    }
  } catch (error) {
    console.error('Silent auth check failed:', error);
  }
};

const handleUpdateLocations = async () => {
  setIsUpdating(true);
  try {
    // First update locations
    const updateResponse = await fetch('/api/updateLocations', {
      method: 'POST'
    });
    const updateData = await updateResponse.json();
    
    if (updateData.success) {
      // Then immediately fetch fresh character data
      const charactersResponse = await fetch('/api/getCharacters', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const charactersData = await charactersResponse.json();
      
      // Call parent's onUpdateLocations with fresh data
      if (charactersData.characters) {
        onUpdateLocations();
        // Check for any auth status changes
        await silentAuthCheck();
      }
    }
  } catch (error) {
    console.error('Location update failed:', error);
  } finally {
    setIsUpdating(false);
  }
};

const handleAuthenticate = async (characterId) => {
  // If characterId is provided, it's a re-auth
  if (characterId) {
    await onAuthenticate('reauth', characterId);
  } else {
    // Otherwise it's a new character authentication
    await onAuthenticate('link_character');
  }
  // Force refresh character data after authentication
  try {
    const response = await fetch('/api/getCharacters', {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    const data = await response.json();
    if (data.characters) {
      onUpdateLocations();
    }
  } catch (error) {
    console.error('Failed to refresh characters after authentication:', error);
  }
};

const toggleCollapse = async () => {
  // Immediately toggle the dropdown
  setIsCollapsed(prev => !prev);

  // If opening the dropdown, update locations in the background
  if (isCollapsed) {
    try {
      console.log('Current characters:', characters);
      
      // Fetch fresh character data
      const response = await fetch('/api/getCharacters', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const data = await response.json();
      console.log('New data from API:', data.characters);

      // Compare current and new data to detect changes
      const hasChanges = characters.some(prevChar => {
        const newChar = data.characters.find(c => c.character_id === prevChar.character_id);
        return newChar && (
          newChar.solar_system_name !== prevChar.solar_system_name ||
          newChar.is_auth_valid !== prevChar.is_auth_valid
        );
      });

      // Only call onUpdateLocations if there are changes
      if (hasChanges) {
        console.log('Changes detected, updating locations');
        onUpdateLocations();
      } else {
        console.log('No changes detected');
      }
    } catch (error) {
      console.error('Failed to refresh characters on dropdown open:', error);
    }
  }
};

  // Count how many characters need reauth
  const needsReauthCount = characters.filter(char => !char.is_auth_valid).length;

  return (
    <div style={styles.authenticatedCharacters}>
      <div style={styles.buttonGroup}>
        <button style={styles.characterDropdownButton} onClick={toggleCollapse}>
          {characters.length} Authenticated
          {characters.length > 0 && (
            <>
              {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              {needsReauthCount > 0 && (
                <AlertCircle style={styles.warningIcon} size={16} />
              )}
            </>
          )}
        </button>
        <button
          onClick={handleUpdateLocations}
          disabled={isUpdating}
          style={{
            ...styles.updateButton,
            opacity: isUpdating ? 0.7 : 1,
            cursor: isUpdating ? 'not-allowed' : 'pointer',
          }}
        >
          <RefreshCw 
            size={16} 
            style={isUpdating ? styles.spinnerIcon : {}}
          />
          {isUpdating ? 'Updating...' : 'Update Locations'}
        </button>
      </div>

      {!isCollapsed && (
        <div style={styles.characterDropdownContent}>
          {characters.map((char) => (
            <div key={char.character_id} style={styles.characterItem}>
              <div style={styles.characterName}>
                {!char.is_auth_valid && (
                  <AlertCircle style={styles.warningIcon} size={16} />
                )}
                {char.character_name}
                {char.solar_system_name && (
                  <span style={{ marginLeft: 8, fontSize: '0.85rem', color: '#777' }}>
                    ({char.solar_system_name})
                  </span>
                )}
              </div>
              {!char.is_auth_valid && (
                <button
                  onClick={() => handleAuthenticate(char.character_id)}
                  style={styles.reauthButton}
                >
                  Re-authenticate
                </button>
              )}
            </div>
          ))}
          <div style={{ padding: '8px' }}>
            <button 
              onClick={() => handleAuthenticate()}
              style={styles.addCharacterButton}
            >
              Authenticate Another Character
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterDropdown;