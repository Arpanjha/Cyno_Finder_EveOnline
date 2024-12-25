// pages/index.js
import { useState, useEffect } from 'react';
import AuthManager from '../components/AuthManager';
import CharacterDropdown from '../components/CharacterDropdown';
import AuthSection from '../components/AuthSection';
import SystemSearchCards from '../components/SystemSearchCards';
import CustomAlert from '../components/Alert';
import { X } from 'lucide-react';
import { styles } from '../constants/styles';

export default function Home() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [characters, setCharacters] = useState([]);
  const [message, setMessage] = useState(null);
  const [userGlobalId, setUserGlobalId] = useState(null);
  const [characterLocations, setCharacterLocations] = useState({});
  const [lastLocationUpdate, setLastLocationUpdate] = useState(null);

  // Cookie utility function
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };

  // Fetch character locations
  const fetchCharacterLocations = async () => {
    try {
      const response = await fetch('/api/getCharacterLocations');
      const data = await response.json();

      if (data.success) {
        // Convert array to object with character_id as key for easier lookup
        const locationMap = data.locations.reduce((acc, location) => {
          acc[location.character_id] = location;
          return acc;
        }, {});

        setCharacterLocations(locationMap);
        setLastLocationUpdate(new Date());
      } else {
        console.error('Failed to fetch character locations:', data.error);
      }
    } catch (error) {
      console.error('Error fetching character locations:', error);
    }
  };

  // Initialize location polling with delay
  useEffect(() => {
    let locationInterval;

    if (isLoggedIn && characters.length > 0) {
      // Initial fetch after a 5-second delay
      const initialFetchTimeout = setTimeout(() => {
        fetchCharacterLocations();

        // Subsequent fetches every minute
        locationInterval = setInterval(fetchCharacterLocations, 300000);
      }, 5000);

      return () => {
        clearTimeout(initialFetchTimeout);
        clearInterval(locationInterval);
      };
    }
  }, [isLoggedIn, characters]);

  const handleUpdateLocations = async () => {
    try {
      const response = await fetch('/api/updateLocations', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        // Fetch fresh character data
        const charactersResponse = await fetch('/api/getCharacters', {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        const charactersData = await charactersResponse.json();
        
        // Update characters state with fresh data
        if (charactersData.characters) {
          setCharacters(charactersData.characters);
          
          // Optional: Update character locations
          fetchCharacterLocations();
          
          setMessage(data.message);
        }
      } else {
        setError(data.error || 'Failed to update locations');
      }
    } catch (error) {
      console.error('Error updating locations:', error);
      setError('Failed to update locations');
    }
  };

  useEffect(() => {
    const checkLoginStatus = async () => {
        const loginState = getCookie("isLoggedIn");
  
        if (loginState === "true") {
          try {
            const response = await fetch("/api/getCharacters");
  
            if (!response.ok) {
              // If the response is not okay, log the user out
              console.error(
                "Failed to fetch characters or an error occurred:",
                response.statusText
              );
              handleLogout();
              return; // Exit early
            }
  
            const data = await response.json();
  
            if (data && Array.isArray(data.characters) && data.characters.length > 0) {
              // User has characters
              setCharacters(data.characters);
              setIsLoggedIn(true);
  
              const userContext = getCookie("user_context");
              if (userContext) {
                setUserGlobalId(userContext);
              }
  
              // Fetch locations for the characters
              fetchCharacterLocations();
            } else {
              // User is logged in but has no characters
              setIsLoggedIn(true); // Keep them logged in
              setCharacters([]); // Clear characters array
  
              // Get and set the user's global ID from cookie
              const userContext = getCookie('user_context');
              if (userContext) {
                setUserGlobalId(userContext);
              }
            }
          } catch (error) {
            console.error("Error during login status check:", error);
            handleLogout();
          }
        } else {
          // If 'isLoggedIn' cookie is not set or false, consider the user as not logged in
          handleLogout();
        }
      };
  
      // Handle URL parameters and authentication status
      const params = new URLSearchParams(window.location.search);
      const authStatus = params.get('auth');
      const messageParam = params.get('message');
  
      const handleAuthStatus = async () => {
        if (
          authStatus === 'success' ||
          authStatus === 'signup_success' ||
          authStatus === 'character_linked' ||
          authStatus === 'reauth_success' // << ADD THIS
        ) {
          document.cookie = 'isLoggedIn=true; path=/; secure; samesite=Lax';
          setIsLoggedIn(true);
          await checkLoginStatus(); // Await the checkLoginStatus function
          window.history.replaceState({}, document.title, "/");
        } else {
          checkLoginStatus();
        }
      }
    
      handleAuthStatus();
  
      if (messageParam) {
        setMessage(decodeURIComponent(messageParam));
      } else if (authStatus) {
        const messages = {
          success: 'Successfully logged in!',
          signup_success: 'Account created successfully!',
          character_linked: 'Character linked successfully!',
          exists: 'Character already exists. Please login instead.',
          error: 'An error occurred during authentication.',
        };
        setMessage(messages[authStatus] || '');
      }
  
      const timer = setTimeout(() => setMessage(''), 5000);
      return () => clearTimeout(timer);
    }, []);

  const handleLogout = () => {
    document.cookie = 'auth_token=; Max-Age=0; path=/; secure; samesite=Lax';
    document.cookie = 'user_context=; Max-Age=0; path=/; secure; samesite=Lax';
    document.cookie = 'isLoggedIn=; Max-Age=0; path=/; secure; samesite=Lax';

    setIsLoggedIn(false);
    setCharacters([]);
    setUserGlobalId(null);
    setCharacterLocations({});

    window.location.href = '/'; // This will refresh the page and re-run the useEffect
  };

  const handleAuthentication = (action, characterId = null) => {
    const authUrl = new URL('/api/auth', window.location.origin);
    authUrl.searchParams.set('action', action);
    authUrl.searchParams.set('characterId', characterId);
    const params = new URLSearchParams({
      action: action,
      currentUser: userGlobalId
    });
  
    if (characterId) {
      params.set('characterId', characterId);
    }
  
    authUrl.search = params.toString();
    window.location.href = authUrl.toString();
  };

  // Function to find nearest cynos for a set of systems
  const findNearestCynos = async (systems) => {
    setLoading(true);
    setError('');

    try {
      // Get available cyno characters (characters with cyno_skill_level > 0)
      const cynoCharacters = Object.values(characterLocations).filter(
        (char) => char.cyno_skill_level > 0 && char.online
      );

      if (cynoCharacters.length === 0) {
        setError("No online cyno characters available");
        return;
      }

      // Create the request payload
      const searchData = {
        systems: systems.map((s) => ({
          systemId: s.systemId,
          priority: s.priority,
        })),
        cynoCharacters: cynoCharacters.map((char) => ({
          characterId: char.character_id,
          systemId: char.solar_system_id,
          shipTypeId: char.ship_type_id,
        })),
      };

      // Make the request to find routes
      const response = await fetch("/api/findCynos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(searchData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to find cyno routes");
      }

      // Return the results to be handled by SystemSearchCards
      return data.routes;
    } catch (error) {
      console.error("Error finding cyno routes:", error);
      setError(error.message || "Failed to find cyno routes");
    } finally {
      setLoading(false);
    }
  };
  const handleAlertClose = () => {
    setMessage({
      type: 'success',
      title: 'Success',
      description: 'Your changes are saved successfully'
    });
  };

  return (
    <AuthManager>
      <div style={styles.container}>
        <div style={styles.background} />
        <div style={styles.contentContainer}>
          <h1 style={styles.title}>PushX Hauler Tool</h1>
          {message && (
            <CustomAlert
              type={message.type || 'info'} // Add default type
              title={message.title || message} // Handle both string and object messages
              description={message.description}
              onClose={() => setMessage(null)}
            />
          )}

          {isLoggedIn && (
            <CharacterDropdown
              characters={characters}
              onAuthenticate={handleAuthentication}
              onUpdateLocations={handleUpdateLocations}
              userGlobalId={userGlobalId}
            />
          )}

          <AuthSection
            isLoggedIn={isLoggedIn}
            onLogin={() => handleAuthentication('login')}
            onSignup={() => handleAuthentication('signup')}
            onLogout={handleLogout}
          />

          <div style={styles.searchSection}>
            <SystemSearchCards
              onFindCynos={findNearestCynos}
              isSearching={loading}
              error={error}
              characters={characters}
              characterLocations={characterLocations}
              lastUpdate={lastLocationUpdate}
            />
          </div>

          {error && <p style={styles.errorMessage}>{error}</p>}
        </div>
      </div>
    </AuthManager>
  );
};