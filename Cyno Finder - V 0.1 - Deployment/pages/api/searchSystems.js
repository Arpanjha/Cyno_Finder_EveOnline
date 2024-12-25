import { getPocketBaseInstance } from '../../utils/pocketbase';
import { getSystemNameById } from '@/utils/systemLookup';

export default async function handler(req, res) {
  const { query } = req.query;

  if (!query || query.length < 3) {
    return res.status(400).json({ error: 'Query must be at least 3 characters long' });
  }

  try {
    const pb = await getPocketBaseInstance();

    console.log('Query received:', query);

    // Filter for solarSystemName containing the query
    const records = await pb.collection('solar_systems').getList(1, 10, {
      filter: `solarSystemName ~ "${query}"`, // Match solarSystemName
      fields: 'solarSystemID,solarSystemName', // Return specific fields
      sort: 'solarSystemName' // Sort alphabetically
    });

    console.log('Filtered Records:', records);

    return res.status(200).json(records);
  } catch (error) {
    console.error('Error fetching systems:', error);
    return res.status(500).json({ error: 'Failed to fetch systems', details: error.response });
  }
}
