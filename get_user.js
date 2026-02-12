const SUPABASE_URL = 'https://jjmwnrmlaxpvojoctete.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqbXducm1sYXhwdm9qb2N0ZXRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTM1Mzk5NywiZXhwIjoyMDg0OTI5OTk3fQ.JNWwlblm1XLz0ymoliLlYpREtH4DLyk63W6IAj6_KJ8';

async function getAdminUser() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/users?role=eq.admin&limit=1`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        const users = await response.json();
        if (users && users.length > 0) {
            console.log('Valid Admin User:', JSON.stringify(users[0], null, 2));
        } else {
            console.log('No admin user found.');
        }
    } catch (error) {
        console.error('Error fetching user:', error.message);
    }
}

getAdminUser();
