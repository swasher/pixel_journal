import { writable } from 'svelte/store';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db, user } from '$lib/firebase';
import type { User } from 'firebase/auth';
import type { DataSource } from "$lib/data_sources";

export interface UserSettings {
    isReady: boolean; // Flag to indicate if settings have been loaded from Firestore
    categories: string[];
    tags: string[];
    dataSource: DataSource;
    rawgApiKey: string;
    igdbClientId: string;
    igdbClientSecret: string;
    igdbAccessToken: string;
}

const defaultSettings: UserSettings = {
    isReady: false,
    categories: ['Backlog', 'Completed', 'Abandoned', 'Rejected'],
    tags: ['Шедевр', 'Надо перепройти'],
    dataSource: 'rawg',
    rawgApiKey: '',
    igdbClientId: '',
    igdbClientSecret: '',
    igdbAccessToken: ''
};

const createUserSettingsStore = () => {
    const { subscribe, set } = writable<UserSettings>(defaultSettings);

    let unsubscribeFromFirestore: () => void;

    user.subscribe((currentUser: User | null | undefined) => {
        if (unsubscribeFromFirestore) {
            unsubscribeFromFirestore();
        }

        if (currentUser) {
            const userSettingsRef = doc(db, 'users', currentUser.uid);

            // One-time check to create settings if they don't exist.
            getDoc(userSettingsRef).then(async (docSnap) => { // make this async
                if (!docSnap.exists()) {
                    console.log(`First login for user ${currentUser.uid}. Creating default settings and note...`);

                    // Create user settings doc
                    setDoc(userSettingsRef, defaultSettings).catch(error => {
                        console.error("Failed to create default settings:", error);
                    });

                    try {
                        // Fetch the default note content from the static file
                        const response = await fetch('/default_note.md');
                        if (!response.ok) {
                            throw new Error(`Failed to fetch default note, status: ${response.status}`);
                        }
                        const noteBody = await response.text();

                        // Create the initial "general" notes document
                        const generalNoteRef = doc(db, 'users', currentUser.uid, 'articles', 'general');
                        const defaultNote = {
                            head: 'Общая заметка',
                            body: noteBody,
                            createdAt: new Date()
                        };
                        await setDoc(generalNoteRef, defaultNote);
                        console.log("Successfully created general note from file.");

                    } catch (error) {
                        console.error("Failed to create general note from file:", error);
                        // Optional: create a fallback note if fetch fails
                    }
                }
            }).catch(error => {
                console.error("Error checking for user settings:", error);
            });

            // Realtime listener for updates.
            unsubscribeFromFirestore = onSnapshot(userSettingsRef, (docSnap) => {
                console.log('[userSettings store] Snapshot received.');
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    console.log('[userSettings store] Document data from Firestore:', data);
                    const newSettings = {
                        isReady: true,
                        categories: data.categories && data.categories.length > 0 ? data.categories : defaultSettings.categories,
                        tags: data.tags || [],
                        dataSource: data.dataSource || defaultSettings.dataSource,
                        rawgApiKey: data.rawgApiKey || defaultSettings.rawgApiKey,
                        igdbClientId: data.igdbClientId || defaultSettings.igdbClientId,
                        igdbClientSecret: data.igdbClientSecret || defaultSettings.igdbClientSecret,
                        igdbAccessToken: data.igdbAccessToken || defaultSettings.igdbAccessToken
                    };
                    console.log('[userSettings store] Setting new store value:', newSettings);
                    set(newSettings);
                } else {
                    // User's settings document has been deleted. Reset to default in the UI.
                    console.log('[userSettings store] Document does not exist. Setting ready with default settings.');
                    set({ ...defaultSettings, isReady: true }); // Ready, but with default settings
                }
            }, (error) => {
                console.error("Error fetching user settings:", error);
                set({ ...defaultSettings, isReady: true }); // Still ready, to not block the UI
            });
        } else {
            // User is logged out or not yet loaded
            set(defaultSettings); // isReady is false in defaultSettings
        }
    });

    return {
        subscribe,
    };
};

export const userSettings = createUserSettingsStore();
