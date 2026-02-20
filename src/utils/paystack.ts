import axios from 'axios';
import { env } from '../db/envConfig.js';

const PAYSTACK_SECRET_KEY = env.PAYSTACK_SECRET_KEY;

if (PAYSTACK_SECRET_KEY?.startsWith('pk_')) {
    console.warn('⚠️ Warning: PAYSTACK_SECRET_KEY appears to be a Public Key (starts with pk_). Use the Secret Key (starts with sk_) for backend operations.');
}


export const initializeTransaction = async (email: string, amount: number, metadata: any) => {
    try {
        const response = await axios.post(
            'https://api.paystack.co/transaction/initialize',
            {
                email,
                amount: Math.round(amount * 100), // Paystack expects amount in sub-units (kobo/cents/etc)
                metadata,
                callback_url: `${process.env.CORS_ORIGIN}/payment-callback`, // Frontend callback
            },
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        return response.data;
    } catch (error: any) {
        console.error('Paystack initialize error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to initialize Paystack transaction');
    }
};

export const verifyTransaction = async (reference: string) => {
    try {
        const response = await axios.get(
            `https://api.paystack.co/transaction/verify/${reference}`,
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                },
            }
        );

        return response.data;
    } catch (error: any) {
        console.error('Paystack verify error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to verify Paystack transaction');
    }
};

export const chargeMpesa = async (email: string, amount: number, phone: string, metadata: any, reference?: string) => {
    try {
        const response = await axios.post(
            'https://api.paystack.co/charge',
            {
                email,
                amount: Math.round(amount * 100),
                metadata,
                reference,
                mobile_money: {
                    phone,
                    provider: 'mpesa',
                },
            },

            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        return response.data;
    } catch (error: any) {
        console.error('Paystack charge error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to initiate M-Pesa charge');
    }
};
