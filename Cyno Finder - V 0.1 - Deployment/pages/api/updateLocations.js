// pages/api/updateLocations.js
import { getPocketBaseInstance } from '../../utils/pocketbase';
import { getCurrentSolarSystem, getCurrentShip } from '../../utils/eve';
import { handleTokenRefresh } from '../../utils/tokenManagement';

// Enhanced safe database operation with proper retries
async function safeDBOperation(operation) {
  let retries = 0;
  const maxRetries = 3;
  const baseDelay = 250;

  while (retries < maxRetries) {
    try {
      const pb = await getPocketBaseInstance();
      return await operation(pb);
    } catch (error) {
      if (error.isAbort || error.name === 'AbortError') {
        retries++;
        const delay = baseDelay * Math.pow(2, retries);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Operation failed after max retries');
}

// Process a single character
async function processCharacter(character) {
  try {
    // Skip update if already marked as invalid
    if (!character.is_auth_valid) {
      return {
        record_id: character.id,
        character_id: character.character_id,
        character_name: character.character_name,
        success: false,
        needs_reauth: true,
        message: 'Authentication invalid',
        last_known: {
          solar_system_id: character.solar_system_id || null,
          station_id: character.station_id || null,
          structure_id: character.structure_id || null,
          ship_type_id: character.ship_type_id || null,
          docked: character.docked || false
        }
      };
    }

    // Ensure token is valid
    const accessToken = await safeDBOperation(async () => 
      await handleTokenRefresh(character)
    );

    // Fetch location and ship data
    const [location, ship] = await Promise.all([
      getCurrentSolarSystem(character.character_id, accessToken),
      getCurrentShip(character.character_id, accessToken)
    ]);

    // Update character record
    await safeDBOperation(pb =>
      pb.collection('characters').update(
        character.id,
        {
          solar_system_id: location.solar_system_id,
          station_id: location.station_id || null,
          structure_id: location.structure_id || null,
          ship_type_id: ship.ship_type_id,
          docked: Boolean(location.station_id || location.structure_id),
          is_auth_valid: true,
          updated: new Date().toISOString()
        },
        { 
          requestKey: `update-${character.id}-${Date.now()}` 
        }
      )
    );

    return {
      record_id: character.id,
      character_id: character.character_id,
      character_name: character.character_name,
      success: true,
      needs_reauth: false,
      location: {
        solar_system_id: location.solar_system_id,
        station_id: location.station_id || null,
        structure_id: location.structure_id || null
      },
      ship: {
        ship_type_id: ship.ship_type_id
      },
      updated: new Date().toISOString()
    };

  } catch (error) {
    console.error(
      `Failed to update location for character ${character.character_id} (record ${character.id}):`,
      error
    );

    const isAuthError = error.message?.includes('token') || 
                        error.message?.includes('auth') ||
                        error.status === 401 ||
                        error.status === 403;

    if (isAuthError) {
      try {
        await safeDBOperation(pb =>
          pb.collection('characters').update(
            character.id,
            {
              is_auth_valid: false,
              updated: new Date().toISOString()
            },
            { 
              requestKey: `invalid-${character.id}-${Date.now()}` 
            }
          )
        );
      } catch (updateError) {
        console.error(
          `Failed to mark character ${character.character_id} (record ${character.id}) for re-auth:`,
          updateError
        );
      }
    }

    return {
      record_id: character.id,
      character_id: character.character_id,
      character_name: character.character_name,
      success: false,
      needs_reauth: isAuthError,
      error: error.message || 'Unknown error occurred',
      last_known: {
        solar_system_id: character.solar_system_id || null,
        station_id: character.station_id || null,
        structure_id: character.structure_id || null,
        ship_type_id: character.ship_type_id || null,
        docked: character.docked || false
      }
    };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all characters with all necessary fields
    const characters = await safeDBOperation(pb => 
      pb.collection('characters').getFullList({
        sort: '-created',
        fields: 'id,character_id,character_name,is_auth_valid,access_token,refresh_token,solar_system_id,station_id,structure_id,ship_type_id,docked,cyno_skill_level'
      })
    );

    // Process characters sequentially
    const results = [];
    for (const character of characters) {
      const result = await processCharacter(character);
      results.push(result);
    }

    // Count successes, failures, and reauth needed
    const successes = results.filter((r) => r.success).length;
    const failures = results.filter((r) => !r.success).length;
    const needReauth = results.filter((r) => r.needs_reauth).length;

    // Group results for detailed response
    const validUpdates = results.filter(r => r.success);
    const failedUpdates = results.filter(r => !r.success && !r.needs_reauth);
    const needingReauth = results.filter(r => r.needs_reauth);

    return res.status(200).json({
      success: true,
      message: `Updated ${successes} character locations` +
               (failures > 0 ? `, ${failures} failed` : '') +
               (needReauth > 0 ? `, ${needReauth} need re-authentication` : ''),
      stats: {
        total: characters.length,
        successful: successes,
        failed: failures,
        needingReauth: needReauth
      },
      results: {
        valid: validUpdates,
        failed: failedUpdates,
        needingReauth: needingReauth
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Failed to update character locations:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update character locations',
      details: error.message || 'Unknown error occurred'
    });
  }
}