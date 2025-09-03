import { writable } from 'svelte/store';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, user } from '$lib/firebase';
import type { User } from 'firebase/auth';

export interface UserSettings {
    categories: string[];
    tags: string[];
}

const defaultSettings: UserSettings = {
    categories: ['Backlog', 'Completed', 'Abandoned', 'Rejected'],
    tags: []
};

const createUserSettingsStore = () => {
    const { subscribe, set } = writable<UserSettings>(defaultSettings);

    let unsubscribeFromFirestore: () => void;

    user.subscribe((currentUser: User | null | undefined) => {
        // Unsubscribe from previous listener if it exists
        if (unsubscribeFromFirestore) {
            unsubscribeFromFirestore();
        }

        if (currentUser) {
            const userSettingsRef = doc(db, 'user_settings', currentUser.uid);
            unsubscribeFromFirestore = onSnapshot(userSettingsRef, (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    set({
                        categories: data.categories && data.categories.length > 0 ? data.categories : defaultSettings.categories,
                        tags: data.tags || []
                    });
                } else {
                    set(defaultSettings);
                }
            }, (error) => {
                console.error("Error fetching user settings:", error);
                set(defaultSettings);
            });
        } else {
            // User is logged out or not yet loaded
            set(defaultSettings);
        }
    });

    return {
        subscribe,
    };
};

export const userSettings = createUserSettingsStore();
