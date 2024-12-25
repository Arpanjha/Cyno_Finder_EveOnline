// pages/api/getCharacterLocations.js
import { getPocketBaseInstance } from '../../utils/pocketbase';
import { getCurrentSolarSystem, getCurrentShip } from '../../utils/eve';
import { getSystemNameById } from '@/utils/systemLookup';

// Helper to mark character invalid if we can't refresh/fetch
async function markCharacterInvalid(pb, recordId) {
  try {
    await pb.collection('characters').update(recordId, {
      is_auth_valid: false,
      updated: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Failed to mark character record ${recordId} as invalid:`, error);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let pb;
  try {
    // Initialize PocketBase properly
    pb = await getPocketBaseInstance();
    pb.autoCancellation(false); // disable globally
    
    // Fetch all characters
    const characters = await pb.collection('characters').getFullList({
      sort: '-created',
      // Explicitly select the fields we need
      fields: 'id,character_id,character_name,access_token,refresh_token,is_auth_valid,solar_system_id,station_id,structure_id,ship_type_id,cyno_skill_level,docked'
    });

    const locations = [];

    // Process each character
    for (const character of characters) {
      try {
        // If character is already marked invalid, skip API calls
        if (!character.is_auth_valid) {
          locations.push({
            record_id: character.id, // PocketBase record ID
            character_id: character.character_id, // EVE character ID
            character_name: character.character_name,
            needs_reauth: true,
            last_known: {
              solar_system_id: character.solar_system_id || null,
              station_id: character.station_id || null,
              structure_id: character.structure_id || null,
              ship_type_id: character.ship_type_id || null,
              docked: character.docked || false
            }
          });
          continue;
        }

        // Fetch current data from EVE API
        const [locationData, shipData] = await Promise.all([
          getCurrentSolarSystem(character.character_id, character.access_token, character.refresh_token),
          getCurrentShip(character.character_id, character.access_token, character.refresh_token)
        ]);

        // Update character record in database
        await pb.collection('characters').update(character.id, {
          solar_system_id: locationData.solar_system_id,
          station_id: locationData.station_id || null,
          structure_id: locationData.structure_id || null,
          ship_type_id: shipData.ship_type_id,
          docked: Boolean(locationData.station_id || locationData.structure_id),
          updated: new Date().toISOString()
        });

        // Add to locations array
        locations.push({
          record_id: character.id, // PocketBase record ID
          character_id: character.character_id, // EVE character ID
          character_name: character.character_name,
          solar_system_id: locationData.solar_system_id,
          station_id: locationData.station_id || null,
          structure_id: locationData.structure_id || null,
          ship_type_id: shipData.ship_type_id,
          cyno_skill_level: character.cyno_skill_level,
          docked: Boolean(locationData.station_id || locationData.structure_id),
          needs_reauth: false
        });

      } catch (error) {
        console.error(`Error processing character ${character.character_name}:`, error);
        
        // Mark character as needing reauth
        await markCharacterInvalid(pb, character.id);
        
        // Add error state to locations
        locations.push({
          record_id: character.id,
          character_id: character.character_id,
          character_name: character.character_name,
          error: true,
          error_message: error.message,
          needs_reauth: true,
          last_known: {
            solar_system_id: character.solar_system_id || null,
            station_id: character.station_id || null,
            structure_id: character.structure_id || null,
            ship_type_id: character.ship_type_id || null,
            docked: character.docked || false
          }
        });
      }
    }

    return res.status(200).json({
      success: true,
      locations,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Failed to fetch character locations:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch character locations',
      details: error.message
    });
  }
}