import { rawgProvider } from "./rawg_provider";
import { igdbProvider } from "./igdb_provider";
import type { GameSearchResult, GameDetailsResult } from "./types";

export type DataSource = 'rawg' | 'igdb';

const providers = {
    rawg: rawgProvider,
    igdb: igdbProvider
};

export function getProvider(source: DataSource) {
    return providers[source];
}

/**
 * Searches for a game using the specified data source and API key.
 * @param source The data source to use ('rawg' or 'igdb').
 * @param query The search query.
 * @param apiKey The user's API key for the specified data source.
 * @param authData Optional authentication data, e.g., for IGDB OAuth.
 */
export async function search(source: DataSource, query: string, apiKey: string, authData?: { [key: string]: any }): Promise<GameSearchResult[]> {
    const provider = getProvider(source);
    return provider.search(query, apiKey, authData);
}

/**
 * Gets detailed information for a game using the specified data source.
 * @param source The data source to use ('rawg' or 'igdb').
 * @param gameId The ID of the game.
 * @param apiKey The user's API key for the specified data source.
 * @param authData Optional authentication data, e.g., for IGDB OAuth.
 */
export async function getDetails(source: DataSource, gameId: string, apiKey: string, authData?: { [key: string]: any }): Promise<GameDetailsResult | null> {
    const provider = getProvider(source);
    return provider.getDetails(gameId, apiKey, authData);
}
