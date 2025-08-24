import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { RAWG_API_KEY } from '$env/static/private';

const RAWG_API_URL = 'https://api.rawg.io/api';

export const GET: RequestHandler = async ({ url }) => {
    const gameId = url.searchParams.get('id');

    if (!gameId) {
        return json({ error: 'Game ID is required' }, { status: 400 });
    }

    try {
        const response = await fetch(`${RAWG_API_URL}/games/${gameId}?key=${RAWG_API_KEY}`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to fetch data from RAWG.io' }));
            return json({ error: 'API request failed', details: errorData }, { status: response.status });
        }

        const data = await response.json();

        const gameDetails = {
            developer: data.developers?.map((dev: any) => dev.name) || [],
            publisher: data.publishers?.[0]?.name || '',
            series: data.series?.name || '',
        };

        return json(gameDetails);

    } catch (error) {
        console.error('Error fetching game details from RAWG.io:', error);
        return json({ error: 'An internal error occurred' }, { status: 500 });
    }
};
