//// utils/shipnamelookup.js
import { getPocketBaseInstance } from './pocketbase';

export async function getShipNameById(shipTypeId) {
  const pb = await getPocketBaseInstance();

  try {
    // Adjust filter to match your field name in PocketBase
    const record = await pb.collection('ship_data').getFirstListItem(`ship_type_id=${shipTypeId}`);
    return record.shipname || 'Unknown Ship';
  } catch (error) {
    console.error('Error fetching ship name:', error);
    return 'Unknown Ship';
  }
}