// pages/api/getCharacters.js
import { getPocketBaseInstance } from '../../utils/pocketbase';
import { getSystemNameById } from '@/utils/systemLookup';

export default async function handler(req, res) {
  try {
    const pb = await getPocketBaseInstance();

    // 1) Fetch all characters from PocketBase
    const records = await pb.collection('characters').getFullList({
      sort: '-created',
      fields: `
        id,
        character_id,
        character_name,
        corporation_id,
        solar_system_id,
        ship_type_id,
        cyno_skill_level,
        is_auth_valid,
        updated
      `,
    });

    // 2) Convert records to plain objects
    const characters = records.map((character) => ({
      id: character.id,
      character_id: character.character_id,
      character_name: character.character_name,
      corporation_id: character.corporation_id,
      solar_system_id: character.solar_system_id,
      ship_type_id: character.ship_type_id,
      cyno_skill_level: character.cyno_skill_level,
      is_auth_valid: character.is_auth_valid,
      last_updated: character.updated,
    }));

    // 3) Enrich with system name
    const enrichedCharacters = await Promise.all(
      characters.map(async (char) => {
        if (char.solar_system_id) {
          const name = await getSystemNameById(char.solar_system_id);
          return { ...char, solar_system_name: name };
        } else {
          return { ...char, solar_system_name: 'Unknown System' };
        }
      })
    );

    // 4) Filter for cyno-capable characters
    const cynoCapable = enrichedCharacters.filter(
      (char) => char.cyno_skill_level > 0
    );

    // 5) Return the final result
    return res.status(200).json({
      characters: cynoCapable,
      total: cynoCapable.length
    });

  } catch (error) {
    console.error('Failed to fetch characters:', error);
    return res.status(500).json({
      error: 'Failed to fetch characters',
      details: error.message,
    });
  }
}