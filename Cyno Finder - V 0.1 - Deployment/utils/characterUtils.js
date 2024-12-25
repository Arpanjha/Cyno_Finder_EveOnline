// utils/characterUtils.js
import { getPocketBaseInstance } from './pocketbase';
import { getCurrentSolarSystem, getCurrentShip, getSkills } from './eve';
import { handleTokenRefresh } from './tokenManagement';

/**
 * Find a character by EVE character ID
 * @param {string} characterId - EVE character ID
 * @returns {Promise<Object|null>} - Character record or null
 */
export async function getCharacterByEveId(characterId) {
  const pb = await getPocketBaseInstance();
  
  try {
    return await pb.collection('characters')
      .getFirstListItem(`character_id="${characterId}"`);
  } catch (error) {
    console.error(`Failed to find character with EVE ID ${characterId}:`, error);
    return null;
  }
}

/**
 * Find characters by user ID
 * @param {string} userId - User's global ID
 * @returns {Promise<Array>} - List of character records
 */
export async function getCharactersByUser(userId) {
  const pb = await getPocketBaseInstance();
  
  try {
    return await pb.collection('characters')
      .getList(1, 50, {
        filter: `user_id="${userId}"`,
        sort: '-created'
      });
  } catch (error) {
    console.error(`Failed to fetch characters for user ${userId}:`, error);
    return [];
  }
}

/**
 * Update character record in database
 * @param {Object} character - Character record
 * @param {Object} locationData - Location information
 * @param {Object} shipData - Ship information
 * @param {Object} [additionalData={}] - Additional data to update
 * @returns {Promise<Object>} - Updated character record
 */
export async function updateCharacterRecord(
  character, 
  locationData, 
  shipData, 
  additionalData = {}
) {
  const pb = await getPocketBaseInstance();
  
  try {
    return await pb.collection('characters').update(character.id, {
      // Preserve existing character ID
      character_id: character.character_id,
      
      // Location data
      solar_system_id: locationData.solar_system_id,
      station_id: locationData.station_id || null,
      structure_id: locationData.structure_id || null,
      
      // Ship data
      ship_type_id: shipData.ship_type_id,
      docked: Boolean(locationData.station_id || locationData.structure_id),
      
      // Additional data with default fallback
      ...additionalData,
      
      // Standard updates
      is_auth_valid: true,
      updated: new Date().toISOString()
    });
  } catch (updateError) {
    console.error(`Failed to update character ${character.character_id}:`, updateError);
    throw updateError;
  }
}

/**
 * Create a new character record
 * @param {Object} characterData - Character information
 * @returns {Promise<Object>} - Created character record
 */
export async function createCharacterRecord(characterData) {
  const pb = await getPocketBaseInstance();
  
  try {
    return await pb.collection('characters').create({
      ...characterData,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      is_auth_valid: true
    });
  } catch (error) {
    console.error('Failed to create character record:', error);
    throw error;
  }
}

/**
 * Mark character for re-authentication
 * @param {Object} character - Character record
 * @returns {Promise<void>}
 */
export async function markCharacterForReauth(character) {
  const pb = await getPocketBaseInstance();
  
  try {
    await pb.collection('characters').update(character.id, {
      is_auth_valid: false,
      access_token: null,
      refresh_token: null,
      updated: new Date().toISOString()
    });
    console.log(`Marked character ${character.character_id} for re-authentication`);
  } catch (error) {
    console.error(`Failed to mark character ${character.character_id} for re-auth:`, error);
    throw error;
  }
}

/**
 * Sync character's current location and ship
 * @param {Object} character - Character record
 * @returns {Promise<Object>} - Updated character record
 */
export async function syncCharacterData(character) {
  try {
    // Refresh token to ensure we have a valid access token
    const accessToken = await handleTokenRefresh(character);

    // Fetch current location, ship, and skills
    const [locationData, shipData, skillsData] = await Promise.all([
      getCurrentSolarSystem(character.character_id, accessToken),
      getCurrentShip(character.character_id, accessToken),
      getSkills(character.character_id, accessToken)
    ]);

    // Update character record
    return await updateCharacterRecord(
      character, 
      locationData, 
      shipData,
      {
        cyno_skill_level: skillsData.cyno_skill_level,
        online: true // Assuming successful data fetch means character is online
      }
    );
  } catch (error) {
    console.error(`Failed to sync data for character ${character.character_id}:`, error);
    
    // Mark for re-authentication if sync fails
    await markCharacterForReauth(character);
    
    throw error;
  }
}

/**
 * Get authenticated characters with valid tokens
 * @returns {Promise<Array>} - List of authenticated characters
 */
export async function getAuthenticatedCharacters() {
  const pb = await getPocketBaseInstance();
  
  try {
    return await pb.collection('characters').getFullList({
      filter: 'is_auth_valid = true',
      sort: '-created'
    });
  } catch (error) {
    console.error('Failed to fetch authenticated characters:', error);
    return [];
  }
}

/**
 * Check if a character needs re-authentication
 * @param {Object} character - Character record
 * @returns {boolean} - Whether character needs re-authentication
 */
export function needsReauthentication(character) {
  // Check if token is expired or authentication is invalid
  const tokenExpiry = new Date(character.token_expires);
  return !character.is_auth_valid || 
         tokenExpiry < new Date() || 
         !character.access_token || 
         !character.refresh_token;
}