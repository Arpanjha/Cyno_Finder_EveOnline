// pages/api/findCynos.js
import { getPocketBaseInstance } from '@/utils/pocketbase';
import { getSystemNameById } from '@/utils/systemLookup';
import { getShipNameById } from '@/utils/shipnamelookup';

// Helper to get color based on jumps
function getJumpColorCode(jumps) {
  if (jumps === Infinity) return 'red';
  if (jumps < 10) return 'green';
  if (jumps < 20) return 'yellow';
  return 'red';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { systems = [] } = req.body;

    if (!systems.length) {
      return res.status(400).json({
        error: 'Missing systems array in request body',
      });
    }

    // Sort systems by priority (1 is highest)
    const sortedSystems = [...systems].sort((a, b) => a.priority - b.priority);

    // Track assigned cynos
    const assignedCynos = new Map(); // characterId -> { systemId, priority, systemName }

    // Get all cyno-capable characters
    const pb = await getPocketBaseInstance();
    const allRecords = await pb.collection('characters').getFullList({
      sort: '-created',
      fields: `
        id,
        character_id,
        character_name,
        solar_system_id,
        solar_system_name,
        ship_type_id,
        cyno_skill_level,
        is_auth_valid
      `,
    });

    // Pre-fetch all ship names and system names to avoid multiple DB calls
    const shipNames = new Map();
    const systemNames = new Map();

    await Promise.all([
      ...new Set(allRecords.map(c => c.ship_type_id)),
    ].map(async shipId => {
      const name = await getShipNameById(shipId);
      shipNames.set(shipId, name);
    }));

    await Promise.all([
      ...new Set(allRecords.map(c => c.solar_system_id)),
    ].map(async systemId => {
      const name = await getSystemNameById(systemId);
      systemNames.set(systemId, name);
    }));

    // Process each system in priority order
    const results = {};

    for (const system of sortedSystems) {
      const systemResults = [];
      let availableCynos = allRecords
        .filter(c => c.cyno_skill_level > 0 && c.is_auth_valid)
        .filter(c => !system.excludedCharacters?.includes(c.character_id))
        .filter(c => !assignedCynos.has(c.character_id));

      // If there's a locked cyno for this system, only use that one
      if (system.lockedCyno) {
        availableCynos = availableCynos.filter(c => 
          c.character_id === system.lockedCyno || 
          assignedCynos.get(c.character_id)?.systemId === system.systemId
        );
      }

      // Get routes for available cynos
      const routePromises = availableCynos.map(async (cynoChar) => {
        try {
          // Get system name either from pre-fetched map or character data
          const originSystemName = systemNames.get(cynoChar.solar_system_id) || 
                                 cynoChar.solar_system_name || 
                                 'Unknown System';

          // Get ship name from pre-fetched map
          const shipType = shipNames.get(cynoChar.ship_type_id) || 'Unknown Ship';

          if (!cynoChar.solar_system_id) {
            return {
              cynoChar,
              route: {
                jumps: Infinity,
                characterName: cynoChar.character_name,
                currentSystem: originSystemName,
                shipType,
                colorCode: 'red'
              }
            };
          }

          const routeUrl = `https://esi.evetech.net/latest/route/${cynoChar.solar_system_id}/${system.systemId}/`;
          const routeRes = await fetch(routeUrl);
          
          if (!routeRes.ok) {
            return {
              cynoChar,
              route: {
                jumps: Infinity,
                characterName: cynoChar.character_name,
                currentSystem: originSystemName,
                shipType,
                colorCode: 'red',
                noRouteFound: true
              }
            };
          }

          const routeData = await routeRes.json();
          const jumps = routeData.length > 1 ? routeData.length - 1 : 0;

          return {
            cynoChar,
            route: {
              jumps,
              characterName: cynoChar.character_name,
              currentSystem: originSystemName,
              shipType,
              colorCode: getJumpColorCode(jumps)
            }
          };
        } catch (error) {
          console.error(`Route fetch failed for ${cynoChar.character_id}:`, error);
          return {
            cynoChar,
            route: {
              jumps: Infinity,
              characterName: cynoChar.character_name,
              currentSystem: systemNames.get(cynoChar.solar_system_id) || 'Unknown',
              shipType: shipNames.get(cynoChar.ship_type_id) || 'Unknown Ship',
              colorCode: 'red',
              error: true
            }
          };
        }
      });

      const routeResults = await Promise.all(routePromises);
      
      // Sort by jumps and handle locked cyno
      let sortedRoutes = routeResults.sort((a, b) => a.route.jumps - b.route.jumps);

      // If there's a locked cyno, it should be the only result
      if (system.lockedCyno) {
        sortedRoutes = sortedRoutes.filter(r => 
          r.cynoChar.character_id === system.lockedCyno
        );
      } else {
        // Otherwise take top 2
        sortedRoutes = sortedRoutes.slice(0, 2);
      }

      // Assign cynos and build results
      sortedRoutes.forEach(({ cynoChar, route }) => {
        // Mark cyno as assigned
        assignedCynos.set(cynoChar.character_id, {
          systemId: system.systemId,
          priority: system.priority,
          systemName: system.systemName
        });

        systemResults.push({
          ...route,
          characterId: cynoChar.character_id,
          isLocked: cynoChar.character_id === system.lockedCyno
        });
      });

      // Add assigned cynos to results
      const assignedResults = allRecords
        .filter(c => 
          assignedCynos.has(c.character_id) && 
          !sortedRoutes.find(r => r.cynoChar.character_id === c.character_id)
        )
        .map(c => {
          const assignment = assignedCynos.get(c.character_id);
          return {
            characterName: c.character_name,
            currentSystem: systemNames.get(c.solar_system_id) || 'Unknown',
            shipType: shipNames.get(c.ship_type_id) || 'Unknown Ship',
            jumps: Infinity,
            characterId: c.character_id,
            colorCode: 'grey',
            assignedTo: {
              priority: assignment.priority,
              systemId: assignment.systemId,
              systemName: assignment.systemName
            }
          };
        });

      results[system.systemId] = {
        available: systemResults,
        assigned: assignedResults,
        systemId: system.systemId,
        priority: system.priority
      };
    }

    return res.status(200).json({
      success: true,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in findCynos:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error',
    });
  }
}