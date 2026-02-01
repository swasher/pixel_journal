import type { IGameDataProvider, GameSearchResult, GameDetailsResult } from "./types";

const IGDB_API_URL = 'https://api.igdb.com/v4/games';

class IgdbProvider implements IGameDataProvider {
    async search(query: string, apiKey: string, authData?: { [key: string]: any }): Promise<GameSearchResult[]> {
        console.log("IGDB search called with query:", query);

        const accessToken = authData?.accessToken;
        if (!accessToken) {
            console.error("IGDB search requires an access token.");
            return [];
        }

        const body = `search "${query}"; fields name, first_release_date, cover.url, genres.name; limit 20;`;

        try {
            const response = await fetch(IGDB_API_URL, {
                method: 'POST',
                headers: {
                    'Client-ID': apiKey,
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                },
                body: body
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`IGDB search failed with status: ${response.status}`, errorText);
                return [];
            }

            const data = await response.json();

            // Map IGDB data to our common format
            const games: GameSearchResult[] = data.map((game: any) => ({
                id: game.id,
                title: game.name,
                year: game.first_release_date ? new Date(game.first_release_date * 1000).getFullYear() : null,
                // IGDB image URLs need modification for better quality
                image_url: game.cover?.url ? game.cover.url.replace('t_thumb', 't_cover_big') : '',
                // Extract genre names from the genres array
                genres: game.genres?.map((genre: any) => genre.name) || []
            }));

            return games;

        } catch (error) {
            console.error("Error during IGDB search:", error);
            return [];
        }
    }

    async getDetails(gameId: string, apiKey: string, authData?: { [key: string]: any }): Promise<GameDetailsResult | null> {
        console.log("IGDB getDetails called for gameId:", gameId);
        console.log("AuthData received:", authData);

        const accessToken = authData?.accessToken;
        if (!accessToken) {
            console.error("IGDB getDetails requires an access token.");
            return null;
        }

        // IGDB API endpoint for games
        const IGDB_GAMES_URL = 'https://api.igdb.com/v4/games';

        // Query to get detailed information about the specific game
        // We need to get involved companies (for developers/publishers) and collection (for series)
        const body = `fields involved_companies.company.name, involved_companies.developer, involved_companies.publisher, collection.name; where id = ${gameId};`;

        try {
            const response = await fetch(IGDB_GAMES_URL, {
                method: 'POST',
                headers: {
                    'Client-ID': apiKey,
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                },
                body: body
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`IGDB details fetch failed with status: ${response.status}`, errorText);
                return null;
            }

            const data = await response.json();

            if (!data || data.length === 0) {
                console.log(`No details found for game ID: ${gameId}`);
                return null;
            }

            const game = data[0];

            // Extract developer and publisher info from involved companies
            const developers = game.involved_companies
                ?.filter((company: any) => company.developer === true)
                .map((company: any) => company.company.name) || [];

            const publishers = game.involved_companies
                ?.filter((company: any) => company.publisher === true)
                .map((company: any) => company.company.name) || [];

            // Extract series information (using collection field in IGDB)
            const series = game.collection?.name || '';

            const gameDetails: GameDetailsResult = {
                developer: developers,
                publisher: publishers,
                series: series
            };

            return gameDetails;

        } catch (error) {
            console.error("Error during IGDB getDetails:", error);
            return null;
        }
    }
}

export const igdbProvider = new IgdbProvider();
