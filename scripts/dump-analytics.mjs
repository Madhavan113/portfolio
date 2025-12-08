import { list } from '@vercel/blob';

// --- Configuration ---
const FOLDER_PATH = 'visits/';

/**
 * Downloads all JSON files from Vercel Blob and prints location data.
 * 
 * Run with: BLOB_READ_WRITE_TOKEN=your_token node scripts/dump-analytics.js
 */
async function dumpBlobLocations() {
  console.log(`\n📊 Starting to list files in: ${FOLDER_PATH}`);
  
  try {
    // 1. List all files in the visits folder
    const { blobs } = await list({
      prefix: FOLDER_PATH,
      limit: 1000,
    });

    if (blobs.length === 0) {
      console.log('No files found in the specified folder.');
      return;
    }

    console.log(`Found ${blobs.length} visits. Processing...\n`);

    const visits = [];

    // 2. Fetch each JSON file
    for (const blob of blobs) {
      if (blob.pathname.endsWith('.json')) {
        try {
          const res = await fetch(blob.url);
          const data = await res.json();
          visits.push(data);

          if (data.location) {
            console.log(`✅ ${data.location.city}, ${data.location.region}, ${data.location.country}`);
            console.log(`   📍 ${data.location.lat}, ${data.location.lon}`);
            console.log(`   🌐 ${data.page} | ${new Date(data.timestamp).toLocaleString()}`);
            console.log(`   🏢 ${data.location.isp}`);
            console.log('');
          } else {
            console.log(`⚠️  No location data for visit at ${data.timestamp}`);
          }
        } catch (e) {
          console.error(`❌ Error parsing ${blob.pathname}: ${e.message}`);
        }
      }
    }

    // 3. Print summary
    console.log('\n--- Summary ---');
    console.log(`Total visits: ${visits.length}`);
    
    // Count by country
    const countries = {};
    const cities = {};
    visits.forEach(v => {
      if (v.location) {
        countries[v.location.country] = (countries[v.location.country] || 0) + 1;
        cities[v.location.city] = (cities[v.location.city] || 0) + 1;
      }
    });

    console.log('\nBy Country:');
    Object.entries(countries)
      .sort((a, b) => b[1] - a[1])
      .forEach(([country, count]) => console.log(`  ${country}: ${count}`));

    console.log('\nBy City:');
    Object.entries(cities)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([city, count]) => console.log(`  ${city}: ${count}`));

    console.log('\n--- Processing complete ---');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Make sure BLOB_READ_WRITE_TOKEN is set correctly.');
  }
}

dumpBlobLocations();

