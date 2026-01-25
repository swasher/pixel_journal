import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDetails as dispatchGetDetails, type DataSource } from '$lib/data_sources';

export const GET: RequestHandler = async ({ url, request }) => {
    const gameId = url.searchParams.get('id');
    const source = url.searchParams.get('source') as DataSource;

    if (!gameId) {
        throw error(400, 'Game ID (id) is required');
    }

    if (!source || !['rawg', 'igdb'].includes(source)) {
        throw error(400, 'A valid data source (source=rawg or source=igdb) is required');
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw error(401, 'Authorization header with Bearer token (the API key) is required');
    }
    const apiKey = authHeader.split(' ')[1];
    const igdbAccessToken = request.headers.get('X-IGDB-Access-Token');

    try {
        const authData = { accessToken: igdbAccessToken || '' };

        const results = await dispatchGetDetails(source, gameId, apiKey, authData);
        if (results) {
            return json(results);
        } else {
            throw error(404, `Game with id ${gameId} not found in ${source}.`);
        }

    } catch (e: any) {
        console.error(`Failed to get details for game ${gameId} from data source '${source}':`, e);
        throw error(500, `An internal error occurred while getting details via ${source}: ${e.message}`);
    }
};