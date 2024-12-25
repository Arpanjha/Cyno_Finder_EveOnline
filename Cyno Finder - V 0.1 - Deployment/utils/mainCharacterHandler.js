import { getPocketBaseInstance } from './pocketbase';

export async function handleMainCharacterAndLinks(userId, characterId) {
  const pb = await getPocketBaseInstance();

  // Fetch the user by ID
  const user = await pb.collection('eve_users').getOne(userId);

  // Ensure linked_character_ids exists and is an array
  let linkedCharacterIds = user.linked_character_ids || [];

  // Set main_character_id if it's not already set
  if (!user.main_character_id) {
    await pb.collection('eve_users').update(userId, { main_character_id: characterId });
    console.log('Main character set:', characterId);
  }

  // Add the character to linked_character_ids if not already present
  if (!linkedCharacterIds.includes(characterId)) {
    linkedCharacterIds.push(characterId);
    await pb.collection('eve_users').update(userId, { linked_character_ids: linkedCharacterIds });
    console.log('Updated linked_character_ids:', linkedCharacterIds);
  }
}
