// utils/pocketbase.js
import PocketBase from 'pocketbase';

let pb = null;
let authPromise = null;

export async function getPocketBaseInstance() {
  if (!pb) {
    pb = new PocketBase(process.env.POCKETBASE_URL);
    // ▼ Disable auto-cancellation for all subsequent calls
    pb.autoCancellation(false);
  }

  // If we're not authenticated and not currently authenticating
  if (!pb.authStore.isValid && !authPromise) {
    authPromise = pb.admins.authWithPassword(
      process.env.POCKETBASE_EMAIL,
      process.env.POCKETBASE_PASSWORD
    ).then(() => {
      console.log('PocketBase admin authenticated successfully');
      authPromise = null;
    }).catch((error) => {
      console.error('PocketBase authentication failed:', error);
      pb = null;
      authPromise = null;
      throw error;
    });
  }

  // Wait for authentication if it's in progress
  if (authPromise) {
    await authPromise;
  }

  return pb;
}

// Helper function to handle retries with auto-cancellation prevention
export async function withRetry(operation, maxRetries = 3) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const pb = await getPocketBaseInstance();
      return await operation(pb);
    } catch (error) {
      lastError = error;
      
      if (error.isAbort) {
        // If it's an abort error, retry immediately with cancelKey option
        try {
          const pb = await getPocketBaseInstance();
          return await operation(pb, { $cancelKey: `retry_${i}` });
        } catch (retryError) {
          lastError = retryError;
          continue;
        }
      }
      
      throw error;
    }
  }
  
  throw lastError;
}