import type { IGameDataProvider, GameSearchResult, GameDetailsResult } from "./types";

const RAWG_API_URL = 'https://api.rawg.io/api';

class RawgProvider implements IGameDataProvider {
    async search(query: string, apiKey: string): Promise<GameSearchResult[]> {
        if (!query || !apiKey) {
            return [];
        }

        const response = await fetch(`${RAWG_API_URL}/games?key=${apiKey}&search=${encodeURIComponent(query)}&page_size=20&search_precise=true&platforms=4`); // 4 = PC

        if (!response.ok) {
            console.error(`RAWG search failed with status: ${response.status}`);
            // In a real app, you might want to throw an error or handle it differently
            return [];
        }

        const data = await response.json();

        // Map the RAWG data to our common GameSearchResult format
        const games: GameSearchResult[] = data.results.map((game: any) => ({
            id: game.id,
            title: game.name,
            year: game.released ? new Date(game.released).getFullYear() : null,
            image_url: game.background_image,
            // We can keep the original genres structure here for the final mapping stage
            genres: game.genres?.map((genre: any) => genre.name) || [],
        }));

        return games;
    }

    async getDetails(gameId: string, apiKey: string): Promise<GameDetailsResult | null> {
        if (!gameId || !apiKey) {
            return null;
        }

        const response = await fetch(`${RAWG_API_URL}/games/${gameId}?key=${apiKey}`);

        if (!response.ok) {
            console.error(`RAWG details fetch failed with status: ${response.status}`);
            return null;
        }

        const data = await response.json();

        // Map the RAWG data to our common GameDetailsResult format
        const gameDetails: GameDetailsResult = {
            developer: data.developers?.map((dev: any) => dev.name) || [],
            publisher: data.publishers?.map((pub: any) => pub.name) || [],
            series: data.game_series_count > 0 && data.stores ? data.stores[0].store.name : '' // Example of adapting a field
        };

        return gameDetails;
    }
}

export const rawgProvider = new RawgProvider();
