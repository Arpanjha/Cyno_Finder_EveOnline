// utils/userHandler.js
import { getPocketBaseInstance } from './pocketbase';
import { linkCharacterToUser } from './characterLinking';
import crypto from 'crypto';

/**
 * Handles user creation, linking, and management during authentication
 *
 * @param {string} ssoId - SSO identifier from EVE Online
 * @param {string} ownerHash - Character owner hash
 * @param {string} characterId - Character identifier
 * @param {Object} tokenData - Authentication token data
 * @param {string} [currentUserGlobalId=null] - Existing user's global ID for character linking
 * @returns {Promise<Object>} - User management result
 */
export async function handleUser(ssoId, ownerHash, characterId, tokenData, currentUserGlobalId = null) {
  const pb = await getPocketBaseInstance();

  // Logging context for better traceability
  console.log('User Handling Context:', {
    ssoId: ssoId.substring(0, 10) + '...',
    ownerHash: ownerHash.substring(0, 10) + '...',
    characterId,
    hasCurrentUser: !!currentUserGlobalId
  });

  try {
    // Step 1: Check if character already exists
    const existingCharacter = await pb.collection('characters')
      .getFirstListItem(`character_id="${characterId}"`)
      .catch(() => null);

    if (existingCharacter) {
      console.log(`Existing character found: ${characterId}`);

      // Fetch associated user
      const user = await pb.collection('eve_users').getOne(existingCharacter.user_id);

      return {
        user,
        isNewUser: false,
        characterExists: true
      };
    }

    // Step 2: Handle character linking to existing user
    if (currentUserGlobalId) {
      console.log(`Attempting to link character to user: ${currentUserGlobalId}`);

      // Find user by global ID
      const user = await pb.collection('eve_users')
        .getFirstListItem(`user_global_id="${currentUserGlobalId}"`)
        .catch(() => {
          throw new Error('User not found with provided global ID');
        });

      // Use centralized character linking
      const linkResult = await linkCharacterToUser(user.id, characterId);

      if (!linkResult.success) {
        throw new Error('Character linking failed');
      }

      return {
        user,
        isNewUser: false,
        characterExists: false
      };
    }

    // Step 3: Create new user for new signup
    console.log(`Creating new user for character: ${characterId}`);

    const userData = {
      sso_id: ssoId,
      is_active: true,
      main_character_id: characterId,
      linked_character_ids: [characterId],
      user_global_id: crypto.randomUUID(),
      owner_hashes: [ownerHash], 
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    };

    // Create user record
    const newUser = await pb.collection('eve_users').create(userData);

    console.log(`New user created with global ID: ${newUser.user_global_id}`);

    return {
      user: newUser,
      isNewUser: true,
      characterExists: false
    };

  } catch (error) {
    // Comprehensive error logging
    console.error('User Handling Error:', {
      message: error.message,
      characterId,
      currentUserGlobalId
    });

    // Re-throw to allow calling function to handle
    throw error;
  }
}

/**
 * Retrieves user details by global ID
 *
 * @param {string} userGlobalId - User's global identifier
 * @returns {Promise<Object>} - User details
 */
export async function getUserByGlobalId(userGlobalId) {
  const pb = await getPocketBaseInstance();

  try {
    return await pb.collection('eve_users')
      .getFirstListItem(`user_global_id="${userGlobalId}"`);
  } catch (error) {
    console.error(`Failed to retrieve user with global ID: ${userGlobalId}`, error);
    throw error;
  }
}

/**
 * Updates user profile information
 *
 * @param {string} userId - User's database ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} - Updated user record
 */
export async function updateUserProfile(userId, updateData) {
  const pb = await getPocketBaseInstance();

  try {
    return await pb.collection('eve_users').update(userId, {
      ...updateData,
      updated: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Failed to update user profile for ID: ${userId}`, error);
    throw error;
  }
}

/**
 * Retrieves all characters linked to a user
 *
 * @param {string} userId - User's database ID
 * @returns {Promise<Array>} - List of linked character IDs
 */
export async function getLinkedCharacters(userId) {
  const pb = await getPocketBaseInstance();

  try {
    const user = await pb.collection('eve_users').getOne(userId);
    return user.linked_character_ids || [];
  } catch (error) {
    console.error(`Failed to retrieve linked characters for user: ${userId}`, error);
    return [];
  }
}