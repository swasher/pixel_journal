import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { RAWG_API_KEY } from '$env/static/private';

const RAWG_API_URL = 'https://api.rawg.io/api';

export const GET: RequestHandler = async ({ url }) => {
	const searchQuery = url.searchParams.get('q');

	if (!searchQuery) {
		return json({ error: 'Search query is required' }, { status: 400 });
	}

	try {
		const response = await fetch(`${RAWG_API_URL}/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(searchQuery)}&search_precise=true&ordering=-rating&platforms=4`); // 4 = PC

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ message: 'Failed to fetch data from RAWG.io' }));
			return json({ error: 'API request failed', details: errorData }, { status: response.status });
		}

		const data = await response.json();

		const games = data.results.map((game: any) => ({
			id: game.id,
			title: game.name,
			year: game.released ? new Date(game.released).getFullYear() : null,
			image_url: game.background_image,
			genres: game.genres?.map((genre: any) => genre.name) || [],
		}));

		return json(games);

	} catch (error) {
		console.error('Error fetching from RAWG.io:', error);
		return json({ error: 'An internal error occurred' }, { status: 500 });
	}
};
