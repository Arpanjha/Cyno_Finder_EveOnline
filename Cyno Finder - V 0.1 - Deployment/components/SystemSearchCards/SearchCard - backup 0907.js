import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp, Lock, Unlock } from 'lucide-react';
import SystemSearch from '../SystemSearch';

const styles = {
  card: {
    position: 'relative',
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderRadius: '8px',
    padding: '24px',
    border: '1px solid rgba(64, 224, 255, 0.3)',
    width: '350px',
    minWidth: '350px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  removeButton: {
    position: 'absolute',
    right: '-10px',
    top: '-10px',
    background: 'rgba(31, 41, 55, 0.9)',
    border: '1px solid rgba(64, 224, 255, 0.3)',
    color: '#ffffff',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '50%',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    zIndex: 10,
  },
  excludedSection: {
    backgroundColor: 'rgba(31, 41, 55, 0.3)',
    borderRadius: '6px',
    overflow: 'hidden',
    border: '1px solid rgba(64, 224, 255, 0.2)'
  },
  excludedHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    backgroundColor: 'rgba(31, 41, 55, 0.7)',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease'
  },
  excludedTitle: {
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  excludedCount: {
    backgroundColor: 'rgba(64, 224, 255, 0.2)',
    color: '#ffffff',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    border: '1px solid rgba(64, 224, 255, 0.3)'
  },
  excludedList: {
    padding: '12px',
    backgroundColor: 'rgba(31, 41, 55, 0.3)'
  },
  excludedItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    color: '#ffffff',
    fontSize: '14px',
    borderBottom: '1px solid rgba(64, 224, 255, 0.1)'
  },
  includeButton: {
    background: 'none',
    border: '1px solid rgba(64, 224, 255, 0.5)',
    color: 'rgba(64, 224, 255, 0.9)',
    cursor: 'pointer',
    padding: '4px 12px',
    fontSize: '12px',
    borderRadius: '4px',
    transition: 'all 0.2s ease'
  },
  prioritySelect: {
    width: '120px',
    padding: '8px',
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    color: '#ffffff',
    border: '1px solid rgba(64, 224, 255, 0.5)',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  systemName: {
    color: 'rgba(64, 224, 255, 0.9)',
    fontSize: '16px',
    fontWeight: '500',
    padding: '4px 0'
  },
  searchSection: {
    width: '100%'
  },
  resultsSection: {
    width: '100%'
  },
  resultsHeader: {
    color: '#ffffff',
    fontSize: '14px',
    marginBottom: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid rgba(64, 224, 255, 0.2)'
  },
  resultCard: {
    backgroundColor: 'rgba(31, 41, 55, 0.7)',
    borderRadius: '6px',
    padding: '16px',
    marginBottom: '12px',
    width: '100%',
    boxSizing: 'border-box',
    position: 'relative',
    border: '1px solid rgba(64, 224, 255, 0.2)'
  },
  lockedBadge: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    backgroundColor: 'rgba(64, 224, 255, 0.2)',
    color: '#ffffff',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    border: '1px solid rgba(64, 224, 255, 0.3)'
  },
  resultHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  characterName: {
    color: '#ffffff',
    fontWeight: '500',
    fontSize: '14px'
  },
  badgeContainer: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  assignedLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    marginBottom: '6px',
    borderRadius: '4px',
    fontSize: '12px',
    border: '1px solid rgba(104, 104, 104, 0.5)',
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
    color: 'rgba(177, 168, 168, 0.9)',
    transition: 'all 0.2s ease'
  },

  systemInfo: {
    color: '#ffffff',
    fontSize: '13px',
    marginBottom: '6px',
    opacity: 0.8
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
    marginTop: '12px'
  },
  lockButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
    border: '1px solid rgba(64, 224, 255, 0.5)',
    backgroundColor: 'rgba(64, 224, 255, 0.1)',
    color: 'rgba(64, 224, 255, 0.9)',
    transition: 'all 0.2s ease'
  },
  excludeButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
    border: '1px solid rgba(255, 68, 68, 0.5)',
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    color: 'rgba(255, 68, 68, 0.9)',
    transition: 'all 0.2s ease'
  },
  noResults: {
    color: '#ffffff',
    fontSize: '14px',
    opacity: 0.7,
    textAlign: 'center',
    padding: '16px 0'
  }
};

const getBadgeStyle = (colorCode) => {
  const baseStyle = {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  };

  const colors = {
    green: {
      backgroundColor: 'rgba(52, 211, 153, 0.1)',
      color: 'rgb(52, 211, 153)',
      border: '1px solid rgba(52, 211, 153, 0.3)'
    },
    yellow: {
      backgroundColor: 'rgba(251, 191, 36, 0.1)',
      color: 'rgb(251, 191, 36)',
      border: '1px solid rgba(251, 191, 36, 0.3)'
    },
    red: {
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      color: 'rgb(239, 68, 68)',
      border: '1px solid rgba(239, 68, 68, 0.3)'
    },
    default: {
      backgroundColor: 'rgba(156, 163, 175, 0.1)',
      color: 'rgb(156, 163, 175)',
      border: '1px solid rgba(156, 163, 175, 0.3)'
    }
  };

  return { ...baseStyle, ...colors[colorCode || 'default'] };
};

