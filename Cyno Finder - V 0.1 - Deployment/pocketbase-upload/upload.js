import PocketBase from 'pocketbase';
import fs from 'fs';

const pb = new PocketBase('https://tangerine-serval.pikapod.net/'); // Replace with your PocketBase URL

async function uploadStaticData(jsonFilePath, chunkSize = 500) {
  try {
    // Authenticate as admin
    await pb.admins.authWithPassword('spam4arpan@gmail.com', 'arPOCKETBASE@8790');

    // Load JSON data
    const data = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));

    // Split data into chunks
    const chunks = [];
    for (let i = 0; i < data.length; i += chunkSize) {
      chunks.push(data.slice(i, i + chunkSize));
    }

    // Upload each chunk
    for (const [index, chunk] of chunks.entries()) {
      console.log(`Uploading chunk ${index + 1} of ${chunks.length}...`);
      for (const record of chunk) {
        try {
          const createdRecord = await pb.collection('ship_data').create(record);
          console.log('Record created:', createdRecord.ship_type_id);
        } catch (err) {
          console.error('Error creating record:', err.message || err);
        }
      }
    }

    console.log('Upload completed!');
  } catch (err) {
    console.error('Error during upload:', err.message || err);
  }
}

// Path to your JSON file
const jsonFilePath = './ship_data.json'; // Replace with the path to your JSON file

// Start the upload process
uploadStaticData(jsonFilePath);
