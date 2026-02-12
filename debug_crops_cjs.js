const { createClient } = require('@supabase/supabase-client');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugCrops() {
    console.log('--- Fetching Crops with Featured Media ---');
    const { data: crops, error } = await supabase
        .from('crops')
        .select(`
      id,
      name,
      featured_media_id,
      featured_media:media_library(
        id,
        public_id,
        url
      )
    `)
        .limit(10);

    if (error) {
        console.error('Error fetching crops:', error);
        return;
    }

    console.log('Total crops found:', crops.length);
    crops.forEach(crop => {
        console.log(`\nCrop: ${crop.name} (ID: ${crop.id})`);
        console.log(`- featured_media_id: ${crop.featured_media_id}`);
        if (crop.featured_media) {
            // Handle potential array
            const fm = Array.isArray(crop.featured_media) ? crop.featured_media[0] : crop.featured_media;
            console.log(`- Featured Media Found: ID=${fm.id}, public_id=${fm.public_id}, url=${fm.url}`);
        } else {
            console.log('- No Featured Media Found (join returned null)');
        }
    });
}

debugCrops();
