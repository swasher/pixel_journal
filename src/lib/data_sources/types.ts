/**
 * Defines the common structure for a search result item returned by a provider.
 */
export interface GameSearchResult {
    id: string | number;
    title: string;
    year: number | null;
    image_url: string;
    [key: string]: any; // Allow other provider-specific properties
}

/**
 * Defines the common structure for detailed game information returned by a provider.
 */
export interface GameDetailsResult {
    developer: string[];
    publisher: string[];
    series: string;
    [key: string]: any; // Allow other provider-specific properties
}

/**
 * Defines the interface that every data source provider must implement.
 */
export interface IGameDataProvider {
    search(query: string, apiKey: string, authData?: { [key: string]: any }): Promise<GameSearchResult[]>;
    getDetails(gameId: string, apiKey: string, authData?: { [key: string]: any }): Promise<GameDetailsResult | null>;
}
