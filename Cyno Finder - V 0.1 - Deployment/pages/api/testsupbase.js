import PocketBase from 'pocketbase';

const pb = new PocketBase('https://tangerine-serval.pikapod.net');

async function createCharacter() {
  const data = {
    character_id: 2113185696,
    character_name: 'Alia Collins',
    corporation_id: 98079862,
    currentSolarSystemID: 30000142,
    cyno_skill_level: 5,
    ship_type_id: 603, // Example ship type
    user_id: 'user123', // Replace with actual user ID
    access_token: 'your-access-token',
    refresh_token: 'your-refresh-token',
  };

  try {
    const record = await pb.collection('characters').create(data);
    console.log('Record created:', record);
  } catch (error) {
    console.error('Error creating record:', error);
  }
}

createCharacter();
