// components/SystemSearchCards/index.js
import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import SearchCard from './SearchCard';

const styles = {
  container: {
    width: '100%',
    height: 'calc(100vh - 120px)', // Subtract header height
    marginTop: '120px', // Add margin for header
    backgroundColor: '#0e1a2b',
    position: 'fixed', // Change to fixed
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
    zIndex: 1,
  },
  titleSection: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    padding: '16px',
    backgroundColor: 'rgba(14, 26, 43, 0.95)',
    backdropFilter: 'blur(8px)',
    borderBottom: '1px solid rgba(64, 224, 255, 0.2)',
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: 'rgba(64, 224, 255, 0.9)',
    margin: 0,
    textAlign: 'center',
  },
  headerControls: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    width: '100%',
  },
  button: {
    backgroundColor: 'rgba(64, 224, 255, 0.9)',
    color: '#000000',
    padding: '10px 20px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
    backdropFilter: 'blur(4px)',
  },
  cardsSection: {
    maxWidth: '1800px', // Reduced max width to help center content
    margin: '0 auto',
    width: '100%',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center', // Center align the container
  },
  cardsContainer: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: '24px',
    justifyContent: 'center', // Center the cards
    width: '100%',
    padding: '0 24px 24px',
  },
  errorMessage: {
    position: 'fixed',
    top: '140px', // Adjusted to account for new header
    left: '50%',
    transform: 'translateX(-50%)',
    color: '#FF4444',
    fontSize: '14px',
    padding: '12px 24px',
    borderRadius: '6px',
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    border: '1px solid rgba(255, 68, 68, 0.3)',
    backdropFilter: 'blur(4px)',
    zIndex: 90,
    maxWidth: '90%',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  }
};

