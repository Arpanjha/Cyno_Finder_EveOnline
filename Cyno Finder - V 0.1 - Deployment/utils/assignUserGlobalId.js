const assignUserGlobalId = async (ownerHash, characterId) => {
    const pb = await getPocketBaseInstance();
  
    // Check if the owner_hash already exists in the users table
    let user;
    try {
      user = await pb.collection('users').getFirstListItem(
        `owner_hashes @> ["${ownerHash}"]`
      ).catch(() => null);
    } catch (error) {
      console.error('Error fetching user with owner_hash:', error);
      throw error;
    }
  
    if (user) {
      console.log(`Existing user found with user_global_id: ${user.user_global_id}`);
  
      // Add the character to linked_character_ids if not already present
      const linkedCharacters = Array.isArray(user.linked_character_ids) ? user.linked_character_ids : [];
      if (!linkedCharacters.includes(characterId)) {
        linkedCharacters.push(characterId);
  
        try {
          await pb.collection('users').update(user.id, {
            linked_character_ids: linkedCharacters,
            updated: new Date().toISOString(),
          });
          console.log('Updated linked_character_ids:', linkedCharacters);
        } catch (error) {
          console.error('Failed to update linked_character_ids:', error);
          throw error;
        }
      }
  
      return user.user_global_id;
    }
  
    // If no user exists for this owner_hash, create a new user_global_id
    const userGlobalId = crypto.randomUUID(); // Generate a unique identifier
    const now = new Date().toISOString();
  
    try {
      const newUser = await pb.collection('users').create({
        user_global_id: userGlobalId,
        owner_hashes: [ownerHash],
        linked_character_ids: [characterId],
        main_character_id: characterId, // Set the first character as the main character
        created: now,
        updated: now,
      });
      console.log(`Created new user with user_global_id: ${userGlobalId}`);
      return userGlobalId;
    } catch (error) {
      console.error('Failed to create new user:', error);
      throw error;
    }
};  