import { userSettings } from "./stores/userSettings";
import type { UserSettings } from "./stores/userSettings";

/**
 * Returns a promise that resolves with the user settings object once they are loaded from Firestore.
 */
function getReadySettings(): Promise<UserSettings> {
    return new Promise(resolve => {
        let unsubscribe: () => void;
        unsubscribe = userSettings.subscribe(settings => {
            if (settings.isReady) {
                if (unsubscribe) {
                    unsubscribe();
                }
                resolve(settings);
            }
        });
    });
}

/**
 * A centralized API client to communicate with our own backend API routes.
 * It automatically injects the necessary data source and authentication based on user settings.
 */

async function makeApiRequest(endpoint: string, queryParams: Record<string, string>) {
    console.log('[apiClient] Waiting for settings to be ready...');
    const settings = await getReadySettings();
    console.log('[apiClient] Settings are ready. Received settings:', settings);

    const { dataSource, rawgApiKey, igdbClientId, igdbAccessToken } = settings;

    // Determine the correct API key to use
    const apiKey = dataSource === 'rawg' ? rawgApiKey : igdbClientId; // Using Client ID for IGDB for now

    if (!apiKey) {
        // In a real UI, we would show a more user-friendly message
        throw new Error(`API key for the selected data source '${dataSource}' is not set.`);
    }

    // Add the data source to the query parameters
    queryParams.source = dataSource;

    const url = new URL(endpoint, window.location.origin);
    url.search = new URLSearchParams(queryParams).toString();

    const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'X-IGDB-Access-Token': igdbAccessToken || ''
    };

    console.log(`[apiClient] Making request to ${url.toString()} with headers:`, headers);

    const response = await fetch(url.toString(), {
        headers: headers
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
        throw new Error(`API request failed: ${errorData.message || response.statusText}`);
    }

    return response.json();
}

export async function searchGames(query: string) {
    return makeApiRequest('/api/search-game', { q: query });
}

export async function getGameDetails(gameId: string | number) {
    return makeApiRequest('/api/game-details', { id: String(gameId) });
}
