import { supabase } from './src/db/supabaseClient.js';

async function listMedia() {
    const { data: media, error } = await supabase
        .from('media_library')
        .select('*');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('--- Media Library ---');
    media.forEach(m => {
        console.log(`ID: ${m.id} | Public ID: ${m.public_id} | URL: ${m.url}`);
    });
}

listMedia();
