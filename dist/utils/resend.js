import axios from 'axios';
import { env } from '../db/envConfig.js';
const RESEND_API_KEY = env.RESEND_API_KEY;
export const sendEmail = async (to, subject, html) => {
    try {
        const response = await axios.post('https://api.resend.com/emails', {
            from: 'Farm with Irene <no-reply@farmwithirene.online>', // Default for test accounts
            to: [to],
            subject,
            html,
        }, {
            headers: {
                Authorization: `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });
        return { success: true, data: response.data };
    }
    catch (error) {
        console.error('Email send error:', error.response?.data || error.message);
        return { success: false, error: error.response?.data || error.message };
    }
};
//# sourceMappingURL=resend.js.map