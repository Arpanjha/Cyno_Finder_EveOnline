import { useEffect, useState } from 'react';

export default function SelectMainCharacter({ userId }) {
  const [characters, setCharacters] = useState([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch linked characters for the user
    async function fetchCharacters() {
      const response = await fetch(`/api/get-characters?user_id=${userId}`);
      const data = await response.json();
      setCharacters(data);
    }
    fetchCharacters();
  }, [userId]);

  const handleSelection = async () => {
    if (!selectedCharacterId) {
      setError('Please select a main character.');
      return;
    }

    const response = await fetch('/api/set-main-character', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, mainCharacterId: selectedCharacterId }),
    });

    if (response.ok) {
      window.location.href = '/?auth=success';
    } else {
      setError('Failed to set the main character. Please try again.');
    }
  };

  return (
    <div>
      <h1>Select Main Character</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <ul>
        {characters.map((character) => (
          <li key={character.character_id}>
            <label>
              <input
                type="radio"
                name="mainCharacter"
                value={character.character_id}
                onChange={() => setSelectedCharacterId(character.character_id)}
              />
              {character.character_name}
            </label>
          </li>
        ))}
      </ul>
      <button onClick={handleSelection}>Confirm Main Character</button>
    </div>
  );
}

SelectMainCharacter.getInitialProps = ({ query }) => {
  return { userId: query.user_id };
};
