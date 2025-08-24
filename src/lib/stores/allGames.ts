import { writable } from 'svelte/store';
import { db } from '../firebase';
import { collection, onSnapshot, query, type DocumentData } from 'firebase/firestore';

interface CachedGameInfo {
    firestoreId: string; // ID документа в Firestore
    rawgId: number;      // ID игры из RAWG.io
    title: string;       // Название игры (для удобства)
    status: 'backlog' | 'completed' | 'rejected' | 'abandoned'; // Статус игры
}

export const allGames = writable<CachedGameInfo[]>([]);
export const allGamesLoading = writable(true);
export const allGamesError = writable<string | null>(null);

// Подписываемся на изменения в коллекции 'games' один раз
const unsubscribe = onSnapshot(query(collection(db, "games")), (querySnapshot) => {
    const fetchedGames: CachedGameInfo[] = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data() as DocumentData;
        fetchedGames.push({
            firestoreId: doc.id,
            rawgId: data.rawg_id,
            title: data.title,
            status: data.status,
        });
    });
    allGames.set(fetchedGames);
    allGamesLoading.set(false);
    allGamesError.set(null);
}, (e) => {
    console.error("Error fetching all games: ", e);
    allGamesError.set("Failed to load all games.");
    allGamesLoading.set(false);
});

// Экспортируем функцию для отписки, если потребуется
export const unsubscribeAllGames = unsubscribe;
