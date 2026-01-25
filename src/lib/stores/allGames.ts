import { writable } from 'svelte/store';
import { db, user } from '../firebase'; // Импортируем user store
import { collection, onSnapshot, query, type DocumentData } from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/auth';

interface CachedGameInfo {
    firestoreId: string; // ID документа в Firestore
    rawg_id: number;      // ID игры из RAWG.io
    title: string;       // Название игры (для удобства)
    status: 'backlog' | 'completed' | 'rejected' | 'abandoned'; // Статус игры
}

export const allGames = writable<CachedGameInfo[]>([]);
export const allGamesLoading = writable(true);
export const allGamesError = writable<string | null>(null);

let unsubscribeFromFirestore: Unsubscribe | null = null;

// Подписываемся на изменения в состоянии пользователя
const unsubscribeFromAuth = user.subscribe(currentUser => {
    console.log('allGames store: User subscription triggered. currentUser:', currentUser);

    // Если пользователь вышел, отписываемся от старых данных и очищаем store
    if (unsubscribeFromFirestore) {
        unsubscribeFromFirestore();
        unsubscribeFromFirestore = null;
        console.log('allGames store: Unsubscribed from previous Firestore listener.');
    }

    if (currentUser) {
        console.log('allGames store: User is logged in. UID:', currentUser.uid);
        allGamesLoading.set(true);
        const q = query(collection(db, 'users', currentUser.uid, 'games'));

        unsubscribeFromFirestore = onSnapshot(q, (querySnapshot) => {
            console.log('allGames store: Firestore snapshot received. Docs:', querySnapshot.docs.length);
            const fetchedGames: CachedGameInfo[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data() as DocumentData;
                fetchedGames.push({
                    firestoreId: doc.id,
                    rawg_id: data.rawg_id,
                    title: data.title,
                    status: data.status,
                });
            });
            allGames.set(fetchedGames);
            allGamesLoading.set(false);
            allGamesError.set(null);
        }, (e) => {
            console.error("allGames store: Error fetching all games: ", e);
            allGamesError.set("Failed to load user's games.");
            allGamesLoading.set(false);
        });
    } else {
        // Если пользователя нет (он вышел), очищаем данные
        console.log('allGames store: User is logged out or not yet initialized.');
        allGames.set([]);
        allGamesLoading.set(false);
    }
});

// Экспортируем функцию для отписки от auth store, если потребуется
export const unsubscribeFromAllGamesAuth = unsubscribeFromAuth;
