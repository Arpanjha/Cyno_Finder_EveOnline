// utils/systemLookup.js

import { getPocketBaseInstance } from './pocketbase';

export async function getSystemNameById(solarSystemID) {
  const pb = await getPocketBaseInstance();

  try {
    // Adjust your filter to match your PocketBase field name 
    // (if stored as an integer, you may need `solarSystemID = ${solarSystemID}` 
    //  or if it’s a string, `solarSystemID = "${solarSystemID}"`)
    const record = await pb.collection('solar_systems')
      .getFirstListItem(`solarSystemID=${solarSystemID}`);
    
    return record.solarSystemName || 'Unknown System';
  } catch (error) {
    console.error('Error fetching system name:', error);
    return 'Unknown System';
  }
}