const SystemSearchCards = () => {
  const [cards, setCards] = useState([{ 
    id: 1, 
    systemId: null, 
    systemName: '', 
    priority: 1, 
    results: { available: [], assigned: [] },
    excludedCharacters: [],
    lockedCyno: null,
  }]);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    setError(null);
  }, [cards]);

  const addCard = () => {
    if (cards.length < 5) {
      setCards(prevCards => [...prevCards, {
        id: Date.now(),
        systemId: null,
        systemName: '',
        priority: prevCards.length + 1,
        results: { available: [], assigned: [] },
        excludedCharacters: [],
        lockedCyno: null,
      }]);
    }
  };

  const removeCard = (cardId) => {
    if (cards.length > 1) {
      const updatedCards = cards
        .filter(card => card.id !== cardId)
        .map((card, index) => ({
          ...card,
          priority: index + 1,
        }));
      setCards(updatedCards);
    }
  };

  const handlePriorityChange = (cardId, newPriority) => {
    setCards(prevCards => {
      const cardToUpdate = prevCards.find(c => c.id === cardId);
      const oldPriority = cardToUpdate.priority;
      
      // If priority hasn't changed, return same cards
      if (oldPriority === newPriority) return prevCards;

      return prevCards.map(card => {
        // Card we're updating gets new priority
        if (card.id === cardId) {
          return { ...card, priority: newPriority };
        }
        // Card that had the new priority gets old priority
        if (card.priority === newPriority) {
          return { ...card, priority: oldPriority };
        }
        // All other cards stay the same
        return card;
      });
    });
  };

  const handleSystemSelect = (cardId, system) => {
    setCards(prevCards => prevCards.map(card =>
      card.id === cardId
        ? { 
            ...card, 
            systemId: system.solarSystemID, 
            systemName: system.solarSystemName, 
          }
        : card
    ));
  };

  const handleCynoExclude = (cardId, characterId, characterName) => {
    setCards(prevCards => prevCards.map(card => 
      card.id === cardId 
        ? {
            ...card,
            excludedCharacters: [...card.excludedCharacters, { characterId, characterName }],
          }
        : card
    ));
  };

  const handleCynoInclude = (cardId, characterId) => {
    setCards(prevCards => prevCards.map(card =>
      card.id === cardId
        ? {
            ...card,
            excludedCharacters: card.excludedCharacters.filter(
              char => char.characterId !== characterId
            ),
          }
        : card
    ));
  };

  const handleCynoLock = (cardId, cynoData) => {
    setCards(prevCards => prevCards.map(card =>
      card.id === cardId
        ? { ...card, lockedCyno: cynoData }
        : card
    ));
  };

  const handleCynoUnlock = (cardId) => {
    setCards(prevCards => prevCards.map(card =>
      card.id === cardId
        ? { ...card, lockedCyno: null }
        : card
    ));
  };

  const handleSearch = async () => {
    setIsSearching(true);
    setError(null);
    setHasSearched(false);

    try {
      const systems = cards
        .filter(card => card.systemId)
        .map(card => ({
          systemId: card.systemId,
          systemName: card.systemName,
          priority: card.priority,
          lockedCyno: card.lockedCyno?.characterId,
          excludedCharacters: card.excludedCharacters.map(char => char.characterId),
        }));

        if (systems.length === 0) {
          setCards(prevCards => prevCards.map(card => ({
            ...card,
            results: { available: [], assigned: [] },
          })));
          setHasSearched(true);
          return;
        }

        // Perform search and auth check in parallel
        const [response, authCheckResult] = await Promise.all([
          fetch('/api/findCynos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ systems }),
          }),
          fetch('/api/getCharacters')
        ]);
  
        const data = await response.json();
        
        if (!data.success || !data.results) {
          throw new Error(data.error || 'Failed to fetch results');
        }
  
        setCards(prevCards => prevCards.map(card => {
          const systemResults = data.results[card.systemId] || { available: [], assigned: [] };
          
          if (card.lockedCyno) {
            const lockedCynoResult = [...systemResults.available, ...systemResults.assigned]
              .find(result => result.characterId === card.lockedCyno.characterId);
            
            return {
              ...card,
              results: {
                available: lockedCynoResult ? [lockedCynoResult] : [],
                assigned: [],
              },
            };
          }

          return {
            ...card,
            results: systemResults,
          };
        }));

    } catch (error) {
      console.error('Search failed:', error);
      setError(error.message || 'Failed to perform search');
      setCards(prevCards => prevCards.map(card => ({
        ...card,
        results: { available: [], assigned: [] },
      })));
    } finally {
      setIsSearching(false);
      setHasSearched(true);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.titleSection}>
        <h1 style={styles.title}>PushX Hauler Tool</h1>
        <div style={styles.headerControls}>
          <button
            onClick={addCard}
            disabled={cards.length >= 5}
            style={{
              ...styles.button,
              opacity: cards.length >= 5 ? 0.5 : 1,
              cursor: cards.length >= 5 ? 'not-allowed' : 'pointer',
            }}
          >
            <Plus size={20} />
            Add System
          </button>
          <button
            onClick={handleSearch}
            disabled={isSearching || !cards.some(card => card.systemId)}
            style={{
              ...styles.button,
              opacity: (isSearching || !cards.some(card => card.systemId)) ? 0.5 : 1,
              cursor: (isSearching || !cards.some(card => card.systemId)) ? 'not-allowed' : 'pointer',
            }}
          >
            {isSearching ? 'Searching...' : 'Find Nearest Cynos'}
          </button>
        </div>
      </div>

      {error && <div style={styles.errorMessage}>{error}</div>}
      
      <div style={styles.cardsSection}>
        <div style={styles.cardsContainer}>
          {cards.map((card) => (
            <SearchCard
              key={card.id}
              id={card.id}
              priority={card.priority}
              systemName={card.systemName}
              onRemove={cards.length > 1 ? removeCard : null}
              onPriorityChange={handlePriorityChange}
              onSystemSelect={handleSystemSelect}
              onCynoExclude={handleCynoExclude}
              onCynoInclude={handleCynoInclude}
              onCynoLock={handleCynoLock}
              onCynoUnlock={handleCynoUnlock}
              results={card.results}
              hasSearched={hasSearched}
              isSearching={isSearching}
              excludedCharacters={card.excludedCharacters}
              lockedCyno={card.lockedCyno}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SystemSearchCards;