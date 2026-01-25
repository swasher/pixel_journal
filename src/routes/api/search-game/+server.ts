import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { search as dispatchSearch, type DataSource } from '$lib/data_sources';

export const GET: RequestHandler = async ({ url, request }) => {
    console.log('[/api/search-game] Received request.');
    const searchQuery = url.searchParams.get('q');
    const source = url.searchParams.get('source') as DataSource;

    if (!searchQuery) {
        throw error(400, 'Search query (q) is required');
    }

    if (!source || !['rawg', 'igdb'].includes(source)) {
        throw error(400, 'A valid data source (source=rawg or source=igdb) is required');
    }

    const authHeader = request.headers.get('Authorization');
    console.log(`[/api/search-game] Auth header: ${authHeader}`);
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw error(401, 'Authorization header with Bearer token (the API key) is required');
    }
    const apiKey = authHeader.split(' ')[1];
    const igdbAccessToken = request.headers.get('X-IGDB-Access-Token');
    console.log(`[/api/search-game] IGDB Access Token from header: ${igdbAccessToken}`);

    try {
        const authData = { accessToken: igdbAccessToken || '' };

        const results = await dispatchSearch(source, searchQuery, apiKey, authData);
        return json(results);

    } catch (e: any) {
        console.error(`Failed to fetch from data source '${source}':`, e);
        throw error(500, `An internal error occurred while searching via ${source}: ${e.message}`);
    }
};