const SearchCard = ({
  id,
  priority,
  systemName,
  onRemove,
  onPriorityChange,
  onSystemSelect,
  onCynoExclude,
  onCynoInclude,
  onCynoLock,
  onCynoUnlock,
  results,
  hasSearched,
  isSearching,
  excludedCharacters,
  lockedCyno
}) => {
  const [showExcluded, setShowExcluded] = useState(false);

  // Deduplicate excluded characters
  const uniqueExcludedCharacters = excludedCharacters.reduce((acc, char) => {
    if (!acc.find(c => c.characterId === char.characterId)) {
      acc.push(char);
    }
    return acc;
  }, []);

  const renderExcludedCharacters = () => (
    <div style={styles.excludedSection}>
      <div 
        style={styles.excludedHeader}
        onClick={() => setShowExcluded(!showExcluded)}
      >
        <div style={styles.excludedTitle}>
          <span>Excluded Characters</span>
          <span style={styles.excludedCount}>{uniqueExcludedCharacters.length}</span>
        </div>
        {showExcluded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>
      {showExcluded && (
        <div style={styles.excludedList}>
          {uniqueExcludedCharacters.length > 0 ? (
            uniqueExcludedCharacters.map(char => (
              <div key={char.characterId} style={styles.excludedItem}>
                <span>{char.characterName}</span>
                <button
                  onClick={() => onCynoInclude(id, char.characterId)}
                  style={styles.includeButton}
                >
                  Include
                </button>
              </div>
            ))
          ) : (
            <div style={{ color: '#9CA3AF', fontSize: '14px' }}>
              No excluded characters
            </div>
          )}
        </div>
      )}
    </div>
  );

// First, let's update the renderResult function:

const renderResult = (result, isAssigned = false) => {
  const isLocked = lockedCyno?.characterId === result.characterId;
  const badgeStyle = getBadgeStyle(result.colorCode || 'default'); // Add default for null jumps

  return (
    <div key={result.characterId} style={styles.resultCard}>
      {/* Show locked status at top when locked */}
      {isLocked && (
        <div style={styles.assignedLabel}>
          Locked
        </div>
      )}
      
      {/* Show assigned status at top when assigned */}
      {isAssigned && (
        <div style={styles.assignedLabel}>
          Assigned to Priority {result.assignedTo?.priority} ({result.assignedTo?.systemName})
        </div>
      )}

      <div style={styles.resultHeader}>
        <div style={styles.characterName}>{result.characterName}</div>
        <div style={styles.badgeContainer}>
          <span style={badgeStyle}>
            {result.jumps === Infinity || result.jumps === null ? 'null jumps' : `${result.jumps} jumps`}
          </span>
        </div>
      </div>

      <div style={styles.systemInfo}>
        Current System: {result.currentSystem}
      </div>
      <div style={styles.systemInfo}>
        Ship Type: {result.shipType}
      </div>

      <div style={styles.actionButtons}>
        {!isAssigned && (
          <>
            <button
              onClick={() => isLocked 
                ? onCynoUnlock(id)
                : onCynoLock(id, result)
              }
              style={styles.lockButton}
            >
              {isLocked ? (
                <>
                  <Unlock size={12} />
                  Unlock Cyno
                </>
              ) : (
                <>
                  <Lock size={12} />
                  Lock Cyno
                </>
              )}
            </button>
            {!isLocked && (
              <button
                onClick={() => onCynoExclude(id, result.characterId, result.characterName)}
                style={styles.excludeButton}
              >
                <X size={12} />
                Exclude Cyno
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

  return (
    <div style={styles.card}>
      {onRemove && (
        <button onClick={() => onRemove(id)} style={styles.removeButton}>
          <X size={14} />
        </button>
      )}

      {renderExcludedCharacters()}

      <select
        value={priority}
        onChange={(e) => onPriorityChange(id, parseInt(e.target.value))}
        style={styles.prioritySelect}
      >
        {[1, 2, 3, 4, 5].map(num => (
          <option key={num} value={num}>
            Priority {num}
          </option>
        ))}
      </select>

      {systemName && (
        <div style={styles.systemName}>{systemName}</div>
      )}

      <div style={styles.searchSection}>
        <SystemSearch onSystemSelect={(system) => onSystemSelect(id, system)} />
      </div>

      {hasSearched && (
        <div style={styles.resultsSection}>
          <div style={styles.resultsHeader}>
            <span>Nearest Cynos</span>
            {systemName && <span>System: {systemName}</span>}
          </div>
          
          {isSearching ? (
            <div style={styles.noResults}>Searching...</div>
          ) : (results.available.length > 0 || results.assigned.length > 0) ? (
            <>
              {results.available.map(result => renderResult(result, false))}
              {results.assigned.map(result => renderResult(result, true))}
            </>
          ) : (
            <div style={styles.noResults}>No results found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchCard;