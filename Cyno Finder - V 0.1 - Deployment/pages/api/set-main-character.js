import { getPocketBaseInstance } from '../../utils/pocketbase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send({ error: 'Method not allowed' });
    return;
  }

  const { userId, mainCharacterId } = req.body;

  if (!userId || !mainCharacterId) {
    res.status(400).send({ error: 'Invalid request' });
    return;
  }

  const pb = await getPocketBaseInstance();

  try {
    await pb.collection('eve_users').update(userId, { main_character_id: mainCharacterId });
    res.status(200).send({ success: true });
  } catch (error) {
    console.error('Failed to set main character:', error);
    res.status(500).send({ error: 'Failed to set main character' });
  }
}
