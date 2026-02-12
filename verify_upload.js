import jwt from 'jsonwebtoken';

const JWT_SECRET = '8888ihugyu99u9ujijiji-jihhiu-99u9ujijiji-jihhi8888';
const ADMIN_USER_ID = 'f0e1e858-5497-4d2d-929c-a8ea0934b598'; // Valid UUID from Supabase
const token = jwt.sign({ userId: ADMIN_USER_ID, role: 'admin' }, JWT_SECRET);

async function verifyUpload() {
    console.log('Final verification of media upload...');

    const formData = new FormData();
    // 1x1 transparent PNG
    const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });

    formData.append('file', blob, 'test.png');
    formData.append('category', 'general');

    try {
        const response = await fetch('http://localhost:3001/api/media/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const result = await response.json();
        console.log('Status:', response.status);
        console.log('Result Full:', JSON.stringify(result, null, 2));

        if (response.status === 201 || response.status === 200) {
            console.log('SUCCESS: Upload working correctly!');
        } else {
            console.log('FAILURE: Upload failed');
        }
    } catch (error) {
        console.error('ERROR during verification:', error.message);
    }
}

verifyUpload();
