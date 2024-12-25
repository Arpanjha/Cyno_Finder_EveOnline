// utils/characterManagement.js
import { getPocketBaseInstance } from './pocketbase';

/**
 * Gets all characters regardless of auth status
 */
export async function getAllCharacters() {
  const pb = await getPocketBaseInstance();
  return pb.collection('characters').getFullList({
    sort: '-created',
  });
}

/**
 * Gets only characters with valid authentication
 */
export async function getAuthenticatedCharacters() {
  const pb = await getPocketBaseInstance();
  return pb.collection('characters').getFullList({
    filter: 'is_auth_valid = true',
    sort: '-created',
  });
}

/**
 * Gets characters needing re-authentication
 */
export async function getCharactersNeedingReauth() {
  const pb = await getPocketBaseInstance();
  return pb.collection('characters').getFullList({
    filter: 'is_auth_valid = false',
    sort: '-created',
  });
}

/**
 * Marks a character as having invalid auth
 */
export async function invalidateCharacterAuth(characterId) {
  const pb = await getPocketBaseInstance();
  try {
    const record = await pb.collection('characters')
      .getFirstListItem(`character_id = "${characterId}"`);
      
    await pb.collection('characters').update(record.id, {
      access_token: null,
      refresh_token: null,
      is_auth_valid: false,
      updated: new Date().toISOString()
    });
    console.log(`Marked character ${characterId} as needing re-authentication`);
  } catch (error) {
    console.error('Failed to invalidate character auth:', error);
    throw error;
  }
}

/**
 * Updates character location data
 */
export async function updateCharacterLocation(characterId, locationData) {
  const pb = await getPocketBaseInstance();
  try {
    const record = await pb.collection('characters')
      .getFirstListItem(`character_id = "${characterId}"`);
      
    await pb.collection('characters').update(record.id, {
      ...locationData,
      updated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to update character location:', error);
    throw error;
  }
}

/**
 * Gets re-authentication URL for a character
 */
export function getReauthUrl(characterId, currentUserId) {
  const authUrl = new URL('/api/auth', window.location.origin);
  const params = new URLSearchParams({
    action: 'reauth',
    characterId: characterId,
    currentUser: currentUserId
  });
  authUrl.search = params.toString();
  return authUrl.toString();
}

/**
 * Validates a character's authentication
 */
export async function validateCharacterAuth(characterId, tokenData) {
  const pb = await getPocketBaseInstance();
  try {
    const record = await pb.collection('characters')
      .getFirstListItem(`character_id = "${characterId}"`);
      
    await pb.collection('characters').update(record.id, {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      is_auth_valid: true,
      updated: new Date().toISOString()
    });
    console.log(`Validated authentication for character ${characterId}`);
  } catch (error) {
    console.error('Failed to validate character auth:', error);
    throw error;
  }
}