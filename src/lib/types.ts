export interface GameData {
    id: string;
    rawg_id: number;
    title: string;
    year: number | null;
    image_url: string;
    developer?: string[];
    publisher?: string[];
    genres?: string[];
    series?: string;
    user_note?: string;
    is_favorite?: boolean;
    user_rating?: number;
    play_time?: number;
    markdown_content?: string;
    status: string;
    date_added?: Date;
    tags?: string[];
}
