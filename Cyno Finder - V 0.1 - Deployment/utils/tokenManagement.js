// tokenManagement.js - Complete consolidated version
import { getPocketBaseInstance } from './pocketbase';
import { getCharacterByEveId } from './characterUtils';

// Constants
const TOKEN_REFRESH_WINDOW = 10; // Minutes before expiry to attempt refresh
const MAX_REFRESH_RETRIES = 2;

/**
 * Refresh an EVE Online OAuth token with improved error handling and logging
 * @param {string} characterId - EVE character ID
 * @param {string} refreshToken - Current refresh token
 * @param {number} attempt - Current attempt number
 * @returns {Promise<Object>} - New token data
 */
export async function refreshEveToken(characterId, refreshToken, attempt = 1) {
  try {
    console.log(`Attempting token refresh for character ${characterId} (attempt ${attempt})`);
    
    const response = await fetch('https://login.eveonline.com/v2/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(
          `${process.env.EVE_CLIENT_ID}:${process.env.EVE_CLIENT_SECRET}`
        ).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }).toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Token refresh failed for character ${characterId}:`, {
        status: response.status,
        error: errorText,
        attempt
      });
      throw new Error(`Token refresh failed: ${response.status} - ${errorText}`);
    }

    const tokenData = await response.json();
    console.log(`Token refresh successful for character ${characterId}, expires_in: ${tokenData.expires_in}`);
    
    return tokenData;
  } catch (error) {
    if (attempt < MAX_REFRESH_RETRIES) {
      console.log(`Retrying token refresh for character ${characterId}`);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
      return refreshEveToken(characterId, refreshToken, attempt + 1);
    }
    throw error;
  }
}

/**
 * Check if a token needs refresh based on expiry window
 * @param {string} tokenExpires - Token expiration timestamp
 * @returns {boolean} - Whether token needs refresh
 */
export function needsRefresh(tokenExpires) {
  if (!tokenExpires) return true;
  
  const expiryDate = new Date(tokenExpires);
  const refreshWindowDate = new Date(Date.now() + TOKEN_REFRESH_WINDOW * 60 * 1000);
  
  return expiryDate <= refreshWindowDate;
}

/**
 * Core token refresh logic with proper expiry checking
 * @param {Object} character - Character record
 * @returns {Promise<string>} - Valid access token
 */
export async function handleTokenRefresh(character) {
  const pb = await getPocketBaseInstance();
  
  try {
    // Check if refresh is needed
    if (!needsRefresh(character.token_expires)) {
      return character.access_token;
    }

    const tokenData = await refreshEveToken(character.character_id, character.refresh_token);
    
    // Update character record with new tokens
    await pb.collection('characters').update(character.id, {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_expires: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      is_auth_valid: true,
      updated: new Date().toISOString()
    });

    return tokenData.access_token;
  } catch (error) {
    console.error(`Token refresh failed for character ${character.character_id}:`, error);
    await markForReauth(character);
    throw error;
  }
}

/**
 * Safely refresh token with retry and error handling
 * @param {Object} character - Character record
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<string>} - New access token
 */
export async function safeTokenRefresh(character, maxRetries = 3) {
  const pb = await getPocketBaseInstance();

  async function attemptRefresh(retryCount = 0) {
    try {
      return await handleTokenRefresh(character);
    } catch (error) {
      console.error(`Token refresh attempt ${retryCount + 1} failed:`, error);

      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return attemptRefresh(retryCount + 1);
      }

      // Mark character for re-authentication after max retries
      await markForReauth(character);
      throw new Error('Failed to refresh token after multiple attempts');
    }
  }

  return attemptRefresh();
}

/**
 * Mark character for re-authentication
 * @param {Object} character - Character record
 * @returns {Promise<void>}
 */
export async function markForReauth(character) {
  const pb = await getPocketBaseInstance();
  await pb.collection('characters').update(character.id, {
    access_token: null,
    refresh_token: null,
    is_auth_valid: false,
    token_expires: null,
    updated: new Date().toISOString()
  });
  console.log(`Marked character ${character.character_id} for re-authentication`);
}

/**
 * Validate and refresh token for a given character ID
 * @param {string} characterId - EVE character ID
 * @returns {Promise<string>} - Valid access token
 */
export async function getValidToken(characterId) {
  try {
    const character = await getCharacterByEveId(characterId);

    if (!character) {
      throw new Error(`No character found with ID ${characterId}`);
    }

    if (!character.is_auth_valid) {
      throw new Error(`Character ${characterId} requires re-authentication`);
    }

    return await handleTokenRefresh(character);
  } catch (error) {
    console.error(`Token validation failed for character ${characterId}:`, error);
    throw error;
  }
}

/**
 * Check if a token is close to expiration
 * @param {Object} character - Character record
 * @param {number} thresholdMinutes - Minutes before expiration to consider token stale
 * @returns {boolean} - Whether token is close to expiration
 */
export function isTokenNearExpiration(character, thresholdMinutes = 5) {
  return needsRefresh(character.token_expires);
}

/**
 * Invalidate a character's tokens
 * @param {string} characterId - EVE character ID
 * @returns {Promise<void>}
 */
export async function invalidateCharacterTokens(characterId) {
  const pb = await getPocketBaseInstance();

  try {
    const character = await getCharacterByEveId(characterId);
    if (character) {
      await markForReauth(character);
    }
  } catch (error) {
    console.error(`Failed to invalidate tokens for character ${characterId}:`, error);
    throw error;
  }
}

/**
 * Batch validate and refresh tokens for multiple characters
 * @param {Array<string>} characterIds - Array of EVE character IDs
 * @returns {Promise<Object>} - Validation results
 */
export async function batchTokenValidation(characterIds) {
  const validationResults = {};

  for (const characterId of characterIds) {
    try {
      const token = await getValidToken(characterId);
      validationResults[characterId] = {
        valid: true,
        token: token,
      };
    } catch (error) {
      validationResults[characterId] = {
        valid: false,
        error: error.message,
      };
    }
  }

  return validationResults;
}

/**
 * Gets re-authentication URL for a character
 * @param {string} characterId - Character ID
 * @param {string} currentUserId - Current user ID
 * @returns {string} - Re-authentication URL
 */
export function getReauthUrl(characterId, currentUserId) {
  const authUrl = new URL('/api/auth', process.env.NEXT_PUBLIC_BASE_URL);
  const params = new URLSearchParams({
    action: 'reauth',
    characterId: characterId,
    currentUser: currentUserId
  });
  authUrl.search = params.toString();
  return authUrl.toString();
}