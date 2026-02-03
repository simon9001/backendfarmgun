import axios from 'axios';
import { env } from '../db/envConfig.js';

export class MpesaService {
    private static getDarajaUrl(endpoint: string): string {
        const baseUrl = env.NODE_ENV === 'production'
            ? 'https://api.safaricom.co.ke'
            : 'https://sandbox.safaricom.co.ke';
        return `${baseUrl}/${endpoint}`;
    }

    private static async getAccessToken(): Promise<string> {
        const auth = Buffer.from(
            `${env.DARAJA_CONSUMER_KEY}:${env.DARAJA_CONSUMER_SECRET}`
        ).toString('base64');

        try {
            const url = this.getDarajaUrl('oauth/v1/generate?grant_type=client_credentials');
            console.log(`Attempting M-Pesa OAuth at: ${url}`);

            const response = await axios.get(url, {
                headers: {
                    Authorization: `Basic ${auth}`,
                },
            });
            console.log('✅ M-Pesa OAuth token generated successfully');
            return response.data.access_token;
        } catch (error: any) {
            const errorInfo = {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            };
            console.error('❌ M-Pesa OAuth failed:', JSON.stringify(errorInfo, null, 2));
            throw error;
        }
    }

    static async initiateStkPush(
        phoneNumber: string,
        amount: number,
        accountReference: string,
        transactionDesc: string
    ) {
        const accessToken = await this.getAccessToken();
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);

        // daraja_shortcode is typically the BusinessShortCode
        const password = Buffer.from(
            `${env.DARAJA_SHORTCODE}${env.DARAJA_PASSKEY}${timestamp}`
        ).toString('base64');

        // Mpesa numbers must be in 2547XXXXXXXX format
        let formattedPhone = phoneNumber.replace(/[^0-9]/g, '');
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '254' + formattedPhone.slice(1);
        } else if (formattedPhone.length === 9 && (formattedPhone.startsWith('7') || formattedPhone.startsWith('1'))) {
            formattedPhone = '254' + formattedPhone;
        }

        const payload = {
            BusinessShortCode: env.DARAJA_SHORTCODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: Math.round(amount),
            PartyA: formattedPhone,
            PartyB: env.DARAJA_SHORTCODE,
            PhoneNumber: formattedPhone,
            CallBackURL: `${env.BASE_URL}/api/payments/callback`,
            AccountReference: accountReference,
            TransactionDesc: transactionDesc,
        };

        const response = await axios.post(
            this.getDarajaUrl('mpesa/stkpush/v1/processrequest'),
            payload,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        return response.data;
    }
}
