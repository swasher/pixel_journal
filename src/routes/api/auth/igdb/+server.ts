import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const TWITCH_AUTH_URL = 'https://id.twitch.tv/oauth2/token';

/**
 * Handles the IGDB/Twitch OAuth Client Credentials flow.
 * Receives a client ID and client secret, and exchanges them for an access token.
 */
export const POST: RequestHandler = async ({ request }) => {
    const { clientId, clientSecret } = await request.json();

    if (!clientId || !clientSecret) {
        throw error(400, 'Client ID and Client Secret are required');
    }

    const body = `client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`;

    try {
        const response = await fetch(TWITCH_AUTH_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: body
        });

        const data = await response.json();

        if (!response.ok) {
            const errorMessage = data.message || 'Failed to authenticate with Twitch/IGDB';
            throw error(response.status, errorMessage);
        }

        // Return the successful response which includes access_token, expires_in, token_type
        return json(data);

    } catch (e: any) {
        // Handle potential fetch errors or errors thrown from the response check
        console.error('IGDB Authentication Error:', e);
        const status = e.status || 500;
        const message = e.body?.message || 'An internal server error occurred during authentication.';
        throw error(status, message);
    }
};
