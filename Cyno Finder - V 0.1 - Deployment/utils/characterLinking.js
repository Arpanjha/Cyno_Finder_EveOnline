import { getPocketBaseInstance } from './pocketbase';

export async function linkCharacterToUser(userId, characterId, collection = 'eve_users') {
  const pb = await getPocketBaseInstance();
  
  try {
    const user = await pb.collection(collection).getOne(userId);
    
    // Ensure linked_character_ids exists and is an array
    const linkedCharacterIds = Array.isArray(user.linked_character_ids) 
      ? user.linked_character_ids 
      : [];

    // Prevent duplicate character links
    if (!linkedCharacterIds.includes(characterId)) {
      linkedCharacterIds.push(characterId);
      
      // Update user with new linked characters
      await pb.collection(collection).update(userId, {
        linked_character_ids: linkedCharacterIds,
        updated: new Date().toISOString(),
        // Conditionally set main character if not set
        ...(user.main_character_id ? {} : { main_character_id: characterId })
      });
    }

    return {
      success: true,
      linkedCharacters: linkedCharacterIds
    };
  } catch (error) {
    console.error('Character linking failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function getLinkedCharacters(userId, collection = 'eve_users') {
  const pb = await getPocketBaseInstance();
  
  try {
    const user = await pb.collection(collection).getOne(userId);
    return user.linked_character_ids || [];
  } catch (error) {
    console.error('Failed to fetch linked characters:', error);
    return [];
  }
}