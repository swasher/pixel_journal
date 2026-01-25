import type { IGameDataProvider, GameSearchResult, GameDetailsResult } from "./types";

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

        const body = `search "${query}"; fields name, first_release_date, cover.url; limit 20;`;

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
                image_url: game.cover?.url ? game.cover.url.replace('t_thumb', 't_cover_big') : ''
            }));

            return games;

        } catch (error) {
            console.error("Error during IGDB search:", error);
            return [];
        }
    }

    async getDetails(gameId: string, apiKey: string, authData?: { [key: string]: any }): Promise<GameDetailsResult | null> {
        console.log("IGDB getDetails called for gameId:", gameId, "(NOT IMPLEMENTED)");
        console.log("AuthData received:", authData);

        // IGDB requires an access token which we would get from authData
        if (!authData?.accessToken) {
            console.error("IGDB provider requires an access token.");
            return Promise.resolve(null);
        }

        // For now, return mock details
        return Promise.resolve({
            developer: ['Mock IGDB Dev'],
            publisher: ['Mock IGDB Pub'],
            series: 'Mock Series'
        });
    }
}

export const igdbProvider = new IgdbProvider();
