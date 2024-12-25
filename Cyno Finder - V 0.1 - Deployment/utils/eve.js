// utils/eve.js
import { getPocketBaseInstance } from './pocketbase';
import { handleTokenRefresh } from './tokenManagement';

/**
 * Makes an authenticated request to the EVE ESI API with robust error handling
 * @param {string} url - ESI endpoint URL
 * @param {string} characterId - Character identifier
 * @param {boolean} isNewLogin - Flag for new login scenario
 * @returns {Promise<Object>} - Parsed JSON response
 */
async function makeAuthenticatedRequest(url, characterId, isNewLogin = false) {
  try {
    const pb = await getPocketBaseInstance();
    
    // For new login, use token directly
    if (isNewLogin) {
      const character = await pb.collection('characters')
        .getFirstListItem(`character_id="${characterId}"`);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${character.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error(`EVE API error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    }

    // Existing character flow
    const character = await pb.collection('characters')
      .getFirstListItem(`character_id="${characterId}"`);

    // Try with current token first
    let response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${character.access_token}`
      }
    });

    // If unauthorized, try refresh
    if (response.status === 401 || response.status === 403) {
      try {
        const accessToken = await handleTokenRefresh(character);
        
        // Retry with new token
        response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        await pb.collection('characters').update(character.id, {
          is_auth_valid: false,
          updated: new Date().toISOString()
        });
        throw refreshError;
      }
    }

    if (!response.ok) {
      throw new Error(`EVE API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error(`API request failed for character ${characterId}:`, error);
    throw error;
  }
}

// Rest of your existing exports remain exactly the same
export async function getCurrentSolarSystem(characterId, accessToken, isNewLogin = false) {
  if (isNewLogin) {
    const response = await fetch(
      `https://esi.evetech.net/latest/characters/${characterId}/location/`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    );

    if (!response.ok) {
      throw new Error(`EVE API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  return makeAuthenticatedRequest(
    `https://esi.evetech.net/latest/characters/${characterId}/location/`,
    characterId
  );
}

export async function getCurrentShip(characterId, accessToken, isNewLogin = false) {
  if (isNewLogin) {
    const response = await fetch(
      `https://esi.evetech.net/latest/characters/${characterId}/ship/`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    );

    if (!response.ok) {
      throw new Error(`EVE API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  return makeAuthenticatedRequest(
    `https://esi.evetech.net/latest/characters/${characterId}/ship/`,
    characterId
  );
}

export async function getSkills(characterId, accessToken, isNewLogin = false) {
  if (isNewLogin) {
    const response = await fetch(
      `https://esi.evetech.net/latest/characters/${characterId}/skills/`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    );

    if (!response.ok) {
      throw new Error(`EVE API error: ${response.status} ${response.statusText}`);
    }

    const skillsData = await response.json();
    const cynoSkill = skillsData.skills.find(skill => skill.skill_id === 21603);

    return {
      cyno_skill_level: cynoSkill ? cynoSkill.trained_skill_level : 0
    };
  }

  const skillsData = await makeAuthenticatedRequest(
    `https://esi.evetech.net/latest/characters/${characterId}/skills/`,
    characterId
  );

  const cynoSkill = skillsData.skills.find(skill => skill.skill_id === 21603);
  return {
    cyno_skill_level: cynoSkill ? cynoSkill.trained_skill_level : 0
  };
}

export async function getOnlineStatus(characterId, accessToken, isNewLogin = false) {
  if (isNewLogin) {
    const response = await fetch(
      `https://esi.evetech.net/latest/characters/${characterId}/online/`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    );

    if (!response.ok) {
      throw new Error(`EVE API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  return makeAuthenticatedRequest(
    `https://esi.evetech.net/latest/characters/${characterId}/online/`,
    characterId
  );
}

export async function getCharacterInfo(characterId, accessToken, isNewLogin = false) {
  if (isNewLogin) {
    const response = await fetch(
      `https://esi.evetech.net/latest/characters/${characterId}/`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    );

    if (!response.ok) {
      throw new Error(`EVE API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  return makeAuthenticatedRequest(
    `https://esi.evetech.net/latest/characters/${characterId}/`,
    characterId
  );
}

export function decodeJWT(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
  return JSON.parse(jsonPayload);
}