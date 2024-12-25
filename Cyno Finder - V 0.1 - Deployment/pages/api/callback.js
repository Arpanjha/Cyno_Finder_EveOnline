// pages/api/callback.js
import { handleUser } from "../../utils/userHandler";
import { decodeJWT, getCurrentSolarSystem, getCurrentShip, getSkills } from "../../utils/eve";
import { getPocketBaseInstance } from "../../utils/pocketbase";
import { createCharacterRecord } from "../../utils/characterUtils";
import crypto from "crypto";

export default async function handler(req, res) {
  const { code, state } = req.query;

  if (!code || !state) {
    return res.redirect(
      "/?auth=error&message=" +
        encodeURIComponent("Missing authentication parameters")
    );
  }

  try {
    console.log("Processing EVE OAuth callback...");

    // Step 1: Validate state and extract authentication context
    let stateData;
    try {
      const decodedState = Buffer.from(state, "base64").toString();
      stateData = JSON.parse(decodedState);
      console.log("Authentication Context:", {
        action: stateData.action,
        currentUser: stateData.currentUser,
        characterId: stateData.characterId,
      });
    } catch (error) {
      console.error("State validation failed:", error);
      return res.redirect(
        "/?auth=error&message=" +
          encodeURIComponent("Invalid authentication state")
      );
    }

    // Step 2: Exchange authorization code for tokens
    const tokenData = await exchangeCodeForTokens(code);
    if (!tokenData?.access_token) {
      throw new Error("Failed to obtain access token");
    }

    // Step 3: Extract character information from JWT
    const decodedToken = decodeJWT(tokenData.access_token);
    const characterId = decodedToken.sub?.split(":")[2];
    const ssoId = decodedToken.sub;

    if (!characterId) {
      throw new Error("Character ID not found in token");
    }

    // Step 4: Verify character ownership
    const verifyData = await verifyCharacterOwnership(tokenData.access_token);
    const ownerHash = verifyData.CharacterOwnerHash;

    // Step 5: Handle user and character management
    const { user, isNewUser, characterExists } = await handleUser(
      ssoId,
      ownerHash,
      characterId,
      tokenData,
      stateData.currentUser
    );

    // Step 6: Fetch additional character data
    const [locationData, shipData, skillsData] = await Promise.all([
      getCurrentSolarSystem(characterId, tokenData.access_token, true),
      getCurrentShip(characterId, tokenData.access_token, true),
      getSkills(characterId, tokenData.access_token, true),
    ]);

    // Step 7: Prepare character record data
    const characterRecordData = {
      user_id: user.id,
      character_id: characterId,
      character_name: verifyData.CharacterName,
      corporation_id: verifyData.CharacterCorporationID,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,

      // Location data
      solar_system_id: locationData.solar_system_id,
      station_id: locationData.station_id || null,
      structure_id: locationData.structure_id || null,

      // Ship and skill data
      ship_type_id: shipData.ship_type_id,
      cyno_skill_level: skillsData.cyno_skill_level,

      // Additional metadata
      docked: Boolean(locationData.station_id || locationData.structure_id),
      is_auth_valid: true,
      token_expires: new Date(
        Date.now() + tokenData.expires_in * 1000
      ).toISOString(),

      // Timestamps
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    };

    // Step 8: Create or update character record
    const pb = await getPocketBaseInstance();
    const existingCharacter = await pb
      .collection("characters")
      .getFirstListItem(`character_id="${characterId}"`)
      .catch(() => null);

    let characterRecord;
    if (existingCharacter) {
      characterRecord = await pb
        .collection("characters")
        .update(existingCharacter.id, characterRecordData);
    } else {
      characterRecord = await createCharacterRecord(characterRecordData);
    }

    // Step 9: Determine redirect URL based on authentication action
    let redirectUrl = determineRedirectUrl(
      stateData.action,
      isNewUser,
      characterExists
    );

    // Step 10: Set user context cookie
    if (user?.user_global_id) {
      res.setHeader(
        "Set-Cookie",
        `user_context=${user.user_global_id}; HttpOnly; Path=/; SameSite=Lax; Secure`
      );
    }

    // Final redirect
    return res.redirect(redirectUrl);

  } catch (error) {
    console.error('OAuth Callback Processing Error:', error);
    
    // Detailed error logging
    return res.redirect(
      '/?auth=error&message=' + 
      encodeURIComponent(error.message || 'Authentication failed')
    );
  }
}

/**
 * Exchange authorization code for tokens
 * @param {string} code - Authorization code
 * @returns {Promise<Object>} - Token data
 */
async function exchangeCodeForTokens(code) {
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/callback`;
  
  const tokenResponse = await fetch('https://login.eveonline.com/v2/oauth/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(
        `${process.env.EVE_CLIENT_ID}:${process.env.EVE_CLIENT_SECRET}`
      ).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
    }).toString(),
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return tokenResponse.json();
}

/**
 * Verify character ownership
 * @param {string} accessToken - Access token
 * @returns {Promise<Object>} - Verification data
 */
async function verifyCharacterOwnership(accessToken) {
  const verifyResponse = await fetch('https://login.eveonline.com/oauth/verify', {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  if (!verifyResponse.ok) {
    throw new Error('Failed to verify token');
  }

  return verifyResponse.json();
}

/**
 * Determine redirect URL based on authentication action
 * @param {string} action - Authentication action
 * @param {boolean} isNewUser - Whether this is a new user
 * @param {boolean} characterExists - Whether the character already exists
 * @returns {string} - Redirect URL
 */
function determineRedirectUrl(action, isNewUser, characterExists) {
  switch (action) {
    case 'signup':
      return characterExists 
        ? '/?auth=exists' 
        : (isNewUser 
          ? '/?auth=signup_success' 
          : '/?auth=success');
    
    case 'link_character':
      return '/?auth=character_linked';
    
    case 'reauth':
      return '/?auth=reauth_success';
    
    case 'login':
    default:
      return '/?auth=success';
  }
}