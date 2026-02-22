import axios from 'axios';
import { env } from '../db/envConfig.js';

const RESEND_API_KEY = env.RESEND_API_KEY;


export const sendEmail = async (
    to: string,
    subject: string,
    html: string,
    from: string = 'Farm with Irene <confirmation@farmwithirene.online>'
) => {
    try {
        const response = await axios.post(
            'https://api.resend.com/emails',
            {
                from,
                to: [to],
                subject,
                html,
            },
            {
                headers: {
                    Authorization: `Bearer ${RESEND_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        return { success: true, data: response.data };
    } catch (error: any) {
        console.error('Email send error:', error.response?.data || error.message);
        return { success: false, error: error.response?.data || error.message };
    }
};
