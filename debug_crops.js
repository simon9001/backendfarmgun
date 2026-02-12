import { supabase } from './src/db/supabaseClient.js';

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
        .limit(5);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(JSON.stringify(crops, null, 2));

    if (crops && crops.length > 0) {
        crops.forEach(crop => {
            if (!crop.featured_media_id) {
                console.log(`Crop "${crop.name}" has NO featured_media_id`);
            } else if (!crop.featured_media) {
                console.log(`Crop "${crop.name}" HAS featured_media_id but JOIN FAILED`);
            }
        });
    }
}

debugCrops();
