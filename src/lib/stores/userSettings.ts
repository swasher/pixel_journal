import { writable } from 'svelte/store';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db, user } from '$lib/firebase';
import type { User } from 'firebase/auth';

export interface UserSettings {
    categories: string[];
    tags: string[];
}

const defaultSettings: UserSettings = {
    categories: ['Backlog', 'Completed', 'Abandoned', 'Rejected'],
    tags: ['Шедевр', 'Надо перепройти']
};

const createUserSettingsStore = () => {
    const { subscribe, set } = writable<UserSettings>(defaultSettings);

    let unsubscribeFromFirestore: () => void;

    user.subscribe((currentUser: User | null | undefined) => {
        if (unsubscribeFromFirestore) {
            unsubscribeFromFirestore();
        }

        if (currentUser) {
            const userSettingsRef = doc(db, 'user_settings', currentUser.uid);

            // One-time check to create settings if they don't exist.
            getDoc(userSettingsRef).then(docSnap => {
                if (!docSnap.exists()) {
                    console.log(`First login for user ${currentUser.uid}. Creating default settings...`);
                    setDoc(userSettingsRef, defaultSettings).catch(error => {
                        console.error("Failed to create default settings:", error);
                    });
                }
            }).catch(error => {
                console.error("Error checking for user settings:", error);
            });

            // Realtime listener for updates.
            unsubscribeFromFirestore = onSnapshot(userSettingsRef, (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    set({
                        categories: data.categories && data.categories.length > 0 ? data.categories : defaultSettings.categories,
                        tags: data.tags || []
                    });
                } else {
                    // User's settings document has been deleted. Reset to default in the UI.
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
