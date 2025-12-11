import axios from 'axios';
import Logger from '../../utils/logger';

interface PayPalConfig {
    clientId: string;
    clientSecret: string;
    mode: 'sandbox' | 'live';
}

interface PayPalOrder {
    id: string;
    status: string;
    links: Array<{
        href: string;
        rel: string;
        method: string;
    }>;
}

interface PayPalCaptureResponse {
    id: string;
    status: string;
    purchase_units: Array<{
        payments: {
            captures: Array<{
                id: string;
                status: string;
                amount: {
                    value: string;
                    currency_code: string;
                };
            }>;
        };
    }>;
}

class PayPalService {
    private config: PayPalConfig;
    private baseURL: string;
    private accessToken: string | null = null;
    private tokenExpiry: number = 0;

    constructor() {
        this.config = {
            clientId: process.env.PAYPAL_CLIENT_ID || '',
            clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
            mode: (process.env.PAYPAL_MODE as 'sandbox' | 'live') || 'sandbox',
        };

        this.baseURL =
            this.config.mode === 'sandbox'
                ? 'https://api-m.sandbox.paypal.com'
                : 'https://api-m.paypal.com';

        if (!this.config.clientId || !this.config.clientSecret) {
            Logger.warn('PayPal credentials not configured');
        }
    }

    /**
     * Get PayPal access token
     */
    private async getAccessToken(): Promise<string> {
        // Return cached token if still valid
        if (this.accessToken && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }

        try {
            const auth = Buffer.from(
                `${this.config.clientId}:${this.config.clientSecret}`
            ).toString('base64');

            const response = await axios.post(
                `${this.baseURL}/v1/oauth2/token`,
                'grant_type=client_credentials',
                {
                    headers: {
                        Authorization: `Basic ${auth}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );

            this.accessToken = response.data.access_token;
            // Set expiry to 5 minutes before actual expiry
            this.tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;

            return this.accessToken;
        } catch (error) {
            Logger.error('Failed to get PayPal access token:', error);
            throw new Error('PayPal authentication failed');
        }
    }

    /**
     * Create a PayPal order for subscription
     */
    async createOrder(
        tierId: string,
        amount: number,
        currency: string = 'USD',
        description: string
    ): Promise<PayPalOrder> {
        try {
            const accessToken = await this.getAccessToken();

            const response = await axios.post(
                `${this.baseURL}/v2/checkout/orders`,
                {
                    intent: 'CAPTURE',
                    purchase_units: [
                        {
                            reference_id: tierId,
                            description,
                            amount: {
                                currency_code: currency,
                                value: amount.toFixed(2),
                            },
                        },
                    ],
                    application_context: {
                        brand_name: 'Sasagram',
                        landing_page: 'NO_PREFERENCE',
                        user_action: 'PAY_NOW',
                        return_url: `${process.env.FRONTEND_URL}/subscription/success`,
                        cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`,
                    },
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            Logger.info(`PayPal order created: ${response.data.id}`);
            return response.data;
        } catch (error: any) {
            Logger.error('Failed to create PayPal order:', error.response?.data || error);
            throw new Error('Failed to create payment order');
        }
    }

    /**
     * Capture payment for an approved order
     */
    async captureOrder(orderId: string): Promise<PayPalCaptureResponse> {
        try {
            const accessToken = await this.getAccessToken();

            const response = await axios.post(
                `${this.baseURL}/v2/checkout/orders/${orderId}/capture`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            Logger.info(`PayPal order captured: ${orderId}`);
            return response.data;
        } catch (error: any) {
            Logger.error('Failed to capture PayPal order:', error.response?.data || error);
            throw new Error('Failed to capture payment');
        }
    }

    /**
     * Verify PayPal webhook signature
     */
    async verifyWebhookSignature(
        webhookId: string,
        headers: any,
        body: any
    ): Promise<boolean> {
        try {
            const accessToken = await this.getAccessToken();

            const response = await axios.post(
                `${this.baseURL}/v1/notifications/verify-webhook-signature`,
                {
                    transmission_id: headers['paypal-transmission-id'],
                    transmission_time: headers['paypal-transmission-time'],
                    cert_url: headers['paypal-cert-url'],
                    auth_algo: headers['paypal-auth-algo'],
                    transmission_sig: headers['paypal-transmission-sig'],
                    webhook_id: webhookId,
                    webhook_event: body,
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            return response.data.verification_status === 'SUCCESS';
        } catch (error) {
            Logger.error('Failed to verify PayPal webhook:', error);
            return false;
        }
    }

    /**
     * Get order details
     */
    async getOrderDetails(orderId: string): Promise<any> {
        try {
            const accessToken = await this.getAccessToken();

            const response = await axios.get(
                `${this.baseURL}/v2/checkout/orders/${orderId}`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            return response.data;
        } catch (error) {
            Logger.error('Failed to get PayPal order details:', error);
            throw new Error('Failed to retrieve order details');
        }
    }
}

export default new PayPalService();
